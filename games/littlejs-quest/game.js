/*
    Little JS Platforming Game
    - A basic platforming starter project
    - Platforming physics and controls
    - Includes destructible terrain
    - Control with keyboard, mouse, touch, or gamepad
*/

'use strict';

// import LittleJS module
import * as LJS from './littlejs.esm.js';
import * as GameObjects from './gameObjects.js';
import * as GameEffects from './gameEffects.js';
import * as GamePlayer from './gamePlayer.js';
import * as GameLevel from './gameLevel.js';
const {vec2} = LJS;

// globals
export let gameLevelData, spriteAtlas, player, player2, score, deaths, score1, score2, deaths1, deaths2;
export function addToScore(delta=1, playerNum=1) { 
    score += delta;
    if (playerNum === 1) score1 += delta;
    else score2 += delta;
}
export function addToDeaths(playerNum=1) { 
    ++deaths;
    if (playerNum === 1) ++deaths1;
    else ++deaths2;
}

// enable touch gamepad on touch devices
LJS.setTouchGamepadEnable(true);

// limit canvas aspect ratios to support most modern HD devices
LJS.setCanvasMinAspect(.4);
LJS.setCanvasMaxAspect(2.5);

// limit size to to 4k HD
LJS.setCanvasMaxSize(vec2(3840, 2160));

///////////////////////////////////////////////////////////////////////////////
function loadLevel()
{
    // setup level
    GameLevel.buildLevel();
    
    // spawn player 1
    player = new GamePlayer.Player(GameLevel.playerStartPos, 1);
    
    // spawn player 2 (offset slightly to the right)
    const player2Pos = GameLevel.playerStartPos.add(LJS.vec2(2, 0));
    player2 = new GamePlayer.Player(player2Pos, 2);
    
    LJS.setCameraPos(GameLevel.getCameraTarget());

    // init game
    score = deaths = 0;
    score1 = score2 = deaths1 = deaths2 = 0;
}

///////////////////////////////////////////////////////////////////////////////
async function gameInit()
{
    // load the game level data
    gameLevelData = await LJS.fetchJSON('gameLevelData.json');

    // engine settings
    LJS.setGravity(vec2(0,-.01));
    LJS.setObjectDefaultDamping(.99);
    LJS.setObjectDefaultAngleDamping(.99);
    LJS.setCameraScale(4*16);

    // create a table of all sprites
    const gameTile = (i, size=16)=> LJS.tile(i, size, 0, 1);
    spriteAtlas =
    {
        // large tiles
        circle:  gameTile(0),
        crate:   gameTile(1),
        player:  gameTile(2),
        enemy:   gameTile(4),
        coin:    gameTile(5),

        // small tiles
        gun:     gameTile(vec2(0,2),8),
        grenade: gameTile(vec2(1,2),8),
    };

    loadLevel();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // respawn player 1
    if (player.deadTimer > 1)
    {
        player = new GamePlayer.Player(GameLevel.playerStartPos, 1);
        player.velocity = vec2(0,.1);
        GameEffects.sound_jump.play();
    }
    
    // respawn player 2
    if (player2.deadTimer > 1)
    {
        const player2Pos = GameLevel.playerStartPos.add(LJS.vec2(2, 0));
        player2 = new GamePlayer.Player(player2Pos, 2);
        player2.velocity = vec2(0,.1);
        GameEffects.sound_jump.play();
    }
    
    // R = restart level
    if (LJS.keyWasPressed('KeyR'))
        loadLevel();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    // update camera to focus on midpoint between both players
    const p1Pos = player.pos;
    const p2Pos = player2.pos;
    const midpoint = p1Pos.add(p2Pos).scale(0.5);
    LJS.setCameraPos(LJS.cameraPos.lerp(midpoint, LJS.clamp(player.getAliveTime()/2)));
}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // draw to main canvas for hud rendering
    const drawText = (text, x, y, size=40, color='#fff')=>
    {
        const context = LJS.mainContext;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.font = size + 'px arial';
        context.fillStyle = color;
        context.lineWidth = 3;
        context.strokeText(text, x, y);
        context.fillText(text, x, y);
    }
    
    // Player 1 HUD (top-left, blue)
    drawText('P1: ' + score1, 80, 20, 30, '#66b3ff');
    
    // Player 2 HUD (top-right, pink)
    drawText('P2: ' + score2, LJS.mainCanvas.width - 80, 20, 30, '#ff66b3');
    
    // Total stats (center)
    drawText('Total: ' + score, LJS.mainCanvas.width/2, 60, 25);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png', 'tilesLevel.png']);