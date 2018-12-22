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

// https://stackoverflow.com/questions/32617798/how-to-detect-a-browsers-layout-engine-in-javascript
function is_browser_gecko() {
    if(navigator.userAgent.search(/trident/i)>0){
        //Internet Explorer
    } else if(navigator.userAgent.search(/webkit/i)>0){
        //Chrome, Safari
    } else if(navigator.userAgent.search(/gecko/i)>0){
        return true; // must be last condition, since 'gecko' may be included in above engine userAgents for weird reasons
    }   
    return false; 
}

function randomize_color(color) {
    let a = [_r, _g, _b];
    for (let i = 0; i < a.length; i++) {
        let k = a[i];
        let v = 50 + Math.round(Math.random() * 150);
        color[k] = v;
    }
}