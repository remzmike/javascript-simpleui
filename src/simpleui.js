import * as m_simpleui_drawing from './simpleui_drawing.js';
import * as m_simpleui_ex_gridfont from './simpleui_ex_gridfont.js';
import * as m_simpleui_ex_gradient from './simpleui_ex_gradient.js';
import * as m_simpleui_driver_html5_canvas from './simpleui_driver_html5_canvas.js';
import * as m_simpleui_driver_pixi_webgl from './simpleui_driver_pixi_webgl.js';
import { FramePool } from './simpleui_framepool.js';
import * as consts from './simpleui_consts.js';
import debounce from './debounce.js';
import throttle from './throttle.js';

// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
// https://news.ycombinator.com/item?id=15065992 (How to write optimized JavaScript)

/*
https://www.quora.com/Why-does-the-ECMA-262-not-define-an-integer-data-type
    var b = someNumber | 0; // Or'ing with 0 forces result to int
    var c = someNumber >>> 0; // Right shift with zero sign bit forces unsigned int
*/

/*
https://stackoverflow.com/questions/6602864/stack-and-heap-in-v8-javascript/6604390#6604390
"In V8 null, undefined, true and false internally are heap allocated objects."
*/

let driver;

const uidraw = m_simpleui_drawing;

const config = {
    drawhotspots_enable: false,
    drawbox_gradient_enable: true,
    drawtext_enable: true,
    drawtext_bitmap: true,
    drawbox_gradient: null,
};

function get_version() {
    return '0.4.3';
}

// returned by driver's initialize during this module's initialize
let context;
let canvas;

let debug_draw_debuglines = false | 0;
let debuglines = [];

let component_state = {};

const _r = consts._r;
const _g = consts._g;
const _b = consts._b;
const _a = consts._a;
const _middle = consts._middle;
const _right = consts._right;
const _left = consts._left;
const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

// someone's jit probably likes this
//const hotspot_element_hint = Hotspot('_', 0, 0, 1, 1);
const rect_element_hint = Rectangle(0, 0, 1, 1);
//const color_element_hint = Color(0, 0, 0, 255);
//const layout_element_hint = Layout(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

/* microbench (no jit deopts in benchmarked code)
A:  4.431ms          [TypedArray([x1,y1]), TypedArray([x2,y2]), ...]
B:  2.655ms          TypedArray(x1, y1, x2, y2, ...)
C:  4.454ms          [[x1,y1], [x2,y2], ...]
D:  5.917ms          [x1, y1, x2, y2, ...]
E: 80.101ms          [{x1,y1}, {x2,y2}, ...] (as .x and .y)*/

const _hotspot_rects = init_hotspot_rects(2000);
const _hotspot_ids = init_hotspot_ids(2000);
//
const _color_pool = new FramePool(ColorDefault, 2000);
const _point_pool = new FramePool(PointDefault, 2000);
const _rectangle_pool = new FramePool(RectangleDefault, 2000);
const _layout_pool = new FramePool(LayoutDefault, 2000);

const uistate = {
    hotspot_rects: _hotspot_rects,
    hotspot_ids: _hotspot_ids,
    hotspot_count: 0,
    mouselocation: Point(0, 0),
    item_hovered: null,
    item_held: null,
    // frame items / 'events'
    mouse_went_up: false,
    item_went_down: false,
    item_went_downup: false,
    item_went_down_middle: false,
    item_went_downup_middle: false,
    item_went_down_right: false,
    item_went_downup_right: false,    
    collapsed_panel_index: 0,
};

let _g_handle_delta_x = 0 | 0;
let _g_handle_delta_y = 0 | 0;

function initialize(options) {
    if (options.driver == null || options.driver == 'html5-canvas') {
        m_simpleui_driver_html5_canvas.initialize(options.canvasId);
        driver = m_simpleui_driver_html5_canvas;
    } else if (options.driver == 'pixi-webgl') {
        m_simpleui_driver_pixi_webgl.initialize();
        driver = m_simpleui_driver_pixi_webgl;
    } else {
        console.error('invalid options', options);
    }

    context = driver.GetContext();
    canvas = driver.GetCanvas();

    m_simpleui_ex_gridfont.initialize();
    m_simpleui_ex_gradient.initialize();
}

