# 🎮 LittleJS Quest - Hot-Seat 2-Player Mode

## Summary
Added local 2-player hot-seat mode allowing two players to play simultaneously on the same screen with independent controls and scoring.

## Files Changed

### Modified (3 files):
1. `games/littlejs-quest/gamePlayer.js` - Added Player constructor with playerNumber, color assignment, separate controls per player
2. `games/littlejs-quest/game.js` - Added player2 instance, dual score tracking, camera midpoint following, dual respawn
3. `games/littlejs-quest/index.html` - Added control instructions overlay
4. `games/littlejs-quest/README.md` - Updated with 2-player control documentation

## Code Changes

### gamePlayer.js (Lines 18-68)
```javascript
// Added constructor with player number and color
constructor(pos, playerNumber = 1) {
    super(pos);
    this.playerNumber = playerNumber;
    this.playerScore = 0;
    if (playerNumber === 2) {
        this.color = LJS.hsl(0.9, 1, 0.6); // Pink
    } else {
        this.color = LJS.hsl(0.6, 1, 0.6); // Blue
    }
}

// Split controls: P1 = WASD, P2 = Arrow Keys
if (this.playerNumber === 1) {
    // WASD controls
} else {
    // Arrow key controls
}
```

### game.js (Lines 20-29, 48-56, 95-104, 121-125, 137-149)
```javascript
// Added player2, score1, score2, deaths1, deaths2 globals
export let player2, score1, score2, deaths1, deaths2;

// Spawn both players offset
player = new GamePlayer.Player(GameLevel.playerStartPos, 1);
player2 = new GamePlayer.Player(player2Pos, 2);

// Respawn both independently
if (player.deadTimer > 1) { /* respawn P1 */ }
if (player2.deadTimer > 1) { /* respawn P2 */ }

// Camera follows midpoint
const midpoint = p1Pos.add(p2Pos).scale(0.5);

// Dual HUD display
drawText('P1: ' + score1, 80, 20, 30, '#66b3ff');
drawText('P2: ' + score2, width - 80, 20, 30, '#ff66b3');
```

### index.html (Lines 26-42, 65-70)
```html
<!-- Added control instructions overlay -->
<div id="controls-info">
    <span class="player1-color">P1: WASD + Space</span> | 
    <span class="player2-color">P2: Arrow Keys</span>
</div>
```

## Testing Instructions

1. **Start server**: `npm start` or open http://localhost:3000
2. **Navigate to**: http://localhost:3000/games/littlejs-quest/
3. **Player 1**: Use WASD to move, Space to jump (blue character)
4. **Player 2**: Use Arrow Keys to move, Up to jump (pink character)
5. **Observe**: Both players on screen, separate scores at top corners, camera follows both

## Branch & PR

- **Branch**: `hotseat/littlejs-2p`
- **Commit**: ff977c6
- **PR Link**: https://github.com/KisnaIsOP/mini-arcade/pull/new/hotseat/littlejs-2p

Create PR manually at the link above with:
- **Title**: "feat: add hot-seat 2-player mode to LittleJS Quest"
- **Description**: See testing instructions above
