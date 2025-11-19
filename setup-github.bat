@echo off
echo Setting up Mini Arcade GitHub Repository...
echo.

REM Initialize git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Add full multiplayer support to all 4 Mini Arcade games

- Implemented shared multiplayer engine (multiplayer-core.js)
- Added real-time competition for Reaction Test, Click Speed, Aim Trainer, Memory Flip
- Room-based channels with player presence tracking
- Live score broadcasting and progress updates
- Comprehensive UI with player lists and live leaderboards
- Database integration with Supabase
- Authentication system for multiplayer mode
- Anti-cheat and connection management features"

echo.
echo Git repository initialized successfully!
echo.
echo Next steps:
echo 1. Create a new repository on GitHub.com named "mini-arcade"
echo 2. Copy your repository URL (should look like: https://github.com/USERNAME/mini-arcade.git)
echo 3. Run the upload-to-github.bat file with your repository URL
echo.
pause