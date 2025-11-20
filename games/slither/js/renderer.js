// Renderer Class
export class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
    }
    
    drawGrid(camera, worldSize) {
        const gridSize = 50;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = startX; x < camera.x + this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - camera.x, 0);
            this.ctx.lineTo(x - camera.x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < camera.y + this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y - camera.y);
            this.ctx.lineTo(this.canvas.width, y - camera.y);
            this.ctx.stroke();
        }
    }
    
    drawFood(food, camera) {
        const screenX = food.x - camera.x;
        const screenY = food.y - camera.y;
        
        // Only draw if on screen
        if (screenX < -20 || screenX > this.canvas.width + 20 ||
            screenY < -20 || screenY > this.canvas.height + 20) {
            return;
        }
        
        this.ctx.fillStyle = food.color;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glow effect
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = food.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawSnake(player, camera) {
        // Draw segments
        for (let i = player.segments.length - 1; i >= 0; i--) {
            const segment = player.segments[i];
            const screenX = segment.x - camera.x;
            const screenY = segment.y - camera.y;
            
            // Only draw if on screen
            if (screenX < -50 || screenX > this.canvas.width + 50 ||
                screenY < -50 || screenY > this.canvas.height + 50) {
                continue;
            }
            
            // Body
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, segment.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Border for better visibility
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Head features
            if (i === 0) {
                // Eyes
                const angle = player.angle;
                const eyeDistance = 4;
                const eyeRadius = 2;
                
                // Left eye
                const leftEyeX = screenX + Math.cos(angle - Math.PI / 4) * eyeDistance;
                const leftEyeY = screenY + Math.sin(angle - Math.PI / 4) * eyeDistance;
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Right eye
                const rightEyeX = screenX + Math.cos(angle + Math.PI / 4) * eyeDistance;
                const rightEyeY = screenY + Math.sin(angle + Math.PI / 4) * eyeDistance;
                this.ctx.beginPath();
                this.ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Pupils
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(leftEyeX, leftEyeY, 1, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(rightEyeX, rightEyeY, 1, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Name tag
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(player.nickname, screenX, screenY - 20);
            }
        }
    }
    
    drawMinimap(player, otherPlayers, worldSize) {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 20;
        const minimapY = this.canvas.height - minimapSize - 20;
        const scale = minimapSize / worldSize;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Border
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Draw player
        if (player) {
            const px = minimapX + player.segments[0].x * scale;
            const py = minimapY + player.segments[0].y * scale;
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw other players
        otherPlayers.forEach(other => {
            if (other.alive && other.segments && other.segments.length > 0) {
                const bx = minimapX + other.segments[0].x * scale;
                const by = minimapY + other.segments[0].y * scale;
                this.ctx.fillStyle = other.color;
                this.ctx.beginPath();
                this.ctx.arc(bx, by, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
}
