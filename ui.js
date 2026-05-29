class UIHandler {
    constructor(canvases, infiniteMaze) {
        this.canvases = canvases;
        this.infiniteMaze = infiniteMaze;
        this.initDragging();
        this.initPanels();
        this.initDebug();
    }
    initDragging() {
        this.draggingUIContainer = false;

        this.dragButton = document.getElementById("ui-drag-button");
        this.uiContainer = document.getElementById("ui-container");

        this.dragButton.addEventListener("mousedown", () => {
            this.startDrag();
        });
        this.dragButton.addEventListener("mouseup", () => {
            this.stopDrag();
        });
        document.addEventListener("mouseup", () => {
            this.stopDrag();
        });
        window.addEventListener("blur", () => {
            this.stopDrag();
        });
        document.addEventListener("mousemove", e => {
            if (!this.draggingUIContainer) return;
            e.stopPropagation();
            let width = Math.max(0, window.innerWidth - e.clientX);
            this.drag(width);
        });
        // initialize dragging events

        this.drag(600);
        // initial ui container width
    }
    drag(width) {
        for (let canvas of this.canvases) {
            canvas.style.marginLeft = `${-width / 2}px`;
        }
        // move canvas to center display without clearing canvas by changing width

        let minWidth = 400;
        if (width > minWidth) {
            this.uiContainer.style.width = width + "px";
            this.uiContainer.style.right = "0";
        } else {
            let dragButtonWidth = 10;
            this.uiContainer.style.width = minWidth + "px";
            this.uiContainer.style.right = Math.max((width - minWidth), dragButtonWidth - minWidth) + "px";
            // ui container can never go offscreen, you can always drag it back
        }
        // the actual width of the ui container element never goes below [minWidth].
        // instead, it will move to the right off the screen after being shrunk below [minWidth].
    }
    startDrag() {
        this.draggingUIContainer = true;
        document.body.style.cursor = "ew-resize";
    }
    stopDrag() {
        this.draggingUIContainer = false;
        document.body.style.cursor = "auto";
    }
    initPanels() {
        this.panelControls = document.getElementById("panel-controls");
        this.panels = document.getElementById("panels");
    }
    selectPanel(name) {
        for (let button of this.panelControls.children) {
            if (button.id == `${name}-button`) {
                button.setAttribute("selected", true);
            } else {
                button.setAttribute("selected", false);
            }
        }
        for (let panel of this.panels.children) {
            if (panel.id == name) {
                panel.style.display = "block";
            } else {
                panel.style.display = "none";
            }
        }
    }
    initDebug() {
        this.debugOptionsElement = document.getElementById("debug-options");
        this.debugOptions = [
            {
                name: "Show Maze",
                type: "toggle",
                set: v => this.infiniteMaze.showMaze = v,
                get: () => this.infiniteMaze.showMaze
            },
            {
                name: "Show Chunk Borders",
                type: "toggle",
                set: v => this.infiniteMaze.showChunkBorders = v,
                get: () => this.infiniteMaze.showChunkBorders
            },
            {
                name: "Show Chunk Colors",
                type: "toggle",
                set: v => this.infiniteMaze.showChunkColors = v,
                get: () => this.infiniteMaze.showChunkColors
            },
            {
                name: "Show Chunk Ids",
                type: "toggle",
                set: v => this.infiniteMaze.showChunkIds = v,
                get: () => this.infiniteMaze.showChunkIds
            }
        ];
        for (let option of this.debugOptions) {
            this.debugOptionsElement.appendChild(this.createOption(option));
        }
    }
    createOption(option) {
        if (option.type == "toggle") {
            return this.createToggle(option);
        } else if (option.type == "select") {
            return this.createSelect(option);
        } else if (option.type == "value") {
            return this.createValue(option);
        }
    }
    createToggle(option) {
        let button = document.createElement("button");
        button.innerHTML = option.name;
        let span = document.createElement("span");
        span.innerHTML = option.get();
        button.onclick = () => {
            if (option.get()) {
                option.set(false);
                this.infiniteMaze.needUpdate = true;
                span.innerHTML = "false";
            } else {
                option.set(true);
                this.infiniteMaze.needUpdate = true;
                span.innerHTML = "true";
            }
        }
        let div = document.createElement("div");
        div.className = "option";
        div.appendChild(button);
        div.appendChild(span);
        return div;
    }
    createSelect(option) {
        let span = document.createElement("span");
        span.innerHTML = option.name;
        let div = document.createElement("div");
        div.className = "option";
        div.appendChild(span);
        for (let o of option.options) {
            let button = document.createElement("button");
            button.innerHTML = o.name;
            button.onclick = () => {
                o.select();
                this.infiniteMaze.needUpdate = true;
            }
            div.appendChild(button);
        }
        return div;
    }
    createValue(option) {
        let span = document.createElement("span");
        span.innerHTML = option.name;
        let value = document.createElement("span");
        value.innerHTML = option.get();
        setInterval(() => {
            value.innerHTML = option.get();
        }, option.refresh);
        let div = document.createElement("div");
        div.className = "option";
        div.appendChild(span);
        div.appendChild(value);
        return div;
    }
}