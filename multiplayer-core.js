/**
 * Mini Arcade - Shared Multiplayer Core Engine
 * 
 * Provides unified multiplayer functionality across all games using Supabase Realtime.
 * Handles connection management, broadcasting, and UI updates.
 * 
 * Features:
 * - Connect/disconnect management with heartbeat
 * - Room-based channels per game
 * - Player presence tracking
 * - Score and progress broadcasting
 * - Standardized UI components
 * - Reconnection with exponential backoff
 * 
 * Usage:
 * const multiplayer = new MultiplayerCore('reaction');
 * multiplayer.connect();
 * multiplayer.broadcastScore(250);
 */

class MultiplayerCore {
    constructor(gameName) {
        this.gameName = gameName;
        this.channelName = `mini-arcade:${gameName}`;
        this.supabase = null;
        this.channel = null;
        this.clientId = this.generateClientId();
        this.activePlayers = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.connectionCallbacks = { onConnect: null, onDisconnect: null };
        
        // Check if in multiplayer mode
        const urlParams = new URLSearchParams(window.location.search);
        this.isMultiplayerMode = urlParams.get('mode') === 'multiplayer';
        
        console.log(`MULTIPLAYER-CORE: Initialized for ${gameName} (Channel: ${this.channelName})`);
    }

    /**
     * Connect to multiplayer if in multiplayer mode and authenticated
     */
    async connect() {
        if (!this.isMultiplayerMode) {
            console.log('MULTIPLAYER-CORE: Not in multiplayer mode, skipping connection');
            return false;
        }

        if (!isAuthenticated()) {
            console.log('MULTIPLAYER-CORE: Not authenticated, redirecting to auth page');
            window.location.href = 'auth.html?return=' + encodeURIComponent(window.location.href);
            return false;
        }

        if (window.IS_DEMO) {
            console.log('MULTIPLAYER-CORE: Demo mode - limited multiplayer functionality');
            this.initDemoMode();
            return true;
        }

        try {
            await this.initSupabaseConnection();
            return true;
        } catch (error) {
            console.error('MULTIPLAYER-CORE: Failed to connect:', error);
            this.handleConnectionError();
            return false;
        }
    }

    /**
     * Initialize Supabase connection for real multiplayer
     */
    async initSupabaseConnection() {
        // Check if Supabase client is available
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase client not loaded');
        }

        const SUPABASE_URL = window.SUPABASE_URL || 'https://wmrcrrfhyaqmyftxksty.supabase.co';
        const SUPABASE_KEY = window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcmNycmZoeWFxbXlmdHhrc3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODk1NzksImV4cCI6MjA3OTA2NTU3OX0.yKjmGSIMTZSQVh8LDT1kDGOIuJEmmOI7nqxSgLJcIXM';

        console.log(`MULTIPLAYER-CORE: Connecting to ${this.channelName}`);

        // Initialize Supabase client
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Create game-specific channel
        this.channel = this.supabase
            .channel(this.channelName, {
                config: {
                    broadcast: { 
                        self: false,
                        ack: true
                    },
                    presence: {
                        key: this.clientId
                    }
                }
            })
            .on('broadcast', { event: '*' }, (payload) => {
                this.handleBroadcastMessage(payload);
            })
            .on('presence', { event: 'sync' }, () => {
                this.handlePresenceSync();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                this.handlePresenceJoin(key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                this.handlePresenceLeave(key, leftPresences);
            })
            .subscribe(async (status) => {
                console.log(`MULTIPLAYER-CORE: Channel status: ${status}`);
                
                if (status === 'SUBSCRIBED') {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;
                    
                    console.log(`MULTIPLAYER-CORE: Connected to ${this.channelName}`);
                    
                    // Track presence and start heartbeat
                    await this.trackPresence();
                    this.startHeartbeat();
                    this.updateConnectionUI(true);
                    
                    // Broadcast player join
                    this.broadcast('player_join', {
                        user: getCurrentUser().username,
                        timestamp: Date.now()
                    });
                    
                    if (this.connectionCallbacks.onConnect) {
                        this.connectionCallbacks.onConnect();
                    }
                    
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    this.handleConnectionError();
                }
            });
    }

