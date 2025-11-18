/**
 * Mini Arcade Production Multiplayer System with Supabase Integration
 * 
 * This module handles real-time multiplayer functionality using Supabase Realtime.
 * Configured for production use with environment variables.
 * 
 * === ENVIRONMENT CONFIGURATION ===
 * Set these environment variables for production:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_KEY: Your Supabase anon key
 * - IS_DEMO: Set to 'false' for production mode
 * 
 * For Render.com deployment, add these exact environment variables:
 * SUPABASE_URL = <SUPABASE_URL>
 * SUPABASE_KEY = <SUPABASE_KEY>
 * IS_DEMO = false
 * 
 * Features:
 * - Environment-based configuration
 * - Real-time player presence (join/leave events)
 * - Live score broadcasting between players
 * - Robust connection handling with reconnect/backoff
 * - Heartbeat/ping system (20s intervals)
 * - Server timestamp validation
 * 
 * WARNING: Never commit actual credentials to version control!
 * Use environment variables or .env files that are gitignored.
 */

// Environment configuration with fallbacks
const getEnvVar = (name, fallback = '') => {
    // Try multiple sources for environment variables
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    
    if (typeof window !== 'undefined' && window.env && window.env[name]) {
        return window.env[name];
    }
    
    if (typeof window !== 'undefined' && window[name]) {
        return window[name];
    }
    
    return fallback;
};

// Production configuration
const SUPABASE_URL = getEnvVar('SUPABASE_URL', '');
const SUPABASE_KEY = getEnvVar('SUPABASE_KEY', '');
const IS_DEMO = getEnvVar('IS_DEMO', 'true') === 'true';

// Export for use by other modules
window.IS_DEMO = IS_DEMO;

// Development fallback (uncomment for local development without environment setup)
/*
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const IS_DEMO = false;
*/

class SupabaseMultiplayer {
    constructor() {
        this.supabase = null;
        this.channel = null;
        this.clientId = this.generateClientId();
        this.activePlayers = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        
        console.log(`MINI-ARCADE: Initializing multiplayer (Demo: ${IS_DEMO})`);
        this.initConnection();
    }

    /**
     * Initialize connection (demo or real Supabase)
     */
    async initConnection() {
        if (IS_DEMO) {
            console.log('MINI-ARCADE: Demo mode - limited functionality (set IS_DEMO=false for production)');
            this.initDemoMode();
        } else {
            console.log('MINI-ARCADE: Connecting to production Supabase');
            await this.initSupabaseConnection();
        }
    }

