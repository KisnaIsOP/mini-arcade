# CHS-Minecraft - Attribution & License

## Original Project

This game is based on **CHS-Minecraft** by MotoLegacy.

- **Repository**: https://github.com/MotoLegacy/CHS-Minecraft
- **Original Author**: MotoLegacy
- **License**: Not specified in original repository

## About CHS-Minecraft

CHS-Minecraft is a 2D Minecraft clone created using CodeHS' JavaScript Graphics API. The original project was designed to highlight features and issues with the CodeHS API.

### Original Features
- Simple menu system
- Skin selection
- Flat world generation
- Block placement and removal
- Basic player movement and physics

## Multiplayer Integration

This version has been enhanced with **real-time multiplayer functionality**:

- Shared world state across all connected players
- Real-time block updates broadcast at 8 Hz
- Automatic reconnection with exponential backoff
- Rate limiting to prevent spam (10 updates per 5 seconds)
- Persistent world saved to disk every 30 seconds

### Multiplayer Components Added
- `Multiplayer.js` - Client-side networking
- `services/minecraft2d-server/` - Node.js multiplayer server
- Socket.IO integration for real-time communication

## Modifications

The following modifications were made to enable multiplayer:

1. Added Socket.IO client library to `index.html`
2. Created `Multiplayer.js` for network communication
3. Modified `CHS-Minecraft.js` to send block updates to server
4. Added connection status indicator to UI
5. Created dedicated multiplayer server with world persistence

## Credits

- **Original Game**: MotoLegacy
- **Multiplayer Integration**: Mini Arcade Team
- **CodeHS Graphics API**: CodeHS

## Disclaimer

This project is not affiliated with Mojang AB, Microsoft, or the official Minecraft game. It is a fan-made educational project.
