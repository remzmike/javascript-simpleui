import * as m_simpleui_drawing from './simpleui_drawing.js';

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
*/

let config = {
    drawhotspots_enable: false,
    drawbox_soft_enable: true,
    drawbox_gradient_enable: true,
    drawtext_enable: true,
    drawtext_bitmap: true,
    drawbox_gradient: make_drawbox_gradient(
        context,
        box_gradient_x1, box_gradient_y1,
        box_gradient_x2, box_gradient_y2,
        box_gradient_color_stop1,
        box_gradient_color_stop2
    ),
}
let component_state = {};

let draw = m_simpleui_drawing;

let debug_draw_debuglines = false;
let debuglines = [];

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

function init_hotspot_rects(count) {
    let a = [rect_element_hint];
    for (let i = 0; i < count; i++) {
        //a.push(Hotspot('xxxx-yyyy-zzzz', 0, 0, 1, 1));
        a.push(Rectangle(0, 0, 1, 1));
    }
    return a;
}

const _hotspot_rects = init_hotspot_rects(2000);

function init_hotspot_ids(count) {
    let a = ['xxxx-yyyy-zzzz', 'aaaa-bbbb-cccc'];
    for (let i = 0; i < count; i++) {
        a.push('xxxx-yyyy-zzzz');
    }
    return a;
}

const _hotspot_ids = init_hotspot_ids(2000);

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

const _layout_pool = init_layout_pool(2000);

const uistate = {
    hotspot_rects: _hotspot_rects,
    hotspot_ids: _hotspot_ids,
    hotspot_count: 0,
    layout_pool: _layout_pool,
    layout_count: 0,
    mouselocation: Point(0, 0),
    item_held: null,
    // frame items / 'events'
    item_went_down: false,
    item_went_downup: false,
};

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

function rectangle_contains(x1, y1, w, h, pt_x, pt_y) {
    const x2 = 0 | (x1 + w);
    const y2 = 0 | (y1 + h);
    const b = 0 | (0 | (pt_x >= x1) && 0 | (pt_x <= x2) && 0 | (pt_y >= y1) && 0 | (pt_y <= y2));
    return b;
}

// seriously unable to get this one to avoid deopt
function rectangle_contains_old(rect, pt) {
    //console.assert(rect.length === 4)
    //console.assert(pt.length === 2)
    m_v8.assert_smi(_x);
    m_v8.assert_smi(_y);
    m_v8.assert_smi(_w);
    m_v8.assert_smi(_h);
    m_v8.assert_smi(rect[_x]);
    m_v8.assert_smi(rect[_y]);
    m_v8.assert_smi(rect[_w]);
    m_v8.assert_smi(rect[_h]);
    m_v8.assert_smi(pt[_x]);
    m_v8.assert_smi(pt[_y]);
    // bools/null/undefined are reference values, the value is on the heap, references to value go on stack (i assume)
    const x1 = 0 | rect[_x];
    const y1 = 0 | rect[_y];
    const w = 0 | rect[_w];
    const h = 0 | rect[_h];
    const pt_x = 0 | pt[_x];
    const pt_y = 0 | pt[_y];
    // making this code match the one with explicit params as closely as possible to see if it still deopts
    // what the heck i think it worked...
    //     is it because i am putting `0|` as expression prefix vs postfix?
    //     is it because i put everything in individual vars? seems unlikely
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

function layout_pop(increment) {
    if (increment == null) { increment = true; }
    
    //const child = layout_stack.pop();
    const child = layout_peek();
    uistate.layout_count = uistate.layout_count - 1;

    // increment underlying layout by popped layout
    const parent = layout_peek();
    if ((parent != null) && increment) {
        //let dx = child[_x] - child[_ox];
        //let dy = child[_y] - child[_oy];
        //print('popping, delta x,y:', w, h);
        //print('popping, max w,h:', result[_maxw], result[_maxh]);
        // increment parent by prev
        layout_increment2(child[_maxw], child[_maxh]);
        // update totals when... parent is
        // this is flcking confusing, but it's right
        if (parent[_mode] == _vertical && child[_mode] == _horizontal) {
            // now we do some magik
            parent[_totalw] = Math.max(parent[_totalw], child[_x] - child[_ox]);
            parent[_totalh] = Math.max(parent[_totalh], parent[_y] - parent[_oy]);
        }
        if (parent[_mode] == _horizontal && child[_mode] == _vertical) {
            // untested. nolive
            parent[_totalw] = Math.max(parent[_totalw], parent[_x] - parent[_oy]);
            parent[_totalh] = Math.max(parent[_totalh], child[_y] - child[_oy]);
        }
    }
    return child;
}

function layout_increment2(w, h) {
    const layout = layout_peek();
    if (layout != null) {
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
        }
        if (layout[_mode] != _none) {
            layout[_maxw] = Math.max(layout[_maxw], w);
            layout[_maxh] = Math.max(layout[_maxh], h);
        }
    }
}

