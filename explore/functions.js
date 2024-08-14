//@ts-check
function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}
export function createRoom(floorId, roomId) {

    return {
        t: 'room',
        floorId, roomId,
        // lift: createLift(liftId)
        // shaft: liftId
    };
}

export function createLift(liftId) {
    return {
        liftId,
        // up, down
    }
}
export function createLiftMaster(liftId) {
    return {
        liftId,
        floorIds: [],
    }
}
export function printRoom(floorBuffer, room, isAccessible) {
    if (room.lift) {
        const upStr = room.lift.up ? ('' + room.lift.up).padStart(2, ' ') : '--';
        const downStr = room.lift.down ? ('' + room.lift.down).padStart(2, ' ') : '--';
        floorBuffer[0] += `  ${upStr}  `;
        floorBuffer[1] += ` |${('' + room.lift.liftId).padStart(2, ' ')}| `;
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
    //         liftCount = floor.rooms.filter(r => r.lift).length;

    //         console.log(`Random floor: ${result} (${liftCount} lifts)`);
    //     } while (!(liftCount < liftPerFloorMax));
    //     return result;
    // })();
    const floorId = accessible[Math.floor(Math.random() * accessible.length)];

    const floor = floors[floorId];
    const { rooms } = floor;
    let availableRooms = rooms.filter(r => r.lift);
    if (availableRooms.length < liftPerFloorMax) {
        availableRooms = rooms.filter(r => !r.lift);
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

    if (isExpanding) {
        generateLift(building, floorId, randomRoomId.roomId, toFloorId);
    } else {
        generateLift(building, toFloorId, randomRoomId.roomId, floorId);
    }

    floors[toFloorId].isAccessible = true;
    accessible.push(toFloorId);
}

export function generateLift(building, draftFromFloorId, roomId, draftToFloorId) {
    // try to build a lift on the same roomId, from floorId to tooFloorId
    // if can't, then connect to existing lift
    const { floors, lifts } = building;

    if (draftFromFloorId == draftToFloorId) throw new Error(`Cannot create lift on the same level '${draftFromFloorId}'`);


    const direction = Math.sign(draftToFloorId - draftFromFloorId);

    console.log(`Create lift (${draftFromFloorId}->${draftToFloorId}) on room '${roomId}', dir=${direction}`);

    const [fromFloorId, toFloorId, liftId] = rayCast(building, draftFromFloorId, roomId, draftToFloorId);

    floors[fromFloorId].rooms[roomId].lift = createLift(liftId);
    for (let i = fromFloorId + direction; i != toFloorId; i += direction) {
        console.log(`(Lift ${liftId}) Create shaft at (${i}) on room '${roomId}'`);
        floors[i].rooms[roomId].shaft = liftId;
    }
    floors[toFloorId].rooms[roomId].lift = createLift(liftId);
}

export function rayCast(building, fromFloorId, roomId, toFloorId) {
    const { floors, lifts } = building;

    if (fromFloorId == toFloorId) throw new Error(`Cannot rayCast lift on the same level '${fromFloorId}'`);

    const direction = Math.sign(toFloorId - fromFloorId);

    console.log(`rayCast lift (${fromFloorId}->${toFloorId}) on room '${roomId}', dir=${direction}`);

    const fromRoom = floors[fromFloorId].rooms[roomId];
    if (fromRoom.lift) {
        console.log(`(rayCast) Floor-${fromFloorId}) is already lift, liftId = ${fromRoom.lift.liftId}'`);
        return [fromFloorId, toFloorId, fromRoom.lift.liftId];
    }
    if (fromRoom.shaft) {
        console.log(`(rayCast) Floor-${toFloorId}) is shaft, liftId = ${fromRoom.shaft.liftId}'`);
        return [fromFloorId, toFloorId, fromRoom.shaft.liftId];
    }

    for (let i = fromFloorId + direction; i != toFloorId; i += direction) {
        const room = floors[i].rooms[roomId];

        if (room.lift) {
            console.log(`(rayCast) Floor-${i}) is lift, liftId = ${room.lift.liftId}'`);
            return [fromFloorId, i, room.lift.liftId];
        }

        console.log(`(rayCast) Floor-${i}) is ok'`);
    }
    const room = floors[toFloorId].rooms[roomId];
    if (room.lift) {
        console.log(`(rayCast) Floor-${toFloorId}) is lift, liftId = ${room.lift.liftId}'`);
        return [fromFloorId, toFloorId, room.lift.liftId];
    }
    console.log(`(rayCast) Floor-${toFloorId}) is ok, create new liftId'`);
    const newLift = createLiftMaster(lifts.length);
    lifts.push(newLift);
    return [fromFloorId, toFloorId, newLift.liftId];
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



