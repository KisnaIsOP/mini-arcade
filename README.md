# 🎮 Mini Arcade - Fun Games Collection

A collection of 4 exciting browser-based mini games built with HTML, TailwindCSS, and JavaScript.

![Mini Arcade](https://img.shields.io/badge/Mini-Arcade-purple?style=for-the-badge&logo=gamepad)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

## 🎯 Games Included

### ⚡ Reaction Test
Test your reflexes! Click when the button turns green and see how fast your reaction time is.
- **Challenge**: Click as soon as the color changes
- **Scoring**: Measured in milliseconds (lower is better)
- **Features**: Anti-cheat system, best time tracking

### 👆 Click Speed Test
How many clicks can you manage in 5 seconds?
- **Challenge**: Click as fast as possible for 5 seconds
- **Scoring**: Clicks Per Second (CPS)
- **Features**: Real-time CPS calculation, ripple effects

### 🎯 Aim Trainer
Test your precision and speed with moving targets!
- **Challenge**: Hit as many targets as possible in 10 seconds
- **Scoring**: Points based on target size (smaller = more points)
- **Features**: Different target sizes, accuracy tracking

### 🧠 Memory Flip Game
Match pairs in a 4x4 grid using your memory skills!
- **Challenge**: Find all 8 matching pairs
- **Scoring**: Completion time and move count
- **Features**: 3D card flip animations, preview mode

## ✨ Features

- 🎨 **Beautiful UI**: Modern gradient backgrounds and smooth animations
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- 🏆 **Score Tracking**: Local storage saves your best scores with leaderboards
- 🎵 **Interactive**: Hover effects, click animations, and feedback
- ⚡ **Fast Loading**: Pure vanilla JavaScript, no frameworks needed
- 🌟 **Accessibility**: Keyboard and touch-friendly
- 🔐 **Authentication System**: Secure login/register with client-side hashing
- 🌐 **Multiplayer Support**: Real-time multiplayer with Supabase integration
- 👥 **Player Presence**: See who's online and compete in real-time
- 📊 **Advanced Leaderboards**: Track best scores and recent performance

## 🚀 Quick Start

### Local Development (Demo Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/KisnaIsOP/mini-arcade.git
   ```

2. Navigate to the project folder:
   ```bash
   cd mini-arcade
   ```

3. Open `index.html` in your browser or serve with a local server:
   ```bash
   # Using Python (if installed)
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx serve .
   
   # Or simply double-click index.html
   ```

4. Start playing! 🎮 (Runs in demo mode with simulated multiplayer)

### Production Setup (Real Multiplayer)

#### Step 1: Supabase Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free)
2. **Run the SQL migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste contents of `supabase_schema.sql`
   - Click "RUN" to create tables and functions

3. **Get your credentials** from Project Settings → API:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Step 2: Environment Configuration

Create `.env` file (or set environment variables):
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
IS_DEMO=false
USE_SUPABASE_AUTH=false
```

#### Step 3: Deployment Options

**Option A: Render.com (Recommended)**
1. Fork/push repository to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard:
   ```
   SUPABASE_URL = https://wmrcrrfhyaqmyftxksty.supabase.co
   SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcmNycmZoeWFxbXlmdHhrc3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODk1NzksImV4cCI6MjA3OTA2NTU3OX0.yKjmGSIMTZSQVh8LDT1kDGOIuJEmmOI7nqxSgLJcIXM
   IS_DEMO = false
   USE_SUPABASE_AUTH = false
   ```
5. Deploy and test!

**Option B: Local Production Testing**
```bash
# Set environment variables
export SUPABASE_URL="https://wmrcrrfhyaqmyftxksty.supabase.co"
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcmNycmZoeWFxbXlmdHhrc3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODk1NzksImV4cCI6MjA3OTA2NTU3OX0.yKjmGSIMTZSQVh8LDT1kDGOIuJEmmOI7nqxSgLJcIXM"
export IS_DEMO="false"

# Start local server
npm start
# or
python -m http.server 8000
```

## 📁 Project Structure

```
mini-arcade/
├── index.html        # Home page with game selection and mode switching
├── auth.html         # Login/register page
├── auth.js          # Authentication system
├── supabase.js      # Multiplayer integration
├── reaction.html     # Reaction test game
├── clickspeed.html   # Click speed challenge
├── aimtrainer.html   # Aim training game
├── memory.html       # Memory flip game
├── server.js         # Express server for deployment
├── package.json      # Node.js dependencies
└── README.md         # This file
```

## 🧪 Complete Testing Guide

### 🔐 Authentication System Testing

#### Registration Flow:
1. **Go to Home Page** → Click "Multiplayer" mode
2. **Auto-redirect to auth.html** (since not logged in)
3. **Click "Register" tab**
4. **Test Validation**:
   - Try username < 3 chars → Should show error
   - Try password < 6 chars → Should show error
   - Try mismatched passwords → Should show error
   - Use special characters in username → Should show error
5. **Create Valid Account**: username: "testuser", password: "test123"
6. **Success**: Should show success message and switch to login tab

#### Login Flow:
1. **Test Wrong Credentials**: Should show "Invalid username or password"
2. **Test Correct Credentials**: Should show "Login successful! Redirecting..."
3. **Auto-redirect**: Should return to original multiplayer game
4. **Header Update**: Username should appear in header with logout option

#### Session Management:
1. **Reload Page**: Should stay logged in (session persists)
2. **Wait 24+ Hours**: Session should auto-expire
3. **Logout**: Click logout → Should clear session and reload page

### 🎮 Singleplayer vs Multiplayer Testing

#### Singleplayer Mode (Default):
```
✅ No authentication required
✅ All games work immediately  
✅ Local high scores saved
✅ Leaderboards track personal progress
✅ Works completely offline
```

#### Multiplayer Mode:
```
✅ Requires login (auto-redirects to auth)
✅ Shows "Welcome back, username!" in header
✅ Online players list in games
✅ Real-time score broadcasting
✅ Live notifications from other players
✅ Connection status indicators
```

### 🌐 Multiplayer Features Testing

#### Demo Mode Testing (Current Setup):
1. **Enable Multiplayer**: Login and switch to multiplayer mode
2. **Open Reaction Game**: Should show "Multiplayer" mode indicator
3. **See Demo Players**: 2-4 fake players should appear in player list
4. **Play Game**: Complete a reaction test
5. **Score Broadcasting**: Your score should be logged to console
6. **Receive Notifications**: Demo players will occasionally score

#### Multi-Browser Testing:
1. **Open 2+ Browser Windows**
2. **Login with Different Accounts** in each:
   - Window 1: "player1" / "test123"
   - Window 2: "player2" / "test123"
3. **Play Games**: Complete games in each window
4. **See Live Updates**: Player joins/leaves, score notifications

### 🎯 Reaction Game Multiplayer Testing

#### Features to Test:
```bash
# Visual Elements
✅ Mode indicator shows "Multiplayer" (green)
✅ Online players list appears
✅ Connection status indicator (green = connected)
✅ Game description updates for multiplayer

# Real-time Features  
✅ Player join/leave notifications (left side)
✅ Score notifications from other players (right side)
✅ Live player list updates
✅ Console logging for all multiplayer events

# Score Broadcasting
✅ Complete game → score broadcasts to others
✅ Other players receive score notifications
✅ Console shows "📡 Broadcasting reaction score: XXXms"
```

### 🛠️ Developer Testing Commands

Open browser console and use these debugging commands:

#### Authentication Debug:
```javascript
// Check current auth status
authDebug.getUserStats()
// Returns: {totalUsers: X, currentUser: "username", isAuthenticated: true}

// View all registered users
authDebug.getUsers()

// Clear all auth data (reset)
authDebug.clearAllData()

// Find specific user
authDebug.findUser("testuser")
```

#### Multiplayer Debug:
```javascript
// Check multiplayer status
multiplayerDebug.getStatus()
// Returns: {connected: true, mode: "demo", playerCount: X, clientId: "..."}

// View active players
multiplayerDebug.getPlayers()

// Manually broadcast test score
multiplayerDebug.broadcast('score_update', {
  user: 'TestUser', 
  game: 'reaction', 
  score: 200,
  timestamp: new Date().toISOString()
})

// Reconnect multiplayer
multiplayerDebug.reconnect()
```

#### localStorage Inspection:
```javascript
// View stored users
JSON.parse(localStorage.getItem('miniArcade_users'))

// View current session
JSON.parse(localStorage.getItem('miniArcade_currentUser'))

// View game scores
localStorage.getItem('reactionBest')
JSON.parse(localStorage.getItem('reactionRecent'))
```

### 📱 Mobile Testing

1. **Responsive Design**: 
   - Test on mobile browsers (Chrome Mobile, Safari iOS)
   - All UI elements should be touch-friendly
   - Mode selection should work on small screens

2. **Touch Interactions**:
   - Tap game cards to navigate
   - Auth forms should work with mobile keyboards
   - Game controls should be responsive to touch

### 🚀 Production Multiplayer Setup

To switch from demo mode to real Supabase multiplayer:

1. **Create Supabase Project**: 
   - Go to [supabase.com](https://supabase.com)
   - Create free account and new project

2. **Get Credentials**:
   - Copy Project URL and Anon Key from API settings

3. **Update supabase.js**:
   ```javascript
   // Replace these lines in supabase.js
   this.SUPABASE_URL = 'https://your-project-id.supabase.co';
   this.SUPABASE_ANON_KEY = 'your-anon-key-here';
   this.isDemo = false; // Switch to production
   ```

4. **Add Supabase Client**:
   ```html
   <!-- Add to HTML pages before supabase.js -->
   <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
   ```

5. **Enable Realtime**: In Supabase dashboard, enable Realtime for your project

### ✅ Expected Test Results

#### Working Demo Mode:
- ✅ Authentication: Full register/login/logout cycle
- ✅ Mode switching: Singleplayer ↔ Multiplayer  
- ✅ Demo players: 2-4 fake players appear
- ✅ Score broadcasting: Console shows transmission
- ✅ Notifications: Player join/leave/score alerts
- ✅ Leaderboards: Personal scores tracked
- ✅ Session persistence: Login survives page reload

#### Console Output (Normal):
```
🎮 Mini Arcade Auth System loaded successfully!
🌐 Supabase Multiplayer System loaded successfully!
🎮 Current mode: DEMO (change isDemo = false for production)
🎮 Welcome back, testuser!
🌐 Auto-initializing multiplayer for authenticated user
🎮 DEMO MODE: Multiplayer running with simulated players
👋 Player joined: AlexGamer
📡 [DEMO] Broadcasting score_update: ...
🏆 Received score from AlexGamer: 245ms
```

This comprehensive testing ensures all authentication and multiplayer features work correctly before deployment!

## 🚀 Production Deployment Guide

### Render.com Deployment Steps

1. **Prepare Repository**:
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

2. **Create Render Web Service**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"  
   - Connect your GitHub repository: `mini-arcade`
   - Configure service:
     - **Name**: `mini-arcade`
     - **Region**: Choose closest to your location
     - **Branch**: `main`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set Environment Variables** in Render dashboard:
   ```
   SUPABASE_URL = https://wmrcrrfhyaqmyftxksty.supabase.co
   SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcmNycmZoeWFxbXlmdHhrc3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0ODk1NzksImV4cCI6MjA3OTA2NTU3OX0.yKjmGSIMTZSQVh8LDT1kDGOIuJEmmOI7nqxSgLJcIXM
   IS_DEMO = false
   USE_SUPABASE_AUTH = false
   ```

4. **Deploy**: Click "Create Web Service" and wait for deployment

5. **Test Live Site**: Your app will be available at `https://mini-arcade-[random].onrender.com`

### Supabase Database Migration

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Copy entire contents of supabase_schema.sql and run
-- This creates the scores table, functions, and policies
```

Or via command line (if you have Supabase CLI):
```bash
supabase db reset
supabase db push
```

### Post-Deployment Testing Checklist

#### ✅ Authentication Tests
- [ ] Register new account works
- [ ] Login with credentials works  
- [ ] Session persists after page reload
- [ ] Logout clears session
- [ ] Multiplayer requires login (redirects to auth)

#### ✅ Multiplayer Tests  
- [ ] Production mode enabled (no demo players)
- [ ] Real-time player presence works
- [ ] Score broadcasting between players works
- [ ] Connection status shows "Connected" 
- [ ] Heartbeat/ping system active (check console)

#### ✅ Database Tests
- [ ] Scores save to Supabase database
- [ ] Leaderboards load from database
- [ ] Hybrid local + database display works
- [ ] Score validation prevents invalid data
- [ ] Database health check passes

#### ✅ Performance Tests
- [ ] Games load quickly on mobile
- [ ] Multiplayer notifications appear promptly
- [ ] Database queries respond in <1 second
- [ ] No console errors during gameplay

### Two-Browser Testing Procedure

1. **Open two different browsers** (e.g., Chrome and Firefox)
2. **Register different accounts** in each:
   - Browser 1: username "player1", password "test123"
   - Browser 2: username "player2", password "test123"  
3. **Switch both to multiplayer mode**
4. **Open same game** (e.g., Reaction Test) in both browsers
5. **Verify real-time features**:
   - Each browser shows the other player in "Online Players" list
   - Complete a game in browser 1 → browser 2 receives score notification
   - Complete a game in browser 2 → browser 1 receives score notification
   - Check database for both scores in Supabase dashboard

### Environment Variable Reference

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://wmrcrrfhyaqmyftxksty.supabase.co` |
| `SUPABASE_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `IS_DEMO` | Enable/disable demo mode | `false` (production), `true` (demo) |
| `USE_SUPABASE_AUTH` | Use Supabase Auth instead of local auth | `false` (local), `true` (Supabase) |

### Debug Console Commands (Production)

```javascript
// Check production multiplayer status
multiplayerDebug.getStatus()
// Should show: {connected: true, mode: "production", playerCount: X}

// Test database connection  
scoresDebug.healthCheck()
// Should show: {status: "healthy", database: true}

// Check auth system
authDebug.getUserStats()  
// Should show current user and auth status

// Manually test score saving
scoresDebug.saveTestScore('reaction', 245)
// Should save to database in production mode
```

### Troubleshooting Common Issues

**❌ "Demo mode" still showing in production**:
- Check environment variable `IS_DEMO=false` is set correctly
- Verify environment variables are loaded (check console logs)

**❌ Multiplayer not connecting**:  
- Verify Supabase credentials are correct
- Check Supabase project has Realtime enabled
- Ensure no firewall/proxy blocking WebSocket connections

**❌ Scores not saving to database**:
- Check Supabase SQL migration ran successfully
- Verify database table permissions (RLS policies)
- Test database connection with health check

**❌ Authentication redirects not working**:
- Ensure auth.js is loaded before other scripts
- Check localStorage is enabled in browser
- Verify session timeout settings (24 hours default)

This completes the production deployment guide for real multiplayer functionality!

## 🎮 How to Play

### Reaction Test
1. Click "START" to begin
2. Wait for the button to turn GREEN (don't click too early!)
3. Click as fast as you can when it changes color
4. Try to beat your best time!

### Click Speed Test
1. Click the button to start the 5-second timer
2. Click as fast as you can until time runs out
3. Achieve the highest CPS (Clicks Per Second) possible
4. Try different clicking techniques!

### Aim Trainer
1. Click "Start Game" to begin
2. Click on targets as they appear (10-second timer)
3. Smaller targets give more points
4. Aim for high accuracy and score!

### Memory Flip Game
1. Click "Start Game" and memorize the 2-second preview
2. Click cards to flip them and find matching pairs
3. Match all 8 pairs in the fewest moves possible
4. Beat your best completion time!

## 🏆 Scoring System

| Game | Scoring Method | Goal |
|------|---------------|------|
| **Reaction Test** | Milliseconds (ms) | Lower is better |
| **Click Speed** | Clicks Per Second (CPS) | Higher is better |
| **Aim Trainer** | Points (Small=10, Medium=5, Large=2) | Higher is better |
| **Memory Flip** | Completion time + move count | Faster with fewer moves |

## 🛠️ Technologies Used

- **HTML5**: Semantic markup and structure
- **TailwindCSS**: Utility-first CSS framework for styling
- **JavaScript (ES6+)**: Game logic and interactivity
- **CSS3**: Custom animations and transitions
- **LocalStorage**: Persistent score tracking

## 📱 Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Design Features

- **Gradient Backgrounds**: Eye-catching color schemes for each game
- **Smooth Animations**: CSS3 transitions and keyframe animations
- **Responsive Design**: Looks great on desktop, tablet, and mobile
- **Interactive Effects**: Hover states, click feedback, particle effects
- **Modern UI**: Glass morphism, rounded corners, shadows

## 🚀 Performance

- **Lightweight**: No external dependencies except TailwindCSS CDN
- **Fast Loading**: Optimized images and minimal JavaScript
- **Smooth Animations**: 60 FPS animations using CSS transforms
- **Memory Efficient**: Clean event listeners and proper cleanup

## 📈 Future Enhancements

- [ ] Leaderboards with online sync
- [ ] More game modes and difficulties
- [ ] Achievement system
- [ ] Sound effects and music
- [ ] Progressive Web App (PWA) support
- [ ] Multiplayer challenges
- [ ] Custom themes

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ by [Your Name]

---

**Enjoy the games and challenge your friends! 🎮**