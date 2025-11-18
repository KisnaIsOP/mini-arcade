/**
 * Mini Arcade Multiplayer System with Supabase Integration
 * 
 * This module handles real-time multiplayer functionality using Supabase Realtime.
 * Currently configured in demo mode with simulated players.
 * 
 * === DEMO MODE (Current Setting) ===
 * - Works immediately without any setup
 * - Simulates multiplayer with fake players
 * - Perfect for testing and demonstration
 * 
 * === PRODUCTION SETUP ===
 * To switch to real Supabase multiplayer:
 * 
 * 1. Create a free Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from API settings
 * 3. Replace the placeholder values below:
 *    this.SUPABASE_URL = 'https://your-project-id.supabase.co';
 *    this.SUPABASE_ANON_KEY = 'your-anon-key-here';
 *    this.isDemo = false; // Switch to production
 * 4. Include Supabase client in your HTML:
 *    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
 * 5. Enable Realtime in your Supabase dashboard
 * 
 * Features:
 * - Real-time player presence (join/leave events)
 * - Live score broadcasting between players
 * - Online player list with live updates
 * - Score notifications from other players
 * - Demo mode with simulated multiplayer activity
 */

class SupabaseMultiplayer {
    constructor() {
        // === CONFIGURATION ===
        // Replace these with your actual Supabase credentials for production
        this.SUPABASE_URL = 'https://your-project-id.supabase.co';
        this.SUPABASE_ANON_KEY = 'your-anon-key-here';
        
        // === DEMO MODE TOGGLE ===
        // Set to false when you have real Supabase credentials
        this.isDemo = true;
        
        // Internal properties
        this.supabase = null;
        this.channel = null;
        this.clientId = this.generateClientId();
        this.activePlayers = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
        this.demoPlayers = [];
        
        this.initConnection();
    }

    /**
     * Initialize connection (demo or real Supabase)
     */
    async initConnection() {
        if (this.isDemo) {
            console.log('🎮 DEMO MODE: Multiplayer running with simulated players');
            console.log('💡 To switch to real multiplayer, update supabase.js credentials and set isDemo = false');
            this.initDemoMode();
        } else {
            await this.initSupabaseConnection();
        }
    }

