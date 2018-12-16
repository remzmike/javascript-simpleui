import * as m_simpleui from './simpleui.js';
import { Rectangle, Point, Color } from './simpleui.js';
import * as consts from './simpleui_consts.js';
// later: these will be in a var/obj/namespace here, so i can switch to other drivers
import {
    DrawBox,
    DrawBoxSoft,
    DrawBoxSoftRight,
    DrawBoxSoftLeft,
    DrawBoxSoftTop,
    DrawBoxSoftBottom,
    DrawText,
    DrawLine,
    DrawCircle,
    DrawCircleOutline,
    GetCursorX,
    GetCursorY,
    GetFontSize,
    SetStrokeStyle,
    SetLineWidth,
    SetLineDash,
    Stroke,
    BeginPath,
    MoveTo,
    LineTo,
    BeginClip,
    EndClip,
} from './simpleui_driver_html5_canvas.js';

let commands = [];

const _x = consts._x;
const _y = consts._y;
const _w = consts._w;
const _h = consts._h;
const _Hovered = consts._Hovered;
const _Held = consts._Held;

let round = Math.round;

export const default_line_color = Color(255, 255, 255, 255);
export const default_text_color = Color(255, 255, 255, 255);

export const accent = Color(120, 180, 140, 127);
export const bg_color = Color(91-15, 98-15, 96-15, 255);
export const panel_color = Color(46, 46, 46, 255);

export const normal_back = Color(36, 36, 36, 255);
export const normal_face = Color(72, 72, 72, 255);
export const activating_face = Color(0, 204, 123, 0 | 255*0.8);

export const raised_face = Color(180, 180+9, 180-3, 255);
export const raised_accent = Color(250, 255, 240, 255);

export const focus_back = normal_back;
export const focus_face = normal_face;

export const font_size = GetFontSize();

// added these when porting to js and html5 canvas
// dangit, the box_gradient value types need to be in an exported object apparently since the module isn't one...
//   ...or the module object isn't shared between files importing it...
// (could also use getters/setters but i hate that)
export const box_gradient = { // my solution
    x1: 80,
    y1: 22,
    x2: 85,
    y2: -32,
    color_stop1: Color(0, 0, 0, 38),
    color_stop2: Color(255, 255, 255, 144)
};

// > no-alpha debug mode
if (false) {
    accent = Color(64, 89, 89, 255);
    activating_face = accent;
}

// center 2 rectangles on each other, return x & y offsets
function get_centered_offsets(rect1, rect2) {
    let ox = round((rect1[_w] - rect2[_w]) / 2);
    let oy = round((rect1[_h] - rect2[_h]) / 2);
    return [0 | ox, 0 | oy];
}

function vertical_center(rect1, rect2) {
    let height_delta = rect1[_h] - rect2[_h];
    let y_offset = 0 | (height_delta / 2); // was Math.floor
    let result = Point(rect1[_x], rect1[_y] + y_offset);
    return result;
}

function vertical_center_text(rect) {
    let hack_font_size = 0 | font_size;
    let rect2 = Rectangle(rect[_x], rect[_y], rect[_w], hack_font_size);
    let pos = vertical_center(rect, rect2);
    return pos;
}

/*function rectangle_center(rect) {
    return Point(rect[_x] + rect[_w] / 2, rect[_y] + rect[_h] / 2);
}*/

function rectangle_offset(rect, offset) {
    return Rectangle(rect[_x] + offset, rect[_y] + offset, rect[_w], rect[_h]);
}

function rectangle_offset_xy(rect, offset_x, offset_y) {
    return Rectangle(rect[_x] + offset_x, rect[_y] + offset_y, rect[_w], rect[_h]);
}

function rectangle_erode(rect, amount) {
    return Rectangle(rect[_x] + amount, rect[_y] + amount, rect[_w] - amount * 2, rect[_h] - amount * 2);
}

function rectangle_dilate(rect, amount) {
    return rectangle_erode(rect, amount * -1);
}

/*function rectangle_underline(rect, size) {
    return Rectangle(rect[_x], rect[_y]+rect[_h]-size, rect[_w], size);
}*/

