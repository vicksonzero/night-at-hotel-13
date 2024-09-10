// @ts-check
import {
    /* system */ init, Sprite, Text, GameLoop, Pool, Scene,
    /* mouse  */ initPointer, track, getPointer, pointerPressed,
    /* maths  */ angleToTarget, clamp, movePoint, lerp, collides,
    untrack,
    /* Vector is imported through Sprite, GameObject, Updatable */
} from 'kontra';
import { colors } from './colors.js';

import { loadImages } from './images.js';
import { ArcadeAudio } from './audio.js';
import { generateMap } from './mapGenerator.js';
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

//#region Global var

// World
// const g1 = 0.016;    // jumping gravity in tiles/frame²
// const g2 = 0.021;    // falling gravity in tiles/frame²
const tile_w = 32;  // tiles width in px
const tile_h = 32;  // tiles height in px
const player_speed1 = 0.2;    // player move speed (walking) in tiles/frame²
const player_speed2 = 0.4;    // player move speed (running) in tiles/frame²

const map_room_w = 7;

// transitions:
// 0 = none, 
// 1 = swipe up, 
// 2 = swipe down, 
// 3 = falling out of level, aka Game Over, entering next loop
// 4 = level start (black fade out)
// 5 = win
const transition_length_1 = 2000;
const transition_length_2 = transition_length_1;
const transition_length_3 = 5000;
const transition_length_4 = 4000;
const transition_length_5 = 7000;

let loopCount = -1;


//#endregion

