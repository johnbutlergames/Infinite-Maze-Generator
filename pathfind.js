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
            if (!chunk.maze.get(x - chunk.x, y - chunk.y)) continue;
            return true;
        }
        return false;
    }
    startPathfind({ x1, y1, x2, y2 }) {
        // A* implementation

        let SEARCH_LIMIT = 1000000;

        let nodes = [{ x: x1, y: y1, traveled: 0 }];
        let searched = [];
        let finished = null;
        while (searched.length < SEARCH_LIMIT) {
            nodes.sort((a, b) => {
                let distA = a.traveled + Math.abs(a.x - x2) + Math.abs(a.y - y2);
                let distB = b.traveled + Math.abs(b.x - x2) + Math.abs(b.y - y2);
                return distA - distB;
            })
            let node = nodes.shift();
            if (node.x == x2 && node.y == y2) {
                finished = node;
                break;
            }
            searched.push(node);
            let neighbors = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]
                .map(e => ({ x: node.x + e.x, y: node.y + e.y, parent: node, traveled: node.traveled + 1 }))
                .filter(e => !nodes.some(f => f.x == e.x && f.y == e.y))
                .filter(e => !searched.some(f => f.x == e.x && f.y == e.y))
                .filter(e => !this.isWall(e.x, e.y))
            nodes.push(...neighbors);
        }
        console.log(nodes.length, searched.length);
        if (finished) {
            let points = [];
            while (finished.parent) {
                points.unshift({ x: finished.x, y: finished.y });
                finished = finished.parent;
            }
            points.unshift({ x: finished.x, y: finished.y });
            postMessage({
                type: "pathfind finished",
                points
            });
        } else {

        }
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