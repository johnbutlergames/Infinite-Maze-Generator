class InfiniteMaze {
    constructor(canvas, ctx, cam) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.cam = cam;
        this.chunks = [];
        this.initializeChunks();
        this.needUpdate = true;
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
            if (!this.chunkInViewport(chunk)) continue;

            this.ctx.save();
            this.ctx.translate(chunk.x, chunk.y);

            if (chunk.bitmap) {
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.drawImage(chunk.bitmap, 0, 0, chunk.w, chunk.h);
            }

            /*for (let y = 0; y < chunk.h; y++) {
                for (let x = 0; x < chunk.w; x++) {
                    if (!chunk.mask[y][x]) continue;
                    //this.ctx.fillStyle = `hsla(${chunk.id * 10},100%,${chunk.id % (36 * 2) < 36 ? 60 : 20}%,0.1)`;
                    //this.ctx.fillRect(x, y, 1, 1);
                    if (chunk.maze[y][x]) {
                        this.ctx.fillStyle = `rgba(0,0,0,0.5)`;
                        this.ctx.fillRect(x, y, 1, 1);
                    }
                }
            }*/
            if (Keys.keys.Shift && chunk.borderPath) {
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
            if (Keys.keys.Shift) {
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
    addChunk({ x, y, w, h, id, mask, maze, borderMask, borderPath }) {
        this.chunks.push({ x, y, w, h, id, mask, maze, borderMask, borderPath });
        this.needUpdate = true;
    }
    addChunkData(data) {
        this.chunks.find(e => e.id == data.id).borderPath = data.borderPath;
        this.needUpdate = true;
    }
    addChunkImage(data) {
        this.chunks.find(e => e.id == data.id).bitmap = data.bitmap;
        this.needUpdate = true;
    }
}