importScripts("bitmask.js");

class Pathfinder {
    constructor() {
        this.chunks = [];
    }
    addChunk(data) {
        this.chunks.push({
            x: data.x,
            y: data.y,
            w: data.w,
            h: data.h,
            id: data.id,
            mask: BitMask.fromData(data.mask)
        });
    }
    addChunkMaze(data) {
        let chunk = this.chunks.find(e => e.id == data.id);
        chunk.maze = BitMask.fromData(data.maze);
    }
    isWall(x, y) {
        for (let chunk of this.chunks) {
            if (chunk.x > x) continue;
            if (chunk.y > y) continue;
            if (chunk.x + chunk.w <= x) continue;
            if (chunk.y + chunk.h <= y) continue;
            if (!chunk.mask.get(x - chunk.x, y - chunk.y)) continue;
            return true;
        }
        return false;
    }
    startPathfind(x1, y1, x2, y2) {

    }
}

let pathfinder = new Pathfinder();

onmessage = event => {
    if (event.data.type == "new chunk") {
        pathfinder.addChunk(event.data);
    } else if (event.data.type == "add chunk maze") {
        pathfinder.addChunkMaze(event.data);
    } else if (event.data.type == "start pathfind") {
        pathfinder.startPathfind(event.data);
    }
}