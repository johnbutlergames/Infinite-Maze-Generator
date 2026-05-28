function tick() {
    cam.update();
    if (cam.moved || infiniteMaze.needUpdate) {
        update();
        draw();
    }
    if (Keys.down.Shift || Keys.up.Shift) {
        draw();
    }
}

function update() {
    infiniteMaze.update();
    Mouse.update();
    Keys.down = [];
    Keys.up = [];
    cam.moved = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    infiniteMaze.draw();
}

let cam = new Cam();
cam.link(canvas, ctx, Mouse);
let infiniteMaze = new InfiniteMaze(canvas, ctx, cam);

window.setInterval(tick, 10);
draw();