const start = async () => {
    loopCount++;
    const a_room_cache = document.createElement("canvas");
    // loading
    const images = await loadImages();

    const audio = new ArcadeAudio();
    // audio.volume = 0; // TODO: make mute button

    let gameIsOver = false;
    let transitionType = 4;
    // transitions use real world time, while game time is paused
    let transitioningUntil = Date.now() + transition_length_4;

    let lastCorrectExit = 0;
    /* #IfDev */
    let buildingGenCount = 0;
    /* #EndIfDev */
    let building;
    do {
        /* #IfDev */
        buildingGenCount++;
        /* #EndIfDev */
        building = generateMap();
        /* #IfDev */
        console.log(`generateMap ${buildingGenCount}`, building);
        /* #EndIfDev */
    }
    while (building.lifts.some(lift => lift?.floorIds.length > 6));

    //#region Build level

    /** @type {string[] & {w:number, h:number}} */
    let map;


    let floorId;
    // let roomId = 3;
    do {
        floorId = (Math.random() * building.floors.length | 0);
    } while (building.floors[floorId].isExit || !building.floors[floorId].acc);
    /* #IfDev */
    console.log('floorId', floorId);
    /* #EndIfDev */


    const buildMap = () => {
        /* #IfDev */
        console.log('buildMap');
        /* #EndIfDev */
        /** @type {string[] & {w:number, h:number}} */
        // @ts-ignore
        map = Array(7).fill('');

        for (let room of building.floors[floorId].rooms) {
            // @ts-ignore
            // map = map.map((row, i) => i != 5
            //     ? row + "0".repeat(map_room_w)
            //     : row + '0000000000');
            map = map.map((row, i) => row + "0000000");
        }

        map.w = map[0].length;  // map width in tiles
        map.h = map.length;     // map height in tiles

        map[0] = "1".repeat(map.w);
        map[6] = "1".repeat(map.w);

        /* #IfDev */
        console.log('map.length: ', map.map(x => x.length));
        /* #EndIfDev */


        cache_map(a_room_cache, map);
    };

    buildMap();

    // TODO: build plants


    //#endregion

    const tryEscape = () => {
        if (building.floors[floorId].isExit && !collides(player, ghost)) {
            // win
            /* #IfDev */
            console.log('win');
            /* #EndIfDev */
            gameIsOver = true;
            transitionType = 5;
            transitioningUntil = Date.now() + transition_length_5;
        } else {
            setTimeout(() => {
                restart();
            }, transition_length_3);

            /* #IfDev */
            console.log('building.exitFloorId: ', floorId, building.exitFloorId);
            /* #EndIfDev */

            // player.x = canvas_width_2;
            // player.y = canvas_height_2 + 50;
            lastCorrectExit = building.floors[building.exitFloorId].fa;
            transitionType = 3;
            transitioningUntil = Date.now() + transition_length_3;
        }
    };

    const moveFloor = (floorDir, room) => {
        /* #IfDev */
        console.log('moveFloor:', floorDir, room);
        /* #EndIfDev */

        if (!room.liftDoor) return;
        if (floorDir > 0 && room.liftDoor.up == null) return;
        if (floorDir < 0 && room.liftDoor.down == null) return;
        floorId = floorDir > 0
            ? room.liftDoor.up
            : room.liftDoor.down;
        /* #IfDev */
        console.log('moveFloor to: ', floorId);
        /* #EndIfDev */


        setTimeout(() => {
            buildMap();
            updateDoors();
            updateLiftFloors();
        }, transition_length_1 / 2);

        // player.x = canvas_width_2;
        // player.y = canvas_height_2 + 50;
        transitionType = floorDir > 0 ? 1 : 2;
        transitioningUntil = Date.now() + transition_length_1;
    };



    //#region Init

    const _focus = () => focus();
    // const canvas2 = document.querySelector('#b');
    // const context2 = canvas2.getContext('2d');

    const canvas_width = 480;
    const canvas_height = 320;
    const canvas_width_2 = canvas_width / 2;
    const canvas_height_2 = canvas_height / 2;
    const fixedDeltaTime = (1000 / 60) | 0;
    let fixedGameTime = 0;


    // init
    let { canvas, context } = init('a');
    let scene = Scene({
        id: 'a',
        objects: [],
        cullObjects: false,
    });
    canvas.addEventListener('pointerenter', _focus);
    context.imageSmoothingEnabled = false;

    // context2.imageSmoothingEnabled = false;
    initPointer();

    //#endregion

    //#region Sprites

    let room_images = [-1, 0, 1].map((i) => Sprite({
        /* #IfDev */
        name: 'room_tilemap',
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
        opacity: [0.9, 1, 0.95][i],
        /* #EndIfDev */


        loopIndex: i, // TODO: rename to li
    }));

    let player = Sprite({
        /* #IfDev */
        name: 'player',
        /* #EndIfDev */
        x: 0,        // starting x,y position of the sprite
        y: -10,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .8 * tile_w,     // width and height of the sprite rectangle
        // height: 1.5 * tile_h,
        anchor: { x: 0.5, y: 1 },
        image: images.pi,
        // scaleX: 2, // is set in render()
        scaleY: 2,

        // custom properties
        /** @type {IEntity} - player body */
        bd: {
            x: 8, y: 4.5, w: .8, h: 1.5, fc: 1, vx: 0,
            // vy: 0, gd: 1, gv: g1, cj: 1 
        },
        sprint: false, // aka isSprinting
    });

    let doors = [];
    let knownFloorsGroup = Sprite({
        x: 10,
        y: 240,
        // children: [],
    });

    for (let room of building.floors[floorId].rooms) {
        const door = Sprite({
            /* #IfDev */
            name: `door-${room.roomId}`,
            /* #EndIfDev */
            x: room.roomId * map_room_w * tile_w + tile_w,        // starting x,y position of the sprite
            y: 6 * tile_h,
            // color: 'red',  // fill color of the sprite rectangle
            // width: .6 * tile_w,     // width and height of the sprite rectangle
            // height: 1 * tile_h,
            scaleX: 8,
            scaleY: 8,
            anchor: { x: 0, y: 1 },
            image: images.d,

            // custom properties
            room,
            playerInContactTime: 0,
        });
        door.addChild(Text({
            text: '',
            x: door.width / 2 + 0.5,
            y: -10,
            font: '3px Arial',
            color: 'white',
            strokeColor: undefined,
            lineWidth: 1,
            anchor: { x: 0.5, y: 0.5 },
            textAlign: 'center',

            onOver() {
                // handle on over events on the sprite
                this.strokeColor = 'red';
            },
            onOut() {
                // handle on out events on the sprite
                this.strokeColor = undefined;
            },
            onDown() {
                /* #IfDev */
                console.log('onDown', room.roomId, door.type);
                /* #EndIfDev */
                if (door.type == 'dr')
                    addKnownFloorAliases(building.af.at(-door.room.roomId));
            },
        }));
        door.addChild(Text({
            text: '',
            x: -1,
            y: -10,
            font: '4px Arial',
            color: 'white',
            anchor: { x: 1, y: 0.5 },
            textAlign: 'right',

            onOver() {
                // handle on over events on the sprite
                this.strokeColor = 'red';
            },
            onOut() {
                // handle on out events on the sprite
                this.strokeColor = undefined;
            },
            onDown() {
                // console.log('onDown', room.roomId);
                addKnownFloorAliases(building.floors[floorId].fa);
            },
        }));
        door.addChild(Sprite({
            x: door.width + 2,
            y: -8,
            // children: [],
        }));

        track(door.children[0]);
        track(door.children[1]);
        track(door.children[2].children);
        doors.push(door);
    }

    let ghost = Sprite({
        /* #IfDev */
        name: 'ghost',
        /* #EndIfDev */
        x: 18 * tile_w,        // starting x,y position of the sprite
        y: 6 * tile_h,
        // color: 'red',  // fill color of the sprite rectangle
        // width: .8 * tile_w,     // width and height of the sprite rectangle
        // height: 1.5 * tile_h,
        anchor: { x: 0.5, y: 1 },
        image: images.pdi,
        // scaleX: 2, // is set in render()
        scaleY: 2,

        next: 0,
    });

    scene.add(room_images, doors, player, ghost);

    const addKnownFloorAliases = (floorAlias, type, index) => {
        // console.log('addKnownFloorAliases', floorAlias, type, index);
        if (type || !knownFloorsGroup.children.find(child => child.fa == floorAlias)) {
            let txtGap;
            let txt = Text({
                text: type || floorAlias,
                x: 0,
                y: 0,
                xx: 0,
                yy: 0,
                font: '20px Arial',
                color: 'white',
                // strokeColor: undefined,
                lineWidth: 8,
                anchor: { x: 0.5, y: 0 },
                textAlign: 'center',
                fa: floorAlias,
                s: 0, // style id
                update() {
                    this.x = lerp(this.x, this.xx, 0.2);
                    this.y = lerp(this.y, this.yy, 0.2);
                },
                onOver() {
                    // handle on over events on the sprite
                    this.strokeColor = '#555';
                },
                onOut() {
                    // handle on out events on the sprite
                    this.strokeColor = undefined;
                },
                onDown() {
                    if (type) {
                        knownFloorsGroup.removeChild(txt);
                        rearrange();
                    } else {
                        this.color = ['white', 'red', 'yellow', 'lime', 'magenta'][++this.s % 5];
                    }
                },
                children: [
                    txtGap = Text({
                        text: ' ',
                        x: -23,
                        y: -2,
                        font: '24px Arial',
                        color: '#aaa',
                        // strokeColor: undefined,
                        // anchor: { x: 0, y: 0 },
                        textAlign: 'left',
                        onOver() {
                            // handle on over events on the sprite
                            this.text = '+';
                        },
                        onOut() {
                            // handle on out events on the sprite
                            this.text = ' ';
                        },
                        onDown() {
                            addKnownFloorAliases(floorAlias, '?', knownFloorsGroup.children.indexOf(txt));
                        },
                    }),
                ]
            });
            if (!type) {
                index = knownFloorsGroup.children.findIndex(child => child.fa > floorAlias);

            }
            // console.log('addKnownFloorAliases insert at', index);
            knownFloorsGroup.children.splice((index < 0) ? knownFloorsGroup.children.length : index, 0, txt);
            txt.parent = knownFloorsGroup;
            txt._pc = txt._pc ?? (() => { });
            txt._pc();
            track(txtGap);
            track(txt);
            // knownFloorsGroup.children.sort((a, b) => (a.fa == b.fa ? (b.text != '?' ? -1 : 0) : a.fa - b.fa));
            const rearrange = (fa) => knownFloorsGroup.children.map((x, i) => {
                x.xx = i % 13 * 36 + 18; // 24 + 12
                x.yy = (i / 13 | 0) * 24;
                if (x.fa == fa) {
                    x.x = x.xx;
                    x.y = -30;
                }
            });
            rearrange(floorAlias);

            /* #IfDev */
            console.log('addKnownFloorAliases', floorAlias, knownFloorsGroup.children.map(x => x.fa));
            /* #EndIfDev */
        }
    };

    const updateLiftFloors = () => {
        doors.forEach(door => {
            const floorIds = building.lifts[door.room.liftDoor?.liftId]?.floorIds || [];
            /* #IfDev */
            console.log('floorIds', door.room.roomId, floorIds);
            /* #EndIfDev */

            untrack(door.children[2].children);

            // door.children[2].y = 0;
            door.children[2].children = floorIds
                .map(x => building.floors[x].fa)
                .reverse()
                .map((fa, i) => Text({
                    text: fa,
                    x: 0,
                    y: -floorIds.length / 2 * 3 + i * 3,
                    font: '3px Arial',
                    color: fa == building.floors[floorId].fa ? '#555' : 'white',
                    strokeColor: undefined,
                    lineWidth: 1,
                    anchor: { x: 0.5, y: 0.5 },
                    textAlign: 'center',

                    onOver() {
                        // handle on over events on the sprite
                        this.strokeColor = 'red';
                    },
                    onOut() {
                        // handle on out events on the sprite
                        this.strokeColor = undefined;
                    },
                    onDown() {
                        /* #IfDev */
                        console.log('onDown', fa);
                        /* #EndIfDev */
                        addKnownFloorAliases(fa);
                    },
                }))
            track(door.children[2].children);
        });
    }

    const updateDoors = () => {
        /* #IfDev */
        // console.log('updateDoors');
        /* #EndIfDev */
        doors.forEach(door => {
            if (collides(player, door)) {
                door.playerInContactTime = Math.min(500, door.playerInContactTime + fixedDeltaTime);

                /* #IfDev */
                // if (door.room.liftDoor) console.log('liftDoor.playerInContactTime', door.playerInContactTime);
                /* #EndIfDev */
            } else {
                door.playerInContactTime = Math.max(0, door.playerInContactTime - fixedDeltaTime);
            }
            door.room = building.floors[floorId].rooms[door.room.roomId];
            // custom properties
            door.type = door.room.escapeDoor ? 'ex'
                : door.room.liftDoor ? 'lf'
                    : door.room.shaft ? 'sh'
                        : door.room.empty ? 'em'
                            : 'dr';
            door.image = {
                ex: images.ed2,
                lf: [images.ld1, images.ld2, images.ld3][Math.ceil(Math.min(1, door.playerInContactTime / 500) * 2)],
                // sf: undefined,
                em: images.d,
                dr: images.d
            }[door.type];
            // door.children[0].x =
            //     //  door.room.escapeDoor
            //     //     ? door.width / 2 + 0.5
            //     //     :
            //     door.room.liftDoor
            //         ? 
            //         : ;
            door.children[0].y = door.room.escapeDoor
                ? -16
                : -10;
            door.children[0].text = {
                ex: 'EXIT',
                // lf: door.playerInContactTime <= 0 ? '' : building.lifts[door.room.liftDoor?.liftId]?.floorIds.map(x => building.floors[x].fa).reverse().join('\n'),
                // sf: undefined,
                dr: building.af.at(-door.room.roomId),
                // em: undefined,
            }[door.type] ?? ''
            door.children[1].text = {
                // ex: undefined,
                lf: building.floors[floorId].fa + '/F',
                // sf: undefined,
                // dr: undefined,
                // em: undefined,
            }[door.type] ?? ''
        })
    };

    //#endregion

    updateDoors();
    updateLiftFloors();

    //#region Input

    let gameIsFocused = true;
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

        // if ('tb' == keyMap[w]) {
        //     if (+(e.type[3] < 'u')) {
        //         gameIsFocused = !gameIsFocused;
        //         /* #IfDev */
        //         console.log('gameIsFocused', gameIsFocused);
        //         /* #EndIfDev */
        //         //@ts-ignore (global variable)
        //         txa.disabled = gameIsFocused;
        //         //@ts-ignore (global variable)
        //         if (!gameIsFocused) txa.focus();
        //         input.tb = 0;
        //     }

        //     /* #IfDev */
        //     // console.log('preventDefault');
        //     /* #EndIfDev */
        //     e.preventDefault();
        //     e.stopPropagation();
        // }

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
        if (input.u && 'u' == keyMap[w] && transitioningUntil <= Date.now() && !gameIsOver) {
            // move floor
            for (let door of doors) {
                if (door.room.liftDoor && collides(player, door)) {
                    moveFloor(1, door.room);
                }
                if (door.room.escapeDoor && collides(player, door)) {
                    tryEscape();
                }
            }
            input.u = 0;
        }
        if (input.d && 'd' == keyMap[w] && transitioningUntil <= Date.now() && !gameIsOver) {
            // move floor
            for (let door of doors) {
                if (door.room.liftDoor && collides(player, door)) {
                    moveFloor(-1, door.room);
                }
            }
            input.d = 0;
        }
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

    //#endregion


    let loop = GameLoop({  // create the main game loop
        //#region update()
        update() { // update the game state
            if (transitioningUntil > Date.now()) return;
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
            // player.bd.vy += player.bd.gv;
            // if (player.bd.vy > 0) player.bd.gv = g2;
            // if (player.bd.vy > 0.2) player.bd.vy = 0.2;
            player.bd.vx -= (Math.sign(player.bd.vx) * Math.min(Math.abs(player.bd.vx), .02));

            if (ghost.next <= fixedGameTime) {
                ghost.xx = player.x;
                ghost.next = fixedGameTime + (Math.random() * 2000 | 0) + 1000;
            }
            const speed = 2;
            const dx = ghost.x - ghost.xx;
            let mv = dx < -speed ? 1
                : dx > speed ? -1
                    : 0;
            ghost.fc = mv || ghost.fc;
            ghost.x += mv * speed;
            ghost.scaleX = 2 * ghost.fc;
            ghost.image = !mv ? images.pdi : (Math.ceil(fixedGameTime / (fixedDeltaTime * 10)) % 2 == 0 ? images.pdr1 : images.pdr2);


            if (collides(player, ghost)) {
                tryEscape();
            }

            // tryMoveY(
            //     player.bd,
            //     player.bd.vy,
            //     map,
            //     () => {
            //         if (player.bd.vy > 0) {
            //             player.bd.gd = fixedGameTime + 5 * fixedDeltaTime; // 5 frames of coyote time
            //             player.bd.vy = 0;
            //             player.bd.gv = g1;
            //         }
            //         // If moving up
            //         if (player.bd.vy < 0) {
            //             // If this tile is solid, put the player on the bottom side of it and let it fall
            //             player.bd.vy = 0;
            //         }
            //     }
            // );

            mv = input.l ? -1 : input.r ? 1 : 0;
            if (!mv) player.sprint = false;

            player.bd.x += mv * (player.sprint ? player_speed2 : player_speed1) + player.bd.vx;
            // tryMoveX(
            //     player.bd,
            //     mv * (player.sprint ? player_speed2 : player_speed1) + player.bd.vx,
            //     map,
            //     () => {
            //         // if (can_do_climb) {
            //         //     hero.vy = -.07;
            //         // }
            //     }
            // );
            player.bd.fc = mv || player.bd.fc;
            // console.log('player.image', fixedGameTime, fixedGameTime * fixedDeltaTime, Math.ceil(fixedGameTime * fixedDeltaTime * 10) % 2);
            player.image = !mv ? images.pi : (Math.ceil(fixedGameTime / (fixedDeltaTime * 10)) % 2 == 0 ? images.pr1 : images.pr2);


            // // If up key is pressed and the hero is grounded, jump
            // if (input.s && player.bd.vy >= 0 && player.bd.gd >= fixedGameTime && player.bd.cj) {
            //     // console.log('jump', player.bd.gd, fixedGameTime, player.bd.gd - fixedGameTime);
            //     player.bd.vy = -.315;
            //     player.bd.gv = g1;
            //     player.bd.cj = 0;
            // }
            // if (!input.s) {
            //     player.bd.cj = 1;
            //     if (player.bd.vy < 0) {
            //         if (player.bd.vy < -0.15) player.bd.vy = -0.15;
            //         player.bd.gv = g2;
            //     }
            // }

            updateDoors();
            // knownFloorsGroup.children.map(x => x.update());
            knownFloorsGroup.update();
        },
        //#endregion
        //#region render()
        render() { // render the game state
            // context2.clearRect(0, 0, canvas2.width, canvas2.height);
            // context.save();
            // background
            // context.fillStyle = BACKGROUND_COLOR;
            context.globalAlpha = 1;
            context.fillStyle = '#000000';
            context.fillRect(0, 0, canvas_width, canvas_height);

            player.x = player.bd.x * tile_w + player.bd.w * .5 * tile_w;
            player.y = player.bd.y * tile_h + player.bd.h * tile_h;
            player.scaleX = transitionType == 3 ? 0 : 2 * player.bd.fc;

            scene.camera.x = player.x;

            const loopIndex = Math.round((player.bd.x + map.w / 2) / map.w) - 1;
            for (let room_image of room_images) {
                room_image.x = ((Math.floor((loopIndex + 1 - room_image.loopIndex) / 3)) * 3 + room_image.loopIndex) * map.w * tile_w;
            }

            for (let door of [...doors, ghost]) {
                while (door.x - player.x > map.w / 2 * tile_w) {
                    /* #IfDev */
                    console.log(`door[${door?.room?.roomId ?? 'ghost'}] is too right`);
                    /* #EndIfDev */
                    door.x -= map.w * tile_w;
                }
                while (player.x - door.x > map.w / 2 * tile_w) {
                    /* #IfDev */
                    console.log(`door[${door?.room?.roomId ?? 'ghost'}] is too left`);
                    /* #EndIfDev */
                    door.x += map.w * tile_w;
                }
            }

            scene.render();
            knownFloorsGroup.render();

            if (transitioningUntil > Date.now() || transitionType == 5) {
                switch (transitionType) {
                    case 1:  // up
                    case 2: // down
                        // draw a very long rectangle moving upwards at constant speed
                        const height = a_room_cache.height + a_room_cache.height + 1000;
                        // const speed = height / transition_length_1;
                        const yy = (1 - (transitioningUntil - Date.now()) / transition_length_1) * (height + a_room_cache.height);
                        /* #IfDev */
                        // console.log('fillRect', 1 - ((transitioningUntil - Date.now()) / transition_length_1), yy, a_room_cache.height);
                        /* #EndIfDev */

                        context.fillStyle = '#000000';
                        context.fillRect(0, transitionType == 1 ? (-yy + a_room_cache.height) : (yy - height), canvas_width, height);

                        context.fillStyle = 'white';
                        context.font = "18px Arial";
                        context.textAlign = "center";
                        context.fillText("Riding lift...", canvas_width_2, canvas_height_2);
                        break;
                    case 3: // fall into the next loop
                        context.fillStyle = '#000000';
                        const radius = Math.pow(1 - (transitioningUntil - Date.now()) / transition_length_3, 2) * canvas_width * 2;
                        // const scale = Math.min(2, (transitioningUntil - Date.now()) / transition_length_3 * 2.5);
                        const scale = (1 - Math.pow(1 - ((transitioningUntil - Date.now()) / transition_length_3), 2)) * 4;
                        /* #IfDev */
                        // console.log('radius', radius, scale);
                        /* #EndIfDev */
                        context.beginPath();
                        context.arc(canvas_width_2, canvas_height_2, radius, 0, 2 * Math.PI);
                        context.fill();
                        context.drawImage(images.pf, canvas_width_2 - 16 * scale / 2, canvas_height_2 + 20 - 16 * 0.8 * scale, 16 * scale, 16 * scale);

                        if (transitioningUntil - Date.now() < 2000) {
                            context.fillStyle = 'white';
                            context.font = "32px Arial";
                            context.textAlign = "center";
                            context.fillText("No escape!", canvas_width_2, canvas_height_2 - 40);
                            context.font = "18px Arial";
                            context.fillText("The true 13/F was marked " + lastCorrectExit + "/F", canvas_width_2, canvas_height_2 + 40);
                            context.fillText("Randomizing the hotel...", canvas_width_2, canvas_height_2 + 40 + 18);
                        }
                        break;
                    case 4: // start level
                        context.fillStyle = '#000000';
                        context.globalAlpha = 1 - Math.pow(1 - (transitioningUntil - Date.now()) / transition_length_4, 2);
                        context.fillRect(0, 0, canvas_width, canvas_height);

                        if (transitioningUntil - Date.now()) {
                            context.globalAlpha = 1;
                            context.fillStyle = 'white';
                            context.font = "18px Arial";
                            context.textAlign = "center";
                            context.fillText("Exit from the true 13/F", canvas_width_2, canvas_height_2);
                            // context.fillText("but they skipped some superstitious numbers...", canvas_width_2, canvas_height_2 + 18);
                        }
                        break;
                    case 5: // win
                        context.fillStyle = 'white';
                        context.globalAlpha = Math.pow((1 - (transitioningUntil - Date.now()) / transition_length_5) * 2, 2);
                        context.fillRect(0, 0, canvas_width, canvas_height);

                        if (transitioningUntil - Date.now() < 1000) {
                            context.fillStyle = '#000000';
                            context.font = "32px Arial";
                            context.textAlign = "center";
                            context.fillText("You win!", canvas_width_2, canvas_height_2 - 40);
                            context.font = "18px Arial";
                            context.fillText("You win after " + loopCount + " fail attempts", canvas_width_2, canvas_height_2 + 40);
                            context.fillText("Refresh the page to play again", canvas_width_2, canvas_height_2 + 40 + 18);
                        }
                        break;
                }
            }
        },
        //#endregion
    });

    loop.start();    // start the game

    const restart = () => {
        // cleanup
        loop.stop();

        window.removeEventListener('keydown', keyHandler);
        window.removeEventListener('keyup', keyHandler);
        canvas.removeEventListener('pointerenter', _focus);

        // restart
        start();
    };
};

