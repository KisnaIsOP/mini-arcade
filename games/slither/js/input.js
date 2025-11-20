// Input Handler Class
export class InputHandler {
    constructor(game) {
        this.game = game;
        this.mousePos = { x: game.canvas.width / 2, y: game.canvas.height / 2 };
        this.boosting = false;
        
        this.setupListeners();
    }
    
    setupListeners() {
        // Mouse movement
        this.game.canvas.addEventListener('mousemove', (e) => {
            const rect = this.game.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        // Mouse click for boost
        this.game.canvas.addEventListener('mousedown', (e) => {
            if (this.game.gameState === 'playing') {
                this.boosting = true;
            }
        });
        
        this.game.canvas.addEventListener('mouseup', () => {
            this.boosting = false;
        });
        
        // Touch support for mobile
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.game.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mousePos.x = touch.clientX - rect.left;
            this.mousePos.y = touch.clientY - rect.top;
        });
        
        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.game.gameState === 'playing') {
                this.boosting = true;
            }
        });
        
        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.boosting = false;
        });
        
        // Spacebar for boost
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.game.gameState === 'playing') {
                e.preventDefault();
                this.boosting = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.boosting = false;
            }
        });
    }
}
