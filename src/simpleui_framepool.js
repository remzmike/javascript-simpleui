// a pool that can clear itself every frame
// does not need to support releasing mid-frame

function FramePool(creator, max) {
    console.assert(max > 0);
    this.creator = creator;
    this.max = max;
    this.index = 0; // points to first unused item
    this.items = [creator()]; // jit hint
    for (let i = 1; i < max; i++) {
        this.items.push(creator());
    }
}

FramePool.prototype.acquire = function () {
    // add 1k slots if full
    if (this.index >= this.items.length) {
        //console.info('[growing framepool]', this.max, this.max + 1000);
        this.max = this.max + 1000;
        for (let i = 0; i < 1000; i++) {
            this.items.push(this.creator());
        }
    }
    this.index++;
    return this.items[this.index-1];
};

FramePool.prototype.release_all = function () {
    // releasing all == moving the index cursor
    this.index = 0;
};

// usage
/*
if (true) {
    function Rectangle(x, y, w, h) {
        return {
            x: x,
            y: y,
            w: w,
            h: h,
        }
    }
    
    function RectangleDefault() {
        return Rectangle(0, 0, 200, 20);
    }

    function RectanglePooled(x, y, w, h) {
        const o = rectangle_pool.acquire();
        o.x = x;
        o.y = y;
        o.w = w;
        o.h = h;
        return o;
    }

    const rectangle_pool = new FramePool(RectangleDefault, 2000);

    for (let i=0; i<5000; i++) {
        RectanglePooled(12, 13, i, i);
    }

    console.log(rectangle_pool.items[4999]);

    rectangle_pool.release_all();
}*/

export {
    FramePool
};