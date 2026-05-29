let canvas = document.getElementById("canvas");
let pathfindCanvas = document.getElementById("pathfind-canvas");
let ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pathfindCanvas.width = window.innerWidth;
    pathfindCanvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);