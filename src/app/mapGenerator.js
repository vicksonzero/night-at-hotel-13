
//@ts-check
const onlyUnique = (value, index, array) => {
    return array.indexOf(value) === index;
};

// export function createRoom(floorId, roomId) {
//     return ;
// }
// export function createLiftDoor(liftId) {
//     return {
//         liftId,
//         // up, down
//     }
// }
// export function createLift(liftId, roomId, floorIds = []) {
//     floorIds.sort((a, b) => a - b);
//     return {
//         liftId,
//         roomId,
//         floorIds,
//     }
// }
export const generateMap = (
    floorCount,
    floorWidth,
    liftPerFloorMin,
    liftPerFloorMax,
    liftRandomCount,
    accessibleFloorCount,
    // maximum amount of floors in the alias naming
    aliasMax,
    // minimum amount of floors in the alias naming
    aliasMin,
    // floors lower than this are never superstitious
    aliasSafe,
    // amount of superstitious floors that we want to skip
    aliasSkip
) => {
    console.log('generateMap');
    const [floorAliasList, skipped] = generateFloorAlias(
        aliasMax,
        aliasMin,
        aliasSafe,
        aliasSkip,
    );
    /* #IfDev */
    console.log('floorAliasList', floorAliasList);
    console.log('skipped', skipped);
    /* #EndIfDev */

    const building = {
        /** @type {Array<any>} */
        lifts: [],
        af: floorAliasList,
        as: skipped,
        exitFloorId: 13 - (floorAliasList.length - floorCount + 1),
        floors: Array(floorCount).fill(0).map((_, floorId) => ({
            floorId,
            acc: false, // isAccessible
            isExit: false,
            fa: 0, // floor alias
            rooms: Array(floorWidth).fill(0).map((_, roomId) => ({
                // t: 'room',
                floorId, roomId,
                escapeDoor: roomId == 0,
                // liftDoor: createLiftDoor(liftId)
                // shaft: liftId
                empty: Math.random() < 0.3,
            }))
        }))
    }

    const { floors } = building;

    /* #IfDev */
    console.log('exitFloor', building.exitFloorId);
    /* #EndIfDev */
    let accessible = [];
    accessible.push(building.exitFloorId);
    floors[building.exitFloorId].acc = true;
    floors[building.exitFloorId].isExit = true;


    for (let i = 0; i < liftRandomCount || accessible.length < accessibleFloorCount; i++) {
        /* #IfDev */
        if (i >= liftRandomCount)
            console.log(`(${i}) Adding more floors to ensure accessibleFloorCount becomes '${accessibleFloorCount}'`);
        /* #EndIfDev */

        generateLiftRandomly(building, accessible, liftPerFloorMax, true);

        accessible = accessible.filter(onlyUnique);
        accessible.sort((a, b) => a - b);
        /* #IfDev */
        console.log(`accessible`, accessible);
        console.log(``);
        console.log(``);
        /* #EndIfDev */
    }

    /* #IfDev */
    console.log(`merging lifts`, sortBy(building.lifts, (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */
    mergeLiftsInBuilding(building);
    /* #IfDev */
    console.log(`merged lifts`, sortBy(building.lifts, (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */
    for (const lift of building.lifts) {
        lift.floorIds = lift.floorIds.filter(onlyUnique);
        lift.floorIds.sort((a, b) => a - b);
    }
    /* #IfDev */
    console.log(`unique lifts`, sortBy(building.lifts.filter((lift, i) => lift.liftId == i), (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */

    populateLiftDoors(building);

    let i = 0;
    for (let floorIndex = floors.length - 1; floorIndex >= 0; floorIndex--) {
        floors[floorIndex].fa = building.af[i];
        i++;
    }

    return building;
};

export const generateLiftRandomly = (building, accessible, liftPerFloorMax, isExpanding) => {
    const { floors, lifts } = building;
    // const floorId = (() => {
    //     let result;
    //     let liftCount;
    //     do {
    //         result = accessible[Math.floor(Math.random() * accessible.length)];

    //         const floor = floors[result];
    //         liftCount = floor.rooms.filter(r => r.liftDoor).length;

    //         console.log(`Random floor: ${result} (${liftCount} lifts)`);
    //     } while (!(liftCount < liftPerFloorMax));
    //     return result;
    // })();
    const floorId = accessible[Math.floor(Math.random() * accessible.length)];

    const floor = floors[floorId];
    const { rooms } = floor;
    let liftDoorRooms = rooms.filter(r => r.liftDoor);
    let availableRooms = rooms.filter(r => !r.escapeDoor && !r.liftDoor);
    if (liftDoorRooms.length >= liftPerFloorMax) {
        availableRooms = liftDoorRooms;
    }
    const randomRoomId = availableRooms[Math.floor(Math.random() * availableRooms.length)];

    const toFloorId = ((fromFloorId) => {
        let result;
        do {
            result = Math.floor(Math.random() * floors.length)
            /* #IfDev */
            if (!isExpanding) console.log(`round2 random: `, result, accessible.includes(result));
            /* #EndIfDev */
        } while (!(result != fromFloorId && (isExpanding || !accessible.includes(result))));
        return result;
    })(floorId);

    generateLiftDraft(building, floorId, randomRoomId.roomId, toFloorId);

    floors[toFloorId].acc = true;
    accessible.push(toFloorId);
};

export const generateLiftDraft = (building, fromFloorId, roomId, toFloorId) => {
    // try to build a lift on the same roomId, from floorId to tooFloorId
    // if can't, then connect to existing lift
    const { floors, lifts } = building;


    /* #IfDev */
    if (fromFloorId == toFloorId) throw new Error(`Cannot create lift on the same level '${fromFloorId}'`);
    /* #EndIfDev */


    const direction = Math.sign(toFloorId - fromFloorId);

    const newLift = {
        liftId: lifts.length,
        roomId,
        floorIds: [fromFloorId, toFloorId],
    };
    newLift.floorIds.sort((a, b) => a - b);
    /* #IfDev */
    console.log(`Create lift #${newLift.liftId} (${fromFloorId}->${toFloorId}) on room '${roomId}', dir=${direction}`);
    /* #EndIfDev */

    lifts.push(newLift);
    for (let i = fromFloorId + direction; Math.sign(toFloorId - i) == direction; i += direction) {
        // this for-loop may or may not cover the lift doors, but i don't care.
        // the rest of the code can handle null room.shaft just fine
        const floor = floors[i];
        /* #IfDev */
        console.log(`(Lift ${newLift.liftId}) Create shaft at (${i}) on room '${roomId}'`);
        /* #EndIfDev */
        floor.rooms[roomId].shaft = newLift.liftId;
    }
    floors[fromFloorId].rooms[roomId].liftDoor = { liftId: newLift.liftId };
    floors[toFloorId].rooms[roomId].liftDoor = { liftId: newLift.liftId };
};

export const mergeLiftsInBuilding = building => {
    const { floors, lifts } = building;

    for (let roomId = 0; roomId < floors[0].rooms.length; roomId++) {
        const liftsByRoomId = lifts.filter(lift => lift.roomId == roomId);
        /* #IfDev */
        console.log(`Trying to merge '${liftsByRoomId.length}' lifts at room-${roomId}`);
        /* #EndIfDev */

        liftsByRoomId.sort((a, b) => a.liftId - b.liftId);

        for (const lift of liftsByRoomId) {
            const sortedFloorIds = sortBy(lift.floorIds, (a, b) => a - b);
            const lastFloorId = sortedFloorIds[sortedFloorIds.length - 1];
            for (let floorId = sortedFloorIds[0]; floorId <= lastFloorId; floorId++) {

                const room = floors[floorId].rooms[roomId];
                /* #IfDev */
                console.log(`lift-${lift.liftId} (${floorId}, ${roomId})`);
                /* #EndIfDev */

                // here, room is also modified in place, 
                // and we scan by physical position, not by lift sorting.
                // so i can safely assume the follow case to be covered:
                // [ 1:  o----o              ]
                // [ 2:             o-----o  ]
                // [ 3:       o-----o        ]
                // expect to become:
                // [ 1:  o----o-----o-----o  ]

                if (room.liftDoor && room.liftDoor.liftId != lift.liftId) {
                    mergeLifts(building,
                        Math.min(lift.liftId, room.liftDoor.liftId),
                        Math.max(lift.liftId, room.liftDoor.liftId)
                    );
                    break;
                } else if (room.shaft && room.shaft != lift.liftId) {
                    mergeLifts(building,
                        Math.min(lift.liftId, room.shaft),
                        Math.max(lift.liftId, room.shaft)
                    );
                    break;
                }
            }
        }
        /* #IfDev */
        console.log('');
        /* #EndIfDev */
    }
};


export const mergeLifts = (building, toLiftId, fromLiftId) => {
    /* #IfDev */
    console.log(`Merge lift-${fromLiftId} into lift-${toLiftId}`);
    /* #EndIfDev */
    const { floors, lifts } = building;

    lifts[fromLiftId].liftId = toLiftId; // point to parent

    const { roomId, floorIds } = lifts[fromLiftId];

    const sortedFloorIds = sortBy(floorIds, (a, b) => a - b);
    const lastFloorId = sortedFloorIds[sortedFloorIds.length - 1];
    for (let floorId = sortedFloorIds[0]; floorId <= lastFloorId; floorId++) {
        const room = floors[floorId].rooms[roomId];

        if (room.liftDoor && room.liftDoor.liftId == fromLiftId) {
            room.liftDoor.liftId = toLiftId;
            lifts[toLiftId].floorIds.push(floorId);
        }
        if (room.shaft != null) room.shaft = toLiftId;
    }
};

export const populateLiftDoors = building => {
    const { floors, lifts } = building;

    lifts.forEach((lift, i) => {
        if (lift.liftId != i) {
            lifts[i] = null;
        }
    });
    for (const lift of lifts) {
        if (!lift) continue;
        for (let i = 0; i < lift.floorIds.length; i++) {
            floors[lift.floorIds[i]].rooms[lift.roomId].liftDoor.up = i < lift.floorIds.length - 1
                ? lift.floorIds[i + 1]
                : null;
            floors[lift.floorIds[i]].rooms[lift.roomId].liftDoor.down = i > 0
                ? lift.floorIds[i - 1]
                : null;
        }
    }

};

export const generateFloorAlias = (aliasMax, aliasMin, aliasSafe, aliasSkip) => {

    const result = [];
    const skippedAliasList = [];

    const countFloors = Math.floor(Math.random() * (aliasMax - aliasMin)) + aliasMin + aliasSkip;
    for (let i = countFloors; i > 0; i--) {
        result.push(i);
    }

    /* #IfDev */
    console.log('Building height: ', countFloors);
    console.log('Building alias: ', result.join(', '));
    /* #EndIfDev */
    // skip 13
    skippedAliasList.push(...result.splice(result.indexOf(13), 1));

    // skip the rest
    for (let i = 0; i < aliasSkip - 1; i++) {
        let skippingFloor;

        do {
            skippingFloor = Math.floor(Math.random() * result.length);
        } while (!(result[skippingFloor] > aliasSafe));
        skippedAliasList.push(...result.splice(skippingFloor, 1));
    }

    skippedAliasList.sort((a, b) => b - a);
    return [result, skippedAliasList];
};

const sortBy = (array, predicate) => {
    const copy = [...array];
    copy.sort(predicate);
    return copy;
};