/** modify layout by input rect */
function layout_increment(rect) {
    const w = rect[_w];
    const h = rect[_h];
    return layout_increment2(w, h);
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
        //console.log('[item went down]', uistate.item_hovered);
    }
}

function on_mousereleased(x, y, button) {
    if (button == _left) {
        if (uistate.item_held == uistate.item_hovered) {
            uistate.item_went_downup = uistate.item_hovered;
            //console.log('[item went downup]', uistate.item_hovered);
        }
        uistate.item_held = null;
    }
}

// collect ticks here, run them later
let tick_functions = [];
function add_tick(fn) {
    tick_functions.push(fn);
}

function run_all_ticks() {
    //print('run_all_ticks', #tick_functions)
    for (let i = 0; i < tick_functions.length; i++) {
        const fn = tick_functions[i];
        //print('!');
        fn();
    }
}

function main_loop() {

    // updates
    uistate.mouselocation[_x] = 0 | GetCursorX();
    uistate.mouselocation[_y] = 0 | GetCursorY();

    run_all_ticks();

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

    if (debug_draw_debuglines) {
        const mousex = (uistate.mouselocation && uistate.mouselocation[_x]);
        const mousey = (uistate.mouselocation && uistate.mouselocation[_y]);
        debuglines.push('item_hovered: ' + uistate.item_hovered || '');
        debuglines.push('item_held: ' + uistate.item_held || '');
        debuglines.push('mouse x: ' + mousex);
        debuglines.push('mouse y: ' + mousey);
        debuglines.push('hotspot pool: ' + uistate.hotspot_count + '/' + uistate.hotspot_pool.length);
        debuglines.push('layout pool: ' + uistate.layout_count + '/' + uistate.layout_pool.length);
        for (let i = 0; i < debuglines.length; i++) {
            const line = debuglines[i];
            const yinc = i * 20;
            DrawText(line, 120, 30 + yinc, Color(255, 0, 255, 255));
        }
        debuglines = [];
    }

    if (config.drawhotspots_enable) {
        for (let i = 0; i < uistate.hotspot_count; i++) {
            const hotspot_rect = uistate.hotspot_rects[i];
            draw.rectangle(hotspot_rect, Color(255, 0, 0, 64));
        }
    }

    // per-frame resets
    // ~pools~
    uistate.layout_count = 0 | 0;
    uistate.hotspot_count = 0 | 0;
    // ~events~
    uistate.item_went_down = false;
    uistate.item_went_downup = false;

}

function on_tick() {
    main_loop();
    tick_functions = [];

    // now draw offscreen canvas to screen canvas, if that's how we configured in driver
    if (canvas === canvas_off) {
        canvas_screen.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height);
    }
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
    const valign = draw.vertical_center_text(rect);
    const color = Color(255, 255, 255, 255); // default text color, not exposed yet
    draw.label(text, valign, color);
    layout_increment(rect);
}

function do_rectangle(local_rect, color) {
    const rect = layout_translated(local_rect);
    draw.rectangle(rect, color);
    layout_increment(rect);
}

// will write a 2nd line of functions if i need text offset
function do_button(uiid, text, local_rect) {
    const rect = layout_translated(local_rect);
    add_hotspot(uiid, rect);

    const state = calc_drawstate(uiid);
    draw.button(text, rect, state);
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
    draw.checkbox(uiid, rect, state, value);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

function do_progressbar(uiid, local_rect, max, value) {
    console.assert(uiid != '', 'id cannot be blank');
    console.assert(max != null, 'max cannot be null');

    let changed = 0 | false;
    const clamped_value = clamp(value, 0, max);
    if (clamped_value != value) {
        changed = 0 | true;
        value = clamped_value;
    }

    let state = calc_drawstate(uiid);
    const rect = layout_translated(local_rect);
    draw.progressbar(uiid, rect, state, max, value);
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
    draw.slider(uiid, rect, state, min, max, value, label);
    //draw.slider2(uiid, rect[_x], rect[_y], rect[_w], rect[_h], state[_Hovered], state[_Held], min, max, value, label);
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
    draw.vslider(uiid, rect, state, min, max, value, label);
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
    draw.checkbutton(text, rect, state, value, text_offset_x, text_offset_y);
    layout_increment(rect);

    return [0 | changed, 0 | value];
}

// you can drag it around, anywhere.
let _g_handle_delta_x = 0 | 0;
let _g_handle_delta_y = 0 | 0;
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

    if (uistate.item_went_down == uiid) {
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

    draw.handle(uiid, rect, state);
    layout_increment(rect);

    return [0 | changed, 0 | x1, 0 | y1];
}

export {
    Hotspot,
    Point,
    Rectangle,
    add_tick,
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
    on_tick,
    do_label as label,
    do_rectangle as rectangle,
    do_button as button,
    do_checkbox as checkbox,
    do_progressbar as progressbar,
    do_slider as slider,
    do_vslider as vslider,
    do_checkbutton as checkbutton,
    do_handle as handle,
    uistate as state,
    config
};