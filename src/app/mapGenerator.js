
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

    /** @type {Array<any>} */
    const lifts = [];
    const af = floorAliasList;
    const as = skipped;
    const exitFloorId = 13 - (floorAliasList.length - floorCount + 1);
    const floors = Array(floorCount).fill(0).map((_, floorId) => ({
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
    }));


    /* #IfDev */
    console.log('exitFloor', exitFloorId);
    /* #EndIfDev */
    let accessible = [];
    accessible.push(exitFloorId);
    floors[exitFloorId].acc = true;
    floors[exitFloorId].isExit = true;


    for (let i = 0; i < liftRandomCount || accessible.length < accessibleFloorCount; i++) {
        /* #IfDev */
        if (i >= liftRandomCount)
            console.log(`(${i}) Adding more floors to ensure accessibleFloorCount becomes '${accessibleFloorCount}'`);
        /* #EndIfDev */

        generateLiftRandomly(floors, lifts, accessible, liftPerFloorMax, i >= liftRandomCount);

        accessible = accessible.filter(onlyUnique);
        /* #IfDev */
        console.log(`accessible`, sortBy(accessible, (a, b) => a - b));
        console.log(``);
        console.log(``);
        /* #EndIfDev */
    }

    /* #IfDev */
    console.log(`merging lifts`, sortBy(lifts, (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */

    mergeLiftsInBuilding(floors, lifts);

    /* #IfDev */
    console.log(`merged lifts`, sortBy(lifts, (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */


    for (const lift of lifts) {
        lift.floorIds = lift.floorIds.filter(onlyUnique);
        lift.floorIds.sort((a, b) => a - b);
    }
    /* #IfDev */
    console.log(`unique lifts`, sortBy(lifts.filter((lift, i) => lift.liftId == i), (a, b) => a.roomId - b.roomId));
    /* #EndIfDev */

    populateLiftDoors(floors, lifts);

    let i = 0;
    for (let floorIndex = floors.length - 1; floorIndex >= 0; floorIndex--) {
        floors[floorIndex].fa = af[i];
        i++;
    }

    return {
        lifts,
        af,
        as,
        exitFloorId,
        floors,
    };
};

export const generateLiftRandomly = (floors, lifts, accessible, liftPerFloorMax, isExpanding) => {
    const floorId = accessible[(Math.random() * accessible.length | 0)];

    const { rooms } = floors[floorId];;
    const liftDoorRooms = rooms.filter(r => r.liftDoor);
    const availableRooms = liftDoorRooms.length >= liftPerFloorMax
        ? liftDoorRooms
        : rooms.filter(r => !r.escapeDoor && !r.liftDoor);
    const randomRoom = availableRooms[Math.random() * availableRooms.length | 0];


    let toFloorId;
    do {
        toFloorId = (Math.random() * floors.length | 0)
        /* #IfDev */
        if (!isExpanding) console.log(`round2 random: `, toFloorId, accessible.includes(toFloorId));
        /* #EndIfDev */
    } while (!(toFloorId != floorId && (isExpanding || !accessible.includes(toFloorId))));

    generateLiftDraft(floors, lifts, floorId, randomRoom.roomId, toFloorId);

    floors[toFloorId].acc = true;
    accessible.push(toFloorId);
};

export const generateLiftDraft = (floors, lifts, fromFloorId, roomId, toFloorId) => {
    // try to build a lift on the same roomId, from floorId to tooFloorId
    // if can't, then connect to existing lift


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

export const mergeLiftsInBuilding = (floors, lifts) => {

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
                    mergeLifts(floors, lifts,
                        Math.min(lift.liftId, room.liftDoor.liftId),
                        Math.max(lift.liftId, room.liftDoor.liftId)
                    );
                    break;
                } else if (room.shaft && room.shaft != lift.liftId) {
                    mergeLifts(floors, lifts,
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


export const mergeLifts = (floors, lifts, toLiftId, fromLiftId) => {
    /* #IfDev */
    console.log(`Merge lift-${fromLiftId} into lift-${toLiftId}`);

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

export const populateLiftDoors = (floors, lifts) => {

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

    const countFloors = (Math.random() * (aliasMax - aliasMin) | 0) + aliasMin + aliasSkip;
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
            skippingFloor = (Math.random() * result.length | 0);
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
