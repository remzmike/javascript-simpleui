import * as m_simpleui_drawing from './simpleui_drawing.js';
import * as m_simpleui_ex_gridfont from './simpleui_ex_gridfont.js';
import * as m_simpleui_ex_gradient from './simpleui_ex_gradient.js';
import * as m_simpleui_driver_html5_canvas from './simpleui_driver_html5_canvas.js';
import * as m_simpleui_driver_pixi_webgl from './simpleui_driver_pixi_webgl.js';
import * as consts from './simpleui_consts.js';
import debounce from './debounce.js';
import throttle from './throttle.js';

let driver;

// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
// https://news.ycombinator.com/item?id=15065992 (How to write optimized JavaScript)

/*
https://www.quora.com/Why-does-the-ECMA-262-not-define-an-integer-data-type

    var b = someNumber | 0; // Or'ing with 0 forces result to int
    var c = someNumber >>> 0; // Right shift with zero sign bit forces unsigned int
*/

/*
https://stackoverflow.com/questions/6602864/stack-and-heap-in-v8-javascript/6604390#6604390

    In V8 null, undefined, true and false internally are heap allocated objects.
    If you are comming from Java you can say that true and false in V8 are more
    like Boolean.TRUE and Boolean.FALSE in Java.

This explains why forcing bools to SMI prevents deopt and increases performance.
(Because as SMI they can avoid any interaction with heap)

I didn't know the same happens for `null` and `undefined`. Maybe I need to deal with that.
(Yeah, probably does)

*/

// future: asm.js or walt

const uidraw = m_simpleui_drawing;

let config; // set in this module's initialize

// returned by driver's initialize during this module's initialize
let context;
let canvas;

let debug_draw_debuglines = 0 | false;
let debuglines = [];

let component_state = {};

const _x = consts._x;
const _y = consts._y;
const _w = consts._w;
const _h = consts._h;
const _ox = consts._ox;
const _oy = consts._oy;
const _mode = consts._mode;
const _padding = consts._padding;
const _maxw = consts._maxw;
const _maxh = consts._maxh;
const _totalw = consts._totalw;
const _totalh = consts._totalh;
const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;
const _left = consts._left;

