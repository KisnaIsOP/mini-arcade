/**
 * Supabase Multiplayer Integration for Mini Arcade
 * 
 * This module handles real-time multiplayer functionality using Supabase.
 * For demo purposes, it includes a fallback to local simulation if Supabase is not configured.
 * 
 * Setup Instructions:
 * 1. Create a free Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from the API settings
 * 3. Replace the placeholder values below with your actual Supabase credentials
 * 4. Enable Realtime in your Supabase dashboard for the tables you want to sync
 */

class SupabaseMultiplayer {
    constructor() {
        // Replace with your actual Supabase credentials
        // For demo purposes, these are placeholder values
        this.SUPABASE_URL = 'https://your-project.supabase.co';
        this.SUPABASE_ANON_KEY = 'your-anon-key-here';
        
        this.supabase = null;
        this.channel = null;
        this.clientId = this.generateClientId();
        this.activePlayers = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
        this.isDemo = true; // Set to false when you have real Supabase credentials
        
        this.initConnection();
    }

    /**
     * Initialize Supabase connection
     */
    async initConnection() {
        try {
            if (this.isDemo || !window.supabase) {
                console.log('🎮 Running in demo mode - multiplayer events will be simulated locally');
                this.initDemoMode();
                return;
            }

            // Initialize Supabase client
            this.supabase = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
            
            // Create a channel for real-time communication
            this.channel = this.supabase
                .channel('mini-arcade-multiplayer')
                .on('broadcast', { event: '*' }, (payload) => {
                    this.handleBroadcastMessage(payload);
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        this.isConnected = true;
                        console.log('🌐 Connected to Supabase multiplayer');
                        this.broadcastPlayerJoin();
                    }
                });

        } catch (error) {
            console.error('Failed to connect to Supabase:', error);
            console.log('🎮 Falling back to demo mode');
            this.initDemoMode();
        }
    }

    /**
     * Initialize demo mode with local simulation
     */
    initDemoMode() {
        this.isConnected = true;
        console.log('🎮 Demo mode initialized - multiplayer events will be simulated');
        
        // Simulate some demo players joining after a delay
        setTimeout(() => {
            this.simulateDemoPlayers();
        }, 2000);
    }

    /**
     * Generate a unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Broadcast that a player has joined
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
        this.activePlayers.set(this.clientId, playerData);
    }

    /**
     * Broadcast that a player is leaving
     */
    broadcastPlayerLeave() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        this.broadcast('player_leave', {
            user: currentUser.username,
            id: this.clientId
        });

        this.activePlayers.delete(this.clientId);
    }

    /**
     * Broadcast a game score
     */
    broadcastScore(game, score, additionalData = {}) {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        this.broadcast('score_update', {
            user: currentUser.username,
            id: this.clientId,
            game,
            score,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
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
            // In demo mode, just log the event
            console.log(`📡 [DEMO] Broadcasting ${event}:`, data);
            
            // Simulate receiving our own message after a short delay
            setTimeout(() => {
                this.handleBroadcastMessage({
                    event,
                    payload: data
                });
            }, 100);
            
            return;
        }

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
        
        // Don't process our own messages
        if (payload && payload.id === this.clientId) return;
        
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
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(handler => {
                try {
                    handler(payload);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });
        }
    }

    /**
     * Handle player join events
     */
    handlePlayerJoin(data) {
        console.log(`👋 Player joined: ${data.user}`);
        this.activePlayers.set(data.id, data);
        this.updatePlayerList();
    }

    /**
     * Handle player leave events
     */
    handlePlayerLeave(data) {
        console.log(`👋 Player left: ${data.user}`);
        this.activePlayers.delete(data.id);
        this.updatePlayerList();
    }

    /**
     * Handle score update events
     */
    handleScoreUpdate(data) {
        console.log(`🏆 Score update from ${data.user}: ${data.score} in ${data.game}`);
    }

    /**
     * Handle game move events
     */
    handleGameMove(data) {
        console.log(`🎮 Move from ${data.user} in ${data.game}:`, data.moveData);
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
     * Update the player list UI
     */
    updatePlayerList() {
        const playerListElement = document.getElementById('playerList');
        if (!playerListElement) return;

        const players = Array.from(this.activePlayers.values());
        
        if (players.length === 0) {
            playerListElement.innerHTML = '<div class="text-gray-400 text-sm">No other players online</div>';
            return;
        }

        playerListElement.innerHTML = players.map(player => `
            <div class="flex items-center space-x-2 text-sm">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-white">${player.user}</span>
            </div>
        `).join('');
    }

    /**
     * Simulate demo players for demonstration
     */
    simulateDemoPlayers() {
        const demoPlayers = [
            { username: 'AlexGamer', id: 'demo_alex' },
            { username: 'PixelMaster', id: 'demo_pixel' },
            { username: 'SpeedRunner', id: 'demo_speed' }
        ];

        demoPlayers.forEach((player, index) => {
            setTimeout(() => {
                this.handlePlayerJoin({
                    user: player.username,
                    id: player.id,
                    joinTime: new Date().toISOString()
                });

                // Simulate some demo scores
                setTimeout(() => {
                    this.handleScoreUpdate({
                        user: player.username,
                        id: player.id,
                        game: 'reaction',
                        score: Math.floor(Math.random() * 200) + 150,
                        timestamp: new Date().toISOString()
                    });
                }, Math.random() * 5000 + 1000);

            }, index * 1000);
        });
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
     * Disconnect from multiplayer
     */
    disconnect() {
        if (this.channel) {
            this.broadcastPlayerLeave();
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.isConnected = false;
        this.activePlayers.clear();
        console.log('👋 Disconnected from multiplayer');
    }
}

// Create global instance
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

// Auto-initialize if in multiplayer mode
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'multiplayer' && isAuthenticated && isAuthenticated()) {
        initMultiplayer();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    disconnectMultiplayer();
});

console.log('🌐 Supabase multiplayer system loaded. Use initMultiplayer() to connect.');