function point_translate(pt, x, y) {
    pt[_x] = 0 | (pt[_x] + x);
    pt[_y] = 0 | (pt[_y] + y);
    return pt;
}

function draw_text(text, x, y, color) {
    if (m_simpleui.config.drawtext_enable) {
        DrawText(text, x, y, color);
        //commands.push(DrawText, 4, text, x, y, color);
    }
}

function draw_rectangle(rect, color) {
    DrawBox(rect, color);
    //commands.push(DrawBox, 2, rect, color);
}

function draw_rectangle_soft(rect, color) {
    DrawBoxSoft(rect, color);
    //commands.push(DrawRoundedBox, 2, rect, color);
}

function draw_rectangle_soft_right(rect, color) {
    DrawBoxSoftRight(rect, color);
}

function draw_rectangle_soft_left(rect, color) {
    DrawBoxSoftLeft(rect, color);
}

function draw_rectangle_soft_top(rect, color) {
    DrawBoxSoftTop(rect, color);
}

function draw_rectangle_soft_bottom(rect, color) {
    DrawBoxSoftBottom(rect, color);
}

function draw_circle(rect, color) {
    DrawCircle(rect, color);
}

function draw_circle_outline(rect, color) {
    DrawCircleOutline(rect, color);
}

function draw_line(x1, y1, x2, y2) {
    DrawLine(x1, y1, x2, y2);
    //commands.push(DrawLine, 4, x1, y1, x2, y2);
}

function draw_label(text, pt, color) {
    draw_text(text, 0 | pt[_x], 0 | pt[_y], color);
}

function draw_button(text, rect, state) {
    let rect1 = rectangle_erode(rect, 1);
    
    draw_rectangle_soft(rect, normal_back);

    if (state[_Held]) {
        draw_rectangle_soft(rect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle_soft(rect1, accent);
    } else {        
        draw_rectangle_soft(rect1, normal_face);
    }

    let text_pos = point_translate(vertical_center_text(rect1), 5, 0);

    if (state[_Held]) {
        text_pos[_y] = text_pos[_y] + 1;
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}


function draw_checkbox(uiid, rect, state, value) {
    let rect1 = rectangle_erode(rect, 1);
    let rect2 = rectangle_erode(rect, 4);

    draw_rectangle(rect, normal_back);

    if (state[_Held]) {
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect1, accent);
    } else {        
        draw_rectangle(rect1, normal_face);
    }

    //if ((!value && state[_Held]) || value) {
    if (value) {
        draw_rectangle(rect2, Color(255, 255, 255, 255));
    } else if (state[_Held]) {
        draw_rectangle(rect2, Color(255, 255, 255, 127));
    }
}

function draw_progressbar(rect, max, value) {
    let rect2 = rectangle_erode(rect, 2);

    draw_rectangle(rect, normal_back);
    const progw = 0 | (rect2[_w] * (value / max));
    let progrect = Rectangle(rect2[_x], rect2[_y], progw, rect2[_h]);
    draw_rectangle_soft(progrect, accent);
}

function draw_slider(uiid, rect, state, min, max, value, handle_label) {
    m_v8.assert_smi(rect[_x]);
    m_v8.assert_smi(rect[_y]);
    m_v8.assert_smi(rect[_w]);
    m_v8.assert_smi(rect[_h]);
    m_v8.assert_smi(state[_Hovered]);
    m_v8.assert_smi(state[_Held]);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);
    console.assert(handle_label != null);
    console.assert(handle_label != undefined);

    const range = 0 | (max - min);
    const rel_value = 0 | (value - min);
    const value_percent = (rel_value / range);

    const rect1 = rectangle_erode(rect, 1);
    const rect2 = rectangle_erode(rect, 2);

    let progw = 0 | (rect2[_w] * value_percent);
    let progrect = Rectangle(rect2[_x], rect2[_y], progw, rect2[_h]);
    
    // handle
    let handledim = 0 | rect1[_h];
    let handlew = handledim / 4;
    let handlepos = 0 | ((rect1[_w] - handlew) * value_percent + handledim / 2);
    const rectx = 0 | (rect1[_x] + handlepos - handledim / 2);
    const recty = 0 | (rect1[_y]);
    let hrect = Rectangle(rectx, recty+1, handlew, handledim-2);

    draw_rectangle(rect, normal_back);
    draw_rectangle_soft(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, raised_accent);
    } else { // normal
        draw_rectangle(hrect, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (rect[_x] + rect[_w] - 16);
        const texty = 0 | (hrect[_y] + hrect[_h] / 2 - 8);
        draw_text(handle_label, textx, texty, Color(255, 255, 255, 255));
    }
}

