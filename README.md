# Night-at-Hotel-13
Escape from a looping nightmare staying at a haunted hotel

Made for the js13k game jam 2024


# About

You checked into the 17th floor of Hotel-13.
You noticed that 17/F is actually 13/F if they haven't skipped 4/F, 7/F, 13/F, 14/F,
so you couldn't sleep the whole night.

You finally slept, but can you wake up from the nightmare?

Collect clues and deduce the actual 13/F, and/or the skipped floor numbers!


# Controls

- Use WASD, ZQSD, or Arrow keys to move.
- Press Up or Down to take lift.
- Press Up at the EXIT to attempt exit.
- Click numbers to jot notes
- Click notes to change color, click between note items to insert blanks.
- Click blank notes to delete them.

(Managed to not use road roller, at the cost of no bgm)


# Credits

- [Kontra.js](https://github.com/straker/kontra) by straker
- Webpack
- jsfxr

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

```powershell
node .\scripts\convertSound.js
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

- [x] Building generation (cli)
- [x] Building traversal
  - [x] Rendering
  - [x] Run
  - [x] Dash
  - [x] Doors
  - [x] Ride lift
  - [x] Game Over screen
  - [x] Win screen
- [x] Clue collection
  - [x] Click clue
  - [x] Render clue
  - [x] Arrange clues
- [x] Boss chasing, circular corridor
  - [x] Player wrap around
  - [x] Doors wrap around
  - [x] Enemies wrap around
- [ ] Hiding mechanics
- [ ] Enemies, combat
- [ ] Unlockable tools like faster shoes
