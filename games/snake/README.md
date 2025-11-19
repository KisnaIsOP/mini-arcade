# Snake Game

A classic Snake game implementation enhanced for the Mini Arcade platform.

## Features

- **Classic Snake gameplay** - Eat food to grow your snake and increase your score
- **Mobile support** - Touch controls with swipe gestures and on-screen buttons
- **Responsive design** - Tailwind CSS styling that matches the Mini Arcade theme
- **Score tracking** - Integrated with Mini Arcade's scoring system
- **Multiplayer support** - Real-time score broadcasting in multiplayer mode
- **Leaderboard** - Top 10 high scores display
- **Audio effects** - Sound effects for movement and game events

## Controls

### Desktop
- **Arrow Keys**: Move the snake (↑ ↓ ← →)

### Mobile
- **Swipe gestures**: Swipe in any direction to move
- **Touch buttons**: Use the on-screen directional buttons

## Gameplay

1. Use the arrow keys or touch controls to move your snake
2. Eat the food (red apple) to grow your snake and increase your score
3. Avoid hitting the walls or your own tail
4. Try to achieve the highest score possible!

## Technical Details

- Built with HTML5 Canvas for smooth rendering
- Enhanced with modern JavaScript features
- Responsive design using Tailwind CSS
- Integrated with Mini Arcade's scoring and multiplayer systems

## License and Attribution

This game is based on the open-source Snake game by **Learn Web Development**.

**Original Repository**: https://github.com/CodeExplainedRepo/Snake-JavaScript
**Original Author**: Learn Web Development
**YouTube Channel**: https://www.youtube.com/channel/UC8n8ftV94ZU_DJLOLtrpORA

### MIT License

```
MIT License

Copyright (c) 2024 Learn Web Development

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Enhancements Made for Mini Arcade

- **Mobile Support**: Added touch controls and swipe gestures
- **Modern Styling**: Redesigned with Tailwind CSS to match Mini Arcade theme
- **Score Integration**: Connected to Mini Arcade's scoring system
- **Multiplayer Features**: Real-time score broadcasting
- **Leaderboard**: Top scores display with Mini Arcade's `fetchTopScores` function
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Enhanced UX**: Game over modal, better controls, and improved accessibility

## Files Structure

```
games/snake/
├── index.html          # Main game page with Tailwind styling
├── game.js            # Enhanced game logic with mobile support
├── README.md          # This file
├── img/
│   ├── ground.png     # Game background
│   └── food.png       # Food sprite
└── audio/
    ├── dead.mp3       # Game over sound
    ├── eat.mp3        # Eating food sound
    ├── up.mp3         # Move up sound
    ├── down.mp3       # Move down sound
    ├── left.mp3       # Move left sound
    └── right.mp3      # Move right sound
```