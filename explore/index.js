import { createRoom, generateMap, printMap } from "./functions.js";

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
    isAccessible: false,
    floors: new Array(floorCount).fill(0).map((_, floorId) => ({
        floorId,
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


printMap(building);