function make_css_color(color) {
    let use_alpha = config.drawbox_gradient_enable;

    if (use_alpha) {
        return `rgba(${color[_r]}, ${color[_g]}, ${color[_b]}, ${color[_a] / 255})`;
    } else {
        return `rgba(${color[_r]}, ${color[_g]}, ${color[_b]}, 1)`;
    }
}

function init_hotspot_rects(count) {
    let a = [rect_element_hint];
    for (let i = 0; i < count; i++) {
        //a.push(Hotspot('xxxx-yyyy-zzzz', 0, 0, 1, 1));
        a.push(Rectangle(0, 0, 1, 1));
    }
    return a;
}

function init_hotspot_ids(count) {
    let a = ['xxxx-yyyy-zzzz', 'aaaa-bbbb-cccc'];
    for (let i = 0; i < count; i++) {
        a.push('xxxx-yyyy-zzzz');
    }
    return a;
}

/*function Hotspot(id, x, y, w, h) {
    //console.assert(id != null, 'hotspot with null id');
    return [
        Rectangle(x, y, w, h),
        id
    ];
    // todo: better understand what the string on the end of this returned array does to performance
}*/

/** make rgba color from unsigned bytes [0-255] (Smi's) */
function Color(r, g, b, a) {
    return [
        0 | r,
        0 | g,
        0 | b,
        0 | a
    ];
}

function ColorDefault() {
    return Color(0,0,0,0);
}

function ColorP(r, g, b, a) {
    console.assert(a != null);
    console.assert(a != 1);
    let o = _color_pool.acquire();
    o[_r] = 0 | r;
    o[_g] = 0 | g;
    o[_b] = 0 | b;
    o[_a] = 0 | a;
    return o;
}

// --- 

function Point(x, y) {
    //return [0 | x, 0 | y];
    return { x: 0 | x, y: 0 | y};
}

function PointDefault() {
    return Point(0, 0);
}

function PointP(x, y) {
    const o = _point_pool.acquire();
    o.x = 0 | x;
    o.y = 0 | y;
    return o;
}

// --- 

function Rectangle(x, y, w, h) {
    //return [0 | x, 0 | y, 0 | w, 0 | h];
    return {
        x: 0 | x,
        y: 0 | y,
        w: 0 | w,
        h: 0 | h
    }
}

function RectangleDefault() {
    return Rectangle(0, 0, 0, 0);
}

function RectangleP(x, y, w, h) {
    const o = _rectangle_pool.acquire();
    o.x = 0 | x;
    o.y = 0 | y;
    o.w = 0 | w;
    o.h = 0 | h;
    return o;
}

// ---

/** make rgba color from unsigned bytes [0-255] (Smi's) */
function Layout(x, y, ox, oy, mode, padding, maxw, maxh, totalw, totalh) {
    return {
        x: 0 | x,
        y: 0 | y,
        ox: 0 | ox,
        oy: 0 | oy,
        mode: 0 | mode,
        padding: 0 | padding,
        maxw: 0 | maxw,
        maxh: 0 | maxh,
        totalw: 0 | totalw,
        totalh: 0 | totalh
    };    
}

function LayoutDefault() {
    return Layout(0,0,0,0,0,0,0,0,0,0);
}

function LayoutP(x, y, ox, oy, mode, padding, maxw, maxh, totalw, totalh) {
    let o = _layout_pool.acquire();
    o.x = 0 | x;
    o.y = 0 | y;
    o.ox = 0 | x;
    o.oy = 0 | y;
    o.mode = 0 | mode;
    o.padding = 0 | padding;
    o.maxw = 0 | maxw;
    o.maxh = 0 | maxh;
    o.totalw = 0 | totalw;
    o.totalh = 0 | totalh;
    return o;
}

// ---

const point_test = Point(10, 20);
console.assert(point_test.x == 10);
console.assert(point_test.y == 20);

