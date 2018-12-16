import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts';
import { parseBMFontAscii } from './bmfont.js';
import bmfont_definition_mana16 from './bmfont_definition_mana16.js';
import images_mana16 from './images/mana16.png';

const bmfont_mana16 = parseBMFontAscii(bmfont_definition_mana16);
const bmfont_mana16_img = new Image(512, 81);
bmfont_mana16_img.src = images_mana16;

// these are set in initialize
let context;
let canvas;

const _x = consts._x;
const _y = consts._y;
const _w = consts._w;
const _h = consts._h;

let _mouse_pos = [0 | 0, 0 | 0];

function on_mouse_move(evt) {
    _mouse_pos[_x] = 0 | (evt.clientX); // - client_rect[_x1]);
    _mouse_pos[_y] = 0 | (evt.clientY); // - client_rect[_y1]);
}

function on_mouse_down(evt) {
    ui.on_mousepressed(evt.clientX, evt.clientY, evt.button);
}

function on_mouse_up(evt) {
    ui.on_mousereleased(evt.clientX, evt.clientY, evt.button);
}

// meh
function on_touch_start(evt) {
    ui.on_mousepressed(evt.clientX, evt.clientY, _left);
}

function on_touch_end(evt) {
    ui.on_mousereleased(evt.clientX, evt.clientY, _left);
}

/* -------------------------------------------------------------------------- */

function GetCursorX() {
    return 0 | _mouse_pos[_x];
}

function GetCursorY() {
    return 0 | _mouse_pos[_y];
}

function GetFontSize() {
    return 0 | 14;
}

function DrawText_Stroke(text, x, y, color) {
    let fontsize = GetFontSize();
    if (color == null) { // todo: lose this kind of overloading for perf reasons
        color = m_simpleui.Color(255, 255, 255, 255);
    }
    context.font = "16px Arial";
    context.fillStyle = ui.make_css_color( color );
    let yoffset = fontsize;
    context.fillText(text, x, y + yoffset);
}

function DrawText_Bitmap(text, x, y, color) {
    for (let i = 0; i < text.length; i++) {
        let idx = text.charCodeAt(i);
        let def = bmfont_mana16.chars[idx - 31];

        // replace unknown chars with ?
        if (!def) {
            idx = "?".charCodeAt(0);
            def = bmfont_mana16.chars[idx - 31];
        }

        context.drawImage(
            bmfont_mana16_img,
            def.x, def.y, def.width, def.height,
            x + def.xoffset, y + def.yoffset, def.width, def.height
        );
        x += def.xadvance;
    }
}

// new idea, cache bitmaps instead of worrying about batching
let _drawtext_cache = {};
function DrawText_Cached(text, x, y, color) {

    // draw normal if it's a number?
    //return DrawText_Original(text, x, y, color);
    //return;

    let key = text;
    if (!(key in _drawtext_cache)) {

        let prev_context = context;
        let prev_canvas = canvas;

        let cv = document.createElement('canvas');

        let ctx = cv.getContext('2d');
        cv.width = text.length * 10;
        cv.height = 20;
        //document.body.appendChild(cv);
        let o = { 'canvas': cv, 'context': ctx };

        // draw into custom
        canvas = o.canvas;
        context = o.context;
        {
            DrawText_Bitmap(text, 0, 0, color);
        }
        context = prev_context;
        canvas = prev_canvas;

        _drawtext_cache[key] = o;
    }

    // now just draw the cached canvas onto screen canvas
    context.drawImage(_drawtext_cache[key].canvas, x, y);

}

function DrawText_Dynamic(text, x, y, color) { // 10-12 ms ff
    if (ui.config.drawtext_bitmap) {
        if (true) {
            DrawText_Cached(text, x, y, color);            
        } else {
            DrawText_Bitmap(text, x, y, color);
        }
    } else {
        DrawText_Stroke(text, x, y, color);
    }
}
let DrawText = DrawText_Dynamic; // cached works now, and does increase performance.

