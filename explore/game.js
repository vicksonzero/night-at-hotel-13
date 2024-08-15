//@ts-check
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createFloorBuffer, generateMap, printB, printMap, printRoom, printRoomSeparator } from "./functions.js";
import { DateTime } from 'luxon';


let isTransitioning = false;
let isGameOver = false;
let lastAnswer = '';
let lastSkipped = '';
// @ts-ignore
let isWin = false;
let building = loadOrGenerateBuilding(true);
writeFileSync(`./_out/${DateTime.now().toFormat('yyyy_MM_dd_HH_mm_ss')}.json`, JSON.stringify(building, null, 4));
let position = getStartingPosition(building);

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

function tryExit() {
    const isExit = building.floors[position.floorId].isExit;
    const isEscapeDoor = building.floors[position.floorId].rooms[position.roomId].escapeDoor;

    if (!isEscapeDoor) return;
    if (isExit) {
        isGameOver = true;
        isWin = true;
    } else {
        lastAnswer = `${building.floors.find(x => x.isExit)?.floorAlias}/F [${building.floors.find(x => x.isExit)?.floorId}]`;
        lastSkipped = building.alias.skipped.join(', ');
        building = loadOrGenerateBuilding(true);
        writeFileSync(`./_out/${DateTime.now().toFormat('yyyy_MM_dd_HH_mm_ss')}.json`, JSON.stringify(building, null, 4));
        position = getStartingPosition(building);

        isTransitioning = true;
        setTimeout(() => {
            isTransitioning = false;
            console.clear();
            render(`Building randomized.`);
        }, 5000);

    }
}

function render(message) {
    if (message != null) {
        console.log('press arrow keys or ctrl-c');
        console.log('Press enter when you find the exit floor');
        console.log(`${message}`);
    }
    if (isGameOver) {

        printMap(building);
        console.log('');
        console.log('');
        console.log('===============================================');
        console.log('    You have successfully escaped the Hotel    ');
        console.log('===============================================');
        console.log('');
        console.log('             Press spacebar to exit            ');
        console.log('');

        return;
    }

    if (isTransitioning) {

        console.log('');
        console.log('===============================================');
        console.log('                 Wrong exit !                  ');
        console.log('===============================================');
        console.log('');
        console.log(`       The correct exit was ${lastAnswer}.     `);
        console.log(`   Superstitious floors: ${lastSkipped}     `);
        console.log('');
        console.log('    The old hotel disintegrate into pieces.    ');
        console.log('            You fall into the void,            ');
        console.log('   And then land on a newly randomized hotel   ');
        console.log('');

        return;
    }

    const { floors } = building;
    let outputBuffer = createFloorBuffer();

    // @ts-ignore
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

    // printB(outputBuffer,
    //     `      `,
    //     ` [${('' + (floorId)).padStart(2, ' ')}]${isExit ? ' isExit' : ''} `,
    //     `      `
    // );
    printB(outputBuffer,
        `      `,
        ` ${('' + (floorAlias)).padStart(2, ' ')}/F `,
        `      `
    );

    console.log(new Array(lineLength).fill('-').join(''));
    console.log(outputBuffer[0]);
    console.log(outputBuffer[1]);
    console.log(outputBuffer[2]);
    console.log(new Array(lineLength).fill('-').join(''));


    console.log(new Array(lineLength / 2).fill(' ').join('') + '^');


    const room = rooms[(position.roomId + floorWidth) % floorWidth];
    if (room.liftDoor)
        console.log(new Array(lineLength / 2).fill(' ').join('') +
            ' Lift to ' + building.lifts[room.liftDoor.liftId].floorIds.map(x => building.floors[x].floorAlias).join(', ')
        );
    else if (room.escapeDoor)
        console.log(new Array(lineLength / 2).fill(' ').join('') +
            ` Press Enter to try escape`
        );
}




function loadOrGenerateBuilding(isNew) {
    const filename = '_out/building.json';
    if (!isNew && existsSync(filename)) {
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

        aliasMax: 22,
        aliasMin: 14,
        aliasSafe: 3,
        aliasSkip: 5,
    });

}

function getStartingPosition(building) {

    const accessibleFloors = building.floors.filter(f => f.isAccessible);

    let position = {
        floorId: accessibleFloors[Math.floor(Math.random() * accessibleFloors.length / 2)].floorId,
        roomId: Math.floor(Math.random() * building.floors[0].rooms.length),
    };

    return position;
}

const stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
console.clear();
render('');

stdin.on('data', function (key) {
    if (key.toString() == '\u001B\u005B\u0041') {
        if (isGameOver) return;
        if (isTransitioning) return;
        move({ floorDir: 1, roomDir: 0 });
        console.clear();
        render('up');
    }
    else if (key.toString() == '\u001B\u005B\u0043') {
        if (isGameOver) return;
        if (isTransitioning) return;
        move({ floorDir: 0, roomDir: 1 });
        console.clear();
        render('right');
    }
    else if (key.toString() == '\u001B\u005B\u0042') {
        if (isGameOver) return;
        if (isTransitioning) return;
        move({ floorDir: -1, roomDir: 0 });
        console.clear();
        render(`down`);
    }
    else if (key.toString() == '\u001B\u005B\u0044') {
        if (isGameOver) return;
        if (isTransitioning) return;
        move({ floorDir: 0, roomDir: -1 });
        console.clear();
        render(`left`);
    }

    else if (key.toString() == '\u0003') {  // ctrl-c

        process.stdout.write('\nbye bye');
        process.exit();
    }

    else if (key.toString() == '\u000d') { // enter
        if (isGameOver) return;
        if (isTransitioning) return;
        tryExit();
        console.clear();
        render('enter');
    }
    else if (key.toString() == '\u0020') {
        if (!isGameOver) return;
        if (isTransitioning) return;
        process.stdout.write('\nbye bye');
        process.exit();
    }
    else {
        if (isGameOver) return;
        if (isTransitioning) return;
        console.clear();
        // @ts-ignore
        render('key: ' + key.toString().toUnicode());
    }
});

// @ts-ignore
String.prototype.toUnicode = function () {
    var result = "";
    for (var i = 0; i < this.length; i++) {
        // Assumption: all characters are < 0xffff
        result += "\\u" + ("000" + this[i].charCodeAt(0).toString(16)).substr(-4);
    }
    return result;
};