const rect_test = Rectangle(0, 0, 10, 20);
console.assert(rect_test.x == 0);
console.assert(rect_test.y == 0);
console.assert(rect_test.w == 10);
console.assert(rect_test.h == 20);
const rect_test2 = Rectangle(10, 20, 100, 200);
console.assert(rect_test2.x == 10);
console.assert(rect_test2.y == 20);
console.assert(rect_test2.w == 100);
console.assert(rect_test2.h == 200);

function clamp(value, x1, x2) {
    return Math.min(Math.max(value, x1), x2);
}

function get_state(uiid) {
    return component_state[uiid];
}

function set_state(uiid, state) {
    component_state[uiid] = state;
    return state;
}

// this would never work because it creates o param on every call even when state already exists
/** get state, sets default if null */
/*function get_set_state(uiid, o) {
    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, o);
    }    
    return state;
}*/

// this way avoids deopt
function rectangle_contains(x1, y1, w, h, pt_x, pt_y) {
    const x2 = 0 | (x1 + w);
    const y2 = 0 | (y1 + h);
    //const b = 0 | (0 | (pt_x >= x1) && 0 | (pt_x <= x2) && 0 | (pt_y >= y1) && 0 | (pt_y <= y2));
    const b = 0 | (0 | (pt_x >= x1) && 0 | (pt_x < x2) && 0 | (pt_y >= y1) && 0 | (pt_y < y2)); // 0.4.3 second point compares with < not <=
    return b;
}

// todo: nolive: dont return this, put it in component state...
function calc_drawstate(uiid) {    
    return [
        0 | (uistate.item_hovered == uiid),
        0 | (uistate.item_held == uiid)
    ];
}

function layout_peek() {
    //const stacksize = uistate.layout_count;
    const stacksize = _layout_pool.index;
    if (stacksize == 0) {
        return null;
    } else {
        //return _layout_pool[stacksize - 1];
        return _layout_pool.items[stacksize - 1];
    }
}

/** push new layout to layout stack, inherit last 3 params from previous layout when null */
function layout_push(mode, padding, x, y) {
    //print('layout_push', mode, padding, x, y)
    const prev = layout_peek();

    // this layout inheritance only happens when those params to this function are null/undefined
    // ( i assume jit just makes different versions of this function ) ( for now... )
    if (prev != null) {
        //print('inheriting from prev');
        // inherit x and y
        if (x == null || x == undefined) {
            //print('inherit layout x', prev.x);
            x = 0 | prev.x;
        }
        if (y == null || y == undefined) {
            //print('inherit layout y', prev.y);
            y = 0 | prev.y;
        }
        // inherit padding
        if (padding == null || padding == undefined) {
            padding = 0 | prev.padding;
        }
    }

    //console.assert(uistate.layout_count >= 0);

    //const layout = _layout_pool[uistate.layout_count++];
    const layout = LayoutP(
        0 | x,
        0 | y,
        0 | x,
        0 | y,
        0 | mode,
        0 | padding,
        0 | 0,
        0 | 0,
        0 | 0,
        0 | 0
    );

    return layout; // so you can modify the values
}

function layout_pop() {
    //console.assert(uistate.layout_count > 0);
    console.assert(_layout_pool.index > 0);

    // was: const child = layout_stack.pop();
    const child = layout_peek();
    // since we use a pool, pop means decrement layout_count
    //uistate.layout_count = uistate.layout_count - 1;
    _layout_pool.index = _layout_pool.index - 1;
    // this peek gives what was 2nd layout in stack since we decremented count
    const parent = layout_peek();

    // increment parent layout and update parent total dimensions
    if (parent) {

        // sub-layout
        if (child.mode == _none) {
            // pass     
        } else {
            layout_increment2(child.maxw, child.maxh);
            parent.totalw = 0 | Math.max(parent.totalw, child.x - child.ox);
            parent.totalh = 0 | Math.max(parent.totalh, child.y - child.oy);
    
            /* 0.4.1
            when popping a layout, we need to increment the parent by that layout
            but we don't really do that... (yet)
            so, instead just take some code out of increment for here
            opposite _total doesn't need an update and maxw/maxh is incremented above...
            might actually be more correct to remove increment above and add a new bigger increment down here
            BUT... for now the totalw/totalh updates fixed the problem i was having
            */
            if (parent.mode == _horizontal) {
                parent.x = 0 | child.ox + child.totalw + parent.padding;                
                parent.totalw = 0 | parent.x - parent.ox; // 0.4.1
            } else if (parent.mode == _vertical) {
                parent.y = 0 | child.oy + child.totalh + parent.padding;
                parent.totalh = 0 | parent.y - parent.oy; // 0.4.1
            }

        }
    }
    return child;
}

