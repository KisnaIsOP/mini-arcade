/*
Snake Game - Enhanced for Mini Arcade
Original by Learn Web Development
Enhanced with mobile support, scoring, and multiplayer integration
*/

const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");

// create the unit
const box = 32;

// load images
const ground = new Image();
ground.src = "img/ground.png";

const foodImg = new Image();
foodImg.src = "img/food.png";

// load audio files
let dead = new Audio();
let eat = new Audio();
let up = new Audio();
let right = new Audio();
let left = new Audio();
let down = new Audio();

dead.src = "audio/dead.mp3";
eat.src = "audio/eat.mp3";
up.src = "audio/up.mp3";
right.src = "audio/right.mp3";
left.src = "audio/left.mp3";
down.src = "audio/down.mp3";

// Game state
let gameRunning = false;
let gameStarted = false;

// create the snake
let snake = [];
snake[0] = {
    x: 9 * box,
    y: 10 * box
};

// create the food
let food = {
    x: Math.floor(Math.random() * 17 + 1) * box,
    y: Math.floor(Math.random() * 15 + 3) * box
};

// create the score var
let score = 0;

// control the snake
let d;

// Get username from localStorage or prompt
let username = localStorage.getItem('username') || null;

// Mobile touch support
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Game loop interval
let game;

// Initialize the game
function init() {
    setupEventListeners();
    loadLeaderboard();
    startGame();
}

// Setup all event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", direction);
    
    // Mobile button controls
    document.getElementById('upBtn').addEventListener('click', () => moveSnake('UP'));
    document.getElementById('downBtn').addEventListener('click', () => moveSnake('DOWN'));
    document.getElementById('leftBtn').addEventListener('click', () => moveSnake('LEFT'));
    document.getElementById('rightBtn').addEventListener('click', () => moveSnake('RIGHT'));
    
    // Touch/swipe controls
    cvs.addEventListener('touchstart', handleTouchStart, { passive: false });
    cvs.addEventListener('touchmove', handleTouchMove, { passive: false });
    cvs.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Game over modal buttons
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = '../../index.html';
    });
    
    // Prevent default touch behaviors on canvas
    cvs.addEventListener('touchstart', (e) => e.preventDefault());
    cvs.addEventListener('touchmove', (e) => e.preventDefault());
}

// Handle touch start
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

// Handle touch move
function handleTouchMove(event) {
    if (!touchStartX || !touchStartY) return;
    
    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;
}

// Handle touch end
function handleTouchEnd(event) {
    if (!touchStartX || !touchStartY) return;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                moveSnake('RIGHT');
            } else {
                moveSnake('LEFT');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                moveSnake('DOWN');
            } else {
                moveSnake('UP');
            }
        }
    }
    
    // Reset touch coordinates
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
}

// Keyboard direction control
function direction(event) {
    let key = event.keyCode;
    if (key == 37 && d != "RIGHT") {
        moveSnake('LEFT');
    } else if (key == 38 && d != "DOWN") {
        moveSnake('UP');
    } else if (key == 39 && d != "LEFT") {
        moveSnake('RIGHT');
    } else if (key == 40 && d != "UP") {
        moveSnake('DOWN');
    }
}

// Move snake function
function moveSnake(direction) {
    if (!gameRunning) return;
    
    switch(direction) {
        case 'LEFT':
            if (d != "RIGHT") {
                left.play();
                d = "LEFT";
            }
            break;
        case 'UP':
            if (d != "DOWN") {
                up.play();
                d = "UP";
            }
            break;
        case 'RIGHT':
            if (d != "LEFT") {
                right.play();
                d = "RIGHT";
            }
            break;
        case 'DOWN':
            if (d != "UP") {
                down.play();
                d = "DOWN";
            }
            break;
    }
}

// Check collision function
function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x == array[i].x && head.y == array[i].y) {
            return true;
        }
    }
    return false;
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('scoreDisplay').textContent = score;
}