    /**
     * Track user presence in the channel
     */
    async trackPresence() {
        const currentUser = getCurrentUser();
        if (!currentUser || !this.channel) return;

        const presenceData = {
            user: currentUser.username,
            id: this.clientId,
            game: this.gameName,
            joinTime: new Date().toISOString(),
            timestamp: Date.now()
        };

        await this.channel.track(presenceData);
        console.log(`MULTIPLAYER-CORE: Tracking presence for ${currentUser.username} in ${this.gameName}`);
    }

    /**
     * Handle presence sync events
     */
    handlePresenceSync() {
        if (!this.channel) return;
        
        const presenceState = this.channel.presenceState();
        this.activePlayers.clear();
        
        Object.keys(presenceState).forEach(key => {
            const presences = presenceState[key];
            if (presences && presences.length > 0) {
                const presence = presences[0];
                this.activePlayers.set(key, presence);
            }
        });
        
        console.log(`MULTIPLAYER-CORE: Presence sync - ${this.activePlayers.size} players in ${this.gameName}`);
        this.updatePlayerListUI();
    }

    /**
     * Handle presence join events
     */
    handlePresenceJoin(key, newPresences) {
        newPresences.forEach(presence => {
            this.activePlayers.set(key, presence);
            console.log(`MULTIPLAYER-CORE: ${presence.user} joined ${this.gameName}`);
            this.showPlayerNotification(`${presence.user} joined the game!`, 'join');
            
            // Notify handlers
            this.notifyHandlers('player_join', presence);
        });
        this.updatePlayerListUI();
    }

    /**
     * Handle presence leave events
     */
    handlePresenceLeave(key, leftPresences) {
        leftPresences.forEach(presence => {
            this.activePlayers.delete(key);
            console.log(`MULTIPLAYER-CORE: ${presence.user} left ${this.gameName}`);
            this.showPlayerNotification(`${presence.user} left the game`, 'leave');
            
            // Notify handlers
            this.notifyHandlers('player_leave', presence);
        });
        this.updatePlayerListUI();
    }

    /**
     * Start heartbeat to maintain connection
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.channel) {
                this.broadcast('heartbeat', {
                    timestamp: Date.now(),
                    clientId: this.clientId
                });
            }
        }, 20000);
    }

    /**
     * Handle connection errors with exponential backoff
     */
    handleConnectionError() {
        this.isConnected = false;
        this.updateConnectionUI(false);
        
        if (this.connectionCallbacks.onDisconnect) {
            this.connectionCallbacks.onDisconnect();
        }
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('MULTIPLAYER-CORE: Max reconnection attempts reached');
            this.showPersistentError('Connection failed - multiplayer disabled');
            return;
        }

