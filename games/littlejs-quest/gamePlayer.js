/*
    LittleJS Platformer Example - Player
    - Extends character class
    - Uses character physics system
    - Player can jump, shoot, roll, and throw grenades
    - Supports keyboard, mouse, and gamepad controls
    - Keeps track of player deaths
*/

'use strict';

// import LittleJS module
import * as LJS from './littlejs.esm.js';
import * as GameCharacter from './gameCharacter.js';
import * as Game from './game.js';

export class Player extends GameCharacter.Character
{
    constructor(pos, playerNumber = 1)
    {
        super(pos);
        this.playerNumber = playerNumber; // 1 or 2
        this.playerScore = 0; // Individual score per player
        
        // Set player color based on number
        if (playerNumber === 2) {
            this.color = LJS.hsl(0.9, 1, 0.6); // Pink for Player 2
        } else {
            this.color = LJS.hsl(0.6, 1, 0.6); // Blue for Player 1
        }
    }
    
    update()
    {
        // Player 1: WASD controls
        // Player 2: Arrow keys
        if (this.playerNumber === 1) {
            const moveX = (LJS.keyIsDown('KeyD') ? 1 : 0) - (LJS.keyIsDown('KeyA') ? 1 : 0);
            const moveY = (LJS.keyIsDown('KeyW') ? 1 : 0) - (LJS.keyIsDown('KeyS') ? 1 : 0);
            this.moveInput = LJS.vec2(moveX, moveY);
            this.holdingJump = LJS.keyIsDown('Space') || LJS.keyIsDown('KeyW');
            this.holdingShoot = LJS.keyIsDown('KeyZ') || LJS.mouseIsDown(0);
            this.pressingThrow = LJS.keyIsDown('KeyC');
            this.pressedDodge = LJS.keyIsDown('KeyX');
        } else {
            // Player 2: Arrow keys
            const moveX = (LJS.keyIsDown('ArrowRight') ? 1 : 0) - (LJS.keyIsDown('ArrowLeft') ? 1 : 0);
            const moveY = (LJS.keyIsDown('ArrowUp') ? 1 : 0) - (LJS.keyIsDown('ArrowDown') ? 1 : 0);
            this.moveInput = LJS.vec2(moveX, moveY);
            this.holdingJump = LJS.keyIsDown('ArrowUp');
            this.holdingShoot = LJS.keyIsDown('KeyM');
            this.pressingThrow = LJS.keyIsDown('KeyN');
            this.pressedDodge = LJS.keyIsDown('KeyB');
        }
        
        super.update();
    }

    kill()
    {
        Game.addToDeaths(this.playerNumber);
        super.kill();
    }
    
    addScore(delta = 1)
    {
        this.playerScore += delta;
        Game.addToScore(delta, this.playerNumber);
    }
}