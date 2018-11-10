// todo: later: const namespace import or something i guess ( "namespaced constants" probably eventually too )
// 
// point/rect/layout
const _x = 0;
const _y = 1;

// rect
const _w = 2;
const _h = 3;

// hotspot = [ rect[x,y,w,h], id ]
// i dont know if nested fixed-length arrays are optimized as parameters like a regular fixed-length array
// the problem i have is... rectangle_contains wants a rect with 4 elements not a union of hotspot(id)+rect which is 5 elements
// jit deopts because of this
// i have to decide between manually unpacking the hotspot rect values into a real rect
// -OR- nesting the rect array inside the hotspot array and hope all the stack/frame/parameter/fixed-length-array optimizations still hold
const _rect = 0;
const _id = 1;

// layout
const _ox = 2;
const _oy = 3;
const _mode = 4;
const _padding = 5;
const _maxw = 6;
const _maxh = 7;
const _totalw = 8;
const _totalh = 9;

// drawstate
const _Hovered = 0|0;
const _Held = 1|0;

// layout modes
const _none = 0|0;
const _vertical = 1|0;
const _horizontal = 2|0;
// later: 'grid', 'columns', 'rows'

// colors
const _r = 0|0;
const _g = 1|0;
const _b = 2|0;
const _a = 3|0;

// mouse buttons
const _left = 0|0;
const _middle = 1|0;
const _right = 2|0;

// new return value index constants (i guess)
const _clicked = 0|0; // button
const _changed = 0|0; // lots of things
const _value = 1|0; // i guess
const _delta_x = 1|0; // handle uses these
const _delta_y = 2|0;

// gridfont & gridfont_letter
const _complete = 0 | 0;
const _reset_complete = 0 | 1;
const _segment = 0 | 2;
const _partial = 0 | 3;

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