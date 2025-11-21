const express = require('express');
const path = require('path');

const app = express();
const fs = require('fs');
const PORT = process.env.PORT || 3000;

// Health check endpoint for keep-alive monitoring
app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
    };
    
    res.status(200).json(healthCheck);
});

// API status endpoint for debugging
app.get('/api/status', (req, res) => {
    res.status(200).json({
        service: 'Mini Arcade',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from the current directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Handle SPA routing - redirect unknown routes to root index.html if present
app.get('*', (req, res) => {
    const rootIndex = path.join(__dirname, 'index.html');
    if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
    } else {
        res.sendFile(path.join(publicPath, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🎮 Mini Arcade server running on port ${PORT}`);
    console.log(`🌐 Access your games at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Server shutting down gracefully...');
    process.exit(0);
});