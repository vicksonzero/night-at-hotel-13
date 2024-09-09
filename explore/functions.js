
export function printRoom(floorBuffer, room, floors, acc, af, isPlayMode = false) {
    if (room.liftDoor) {

        const upStr = room.liftDoor.up != null ? ('' + floors[room.liftDoor.up].fa).padStart(2, ' ') : '--';
        const downStr = room.liftDoor.down != null ? ('' + floors[room.liftDoor.down].fa).padStart(2, ' ') : '--';
        floorBuffer[0] += `  ${upStr}  `;
        if (room.liftDoor.up == null && room.liftDoor.down == null)
            floorBuffer[1] += ` |${('' + room.liftDoor.liftId).padStart(2, ' ')}| `;

        else
            floorBuffer[1] += ` |^v| `;
        floorBuffer[2] += `  ${downStr}  `;
    } else if (room.escapeDoor) {
        floorBuffer[0] += ` >ESC `;
        floorBuffer[1] += ` [  ] `;
        floorBuffer[2] += ` [  ] `;
    } else if (room.empty) {
        floorBuffer[0] += `      `;
        floorBuffer[1] += `      `;
        floorBuffer[2] += ` [  ] `;
    } else if (!isPlayMode && room.shaft != null) {
        floorBuffer[0] += `  ||  `;
        floorBuffer[1] += `  ||  `;
        floorBuffer[2] += `  ||  `;
    } else if (!acc) {
        floorBuffer[0] += `XXXXXX`;
        floorBuffer[1] += `XXXXXX`;
        floorBuffer[2] += `XXXXXX`;
    } else if (room.hint) {
        floorBuffer[0] += `      `;
        floorBuffer[1] += ` (00) `;
        floorBuffer[2] += `      `;
    } else {
        floorBuffer[0] += `  ${('' + af.at(-room.roomId)).padStart(2, '0')}  `;
        floorBuffer[1] += ` [  ] `;
        floorBuffer[2] += ` [  ] `;
    }
} export function printRoomSeparator(floorBuffer) {
    floorBuffer[0] += `.`;
    floorBuffer[1] += `.`;
    floorBuffer[2] += `.`;
}
export function printB(floorBuffer, line0, line1, line2) {
    floorBuffer[0] += line0;
    floorBuffer[1] += line1;
    floorBuffer[2] += line2;
}
export function createFloorBuffer() {
    return [
        "",
        "",
        ""
    ];
}
export function printMap(building) {
    const { floors, lifts } = building;
    /* #IfDev */
    console.log('');
    /* #EndIfDev */
    let outputBuffer = createFloorBuffer();
    for (let floorIndex = floors.length - 1; floorIndex >= 0; floorIndex--) {
        outputBuffer = createFloorBuffer();

        const { floorId, fa, rooms, acc } = floors[floorIndex];
        printB(outputBuffer,
            `      `,
            ` ${('' + (fa)).padStart(2, ' ')}/F `,
            `      `
        );
        printRoomSeparator(outputBuffer);
        for (const room of rooms) {
            printRoom(outputBuffer, room, floors, acc, building.af);
            printRoomSeparator(outputBuffer);
        }

        printB(outputBuffer,
            `      `,
            ` [${('' + (floorId)).padStart(2, ' ')}] `,
            `      `
        );

        /* #IfDev */
        console.log(new Array(outputBuffer[0].length).fill('-').join(''));
        console.log(outputBuffer[0]);
        console.log(outputBuffer[1]);
        console.log(outputBuffer[2]);
        /* #EndIfDev */
    }
    /* #IfDev */
    console.log(new Array(outputBuffer[0].length).fill('-').join(''));
    /* #EndIfDev */
}

