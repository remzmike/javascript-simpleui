import { parseBMFontAscii } from './bmfont.js';
import bmfont_definition_mana16 from './bmfont_definition_mana16.js';
import images_mana16 from './images/mana16.png';

const bmfont_mana16 = parseBMFontAscii(bmfont_definition_mana16);
const bmfont_mana16_img = new Image(512, 81);
bmfont_mana16_img.src = images_mana16;

let _mouse_pos = [0 | 0, 0 | 0];

function on_mouse_move(evt) {
    let rect = canvas.getBoundingClientRect();
    _mouse_pos.x = 0 | (evt.clientX - rect.left);
    _mouse_pos.y = 0 | (evt.clientY - rect.top);
}

function on_mouse_down(evt) {
    let x = evt.clientX;
    let y = evt.clientY;
    let button = evt.button;
    ui.on_mousepressed(x, y, button);
}

function on_mouse_up(evt) {
    let x = evt.clientX;
    let y = evt.clientY;
    let button = evt.button;
    ui.on_mousereleased(x, y, button);
}

// meh
function on_touch_start(evt) {
    let x = evt.clientX;
    let y = evt.clientY;
    ui.on_mousepressed(x, y, _left);
}

function on_touch_end(evt) {
    let x = evt.clientX;
    let y = evt.clientX;
    ui.on_mousereleased(x, y, _left);
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

let fonts = [
    { name: 'sans-serif', size: 14, line_size: 14 },
];
function DrawText_Stroke(text, x, y, color) {
    let fontsize = GetFontSize();
    let font = fonts[0];
    context.font = font.size + "px '" + font.name + "'";
    if (color == null) {
        color = m_simpleui.Color(255, 255, 255, 255);
    }
    context.fillStyle = make_css_color(color);
    let yoffset = fontsize - 2;
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

        /*context.drawImage(
            bmfont_mana16_img,
            def.x, def.y, def.width, def.height,
            x + def.xoffset, y + def.yoffset, def.width, def.height
        );*/
        x += def.xadvance;
    }
}

const _pixi_text_objects = {};

function DrawText_PixiText(text, x, y, color) {
    let int_color = color[_r] << 16 | color[_g] << 8 | color[_b];
    const key = `${text}:${int_color};${x}x${y}`;
    let o = _pixi_text_objects[key];
    if (!o) {
        o = new PIXI.Text(
            text,
            { fontFamily: 'Arial', fontSize: 14, fill: int_color }
        );
        _pixi_text_objects[key] = o;
    }
    o.x = x;
    o.y = y;
    pixi_app.stage.addChild(o);
}

function DrawText_Original(text, x, y, color) { // 10-12 ms ff
    if (m_simpleui.config.drawtext_bitmap) {
        DrawText_Bitmap(text, x, y, color);
    } else {
        DrawText_Stroke(text, x, y, color);
    }
}

function DrawBoxInternal(rect, color, soft) {

    const x = rect.x;
    const y = rect.y;
    const width = rect.w;
    const height = rect.h;

    //if (color) {
    const rgb = color[_r] << 16 | color[_g] << 8 | color[_b] << 0;
    context.beginFill(rgb); //, color.a/255);
    //graphics.beginFill(0xFF3300);
    //graphics.lineStyle(4, 0xffd900, 1);

    //}

    /*
    // test texture resampling from white pixel in font
    context.drawImage(
        bmfont_mana16_img,
        2, 2, 1, 1,
        rect.x, rect.y, rect.w, rect.h,       
    );*/

    if (soft) {
        const lines = 1; // adjustor
        context.fillRect(x, y + lines, width, height - (lines * 2)); // mid

        //for (let i=1; i<=lines; i++) {

        // faster than making a path, in pixi anyway
        const i = 1;
        const top_x1 = x + i;
        const top_y1 = y + (lines - i);
        const top_w = width - (i * 2);
        context.fillRect(top_x1, top_y1, top_w, 1); //top
        const bot_x1 = x + i;
        const bot_y1 = y + height - 1 - (lines - i);
        const bot_w = width - (i * 2);
        context.fillRect(bot_x1, bot_y1, bot_w, 1); //bot

    } else {
        context.fillRect(x, y, width, height);
    }

    let use_gradient = m_simpleui.config.drawbox_gradient_enable;

    if (use_gradient) {
        let is_size_excluded = width > 200 || height > 200; // || (width<20 && height<20);
        if (is_size_excluded) {
            use_gradient = false;
        }
    }
    const disabled_for_gl_port = true;
    if (!disabled_for_gl_port && use_gradient) {
        context.translate(x, y); // for gradient
        context.fillStyle = m_simpleui.config.drawbox_gradient;
        context.fillRect(1, 1, width - 2, height - 2);
        context.translate(-x, -y); // this appears to be faster than wrapping save/restore :->
    }

}

