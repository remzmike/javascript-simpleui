import * as m_simpleui from './simpleui.js';
import { Rectangle, RectangleP, Color, ColorP, Point, PointP } from './simpleui.js';
import * as consts from './simpleui_consts.js';
// later: these will be in a var/obj/namespace here, so i can switch to other drivers
import {
    DrawBox,
    DrawBox3d,
    DrawBoxOutline,
    DrawBoxSoft,
    DrawBoxSoftRight,
    DrawBoxSoftLeft,
    DrawBoxSoftTop,
    DrawBoxSoftBottom,
    DrawBox3dSoft,
    DrawBox3dSoftRight,
    DrawBox3dSoftLeft,
    DrawBox3dSoftTop,
    DrawBox3dSoftBottom,
    DrawText,
    DrawLine,
    DrawCircle,
    DrawCircleOutline,
    GetCursorX,
    GetCursorY,
    GetFontSize,
    SetStrokeStyle,
    SetFillStyle,
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

const _Hovered = consts._Hovered;
const _Held = consts._Held;

let round = Math.round;

export const default_text_color = Color(255, 255, 255, 255);
export const default_line_color = Color(255, 255, 255, 255);
export const default_fill_color = Color(0, 0, 0, 255);

export const accent = Color(120, 180, 140, 127);
export const bg_color = Color(91 - 15, 98 - 15, 96 - 15, 255);
export const panel_color = Color(46, 46, 46, 255);

export const normal_back = Color(36, 36, 36, 255);
export const normal_face = Color(72, 72, 72, 255);
export const activating_face = Color(0, 204, 123, 0 | 255 * 0.8);

export const raised_face = Color(180 - 10, 180 + 9 - 10, 180 - 3 - 10, 255);
export const raised_accent = Color(250, 255, 240, 255);

export const focus_back = normal_back;
export const focus_face = normal_face;

export const font_size = GetFontSize();

export const color_white = Color(255, 255, 255, 255);
export const color_black = Color(0, 0, 0, 255);

export const box_gradient = {
    x1: 80,
    y1: 22,
    x2: 85,
    y2: -32,
    color_stop1: Color(0, 0, 0, 50), // was 38
    color_stop2: Color(255, 255, 255, 144)
};

// > no-alpha debug mode
if (false) {
    accent = Color(64, 89, 89, 255);
    activating_face = accent;
}

// center 2 rectangles on each other, return x & y offsets
function get_centered_offsets(rect1, rect2) {
    let ox = round((rect1.w - rect2.w) / 2);
    let oy = round((rect1.h - rect2.h) / 2);
    return [0 | ox, 0 | oy];
}

function get_vertical_centered_text_offset(h) {
    let height_delta = 0 | h - font_size;
    let y_offset = 0 | (height_delta / 2);
    return y_offset;
}
// get_center_offset(rect.y, rect.h)

function vertical_center_text(rect) {
    const y_offset = get_vertical_centered_text_offset(rect.h);
    let result = PointP(0 | rect.x, 0 | rect.y + y_offset);
    return result;
}

/*function rectangle_center(rect) {
    return Point(rect.x + rect.w / 2, rect.y + rect.h / 2);
}*/

/*function rectangle_offset(rect, offset) {
    return RectangleP(0 | rect.x + offset, 0 | rect.y + offset, 0 | rect.w, 0 | rect.h);
}*/

/*function rectangle_offset_xy(rect, offset_x, offset_y) {
    return RectangleP(0 | rect.x + offset_x, 0 | rect.y + offset_y, 0 | rect.w, 0 | rect.h);
}*/

function rectangle_erode(rect, amount) {
    return RectangleP(0 | rect.x + amount, 0 | rect.y + amount, 0 | rect.w - amount * 2, 0 | rect.h - amount * 2);
}

function rectangle_dilate(rect, amount) {
    return rectangle_erode(rect, -amount);
}

/*function rectangle_underline(rect, size) {
    return Rectangle(rect.x, rect.y+rect.h-size, rect.w, size);
}*/

function point_translate(pt, x, y) {
    pt.x = 0 | (pt.x + x);
    pt.y = 0 | (pt.y + y);
    return pt;
}

function draw_text(text, x, y, color) {
    if (m_simpleui.config.drawtext_enable) {
        DrawText(text, x, y, color);
        //commands.push(DrawText, 4, text, x, y, color);
    }
}

const draw_rectangle = DrawBox;
const draw_rectangle3d = DrawBox3d;
//
const draw_rectangle_outline = DrawBoxOutline;
//
const draw_rectangle_soft = DrawBoxSoft;
const draw_rectangle_soft_right = DrawBoxSoftRight;
const draw_rectangle_soft_left = DrawBoxSoftLeft;
const draw_rectangle_soft_top = DrawBoxSoftTop;
const draw_rectangle_soft_bottom = DrawBoxSoftBottom;
//
const draw_rectangle3d_soft = DrawBox3dSoft;
const draw_rectangle3d_soft_right = DrawBox3dSoftRight;
const draw_rectangle3d_soft_left = DrawBox3dSoftLeft;
const draw_rectangle3d_soft_top = DrawBox3dSoftTop;
const draw_rectangle3d_soft_bottom = DrawBox3dSoftBottom;
//
const draw_circle = DrawCircle;
const draw_circle_outline = DrawCircleOutline;
const draw_line = DrawLine;

function draw_label(text, rect, color) {
    draw_text(text, 0 | rect.x, 0 | rect.y, color);
}

function button(text, rect) {
    let rect1 = rectangle_erode(rect, 1);
    draw_rectangle3d_soft(rect, normal_back);
    draw_rectangle3d_soft(rect1, normal_face);
    // todo? draw_rectangle3d_soft_erode(rect, normal_face, 1);
    let text_pos = point_translate(vertical_center_text(rect1), 5, 0);
    draw_label(text, text_pos);
    //draw_label
}

function button_held(text, rect) {
    let rect1 = rectangle_erode(rect, 1);
    draw_rectangle3d_soft(rect, normal_back);
    draw_rectangle3d_soft(rect, activating_face);
    let text_pos = point_translate(vertical_center_text(rect1), 5, 0);
    text_pos.y = text_pos.y + 1;
    draw_label(text, text_pos);
}

function button_hovered(text, rect) {
    let rect1 = rectangle_erode(rect, 1);
    draw_rectangle3d_soft(rect, normal_back);
    draw_rectangle3d_soft(rect1, accent);
    let text_pos = point_translate(vertical_center_text(rect1), 5, 0);
    draw_label(text, text_pos);
}

function checkbox(rect, value) {
    draw_rectangle3d(rect, normal_back);
    draw_rectangle3d(rectangle_erode(rect, 1), normal_face);
    if (value) {
        draw_rectangle3d(rectangle_erode(rect, 4), color_white);
    }
}

function checkbox_held(rect, value) {
    draw_rectangle3d(rect, normal_back);
    draw_rectangle3d(rectangle_erode(rect, 1), activating_face);
    if (value) {
        draw_rectangle3d(rectangle_erode(rect, 4), color_white);
    } else {
        draw_rectangle3d(rectangle_erode(rect, 4), ColorP(255, 255, 255, 127));
    }
}

function checkbox_hovered(rect, value) {
    draw_rectangle3d(rect, normal_back);
    draw_rectangle3d(rectangle_erode(rect, 1), accent);
    if (value) {
        draw_rectangle3d(rectangle_erode(rect, 4), color_white);
    }
}

function progressbar(rect, max, value) {
    let rect2 = rectangle_erode(rect, 2);
    draw_rectangle3d(rect, normal_back);
    const progw = 0 | (rect2.w * (value / max));
    let progrect = RectangleP(rect2.x, rect2.y, progw, rect2.h);
    draw_rectangle3d_soft(progrect, accent);
}

function draw_slider(uiid, rect, state, min, max, value, handle_label) {
    console.assert(handle_label != null);

    const range = 0 | (max - min);
    const rel_value = 0 | (value - min);
    const value_percent = (rel_value / range);

    const rect1 = rectangle_erode(rect, 1);
    const rect2 = rectangle_erode(rect, 2);

    let progw = 0 | (rect2.w * value_percent);
    let progrect = RectangleP(rect2.x, rect2.y, progw, rect2.h);

    // handle
    let handledim = 0 | rect1.h;
    let handlew = handledim / 4;
    let handlepos = 0 | ((rect1.w - handlew) * value_percent + handledim / 2);
    const rectx = 0 | (rect1.x + handlepos - handledim / 2);
    const recty = 0 | (rect1.y);
    let hrect = RectangleP(rectx, recty + 1, handlew, handledim - 2);

    draw_rectangle3d(rect, normal_back);
    draw_rectangle3d_soft(progrect, accent);

    if (state[_Held]) {
        draw_rectangle3d(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle3d(hrect, raised_accent);
    } else { // normal
        draw_rectangle3d(hrect, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (rect.x + rect.w - 16);
        const texty = 0 | (hrect.y + hrect.h / 2 - 8);
        draw_text(handle_label, textx, texty, color_white);
    }
}

function draw_vslider(uiid, rect, state, min, max, value, handle_label) {
    /*m_v8.assert_smi(rect.x);
    m_v8.assert_smi(rect.y);
    m_v8.assert_smi(rect.w);
    m_v8.assert_smi(rect.h);
    m_v8.assert_smi(state[_Hovered]);
    m_v8.assert_smi(state[_Held]);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);*/
    console.assert(handle_label != null);
    console.assert(handle_label != undefined);

    const range = 0 | (max - min);
    const rel_value = 0 | (value - min);
    const value_percent = (rel_value / range);

    const rect1 = rectangle_erode(rect, 1);
    const rect2 = rectangle_erode(rect, 2);

    let progh = 0 | (rect2.h * value_percent);
    let progrect = RectangleP(rect2.x, rect2.y, rect2.w, progh);

    // handle
    let handledim = 0 | rect1.w;
    let handleh = 0 | handledim / 4;
    let handlepos = 0 | ((rect1.h - handleh) * value_percent + handledim / 2);
    const rectx = 0 | rect1.x;
    const recty = 0 | (rect1.y + handlepos - handledim / 2);
    let hrect = RectangleP(rectx + 1, recty, handledim - 2, handleh);

    draw_rectangle3d(rect, normal_back);
    draw_rectangle3d_soft(progrect, accent);

    if (state[_Held]) {
        draw_rectangle3d(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle3d(hrect, raised_accent);
    } else { // normal
        draw_rectangle3d(hrect, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (hrect.x + hrect.w / 2 - 5);
        const texty = 0 | (rect.y + rect.h - 16);
        draw_text(handle_label, textx, texty, color_white);
    }
}

function draw_checkbutton(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle3d);
}

function draw_checkbutton_soft_right(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle3d_soft_right);
}

function draw_checkbutton_soft_left(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle3d_soft_left);
}

function draw_checkbutton_soft_top(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle3d_soft_top);
}

function draw_checkbutton_soft_bottom(text, rect, state, value, text_offset_x, text_offset_y) {
    draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, draw_rectangle3d_soft_bottom);
}