function layout_increment2(w, h) {
    const layout = layout_peek();
    if (layout) {
        if (layout.mode == _vertical) {
            const dy = 0 | h + layout.padding;
            layout.y = 0 | layout.y + dy;
            layout.totalh = 0 | layout.y - layout.oy;
            layout.totalw = 0 | Math.max(layout.totalw, w);
            layout.maxw = 0 | layout.totalw;
        } else if (layout.mode == _horizontal) {
            const dx = 0 | w + layout.padding;
            layout.x = 0 | layout.x + dx;
            layout.totalw = 0 | layout.x - layout.ox;
            layout.totalh = 0 | Math.max(layout.totalh, h);
            layout.maxh = 0 | layout.totalh;
        } else if (layout.mode == _none) {
            // pass
        }
        if (layout.mode != _none) {
            layout.maxw = 0 | Math.max(layout.maxw, w);
            layout.maxh = 0 | Math.max(layout.maxh, h);
        }
    }
}

/** modify layout by input rect */
function layout_increment(rect) {
    return layout_increment2(0 | rect.w, 0 | rect.h);
}

/** translate layout-relative rect to absolute rect by adding their coordinates */
function layout_translated(local_rect) {
    let x = 0 | local_rect.x;
    let y = 0 | local_rect.y;
    const w = 0 | local_rect.w;
    const h = 0 | local_rect.h;

    const layout = layout_peek();
    if (layout) {
        x = 0 | x + layout.x;
        y = 0 | y + layout.y;
    }
    return RectangleP(0 | x, 0 | y, 0 | w, 0 | h);
}

function on_mousepressed(x, y, button) {    
    if (button == _left) {
        uistate.item_went_down = uistate.item_hovered;
        uistate.item_held = uistate.item_hovered;
        console.log('[item_went_down]', uistate.item_hovered);
    } else if (button == _middle) {
        uistate.item_went_down_middle = uistate.item_hovered;
        uistate.item_held_middle = uistate.item_hovered;
        console.log('[item_went_down_middle]', uistate.item_hovered);
    } else if (button == _right) {
        uistate.item_went_down_right = uistate.item_hovered;
        uistate.item_held_right = uistate.item_hovered;
        console.log('[item_went_down_right]', uistate.item_hovered);
    }
}

function on_mousereleased(x, y, button) {
    if (button == _left) {
        if (uistate.item_held == uistate.item_hovered) {
            uistate.item_went_downup = uistate.item_hovered;
            console.log('[item went downup]', uistate.item_hovered);
        }
        uistate.mouse_went_up = 0 | true; // only left click does this
        uistate.item_held = null;
    } else if (button == _middle) {
        if (uistate.item_held_middle == uistate.item_hovered) {
            uistate.item_went_downup_middle = uistate.item_hovered;
            console.log('[item went downup middle]', uistate.item_hovered);
        }
        uistate.item_held_middle = null;
    } else if (button == _right) {
        if (uistate.item_held_right == uistate.item_hovered) {
            uistate.item_went_downup_right = uistate.item_hovered;
            console.log('[item went downup right]', uistate.item_hovered);
        }
        uistate.item_held_right = null;
    }
}

