import * as m_simpleui from './simpleui.js';
import { Rectangle, Point } from './simpleui.js';

let round = Math.round;

export let font_size = GetFontSize();
export let default_line_color = Color(255, 255, 255, 255);
export let default_text_color = Color(255, 255, 255, 255);
//export let default_text_color = Color(0x93, 0xa1, 0xa1, 255);

export let accent = Color(118, 153, 157, 127);
export let bg_color = Color(91, 102, 96, 255);
export let panel_color = Color(46, 46, 46, 255);

export let normal_back = Color(36, 36, 36, 255); // _sol_bg2;
export let normal_face = Color(72, 72, 72, 255); // Color(60, 79, 117, 255); // _sol_content1; // Color(108, 102, 99, 0);
export let activating_face = Color(0, 204, 123, 0 | 255*0.8);

export let raised_face = Color(180, 180+9, 180-3, 255);
export let raised_accent = Color(250, 255, 240, 255);

export let focus_back = normal_back;
export let focus_face = normal_face;

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

const _text_color = Color(255,255,255,255);
function draw_text(text, x, y, color) {
    if (m_simpleui.config.drawtext_enable) {
        //DrawText(text, x, y, color);
        DrawText(text, x, y, _text_color);
    }
}

function draw_rectangle(rect, color) {
    DrawBox(rect, color);
}

function draw_rounded_rectangle(rect, color) {
    DrawRoundedBox(rect, color);
}

function draw_label(text, pt, color) {
    draw_text(text, 0 | pt[_x], 0 | pt[_y], color);
}

function draw_button(text, rect, state) {
    let rect1 = rectangle_erode(rect, 1);
    
    draw_rounded_rectangle(rect, normal_back);

    if (state[_Held]) {
        draw_rounded_rectangle(rect, activating_face);
    } else if (state[_Hovered]) {
        draw_rounded_rectangle(rect1, accent);
    } else {        
        draw_rounded_rectangle(rect1, normal_face);
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
    draw_rounded_rectangle(progrect, accent);
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
    let holder = rect1;
    let handledim = 0 | holder[_h];
    let handlew = handledim / 4;
    let handlepos = 0 | ((rect1[_w] - handlew) * value_percent + handledim / 2);
    const rectx = 0 | (holder[_x] + handlepos - handledim / 2);
    const recty = 0 | (holder[_y]);
    let hrect = Rectangle(rectx, recty, handlew, handledim);

    draw_rectangle(rect, normal_back);
    draw_rounded_rectangle(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, raised_accent);
    } else { // normal
        draw_rectangle(hrect, raised_face);
    }
    if (handle_label) {
        //const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 4);
        let textx;
        if (value_percent < 0.85) {
            textx = 0 | (rect[_x] + rect[_w] - 16);
        } else {
            textx = 0 | (rect[_x] + rect[_w] *.7);
        }
        const texty = 0 | (hrect[_y] + hrect[_h] / 2 - 8);
        draw_text(handle_label, textx, texty, Color(0, 0, 0, 127));
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
    let holder = rect1;
    let handledim = 0 | holder[_w];
    let handleh = 0 | handledim / 4;
    let handlepos = 0 | ((rect1[_h] - handleh) * value_percent + handledim / 2);
    const rectx = 0 | holder[_x];
    const recty = 0 | (holder[_y] + handlepos - handledim / 2);
    let hrect = Rectangle(rectx, recty, handledim, handleh);

    draw_rectangle(rect, normal_back);
    draw_rounded_rectangle(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, raised_accent);
    } else { // normal
        draw_rectangle(hrect, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 5);
        let texty;
        if (value_percent < 0.85) {
            texty = 0 | (rect[_y] + rect[_h] - 16);
        } else {
            texty = 0 | (rect[_y] + rect[_h] *.7);
        }
        //const texty = 0 | (hrect[_y] + hrect[_h] / 2 - 6);
        draw_text(handle_label, textx, texty, Color(0, 0, 0, 127));
    }
}

function draw_checkbutton(text, rect, state, value, text_offset_x, text_offset_y) {

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
        text_pos = point_translate(rect1, text_offset_x, text_offset_y);
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
    draw_rectangle as rectangle,
    draw_rounded_rectangle as rounded_rectangle,
    draw_label as label,
    draw_button as button,
    draw_checkbox as checkbox,
    draw_progressbar as progressbar,
    draw_slider as slider,
    draw_vslider as vslider,
    draw_checkbutton as checkbutton,
    draw_handle as handle,
};
