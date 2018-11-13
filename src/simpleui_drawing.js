import * as m_simpleui from './simpleui.js';
import { Rectangle, Point } from './simpleui.js';

export let font_size = GetFontSize();
export let default_text_color = Color(255, 255, 255, 255);
export let normal_back = Color(60, 79, 117, 255);
export let normal_face = Color(5, 0, 10, 255);
export let raised_back = Color(0, 0, 0, 255);
export let raised_face = Color(127, 127, 127, 255);
export let hot_back = Color(125, 245, 185, 255);
export let hot_face = Color(0, 77, 128, 204);
export let activating_back = Color(255, 255, 255, 255);
export let activating_face = Color(0, 204, 123, 192);
export let accent = Color(34, 89, 144, 142);
export let focus_back = normal_back;
export let focus_face = normal_face;

// > no-alpha debug mode
if (false) {
    accent = Color(64, 89, 89, 255);
    activating_face = hot_face;
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
        if (text == null) { text = ''; }
        if (color == null) { color = default_text_color; }
        DrawText(text, x, y, color);
    }
}

function draw_rectangle(rect, color) {
    DrawBox(rect, color);
}

function draw_label(text, pt, color) {
    draw_text(text, 0 | pt[_x], 0 | pt[_y], color);
}

/*function draw_button(text, rect, state, text_offset_x, text_offset_y) {
    let rect1 = rectangle_erode(rect, 1);

    console.assert(activating_back.x == undefined);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else {
        draw_rectangle(rect, normal_back);
        draw_rectangle(rect1, normal_face);
    }

    let text_pos;
    if (text_offset_x == null || text_offset_y == null) {
        text_pos = point_translate(vertical_center_text(rect1), 3, 0);
    } else {
        text_pos = point_translate(rect1, text_offset_x, text_offset_y);
    }
    if (state[_Held]) {
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}*/