function run(fn) {

    console.assert(_layout_pool.index === 0);

    // updates
    uistate.mouselocation.x = 0 | driver.GetCursorX();
    uistate.mouselocation.y = 0 | driver.GetCursorY();

    fn();

    console.assert(_layout_pool.index === 0);

    //{ item_hovered logic
    uistate.item_hovered = null;

    // reverse iterate for hotspot z-index
    let hotspot_rect;
    let hotspot_id;
    let contains;
    for (let i = uistate.hotspot_count - 1; i >= 0; i--) {
        hotspot_rect = uistate.hotspot_rects[i];
        hotspot_id = uistate.hotspot_ids[i];
        // don't think i need/want this anymore since i changed to item_held/etc logic
        /*if (!uistate.leftpress && uistate.leftheld) {
            uistate.item_hovered = uistate.focusitem;
            //console.log('[leftheld] uistate.item_hovered = uistate.focusitem: ', uistate.focusitem);
            break; //don't make items hot when mouse down unless they are also the focus item
        }*/
        //contains = rectangle_contains(hotspot[_rect], uistate.mouselocation);
        contains = rectangle_contains(
            0 | hotspot_rect.x,
            0 | hotspot_rect.y,
            0 | hotspot_rect.w,
            0 | hotspot_rect.h,
            0 | uistate.mouselocation.x,
            0 | uistate.mouselocation.y
        );
        if (contains) {
            uistate.item_hovered = hotspot_id;
            break;
        }
    }
    //}

    if (uistate.item_held) {
        document.body.style.cursor = "grabbing";
    } else if (uistate.item_hovered) {
        document.body.style.cursor = "pointer";
    } else {
        document.body.style.cursor = "";
    }

    if (debug_draw_debuglines) {
        const mousex = (uistate.mouselocation && uistate.mouselocation.x);
        const mousey = (uistate.mouselocation && uistate.mouselocation.y);
        debuglines.push('item_hovered: ' + uistate.item_hovered || '');
        debuglines.push('item_held: ' + uistate.item_held || '');
        debuglines.push('mouse x: ' + mousex);
        debuglines.push('mouse y: ' + mousey);
        //debuglines.push('hotspot pool: ' + uistate.hotspot_count + '/' + uistate.hotspot_pool.length);
        debuglines.push('layout pool: ' + _layout_pool.index + '/' + _layout_pool.max);
        for (let i = 0; i < debuglines.length; i++) {
            const line = debuglines[i];
            const yinc = 0 | i * 20;
            uidraw.text(line, 120, 30 + yinc, ColorP(255, 0, 255, 255));
        }
        debuglines = [];
    }

    if (config.drawhotspots_enable) {
        for (let i = 0; i < uistate.hotspot_count; i++) {
            const hotspot_rect = uistate.hotspot_rects[i];
            uidraw.rectangle(hotspot_rect, ColorP(255, 0, 0, 64));
        }
    }

    console.assert(_layout_pool.index === 0);

    // per-frame resets
    // ~pools~
    _color_pool.release_all();
    _point_pool.release_all();
    _rectangle_pool.release_all();
    _layout_pool.release_all();
    uistate.hotspot_count = 0 | 0;
    // ~events~
    uistate.mouse_went_up = 0 | false;
    uistate.item_went_down = 0 | false;
    uistate.item_went_downup = 0 | false;
    uistate.item_went_down_middle = 0 | false;
    uistate.item_went_downup_middle = 0 | false;
    uistate.item_went_down_right = 0 | false;
    uistate.item_went_downup_right = 0 | false;
    // this probably won't stay here
    uistate.collapsed_panel_index = 0 | 0;
}

/** add rect as hotspot */
function add_hotspot(uiid, rect) {
    console.assert(uiid);
    console.assert(rect);
    const i = uistate.hotspot_count;

    const hotspot_rect = _hotspot_rects[i];
    hotspot_rect.x = 0 | rect.x;
    hotspot_rect.y = 0 | rect.y;
    hotspot_rect.w = 0 | rect.w;
    hotspot_rect.h = 0 | rect.h;

    _hotspot_ids[i] = uiid;

    uistate.hotspot_count = 0 | uistate.hotspot_count + 1;
}

