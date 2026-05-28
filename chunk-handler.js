importScripts("bitmask.js");

class MazeHandler {
    constructor(chunkHandler) {
        this.chunkHandler = chunkHandler;
        this.renderQueue = [];

        this.workers = [];
        for (let n = 0; n < Math.max(navigator.hardwareConcurrency - 3, 1); n++) {
            let worker = new Worker("maze.js");
            worker.busy = false;
            worker.chunkId = null;
            worker.onmessage = event => {
                if (event.data.type == "maze generated") {
                    postMessage({
                        type: "chunk data ready",
                        borderPath: event.data.borderPath,
                        borderMask: event.data.borderMask,
                        maze: event.data.maze,
                        id: worker.chunkId
                    });
                    let chunk = this.chunkHandler.chunks.find(e => e.id == worker.chunkId);
                    chunk.borderPath = event.data.borderPath;
                    chunk.borderMask = BitMask.fromData(event.data.borderMask);
                    chunk.maze = BitMask.fromData(event.data.maze);
                } else if (event.data.type == "maze rendered") {
                    postMessage({
                        type: "chunk image ready",
                        bitmap: event.data.bitmap,
                        id: worker.chunkId
                    });

                    if (this.renderQueue.length) {
                        let chunk = this.renderQueue.shift();
                        this.giveFreeWorkerRenderTask(worker, chunk);
                    } else {
                        worker.busy = false;
                        if (this.chunkHandler.chunks.every(e => e.bitmap)) {
                            this.chunkHandler.renderViewport(this.chunkHandler.lastViewport);
                        }
                    }
                }
            }
            this.workers.push(worker);
        }
    }
    renderMaze(chunk) {
        let freeWorker = this.workers.find(e => !e.busy);
        if (freeWorker) {
            this.giveFreeWorkerRenderTask(freeWorker, chunk);
        } else {
            this.renderQueue.push(chunk);
        }
    }
    giveFreeWorkerRenderTask(worker, chunk) {
        worker.postMessage({
            type: "create maze",
            mask: chunk.mask.toData()
        });
        worker.busy = true;
        worker.chunkId = chunk.id;
    }
}

class ChunkHandler {
    constructor() {
        this.chunkId = 0;
        this.mazeHandler = new MazeHandler(this);
        this.lastViewport = null;
    }
    initializeChunks(chunks) {
        this.chunks = chunks;
    }
    renderViewport(viewport) {
        this.lastViewport = viewport;

        let MAX_CHUNKS = this.mazeHandler.workers.length - this.mazeHandler.renderQueue.length;

        let { x, y, w, h } = this.roundViewport(viewport);
        let mask = this.getCoverBitMask(x, y, w, h);

        let chunkCreateCount = 0;
        for (let [localX, localY] of this.generateRingCoordinates(w, h)) {
            if (mask.get(localX, localY)) continue;
            let globalX = localX + x;
            let globalY = localY + y;
            let chunk = this.createChunk(globalX, globalY);
            this.coverMask(mask, x, y, w, h, chunk);
            chunkCreateCount++;
            if (chunkCreateCount >= MAX_CHUNKS) break;
        }
    }
    *generateRingCoordinates(w, h) {
        let rings = Math.ceil(Math.max(w, h) / 2);
        let cx = Math.floor(w / 4) * 2;
        let cy = Math.floor(h / 4) * 2;
        // cx and cy nearest multiple of 2

        yield[cx, cy];

        for (let ring = 1; ring < rings; ring += 2) {
            // rings are multiple of 2
            for (let n = -ring; n <= ring; n += 2) {
                let coordinates = [
                    { x: cx + n - 1, y: cy - ring - 1 },
                    { x: cx + n - 1, y: cy + ring - 1 },
                    { x: cx - ring - 1, y: cy + n - 1 },
                    { x: cx + ring - 1, y: cy + n - 1 }
                ];
                for (let coordinate of coordinates) {
                    if (coordinate.x >= 0 && coordinate.y >= 0 && coordinate.x < w && coordinate.y < h) {
                        yield[coordinate.x, coordinate.y];
                    }
                }
            }
        }
    }
    createChunk(x, y) {
        let { mask, chunkX, chunkY, chunkW, chunkH } = this.createNewChunkMask(x, y);
        mask = this.fillMaskHoles(mask);
        let chunk = { x: chunkX, y: chunkY, w: chunkW, h: chunkH, mask, id: this.chunkId++ };
        this.chunks.push(chunk);

        postMessage({
            type: "new chunk",
            ...chunk
        });

        this.mazeHandler.renderMaze(chunk);

        return chunk;
    }
    roundViewport({ x1, y1, x2, y2 }) {
        x1 = Math.floor(x1 / 2) * 2;
        y1 = Math.floor(y1 / 2) * 2;
        x2 = Math.ceil(x2 / 2) * 2;
        y2 = Math.ceil(y2 / 2) * 2;
        let x = x1;
        let y = y1;
        let w = x2 - x1;
        let h = y2 - y1;
        return { x1, x2, y1, y2, x, y, w, h };
        // Expand viewport to nearest multiple of 2
    }
    getCoverBitMask(x, y, w, h) {
        let mask = new BitMask(w, h);
        for (let chunk of this.chunks) {
            if (chunk.x >= x + w) continue;
            if (chunk.y >= y + h) continue;
            if (chunk.x + chunk.w <= x) continue;
            if (chunk.y + chunk.h <= y) continue;
            this.coverMask(mask, x, y, w, h, chunk);
        }
        return mask;
    }
    coverMask(mask, maskX, maskY, maskW, maskH, chunk) {
        for (let localX = 0; localX < chunk.w; localX++) {
            for (let localY = 0; localY < chunk.h; localY++) {
                if (!chunk.mask.get(localX, localY)) continue;
                if (localX + chunk.x < maskX) continue;
                if (localY + chunk.y < maskY) continue;
                if (localX + chunk.x >= maskX + maskW) continue;
                if (localY + chunk.y >= maskY + maskH) continue;
                mask.set(localX + chunk.x - maskX, localY + chunk.y - maskY);
            }
        }
    }
    isCovered(x, y) {
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
    createNewChunkMask(x, y) {
        let CHUNK_SIZE = 500 + Math.random() * 2000;

        let nodes = [{ x, y }];
        let searched = [];
        while (nodes.length && searched.length < CHUNK_SIZE) {
            let index = Math.floor(Math.random() * nodes.length);
            let node = nodes.splice(index, 1)[0];
            searched.push(node);
            let neighbors = [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }]
                .map(e => ({ x: e.x + node.x, y: e.y + node.y }))
                .filter(e => !nodes.some(f => f.x == e.x && f.y == e.y))
                .filter(e => !searched.some(f => f.x == e.x && f.y == e.y))
                .filter(e => !this.isCovered(e.x, e.y));
            nodes.push(...neighbors);
        }
        for (let n = 0; n < nodes.length; n++) {
            let node = nodes[n];
            let neighborCount = [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }]
                .map(e => ({ x: e.x + node.x, y: e.y + node.y }))
                .filter(e => searched.some(f => f.x == e.x && f.y == e.y) || this.isCovered(e.x, e.y))
                .length;
            if (neighborCount > 2) {
                searched.push(node);
                nodes.splice(n, 1);
                n--;
            }
        }
        let x1 = Math.min(...searched.map(e => e.x));
        let y1 = Math.min(...searched.map(e => e.y));
        let x2 = Math.max(...searched.map(e => e.x));
        let y2 = Math.max(...searched.map(e => e.y));

