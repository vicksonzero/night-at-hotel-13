//@ts-check
import { generateMap } from "../src/app/mapGenerator.js";
import { printMap } from "./functions.js";
import { writeFileSync } from 'fs';
import { DateTime } from 'luxon';

const floorCount = 13;
const floorWidth = 15;

const liftPerFloorMin = 2;
const liftPerFloorMax = 4;
const liftRandomCount = 8;
const accessibleFloorCount = 13;

const aliasMax = 22;
const aliasMin = 14;
const aliasSafe = 3;
const aliasSkip = 5;



const building = generateMap(
    floorCount,
    floorWidth,

    liftPerFloorMin,
    liftPerFloorMax,
    liftRandomCount,
    accessibleFloorCount,

    aliasMax,
    aliasMin,
    aliasSafe,
    aliasSkip,
);

writeFileSync(`./_out/${DateTime.now().toFormat('yyyy_MM_dd_HH_mm_ss')}.json`, JSON.stringify(building, null, 4));
writeFileSync(`./_out/building.json`, JSON.stringify(building, null, 4));

printMap(building);

const merged = [...building.af, ...building.as];
merged.sort((a, b) => b - a);
console.log('all', merged.join(', '));
console.log('skipped', building.as.join(', '));
console.log('alias.floors', building.af.join(', '));
const exit = building.floors.find(x => x.isExit);
console.log(`Exit floor: ${exit?.fa} [${exit?.floorId}]`);

