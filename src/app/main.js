// @ts-check
import {
    /* system */ init, Sprite, GameLoop, Pool,
    /* mouse  */ initPointer, track, getPointer, pointerPressed,
    /* maths  */ angleToTarget, clamp, movePoint, lerp
    /* Vector is imported through Sprite, GameObject, Updatable */
} from 'kontra';
import { colors } from './colors.js';

import { loadImages } from './images.js';
import { ArcadeAudio } from './audio.js';
// import { CanvasRenderingContext2D } from 'canvas';


async function start() {
    /**
     * behaviours:
     * w=walk(strafe, speed, targetX, targetY), // infinite aggro range
     * <=chase,  // chase at speed of 1
     * >=avoid,  // avoid at speed of 1
     * .=wander, // wander at speed of 0.2
     * d=solid,  // try not to collide with others
     * D=static, // stops others from hitting
     * W=wall,   // static, plus absorbs bullets
     * m=melee,  // does knockback on both sides
     * s=shooty(spellCard),
     * // b=box()     // gives item
     */


    // loading
    const images = await loadImages();

    const audio = new ArcadeAudio();
    // audio.volume = 0; // TODO: make mute button


    const _focus = () => focus();
    // const canvas2 = document.querySelector('#b');
    // const context2 = canvas2.getContext('2d');
    // init
    let { canvas, context } = init('a');
    canvas.addEventListener('pointerenter', _focus);
    context.imageSmoothingEnabled = false;
    // context2.imageSmoothingEnabled = false;
    initPointer();


    let player = Sprite({
        /* #IfDev */
        name: 'player',
        /* #EndIfDev */
        x: canvas.width / 2,        // starting x,y position of the sprite
        y: canvas.height / 2 + 50,
        // color: 'red',  // fill color of the sprite rectangle
        // width: 20,     // width and height of the sprite rectangle
        // height: 40,
        // dx: 2,
        // dy: 2,
        image: images.playerPhysical,
        anchor: { x: 0.5, y: 0.5 },

        // custom properties
        dimension: 0, // 0=physical, 1=spectral
    });

    // function lerpRadians(a, b, lerpFactor)// Lerps from angle a to b (both between 0.f and 2*Math.PI), taking the shortest path
    // {
    //     let result;
    //     let diff = b - a;
    //     if (diff < -Math.PI) {
    //         // lerp upwards past 2*Math.PI
    //         b += 2 * Math.PI;
    //         result = lerp(a, b, lerpFactor);
    //         if (result >= 2 * Math.PI) {
    //             result -= 2 * Math.PI;
    //         }
    //     }
    //     else if (diff > Math.PI) {
    //         // lerp downwards past 0
    //         b -= 2 * Math.PI;
    //         result = lerp(a, b, lerpFactor);
    //         if (result < 0) {
    //             result += 2 * Math.PI;
    //         }
    //     }
    //     else {
    //         // straight lerp
    //         result = lerp(a, b, lerpFactor);
    //     }

    //     return result;
    // }
    // function randomUnitVector() {
    //     const rotation = Math.random() * 2 * Math.PI;
    //     return {
    //         x: Math.cos(rotation),
    //         y: Math.sin(rotation),
    //     }
    // }
    // function dist(a, b) { // not using it saves more space ?!
    //     return Math.hypot(a.x - b.x, a.y - b.y);
    // }

    // function getFreeSpace() {
    //     for (let trial = 0; trial < 100; trial++) {
    //         const pos = {
    //             x: Math.random() * (canvas.width - 100) + 50,
    //             y: Math.random() * (canvas.height - 100) + 50,
    //         };
    //         const spawnWidth = 64;

    //         if (!entities.some(entity => entity.position.distance(pos) < (entity.size ?? entity.width) / 2 + spawnWidth / 2)) {
    //             return pos
    //         }
    //     }
    // }


    // Inputs (see https://xem.github.io/articles/jsgamesinputs.html)
    const input = {
        u: 0,
        d: 0,
        l: 0,
        r: 0,
        a: 0, /* attack */
        c1: 0, /* cheats */
        c2: 0, /* cheats */
    };

    const keyHandler = (e) => {
        const w = e.keyCode, t = e.type;

        // console.log("keyHandler", w, t);

        // not using event.code because we have ascii magic going on

        // -4 bytes zipped compared to if-statements
        // ['WASD', 'ZQSD', '↑←↓→']
        const keyMap = {
            87: 'u', /* W */
            90: 'u', /* Z */
            38: 'u', /* ↑ */
            83: 'd', /* S */
            40: 'd', /* ↓ */
            65: 'l', /* A */
            81: 'l', /* Q */
            37: 'l', /* ← */
            68: 'r', /* D */
            39: 'r', /* → */
            // 74: 'a', /* J */
            // 75: 'a', /* K */
            // 48: 'c1', /* 0 */ // cheat 1
            32: 's', /* space */
            8: 'b', /* backspace */
            13: 'en', /* enter */
            9: 'tb', /* tab */
            77: 'm', /* m */
        };

        if (!keyMap[w]) return;

        input[keyMap[w]] = +(t[3] < 'u');

        // toggles quick hack
        // if (input.c1 && 'c1' == keyMap[w]) {
        //     input.c1 = 0;
        // }
        // if (input.s && 's' == keyMap[w]) {
        //     audio.play('test');
        //     input.s = 0;
        // }
        if (input.m && 'm' == keyMap[w]) {

            //@ts-ignore (type cast)
            audio.volume = !audio.volume;
            input.m = 0;
        }
        // if (input.s && 's' == keyMap[w]) {
        //     if (gameIsOver) {
        //         restart();
        //     }
        //     if (tutIsShown) {
        //         tutIsShown = false;
        //     }
        //     if (tutProgress == 0) {
        //         tutProgress++;
        //         tutIsShown = true;
        //     } else if (tutProgress == 1) {
        //         tutProgress++;
        //         tutIsShown = true;
        //     } else if (tutProgress == 2) {
        //         tutProgress++;
        //         nextSpawnTick = fixedGameTime + 500;
        //         nextWaveTime = fixedGameTime + waves[waveID][0] * 1000;
        //     }
        //     if (tutUpgrade) {
        //         tutUpgrade = -1;
        //     }
        //     if (tutDeath) {
        //         tutDeath = -1;
        //     }
        //     input.s = 0;
        // }
        // if (input.tb && 'tb' == keyMap[w] && !gameIsOver) {
        //     gameIsPaused = !gameIsPaused;
        //     input.tb = 0;
        // }
        // END toggles quick hack

        e.preventDefault();
        e.stopPropagation();
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('keyup', keyHandler);

    let loop = GameLoop({  // create the main game loop
        update() { // update the game state
            // if (gameIsOver) return;
            // if (gameIsPaused) return;
            // if (tutIsShown) return;
            // fixedGameTime += fixedDeltaTime;
            // console.log('fixedGameTime', fixedGameTime);


        },
        render() { // render the game state
            // context2.clearRect(0, 0, canvas2.width, canvas2.height);
            context.save();
            // background
            // context.fillStyle = BACKGROUND_COLOR;
            context.fillRect(0, 0, canvas.width, canvas.height);
        },

    });

    loop.start();    // start the game
    function restart() {
        // cleanup
        loop.stop();

        window.removeEventListener('keydown', keyHandler);
        window.removeEventListener('keyup', keyHandler);
        canvas.removeEventListener('pointerenter', _focus);

        // restart
        start();
    }
}

window.onload = start;