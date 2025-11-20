# Minecraft 2D Multiplayer Server

Real-time multiplayer server for 2D Minecraft with shared world state.

## Features

- **Shared World**: All players see the same blocks
- **Real-time Updates**: Changes broadcast at 8 Hz
- **Persistence**: World saved to disk every 30 seconds
- **Rate Limiting**: Max 10 block updates per 5 seconds per player
- **Auto-reconnect**: Client reconnects with exponential backoff

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Server listens on `PORT` environment variable or 3000 by default.

## Endpoints

- `GET /healthz` - Health check (returns 200 with player count)
- `GET /api/world` - World metadata (block count, player count)

## Socket Events

### Server → Client
- `world:snapshot` - Full world state on join
- `world:patch` - Incremental updates (broadcast at 8 Hz)
- `error` - Error messages (e.g., rate limit)

### Client → Server
- `block:update` - Place/remove block
  ```js
  { x: number, y: number, blockId: string, action: 'place'|'remove' }
  ```
