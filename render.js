importScripts("bitmask.js");

class Renderer {
    async renderMaze(maze) {
        let w = maze.w;
        let h = maze.h;
        let mask = new BitMask(w, h);
        mask.data = maze.data;
        let canvas = new OffscreenCanvas(w, h);
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                if (!mask.get(x, y)) continue;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        let bitmap = await createImageBitmap(canvas);
        postMessage({ type: "render maze finished", bitmap });
    }
}

let renderer = new Renderer();

onmessage = event => {
    if (event.data.type == "render maze") {
        renderer.renderMaze(event.data.maze);
    }
}