    /**
     * Initialize real Supabase connection
     */
    async initSupabaseConnection() {
        try {
            // Check if Supabase client is available
            if (typeof window.supabase === 'undefined') {
                throw new Error('Supabase client not loaded. Include: <script src="https://unpkg.com/@supabase/supabase-js@2"></script>');
            }

            // Initialize Supabase client
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            // Create a channel for real-time communication
            this.channel = this.supabase
                .channel('mini-arcade-multiplayer', {
                    config: {
                        broadcast: { self: false } // Don't receive our own messages
                    }
                })
                .on('broadcast', { event: '*' }, (payload) => {
                    this.handleBroadcastMessage(payload);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        console.log('🌐 Connected to Supabase multiplayer');
                        this.broadcastPlayerJoin();
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Supabase channel error');
                        this.fallbackToDemo();
                    }
                });

        } catch (error) {
            console.error('Failed to connect to Supabase:', error);
            this.fallbackToDemo();
        }
    }

    /**
     * Fallback to demo mode if Supabase fails
     */
    fallbackToDemo() {
        console.log('🎮 Falling back to demo mode');
        this.isDemo = true;
        this.initDemoMode();
    }

    /**
     * Initialize demo mode with local simulation
     */
    initDemoMode() {
        this.isConnected = true;
        console.log('🎮 Demo multiplayer initialized');
        
        // Add current user as a player
        const currentUser = getCurrentUser();
        if (currentUser) {
            this.addPlayer({
                user: currentUser.username,
                id: this.clientId,
                joinTime: new Date().toISOString()
            });
        }
        
        // Simulate demo players joining
        setTimeout(() => this.simulateDemoPlayers(), 1000);
    }

    /**
     * Generate a unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Broadcast that current player has joined
     */
    broadcastPlayerJoin() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const playerData = {
            user: currentUser.username,
            id: this.clientId,
            joinTime: new Date().toISOString()
        };

        this.broadcast('player_join', playerData);
        this.addPlayer(playerData);
    }

    /**
     * Broadcast that current player is leaving
     */
    broadcastPlayerLeave() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        this.broadcast('player_leave', {
            user: currentUser.username,
            id: this.clientId
        });

        this.removePlayer(this.clientId);
    }

    /**
     * Broadcast a game score
     */
    broadcastScore(game, score, additionalData = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const scoreData = {
            user: currentUser.username,
            id: this.clientId,
            game,
            score,
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        this.broadcast('score_update', scoreData);
        console.log(`🏆 Score broadcasted: ${currentUser.username} scored ${score} in ${game}`);
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
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generic broadcast method
     */
    broadcast(event, data) {
        if (this.isDemo) {
            // In demo mode, just log and simulate
            console.log(`📡 [DEMO] Broadcasting ${event}:`, data);
            
            // Simulate receiving the message after a short delay (for testing)
            if (Math.random() > 0.7) { // 30% chance to simulate network activity
                setTimeout(() => {
                    this.simulateIncomingMessage(event, data);
                }, 100 + Math.random() * 500);
            }
            return;
        }

        // Real Supabase broadcast
        if (this.channel && this.isConnected) {
            this.channel.send({
                type: 'broadcast',
                event,
                payload: data
            });
        }
    }

    /**
     * Handle incoming broadcast messages
     */
    handleBroadcastMessage(message) {
        const { event, payload } = message;
        
        // Don't process our own messages in demo mode
        if (this.isDemo && payload && payload.id === this.clientId) return;
        
        console.log(`📡 Received ${event}:`, payload);
        
        switch (event) {
            case 'player_join':
                this.handlePlayerJoin(payload);
                break;
            case 'player_leave':
                this.handlePlayerLeave(payload);
                break;
            case 'score_update':
                this.handleScoreUpdate(payload);
                break;
            case 'game_move':
                this.handleGameMove(payload);
                break;
            default:
                console.log('📡 Unknown event:', event, payload);
        }

        // Notify registered handlers
        this.notifyHandlers(event, payload);
    }

    /**
     * Handle player join events
     */
    handlePlayerJoin(data) {
        console.log(`👋 Player joined: ${data.user}`);
        this.addPlayer(data);
    }

    /**
     * Handle player leave events
     */
    handlePlayerLeave(data) {
        console.log(`👋 Player left: ${data.user}`);
        this.removePlayer(data.id);
    }

    /**
     * Handle score update events
     */
    handleScoreUpdate(data) {
        console.log(`🏆 Score from ${data.user}: ${data.score} in ${data.game}`);
        this.showScoreNotification(data);
    }

    /**
     * Handle game move events
     */
    handleGameMove(data) {
        console.log(`🎮 Move from ${data.user} in ${data.game}:`, data.moveData);
    }

    /**
     * Add player to active list
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
                    console.error('Error in message handler:', error);
                }
            });
        }
    }

    /**
     * Simulate demo players joining
     */
    simulateDemoPlayers() {
        const demoPlayerNames = [
            'AlexGamer', 'PixelMaster', 'SpeedRunner', 'ProGamer',
            'NinjaPlayer', 'GameWizard', 'ScoreHunter'
        ];

        // Randomly add 2-4 demo players
        const numPlayers = 2 + Math.floor(Math.random() * 3);
        const selectedPlayers = demoPlayerNames
            .sort(() => Math.random() - 0.5)
            .slice(0, numPlayers);

        selectedPlayers.forEach((playerName, index) => {
            setTimeout(() => {
                const playerData = {
                    user: playerName,
                    id: `demo_${playerName.toLowerCase()}`,
                    joinTime: new Date().toISOString()
                };
                
                this.handlePlayerJoin(playerData);

                // Simulate occasional scores from demo players
                setTimeout(() => {
                    this.simulateDemoScore(playerData);
                }, Math.random() * 10000 + 5000);

            }, index * 1000 + Math.random() * 2000);
        });
    }

    /**
     * Simulate scores from demo players
     */
    simulateDemoScore(playerData) {
        if (!this.activePlayers.has(playerData.id)) return;

        const games = ['reaction', 'clickspeed', 'aimtrainer', 'memory'];
        const randomGame = games[Math.floor(Math.random() * games.length)];
        
        let score;
        switch (randomGame) {
            case 'reaction':
                score = Math.floor(Math.random() * 200) + 150; // 150-350ms
                break;
            case 'clickspeed':
                score = (Math.random() * 8 + 4).toFixed(1); // 4-12 CPS
                break;
            case 'aimtrainer':
                score = Math.floor(Math.random() * 60) + 20; // 20-80 points
                break;
            case 'memory':
                score = Math.floor(Math.random() * 30) + 20; // 20-50 seconds
                break;
        }

        this.handleScoreUpdate({
            user: playerData.user,
            id: playerData.id,
            game: randomGame,
            score: score,
            timestamp: new Date().toISOString()
        });

        // Schedule next score (if still online)
        setTimeout(() => {
            this.simulateDemoScore(playerData);
        }, Math.random() * 20000 + 10000); // 10-30 seconds
    }

    /**
     * Simulate incoming messages for demo
     */
    simulateIncomingMessage(event, originalData) {
        // Don't simulate our own messages
        return;
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
        return this.isConnected;
    }

    /**
     * Get multiplayer status info
     */
    getStatus() {
        return {
            connected: this.isConnected,
            mode: this.isDemo ? 'demo' : 'production',
            playerCount: this.activePlayers.size,
            clientId: this.clientId
        };
    }

    /**
     * Disconnect from multiplayer
     */
    disconnect() {
        if (this.isConnected) {
            this.broadcastPlayerLeave();
        }

        if (this.channel && !this.isDemo) {
            this.channel.unsubscribe();
            this.channel = null;
        }

        this.isConnected = false;
        this.activePlayers.clear();
        this.updatePlayerListUI();
        console.log('👋 Disconnected from multiplayer');
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
    }
};

// Auto-initialize if in multiplayer mode and authenticated
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'multiplayer' && window.isAuthenticated && isAuthenticated()) {
        console.log('🌐 Auto-initializing multiplayer for authenticated user');
        initMultiplayer();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    disconnectMultiplayer();
});

console.log('🌐 Supabase Multiplayer System loaded successfully!');
console.log('🎮 Current mode: DEMO (change isDemo = false for production)');
console.log('💡 Type "multiplayerDebug" in console for debugging tools');