function do_label(text, local_rect) {
    const rect = layout_translated(local_rect);
    const valign = uidraw.vertical_center_text(rect);
    const color = uidraw.color_white; // default text color, not exposed yet
    uidraw.label(text, valign, color);
    layout_increment(rect);
}

function do_rectangle(local_rect, color) {
    const rect = layout_translated(local_rect);
    uidraw.rectangle(rect, color);
    layout_increment(rect);
}

// will write a 2nd line of functions if i need text offset
function do_button(uiid, text, local_rect) {
    const rect = layout_translated(local_rect);

    // the technique shown on the next lined doesn't account for buttons in other layers/windows which have the same params
    //uiid = `button(${text},${rect.x},${rect.y},${rect.w},${rect.h})`;

    add_hotspot(uiid, rect);

    if (uiid == uistate.item_hovered) {
        uidraw.button_hovered(text, rect);
    } else if (uiid == uistate.item_held) {
        uidraw.button_held(text, rect);
    } else {
        uidraw.button(text, rect);
    }

    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {clicked: 0 | false});
    }    
    state.clicked = 0 | (uistate.item_went_downup == uiid);
    return state;
}

function do_checkbox(uiid, local_rect, value) {
    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let changed = 0 | false;
    if (uistate.item_went_downup == uiid) {
        value = !value;
        changed = 0 | true;
    }

    if (uiid == uistate.item_hovered) {
        uidraw.checkbox_hovered(rect, value);
    } else if (uiid == uistate.item_held) {
        uidraw.checkbox_held(rect, value);
    } else {
        uidraw.checkbox(rect, value);
    }
    
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, value: 0 | value});
    }
    state.changed = 0 | changed;
    state.value = 0 | value;
    return state;
}

function do_progressbar(uiid, local_rect, max, value) {
    console.assert(max != null, 'max cannot be null');

    let changed = 0 | false;
    const clamped_value = 0 | clamp(value, 0, max);
    if (clamped_value != value) {
        changed = 0 | true;
        value = 0 | clamped_value;
    }

    const rect = layout_translated(local_rect);
    uidraw.progressbar(rect, max, value);
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, value: 0 | value});
    }
    state.changed = 0 | changed;
    state.value = 0 | value;
    return state;
    //return [0 | changed, 0 | value];
}

// simpleui api does not support fractional slider anymore
// fractional values should be made by the caller, input values should be int
function do_slider(uiid, local_rect, min, max, value, label) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(label != null, 'label cannot be null');
    console.assert(label != undefined, 'label cannot be undefined');

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let x = 0 | rect.x;
    let w = 0 | rect.w;
    let range = 0 | (max - min);

    let changed = 0 | false;
    let is_held = 0 | (uistate.item_held == uiid);

    if (is_held) {
        const mloc = 0 | (uistate.mouselocation.x - x);
        let mousepos = 0 | clamp(mloc, 0, w);
        // range / w == units per pixel
        /*
        let v = mousepos * (range / w) + min;
        if (!fractional) {
            v = round(v, 0)|0;
        }*/
        let v = 0 | (mousepos * (range / w) + min);
        if (v != value) {
            changed = 0 | true;
            value = v;
        }
    }

    const draw_state = calc_drawstate(uiid);
    uidraw.slider(uiid, rect, draw_state, min, max, value, label);
    //uidraw.slider2(uiid, rect.x, rect.y, rect.w, rect.h, state[_Hovered], state[_Held], min, max, value, label);
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, value: 0 | value});
    }
    state.changed = 0 | changed;
    state.value = 0 | value;
    return state;
    //return [0 | changed, 0 | value];
}

