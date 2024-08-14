//@ts-check
import { existsSync, readFileSync } from 'fs';
import { createFloorBuffer, generateMap, printB, printRoom, printRoomSeparator } from "./functions.js";



const building = (() => {
    const filename = '_out/building.json';
    if (existsSync(filename)) {
        const json = readFileSync(filename).toString();
        return JSON.parse(json);

    }
    return generateMap({
        floorCount: 13,
        floorWidth: 14,

        liftPerFloorMin: 2,
        liftPerFloorMax: 4,
        liftRandomCount: 8,
        accessibleFloorCount: 13,

        aliasMax: 20,
        aliasMin: 3,
        aliasSkip: 5,
    });

})();

const accessibleFloors = building.floors.filter(f => f.isAccessible);

let position = {
    floorId: accessibleFloors[Math.floor(Math.random() * accessibleFloors.length)].floorId,
    roomId: Math.floor(Math.random() * building.floors[0].rooms.length),
};

function move({ floorDir, roomDir }) {
    const room = building.floors[position.floorId].rooms[position.roomId];
    const floorWidth = building.floors[0].rooms.length;
    if (roomDir != 0) {
        position.roomId = (position.roomId + roomDir + floorWidth) % floorWidth;
    }
    if (floorDir != 0) {
        if (!room.liftDoor) return;
        if (floorDir > 0 && room.liftDoor.up == null) return;
        if (floorDir < 0 && room.liftDoor.down == null) return;
        position.floorId = floorDir > 0
            ? room.liftDoor.up
            : room.liftDoor.down;
    }
}

function render() {
    const { floors } = building;
    let outputBuffer = createFloorBuffer();

    const { floorId, floorAlias, rooms, isAccessible, isExit } = floors[position.floorId];
    const floorWidth = building.floors[0].rooms.length;
    // printB(outputBuffer,
    //     `      `,
    //     ` ${('' + (floorAlias)).padStart(2, ' ')}/F `,
    //     `      `
    // );
    console.log('position', JSON.stringify({ x: position.roomId, y: position.floorId }));
    printRoomSeparator(outputBuffer);
    for (let i = -2; i <= 2; i++) {
        const room = rooms[(position.roomId + i + floorWidth) % floorWidth];
        printRoom(outputBuffer, room, floors, isAccessible, true);
        printRoomSeparator(outputBuffer);
    }

    const lineLength = outputBuffer[0].length;

    printB(outputBuffer,
        `      `,
        ` [${('' + (floorId)).padStart(2, ' ')}]${isExit ? ' isExit' : ''} `,
        `      `
    );

    console.log(new Array(lineLength).fill('-').join(''));
    console.log(outputBuffer[0]);
    console.log(outputBuffer[1]);
    console.log(outputBuffer[2]);
    console.log(new Array(lineLength).fill('-').join(''));


    console.log(new Array(lineLength / 2).fill(' ').join('') + '^');
}

const stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
console.clear();
process.stdout.write('press arrow keys or ctrl-c\n');
process.stdout.write('\n');
render();

stdin.on('data', function (key) {
    if (key.toString() == '\u001B\u005B\u0041') {
        move({ floorDir: 1, roomDir: 0 });
        console.clear();
        process.stdout.write('press arrow keys or ctrl-c\n');
        process.stdout.write('up\n');
        render();
    }
    if (key.toString() == '\u001B\u005B\u0043') {
        move({ floorDir: 0, roomDir: 1 });
        console.clear();
        process.stdout.write('press arrow keys or ctrl-c\n');
        process.stdout.write('right\n');
        render();
    }
    if (key.toString() == '\u001B\u005B\u0042') {
        move({ floorDir: -1, roomDir: 0 });
        console.clear();
        process.stdout.write('press arrow keys or ctrl-c\n');
        process.stdout.write('down\n');
        render();
    }
    if (key.toString() == '\u001B\u005B\u0044') {
        move({ floorDir: 0, roomDir: -1 });
        console.clear();
        process.stdout.write('press arrow keys or ctrl-c\n');
        process.stdout.write('left\n');
        render();
    }

    if (key.toString() == '\u0003') {  // ctrl-c

        process.stdout.write('\nbye bye');
        process.exit();
    }
});