//#region  tryMoveX()
// const tryMoveX = (/** @type {ITransform}*/ entity, dx, map, solidCallback) => {
//     entity.x += dx;
//     // if (dx <= 0) {
//     //     entity.x = Math.max(entity.x, 0);
//     // } else {
//     //     entity.x = Math.min(map.w - entity.w, entity.x);
//     // }

//     let probeX = (dx <= 0 ? entity.x : entity.x + entity.w);
//     while (probeX < 0) probeX += map.w;
//     probeX = probeX % map.w;

//     const tile1 = +map[~~(entity.y)][~~(probeX)];
//     const tile2 = +map[~~(entity.y + 0.5 * entity.h)][~~(probeX)];
//     const tile3 = +map[~~(entity.y + entity.h - .1)][~~(probeX)];

//     // const oldX = entity.x;
//     if (tile1 == 1 || tile2 == 1 || tile3 == 1) {
//         // @ts-ignore (using && to do if-else)
//         entity.x = (dx <= 0 ? Math.ceil(entity.x) : ~~(entity.x + (entity.x > 0 && entity.w)) - entity.w);
//         if (solidCallback) solidCallback();
//     }
//     // if (dx != 0) {
//     //     // console.log('tryMoveX', oldX, entity.x, entity.x + entity.w);
//     //     console.log('tryMoveX', entity.x, Math.round((entity.x + map.w / 2) / map.w) - 1);
//     // }

