class InfiniteMaze {
    constructor(canvas, ctx, cam, pathfindCanvas) {
        this.pathfindCanvas = pathfindCanvas;
        this.canvas = canvas;
        this.ctx = ctx;
        this.cam = cam;
        this.chunks = [];
        this.initializeChunks();
        this.initializePathfinder();
        this.needUpdate = true;

        this.showMaze = true;
        this.showChunkBorders = false;
        this.showChunkColors = false;
        this.showChunkIds = false;
    }
    update() {
        this.chunkHandler.postMessage({
            type: "render viewport",
            viewport: this.cam.getViewport()
        });
        this.needUpdate = false;
    }
    draw() {
        this.ctx.save();
        this.cam.alignViewport();

        for (let chunk of this.chunks) {
            this.ctx.fillStyle = "rgb(230,230,230)";
            this.ctx.fillRect(chunk.x, chunk.y, chunk.w, chunk.h);
        }

        for (let chunk of this.chunks) {
            if (!this.chunkInViewport(chunk)) continue;

            this.ctx.save();
            this.ctx.translate(chunk.x, chunk.y);

            if (chunk.bitmap && this.showMaze) {
                if (this.cam.zoom > 3) this.ctx.imageSmoothingEnabled = false;
                this.ctx.drawImage(chunk.bitmap, 0, 0, chunk.w, chunk.h);
            }

            if (this.showChunkColors && chunk.borderPath) {
                this.ctx.fillStyle = `hsla(${chunk.id * 10},100%,${chunk.id % (36 * 2) < 36 ? 60 : 20}%,0.3)`;
                this.ctx.beginPath();
                for (let point of chunk.borderPath) {
                    this.ctx.lineTo(point.x + 0.5, point.y + 0.5);
                }
                this.ctx.closePath();
                this.ctx.fill();
            }
            if (this.showChunkBorders && chunk.borderPath) {
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = "rgba(0,255,0,0.8)";
                this.ctx.lineJoin = "round";
                this.ctx.beginPath();
                for (let point of chunk.borderPath) {
                    this.ctx.lineTo(point.x + 0.5, point.y + 0.5);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            }
            if (this.showChunkIds) {
                this.ctx.font = "bold 1px Arial";
                let width = this.ctx.measureText(chunk.id).width;
                let size = Math.max(1, Math.min(chunk.h - 2, (chunk.w - 2) / width) / 2);
                this.ctx.font = `bold ${size}px Arial`;
                this.ctx.lineWidth = size / 10;

                this.ctx.fillStyle = "black";
                this.ctx.strokeStyle = "white";
                this.ctx.lineJoin = "round";
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.strokeText(chunk.id, chunk.w / 2, chunk.h / 2);
                this.ctx.fillText(chunk.id, chunk.w / 2, chunk.h / 2);
            }

            this.ctx.restore();
        }

        this.ctx.restore();
    }
    chunkInViewport(chunk) {
        let viewport = this.cam.getViewport();
        if (chunk.x + chunk.w < viewport.x) return false;
        if (chunk.y + chunk.h < viewport.y) return false;
        if (chunk.x > viewport.x + viewport.w) return false;
        if (chunk.y > viewport.y + viewport.h) return false;
        return true;
    }
    initializeChunks() {
        this.chunkHandler = new Worker("chunk-handler.js");
        this.chunkHandler.postMessage({
            type: "initialize chunks",
            chunks: []
        });
        this.chunkHandler.onmessage = event => {
            if (event.data.type == "new chunk") {
                this.addChunk(event.data);
            } else if (event.data.type == "chunk data ready") {
                this.addChunkData(event.data);
            } else if (event.data.type == "chunk image ready") {
                this.addChunkImage(event.data);
            }
        }
    }
    initializePathfinder() {
        this.pathfinder = new Worker("pathfind.js");
    }
    pathfind(x1, y1, x2, y2) {
        this.pathfinder.postMessage({
            type: "start pathfind",
            x1,
            y1,
            x2,
            y2
        });
    }
    addChunk({ x, y, w, h, id, mask }) {
        this.chunks.push({ x, y, w, h, id, mask: BitMask.fromData(mask) });
        this.needUpdate = true;
        this.pathfinder.postMessage({
            type: "new chunk",
            x,
            y,
            w,
            h,
            id,
            mask
        });
    }
    addChunkData(data) {
        let chunk = this.chunks.find(e => e.id == data.id);
        chunk.maze = BitMask.fromData(data.maze);
        chunk.borderPath = data.borderPath;
        this.needUpdate = true;
        this.pathfinder.postMessage({
            type: "add chunk maze",
            id: data.id,
            maze: data.maze,
            mask: data.mask
        });
    }
    addChunkImage(data) {
        let chunk = this.chunks.find(e => e.id == data.id);
        chunk.bitmap = data.bitmap;
        this.needUpdate = true;
    }
}