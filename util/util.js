let Mouse = new MouseTracker(canvas);

let Keys = {
    keys: {},
    up: {},
    down: {}
}

window.addEventListener("keydown", event => {
    Keys.keys[event.key] = true;
    Keys.down[event.key] = true;
});

window.addEventListener("keyup", event => {
    Keys.keys[event.key] = false;
    Keys.up[event.key] = true;
});

window.addEventListener("mousemove", event => {
    Mouse.x = event.pageX;
    Mouse.y = event.pageY;
});

window.addEventListener("mousedown", event => {
    Mouse.down = true;
});

window.addEventListener("mouseup", event => {
    Mouse.down = false;
});

canvas.addEventListener("wheel", event => {
    Mouse.scroll += event.deltaY;
    event.preventDefault();
});

function pointInRectangle(p, r) {
    if (p.x < r.x) return false;
    if (p.y < r.y) return false;
    if (p.x > r.x + r.w) return false;
    if (p.y > r.y + r.h) return false;
    return true;
}

function rectanglesColliding(r1, r2) {
    if (round(r1.x + r1.w) <= round(r2.x)) return false;
    if (round(r1.x) >= round(r2.x + r2.w)) return false;
    if (round(r1.y + r1.h) <= round(r2.y)) return false;
    if (round(r1.y) >= round(r2.y + r2.h)) return false;
    return true;
}

function rectanglesCollidingEdge(r1, r2) {
    if (round(r1.x + r1.w) < round(r2.x)) return false;
    if (round(r1.x) > round(r2.x + r2.w)) return false;
    if (round(r1.y + r1.h) < round(r2.y)) return false;
    if (round(r1.y) > round(r2.y + r2.h)) return false;
    return true;
}

function distTo(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function round(n) {
    return Math.round(n * 100000) / 100000;
}

function rotatePoint(x, y, cx, cy, angle) {
    const radians = (Math.PI / 180) * angle;
    const dx = x - cx;
    const dy = y - cy;
    const xRotated = dx * Math.cos(radians) - dy * Math.sin(radians);
    const yRotated = dx * Math.sin(radians) + dy * Math.cos(radians);
    return {
        x: xRotated + cx,
        y: yRotated + cy
    };
}

function easeInOut(a) {
    a = 1.02 / (1 + 2.71828 ** (-10 * (a - 0.5))) - 0.007;
    return Math.min(Math.max(a, 0), 1);
}

function easeInBack(a) {
    a = Math.max(0, Math.min(1, a));
    if (a < 0.5) return easeInOut(a * 2);
    return 1 - easeInOut((a - 0.5) * 2);
}

function linearInEaseBack(a, easeBack) {
    a = Math.max(0, Math.min(1, a));
    if (a < easeBack) {
        return a;
    } else {
        return easeBack * (1 - easeInOut((a - easeBack) / (1 - easeBack)))
    }
}

function turn(angle, targetAngle) {
    angle = (angle % 360 + 360) % 360;
    targetAngle = (targetAngle % 360 + 360) % 360;
    let turnRight = targetAngle - angle;
    let turnLeft = targetAngle - angle;
    if (turnRight < 0) {
        turnLeft += 360;
    } else {
        turnLeft -= 360;
    }
    if (Math.abs(turnRight) < Math.abs(turnLeft)) {
        return turnRight;
    } else {
        return turnLeft;
    }
}