function DrawBox_(rect, color) {
    return;
}

function _DrawBoxGradient(x, y, w, h) {
    let use_gradient = ui.config.drawbox_gradient_enable;

    if (use_gradient) {
        let is_size_excluded = w > 200 || h > 200; // || (width<20 && height<20);
        if (is_size_excluded) {
            use_gradient = false;
        }
    }
    if (use_gradient) {
        context.translate(x, y);
        context.fillStyle = ui.config.drawbox_gradient;
        context.fillRect(1, 1, w - 2, h - 2);
        context.translate(-x, -y);
    }    
}

function DrawBox(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    context.fillRect(x, y, w, h);

    _DrawBoxGradient(x, y, w, h);
}

function DrawBoxSoft(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    const lines = 1; // adjustor
    context.fillRect(x, y + lines, w, h - (lines * 2)); // mid

    // faster than making a path, in pixi anyway
    const i = 1;
    const top_x1 = x + i;
    const top_y1 = y + (lines - i);
    const top_w = w - (i * 2);
    context.fillRect(top_x1, top_y1, top_w, 1); //top
    const bot_x1 = x + i;
    const bot_y1 = y + h - 1 - (lines - i);
    const bot_w = w - (i * 2);
    context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot
    
    _DrawBoxGradient(x, y, w, h);
}

function DrawBoxSoftRight(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    const lines = 1; // adjustor
    context.fillRect(x, y + lines, w, h - (lines * 2)); // mid

    // faster than making a path, in pixi anyway
    const i = 1;
    const top_x1 = x + i - 1;
    const top_y1 = y + (lines - i);
    const top_w = w - (i * 2) + 1;
    context.fillRect(top_x1, top_y1, top_w, 1); //top
    const bot_x1 = x + i - 1;
    const bot_y1 = y + h - 1 - (lines - i);
    const bot_w = w - (i * 2) + 1;
    context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot
    
    _DrawBoxGradient(x, y, w, h);
}

function DrawBoxSoftLeft(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    const lines = 1; // adjustor
    context.fillRect(x, y + lines, w, h - (lines * 2)); // mid

    // faster than making a path, in pixi anyway
    const i = 1;
    const top_x1 = x + i - 0;
    const top_y1 = y + (lines - i);
    const top_w = w - (i * 2) + 1;
    context.fillRect(top_x1, top_y1, top_w, 1); //top
    const bot_x1 = x + i - 0;
    const bot_y1 = y + h - 1 - (lines - i);
    const bot_w = w - (i * 2) + 1;
    context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot
    
    _DrawBoxGradient(x, y, w, h);
}

function DrawBoxSoftTop(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    const lines = 1; // adjustor
    context.fillRect(x, y + lines, w, h - (lines * 2)); // mid

    // faster than making a path, in pixi anyway
    const i = 1;
    const top_x1 = x + i;
    const top_y1 = y + (lines - i);
    const top_w = w - (i * 2);
    context.fillRect(top_x1, top_y1, top_w, 1); //top
    const bot_x1 = x + i - 1;
    const bot_y1 = y + h - 1 - (lines - i);
    const bot_w = w - (i * 2) + 2;
    context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot
    
    _DrawBoxGradient(x, y, w, h);
}

function DrawBoxSoftBottom(rect, color) {
    let x = rect[_x];
    let y = rect[_y];
    let w = rect[_w];
    let h = rect[_h];

    context.fillStyle = ui.make_css_color(color);

    const lines = 1; // adjustor
    context.fillRect(x, y + lines, w, h - (lines * 2)); // mid

    // faster than making a path, in pixi anyway
    const i = 1;
    const top_x1 = x + i - 1;
    const top_y1 = y + (lines - i);
    const top_w = w - (i * 2) + 2;
    context.fillRect(top_x1, top_y1, top_w, 1); //top
    const bot_x1 = x + i;
    const bot_y1 = y + h - 1 - (lines - i);
    const bot_w = w - (i * 2);
    context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot
    
    _DrawBoxGradient(x, y, w, h);
}