function draw_checkbutton_override(text, rect, state, value, text_offset_x, text_offset_y, fn_draw_rectangle) {

    let rect1 = rectangle_erode(rect, 1);

    fn_draw_rectangle(rect, normal_back);

    if (state[_Held]) {
        fn_draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        fn_draw_rectangle(rect1, accent);
    } else { // normal
        if (value) {
            fn_draw_rectangle(rect1, accent);
        } else {
            fn_draw_rectangle(rect1, normal_face);
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
        text_pos.y = text_pos.y + 1;
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}

function handle(rect) {
    draw_rectangle(rect, normal_back);
}

function handle_held(rect) {    
    handle(rect);
    draw_rectangle(rectangle_erode(rect, 1), activating_face);
}

function handle_hovered(rect) {
    handle(rect);    
    draw_rectangle(rectangle_erode(rect, 1), accent);
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
    draw_circle_outline(rect, color_white);
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
    const prev = _stack_strokestyle[_stack_strokestyle.length - 1];
    SetStrokeStyle(prev);
    //commands.push(SetStrokeStyle, 1, prev);
}

// FillStyle

const _stack_fillstyle = [default_fill_color];

function push_fillstyle(value) {
    _stack_fillstyle.push(value);
    SetFillStyle(value);
    //commands.push(SetStrokeStyle, 1, value);
}

function pop_fillstyle() {
    _stack_fillstyle.pop();
    const prev = _stack_fillstyle[_stack_fillstyle.length - 1];
    SetFillStyle(prev);
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
    const prev = _stack_linewidth[_stack_linewidth.length - 1];
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
    const prev = _stack_linedash[_stack_linedash.length - 1];
    console.assert(prev != null);
    SetLineDash(prev);
    //commands.push(SetLineDash, 1, prev);
}

//

const stroke = Stroke;
const begin_path = BeginPath;
const move_to = MoveTo;
const line_to = LineTo;
const begin_clip = BeginClip;
const end_clip = EndClip;

export {
    get_centered_offsets,
    //vertical_center,
    vertical_center_text,
    //rectangle_offset,
    //rectangle_offset_xy,
    rectangle_erode,
    rectangle_dilate,
    point_translate,
    //
    draw_text as text,
    //
    draw_rectangle as rectangle,
    draw_rectangle3d as rectangle3d,
    draw_rectangle_outline as rectangle_outline,
    draw_rectangle_soft as rectangle_soft,
    draw_rectangle_soft_right as rectangle_soft_right,
    draw_rectangle_soft_left as rectangle_soft_left,
    draw_rectangle_soft_top as rectangle_soft_top,
    draw_rectangle_soft_bottom as rectangle_soft_bottom,
    //
    draw_circle as circle,
    draw_circle_outline as circle_outline,
    draw_line as line,
    draw_label as label,
    button, button_held, button_hovered,
    checkbox, checkbox_held, checkbox_hovered,
    progressbar,
    draw_slider as slider,
    draw_vslider as vslider,
    draw_checkbutton as checkbutton,
    draw_checkbutton_soft_right as checkbutton_soft_right,
    draw_checkbutton_soft_left as checkbutton_soft_left,
    draw_checkbutton_soft_top as checkbutton_soft_top,
    draw_checkbutton_soft_bottom as checkbutton_soft_bottom,
    handle, handle_held, handle_hovered,
    draw_reticle as reticle,
    //
    commands,
    push_strokestyle,
    pop_strokestyle,
    push_fillstyle,
    pop_fillstyle,
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
