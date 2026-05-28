// vibe coded

class BitMask {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.size = w * h;

        // ceil(size / 32)
        this.data = new Uint32Array((this.size + 31) >> 5);
    }

    index(x, y) {
        return y * this.w + x;
    }
    get(x, y) {
        const i = this.index(x, y);
        return (this.data[i >> 5] >>> (i & 31)) & 1;
    }
    set(x, y) {
        const i = this.index(x, y);
        this.data[i >> 5] |= (1 << (i & 31));
    }
    clear(x, y) {
        const i = this.index(x, y);
        this.data[i >> 5] &= ~(1 << (i & 31));
    }
    toggle(x, y) {
        const i = this.index(x, y);
        this.data[i >> 5] ^= (1 << (i & 31));
    }
    copy() {
        let mask = new BitMask(this.w, this.h);
        mask.data = structuredClone(this.data);
        return mask;
    }
    toData() {
        return { w: this.w, h: this.h, data: this.data };
    }
    static fromData(mask) {
        let bitmask = new BitMask(mask.w, mask.h);
        bitmask.data = mask.data;
        return bitmask;
    }
}