// someone's jit probably likes this
//const hotspot_element_hint = Hotspot('_', 0, 0, 1, 1);
const rect_element_hint = Rectangle(0, 0, 1, 1);
const color_element_hint = Color(0, 0, 0, 255);
const layout_element_hint = Layout(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

/* microbench (no jit deopts in benchmarked code)
A:  4.431ms          [TypedArray([x1,y1]), TypedArray([x2,y2]), ...]
B:  2.655ms          TypedArray(x1, y1, x2, y2, ...)
C:  4.454ms          [[x1,y1], [x2,y2], ...]
D:  5.917ms          [x1, y1, x2, y2, ...]
E: 80.101ms          [{x1,y1}, {x2,y2}, ...] (as .x and .y)*/

const _hotspot_rects = init_hotspot_rects(2000);
const _hotspot_ids = init_hotspot_ids(2000);
const _layout_pool = init_layout_pool(2000);

const uistate = {
    hotspot_rects: _hotspot_rects,
    hotspot_ids: _hotspot_ids,
    hotspot_count: 0,
    layout_pool: _layout_pool,
    layout_count: 0,
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
    config = {
        drawhotspots_enable: false,
        drawbox_gradient_enable: true,
        drawtext_enable: true,
        drawtext_bitmap: true,
        drawbox_gradient: null,
    };

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

function init_layout_pool(count) {
    let a = [layout_element_hint];
    for (let i = 0; i < count; i++) {
        a.push(Layout(
            0, 0, 0, 0, // x y ox oy
            0, // mode
            0, // padding
            0, 0, //  maxw maxh
            0, // totalw
            0, // totalh
        ));
    }
    return a;
}

function Hotspot(id, x, y, w, h) {
    console.assert(id != null, 'hotspot with null id');
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(w);
    m_v8.assert_smi(h);
    return [
        Rectangle(x, y, w, h),
        id
    ];
    // todo: better understand what the string on the end of this returned array does to performance
}

function Layout(x, y, ox, oy, mode, padding, maxw, maxh, totalw, totalh) {
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(ox);
    m_v8.assert_smi(oy);
    m_v8.assert_smi(mode);
    m_v8.assert_smi(padding);
    m_v8.assert_smi(maxw);
    m_v8.assert_smi(maxh);
    m_v8.assert_smi(totalw);
    m_v8.assert_smi(totalh);
    return [
        0 | x,
        0 | y,
        0 | ox,
        0 | oy,
        0 | mode,
        0 | padding,
        0 | maxw,
        0 | maxh,
        0 | totalw,
        0 | totalh
    ];
}

/** make rgba color from unsigned bytes [0-255] (Smi's) */
function Color(r, g, b, a) {
    return [
        0 | r,
        0 | g,
        0 | b,
        0 | a
    ];
}

function Point(x, y) {
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    return [0 | x, 0 | y];
}

function Rectangle(x, y, w, h) {
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(w);
    m_v8.assert_smi(h);
    return [0 | x, 0 | y, 0 | w, 0 | h];
}

const point_test = Point(10, 20);
console.assert(point_test[_x] == 10);
console.assert(point_test[_y] == 20);

const rect_test = Rectangle(0, 0, 10, 20);
console.assert(rect_test[_x] == 0);
console.assert(rect_test[_y] == 0);
console.assert(rect_test[_w] == 10);
console.assert(rect_test[_h] == 20);
const rect_test2 = Rectangle(10, 20, 100, 200);
console.assert(rect_test2[_x] == 10);
console.assert(rect_test2[_y] == 20);
console.assert(rect_test2[_w] == 100);
console.assert(rect_test2[_h] == 200);

function clamp(value, x1, x2) {
    return Math.min(Math.max(value, x1), x2);
}

function get_state(uiid) {
    return component_state[uiid]
}

function set_state(uiid, state) {
    component_state[uiid] = state;
    return state;
}

// this way avoids deopt
function rectangle_contains(x1, y1, w, h, pt_x, pt_y) {
    const x2 = 0 | (x1 + w);
    const y2 = 0 | (y1 + h);
    const b = 0 | (0 | (pt_x >= x1) && 0 | (pt_x <= x2) && 0 | (pt_y >= y1) && 0 | (pt_y <= y2));
    return b;
}

function calc_drawstate(uiid) {
    return [
        0 | (uistate.item_hovered == uiid),
        0 | (uistate.item_held == uiid)
    ];
}

function layout_peek() {
    //const stacksize = layout_stack.length;
    const stacksize = uistate.layout_count;
    if (stacksize == 0) {
        return null;
    } else {
        return _layout_pool[stacksize - 1];
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
            //print('inherit layout x', prev[_x]);
            x = prev[_x];
        }
        if (y == null || y == undefined) {
            //print('inherit layout y', prev[_y]);
            y = prev[_y];
        }
        // inherit padding
        if (padding == null || padding == undefined) {
            padding = prev[_padding];
        }
    }

    console.assert(uistate.layout_count >= 0);

    const layout = _layout_pool[uistate.layout_count++];

    layout[_x] = x;
    layout[_y] = y;
    layout[_ox] = x;
    layout[_oy] = y;
    layout[_mode] = mode;
    layout[_padding] = padding;
    layout[_maxw] = 0;
    layout[_maxh] = 0;
    layout[_totalw] = 0;
    layout[_totalh] = 0;

    return layout; // so you can modify it (values in it)
}

function layout_pop() {
    console.assert(uistate.layout_count > 0);

    // was: const child = layout_stack.pop();
    const child = layout_peek();
    // since we use a pool, pop means decrement layout_count
    uistate.layout_count = uistate.layout_count - 1;
    // this peek gives what was 2nd layout in stack since we decremented count
    const parent = layout_peek();

    // increment parent layout and update parent total dimensions
    if (parent) {

        // sub-layout
        if (child[_mode] == _none) {
                
        } else {
            layout_increment2(child[_maxw], child[_maxh]);
            parent[_totalw] = Math.max(parent[_totalw], child[_x] - child[_ox]);
            parent[_totalh] = Math.max(parent[_totalh], child[_y] - child[_oy]);
    
            if (parent[_mode] == _horizontal) {
                parent[_x] = child[_ox] + child[_totalw] + parent[_padding];
            } else if (parent[_mode] == _vertical) {
                parent[_y] = child[_oy] + child[_totalh] + parent[_padding];
            }
        }
    }
    return child;
}

function layout_increment2(w, h) {
    const layout = layout_peek();
    if (layout) {
        if (layout[_mode] == _vertical) {
            const dy = h + layout[_padding];
            layout[_y] += dy;
            layout[_totalh] = layout[_y] - layout[_oy];
            layout[_totalw] = Math.max(layout[_totalw], w);
            layout[_maxw] = layout[_totalw];
        } else if (layout[_mode] == _horizontal) {
            const dx = w + layout[_padding];
            layout[_x] += dx;
            layout[_totalw] = layout[_x] - layout[_ox];
            layout[_totalh] = Math.max(layout[_totalh], h);
            layout[_maxh] = layout[_totalh];
        } else if (layout[_mode] == _none) {
        }
        if (layout[_mode] != _none) {
            layout[_maxw] = Math.max(layout[_maxw], w);
            layout[_maxh] = Math.max(layout[_maxh], h);
        }
    }
}

/** modify layout by input rect */
function layout_increment(rect) {
    return layout_increment2(rect[_w], rect[_h]);
}

/** translate layout-relative rect to absolute rect by adding their coordinates */
function layout_translated(local_rect) {
    let x = 0 | local_rect[_x];
    let y = 0 | local_rect[_y];
    const w = 0 | local_rect[_w];
    const h = 0 | local_rect[_h];

    const layout = layout_peek();
    if (layout) {
        x = x + layout[_x];
        y = y + layout[_y];
    }
    return Rectangle(x, y, w, h);
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

    console.assert(uistate.layout_count === 0);

    // updates
    uistate.mouselocation[_x] = 0 | driver.GetCursorX();
    uistate.mouselocation[_y] = 0 | driver.GetCursorY();

    fn();

    console.assert(uistate.layout_count === 0);

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
            0 | hotspot_rect[_x],
            0 | hotspot_rect[_y],
            0 | hotspot_rect[_w],
            0 | hotspot_rect[_h],
            0 | uistate.mouselocation[_x],
            0 | uistate.mouselocation[_y]
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
        const mousex = (uistate.mouselocation && uistate.mouselocation[_x]);
        const mousey = (uistate.mouselocation && uistate.mouselocation[_y]);
        debuglines.push('item_hovered: ' + uistate.item_hovered || '');
        debuglines.push('item_held: ' + uistate.item_held || '');
        debuglines.push('mouse x: ' + mousex);
        debuglines.push('mouse y: ' + mousey);
        //debuglines.push('hotspot pool: ' + uistate.hotspot_count + '/' + uistate.hotspot_pool.length);
        debuglines.push('layout pool: ' + uistate.layout_count + '/' + uistate.layout_pool.length);
        for (let i = 0; i < debuglines.length; i++) {
            const line = debuglines[i];
            const yinc = i * 20;
            uidraw.text(line, 120, 30 + yinc, Color(255, 0, 255, 255));
        }
        debuglines = [];
    }

    if (config.drawhotspots_enable) {
        for (let i = 0; i < uistate.hotspot_count; i++) {
            const hotspot_rect = uistate.hotspot_rects[i];
            uidraw.rectangle(hotspot_rect, Color(255, 0, 0, 64));
        }
    }

    console.assert(uistate.layout_count === 0);

    // per-frame resets
    // ~pools~
    uistate.layout_count = 0 | 0;
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
    const i = uistate.hotspot_count;

    const hotspot_rect = _hotspot_rects[i];
    hotspot_rect[_x] = rect[_x];
    hotspot_rect[_y] = rect[_y];
    hotspot_rect[_w] = rect[_w];
    hotspot_rect[_h] = rect[_h];

    _hotspot_ids[i] = uiid;

    uistate.hotspot_count = uistate.hotspot_count + 1;
}

