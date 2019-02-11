import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import { parseBMFontAscii } from './bmfont.js';
import bmfont_definition_mana16 from './bmfont_definition_mana16.js';
import images_mana16 from './images/mana16.png';

const bmfont_mana16 = parseBMFontAscii(bmfont_definition_mana16);
const bmfont_mana16_img = new Image(512, 81);
bmfont_mana16_img.src = images_mana16;

// these are set in initialize
let context;
let canvas;

let _mouse_pos = ui.Point(0 | -1, 0 | -1); // -1 to put it out of bounds... idk

function on_mouse_move(evt) {
    _mouse_pos.x = 0 | (evt.offsetX);
    _mouse_pos.y = 0 | (evt.offsetY);
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
    return 0 | _mouse_pos.x;
}

function GetCursorY() {
    return 0 | _mouse_pos.y;
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
    context.fillStyle = ui.make_css_color(color);
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
            DrawText_Cached(text + '', x, y, color);
        } else {
            DrawText_Bitmap(text + '', x, y, color);
        }
    } else {
        DrawText_Stroke(text + '', x, y, color);
    }
}
let DrawText = DrawText_Dynamic; // cached works now, and does increase performance.

//let _gradient_bitmap;
//let _gradient_bitmap_requested = 0 | false;
function _DrawBoxGradient(x, y, w, h) {
    //let use_gradient = 0 | ui.config.drawbox_gradient_enable;
    //if (!use_gradient) return;

    //if (_gradient_bitmap) {        
    //if ( 0 | w > 200 || h > 200) {
    //use_gradient = false;
    //} else {            
    /*context.drawImage( // sllllooooooooooooooooooooooow
        _gradient_bitmap,                
        1, 1, w - 2, h - 2,
        x + 1, y + 1, w - 2, h - 2,
    );*/
    context.translate(0 | x, 0 | y); // slow
    context.fillStyle = ui.config.drawbox_gradient; // slow
    context.fillRect(0 | 1, 0 | 1, 0 | w - 2, 0 | h - 2); // fast
    context.translate(0 | -x, 0 | -y); // slow
    //        }
    /*} else {
        if (_gradient_bitmap_requested) {
            // pass
        } else {            
            const grad_canvas = new OffscreenCanvas(200, 200);
            const grad_context = grad_canvas.getContext('2d');
            grad_context.fillStyle = ui.config.drawbox_gradient;
            //grad_context.fillRect(1,1,w-2,h-2); // cant do this for texture, needs to happen before this call
            grad_context.fillRect(0,0,w,h);            
            createImageBitmap(grad_canvas).then(function(bmp) {
                _gradient_bitmap = bmp;            
            });
            _gradient_bitmap_requested = 0 | true;
        }
    }*/
}

