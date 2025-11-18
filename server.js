const express = require('express');
const path = require('path');

const app = express();
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
app.use(express.static(__dirname));

// Handle SPA routing - redirect all routes to index.html (must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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