function do_label(text, local_rect) {
    const rect = layout_translated(local_rect);
    const valign = uidraw.vertical_center_text(rect);
    const color = Color(255, 255, 255, 255); // default text color, not exposed yet
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

    // this doesn't account for buttons in other layers/windows which have the same params
    uiid = `button(${text},${rect[_x]},${rect[_y]},${rect[_w]},${rect[_h]})`; // nolive

    add_hotspot(uiid, rect);

    const state = calc_drawstate(uiid);
    uidraw.button(text, rect, state);
    layout_increment(rect);

    const clicked = 0 | (uistate.item_went_downup == uiid);
    return [0 | clicked];
}

function do_checkbox(uiid, local_rect, value) {
    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let changed = 0 | false;
    const clicked = uistate.item_went_downup == uiid;
    if (clicked) {
        value = !value;
        changed = 0 | true;
    }

    const state = calc_drawstate(uiid);
    uidraw.checkbox(uiid, rect, state, value);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

function do_progressbar(local_rect, max, value) {
    console.assert(max != null, 'max cannot be null');

    let changed = 0 | false;
    const clamped_value = clamp(value, 0, max);
    if (clamped_value != value) {
        changed = 0 | true;
        value = clamped_value;
    }

    const rect = layout_translated(local_rect);
    uidraw.progressbar(rect, max, value);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

// simpleui api does not support fractional slider anymore
// fractional values should be made by the caller, input values should be int
function do_slider(uiid, local_rect, min, max, value, label) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(label != null, 'label cannot be null');
    console.assert(label != undefined, 'label cannot be undefined');
    m_v8.assert_smi(local_rect[_x]);
    m_v8.assert_smi(local_rect[_y]);
    m_v8.assert_smi(local_rect[_w]);
    m_v8.assert_smi(local_rect[_h]);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let x = rect[_x];
    let w = rect[_w];
    let range = 0 | (max - min);

    let changed = 0 | false;
    let is_held = 0 | (uistate.item_held == uiid);

    if (is_held) {
        const mloc = 0 | (uistate.mouselocation[_x] - x);
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

    const state = calc_drawstate(uiid);
    uidraw.slider(uiid, rect, state, min, max, value, label);
    //uidraw.slider2(uiid, rect[_x], rect[_y], rect[_w], rect[_h], state[_Hovered], state[_Held], min, max, value, label);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

function do_vslider(uiid, local_rect, min, max, value, label) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(local_rect != null, 'local_rect cannot be null');
    console.assert(min != null, 'min cannot be null');
    console.assert(max != null, 'max cannot be null');
    console.assert(value != null, 'value cannot be null');
    console.assert(label != null, 'value cannot be null');
    m_v8.assert_smi(local_rect[_x]);
    m_v8.assert_smi(local_rect[_y]);
    m_v8.assert_smi(local_rect[_w]);
    m_v8.assert_smi(local_rect[_h]);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    let y = rect[_y];
    let h = rect[_h];
    let range = 0 | (max - min);

    let changed = 0 | false;
    let is_held = 0 | (uistate.item_held == uiid);

    if (is_held) {
        const mloc = 0 | (uistate.mouselocation[_y] - y);
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
            value = v;
        }
    }

    let state = calc_drawstate(uiid);
    uidraw.vslider(uiid, rect, state, min, max, value, label);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

// value is expected to be truthy
function do_checkbutton(uiid, text, local_rect, value, text_offset_x, text_offset_y) {
    console.assert(uiid != '', 'id cannot be blank');

    let changed = 0 | false;
    let clicked = uistate.item_went_downup == uiid;
    if (clicked) {
        value = !value;
        changed = 0 | true;
    }

    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);
    let state = calc_drawstate(uiid);
    const group = get_button_group();
    if (group) {
        group.commands.push(uidraw.checkbutton, 6, text, rect, state, value, text_offset_x, text_offset_y);
    } else {
        uidraw.checkbutton(text, rect, state, value, text_offset_x, text_offset_y);
    }

    layout_increment(rect);

    return [0 | changed, 0 | value];
}

// you can drag it around, anywhere.
function do_handle(uiid, local_rect, x1, y1) {
    m_v8.assert_smi(local_rect[_x]);
    m_v8.assert_smi(local_rect[_y]);
    m_v8.assert_smi(local_rect[_w]);
    m_v8.assert_smi(local_rect[_h]);
    m_v8.assert_smi(x1);
    m_v8.assert_smi(y1);
    console.assert(local_rect.length == 4);
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
        _g_handle_delta_x = 0 | (uistate.mouselocation[_x] - x1);
        _g_handle_delta_y = 0 | (uistate.mouselocation[_y] - y1);
    }

    if (uistate.item_held == uiid) {
        //let mousepos = uistate.mouselocation[_x] - x
        //mousepos = clamp(mousepos, 0, i)
        //let v = round(mousepos * max / i, 0)
        //if (v != value) then
        changed = 0 | true;
        x1 = 0 | (uistate.mouselocation[_x] - _g_handle_delta_x);
        y1 = 0 | (uistate.mouselocation[_y] - _g_handle_delta_y);
        //end
    }

    let state = calc_drawstate(uiid);

    uidraw.handle(uiid, rect, state);
    layout_increment(rect);

    return [0 | changed, 0 | x1, 0 | y1];
}

