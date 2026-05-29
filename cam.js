class Cam {
    static MAX_ZOOM = 100;
    static MIN_ZOOM = 1;
    static DEFAULT_ZOOM = 100;//25;
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = Cam.DEFAULT_ZOOM;
        this.movingOrigin = null;
        this.moved = false;
    }
    link(canvas, ctx, mouse) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
    }
    alignViewport(ctx) {
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(this.x, this.y);
    }
    screenToGlobal(x, y) {
        return {
            x: (x - this.canvas.width / 2) / this.zoom - this.x,
            y: (y - this.canvas.height / 2) / this.zoom - this.y
        };
    }
    globalToScreen(x, y) {
        return {
            x: (x + this.x) * this.zoom + this.canvas.width / 2,
            y: (y + this.y) * this.zoom + this.canvas.height / 2
        };
    }
    update() {
        this.updateScroll();
        this.updateMove();
    }
    updateScroll() {
        if (!this.mouse.scrollY) return;
        let scaleFactor = Math.max(Math.min(1 - this.mouse.scrollY * 0.002, 2), 0.5);
        let oldZoom = this.zoom;
        let newZoom = this.zoom * scaleFactor;
        newZoom = Math.min(Math.max(newZoom, Cam.MIN_ZOOM), Cam.MAX_ZOOM);
        let deltaX = (this.mouse.x - this.canvas.width / 2) / newZoom - (this.mouse.x - this.canvas.width / 2) / oldZoom;
        let deltaY = (this.mouse.y - this.canvas.height / 2) / newZoom - (this.mouse.y - this.canvas.height / 2) / oldZoom;
        this.x += deltaX;
        this.y += deltaY;
        this.zoom = newZoom;
        this.moved = true;
    }
    updateMove() {
        if (this.mouse.startButtons[0]) {
            this.movingOrigin = { x: this.x, y: this.y, mouseX: this.mouse.x, mouseY: this.mouse.y };
        }
        if (this.mouse.buttons[0]) {
            let deltaX = this.mouse.x - this.movingOrigin.mouseX;
            let deltaY = this.mouse.y - this.movingOrigin.mouseY;
            this.x = this.movingOrigin.x + deltaX / this.zoom;
            this.y = this.movingOrigin.y + deltaY / this.zoom;
            this.moved = true;
        } else {
            this.movingOrigin = null;
        }
    }
    getViewport() {
        let x1 = (-this.canvas.width / 2) / this.zoom - this.x;
        let y1 = (-this.canvas.height / 2) / this.zoom - this.y;
        let x2 = (this.canvas.width / 2) / this.zoom - this.x;
        let y2 = (this.canvas.height / 2) / this.zoom - this.y;
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, x1: x1, y1: y1, x2: x2, y2: y2 };
    }
}