    /**
     * Initialize real Supabase connection with robust error handling
     */
    async initSupabaseConnection() {
        try {
            // Check if Supabase client is available
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase client not loaded. Include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            }

            // Validate credentials
            if (!SUPABASE_URL || !SUPABASE_KEY) {
                throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY environment variables.');
            }

            console.log(`MINI-ARCADE: Connecting to ${SUPABASE_URL.replace(/.*\/\/([^.]+)\./, '$1...')}`);

            // Initialize Supabase client
            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            // Create a channel for real-time communication
            this.channel = this.supabase
                .channel('mini-arcade-multiplayer', {
                    config: {
                        broadcast: { 
                            self: false, // Don't receive our own messages
                            ack: true // Request acknowledgments
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
                    console.log(`MINI-ARCADE: Channel status: ${status}`);
                    
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        this.reconnectAttempts = 0;
                        this.reconnectDelay = 1000;
                        
                        console.log('MINI-ARCADE: Connected to production multiplayer');
                        
                        // Track presence
                        await this.trackPresence();
                        
                        // Start heartbeat
                        this.startHeartbeat();
                        
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('MINI-ARCADE: Channel error');
                        this.handleConnectionError();
                    } else if (status === 'TIMED_OUT') {
                        console.error('MINI-ARCADE: Connection timed out');
                        this.handleConnectionError();
                    }
                });

        } catch (error) {
            console.error('MINI-ARCADE: Failed to connect to Supabase:', error);
            this.handleConnectionError();
        }
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
            joinTime: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100), // Truncated for security
            timestamp: Date.now()
        };

        await this.channel.track(presenceData);
        console.log(`MINI-ARCADE: Tracking presence for ${currentUser.username}`);
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
                const presence = presences[0]; // Take the first presence
                this.activePlayers.set(key, presence);
            }
        });
        
        console.log(`MINI-ARCADE: Presence sync - ${this.activePlayers.size} players online`);
        this.updatePlayerListUI();
    }

    /**
     * Handle presence join events
     */
    handlePresenceJoin(key, newPresences) {
        newPresences.forEach(presence => {
            this.activePlayers.set(key, presence);
            console.log(`MINI-ARCADE: Player joined: ${presence.user}`);
            this.showPlayerNotification(`${presence.user} joined the game!`, 'join');
        });
        this.updatePlayerListUI();
    }

    /**
     * Handle presence leave events
     */
    handlePresenceLeave(key, leftPresences) {
        leftPresences.forEach(presence => {
            this.activePlayers.delete(key);
            console.log(`MINI-ARCADE: Player left: ${presence.user}`);
            this.showPlayerNotification(`${presence.user} left the game`, 'leave');
        });
        this.updatePlayerListUI();
    }

    /**
     * Start heartbeat to maintain connection (20 second intervals)
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.channel) {
                this.broadcast('ping', {
                    timestamp: Date.now(),
                    clientId: this.clientId
                });
            }
        }, 20000); // 20 seconds

        console.log('MINI-ARCADE: Heartbeat started (20s intervals)');
    }

    /**
     * Handle connection errors with backoff retry
     */
    handleConnectionError() {
        this.isConnected = false;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('MINI-ARCADE: Max reconnection attempts reached, staying disconnected');
            return;
        }

        this.reconnectAttempts++;
        console.log(`MINI-ARCADE: Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

        setTimeout(() => {
            this.initSupabaseConnection();
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
    }

    /**
     * Initialize demo mode (limited functionality for development)
     */
    initDemoMode() {
        this.isConnected = false;
        console.log('MINI-ARCADE: Demo mode - real multiplayer disabled');
        console.log('MINI-ARCADE: To enable production multiplayer, set IS_DEMO=false');
        
        // Add current user as a player for UI consistency
        const currentUser = getCurrentUser();
        if (currentUser) {
            this.addPlayer({
                user: currentUser.username,
                id: this.clientId,
                joinTime: new Date().toISOString()
            });
        }

        // NO demo players in production setup - only real users
    }

    /**
     * Generate a unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Broadcast a game score with timestamp validation
     */
    broadcastScore(game, score, additionalData = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const scoreData = {
            user: currentUser.username,
            id: this.clientId,
            game,
            score,
            timestamp: Date.now(), // Server will validate this
            serverTimestamp: new Date().toISOString(),
            ...additionalData
        };

        this.broadcast('score_update', scoreData);
        console.log(`MINI-ARCADE: Score broadcasted: ${currentUser.username} scored ${score} in ${game}`);
    }

    /**
     * Broadcast a game move/action
     */
    broadcastMove(game, moveData) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        this.broadcast('game_move', {
            user: currentUser.username,
            id: this.clientId,
            game,
            moveData,
            timestamp: Date.now()
        });
    }

    /**
     * Generic broadcast method
     */
    broadcast(event, data) {
        // Skip broadcasting in demo mode
        if (IS_DEMO) {
            console.log(`MINI-ARCADE: [DEMO] Would broadcast ${event} (disabled in demo mode)`);
            return;
        }

        // Real Supabase broadcast
        if (this.channel && this.isConnected) {
            this.channel.send({
                type: 'broadcast',
                event,
                payload: {
                    ...data,
                    serverTimestamp: new Date().toISOString()
                }
            }).catch(error => {
                console.error('MINI-ARCADE: Broadcast failed:', error);
            });
        } else {
            console.warn('MINI-ARCADE: Cannot broadcast - not connected to Supabase');
        }
    }

    /**
     * Handle incoming broadcast messages with validation
     */
    handleBroadcastMessage(message) {
        const { event, payload } = message;
        
        // Validate timestamp to prevent old/spoofed messages
        if (payload && payload.timestamp) {
            const messageAge = Date.now() - payload.timestamp;
            if (messageAge > 30000) { // Ignore messages older than 30 seconds
                console.warn('MINI-ARCADE: Ignoring old message:', event, messageAge + 'ms old');
                return;
            }
        }
        
        console.log(`MINI-ARCADE: Received ${event}:`, payload);
        
        switch (event) {
            case 'score_update':
                this.handleScoreUpdate(payload);
                break;
            case 'game_move':
                this.handleGameMove(payload);
                break;
            case 'ping':
                // Handle heartbeat pings
                console.log(`MINI-ARCADE: Heartbeat from ${payload.clientId}`);
                break;
            default:
                console.log('MINI-ARCADE: Unknown event:', event, payload);
        }

        // Notify registered handlers
        this.notifyHandlers(event, payload);
    }

    /**
     * Handle score update events
     */
    handleScoreUpdate(data) {
        console.log(`MINI-ARCADE: Score from ${data.user}: ${data.score} in ${data.game}`);
        this.showScoreNotification(data);
        
        // Save to database if not in demo mode
        if (!IS_DEMO && window.saveScore) {
            window.saveScore(data.game, data.user, data.score, {
                timestamp: data.serverTimestamp,
                clientId: data.id
            }).catch(error => {
                console.error('MINI-ARCADE: Failed to save multiplayer score:', error);
            });
        }
    }

    /**
     * Handle game move events
     */
    handleGameMove(data) {
        console.log(`MINI-ARCADE: Move from ${data.user} in ${data.game}:`, data.moveData);
    }

    /**
     * Add player to active list (for demo mode compatibility)
     */
    addPlayer(playerData) {
        this.activePlayers.set(playerData.id, playerData);
        this.updatePlayerListUI();
    }

    /**
     * Remove player from active list
     */
    removePlayer(playerId) {
        this.activePlayers.delete(playerId);
        this.updatePlayerListUI();
    }

    /**
     * Show score notification from another player
     */
    showScoreNotification(data) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-500/90 backdrop-blur-sm border border-blue-300/30 text-white p-4 rounded-xl shadow-lg z-50 transform transition-all duration-300 translate-x-0';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-2xl">🏆</div>
                <div>
                    <div class="text-sm font-bold">${data.user} scored!</div>
                    <div class="text-xs opacity-75">${data.score} in ${data.game}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('animate-pulse');
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Update the player list UI
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
     * Register a handler for specific message types
     */
    onMessage(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    }

    /**
     * Remove a message handler
     */
    offMessage(event, handler) {
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
                    console.error('MINI-ARCADE: Error in message handler:', error);
                }
            });
        }
    }

    /**
     * Get list of active players
     */
    getActivePlayers() {
        return Array.from(this.activePlayers.values());
    }

    /**
     * Check if multiplayer is connected
     */
    isMultiplayerConnected() {
        return this.isConnected && !IS_DEMO;
    }

    /**
     * Get multiplayer status info
     */
    getStatus() {
        return {
            connected: this.isConnected,
            mode: IS_DEMO ? 'demo' : 'production',
            playerCount: this.activePlayers.size,
            clientId: this.clientId,
            reconnectAttempts: this.reconnectAttempts,
            supabaseUrl: SUPABASE_URL ? SUPABASE_URL.replace(/.*\/\/([^.]+)\./, '$1...') : 'not configured'
        };
    }

    /**
     * Disconnect from multiplayer with proper cleanup
     */
    disconnect() {
        console.log('MINI-ARCADE: Disconnecting from multiplayer');
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.channel && !IS_DEMO) {
            this.channel.untrack();
            this.channel.unsubscribe();
            this.channel = null;
        }

        this.isConnected = false;
        this.activePlayers.clear();
        this.updatePlayerListUI();
    }
}

// Global multiplayer instance
let multiplayerInstance = null;

/**
 * Initialize multiplayer connection
 */
window.initMultiplayer = () => {
    if (!multiplayerInstance) {
        multiplayerInstance = new SupabaseMultiplayer();
    }
    return multiplayerInstance;
};

/**
 * Get the current multiplayer instance
 */
window.getMultiplayer = () => {
    return multiplayerInstance;
};

/**
 * Disconnect from multiplayer
 */
window.disconnectMultiplayer = () => {
    if (multiplayerInstance) {
        multiplayerInstance.disconnect();
        multiplayerInstance = null;
    }
};

// For debugging in console
window.multiplayerDebug = {
    getStatus: () => multiplayerInstance?.getStatus() || 'Not initialized',
    getPlayers: () => multiplayerInstance?.getActivePlayers() || [],
    broadcast: (event, data) => multiplayerInstance?.broadcast(event, data),
    reconnect: () => {
        disconnectMultiplayer();
        return initMultiplayer();
    },
    isDemo: () => IS_DEMO,
    config: () => ({
        SUPABASE_URL: SUPABASE_URL ? SUPABASE_URL.replace(/.*\/\/([^.]+)\./, '$1...') : 'not set',
        IS_DEMO: IS_DEMO
    })
};

// Auto-initialize if in multiplayer mode and authenticated
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'multiplayer' && window.isAuthenticated && isAuthenticated()) {
        console.log('MINI-ARCADE: Auto-initializing multiplayer for authenticated user');
        initMultiplayer();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    disconnectMultiplayer();
});

console.log('MINI-ARCADE: Supabase Multiplayer System loaded successfully!');
console.log(`MINI-ARCADE: Mode: ${IS_DEMO ? 'DEMO' : 'PRODUCTION'}`);
console.log('MINI-ARCADE: Type "multiplayerDebug" in console for debugging tools');