// todo: later: const namespace import or something i guess ( "namespaced constants" probably eventually too )
// 
// point/rect/layout
export const _x = 0 | 0;
export const _y = 1 | 0;

// gradient stroke edit
export const _x1 = 1 | 0; // handle
export const _y1 = 2 | 0; // handle
export const _x2 = 3 | 0;
export const _y2 = 4 | 0;

// rect
export const _w = 2 | 0;
export const _h = 3 | 0;

// hotspot = [ rect[x,y,w,h], id ]
// i dont know if nested fixed-length arrays are optimized as parameters like a regular fixed-length array
// the problem i have is... rectangle_contains wants a rect with 4 elements not a union of hotspot(id)+rect which is 5 elements
// jit deopts because of this
// i have to decide between manually unpacking the hotspot rect values into a real rect
// -OR- nesting the rect array inside the hotspot array and hope all the stack/frame/parameter/fixed-length-array optimizations still hold
export const _rect = 0 | 0;
export const _id = 1 | 0;

// layout
export const _ox = 2 | 0;
export const _oy = 3 | 0;
export const _mode = 4 | 0;
export const _padding = 5 | 0;
export const _maxw = 6 | 0;
export const _maxh = 7 | 0;
export const _totalw = 8 | 0;
export const _totalh = 9 | 0;

// drawstate
export const _Hovered = 0 | 0;
export const _Held = 1 | 0;

// layout modes
export const _none = 0 | 0;
export const _vertical = 1 | 0;
export const _horizontal = 2 | 0;
// later: 'grid', 'columns', 'rows'

// colors
export const _r = 0 | 0;
export const _g = 1 | 0;
export const _b = 2 | 0;
export const _a = 3 | 0;

// mouse buttons
export const _left = 0 | 0;
export const _middle = 1 | 0;
export const _right = 2 | 0;

// new return value index constants (i guess)
export const _clicked = 0 | 0; // button
export const _changed = 0 | 0; // lots of things
export const _value = 1 | 0; // i guess

// gridfont & gridfont_letter
export const _complete = 0 | 0;
export const _reset_complete = 1 | 0;
export const _segment = 2 | 0;
export const _partial = 3 | 0;

/*

const _x = consts._x;
const _y = consts._y;
const _x1 = consts._x1;
const _y1 = consts._y1;
const _x2 = consts._x2;
const _y2 = consts._y2;
const _w = consts._w;
const _h = consts._h;
const _rect = consts._rect;
const _id = consts._id;
// layout
const _ox = consts._ox;
const _oy = consts._oy;
const _mode = consts._mode;
const _padding = consts._padding;
const _maxw = consts._maxw;
const _maxh = consts._maxh;
const _totalw = consts._totalw;
const _totalh = consts._totalh;
// drawstate
const _Hovered = consts._Hovered;
const _Held = consts._Held;
// layout modes
const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;
// colors
const _r = consts._r;
const _g = consts._g;
const _b = consts._b;
const _a = consts._a;
// mouse buttons
const _left = consts._left;
const _middle = consts._middle;
const _right = consts._right;
// new return value index constants (i guess)
const _clicked = consts._clicked; // button
const _changed = consts._changed; // lots of things
const _value = consts._value; // i guess
// gridfont & gridfont_letter
const _complete = consts._complete;
const _reset_complete = consts._reset_complete;
const _segment = consts._segment;
const _partial = consts._partial;

*/