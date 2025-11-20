# Slither.io Multiplayer - Deployment Guide

## 🚀 Quick Start (Local Development)

### 1. Start the Slither Server

```bash
cd services/slither-server
npm install
npm start
```

Server will run on `http://localhost:3001`

### 2. Start the Main Website

```bash
# From project root
npm start
```

Website will run on `http://localhost:3000`

### 3. Test the Game

Open `http://localhost:3000/games/slither/` in your browser.

---

## 🌐 Production Deployment (Render.com)

### Option 1: Two Separate Services (Recommended)

#### Step 1: Deploy the Main Website

1. Create a new **Web Service** on Render
2. Connect your repository
3. Configure:
   - **Name**: `mini-arcade`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: (auto-set by Render)
     - `SLITHER_SERVER_URL`: `https://slither-server.onrender.com` (update after next step)

#### Step 2: Deploy the Slither Server

1. Create another **Web Service** on Render
2. Connect the same repository
3. Configure:
   - **Name**: `slither-server`
   - **Root Directory**: `services/slither-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: (auto-set by Render)
     - `WEBSITE_ORIGIN`: `https://mini-arcade.onrender.com` (your main website URL)

#### Step 3: Update Configuration

1. Get the Slither server URL from Render (e.g., `https://slither-server.onrender.com`)
2. Update the main website's `SLITHER_SERVER_URL` environment variable
3. Update `games/slither/index.html` line 9-11:
   ```html
   <script>
       window.__SLITHER_SERVER_URL__ = 'https://slither-server.onrender.com';
   </script>
   ```
4. Redeploy the main website

### Option 2: Using render.yaml (Infrastructure as Code)

Create `render.yaml` in project root:

```yaml
services:
  # Main Website
  - type: web
    name: mini-arcade
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        generateValue: true
      - key: SLITHER_SERVER_URL
        value: https://slither-server.onrender.com

  # Slither Multiplayer Server
  - type: web
    name: slither-server
    env: node
    buildCommand: cd services/slither-server && npm install
    startCommand: cd services/slither-server && npm start
    envVars:
      - key: PORT
        generateValue: true
      - key: WEBSITE_ORIGIN
        value: https://mini-arcade.onrender.com
```

Then in Render dashboard:
1. Create new **Blueprint**
2. Connect repository
3. Deploy both services at once

---

## 🔧 Configuration

### Client Configuration

Edit `games/slither/index.html`:

```html
<script>
    window.__SLITHER_SERVER_URL__ = 'YOUR_SERVER_URL';
</script>
```

Or set it programmatically in your build process.

### Server Configuration

Environment variables for `services/slither-server/.env`:

```env
PORT=3001                                    # Server port
WEBSITE_ORIGIN=http://localhost:3000        # CORS allowed origin
```

For production:
```env
PORT=10000                                   # Render auto-assigns
WEBSITE_ORIGIN=https://your-website.com     # Your website URL
```

---

## 🧪 Testing

### Test Server Health

```bash
curl http://localhost:3001/healthz
```

Expected response:
```json
{
  "status": "ok",
  "players": 0,
  "food": 1000
}
```

### Test Leaderboard API

```bash
curl http://localhost:3001/api/leaderboard
```

### Test in Browser

1. Open `http://localhost:3000/games/slither/`
2. Open browser console (F12)
3. Look for: `"Connected to server"`
4. Enter nickname and click Play
5. Check for: `"Joined game: {playerId: ..., worldSize: 5000}"`

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to game server"

**Causes:**
- Server not running
- Wrong server URL
- CORS issues

**Solutions:**
1. Check server is running: `curl http://localhost:3001/healthz`
2. Verify `window.__SLITHER_SERVER_URL__` matches server URL
3. Check server console for CORS errors
4. Ensure `WEBSITE_ORIGIN` includes your website URL

### Issue: Game starts but nothing happens

**Causes:**
- WebSocket connection failed
- Firewall blocking WebSocket

**Solutions:**
1. Check browser console for WebSocket errors
2. Try different network
3. Check Render logs for connection errors

### Issue: "Reconnecting..." message stuck

**Causes:**
- Server crashed
- Network issues

**Solutions:**
1. Check server health endpoint
2. Restart server
3. Check Render service logs

---

## 📊 Monitoring

### Server Logs

**Local:**
```bash
cd services/slither-server
npm start
```

**Render:**
- Go to your service dashboard
- Click "Logs" tab
- Monitor real-time logs

### Metrics to Watch

- **Players connected**: Check `/healthz` endpoint
- **Memory usage**: Should stay under 100MB for <50 players
- **CPU usage**: Should be <10% most of the time
- **Response time**: WebSocket latency should be <100ms

---

## 🔐 Security

### Rate Limiting

Score submissions are rate-limited to 5 requests per minute per IP.

### Data Validation

- Nicknames limited to 15 characters
- Server-side collision detection (no client-side cheating)
- Input sanitization on all endpoints

### CORS

Only allows connections from `WEBSITE_ORIGIN` domain.

---

## 💾 Data Persistence

### Score Storage

Scores are stored in `services/slither-server/data/scores.json`

**Important for Render:**
- Render uses ephemeral storage (files reset on restart)
- For persistent scores, consider:
  - External database (PostgreSQL, MongoDB)
  - Cloud storage (S3, Google Cloud Storage)
  - Supabase integration

### Adding Database (Optional)

To add PostgreSQL for persistent scores:

1. Add database dependency:
   ```bash
   cd services/slither-server
   npm install pg
   ```

2. Create database table:
   ```sql
   CREATE TABLE scores (
     id SERIAL PRIMARY KEY,
     nickname VARCHAR(15),
     length INTEGER,
     timestamp TIMESTAMP DEFAULT NOW()
   );
   ```

3. Update `server.js` to use database instead of JSON file

---

## 🎯 Performance Tips

### Client-Side
- Limit canvas render distance (already implemented)
- Use requestAnimationFrame for smooth rendering
- Throttle network messages (20 Hz is optimal)

### Server-Side
- Current tick rate: 20 Hz (good for 100+ players)
- Reduce tick rate to 15 Hz if experiencing lag
- Increase for more responsive gameplay (25-30 Hz)

### Network
- Use WebSocket (not polling) for best performance
- Enable compression in production
- Use CDN for static assets

---

## 📝 Checklist

### Before Deployment

- [ ] Install server dependencies: `cd services/slither-server && npm install`
- [ ] Test locally: Both services running
- [ ] Update `SLITHER_SERVER_URL` in client
- [ ] Update `WEBSITE_ORIGIN` in server
- [ ] Test game connection
- [ ] Check healthz endpoint
- [ ] Test on mobile device

### After Deployment

- [ ] Verify server is running (healthz check)
- [ ] Test game from production URL
- [ ] Check server logs for errors
- [ ] Test reconnection feature (restart server while playing)
- [ ] Monitor server resources
- [ ] Test leaderboard
- [ ] Test score submission

---

## 🆘 Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs
3. Verify all environment variables are set
4. Test with `curl` commands above
5. Check Render service status

---

## 🎉 Success!

When everything is working, you should see:

✅ Server health check returns `{"status": "ok"}`  
✅ Client connects and logs "Connected to server"  
✅ Players can join and move around  
✅ Leaderboard updates in real-time  
✅ Scores persist after game over  
✅ Reconnection works after disconnect  

**Enjoy your multiplayer Slither.io game!** 🐍
