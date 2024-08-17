// @ts-check
import {
    /* system */ init, Sprite, GameLoop, Pool, Scene,
    /* mouse  */ initPointer, track, getPointer, pointerPressed,
    /* maths  */ angleToTarget, clamp, movePoint, lerp
    /* Vector is imported through Sprite, GameObject, Updatable */
} from 'kontra';
import { colors } from './colors.js';

import { loadImages } from './images.js';
import { ArcadeAudio } from './audio.js';
import { generateMap } from './explore/functions.js';
// import { CanvasRenderingContext2D } from 'canvas';



/**
 * @typedef ITransform
 * @property {number} x          - 
 * @property {number} y          - 
 * @property {number} w          - 
 * @property {number} h          - 
 */

/**
 * @typedef IEntity
 * @property {string} type       - 
 * @property {number} x          - 
 * @property {number} y          - 
 * @property {number} w          - 
 * @property {number} h          - 
 * @property {number} fc         - facing direction. -1 means left, 1 means right
 * @property {number} [gd]       - grounded
 * @property {number} [gv]       - gravity
 * @property {number} [cj]       - can jump
 * @property {number} [vx]       - velocity x, used for knock back or others
 * @property {number} [vy]       - velocity y, used for gravity
 */


// World
const g1 = 0.016;    // jumping gravity in tiles/frame²
const g2 = 0.021;    // falling gravity in tiles/frame²
const tile_w = 32;  // tiles width in px
const tile_h = 32;  // tiles height in px
const player_speed1 = 0.1;    // player move speed (walking) in tiles/frame²
const player_speed2 = 0.2;    // player move speed (running) in tiles/frame²


let map = [
    '111111111111111111',
    '000000000000000000',
    '000000000000000000',
    '000000000000000000',
    '000011100000000000',
    '000000000111000000',
    '111111111111111111',
];
let map_w = map[0].length;  // map width in tiles
let map_h = map.length;     // map height in tiles