function draw_button(text, rect, state) {
    let rect1 = rectangle_erode(rect, 1);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else {
        draw_rectangle(rect, normal_back);
        draw_rectangle(rect1, normal_face);
    }

    let text_pos = point_translate(vertical_center_text(rect1), 3, 0);

    if (state[_Held]) {
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}


function draw_checkbox(uiid, rect, state, value) {
    let rect1 = rectangle_erode(rect, 1);
    let rect2 = rectangle_erode(rect, 4);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else {
        draw_rectangle(rect, normal_back);
        draw_rectangle(rect1, normal_face);
    }

    if ((!value && state[_Held]) || value) {
        draw_rectangle(rect2, Color(255, 255, 255, 255));
    }
}

function draw_progressbar(uiid, rect, state, max, value) {
    let rect1 = rectangle_erode(rect, 1);
    //let rect2 = rectangle_erode(rect, 2);
    let rect3 = rectangle_erode(rect, 3);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else {
        draw_rectangle(rect, normal_back);
        draw_rectangle(rect1, normal_face);
    }

    const progw = 0 | (rect3[_w] * (value / max));
    let progrect = Rectangle(rect3[_x], rect3[_y], progw, rect3[_h]);
    draw_rectangle(progrect, accent);
}

function draw_slider2(uiid, x, y, w, h, hovered, held, min, max, value, label) {
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(w);
    m_v8.assert_smi(h);
    m_v8.assert_smi(hovered);
    m_v8.assert_smi(held);
    m_v8.assert_smi(min);
    m_v8.assert_smi(max);
    m_v8.assert_smi(value);
    console.assert(label != null);
    console.assert(label != undefined);

    const range = 0 | (max - min);
    const rel_value = 0 | (value - min);
    const value_percent = (rel_value / range);

    const rect = Rectangle(x,y,w,h);
    const rect1 = rectangle_erode(rect, 1);
    const rect3 = rectangle_erode(rect, 3);

    let progw = 0 | (w * value_percent);
    let progrect = Rectangle(x, y, progw, h);

    // handle
    let holder = rect1;
    let handledim = 0 | holder[_h];
    let handlepos = 0 | ( (w - handledim) * value_percent + handledim / 2);
    const rectx = 0 | (holder[_x] + handlepos - handledim / 2);
    const recty = 0 | (holder[_y]);
    let hrect = Rectangle(rectx, recty, handledim, handledim);
    let hrect2 = rectangle_erode(hrect, 2);

    draw_rectangle(rect, normal_back);
    draw_rectangle(rect1, normal_face);
    draw_rectangle(progrect, accent);

    if (held) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else if (hovered) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else { // normal
        draw_rectangle(hrect, raised_back);
        draw_rectangle(hrect2, raised_face);
    }
    if (label) {
        const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 4);
        const texty = 0 | (hrect[_y] + hrect[_h] / 2 - 8);
        draw_text(label, textx, texty, Color(0, 0, 0, 127));
    }
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
    const rect3 = rectangle_erode(rect, 3);

    let progw = 0 | (rect3[_w] * value_percent);
    let progrect = Rectangle(rect3[_x], rect3[_y], progw, rect3[_h]);

    // handle
    let holder = rect1;
    let handledim = 0 | holder[_h];
    let handlepos = 0 | ((rect1[_w] - handledim) * value_percent + handledim / 2);
    const rectx = 0 | (holder[_x] + handlepos - handledim / 2);
    const recty = 0 | (holder[_y]);
    let hrect = Rectangle(rectx, recty, handledim, handledim);
    let hrect2 = rectangle_erode(hrect, 2);

    draw_rectangle(rect, normal_back);
    draw_rectangle(rect1, normal_face);
    draw_rectangle(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else { // normal
        draw_rectangle(hrect, raised_back);
        draw_rectangle(hrect2, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 4);
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

    let rect1 = rectangle_erode(rect, 1);
    let rect3 = rectangle_erode(rect, 3);

    let progh = 0 | (rect3[_h] * value_percent);
    let progrect = Rectangle(rect3[_x], rect3[_y], rect3[_w], progh);

    // handle
    let holder = rect1;
    let handledim = holder[_w];
    let handlepos = round((rect1[_h] - handledim) * (rel_value / range) + handledim / 2, 0);
    let hrect = Rectangle(holder[_x] + 0, holder[_y] + handlepos - handledim / 2, handledim, handledim);
    let hrect2 = rectangle_erode(hrect, 2);

    draw_rectangle(rect, normal_back);
    draw_rectangle(rect1, normal_face);
    draw_rectangle(progrect, accent);

    if (state[_Held]) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else if (state[_Hovered]) {
        draw_rectangle(hrect, hot_back);
        draw_rectangle(hrect2, raised_face);
    } else { // normal
        draw_rectangle(hrect, raised_back);
        draw_rectangle(hrect2, raised_face);
    }
    if (handle_label) {
        const textx = 0 | (hrect[_x] + hrect[_w] / 2 - 5);
        const texty = 0 | (hrect[_y] + hrect[_h] / 2 - 6);
        draw_text(handle_label, textx, texty, Color(0, 0, 0, 127));
    }
}

function draw_checkbutton(text, rect, state, value, text_offset_x, text_offset_y) {

    let rect1 = rectangle_erode(rect, 1);
    let rect2 = rectangle_erode(rect, 2);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else { // normal
        if (value) {
            draw_rectangle(rect, hot_back);
            draw_rectangle(rect2, hot_face);
        } else {
            draw_rectangle(rect, normal_back);
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
        draw_label(text, text_pos);
    } else {
        draw_label(text, text_pos);
    }
}

function draw_handle(uiid, rect, state) {
    const rect1 = rectangle_erode(rect, 1);

    if (state[_Held]) {
        draw_rectangle(rect, activating_back);
        draw_rectangle(rect1, activating_face);
    } else if (state[_Hovered]) {
        draw_rectangle(rect, hot_back);
        draw_rectangle(rect1, hot_face);
    } else {
        draw_rectangle(rect, normal_back);
        draw_rectangle(rect1, normal_face);
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
    draw_label as label,
    draw_button as button,
    draw_checkbox as checkbox,
    draw_progressbar as progressbar,
    draw_slider as slider,
    draw_slider2 as slider2,
    draw_vslider as vslider,
    draw_checkbutton as checkbutton,
    draw_handle as handle,
};
