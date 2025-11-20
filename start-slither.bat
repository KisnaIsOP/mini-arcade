@echo off
echo ====================================
echo Starting Slither.io Multiplayer
echo ====================================
echo.

echo [1/2] Starting Slither Server (port 3001)...
start "Slither Server" cmd /k "cd services\slither-server && npm start"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Main Website (port 3000)...
start "Mini Arcade Website" cmd /k "npm start"
timeout /t 3 /nobreak > nul

echo.
echo ====================================
echo ✅ Both servers are starting!
echo ====================================
echo.
echo 🎮 Game URL: http://localhost:3000/games/slither/
echo 🐍 Server Health: http://localhost:3001/healthz
echo.
echo Press any key to open the game in your browser...
pause > nul

start http://localhost:3000/games/slither/