function draw_vslider(uiid, rect, state, min, max, value, handle_label) {
    m_v8.assert_smi(rect[_x]);
    m_v8.assert_smi(rect[_y]);
    m_v8.assert_smi(rect[_w]);
    m_v8.assert_smi(rect[_h]);
    m_v8.assert_smi(state[_Hovered]);
    m_v8.assert_smi(state[_Held]);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);
    console.assert(handle_label != null);
    console.assert(handle_label != undefined);

    const range = 0 | (max - min);
    const rel_value = 0 | (value - min);
    const value_percent = (rel_value / range);

    const rect1 = rectangle_erode(rect, 1);
    const rect2 = rectangle_erode(rect, 2);

    let progh = 0 | (rect2[_h] * value_percent);
    let progrect = Rectangle(rect2[_x], rect2[_y], rect2[_w], progh);

    // handle
    let handledim = 0 | rect1[_w];
    let handleh = 0 | handledim / 4;
    let handlepos = 0 | ((rect1[_h] - handleh) * value_percent + handledim / 2);
    const rectx = 0 | rect1[_x];
    const recty = 0 | (rect1[_y] + handlepos - handledim / 2);
    let hrect = Rectangle(rectx+1, recty, handledim-2, handleh);

    draw_rectangle(rect, normal_back);
    draw_rectangle_soft(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, raised_accent);
    } else { // normal
        draw_rectangle(hrect, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 5);
        const texty = 0 | (rect[_y] + rect[_h] - 16);
        draw_text(handle_label, textx, texty, Color(255, 255, 255, 255));
    }
}

function draw_checkbutton(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle);
}

function draw_checkbutton_soft_right(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle_soft_right);
}

function draw_checkbutton_soft_left(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle_soft_left);
}

function draw_checkbutton_soft_top(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle_soft_top);
}

function draw_checkbutton_soft_bottom(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle_soft_bottom);
}

function draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle) {

    let rect1 = rectangle_erode(rect, 1);

    draw_rectangle(rect, normal_back);

    if (state[_Held]) {
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect1, accent);
    } else { // normal
        if (value) {            
            draw_rectangle(rect1, accent);
        } else {
            draw_rectangle(rect1, normal_face);
        }
    }

    let text_pos;
    if (text_offset_x == null || text_offset_y == null) {
        text_pos = point_translate(vertical_center_text(rect1), 3, 0);
    } else {
        const rect_text = rectangle_erode(rect, 1);
        text_pos = point_translate(rect_text, text_offset_x, text_offset_y);
    }
    if (state[_Held]) {
        text_pos[_y] = text_pos[_y] + 1;
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}

