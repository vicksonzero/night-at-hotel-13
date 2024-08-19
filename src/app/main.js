// @ts-check
import {
    /* system */ init, Sprite, Text, GameLoop, Pool, Scene,
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

const map_room_w = 7;

async function start() {

    let building = generateMap(
        /* floorCount */ 13,
        /* floorWidth */ 14,

        /* liftPerFloorMin */ 2,
        /* liftPerFloorMax */ 4,
        /* liftRandomCount */ 8,
        /* accessibleFloorCount */ 13,

        /* aliasMax */ 22,
        /* aliasMin */ 14,
        /* aliasSafe */ 3,
        /* aliasSkip */ 5,
    );
    /* #IfDev */
    console.log('building', building);
    /* #EndIfDev */

    //#region Build level


    let floorId = 5;
    // let roomId = 3;


    /** @type {string[] & {w:number, h:number}} */
    // @ts-ignore
    let map = Array(7).fill('');

    for (const room of building.floors[floorId].rooms) {
        // @ts-ignore
        // map = map.map((row, i) => i != 5
        //     ? row + Array(map_room_w).fill('0').join('')
        //     : row + '0000000000');
        map = map.map((row, i) => row + Array(map_room_w).fill('0').join(''));
    }

    map.w = map[0].length;  // map width in tiles
    map.h = map.length;     // map height in tiles

    map[0] = Array(map.w).fill('1').join('')
    map[6] = Array(map.w).fill('1').join('')

    /* #IfDev */

    console.log('map.length: ', map.map(x => x.length));
    /* #EndIfDev */

    // TODO: build plants


    //#endregion


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
    let scene = Scene({
        id: 'a',
        objects: [],
    });
    canvas.addEventListener('pointerenter', _focus);
    context.imageSmoothingEnabled = false;

    // context2.imageSmoothingEnabled = false;
    initPointer();


    cache_map(a_room_cache, map);

    let room_images = [-1, 0, 1].map((i) => Sprite({
        /* #IfDev */
        name: 'room_tiles',
        /* #EndIfDev */
        x: i * map.w * tile_w,        // starting x,y position of the sprite
        y: 0,
        // color: '#5f1e09',  // fill color of the sprite rectangle
        width: a_room_cache.width,     // width and height of the sprite rectangle
        height: a_room_cache.height,
        scaleX: 1.005,
        // dx: 2,
        // dy: 2,
        image: a_room_cache,
        anchor: { x: 0, y: 0 },

        /* #IfDev */
        opacity: [0.8, 1, 0.9][i],
        /* #EndIfDev */


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
        image: images.pi,
        // scaleX: 2, // is set in render()
        scaleY: 2,

        // custom properties
        dimension: 0, // 0=physical, 1=spectral
        /** @type {IEntity} - player body */
        bd: { x: 15, y: 2, w: .8, h: 1.5, fc: 1, type: 'player', vx: 0, vy: 0, gd: 1, gv: g1, cj: 1 },
        sprint: false, // aka isSprinting
    });

    let doors = [];

    for (const room of building.floors[floorId].rooms) {
        const type = room.roomId == 0
            ? 'ex'
            : room.liftDoor
                ? 'lf'
                : room.shaft ? 'sh' : 'dr';
        const door = Sprite({
            /* #IfDev */
            name: 'door',
            /* #EndIfDev */
            x: room.roomId * map_room_w * tile_w,        // starting x,y position of the sprite
            y: 6 * tile_h,
            // color: 'red',  // fill color of the sprite rectangle
            // width: .6 * tile_w,     // width and height of the sprite rectangle
            // height: 1 * tile_h,
            scaleX: 8,
            scaleY: 8,
            anchor: { x: 0, y: 1 },
            image: {
                ex: images.ed2,
                lf: images.ld2,
                // sf: undefined,
                dr: images.d
            }[type],

            // custom properties
            type,
            room,
            floorId: floorId,
            roomId: room.roomId,
        });
        door.addChild(Text({
            text: {
                // ex: undefined,
                // lf: undefined,
                // sf: undefined,
                dr: building.alias.floors.at(-door.roomId),
            }[type],
            x: door.width / 2 + 1,
            y: -10,
            font: '3px Arial',
            color: 'white',
            anchor: { x: 0.5, y: 0.5 },
            textAlign: 'center'
        }));
        doors.push(door);
    }

    scene.add(room_images);
    scene.add(doors);
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
        const w = e.keyCode;

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
            if (+(e.type[3] < 'u')) {
                gameIsFocused = !gameIsFocused;
                /* #IfDev */
                console.log('gameIsFocused', gameIsFocused);
                /* #EndIfDev */
                //@ts-ignore (global variable)
                txa.disabled = gameIsFocused;
                //@ts-ignore (global variable)
                if (!gameIsFocused) txa.focus();
                input.tb = 0;
            }

            /* #IfDev */
            // console.log('preventDefault');
            /* #EndIfDev */
            e.preventDefault();
            e.stopPropagation();
        }

        input[keyMap[w]] = gameIsFocused ? +(e.type[3] < 'u') : 0;

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
            player.sprint = true;
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


            tryMoveY(
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
            );

            const mv = input.l ? -1 : input.r ? 1 : 0;
            if (!mv) player.sprint = false;
            tryMoveX(
                player.bd,
                mv * (player.sprint ? player_speed2 : player_speed1) + player.bd.vx,
                map,
                () => {
                    // if (can_do_climb) {
                    //     hero.vy = -.07;
                    // }
                }
            );
            player.bd.fc = mv || player.bd.fc;
            // console.log('player.image', fixedGameTime, fixedGameTime * fixedDeltaTime, Math.ceil(fixedGameTime * fixedDeltaTime * 10) % 2);
            player.image = !mv ? images.pi : (Math.ceil(fixedGameTime / (fixedDeltaTime * 10)) % 2 == 0 ? images.pr1 : images.pr2);


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
            player.scaleX = 2 * player.bd.fc;

            scene.camera.x = player.x;

            const loopIndex = Math.round((player.bd.x + map.w / 2) / map.w) - 1;
            for (const room_image of room_images) {
                room_image.x = (Math.floor((loopIndex + 1 - room_image.loopIndex) / 3) * 3 + room_image.loopIndex) * map.w * tile_w;
            }

            for (const door of doors) {
                while (door.x - player.x > map.w / 2 * tile_w) {
                    /* #IfDev */
                    console.log(`door[${door.roomId}] is too right`);
                    /* #EndIfDev */
                    door.x -= map.w * tile_w;
                }
                while (player.x - door.x > map.w / 2 * tile_w) {
                    /* #IfDev */
                    console.log(`door[${door.roomId}] is too left`);
                    /* #EndIfDev */
                    door.x += map.w * tile_w;
                }
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
    //     entity.x = Math.min(map.w - entity.w, entity.x);
    // }

    let probeX = (dx <= 0 ? entity.x : entity.x + entity.w);
    while (probeX < 0) probeX += map.w;
    probeX = probeX % map.w;

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
    //     console.log('tryMoveX', entity.x, Math.round((entity.x + map.w / 2) / map.w) - 1);
    // }

    return entity;
}

function tryMoveY(/** @type {ITransform}*/ entity, dy, map, solidCallback) {
    entity.y += dy;
    if (dy <= 0) {
        entity.y = Math.max(entity.y, 0);
    } else {
        entity.y = Math.min(map.h - entity.h, entity.y);
    }

    let probeX = entity.x;
    while (probeX < 0) probeX += map.w;
    probeX = probeX % map.w;
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