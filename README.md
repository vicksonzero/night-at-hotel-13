# night-at-hotel-13
Walk a fine line between the Spectral Dimension and Physical Dimension in this Twin Stick Shooter.

Made for the js13k game jam 2022


# About

Undeads don't actually die. 
They just go into the spectral world, and resurrect after some time.

You are an undead hunter, gifted with the ability to move 
between the physical world, and the spectral world.
Dive into the spectral world to kill them for good.

Move around using WASD, ZQSD, or ← ↓ ↑ →
Aim with mouse and shoot by holding left click.

If you ever find yourself dead, 
just collect some souls from the spectral world to revive.



# Credits

- [Kenney.nl](https://kenney.nl) !!!!
- [Kontra.js](https://github.com/straker/kontra) by straker
- Webpack
- mvasilkov for telling me about 1-bit sprite compression
- 

# How to compress images

in the project directory, run:

```bash
npm install
node ./scripts/compress1BitImages.js
```

Copy the result into `imageList.js`, decompress with the `decompress(imgArrayStr, color)` script included in `compress1BitImages.js`


# How to make sfx

1. Go to https://sfxr.me/
2. Randomize, generate sfx
3. Press serialize
4. Use the following script to convert their format to my format

```js
Object.values({
  "oldParams": true,
  "wave_type": 1,
  "p_env_attack": 0,
  "p_env_sustain": 0.09525642260964472,
  "p_env_punch": 0.4519257574525253,
  "p_env_decay": 0.26047334238817443,
  "p_base_freq": 0.6453867117134183,
  "p_freq_limit": 0,
  "p_freq_ramp": 0,
  "p_freq_dramp": 0,
  "p_vib_strength": 0,
  "p_vib_speed": 0,
  "p_arp_mod": 0.29925948382257306,
  "p_arp_speed": 0.6654418466762786,
  "p_duty": 0,
  "p_duty_ramp": 0,
  "p_repeat_speed": 0,
  "p_pha_offset": 0,
  "p_pha_ramp": 0,
  "p_lpf_freq": 1,
  "p_lpf_ramp": 0,
  "p_lpf_resonance": 0,
  "p_hpf_freq": 0,
  "p_hpf_ramp": 0,
  "sound_vol": 0.25,
  "sample_rate": 44100,
  "sample_size": 8
}).map(a=>Math.floor(a*1000)/1000)
```

(See https://github.com/vicksonzero/night-at-hotel-13/blob/master/src/lib/jsfxr.js#L31-L54)

Mapping:

| old                 | new             |
| ------------------- | --------------- |
| waveType            | wave_type       |
| attackTime          | p_env_attack    |
| sustainTime         | p_env_sustain   |
| sustainPunch        | p_env_punch     |
| decayTime           | p_env_decay     |
| startFrequency      | p_base_freq     |
| minFrequency        | p_freq_limit    |
| slide               | p_freq_ramp     |
| deltaSlide          | p_freq_dramp    |
| vibratoDepth        | p_vib_strength  |
| vibratoSpeed        | p_vib_speed     |
| changeAmount        | p_arp_mod       |
| changeSpeed         | p_arp_speed     |
| squareDuty          | p_duty          |
| dutySweep           | p_duty_ramp     |
| repeatSpeed         | p_repeat_speed  |
| phaserOffset        | p_pha_offset    |
| phaserSweep         | p_pha_ramp      |
| lpFilterCutoff      | p_lpf_freq      |
| lpFilterCutoffSweep | p_lpf_ramp      |
| lpFilterResonance   | p_lpf_resonance |
| hpFilterCutoff      | p_hpf_freq      |
| hpFilterCutoffSweep | p_hpf_ramp      |
| masterVolume        | sound_vol       |
|                     | sample_rate     |
|                     | sample_size     |


# Roadmap

## Milestone 1 (Code)

Assets
- [x] kenney 1-bit sprite for a start
- [x] use kontra.js for minimal library
- [x] use 8-bit sound effects

Language
- [x] use esm + js + webpack5
- [x] use base64 for images. no loading
- [x] use zipping and size-counting


## Minimize

- [ ] ModuleConcatenationPlugin
- [ ] https://lifthrasiir.github.io/roadroller/