function draw_handle(uiid, rect, state) {
    const rect1 = rectangle_erode(rect, 1);
    draw_rectangle(rect, normal_back);
    if (state[_Held]) {
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {        
        draw_rectangle(rect1, accent);
    }
}

function draw_reticle(uiid, rect, state) {
    push_linewidth(6);
    if (state[_Held]) {        
        draw_circle_outline(rect, activating_face);
    } else if (state[_Hovered]) {        
        draw_circle_outline(rect, accent);
    } else {
        draw_circle_outline(rect, normal_back);
    }
    pop_linewidth();    

    push_linewidth(2);
    draw_circle_outline(rect, Color(255,255,255,255));
    pop_linewidth();
}

// StrokeStyle

const _stack_strokestyle = [default_line_color];

function push_strokestyle(value) {
    _stack_strokestyle.push(value);
    SetStrokeStyle(value);
    //commands.push(SetStrokeStyle, 1, value);
}

function pop_strokestyle() {
    _stack_strokestyle.pop();
    const prev = _stack_strokestyle[_stack_strokestyle.length-1];
    SetStrokeStyle(prev);
    //commands.push(SetStrokeStyle, 1, prev);
}

// LineWidth

const _stack_linewidth = [1];

function push_linewidth(value) {
    _stack_linewidth.push(value);
    SetLineWidth(value);
    //commands.push(SetLineWidth, 1, value);
}

function pop_linewidth() {
    _stack_linewidth.pop();
    const prev = _stack_linewidth[_stack_linewidth.length-1];
    SetLineWidth(prev);
    //commands.push(SetLineWidth, 1, prev);
}

// LineDash

const _stack_linedash = [[]];

function push_linedash(value) {
    console.assert(value);
    console.assert(value != null);
    _stack_linedash.push(value);
    SetLineDash(value);
    //commands.push(SetLineDash, 1, value);
}

function pop_linedash() {
    console.assert(_stack_linedash.length > 0);
    _stack_linedash.pop();
    const prev = _stack_linedash[_stack_linedash.length-1];
    console.assert(prev != null);
    SetLineDash(prev);
    //commands.push(SetLineDash, 1, prev);
}

//

function stroke() {
    Stroke();
    //commands.push(Stroke, 0);
}

function begin_path() {
    BeginPath();
    //commands.push(BeginPath, 0);
}

function move_to(x, y) {
    MoveTo(x, y);
    //commands.push(MoveTo, 2, x, y);
}

function line_to(x, y) {
    LineTo(x, y);
    //commands.push(LineTo, 2, x, y);
}

function begin_clip(rect) {
    BeginClip(rect);
    //commands.push(BeginClip, 1, rect);
}

function end_clip() {
    EndClip();
    //commands.push(EndClip, 0);
}

//

/*
const _checkbutton = 0;
const _handle = 0;
const _renderer_stacks = {
    [_checkbutton]: [draw_checkbutton],
    [_handle]: [draw_handle],
};

function get_renderer(key) {
    console.assert(_renderer_stacks[key]); // alls keys should already exist (add above)
    const stack = _renderer_stacks[key];
    return stack[stack.length-1];
}

function push_renderer(key, render_function) {
    console.assert(render_function);
    _renderer_stacks[key].push(render_function);
}

function pop_renderer(key) {
    return _renderer_stacks[key].pop();
}*/

export {
    get_centered_offsets,
    vertical_center,
    vertical_center_text,
    rectangle_offset,
    rectangle_offset_xy,
    rectangle_erode,
    rectangle_dilate,
    point_translate,
    //
    draw_text as text,
    //
    draw_rectangle as rectangle,
    draw_rectangle_soft as rectangle_soft,
    draw_rectangle_soft_right as rectangle_soft_right,
    draw_rectangle_soft_left as rectangle_soft_left,
    draw_rectangle_soft_top as rectangle_soft_top,
    draw_rectangle_soft_bottom as rectangle_soft_bottom,
    //
    draw_circle as circle,
    draw_line as line,
    draw_label as label,
    draw_button as button,
    draw_checkbox as checkbox,
    draw_progressbar as progressbar,
    draw_slider as slider,
    draw_vslider as vslider,
    draw_checkbutton as checkbutton,
    draw_checkbutton_soft_right as checkbutton_soft_right,
    draw_checkbutton_soft_left as checkbutton_soft_left,
    draw_checkbutton_soft_top as checkbutton_soft_top,
    draw_checkbutton_soft_bottom as checkbutton_soft_bottom,
    draw_handle as handle,
    draw_reticle as reticle,
    //
    commands,
    push_strokestyle,
    pop_strokestyle,
    push_linewidth,
    pop_linewidth,
    push_linedash,
    pop_linedash,
    stroke,
    begin_path,
    move_to,
    line_to,
    begin_clip,
    end_clip,
    //
    //_checkbutton,
    //get_renderer, push_renderer, pop_renderer,
};
