//@ts-check
// import * as imageList from './imageList.js';
// import { colors } from './colors.js'

import Lift_Door1 from '../assets/Lift_Door1.png'
import Lift_Door2 from '../assets/Lift_Door2.png'
import Lift_Door3 from '../assets/Lift_Door3.png'
import Player_idle from '../assets/Player_idle.png'
import Player_fall from '../assets/Player_fall.png'
import Player_run1 from '../assets/Player_run1.png'
import Player_run2 from '../assets/Player_run2.png'
import Door from '../assets/Door.png'
import ExitDoor1 from '../assets/ExitDoor1.png'
import ExitDoor2 from '../assets/ExitDoor2.png'

export async function loadImages() {
    return {
        // basicEnemyPhysical: decompress(imageList.tile028, colors.darkGray),
        // basicEnemySpectral: decompress(imageList.tile028, colors.gray),
        // basicEnemyOrange: decompress(imageList.tile028, colors.darkOrange),

        // shooterEnemyPhysical: decompress(imageList.tile080, colors.darkGray),
        // shooterEnemySpectral: decompress(imageList.tile080, colors.gray),

        // ghostFirePhysical: decompress(imageList.tile505, colors.white),
        // ghostFireSpectral: decompress(imageList.tile505, colors.lightGray),
        // ghostFireZero: decompress(imageList.tile505, colors.zero),

        // playerPhysical: decompress(imageList.tile077, colors.darkGray),
        ld1: await createImageAsync(Lift_Door1),
        ld2: await createImageAsync(Lift_Door2),
        ld3: await createImageAsync(Lift_Door3),
        pi: await createImageAsync(Player_idle),
        pf: await createImageAsync(Player_fall),
        pr1: await createImageAsync(Player_run1),
        pr2: await createImageAsync(Player_run2),
        d: await createImageAsync(Door),
        ed1: await createImageAsync(ExitDoor1),
        ed2: await createImageAsync(ExitDoor2),

        // boxWhite: decompress(imageList.tile121, colors.white),
        // boxDarkGray: decompress(imageList.tile121, colors.lightGray),

        // spiritRevolverBlue: decompress(imageList.tile479, colors.blue),

        // floorTile2: decompress(imageList.tile002, colors.lightGray),
    };
}


function decompress(bitArray2D, color = '#fff') {
    const [width, ...compressed] = bitArray2D;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = compressed.length;

    /** @type {CanvasRenderingContext2D} */
    // @ts-ignore
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;

    for (let y = 0; y < compressed.length; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = compressed[y] & (1 << x);
            if (pixel) ctx.fillRect(x, y, 1, 1);
        }
    }

    // return canvas.toDataURL('image/png');
    return canvas;
}

async function createImageAsync(src) {
    const image = new Image();
    await new Promise(resolve => {
        image.src = src;
        image.onload = resolve;
    });

    return image;
}