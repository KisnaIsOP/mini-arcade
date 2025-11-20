const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const WORLD_FILE = path.join(__dirname, 'data', 'world.json');
const SAVE_INTERVAL = 30000; // 30 seconds
const BROADCAST_RATE = 125; // 8 Hz (1000ms / 8 = 125ms)

// In-memory world state: { "x,y": { x, y, blockId } }
let worldBlocks = {};
let pendingUpdates = [];
let lastBroadcast = Date.now();

// Rate limiting: max 10 block updates per 5 seconds per player
const rateLimits = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 5000;

// Load world from disk
function loadWorld() {
    try {
        if (fs.existsSync(WORLD_FILE)) {
            const data = fs.readFileSync(WORLD_FILE, 'utf8');
            worldBlocks = JSON.parse(data);
            console.log(`✅ Loaded world with ${Object.keys(worldBlocks).length} blocks`);
        }
    } catch (err) {
        console.error('❌ Error loading world:', err.message);
    }
}

// Save world to disk
function saveWorld() {
    try {
        const dir = path.dirname(WORLD_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(WORLD_FILE, JSON.stringify(worldBlocks), 'utf8');
        console.log(`💾 Saved world with ${Object.keys(worldBlocks).length} blocks`);
    } catch (err) {
        console.error('❌ Error saving world:', err.message);
    }
}

// Check rate limit for player
function checkRateLimit(playerId) {
    const now = Date.now();
    if (!rateLimits.has(playerId)) {
        rateLimits.set(playerId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }
    
    const limit = rateLimits.get(playerId);
    if (now > limit.resetAt) {
        limit.count = 1;
        limit.resetAt = now + RATE_LIMIT_WINDOW;
        return true;
    }
    
    if (limit.count >= RATE_LIMIT_MAX) {
        return false;
    }
    
    limit.count++;
    return true;
}

// Broadcast pending updates at limited rate
function broadcastUpdates() {
    const now = Date.now();
    if (now - lastBroadcast >= BROADCAST_RATE && pendingUpdates.length > 0) {
        io.emit('world:patch', pendingUpdates);
        pendingUpdates = [];
        lastBroadcast = now;
    }
}

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`🎮 Player connected: ${socket.id}`);
    
    // Send full world snapshot on join
    socket.emit('world:snapshot', worldBlocks);
    
    // Handle block updates
    socket.on('block:update', (data) => {
        const { x, y, blockId, action } = data;
        
        // Validate input
        if (typeof x !== 'number' || typeof y !== 'number') {
            return;
        }
        
        // Rate limit check
        if (!checkRateLimit(socket.id)) {
            socket.emit('error', { message: 'Rate limit exceeded' });
            return;
        }
        
        const key = `${x},${y}`;
        
        if (action === 'place' && blockId) {
            worldBlocks[key] = { x, y, blockId };
            pendingUpdates.push({ x, y, blockId, action: 'place' });
        } else if (action === 'remove') {
            delete worldBlocks[key];
            pendingUpdates.push({ x, y, action: 'remove' });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`👋 Player disconnected: ${socket.id}`);
        rateLimits.delete(socket.id);
    });
});

// Health check endpoint
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok', players: io.engine.clientsCount });
});

// World metadata endpoint
app.get('/api/world', (req, res) => {
    res.json({
        blocks: Object.keys(worldBlocks).length,
        players: io.engine.clientsCount
    });
});

// Initialize
loadWorld();
setInterval(saveWorld, SAVE_INTERVAL);
setInterval(broadcastUpdates, 50); // Check every 50ms

server.listen(PORT, () => {
    console.log(`🎮 Minecraft 2D server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/healthz`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Saving world and shutting down...');
    saveWorld();
    process.exit(0);
});