        let chunkX = x1;
        let chunkY = y1;
        let chunkW = x2 - x1 + 2;
        let chunkH = y2 - y1 + 2;
        let mask = new BitMask(chunkW, chunkH);
        for (let localX = 0; localX < chunkW; localX++) {
            for (let localY = 0; localY < chunkH; localY++) {
                if (!searched.some(e => e.x == localX + chunkX && e.y == localY + chunkY)) continue;
                mask.set(localX, localY);
                mask.set(localX + 1, localY);
                mask.set(localX, localY + 1);
                mask.set(localX + 1, localY + 1);
            }
        }
        return { mask, chunkX, chunkY, chunkW, chunkH };
    }
    fillMaskHoles(mask) {
        let nodes = [];
        for (let x = 0; x < mask.w; x++) {
            nodes.push({ x, y: 0 });
            nodes.push({ x, y: mask.h - 1 });
        }
        for (let y = 0; y < mask.h; y++) {
            nodes.push({ x: 0, y });
            nodes.push({ x: mask.w - 1, y });
        }
        let searched = new BitMask(mask.w, mask.h);
        while (nodes.length > 0) {
            let node = nodes.pop();
            if (mask.get(node.x, node.y)) continue;
            searched.set(node.x, node.y);
            let neighbors = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]
                .map(e => ({ x: e.x + node.x, y: e.y + node.y }))
                .filter(e => e.x >= 0 && e.y >= 0 && e.x < mask.w && e.y < mask.h)
                .filter(e => !nodes.some(f => f.x == e.x && f.y == e.y))
                .filter(e => !searched.get(e.x, e.y))
                .filter(e => !mask.get(e.x, e.y));
            nodes.push(...neighbors);
        }
        for (let x = 0; x < mask.w; x++) {
            for (let y = 0; y < mask.h; y++) {
                if (mask.get(x, y)) continue;
                if (searched.get(x, y)) continue;
                mask.set(x, y);
            }
        }
        return mask;
    }
}

let chunkHandler = new ChunkHandler();

onmessage = event => {
    if (event.data.type == "initialize chunks") {
        chunkHandler.initializeChunks(event.data.chunks);
    }
    if (event.data.type == "render viewport") {
        chunkHandler.renderViewport(event.data.viewport);
    }
}