//     return entity;
// };

//#endregion
//#region tryMoveY()
// const tryMoveY = (/** @type {ITransform}*/ entity, dy, map, solidCallback) => {
//     entity.y += dy;
//     if (dy <= 0) {
//         entity.y = Math.max(entity.y, 0);
//     } else {
//         entity.y = Math.min(map.h - entity.h, entity.y);
//     }

//     let probeX = entity.x;
//     while (probeX < 0) probeX += map.w;
//     probeX = probeX % map.w;
//     const probeY = (dy <= 0 ? entity.y : entity.y + entity.h);

//     const tile1 = +map[~~(probeY)][~~(probeX)];
//     const tile2 = +map[~~(probeY)][~~(probeX + entity.w - .1)];

//     if (tile1 == 1 || tile2 == 1) {
//         entity.y = (dy <= 0 ? Math.ceil(entity.y) : ~~(entity.y + entity.h) - entity.h);
//         if (solidCallback) solidCallback();
//     }

//     return entity;
// };

//#endregion
const cache_map = (cache, _map) => {
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
        // if (tile == 'w' || (tile != 'w' && row[x - 1] == 'w' && row[x + 1] == 'w')) {
        //     cache_c.fillStyle = "#0B0";
        //     cache_c.fillRect(x * tile_w, y * tile_h + 6, tile_w, tile_h - 6);
        // }
    }));
};

window.onload = start;