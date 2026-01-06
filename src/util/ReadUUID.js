export function readUUID(buffer, pos) {
    let uuid = "";
    for (let i = 0; i < 16; i++) {
        const byte = buffer[pos - i];
        if (byte === undefined) return undefined;

        uuid += byte.toString('16').padStart(2, '0');
        if (i === 3 || i === 5 || i === 7 || i === 9) {
            uuid += "-";
        }
    }
    return uuid;
}