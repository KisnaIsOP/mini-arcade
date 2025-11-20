# Xenowar - 2D Space Shooter

A fast-paced 2D space shooter game where you defend Earth from alien invasion.

## Features

- **Intense Action**: Wave-based gameplay with increasing difficulty
- **Simple Controls**: WASD/Arrow keys to move, Space/Click to shoot
- **Sound Effects**: Retro-style laser, explosion, and game sounds
- **Mobile Support**: Touch controls with virtual joystick
- **Score System**: Track your best scores locally
- **Optimized Performance**: Runs smoothly on low-end devices
- **Responsive Design**: Auto-scales for any screen size

## Controls

### Desktop
- **Movement**: WASD or Arrow Keys
- **Shoot**: SPACE or Left Click
- **Pause**: ESC or P

### Mobile
- **Movement**: Virtual joystick (left side)
- **Shoot**: Fire button (right side)

## Sound Effects

The game includes retro-style sound effects using Web Audio API:
- **Laser Sound**: Pew-pew when shooting
- **Explosion**: Boom when enemies are destroyed
- **Hit Sound**: Thud when player takes damage
- **Wave Complete**: Victory chime when completing a wave
- **Game Over**: Dramatic sound when defeated

Toggle sound on/off from the main menu with the 🔊/🔇 button.

## Gameplay

- Destroy alien enemies to earn points
- Survive waves of increasingly difficult enemies
- Collect power-ups (coming soon!)
- Don't let your health reach zero!

## Optimization

This game is optimized for Render's 512MB RAM and 0.15 CPU limits:
- Reduced particle effects (max 20 particles)
- Limited enemy count (max 15-20 enemies)
- Slower spawn rates (2 seconds base)
- Auto-scaled canvas resolution for mobile
- Minimal memory footprint
- No debug code or unnecessary logging

## Performance Tips

- Canvas auto-scales to 80% on mobile devices
- Particle effects are capped to prevent memory issues
- Enemy and bullet counts are limited
- Simple rendering without complex effects

## Score Tracking

Your best score is saved locally using localStorage under the key `xenowarBest`.

## Technical Details

- Pure JavaScript (no frameworks)
- HTML5 Canvas rendering
- 60 FPS gameplay
- Mobile-optimized touch controls
- Responsive design

## Credits

Inspired by classic space shooters and arcade games.
Optimized for the Mini Arcade platform.
