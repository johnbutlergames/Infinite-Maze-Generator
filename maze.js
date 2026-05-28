importScripts("bitmask.js");

class Renderer {
    generateMaze(mask) {
        let { borderMask, borderPath } = this.detectBorders(mask);
        let maze = this.generateInitialMaze(mask);
        maze = this.addBorderHole(maze, borderPath);
        postMessage({ type: "maze generated", borderPath, borderMask: borderMask.toData(), maze: maze.toData() });
        return { maze, borderMask, borderPath };
    }
    detectBorders(mask) {
        let directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
        // directions ordered clockwise

        let direction = { x: 1, y: 0 };
        let currentNode = this.findFirstNode(mask);
        // start at topmost node in column 0

        let borderPath = [structuredClone(currentNode)];
        let borderMask = new BitMask(mask.w, mask.h);

        let iteration = 0;
        while (iteration == 0 || !(currentNode.x == borderPath[0].x && currentNode.y == borderPath[0].y)) {
            // iterate until path is closed again

            borderMask.set(currentNode.x, currentNode.y);

            let directionIndex = directions.findIndex(e => e.x == direction.x && e.y == direction.y);
            let newDirectionIndex = directionIndex;
            let x = currentNode.x + direction.x;
            let y = currentNode.y + direction.y;
            if (x >= mask.w || y >= mask.h || x < 0 || y < 0 || !mask.get(x, y)) {
                newDirectionIndex++;
                newDirectionIndex %= directions.length;
                // rotate clockwise if going to go out of bounds or into empty cell
            }
            let counterClockwiseDirection = directions[(directionIndex - 1 + directions.length) % directions.length];
            let ccx = currentNode.x + counterClockwiseDirection.x;
            let ccy = currentNode.y + counterClockwiseDirection.y;
            if (ccx < mask.w && ccy < mask.h && ccx >= 0 && ccy >= 0 && mask.get(ccx, ccy)) {
                newDirectionIndex--;
                newDirectionIndex += directions.length;
                newDirectionIndex %= directions.length;
                // rotate counter clockwise if that direction has a filled cell
            }
            if (newDirectionIndex != directionIndex) {
                directionIndex = newDirectionIndex;
                borderPath.push(structuredClone(currentNode));
                // if rotating, add a path node
            }
            direction = directions[directionIndex];

            currentNode.x += direction.x;
            currentNode.y += direction.y;

            iteration++;
        }

        return { borderMask, borderPath };
    }
    generateInitialMaze(mask) {
        let maze = mask.copy();
        let nodes = [this.findFirstNode(mask)];
        while (nodes.length > 0) {
            let index = Math.floor(Math.random() * nodes.length);
            let node = nodes.splice(index, 1)[0];
            maze.clear(node.x, node.y);
            if (node.parent) {
                let avgX = Math.round((node.x + node.parent.x) / 2);
                let avgY = Math.round((node.y + node.parent.y) / 2);
                maze.clear(avgX, avgY);
            }
            let neighbors = [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 }]
                .map(e => ({ x: e.x + node.x, y: e.y + node.y, parent: node }))
                .filter(e => e.x >= 0 && e.y >= 0 && e.x < mask.w && e.y < mask.h)
                .filter(e => !nodes.some(f => f.x == e.x && f.y == e.y))
                .filter(e => maze.get(e.x, e.y))
                .filter(e => mask.get(e.x, e.y));
            nodes.push(...neighbors);
        }
        return maze;
    }
    addBorderHole(maze, borderPath) {
        // add a hole to one East border and one South border to ensure all chunks are connected

        let eastBorders = [];
        let southBorders = [];
        for (let n = 0; n < borderPath.length; n++) {
            let start = borderPath[n];
            let end = borderPath[(n + 1) % borderPath.length];
            if (start.x == end.x && start.y > end.y) continue; // skip West borders
            if (start.y == end.y && start.x < end.x) continue; // skip South borders
            eastBorders.push({ start, end });
            southBorders.push({ start, end });
        }

        for (let borders of [eastBorders, southBorders]) {
            let { start, end } = borders[Math.floor(Math.random() * borders.length)];
            let x, y;
            if (start.x == end.x) { // East border
                x = start.x;
                let minY = Math.ceil(start.y / 2) * 2;
                let maxY = Math.floor((end.y - 1) / 2) * 2;
                let range = (maxY - minY) / 2;
                y = Math.floor(Math.random() * range) * 2 + minY;
            } else { // South border
                y = start.y;
                let minX = Math.ceil(end.x / 2) * 2;
                let maxX = Math.floor((start.x - 1) / 2) * 2;
                let range = (maxX - minX) / 2;
                x = Math.floor(Math.random() * range) * 2 + minX;
            }
            maze.clear(x, y);
        }

        return maze;
    }
    findFirstNode(mask) {
        for (let x = 0; x < mask.w; x++) {
            for (let y = 0; y < mask.h; y++) {
                if (!mask.get(x, y)) continue;
                return { x, y };
            }
        }
    }
    async renderMaze(maze) {
        let canvas = new OffscreenCanvas(maze.w, maze.h);
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        for (let x = 0; x < maze.w; x++) {
            for (let y = 0; y < maze.h; y++) {
                if (!maze.get(x, y)) continue;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        let bitmap = await createImageBitmap(canvas);
        postMessage({ type: "maze rendered", bitmap });
    }
}

let renderer = new Renderer();

onmessage = event => {
    if (event.data.type == "create maze") {
        let mask = BitMask.fromData(event.data.mask);
        let { maze } = renderer.generateMaze(mask);
        renderer.renderMaze(maze);
    }
}