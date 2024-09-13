//@ts-check
import * as jsfxrJS from '../lib/jsfxr.js';
const { jsfxr } = jsfxrJS;
// thanks https://codepen.io/jackrugile/post/arcade-audio-for-js13k-games
export class ArcadeAudio {
    constructor() {
        this.sounds = {};
        this.volume = 1;

        this.add('coin', 5,
            [
                // [1,,0.071,0.401,0.381,0.674,,,,,,,,,,,,,1,,,,,0.25,44100,8],
                // [1, , 0.073, 0.425, 0.339, 0.393, , , , , , 0.45, 0.644, , , , , , 1, , , , , 0.25, 44100, 8],
                [1, , 0.087, 0.549, 0.344, 0.491, , , , , , 0.556, 0.686, , , , , , 1, , , , , 0.25, 44100, 8],
            ]
        );
        this.add('up', 1, [
            [, , 0.196, , 0.15, 0.349, , 0.247, , , , , , 0.035, , , , , 1, , , 0.207, , 0.25, 44100, 8],
        ]);

        this.add('down', 1, [
            [, , 0.196, , 0.15, 0.143, , 0.247, , , , , , 0.035, , , , , 1, , , 0.207, , 0.25, 44100, 8],
        ]);

        this.add('death', 1, [
            // [3, , 0.18, , 0.338, 0.76, , -0.546, , , , , , , , , , , 1, , , 0.215, , 0.25, 44100, 8],
            [3, , 0.18, 0.02, 0.41, 0.637, , -0.546, , , , , , , , , , , 1, , , 0.215, , 0.25, 44100, 8],
        ]);

        this.add('trans', 1, [
            [3, , 0.2, , 1, 0.24, , 0.293, -0.152, , , -0.713, 0.837, , , 0.076, , , 1, , , , , 0.25, 44100, 8],
        ]);

        this.add('step', 3, [
            // [3, , 0.077, , 0.118, 0.133, , -0.512, , , , , , , , , , , 0.361, , , 0.942, , 0.25, 44100, 8],
            [3, , 0.077, , 0.118, 0.133, , -0.512, , , , , , , , , , , 0.49, , , 0.942, , 0.25, 44100, 8],
        ]);
        /* #IfDev */
        this.add('test', 1, [
            [1, , 0.071, 0.401, 0.381, 0.674, , , , , , , , , , , , , 1, , , , , 0.25, 44100, 8],
        ]);
        /* #EndIfDev */
    }

    add(key, allowAtSameTime, settings) {
        this.sounds[key] = [];
        settings.map((elem, variantIndex) => {
            this.sounds[key].push({
                tick: 0,
                // count: allowAtSameTime,
                pool: []
            });
            for (let i = 0; i < allowAtSameTime; i++) {
                let audio = new Audio();
                audio.src = jsfxr(elem);
                /* #IfDev */
                audio.addEventListener("loadeddata", () => {
                    console.log('loaded', key);
                });
                /* #EndIfDev */
                this.sounds[key][variantIndex].pool.push(audio);
            }
        });
    }

    play(key, volume = this.volume) {
        /* #IfDev */
        console.log('play', key);
        /* #EndIfDev */
        let sound = this.sounds[key];
        let soundVariant = sound.length > 1 ? sound[(Math.random() * sound.length) | 0] : sound[0];
        /* #IfDev */
        console.log('soundVariant', soundVariant, soundVariant.tick);
        /* #EndIfDev */
        let soundElement = soundVariant.pool[soundVariant.tick];
        // soundData.tick < soundData.count - 1 ? soundData.tick++ : soundData.tick = 0;
        soundVariant.tick = (soundVariant.tick + 1) % soundVariant.pool.length;
        soundElement.volume = volume;
        soundElement.play().catch(e => {
            /* do nothing */
            /* #IfDev */
            console.log('play().catch', e);
            /* #EndIfDev */
        });
        return soundElement;
    }
}