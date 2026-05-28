class MouseTracker {
    constructor(canvas) {
        this.canvas = null;
        if (canvas) this.link(canvas);
        this.unboundedX = 0;
        this.unboundedY = 0;
        this.x = 0;
        this.y = 0;
        this.xmove = 0;
        this.ymove = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.down = false;
        this.downStart = false;
        this.click = false;
        this.buttons = [];
        this.startButtons = [];
        this.clickButtons = [];
    }
    update() {
        this.xmove = 0;
        this.ymove = 0;
        this.scrollX = 0;
        this.scrollY = 0;
        this.downStart = false;
        this.click = false;
        this.startButtons = [];
        this.clickButtons = [];
    }
    updatePosition(event) {
        let rect = this.canvas.getBoundingClientRect();
        this.x = Math.min(Math.max((event.pageX - rect.x) / rect.width, 0), 1) * this.canvas.width;
        this.y = Math.min(Math.max((event.pageY - rect.y) / rect.height, 0), 1) * this.canvas.height;
        this.unboundedX = (event.pageX - rect.x) / rect.width * this.canvas.width;
        this.unboundedY = (event.pageY - rect.y) / rect.height * this.canvas.height;
        this.xmove += event.movementX * this.canvas.width / rect.width;
        this.ymove += event.movementY * this.canvas.height / rect.height;
    }
    inBox(x, y, width, height) {
        return this.x >= x && this.x <= x + width && this.y >= y && this.y <= y + height;
    }
    link(canvas) {
        this.canvas = canvas;
        window.addEventListener("mousemove", event => {
            this.updatePosition(event);
        });
        window.addEventListener("mousedown", event => {
            this.updatePosition(event);
            this.down = true;
            this.downStart = true;
            this.buttons[event.button] = true;
            this.startButtons[event.button] = true;
        });
        window.addEventListener("mouseup", event => {
            this.updatePosition(event);
            this.down = false;
            this.click = true;
            this.buttons[event.button] = false;
            this.clickButtons[event.button] = true;
        });
        window.addEventListener("wheel", event => {
            event.preventDefault();
            this.updatePosition(event);
            this.scrollX += event.deltaX;
            this.scrollY += event.deltaY;
        }, { passive: false });
        window.oncontextmenu = function (event) {
            event.preventDefault();
        }
    }
}