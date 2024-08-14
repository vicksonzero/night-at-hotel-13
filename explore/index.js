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


const building = {
    lifts: [],
    floors: new Array(floorCount).fill(0).map((_, floorId) => ({
        floorId,
        isAccessible: false,
        // isExit: false,
        floorAlias: floorId + 1,
        rooms: new Array(floorWidth).fill(0).map((_, roomId) => (
            createRoom(floorId, roomId)
        ))
    }))
};

generateMap(building, {
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
