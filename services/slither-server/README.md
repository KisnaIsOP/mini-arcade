# Slither.io Multiplayer Server

Real-time multiplayer server for the Slither.io game using Node.js, Express, and Socket.IO.

## Features

- **Authoritative Server**: All game logic runs server-side
- **Real-time Multiplayer**: Up to 100+ concurrent players
- **WebSocket Communication**: Low-latency game state updates (20 Hz)
- **Collision Detection**: Server-side collision handling
- **Leaderboard System**: Real-time top 10 rankings
- **Score Persistence**: Save high scores to JSON file
- **Rate Limiting**: Prevents score spam (5 requests/minute per IP)
- **Health Checks**: `/healthz` endpoint for monitoring

## Installation

```bash
cd services/slither-server
npm install
```

## Environment Variables

Create a `.env` file:

```
PORT=3000
WEBSITE_ORIGIN=http://localhost:3000
```

## Running Locally

```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### REST API

- `GET /healthz` - Health check endpoint
- `GET /api/leaderboard` - Get current top 10 players
- `POST /api/score` - Submit a score (rate-limited)

### WebSocket Events

**Client → Server:**
- `join` - Join the game with nickname
- `input` - Send player input (angle, boosting)
- `respawn` - Respawn after death

**Server → Client:**
- `joined` - Confirmation of joining (playerId, worldSize)
- `state` - Game state update (players, food, leaderboard)
- `died` - Player death notification

## Game Configuration

- **World Size**: 5000 x 5000
- **Food Count**: 1000 particles
- **Tick Rate**: 20 Hz (50ms updates)
- **Starting Length**: 10 segments
- **Boost Multiplier**: 1.5x speed

## Deployment

### Render.com

1. Add service in Render dashboard
2. Set environment variables:
   - `PORT` (auto-set by Render)
   - `WEBSITE_ORIGIN` (your website URL)
3. Deploy from repository

See `render.yaml` for configuration.

## Data Storage

Scores are stored in `data/scores.json` (top 100).

## Monitoring

Check server health:
```bash
curl http://localhost:3000/healthz
```

Response:
```json
{
  "status": "ok",
  "players": 5,
  "food": 1000
}
```

## Performance

- Handles 100+ concurrent players
- ~20 updates per second per client
- Low memory footprint (~50MB base)
- Minimal CPU usage (<5% on modern systems)