function DrawCircle(rect, color) {
    const radius = 0 | rect[_w] / 2;
    const cx = 0 | rect[_x] + radius;
    const cy = 0 | rect[_y] + radius;    

    context.beginPath();
    context.fillStyle = ui.make_css_color(color);
    context.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    context.fill();
}

function DrawCircleOutline(rect, color) {
    const radius = 0 | rect[_w] / 2;
    const cx = 0 | rect[_x] + radius;
    const cy = 0 | rect[_y] + radius;    

    context.beginPath();
    context.strokeStyle = ui.make_css_color(color);
    context.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    context.stroke();
}

function DrawLine(x1, y1, x2, y2) {
    x1 = 0 | x1;
    y1 = 0 | y1;
    x2 = 0 | x2;
    y2 = 0 | y2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

/* */

function initialize(canvasId) {
    canvas = document.getElementById(canvasId);
    console.assert(canvas);
    context = canvas.getContext('2d', {alpha: false});

    // i wanted to draw aliased/jagged lines on html5 canvas, but it's not possible (except manually)
    //
    // imageSmoothingEnabled applies to pattern fills and drawImage, it does not affect general anti-aliasing. 

    canvas.addEventListener('mousemove', on_mouse_move, false);
    // touch move? (NO!)

    canvas.addEventListener('mousedown', on_mouse_down, false);
    canvas.addEventListener('touchstart', on_touch_start, { capture: false, passive: true });

    canvas.addEventListener('mouseup', on_mouse_up, false);
    canvas.addEventListener('touchend', on_touch_end, false);

    ui.config.drawbox_gradient = CreateDrawboxGradient(
        context,
        uidraw.box_gradient.x1, uidraw.box_gradient.y1,
        uidraw.box_gradient.x2, uidraw.box_gradient.y2,
        uidraw.box_gradient.color_stop1,
        uidraw.box_gradient.color_stop2
    );
}

function GetClientWidth() {
    return 0 | canvas.width;
}

function GetClientHeight() {
    return 0 | canvas.height;
}

function GetContext() {
    return context;
}

function GetCanvas() {
    return canvas;
}

function UpdateSize() {    
    // todo: move canvas_size_hack into this driver, expose options object with it
    canvas.width = window.innerWidth - app.canvas_size_hack;
    canvas.height = window.innerHeight - app.canvas_size_hack;
}

function CreateDrawboxGradient(context, x1, y1, x2, y2, colorstop1, colorstop2) {
    console.assert(context);
    let grd = context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0.0, make_css_color(colorstop1));
    grd.addColorStop(1.0, make_css_color(colorstop2));
    return grd;    
}

function FrameClear() {
    context.beginPath();
    context.fillStyle = make_css_color(uidraw.bg_color);
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();
    context.closePath();
}

function SetStrokeStyle(value) {
    context.strokeStyle = value;
}

function SetLineWidth(value) {
    context.lineWidth = value;
}

function SetLineDash(value) {
    context.setLineDash(value);
}

function Stroke() {
    context.stroke();
}

function BeginPath() {
    context.beginPath();
}

function MoveTo(x, y) {
    context.moveTo(x, y);
}

function LineTo(x, y) {
    context.lineTo(x, y);
}

function BeginClip(rect) {
    context.save();
    context.beginPath();
    context.rect(rect[_x], rect[_y], rect[_w], rect[_h]);
    context.clip();    
}

function EndClip() {
    context.restore();
}

const config = {
    has_drawbox_gradient: 0 | true,
}

export {
    initialize,
    config,
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
    GetClientHeight,
    GetClientWidth,
    GetContext,
    GetCanvas,
    UpdateSize,
    CreateDrawboxGradient,
    FrameClear,
    SetStrokeStyle,
    SetLineWidth,
    SetLineDash,
    Stroke,
    BeginPath,
    MoveTo,
    LineTo,
    BeginClip,
    EndClip,
}