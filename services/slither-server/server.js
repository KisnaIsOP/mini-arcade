const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const WEBSITE_ORIGIN = process.env.WEBSITE_ORIGIN || '*';

// Middleware
app.use(cors({ origin: WEBSITE_ORIGIN }));
app.use(express.json());

// Rate limiter for score endpoint
const scoreRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute per IP
    message: { error: 'Too many requests, please try again later.' }
});

// Socket.IO setup
const io = socketIo(server, {
    cors: {
        origin: WEBSITE_ORIGIN,
        methods: ['GET', 'POST']
    }
});

// Game state
const WORLD_SIZE = 5000;
const FOOD_COUNT = 1000;
const TICK_RATE = 20; // 20 Hz server updates
const SEGMENT_SPACING = 5;
const SEGMENT_RADIUS = 8;
const BASE_SPEED = 150;
const BOOST_MULTIPLIER = 1.5;

let players = new Map();
let food = [];

// Initialize food
function initializeFood() {
    food = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
        food.push(createFood());
    }
}

function createFood() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#52B788'];
    return {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: 4
    };
}

function createPlayer(socketId, nickname, x, y) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#52B788'];
    
    const segments = [];
    for (let i = 0; i < 10; i++) {
        segments.push({
            x: x - i * SEGMENT_SPACING,
            y: y,
            radius: SEGMENT_RADIUS
        });
    }
    
    return {
        id: socketId,
        nickname: nickname,
        segments: segments,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        speed: BASE_SPEED,
        boosting: false,
        alive: true
    };
}

function updatePlayer(player, deltaTime) {
    if (!player.alive) return;
    
    const currentSpeed = player.boosting ? player.speed * BOOST_MULTIPLIER : player.speed;
    const head = player.segments[0];
    
    // Move head
    head.x += Math.cos(player.angle) * currentSpeed * deltaTime;
    head.y += Math.sin(player.angle) * currentSpeed * deltaTime;
    
    // Boundaries
    head.x = Math.max(0, Math.min(WORLD_SIZE, head.x));
    head.y = Math.max(0, Math.min(WORLD_SIZE, head.y));
    
    // Update segments
    for (let i = 1; i < player.segments.length; i++) {
        const current = player.segments[i];
        const target = player.segments[i - 1];
        
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > SEGMENT_SPACING) {
            const angle = Math.atan2(dy, dx);
            current.x = target.x - Math.cos(angle) * SEGMENT_SPACING;
            current.y = target.y - Math.sin(angle) * SEGMENT_SPACING;
        }
    }
}

function checkFoodCollision(player) {
    if (!player.alive) return;
    
    const head = player.segments[0];
    const eatRadius = 15;
    
    for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        const dx = head.x - f.x;
        const dy = head.y - f.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < eatRadius) {
            // Grow player
            const lastSegment = player.segments[player.segments.length - 1];
            player.segments.push({
                x: lastSegment.x,
                y: lastSegment.y,
                radius: SEGMENT_RADIUS
            });
            
            // Remove food and spawn new one
            food.splice(i, 1);
            food.push(createFood());
        }
    }
}

function checkCollisions() {
    const alivePlayers = Array.from(players.values()).filter(p => p.alive);
    
    for (const player of alivePlayers) {
        const head = player.segments[0];
        const collisionRadius = 10;
        
        // Check collision with other players
        for (const other of alivePlayers) {
            if (player.id === other.id) continue;
            
            for (const segment of other.segments) {
                const dx = head.x - segment.x;
                const dy = head.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < collisionRadius) {
                    player.alive = false;
                    io.to(player.id).emit('died', { length: player.segments.length });
                    break;
                }
            }
            if (!player.alive) break;
        }
        
        // Check self collision (skip first 5 segments)
        if (player.alive) {
            for (let i = 5; i < player.segments.length; i++) {
                const segment = player.segments[i];
                const dx = head.x - segment.x;
                const dy = head.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < collisionRadius) {
                    player.alive = false;
                    io.to(player.id).emit('died', { length: player.segments.length });
                    break;
                }
            }
        }
    }
}

