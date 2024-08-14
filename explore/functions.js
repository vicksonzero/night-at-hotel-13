//@ts-check
function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}
export function createRoom(floorId, roomId) {

    return {
        t: 'room',
        floorId, roomId,
        // liftDoor: createLiftDoor(liftId)
        // shaft: liftId
    };
}

export function createLiftDoor(liftId) {
    return {
        liftId,
        // up, down
    }
}
export function createLift(liftId, roomId, floorIds = []) {
    floorIds.sort((a, b) => a - b);
    return {
        liftId,
        roomId,
        floorIds,
    }
}
export function printRoom(floorBuffer, room, isAccessible) {
    if (room.liftDoor) {
        const upStr = room.liftDoor.up ? ('' + room.liftDoor.up).padStart(2, ' ') : '--';
        const downStr = room.liftDoor.down ? ('' + room.liftDoor.down).padStart(2, ' ') : '--';
        floorBuffer[0] += `  ${upStr}  `;
        floorBuffer[1] += ` |${('' + room.liftDoor.liftId).padStart(2, ' ')}| `;
        floorBuffer[2] += `  ${downStr}  `;
    } else if (room.shaft != null) {
        floorBuffer[0] += `  ||  `;
        floorBuffer[1] += `  ||  `;
        floorBuffer[2] += `  ||  `;
    } else if (!isAccessible) {
        floorBuffer[0] += `XXXXXX`;
        floorBuffer[1] += `XXXXXX`;
        floorBuffer[2] += `XXXXXX`;
    } else if (room.hint) {
        floorBuffer[0] += `      `;
        floorBuffer[1] += ` (00) `;
        floorBuffer[2] += `      `;
    } else {
        floorBuffer[0] += `      `;
        floorBuffer[1] += `      `;
        floorBuffer[2] += `      `;
    }
}


export function createFloorBuffer() {
    return [
        "",
        "",
        ""
    ];
}
export function printRoomSeparator(floorBuffer) {
    floorBuffer[0] += `.`;
    floorBuffer[1] += `.`;
    floorBuffer[2] += `.`;
}
export function printB(floorBuffer, line0, line1, line2) {
    floorBuffer[0] += line0;
    floorBuffer[1] += line1;
    floorBuffer[2] += line2;
}
export function generateMap(building, config) {
    const {
        liftPerFloorMax,
        liftRandomCount,
        accessibleFloorCount,
        aliasMax,
        aliasMin,
        aliasSkip,
    } = config;

    const { floors } = building;

    const exitFloor = Math.floor(Math.random() * floors.length / 2 + floors.length / 2);
    console.log('exitFloor', exitFloor);
    let accessible = [];
    accessible.push(exitFloor);
    floors[exitFloor].isAccessible = true;

    for (let i = 0; i < liftRandomCount; i++) {

        generateLiftRandomly(building, accessible, { liftPerFloorMax }, true);

        accessible = accessible.filter(onlyUnique);
        accessible.sort((a, b) => a - b);
        console.log(`accessible`, accessible);
        console.log(``);
        console.log(``);
    }

    for (let i = 0; i < floors.length; i++) {
        if (accessible.length >= accessibleFloorCount) break;
        console.log(`(${i}) Adding more floors to ensure accessibleFloorCount becomes '${accessibleFloorCount}'`);

        generateLiftRandomly(building, accessible, { liftPerFloorMax }, false);

        accessible = accessible.filter(onlyUnique);
        accessible.sort((a, b) => a - b);
        console.log(`accessible`, accessible);
        console.log(``);
        console.log(``);
    }

    console.log(`merging lifts`, sortBy(building.lifts, (a, b) => a.roomId - b.roomId));
    mergeLiftsInBuilding(building);
    console.log(`merged lifts`, sortBy(building.lifts, (a, b) => a.roomId - b.roomId));
    for (const lift of building.lifts) {
        lift.floorIds.sort((a, b) => a - b);
    }
    console.log(`unique lifts`, sortBy(building.lifts.filter((lift, i) => lift.liftId == i), (a, b) => a.roomId - b.roomId));

    populateLiftDoors(building);
}