function do_vslider(uiid, local_rect, min, max, value, label) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(local_rect != null, 'local_rect cannot be null');
    console.assert(min != null, 'min cannot be null');
    console.assert(max != null, 'max cannot be null');
    console.assert(value != null, 'value cannot be null');
    console.assert(label != null, 'value cannot be null');

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let y = 0 | rect.y;
    let h = 0 | rect.h;
    let range = 0 | (max - min);

    let changed = 0 | false;
    let is_held = 0 | (uistate.item_held == uiid);

    if (is_held) {
        const mloc = 0 | (uistate.mouselocation.y - y);
        let mousepos = 0 | clamp(mloc, 0, h);
        // range / w == units per pixel
        /*
        let v = mousepos * (range / h) + min;
        if (!fractional) {
            v = round(v, 0)|0;
        }*/
        let v = 0 | (mousepos * (range / h) + min);
        if (v != value) {
            changed = 0 | true;
            value = 0 | v;
        }
    }

    const draw_state = calc_drawstate(uiid);
    uidraw.vslider(uiid, rect, draw_state, min, max, value, label);
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, value: 0 | value});
    }
    state.changed = 0 | changed;
    state.value = 0 | value;
    return state;

    //return [0 | changed, 0 | value];
}

// value is expected to be truthy
function do_checkbutton(uiid, text, local_rect, value, text_offset_x, text_offset_y) {
    console.assert(uiid != '', 'id cannot be blank');

    let changed = 0 | false;
    let clicked = 0 | uistate.item_went_downup == uiid;
    if (clicked) {
        value = !value;
        changed = 0 | true;
    }

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);
    const draw_state = calc_drawstate(uiid);
    const group = get_button_group();
    if (group) {
        group.commands.push(uidraw.checkbutton, 6, text, rect, draw_state, value, text_offset_x, text_offset_y);
    } else {
        uidraw.checkbutton(text, rect, draw_state, value, text_offset_x, text_offset_y);
    }

    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, value: 0 | value});
    }
    state.changed = 0 | changed;
    state.value = 0 | value;
    return state;
    //return [0 | changed, 0 | value];
}

// you can drag it around, anywhere.
function do_handle(uiid, local_rect, x1, y1) {    
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(local_rect != null, 'local_rect cannot be null');

    x1 = 0 | x1;
    y1 = 0 | y1;

    let changed = 0 | false;

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    if (uistate.item_went_downup == uiid) {
        changed = 0 | true;
    }

    if (uistate.item_went_down == uiid) {
        changed = 0 | true;
        _g_handle_delta_x = 0 | (uistate.mouselocation.x - x1);
        _g_handle_delta_y = 0 | (uistate.mouselocation.y - y1);
    }

    if (uistate.item_held == uiid) {
        //let mousepos = uistate.mouselocation.x - x
        //mousepos = clamp(mousepos, 0, i)
        //let v = round(mousepos * max / i, 0)
        //if (v != value) then
        changed = 0 | true;
        x1 = 0 | (uistate.mouselocation.x - _g_handle_delta_x);
        y1 = 0 | (uistate.mouselocation.y - _g_handle_delta_y);
        //end
    }

    if (uiid == uistate.item_held) {
        uidraw.handle_held(rect);
    } else if (uiid == uistate.item_hovered) {
        uidraw.handle_hovered(rect);
    } else {
        uidraw.handle(rect);
    }
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, x1: 0 | x1, y1: 0 | y1});
    }
    state.changed = 0 | changed;
    state.x1 = 0 | x1;
    state.y1 = 0 | y1;
    return state;
    //return [0 | changed, 0 | x1, 0 | y1];
}

// copied from do_handle
function do_reticle(uiid, local_rect, x1, y1) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(local_rect != null, 'local_rect cannot be null');

    x1 = 0 | x1;
    y1 = 0 | y1;

    let changed = 0 | false;

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    if (uistate.item_went_downup == uiid) {
        changed = 0 | true;
    }

    if (uistate.item_went_down == uiid) {
        changed = 0 | true;
        _g_handle_delta_x = 0 | (uistate.mouselocation.x - x1);
        _g_handle_delta_y = 0 | (uistate.mouselocation.y - y1);
    }

    if (uistate.item_held == uiid) {
        //let mousepos = uistate.mouselocation.x - x
        //mousepos = clamp(mousepos, 0, i)
        //let v = round(mousepos * max / i, 0)
        //if (v != value) then
        changed = 0 | true;
        x1 = 0 | (uistate.mouselocation.x - _g_handle_delta_x);
        y1 = 0 | (uistate.mouselocation.y - _g_handle_delta_y);
        //end
    }

    const draw_state = calc_drawstate(uiid);
    uidraw.reticle(uiid, rect, draw_state);
    layout_increment(rect);

    let state = get_state(uiid);
    if (!state) {
        state = set_state(uiid, {changed: 0 | false, x1: 0 | x1, y1: 0 | y1});
    }
    state.changed = 0 | changed;
    state.x1 = 0 | x1;
    state.y1 = 0 | y1;
    return state;
    //return [0 | changed, 0 | x1, 0 | y1];
}

