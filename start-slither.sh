#!/bin/bash

echo "===================================="
echo "Starting Slither.io Multiplayer"
echo "===================================="
echo ""

echo "[1/2] Starting Slither Server (port 3001)..."
cd services/slither-server
npm start &
SLITHER_PID=$!
cd ../..
sleep 3

echo "[2/2] Starting Main Website (port 3000)..."
npm start &
WEBSITE_PID=$!
sleep 3

echo ""
echo "===================================="
echo "✅ Both servers are running!"
echo "===================================="
echo ""
echo "🎮 Game URL: http://localhost:3000/games/slither/"
echo "🐍 Server Health: http://localhost:3001/healthz"
echo ""
echo "Slither Server PID: $SLITHER_PID"
echo "Website PID: $WEBSITE_PID"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $SLITHER_PID $WEBSITE_PID; exit" SIGINT SIGTERM

# Open browser (works on macOS and Linux with xdg-open)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000/games/slither/
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/games/slither/
fi

# Keep script running
wait