export function generateLiftRandomly(building, accessible, config, isExpanding) {
    const { liftPerFloorMax } = config
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
    let availableRooms = rooms.filter(r => r.liftDoor);
    if (availableRooms.length < liftPerFloorMax) {
        availableRooms = rooms.filter(r => !r.liftDoor);
    }
    const randomRoomId = availableRooms[Math.floor(Math.random() * availableRooms.length)];

    const toFloorId = ((fromFloorId) => {
        let result;
        do {
            result = Math.floor(Math.random() * floors.length)
            if (!isExpanding) console.log(`round2 random: `, result, accessible.includes(result));
        } while (!(result != fromFloorId && (isExpanding || !accessible.includes(result))));
        return result;
    })(floorId);

    generateLiftDraft(building, floorId, randomRoomId.roomId, toFloorId);

    floors[toFloorId].isAccessible = true;
    accessible.push(toFloorId);
}

export function generateLiftDraft(building, fromFloorId, roomId, toFloorId) {
    // try to build a lift on the same roomId, from floorId to tooFloorId
    // if can't, then connect to existing lift
    const { floors, lifts } = building;

    if (fromFloorId == toFloorId) throw new Error(`Cannot create lift on the same level '${fromFloorId}'`);


    const direction = Math.sign(toFloorId - fromFloorId);

    const newLift = createLift(lifts.length, roomId, [fromFloorId, toFloorId]);
    console.log(`Create lift #${newLift.liftId} (${fromFloorId}->${toFloorId}) on room '${roomId}', dir=${direction}`);

    lifts.push(newLift);
    for (let i = fromFloorId + direction; Math.sign(toFloorId - i) == direction; i += direction) {
        // this for-loop may or may not cover the lift doors, but i don't care.
        // the rest of the code can handle null room.shaft just fine
        const floor = floors[i];
        console.log(`(Lift ${newLift.liftId}) Create shaft at (${i}) on room '${roomId}'`);
        floor.rooms[roomId].shaft = newLift.liftId;
    }
    floors[fromFloorId].rooms[roomId].liftDoor = createLiftDoor(newLift.liftId);
    floors[toFloorId].rooms[roomId].liftDoor = createLiftDoor(newLift.liftId);
}

export function mergeLiftsInBuilding(building) {
    const { floors, lifts } = building;

    for (let roomId = 0; roomId < floors[0].rooms.length; roomId++) {
        const liftsByRoomId = lifts.filter(lift => lift.roomId == roomId);
        console.log(`Trying to merge '${liftsByRoomId.length}' lifts at room-${roomId}`);

        liftsByRoomId.sort((a, b) => a.liftId - b.liftId);

        for (const lift of liftsByRoomId) {
            const sortedFloorIds = sortBy(lift.floorIds, (a, b) => a - b);
            const lastFloorId = sortedFloorIds[sortedFloorIds.length - 1];
            for (let floorId = sortedFloorIds[0]; floorId <= lastFloorId; floorId++) {

                const room = floors[floorId].rooms[roomId];
                console.log(`lift-${lift.liftId} (${floorId}, ${roomId})`);

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
        console.log('');
    }
}


export function mergeLifts(building, toLiftId, fromLiftId) {
    console.log(`Merge lift-${fromLiftId} into lift-${toLiftId}`);
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
}

export function populateLiftDoors(building) {
    const { floors, lifts } = building;
}

export function printMap(building) {
    const { floors, lifts } = building;
    console.log('');

    let outputBuffer = createFloorBuffer();
    for (let floorIndex = floors.length - 1; floorIndex >= 0; floorIndex--) {
        outputBuffer = createFloorBuffer();

        const { floorId, floorAlias, rooms, isAccessible } = floors[floorIndex];
        printB(outputBuffer,
            `      `,
            ` ${('' + (floorAlias)).padStart(2, ' ')}/F `,
            `      `
        );
        printRoomSeparator(outputBuffer);
        for (const room of rooms) {
            printRoom(outputBuffer, room, isAccessible);
            printRoomSeparator(outputBuffer);
        }

        printB(outputBuffer,
            `      `,
            ` [${('' + (floorId)).padStart(2, ' ')}] `,
            `      `
        );

        console.log(new Array(outputBuffer[0].length).fill('-').join(''));
        console.log(outputBuffer[0]);
        console.log(outputBuffer[1]);
        console.log(outputBuffer[2]);
    }
    console.log(new Array(outputBuffer[0].length).fill('-').join(''));
}


function sortBy(array, predicate) {
    const copy = [...array];
    copy.sort(predicate);
    return copy;
}