// copied from do_handle
function do_reticle(uiid, local_rect, x1, y1) {
    m_v8.assert_smi(local_rect[_x]);
    m_v8.assert_smi(local_rect[_y]);
    m_v8.assert_smi(local_rect[_w]);
    m_v8.assert_smi(local_rect[_h]);
    m_v8.assert_smi(x1);
    m_v8.assert_smi(y1);
    console.assert(local_rect.length == 4);
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
        _g_handle_delta_x = 0 | (uistate.mouselocation[_x] - x1);
        _g_handle_delta_y = 0 | (uistate.mouselocation[_y] - y1);
    }

    if (uistate.item_held == uiid) {
        //let mousepos = uistate.mouselocation[_x] - x
        //mousepos = clamp(mousepos, 0, i)
        //let v = round(mousepos * max / i, 0)
        //if (v != value) then
        changed = 0 | true;
        x1 = 0 | (uistate.mouselocation[_x] - _g_handle_delta_x);
        y1 = 0 | (uistate.mouselocation[_y] - _g_handle_delta_y);
        //end
    }

    let state = calc_drawstate(uiid);

    uidraw.reticle(uiid, rect, state);
    layout_increment(rect);

    return [0 | changed, 0 | x1, 0 | y1];
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

        if (peek[_mode] == _vertical) {
            head_renderer = uidraw.checkbutton_soft_top;
            tail_renderer = uidraw.checkbutton_soft_bottom;
        } else if (peek[_mode] == _horizontal) {
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
    return [x, y];
}

export {
    Hotspot,
    Color,
    Point,
    Rectangle,
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
    uistate as state,
    config,
    initialize,
    make_css_color,
    driver,
    context,
    canvas,
    debounce, throttle,
    group_buttons_begin, group_buttons_end,
    angled_norm_line
};