function DrawBox(rect, color) {
    context.fillStyle = ui.make_css_color(color);
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function DrawBox3d(rect, color) {
    DrawBox(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawBoxOutline(rect, color) {
    context.strokeStyle = ui.make_css_color(color);
    if (context.lineWidth % 2 == 0) {
        context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else {
        context.strokeRect(rect.x - 0.5, rect.y - 0.5, rect.w, rect.h);
    }


}

function DrawBoxSoft(rect, color) {
    let x = 0 | rect.x; // aliases like this dont seem to be a perf issue
    let y = 0 | rect.y;
    let w = 0 | rect.w;
    let h = 0 | rect.h;

    context.fillStyle = ui.make_css_color(color);
    context.fillRect(x, y + 1, w, h - (1 * 2)); // mid

    // top
    context.fillRect(
        x + 1,
        y,
        w - (1 * 2),
        1
    );
    // bot
    context.fillRect(
        x + 1,
        y + h - 1,
        w - (1 * 2),
        1
    );
}

function DrawBox3dSoft(rect, color) {
    DrawBoxSoft(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawBoxSoftRight(rect, color) {
    let x = 0 | rect.x;
    let y = 0 | rect.y;
    let w = 0 | rect.w;
    let h = 0 | rect.h;

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
}

function DrawBox3dSoftRight(rect, color) {
    DrawBoxSoftRight(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawBoxSoftLeft(rect, color) {
    let x = 0 | rect.x;
    let y = 0 | rect.y;
    let w = 0 | rect.w;
    let h = 0 | rect.h;

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
}

function DrawBox3dSoftLeft(rect, color) {
    DrawBoxSoftLeft(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawBoxSoftTop(rect, color) {
    let x = 0 | rect.x;
    let y = 0 | rect.y;
    let w = 0 | rect.w;
    let h = 0 | rect.h;

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
}

function DrawBox3dSoftTop(rect, color) {
    DrawBoxSoftTop(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawBoxSoftBottom(rect, color) {
    let x = 0 | rect.x;
    let y = 0 | rect.y;
    let w = 0 | rect.w;
    let h = 0 | rect.h;

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
}

function DrawBox3dSoftBottom(rect, color) {
    DrawBoxSoftBottom(rect, color);
    _DrawBoxGradient(0 | rect.x, 0 | rect.y, 0 | rect.w, 0 | rect.h);
}

function DrawCircle(rect, color) {
    const radius = 0 | rect.w / 2;
    const cx = 0 | rect.x + radius;
    const cy = 0 | rect.y + radius;

    context.beginPath();
    context.fillStyle = ui.make_css_color(color);
    context.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    context.fill();
}

function DrawCircleOutline(rect, color) {
    const radius = 0 | rect.w / 2;
    const cx = 0 | rect.x + radius;
    const cy = 0 | rect.y + radius;

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

function initialize(canvas_id) {
    canvas = document.getElementById(canvas_id);
    console.assert(canvas);
    context = canvas.getContext('2d', { alpha: false });

    // i wanted to draw aliased/jagged lines on html5 canvas, but it's not possible (except manually)
    //
    // imageSmoothingEnabled applies to pattern fills and drawImage, it does not affect general anti-aliasing. 

    canvas.addEventListener('mousemove', on_mouse_move, false);
    // touch move? (NO!)

    canvas.addEventListener('mousedown', on_mouse_down, false);
    canvas.addEventListener('touchstart', on_touch_start, { capture: false, passive: true });

    canvas.addEventListener('mouseup', on_mouse_up, false);
    canvas.addEventListener('touchend', on_touch_end, false);

    // disable default canvas right click
    canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); e.stopPropagation(); return false; }, true);

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

function CreateDrawboxGradient(context, x1, y1, x2, y2, input_color1, input_color2) {
    let color1;
    let color2;
    // ok, so firefox renders gradients WILDLY differently, something different with alpha
    if (ui.is_browser_gecko()) {
        color1 = Color(
            input_color1[_r],
            input_color1[_g],
            input_color1[_b],
            0 | input_color1[_a] / 2
        );
        color2 = Color(
            input_color2[_r],
            input_color2[_g],
            input_color2[_b],
            0 | input_color2[_a] / 2
        );
    } else {
        color1 = input_color1;
        color2 = input_color2;
    }

    console.assert(context);
    let grd = context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0.0, make_css_color(color1));
    grd.addColorStop(1.0, make_css_color(color2));
    return grd;
}

function FrameClear() {
    uidraw.push_fillstyle(make_css_color(uidraw.bg_color));
    context.fillRect(0, 0, canvas.width, canvas.height);
    uidraw.pop_fillstyle();
    /*context.beginPath();
    context.fillStyle = make_css_color(uidraw.bg_color);
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();
    context.closePath();*/
}

function SetStrokeStyle(value) {
    context.strokeStyle = value;
}

function SetFillStyle(value) {
    context.fillStyle = value;
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
    context.rect(rect.x, rect.y, rect.w, rect.h);
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
    GetClientHeight,
    GetClientWidth,
    GetContext,
    GetCanvas,
    UpdateSize,
    CreateDrawboxGradient,
    FrameClear,
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
}