function DrawBox(rect, color) {
    return DrawBoxInternal(rect, color, 0 | false);
}

function DrawRoundedBox(rect, color) {
    return DrawBoxInternal(rect, color, soft);
}

const DrawCircle = DrawBox;

function DrawLine(x1, y1, x2, y2) {
    x1 = 0 | x1;
    y1 = 0 | y1;
    x2 = 0 | x2;
    y2 = 0 | y2;
    context.lineStyle(1, 0xFFFFFF, 1, 0);
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
}

const DrawText = DrawText_PixiText;
//const DrawText = DrawText_Bitmap;

// -------------------------------------------------------- //

let canvas;
let context;
let pixi_app;

function initialize(canvasId) {
    // {LINEAR: 0 (default), NEAREST: 1}
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR; // doesnt really matter wrt antialiasing

    console.log('window.devicePixelRatio', window.devicePixelRatio);

    pixi_app = new PIXI.Application({
        width: 256,
        height: 256,
        antialias: false, // enables extremely weak antialiasing
        forceFXAA: false,
        transparent: true,
        resolution: 1, //window.devicePixelRatio,
    });
    pixi_app.renderer.roundPixels = true;
    console.log(pixi_app.renderer);

    canvas = pixi_app.view;
    document.body.appendChild(canvas);

    context = new PIXI.Graphics();

    context.fillRect = function (x, y, w, h) {
        context.lineStyle(0, 0xffffff, 1, 0);
        context.drawRect(x, y, w, h);
    }
    context.save = function () { };
    context.restore = function () { };
    context.clip = function () { };
    context.rect = function () { };
    context.translate = function () { };
    context.stroke = function () { };
    context.beginPath = function () { };
    context.setLineDash = function () { };

    //pixi_app.stage.addChild(graphics);

    canvas.addEventListener('mousemove', on_mouse_move, false);
    // touch move? (NO!)

    canvas.addEventListener('mousedown', on_mouse_down, false);
    canvas.addEventListener('touchstart', on_touch_start, { capture: false, passive: true });

    canvas.addEventListener('mouseup', on_mouse_up, false);
    canvas.addEventListener('touchend', on_touch_end, false);
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
    let w = window.innerWidth - app.canvas_size_hack;
    let h = window.innerHeight - app.canvas_size_hack;
    pixi_app.renderer.resize(w, h);
}

function FrameClear() {
    let stage = pixi_app.stage;
    for (var i = stage.children.length - 1; i >= 0; i--) { stage.removeChild(stage.children[i]); };
    context.clear();
    stage.addChild(context);
}

const config = {
    has_drawbox_gradient: 0 | false,
}

export {
    initialize,
    config,
    DrawBox,
    DrawRoundedBox,
    DrawText,
    DrawLine,
    DrawCircle,
    GetCursorX,
    GetCursorY,
    GetFontSize,
    GetClientHeight,
    GetClientWidth,
    GetContext,
    GetCanvas,
    UpdateSize,
    //CreateDrawboxGradient,
    FrameClear,
}