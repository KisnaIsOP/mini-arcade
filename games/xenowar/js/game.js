// Xenowar - Optimized 2D Space Shooter
// Optimized for Render limits (512MB RAM, 0.15 CPU)

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Audio Context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundEnabled = true;
        
        // Resize canvas to match display
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.wave = 1;
        this.health = 100;
        this.maxHealth = 100;
        
        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 30,
            height: 30,
            speed: 250,
            color: '#00ffff'
        };
        
        // Arrays (optimized sizes for Render)
        this.bullets = [];
        this.enemies = [];
        this.particles = []; // Reduced from typical implementations
        this.powerups = [];
        
        // Spawn settings (optimized)
        this.enemySpawnRate = 2000; // ms - slower spawn rate
        this.lastEnemySpawn = 0;
        this.maxEnemies = 15; // Reduced from 30-50 typical
        this.maxBullets = 30; // Limit bullets
        this.maxParticles = 20; // Reduced particles
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.shooting = false;
        this.lastShot = 0;
        this.shootCooldown = 200; // ms
        
        // Mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.joystick = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
        
        // UI Elements
        this.menu = document.getElementById('menu');
        this.controlsScreen = document.getElementById('controls-screen');
        this.hud = document.getElementById('hud');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.mobileControls = document.getElementById('mobile-controls');
        
        this.setupEventListeners();
        this.setupMobileControls();
        
        // Game loop
        this.lastTime = 0;
        this.running = false;
    }
    
    resizeCanvas() {
        // Auto-scale canvas for mobile to reduce internal resolution
        const scale = this.isMobile ? 0.8 : 1;
        this.canvas.width = window.innerWidth * scale;
        this.canvas.height = window.innerHeight * scale;
        
        // Update player position if game is running
        if (this.state === 'playing') {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height - 100;
        }
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('controls-btn').addEventListener('click', () => this.showControls());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('resume-btn').addEventListener('click', () => this.resume());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        
        // Sound toggle
        const soundToggleBtn = document.getElementById('sound-toggle-btn');
        soundToggleBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundToggleBtn.textContent = this.soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF';
            soundToggleBtn.classList.toggle('muted', !this.soundEnabled);
        });
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.shooting = true;
            }
            
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (this.state === 'playing') this.pause();
                else if (this.state === 'paused') this.resume();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if (e.key === ' ' || e.key === 'Spacebar') {
                this.shooting = false;
            }
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
            this.shooting = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
            this.shooting = false;
        });
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shooting = true;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.shooting = false;
        });
    }
    
    // Sound Effects using Web Audio API
    playShootSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    playExplosionSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playHitSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    playGameOverSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.5);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1);
    }
    
    playWaveCompleteSound() {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }
    
    setupMobileControls() {
        if (!this.isMobile) return;
        
        const joystickArea = document.getElementById('joystick');
        const joystickInner = joystickArea.querySelector('.joystick-inner');
        const shootBtn = document.getElementById('shoot-btn');
        
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = joystickArea.getBoundingClientRect();
            this.joystick.active = true;
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;
        });
        
        joystickArea.addEventListener('touchmove', (e) => {
            if (!this.joystick.active) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - this.joystick.startX;
            const dy = touch.clientY - this.joystick.startY;
            
            const distance = Math.min(50, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dy, dx);
            
            this.joystick.x = Math.cos(angle) * distance / 50;
            this.joystick.y = Math.sin(angle) * distance / 50;
            
            joystickInner.style.transform = `translate(${this.joystick.x * 50}px, ${this.joystick.y * 50}px)`;
        });
        
        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joystickInner.style.transform = 'translate(0, 0)';
        });
        
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shooting = true;
        });
        
        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.shooting = false;
        });
    }
    
    showMenu() {
        this.state = 'menu';
        this.menu.classList.remove('hidden');
        this.controlsScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
        this.running = false;
    }
    
    showControls() {
        this.controlsScreen.classList.remove('hidden');
        this.menu.classList.add('hidden');
    }
    
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.wave = 1;
        this.health = this.maxHealth;
        
        // Reset player
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;
        
        // Clear arrays
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        
        // Reset spawn rate
        this.enemySpawnRate = 2000;
        this.lastEnemySpawn = 0;
        
        // Update UI
        this.menu.classList.add('hidden');
        this.controlsScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        if (this.isMobile) {
            this.mobileControls.classList.remove('hidden');
        }
        
        this.updateHUD();
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    pause() {
        this.state = 'paused';
        this.pauseScreen.classList.remove('hidden');
        this.running = false;
    }
    
    resume() {
        this.state = 'playing';
        this.pauseScreen.classList.add('hidden');
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    quitToMenu() {
        this.showMenu();
    }
    
    gameOver() {
        this.state = 'gameover';
        this.hud.classList.add('hidden');
        this.mobileControls.classList.add('hidden');
        this.gameoverScreen.classList.remove('hidden');
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-wave').textContent = this.wave;
        
        // Save best score
        const bestScore = localStorage.getItem('xenowarBest') || 0;
        if (this.score > bestScore) {
            localStorage.setItem('xenowarBest', this.score);
        }
        
        this.playGameOverSound();
        this.running = false;
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(dt) {
        // Update player
        this.updatePlayer(dt);
        
        // Shoot
        if (this.shooting) {
            this.shoot(currentTime);
        }
        
        // Spawn enemies (optimized)
        if (currentTime - this.lastEnemySpawn > this.enemySpawnRate && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.lastEnemySpawn = currentTime;
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed * dt;
            
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed * dt;
            
            if (enemy.y > this.canvas.height + 10) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(this.player, enemy)) {
                this.takeDamage(20);
                this.enemies.splice(i, 1);
                this.createParticles(enemy.x, enemy.y, enemy.color, 5);
                this.playHitSound();
            }
        }
        
        // Check bullet-enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                    const enemy = this.enemies[j];
                    this.score += 10;
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.createParticles(enemy.x, enemy.y, enemy.color, 3);
                    this.playExplosionSound();
                    this.updateHUD();
                    break;
                }
            }
        }
        
        // Update particles (optimized)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Wave progression
        if (this.enemies.length === 0 && currentTime - this.lastEnemySpawn > this.enemySpawnRate * 2) {
            this.wave++;
            this.enemySpawnRate = Math.max(800, this.enemySpawnRate - 100);
            this.maxEnemies = Math.min(20, this.maxEnemies + 2);
            this.playWaveCompleteSound();
            this.updateHUD();
        }
    }
    
    updatePlayer(dt) {
        let dx = 0;
        let dy = 0;
        
        // Keyboard
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        
        // Joystick
        if (this.joystick.active) {
            dx += this.joystick.x;
            dy += this.joystick.y;
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        
        // Move player
        this.player.x += dx * this.player.speed * dt;
        this.player.y += dy * this.player.speed * dt;
        
        // Keep in bounds
        this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.canvas.height - this.player.height / 2, this.player.y));
    }
    
    shoot(time) {
        if (time - this.lastShot < this.shootCooldown) return;
        if (this.bullets.length >= this.maxBullets) return;
        
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - this.player.height / 2,
            width: 4,
            height: 12,
            speed: 400,
            color: '#00ffff'
        });
        
        this.playShootSound();
        this.lastShot = time;
    }
    
    spawnEnemy() {
        const x = Math.random() * this.canvas.width;
        const speed = 50 + Math.random() * 50 + this.wave * 5;
        
        this.enemies.push({
            x: x,
            y: -20,
            width: 25,
            height: 25,
            speed: speed,
            color: '#ff0000'
        });
    }
    
    checkCollision(a, b) {
        return a.x - a.width / 2 < b.x + b.width / 2 &&
               a.x + a.width / 2 > b.x - b.width / 2 &&
               a.y - a.height / 2 < b.y + b.height / 2 &&
               a.y + a.height / 2 > b.y - b.height / 2;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.gameOver();
        }
        
        this.updateHUD();
    }
    
    createParticles(x, y, color, count) {
        // Limit particles for performance
        if (this.particles.length >= this.maxParticles) return;
        
        for (let i = 0; i < Math.min(count, 3); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                life: 0.5
            });
        }
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('health').style.width = (this.health / this.maxHealth * 100) + '%';
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw starfield (simple, optimized)
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + performance.now() * 0.02) % this.canvas.width;
            const y = (i * 211) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.player.color;
        this.ctx.fillRect(
            this.player.x - this.player.width / 2,
            this.player.y - this.player.height / 2,
            this.player.width,
            this.player.height
        );
        this.ctx.shadowBlur = 0;
        
        // Draw bullets
        this.ctx.fillStyle = '#00ffff';
        for (const bullet of this.bullets) {
            this.ctx.fillRect(
                bullet.x - bullet.width / 2,
                bullet.y - bullet.height / 2,
                bullet.width,
                bullet.height
            );
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(
                enemy.x - enemy.width / 2,
                enemy.y - enemy.height / 2,
                enemy.width,
                enemy.height
            );
        }
        
        // Draw particles
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life * 2;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        this.ctx.globalAlpha = 1;
    }
}

// Store current time for shoot cooldown
let currentTime = 0;

// Start game when loaded
window.addEventListener('load', () => {
    const game = new Game();
    
    // Update current time
    setInterval(() => {
        currentTime = performance.now();
    }, 16);
});