        this.reconnectAttempts++;
        console.log(`MULTIPLAYER-CORE: Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

        setTimeout(() => {
            this.initSupabaseConnection();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }

    /**
     * Initialize demo mode with limited functionality
     */
    initDemoMode() {
        this.isConnected = false;
        console.log('MULTIPLAYER-CORE: Demo mode active - real multiplayer disabled');
        
        // Add current user as a player for UI consistency
        const currentUser = getCurrentUser();
        if (currentUser) {
            this.activePlayers.set(this.clientId, {
                user: currentUser.username,
                id: this.clientId,
                game: this.gameName,
                joinTime: new Date().toISOString()
            });
            this.updatePlayerListUI();
        }

        this.updateConnectionUI(false, 'Demo Mode');
    }

    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Broadcast game score
     */
    broadcastScore(score, additionalData = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const scoreData = {
            user: currentUser.username,
            id: this.clientId,
            game: this.gameName,
            score,
            timestamp: Date.now(),
            serverTimestamp: new Date().toISOString(),
            ...additionalData
        };

        this.broadcast('score_update', scoreData);
        console.log(`MULTIPLAYER-CORE: Score broadcast - ${currentUser.username}: ${score} in ${this.gameName}`);
    }

    /**
     * Broadcast game progress (for Aim Trainer & Memory)
     */
    broadcastProgress(progressData) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const data = {
            user: currentUser.username,
            id: this.clientId,
            game: this.gameName,
            progress: progressData,
            timestamp: Date.now()
        };

        this.broadcast('progress_update', data);
        console.log(`MULTIPLAYER-CORE: Progress broadcast - ${currentUser.username} in ${this.gameName}:`, progressData);
    }

    /**
     * Generic broadcast method
     */
    broadcast(event, data) {
        if (window.IS_DEMO) {
            console.log(`MULTIPLAYER-CORE: [DEMO] Would broadcast ${event}`);
            return;
        }

        if (this.channel && this.isConnected) {
            this.channel.send({
                type: 'broadcast',
                event,
                payload: {
                    ...data,
                    broadcastTimestamp: new Date().toISOString()
                }
            }).catch(error => {
                console.error('MULTIPLAYER-CORE: Broadcast failed:', error);
            });
        } else {
            console.warn('MULTIPLAYER-CORE: Cannot broadcast - not connected');
        }
    }

    /**
     * Handle incoming broadcast messages
     */
    handleBroadcastMessage(message) {
        const { event, payload } = message;
        
        // Validate timestamp
        if (payload && payload.timestamp) {
            const messageAge = Date.now() - payload.timestamp;
            if (messageAge > 30000) {
                console.warn('MULTIPLAYER-CORE: Ignoring old message:', event, `${messageAge}ms old`);
                return;
            }
        }
        
        console.log(`MULTIPLAYER-CORE: Received ${event}:`, payload);
        
        switch (event) {
            case 'score_update':
                this.handleScoreUpdate(payload);
                break;
            case 'progress_update':
                this.handleProgressUpdate(payload);
                break;
            case 'player_join':
                // Handled by presence system
                break;
            case 'player_leave':
                // Handled by presence system
                break;
            case 'heartbeat':
                // Heartbeat received
                break;
            default:
                console.log('MULTIPLAYER-CORE: Unknown event:', event, payload);
        }

        // Notify registered handlers
        this.notifyHandlers(event, payload);
    }

    /**
     * Handle score update events
     */
    handleScoreUpdate(data) {
        console.log(`MULTIPLAYER-CORE: Score from ${data.user}: ${data.score} in ${data.game}`);
        this.showScoreNotification(data);
        
        // Update live scores if element exists
        this.updateLiveScores(data);
    }

    /**
     * Handle progress update events
     */
    handleProgressUpdate(data) {
        console.log(`MULTIPLAYER-CORE: Progress from ${data.user}:`, data.progress);
        this.showProgressNotification(data);
    }

    /**
     * Show score notification
     */
    showScoreNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500/90 backdrop-blur-sm border border-blue-300/30 text-white p-4 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-x-0';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-2xl">🏆</div>
                <div>
                    <div class="text-sm font-bold">${data.user} scored!</div>
                    <div class="text-xs opacity-75">${this.formatScore(data.score, data.game)}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        this.removeNotificationAfterDelay(notification, 4000);
    }

    /**
     * Show progress notification
     */
    showProgressNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-purple-500/90 backdrop-blur-sm border border-purple-300/30 text-white p-3 rounded-xl shadow-lg z-50 transform transition-all duration-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="text-lg">📊</div>
                <div class="text-sm">${data.user}: ${this.formatProgress(data.progress, data.game)}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        this.removeNotificationAfterDelay(notification, 3000);
    }

    /**
     * Show player notification
     */
    showPlayerNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'join' ? 'bg-green-500/90' : 'bg-orange-500/90';
        const icon = type === 'join' ? '👋' : '🚪';
        
        notification.className = `fixed top-4 left-4 ${bgColor} backdrop-blur-sm border border-white/30 text-white p-3 rounded-xl shadow-lg z-50 transform transition-all duration-300`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-lg">${icon}</span>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        this.removeNotificationAfterDelay(notification, 3000);
    }

    /**
     * Remove notification after delay
     */
    removeNotificationAfterDelay(notification, delay) {
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, delay);
    }

    /**
     * Format score based on game type
     */
    formatScore(score, game) {
        switch (game) {
            case 'reaction':
                return `${score}ms`;
            case 'clickspeed':
                return `${score} CPS`;
            case 'aimtrainer':
                return `${score} points`;
            case 'memory':
                const minutes = Math.floor(score / 60);
                const seconds = score % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            default:
                return score.toString();
        }
    }

    /**
     * Format progress based on game type
     */
    formatProgress(progress, game) {
        switch (game) {
            case 'aimtrainer':
                return `${progress.hits || 0} hits, ${progress.accuracy || 0}% accuracy`;
            case 'memory':
                return `${progress.matches || 0} pairs matched`;
            default:
                return JSON.stringify(progress);
        }
    }

    /**
     * Update player list UI
     */
    updatePlayerListUI() {
        const playerListElement = document.getElementById('playerList');
        if (!playerListElement) return;

        const players = Array.from(this.activePlayers.values());
        
        if (players.length === 0) {
            playerListElement.innerHTML = '<div class="text-gray-400 text-sm">No players online</div>';
            return;
        }

        playerListElement.innerHTML = players.map(player => `
            <div class="flex items-center justify-between text-sm py-1">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-white">${player.user}</span>
                </div>
                <div class="text-xs text-gray-400">
                    ${player.id === this.clientId ? '(You)' : 'Online'}
                </div>
            </div>
        `).join('');
    }

    /**
     * Update connection status UI
     */
    updateConnectionUI(connected, customStatus = null) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        if (customStatus) {
            statusElement.className = 'w-2 h-2 bg-yellow-500 rounded-full';
            statusElement.title = customStatus;
        } else if (connected) {
            statusElement.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse';
            statusElement.title = 'Connected';
        } else {
            statusElement.className = 'w-2 h-2 bg-red-500 rounded-full';
            statusElement.title = 'Disconnected';
        }
    }

    /**
     * Update live scores panel
     */
    updateLiveScores(scoreData) {
        const liveScoresElement = document.getElementById('liveScores');
        if (!liveScoresElement) return;

        // Create or update live scores list
        const scoreEntry = document.createElement('div');
        scoreEntry.className = 'flex justify-between items-center text-sm py-1 animate-pulse';
        scoreEntry.innerHTML = `
            <span class="text-white">${scoreData.user}</span>
            <span class="text-yellow-400 font-mono">${this.formatScore(scoreData.score, scoreData.game)}</span>
        `;

        // Add to top of list
        liveScoresElement.insertBefore(scoreEntry, liveScoresElement.firstChild);

        // Keep only last 5 scores
        while (liveScoresElement.children.length > 5) {
            liveScoresElement.removeChild(liveScoresElement.lastChild);
        }

        // Remove pulse animation after 2 seconds
        setTimeout(() => {
            scoreEntry.classList.remove('animate-pulse');
        }, 2000);
    }

    /**
     * Show persistent error message
     */
    showPersistentError(message) {
        const errorElement = document.createElement('div');
        errorElement.id = 'persistentError';
        errorElement.className = 'fixed bottom-4 left-4 bg-red-500/90 backdrop-blur-sm border border-red-300/30 text-white p-3 rounded-xl shadow-lg z-50';
        errorElement.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-lg">⚠️</span>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        // Remove any existing error
        const existing = document.getElementById('persistentError');
        if (existing) existing.remove();
        
        document.body.appendChild(errorElement);
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }

    /**
     * Remove event handler
     */
    off(event, handler) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Notify registered handlers
     */
    notifyHandlers(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('MULTIPLAYER-CORE: Error in event handler:', error);
                }
            });
        }
    }

    /**
     * Set connection callbacks
     */
    onConnect(callback) {
        this.connectionCallbacks.onConnect = callback;
    }

    onDisconnect(callback) {
        this.connectionCallbacks.onDisconnect = callback;
    }

    /**
     * Get connection status
     */
    isMultiplayerConnected() {
        return this.isConnected && !window.IS_DEMO;
    }

    /**
     * Get active players
     */
    getActivePlayers() {
        return Array.from(this.activePlayers.values());
    }

    /**
     * Get multiplayer status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            mode: window.IS_DEMO ? 'demo' : 'production',
            playerCount: this.activePlayers.size,
            clientId: this.clientId,
            gameName: this.gameName,
            channelName: this.channelName,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Disconnect from multiplayer
     */
    disconnect() {
        console.log(`MULTIPLAYER-CORE: Disconnecting from ${this.gameName}`);
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.channel && !window.IS_DEMO) {
            // Broadcast player leave before disconnecting
            this.broadcast('player_leave', {
                user: getCurrentUser()?.username,
                timestamp: Date.now()
            });
            
            this.channel.untrack();
            this.channel.unsubscribe();
            this.channel = null;
        }

        this.isConnected = false;
        this.activePlayers.clear();
        this.updatePlayerListUI();
        this.updateConnectionUI(false);
    }
}

// Export for use by games
window.MultiplayerCore = MultiplayerCore;

console.log('MULTIPLAYER-CORE: Shared multiplayer engine loaded successfully!');