// Draw everything to the canvas
function draw() {
    if (!gameRunning) return;
    
    ctx.drawImage(ground, 0, 0);
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i == 0) ? "green" : "white";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        
        ctx.strokeStyle = "red";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }
    
    // Draw food
    ctx.drawImage(foodImg, food.x, food.y);
    
    // old head position
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;
    
    // which direction
    if (d == "LEFT") snakeX -= box;
    if (d == "UP") snakeY -= box;
    if (d == "RIGHT") snakeX += box;
    if (d == "DOWN") snakeY += box;
    
    // if the snake eats the food
    if (snakeX == food.x && snakeY == food.y) {
        score++;
        updateScoreDisplay();
        eat.play();
        
        // Broadcast score update if in multiplayer mode
        if (typeof multiplayerCore !== 'undefined' && multiplayerCore.isConnected()) {
            multiplayerCore.broadcast('score_update', {
                game: 'snake',
                user: username || 'Guest',
                score: score
            });
        }
        
        food = {
            x: Math.floor(Math.random() * 17 + 1) * box,
            y: Math.floor(Math.random() * 15 + 3) * box
        };
        // we don't remove the tail
    } else {
        // remove the tail
        snake.pop();
    }
    
    // add new Head
    let newHead = {
        x: snakeX,
        y: snakeY
    };
    
    // wrap-around movement instead of wall collision
    if (snakeX < box) {
        snakeX = 17 * box; // wrap to rightmost tile
    } else if (snakeX > 17 * box) {
        snakeX = box; // wrap to leftmost tile
    }
    
    if (snakeY < 3 * box) {
        snakeY = 17 * box; // wrap to bottom tile
    } else if (snakeY > 17 * box) {
        snakeY = 3 * box; // wrap to top tile
    }
    
    // update newHead with wrapped coordinates
    newHead = {
        x: snakeX,
        y: snakeY
    };
    
    // game over only on self-collision
    if (collision(newHead, snake)) {
        gameOver();
        return;
    }
    
    snake.unshift(newHead);
    
    // Draw score on canvas
    ctx.fillStyle = "white";
    ctx.font = "45px Changa one";
    ctx.fillText(score, 2 * box, 1.6 * box);
}

// Start the game
function startGame() {
    gameRunning = true;
    gameStarted = true;
    game = setInterval(draw, 100);
}

// Game over function
function gameOver() {
    gameRunning = false;
    clearInterval(game);
    dead.play();
    
    // Show final score
    document.getElementById('finalScore').textContent = score;
    
    // Get player name for high score
    if (!username) {
        document.getElementById('playerName').focus();
    } else {
        document.getElementById('playerName').value = username;
    }
    
    // Save score
    saveGameScore();
    
    // Show game over modal
    document.getElementById('gameOverModal').classList.remove('hidden');
}

// Save score function
function saveGameScore() {
    const playerName = document.getElementById('playerName').value.trim() || username || 'Guest';
    
    // Save to localStorage
    if (playerName !== 'Guest') {
        localStorage.setItem('username', playerName);
        username = playerName;
    }
    
    // Save score using Mini Arcade's scoring system
    if (typeof saveScore !== 'undefined') {
        saveScore('snake', playerName, score);
    }
    
    // Broadcast final score if in multiplayer mode
    if (typeof multiplayerCore !== 'undefined' && multiplayerCore.isConnected()) {
        multiplayerCore.broadcast('game_complete', {
            game: 'snake',
            user: playerName,
            score: score
        });
    }
    
    // Reload leaderboard
    setTimeout(loadLeaderboard, 500);
}

// Load and display leaderboard
function loadLeaderboard() {
    if (typeof fetchTopScores === 'undefined') return;
    
    fetchTopScores('snake', 10).then(scores => {
        const leaderboardList = document.getElementById('leaderboardList');
        
        if (scores && scores.length > 0) {
            leaderboardList.innerHTML = scores.map((score, index) => `
                <div class="flex justify-between items-center p-2 bg-gray-800/50 rounded border border-gray-700">
                    <div class="flex items-center space-x-2">
                        <span class="text-yellow-400 font-bold w-6">${index + 1}.</span>
                        <span class="text-white">${score.username}</span>
                    </div>
                    <span class="text-blue-400 font-bold">${score.score}</span>
                </div>
            `).join('');
        } else {
            leaderboardList.innerHTML = '<div class="text-gray-400 text-center py-4">No scores yet!</div>';
        }
    }).catch(err => {
        console.error('Error loading leaderboard:', err);
        document.getElementById('leaderboardList').innerHTML = '<div class="text-red-400 text-center py-4">Error loading scores</div>';
    });
}

// Restart game function
function restartGame() {
    // Hide modal
    document.getElementById('gameOverModal').classList.add('hidden');
    
    // Reset game state
    snake = [];
    snake[0] = {
        x: 9 * box,
        y: 10 * box
    };
    
    food = {
        x: Math.floor(Math.random() * 17 + 1) * box,
        y: Math.floor(Math.random() * 15 + 3) * box
    };
    
    score = 0;
    d = undefined;
    updateScoreDisplay();
    
    // Start new game
    startGame();
}

// Initialize game when page loads
window.addEventListener('load', init);

// Handle multiplayer events
if (typeof multiplayerCore !== 'undefined') {
    multiplayerCore.on('user_joined', (data) => {
        console.log(`${data.username} joined the game!`);
    });
    
    multiplayerCore.on('score_update', (data) => {
        if (data.game === 'snake') {
            console.log(`${data.user} scored: ${data.score}`);
            // You could show a notification here
        }
    });
}