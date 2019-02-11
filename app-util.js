function sum(a) {
    let result = 0|0;
    for (let i = 0; i < a.length; i++) {
        let v = a[i];
        result = result + v;
    }
    return result;
}
console.assert(sum([1, 2, 3]) == 6);

function str(n) {
    return n + '';
}

function init_array(size, init_val) {
    let a = [];
    for (let i = 0; i < size; i++) {
        a[i] = init_val;
    }
    return a;
}

// https://stackoverflow.com/a/36673184
function is_touch_device() {
    return (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);
}

function randomize_color(color) {
    let a = [_r, _g, _b];
    for (let i = 0; i < a.length; i++) {
        let k = a[i];
        let v = 50 + Math.round(Math.random() * 150);
        color[k] = v;
    }
}