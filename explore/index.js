//@ts-check
import { createRoom, generateMap, printMap } from "./functions.js";
import { writeFileSync } from 'fs';
import { DateTime } from 'luxon';

const floorCount = 13;
const floorWidth = 14;

const liftPerFloorMin = 2;
const liftPerFloorMax = 4;
const liftRandomCount = 8;
const accessibleFloorCount = 13;

const aliasMax = 20;
const aliasMin = 3;
const aliasSkip = 5;

;

const building = generateMap({
    floorCount,
    floorWidth,
    liftPerFloorMax,
    liftRandomCount,
    accessibleFloorCount,
    aliasMax,
    aliasMin,
    aliasSkip,
});

writeFileSync(`./_out/${DateTime.now().toFormat('yyyy_MM_dd_HH_mm_ss')}.json`, JSON.stringify(building, null, 4));
writeFileSync(`./_out/building.json`, JSON.stringify(building, null, 4));

printMap(building);