function do_hline(w, h, color) {
    const rect = layout_translated(RectangleP(0,0,w,h));
    uidraw.push_linewidth(h);
    uidraw.push_strokestyle(make_css_color(color));
    const line_y = 0 | rect.y + h / 2;
    uidraw.line(rect.x, line_y, rect.x + rect.w, line_y);
    layout_increment2(w, h);
    uidraw.pop_strokestyle();
    uidraw.pop_linewidth();
}

const group_buttons_stack = [];
function get_button_group() {
    const len = group_buttons_stack.length;
    if (len) {
        return group_buttons_stack[len - 1];
    }
}

function group_buttons_begin() {
    // defer draws.... so we can render as group.
    const o = {
        commands: []
    };
    group_buttons_stack.push(o);
}

function execute_commands(commands) {

    // first button. push button draw modifiers then pop
    // last button. same
    for (var i = 0; i < commands.length; ) { // note: no inc
        const is_first_item = 0 | i == 0;

        const fn = commands[i];
        i++;
        const arg_count = commands[i];
        i++;
        const args = [];
        for (var j = 0; j < arg_count; j++) {
            const arg = commands[i];
            i++;
            args.push(arg);
        }
        
        const is_last_item = 0 | i == commands.length;
        
        const peek = layout_peek();

        let head_renderer;
        let tail_renderer;

        if (peek.mode == _vertical) {
            head_renderer = uidraw.checkbutton_soft_top;
            tail_renderer = uidraw.checkbutton_soft_bottom;
        } else if (peek.mode == _horizontal) {
            head_renderer = uidraw.checkbutton_soft_left;
            tail_renderer = uidraw.checkbutton_soft_right;
        } else {
            head_renderer = fn;
            tail_renderer = fn;
        }

        if (is_first_item) {
            head_renderer.apply(null, args);
        } else if (is_last_item) {
            tail_renderer.apply(null, args);
        } else {
            fn.apply(null, args);
        }
    }
}

function group_buttons_end() {
    const o = group_buttons_stack.pop();
    execute_commands(o.commands);
    o.commands.length = 0; // i guess this assumes super-smart browser array implementation    
    console.assert(o);
}

function angled_norm_line(rad, scale) {
    const x = Math.sin(rad) * scale;
    const y = Math.cos(rad) * scale;
    return Point(x, y);
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

export {
    Hotspot,
    Color, ColorP,
    Point, PointP,
    Rectangle, RectangleP,
    clamp,
    rectangle_contains,
    calc_drawstate,
    get_state,
    set_state,
    layout_push,
    layout_pop,
    layout_peek,
    layout_translated,
    add_hotspot,
    layout_increment,
    layout_increment2,
    on_mousepressed,
    on_mousereleased,
    run,
    do_label as label,
    do_rectangle as rectangle,
    do_button as button,
    do_checkbox as checkbox,
    do_progressbar as progressbar,
    do_slider as slider,
    do_vslider as vslider,
    do_checkbutton as checkbutton,
    do_handle as handle,
    do_reticle as reticle,
    do_hline as hline,
    uistate as state,
    config,
    initialize,
    make_css_color,
    driver,
    context,
    canvas,
    debounce, throttle,
    group_buttons_begin, group_buttons_end,
    angled_norm_line, is_browser_gecko,
    get_version,
};