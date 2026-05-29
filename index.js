function tick() {
    infiniteMaze.tick();
    Mouse.update();
    Keys.down = [];
    Keys.up = [];
    cam.moved = false;
}

let cam = new Cam();
cam.link(canvas, ctx, Mouse);
let infiniteMaze = new InfiniteMaze(canvas, ctx, cam, pathfindCanvas);
let ui;

function initialize() {
    ui = new UIHandler([canvas, pathfindCanvas], infiniteMaze);
    window.setInterval(tick, 10);
}