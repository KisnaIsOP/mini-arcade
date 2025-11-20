# Slither.io Clone - Real Multiplayer

A real-time multiplayer implementation of the popular Slither.io game.

## Features

- **Real Multiplayer**: Play with real players worldwide
- **Smooth Gameplay**: Mouse/touch controls for intuitive movement
- **Speed Boost**: Hold left-click or spacebar to boost
- **Leaderboard**: Real-time ranking of all players
- **Minimap**: Track your position and nearby players
- **Mobile Support**: Fully responsive with touch controls
- **Score Tracking**: Best length saved locally and globally
- **Auto Reconnect**: Exponential backoff reconnection (1-30s)

## How to Play

1. Enter your nickname
2. Click "PLAY" to start
3. Move with your mouse or finger
4. Eat colorful dots to grow longer
5. Boost with left-click/space (but use strategically!)
6. Avoid hitting other snakes
7. Try to become the longest snake!

## Technical Details

- **Client**: Pure JavaScript (ES6 modules) + Socket.IO
- **Server**: Node.js + Express + Socket.IO
- **Rendering**: HTML5 Canvas (60 FPS)
- **Network**: WebSocket with 20 Hz server updates
- **Game World**: 5000x5000 units
- **Architecture**: Authoritative server model

## Files Structure

```
slither/
├── index.html          # Main game page
├── css/
│   └── style.css      # Styling and UI
└── js/
    ├── game.js        # Main game controller + networking
    ├── renderer.js    # Canvas rendering
    └── input.js       # Input handling
```

Server files are in `/services/slither-server/`

## Setup

### Client Setup
The client is already configured. Set the server URL in your environment:

```javascript
window.__SLITHER_SERVER_URL__ = 'http://localhost:3000';
```

Or it will default to `http://localhost:3000` for development.

### Server Setup
See `/services/slither-server/README.md` for server setup instructions.

## Integration

This game is integrated into the Mini Arcade platform at `/games/slither/`.

The multiplayer server runs separately and communicates via WebSocket.

## Credits

Inspired by the original Slither.io game.