function getLeaderboard() {
    return Array.from(players.values())
        .filter(p => p.alive)
        .map(p => ({ nickname: p.nickname, length: p.segments.length }))
        .sort((a, b) => b.length - a.length)
        .slice(0, 10);
}

// Game loop
let lastUpdate = Date.now();
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastUpdate) / 1000;
    lastUpdate = now;
    
    // Update all players
    for (const player of players.values()) {
        updatePlayer(player, deltaTime);
        checkFoodCollision(player);
    }
    
    // Check collisions
    checkCollisions();
    
    // Prepare game state
    const gameState = {
        players: Array.from(players.values()).map(p => ({
            id: p.id,
            nickname: p.nickname,
            segments: p.segments,
            color: p.color,
            angle: p.angle,
            alive: p.alive
        })),
        food: food,
        leaderboard: getLeaderboard()
    };
    
    // Broadcast to all clients
    io.emit('state', gameState);
}

// Start game loop
setInterval(gameLoop, 1000 / TICK_RATE);
initializeFood();

// Socket.IO events
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    socket.on('join', (data) => {
        const nickname = (data.nickname || 'Player').substring(0, 15);
        const x = Math.random() * WORLD_SIZE;
        const y = Math.random() * WORLD_SIZE;
        
        const player = createPlayer(socket.id, nickname, x, y);
        players.set(socket.id, player);
        
        console.log(`${nickname} joined the game`);
        
        socket.emit('joined', {
            playerId: socket.id,
            worldSize: WORLD_SIZE
        });
    });
    
    socket.on('input', (data) => {
        const player = players.get(socket.id);
        if (player && player.alive) {
            // Update player angle and boosting state
            if (data.angle !== undefined) {
                player.angle = data.angle;
            }
            if (data.boosting !== undefined) {
                player.boosting = data.boosting;
            }
        }
    });
    
    socket.on('respawn', (data) => {
        const nickname = (data.nickname || 'Player').substring(0, 15);
        const x = Math.random() * WORLD_SIZE;
        const y = Math.random() * WORLD_SIZE;
        
        const player = createPlayer(socket.id, nickname, x, y);
        players.set(socket.id, player);
        
        socket.emit('joined', {
            playerId: socket.id,
            worldSize: WORLD_SIZE
        });
    });
    
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`${player.nickname} disconnected`);
            players.delete(socket.id);
        }
    });
});

// REST API endpoints
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok', players: players.size, food: food.length });
});

app.get('/api/leaderboard', (req, res) => {
    res.json(getLeaderboard());
});

app.post('/api/score', scoreRateLimiter, (req, res) => {
    const { nickname, length } = req.body;
    
    if (!nickname || !length) {
        return res.status(400).json({ error: 'Missing nickname or length' });
    }
    
    const dataDir = path.join(__dirname, 'data');
    const scoresFile = path.join(dataDir, 'scores.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load existing scores
    let scores = [];
    if (fs.existsSync(scoresFile)) {
        try {
            scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
        } catch (error) {
            console.error('Error reading scores file:', error);
        }
    }
    
    // Add new score
    scores.push({
        nickname: nickname.substring(0, 15),
        length: parseInt(length),
        timestamp: new Date().toISOString()
    });
    
    // Keep only top 100 scores
    scores.sort((a, b) => b.length - a.length);
    scores = scores.slice(0, 100);
    
    // Save scores
    try {
        fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));
        res.json({ success: true, rank: scores.findIndex(s => s.nickname === nickname && s.length === length) + 1 });
    } catch (error) {
        console.error('Error saving scores:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`🐍 Slither.io server running on port ${PORT}`);
    console.log(`📊 World size: ${WORLD_SIZE}x${WORLD_SIZE}`);
    console.log(`🍎 Food count: ${FOOD_COUNT}`);
    console.log(`⚡ Tick rate: ${TICK_RATE} Hz`);
});