async function start() {

    const fixedDeltaTime = (1000 / 60) | 0;

    let fixedGameTime = 0;

    const a_room_cache = document.createElement("canvas");
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
    let scene = Scene({
        id: 'a',
        objects: [],
    });

    let building = generateMap({
        floorCount: 13,
        floorWidth: 14,

        liftPerFloorMin: 2,
        liftPerFloorMax: 4,
        liftRandomCount: 8,
        accessibleFloorCount: 13,

        aliasMax: 22,
        aliasMin: 14,
        aliasSafe: 3,
        aliasSkip: 5,
    });
    console.log('building', building);

    // context2.imageSmoothingEnabled = false;
    initPointer();


    // let player = Sprite({
    //     /* #IfDev */
    //     name: 'player',
    //     /* #EndIfDev */
    //     x: canvas.width / 2,        // starting x,y position of the sprite
    //     y: canvas.height / 2 + 50,
    //     // color: 'red',  // fill color of the sprite rectangle
    //     // width: 20,     // width and height of the sprite rectangle
    //     // height: 40,
    //     // dx: 2,
    //     // dy: 2,
    //     image: images.playerPhysical,
    //     anchor: { x: 0.5, y: 0.5 },

    //     // custom properties
    //     dimension: 0, // 0=physical, 1=spectral
    // });

    cache_map(a_room_cache, map);

    let room_images = [-1, 0, 1].map((i) => Sprite({
        /* #IfDev */
        name: 'room_tiles',
        /* #EndIfDev */
        x: i * map_w * tile_w,        // starting x,y position of the sprite
        y: 0,
        // color: '#5f1e09',  // fill color of the sprite rectangle
        width: a_room_cache.width,     // width and height of the sprite rectangle
        height: a_room_cache.height,
        scaleX: 1.005,
        // dx: 2,
        // dy: 2,
        image: a_room_cache,
        anchor: { x: 0, y: 0 },

        loopIndex: i,
    }));

    let player = Sprite({
        /* #IfDev */
        name: 'player',
        /* #EndIfDev */
        x: canvas.width / 2,        // starting x,y position of the sprite
        y: canvas.height / 2 + 50,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .8 * tile_w,     // width and height of the sprite rectangle
        // height: 1.5 * tile_h,
        anchor: { x: 0.5, y: 1 },
        image: images.playerIdle,
        scaleX: 2,
        scaleY: 2,

        // custom properties
        dimension: 0, // 0=physical, 1=spectral
        /** @type {IEntity} - player body */
        bd: { x: 15, y: 2, w: .8, h: 1.5, fc: 1, type: 'player', vx: 0, vy: 0, gd: 1, gv: g1, cj: 1 },
        isSprinting: false,
    });

    let liftDoor = Sprite({
        /* #IfDev */
        name: 'lift_door',
        /* #EndIfDev */
        x: 14 * tile_w,        // starting x,y position of the sprite
        y: 6 * tile_h,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .6 * tile_w,     // width and height of the sprite rectangle
        // height: 1 * tile_h,
        scaleX: 8,
        scaleY: 8,
        anchor: { x: 0, y: 1 },
        image: images.liftDoor2,

        // custom properties
    });

    let door = Sprite({
        /* #IfDev */
        name: 'door',
        /* #EndIfDev */
        x: 18 * tile_w,        // starting x,y position of the sprite
        y: 6 * tile_h,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .6 * tile_w,     // width and height of the sprite rectangle
        // height: 1 * tile_h,
        scaleX: 8,
        scaleY: 8,
        anchor: { x: 0, y: 1 },
        image: images.door,

        // custom properties
    });

    let exitDoor = Sprite({
        /* #IfDev */
        name: 'exitDoor',
        /* #EndIfDev */
        x: 0 * tile_w,        // starting x,y position of the sprite
        y: 6 * tile_h,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .6 * tile_w,     // width and height of the sprite rectangle
        // height: 1 * tile_h,
        scaleX: 8,
        scaleY: 8,
        anchor: { x: 0, y: 1 },
        image: images.exitDoor2,

        // custom properties
    });
    scene.add(room_images);
    scene.add(door);
    scene.add(exitDoor);
    scene.add(liftDoor);
    scene.add(player);

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
        // u: 0,
        // d: 0,
        // l: 0,
        // r: 0,
        // a: 0, /* attack */
        // c1: 0, /* cheats */
        // c2: 0, /* cheats */
    };

    let gameIsFocused = true;
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
            // 8: 'b', /* backspace */
            13: 'en', /* enter */
            9: 'tb', /* tab */
            16: 'sh', /* shift (L and R) */
            77: 'm', /* m */
        };

        if (!keyMap[w]) return;

        if ('tb' == keyMap[w]) {
            if (+(t[3] < 'u')) {
                gameIsFocused = !gameIsFocused;
                /* #IfDev */
                console.log('gameIsFocused', gameIsFocused);
                /* #EndIfDev */
                //@ts-ignore
                txa.disabled = gameIsFocused;
                //@ts-ignore
                if (!gameIsFocused) txa.focus();
                input.tb = 0;
            }

            /* #IfDev */
            // console.log('preventDefault');
            /* #EndIfDev */
            e.preventDefault();
            e.stopPropagation();
        }

        input[keyMap[w]] = gameIsFocused ? +(t[3] < 'u') : 0;

        if (!gameIsFocused) return;

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
        if (input.sh && 'sh' == keyMap[w]) {
            /* #IfDev */
            console.log('start sprint');
            /* #EndIfDev */
            player.isSprinting = true;
            input.sh = 0;
        }



        // END toggles quick hack

        /* #IfDev */
        // console.log('preventDefault');
        /* #EndIfDev */
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
            fixedGameTime += fixedDeltaTime;
            // console.log('fixedGameTime', fixedGameTime);




            // Compute hero position:
            // The hero's bounding rectangle's corners have the following coordinates:
            //
            //           [hero_x, hero_y]      [hero_x + hero_w, hero_y]
            //                           ______
            //                          |     |  
            //                          |     |  
            //                          |     |  
            //                          |     |  
            //                          |_____|
            //
            // [hero_x, hero_y + hero_h]      [hero_x + hero_w, hero_y + hero_h]

            // coyote: don't Reset grounded state

            // Apply gravity to Y speed, Y acceleration to Y speed and Y speed to Y position
            player.bd.vy += player.bd.gv;
            if (player.bd.vy > 0) player.bd.gv = g2;
            if (player.bd.vy > 0.2) player.bd.vy = 0.2;
            player.bd.vx -= (Math.sign(player.bd.vx) * Math.min(Math.abs(player.bd.vx), .02));


            player.bd.y = tryMoveY(
                player.bd,
                player.bd.vy,
                map,
                () => {
                    if (player.bd.vy > 0) {
                        player.bd.gd = fixedGameTime + 5 * fixedDeltaTime; // 5 frames of coyote time
                        player.bd.vy = 0;
                        player.bd.gv = g1;
                    }
                    // If moving up
                    if (player.bd.vy < 0) {
                        // If this tile is solid, put the player on the bottom side of it and let it fall
                        player.bd.vy = 0;
                    }
                }
            ).y;

            const mv = input.l ? -1 : input.r ? 1 : 0;
            if (!mv) player.isSprinting = false;
            tryMoveX(
                player.bd,
                mv * (player.isSprinting ? player_speed2 : player_speed1) + player.bd.vx,
                map,
                () => {
                    // if (can_do_climb) {
                    //     hero.vy = -.07;
                    // }
                }
            );


            // If up key is pressed and the hero is grounded, jump
            if (input.s && player.bd.vy >= 0 && player.bd.gd >= fixedGameTime && player.bd.cj) {
                // console.log('jump', player.bd.gd, fixedGameTime, player.bd.gd - fixedGameTime);
                player.bd.vy = -.315;
                player.bd_g = g1;
                player.bd.cj = 0;
            }
            if (!input.s) {
                player.bd.cj = 1;
                if (player.bd.vy < 0) {
                    if (player.bd.vy < -0.15) player.bd.vy = -0.15;
                    player.bd_g = g2;
                }
            }
        },
        render() { // render the game state
            // context2.clearRect(0, 0, canvas2.width, canvas2.height);
            context.save();
            // background
            // context.fillStyle = BACKGROUND_COLOR;
            context.fillStyle = '#000000';
            context.fillRect(0, 0, canvas.width, canvas.height);

            player.x = player.bd.x * tile_w + player.bd.w * .5 * tile_w;
            player.y = player.bd.y * tile_h + player.bd.h * tile_h;

            scene.camera.x = player.x;

            const loopIndex = Math.round((player.bd.x + map_w / 2) / map_w) - 1;
            // const a0 = Math.floor((loopIndex + 3 - 1) / 3) * 3 - 1;
            // const a1 = Math.floor((loopIndex + 3 - 2) / 3) * 3 - 0;
            // const a2 = Math.floor((loopIndex + 3 - 3) / 3) * 3 + 1;
            // console.log('loopIndex', loopIndex, [a0, a1, a2]);
            // room_images[0].x = a0 * map_w * tile_w;
            // room_images[1].x = a1 * map_w * tile_w;
            // room_images[2].x = a2 * map_w * tile_w;
            for (const room_image of room_images) {
                room_image.x = (Math.floor((loopIndex + 1 - room_image.loopIndex) / 3) * 3 + room_image.loopIndex) * map_w * tile_w;
            }
            scene.render();
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

function tryMoveX(/** @type {ITransform}*/ entity, dx, map, solidCallback) {
    entity.x += dx;
    // if (dx <= 0) {
    //     entity.x = Math.max(entity.x, 0);
    // } else {
    //     entity.x = Math.min(map_w - entity.w, entity.x);
    // }

    let probeX = (dx <= 0 ? entity.x : entity.x + entity.w);
    while (probeX < 0) probeX += map_w;
    probeX = probeX % map_w;

    const tile1 = +map[~~(entity.y)][~~(probeX)];
    const tile2 = +map[~~(entity.y + 0.5 * entity.h)][~~(probeX)];
    const tile3 = +map[~~(entity.y + entity.h - .1)][~~(probeX)];

    // const oldX = entity.x;
    if (tile1 == 1 || tile2 == 1 || tile3 == 1) {
        // @ts-ignore (using && to do if-else)
        entity.x = (dx <= 0 ? Math.ceil(entity.x) : ~~(entity.x + (entity.x > 0 && entity.w)) - entity.w);
        if (solidCallback) solidCallback();
    }
    // if (dx != 0) {
    //     // console.log('tryMoveX', oldX, entity.x, entity.x + entity.w);
    //     console.log('tryMoveX', entity.x, Math.round((entity.x + map_w / 2) / map_w) - 1);
    // }

    return entity;
}

function tryMoveY(/** @type {ITransform}*/ entity, dy, map, solidCallback) {
    entity.y += dy;
    if (dy <= 0) {
        entity.y = Math.max(entity.y, 0);
    } else {
        entity.y = Math.min(map_h - entity.h, entity.y);
    }

    let probeX = entity.x;
    while (probeX < 0) probeX += map_w;
    probeX = probeX % map_w;
    const probeY = (dy <= 0 ? entity.y : entity.y + entity.h);

    const tile1 = +map[~~(probeY)][~~(probeX)];
    const tile2 = +map[~~(probeY)][~~(probeX + entity.w - .1)];

    if (tile1 == 1 || tile2 == 1) {
        entity.y = (dy <= 0 ? Math.ceil(entity.y) : ~~(entity.y + entity.h) - entity.h);
        if (solidCallback) solidCallback();
    }

    return entity;
}

function cache_map(cache, _map) {
    const cache_c = cache.getContext('2d');
    // -10 bytes zipped compared to nested for-loops
    cache.width = _map[0].length * tile_w;
    cache.height = _map.length * tile_h;

    // Create a linear gradient
    // The start gradient point is at x=20, y=0
    // The end gradient point is at x=220, y=0
    const gradient = cache_c.createLinearGradient(0, 0, 0, cache.height);

    // Add three color stops
    gradient.addColorStop(0, "#9babf2");
    gradient.addColorStop(1, "#34418c");

    // Set the fill style and draw a rectangle
    cache_c.fillStyle = gradient;
    cache_c.fillRect(0, 0, cache.width, cache.height);

    _map.forEach((row, y) => row.split('').forEach((tile, x) => {
        if (tile == '1') {
            cache_c.fillStyle = "rgb(143, 41, 41)";
            cache_c.fillRect(x * tile_w, y * tile_h, tile_w, tile_h);

            if (y > 1 && _map[y - 1][x] != '1') {
                cache_c.fillStyle = "rgb(132, 119, 110)";
                cache_c.fillRect(x * tile_w, y * tile_h - 10, tile_w, 10);
            }
        }
        if (tile == 'w' || (tile != 'w' && row[x - 1] == 'w' && row[x + 1] == 'w')) {
            cache_c.fillStyle = "#0B0";
            cache_c.fillRect(x * tile_w, y * tile_h + 6, tile_w, tile_h - 6);
        }
    }));
}

window.onload = start;