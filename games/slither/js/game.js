// Main Game Controller - Real Multiplayer Version
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { SERVER_URL } from './config.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.gameState = 'menu'; // menu, playing, dead, reconnecting
        this.playerId = null;
        this.players = [];
        this.food = [];
        this.leaderboard = [];
        this.score = 0;
        
        // Game world
        this.worldSize = 5000;
        this.camera = { x: 0, y: 0 };
        
        // Components
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.inputHandler = new InputHandler(this);
        
        // UI Elements
        this.menu = document.getElementById('menu');
        this.hud = document.getElementById('hud');
        this.deathScreen = document.getElementById('death-screen');
        this.playBtn = document.getElementById('play-btn');
        this.respawnBtn = document.getElementById('respawn-btn');
        this.nicknameInput = document.getElementById('nickname');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('final-score');
        this.leaderboardList = document.getElementById('leaderboard-list');
        
        // Networking
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000; // 30 seconds
        this.reconnecting = false;
        
        this.setupEventListeners();
        this.connectToServer();
        
        // Start render loop
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.startGame());
        this.respawnBtn.addEventListener('click', () => this.startGame());
        
        this.nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
    }
    
    connectToServer() {
        if (this.socket) {
            this.socket.close();
        }
        
        console.log('Connecting to server:', SERVER_URL);
        
        try {
            this.socket = io(SERVER_URL, {
                transports: ['websocket', 'polling'],
                reconnection: false // Handle reconnection manually
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.reconnectAttempts = 0;
                this.reconnecting = false;
                this.hideReconnectingMessage();
            });
            
            this.socket.on('joined', (data) => {
                console.log('Joined game:', data);
                this.playerId = data.playerId;
                this.worldSize = data.worldSize;
                
                // Update UI
                this.menu.classList.add('hidden');
                this.deathScreen.classList.add('hidden');
                this.hud.classList.remove('hidden');
                this.gameState = 'playing';
            });
            
            this.socket.on('state', (gameState) => {
                this.players = gameState.players;
                this.food = gameState.food;
                this.leaderboard = gameState.leaderboard;
                
                // Update score
                const myPlayer = this.players.find(p => p.id === this.playerId);
                if (myPlayer) {
                    this.score = myPlayer.segments.length;
                    this.updateScore();
                }
                
                this.updateLeaderboard();
            });
            
            this.socket.on('died', (data) => {
                console.log('You died! Length:', data.length);
                this.gameOver(data.length);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                if (this.gameState === 'playing') {
                    this.attemptReconnect();
                }
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                if (this.gameState === 'playing') {
                    this.attemptReconnect();
                }
            });
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.showConnectionError();
        }
    }
    
    attemptReconnect() {
        if (this.reconnecting) return;
        
        this.reconnecting = true;
        this.showReconnectingMessage();
        
        // Exponential backoff: 1, 2, 4, 8, 16, 30 seconds
        const delays = [1000, 2000, 4000, 8000, 16000, 30000];
        const delay = delays[Math.min(this.reconnectAttempts, delays.length - 1)];
        
        console.log(`Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts + 1})`);
        
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connectToServer();
        }, delay);
    }
    
    showReconnectingMessage() {
        // Create or update reconnecting overlay
        let overlay = document.getElementById('reconnect-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'reconnect-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 18px;
                z-index: 2000;
                text-align: center;
            `;
            overlay.innerHTML = '<div>🔄 Reconnecting...</div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'block';
    }
    
    hideReconnectingMessage() {
        const overlay = document.getElementById('reconnect-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    showConnectionError() {
        alert('Failed to connect to game server. Please check your connection and try again.');
    }
    
    startGame() {
        const nickname = this.nicknameInput.value.trim() || 'Player';
        
        if (!this.socket || !this.socket.connected) {
            this.showConnectionError();
            return;
        }
        
        if (this.gameState === 'dead') {
            this.socket.emit('respawn', { nickname });
        } else {
            this.socket.emit('join', { nickname });
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Send input to server
        if (this.gameState === 'playing' && this.socket && this.socket.connected) {
            const myPlayer = this.players.find(p => p.id === this.playerId);
            if (myPlayer && myPlayer.alive) {
                // Calculate angle to mouse
                const head = myPlayer.segments[0];
                const screenX = this.canvas.width / 2;
                const screenY = this.canvas.height / 2;
                const mouseX = this.camera.x + this.inputHandler.mousePos.x;
                const mouseY = this.camera.y + this.inputHandler.mousePos.y;
                const dx = mouseX - head.x;
                const dy = mouseY - head.y;
                const angle = Math.atan2(dy, dx);
                
                this.socket.emit('input', {
                    angle: angle,
                    boosting: this.inputHandler.boosting
                });
            }
        }
        
        // Update camera
        if (this.gameState === 'playing') {
            const myPlayer = this.players.find(p => p.id === this.playerId);
            if (myPlayer && myPlayer.segments.length > 0) {
                this.camera.x = myPlayer.segments[0].x - this.canvas.width / 2;
                this.camera.y = myPlayer.segments[0].y - this.canvas.height / 2;
            }
        }
        
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    gameOver(finalLength) {
        this.gameState = 'dead';
        this.hud.classList.add('hidden');
        this.deathScreen.classList.remove('hidden');
        this.finalScoreElement.textContent = finalLength;
        
        // Save best score
        const currentBest = localStorage.getItem('slitherBest');
        if (!currentBest || finalLength > parseInt(currentBest)) {
            localStorage.setItem('slitherBest', finalLength);
            console.log('🎉 New best length:', finalLength);
        }
        
        // Send score to server
        if (this.socket && this.socket.connected) {
            fetch(`${SERVER_URL}/api/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: this.nicknameInput.value.trim() || 'Player',
                    length: finalLength
                })
            }).catch(err => console.error('Failed to save score:', err));
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    updateLeaderboard() {
        if (this.leaderboard && this.leaderboard.length > 0) {
            this.leaderboardList.innerHTML = this.leaderboard
                .map(entry => `<li>${entry.nickname}: ${entry.length}</li>`)
                .join('');
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            // Draw grid
            this.renderer.drawGrid(this.camera, this.worldSize);
            
            // Draw food
            this.food.forEach(food => {
                this.renderer.drawFood(food, this.camera);
            });
            
            // Draw all players
            this.players.forEach(player => {
                if (player.alive) {
                    this.renderer.drawSnake(player, this.camera);
                }
            });
            
            // Draw minimap
            const myPlayer = this.players.find(p => p.id === this.playerId);
            const otherPlayers = this.players.filter(p => p.id !== this.playerId);
            if (myPlayer) {
                this.renderer.drawMinimap(myPlayer, otherPlayers, this.worldSize);
            }
        }
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
