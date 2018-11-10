let round = Math.round;

var box_gradient_x1 = 40;
var box_gradient_y1 = 0;
var box_gradient_x2 = 120;
var box_gradient_y2 = 120;
var box_gradient_color_stop1 = Color(36, 78, 105, 90);
var box_gradient_color_stop2 = Color(15, 15, 76, 100);
var bg_color = Color(0, 15, 38, 255);
var panel_color1 = Color(26, 38, 64, 255);
var panel_color2 = Color(51, 77, 102, 192);

var window_active = true;

let _mouse_pos = [0 | 0, 0 | 0];

function init_array(size, init_val) {
    let a = [];
    for (let i = 0; i < size; i++) {
        a[i] = init_val;
    }
    return a;
}

function set_size() {
    canvas.width = window.innerWidth - app.canvas_size_hack;
    canvas.height = window.innerHeight - app.canvas_size_hack;

    //canvas.width = Math.max(canvas.width, 800);
    //canvas.height = Math.max(canvas.height, 600);
    // later: always stay the max size we see... (maybe)

    canvas_screen.width = canvas.width;
    canvas_screen.height = canvas.height;
}

function randomize_color(color) {
    let a = [_r, _g, _b, _a];    
    for (let i = 0; i < a.length; i++) {
        let k = a[i];
        let v;
        if (k == _a) {
            v = 125 + Math.round(Math.random() * (255-125));
        } else {
            v = 55 + Math.round(Math.random() * 200);
        }
        color[k] = v;
    }
}

function on_mouse_move(evt) {
    let rect = canvas.getBoundingClientRect();
    _mouse_pos[_x] = 0 | (evt.clientX - rect.left);
    _mouse_pos[_y] = 0 | (evt.clientY - rect.top);
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

function make_css_color(color) {
    let css;

    let use_alpha = true;

    if (document.body.ui) { // todo nolive hax : temporal include dilemma
        // window.ui also works
        use_alpha = ui.config.drawbox_gradient_enable;
    }

    if (use_alpha) {
        css = `rgba(${color[_r]}, ${color[_g]}, ${color[_b]}, ${color[_a]/255})`;
    } else {
        css = `rgba(${color[_r]}, ${color[_g]}, ${color[_b]}, 1)`;
    }

    return css;
}

function make_drawbox_gradient(context, x1, y1, x2, y2, colorstop1, colorstop2) {
    console.assert(context);
    let grd = context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0.0, make_css_color(colorstop1));
    grd.addColorStop(0.5, make_css_color(colorstop2));
    return grd;
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

let fonts = [
    { name: 'sans-serif', size: 14, line_size: 14 },
    { name: 'VJ Nina', size: 14, line_size: 14 },
    { name: 'UPF Mana-16', size: 8, line_size: 14 },
    { name: 'UPF Elementar Basica 13.11.4 a', size: 8, line_size: 14 }
];
function DrawText_Stroke(text, x, y, color) {
    //context.beginPath();
    let fontsize = GetFontSize();
    let font = fonts[2];
    context.font = font.size + "px '" + font.name + "'";
    if (color == null) {
        color = m_simpleui.Color(255, 255, 255, 255);
    }
    context.fillStyle = make_css_color(color);
    let yoffset = fontsize - 2;
    context.fillText(text, x, y + yoffset);
    //context.closePath();
}

function DrawText_Bitmap(text, x, y, color) {
    for (let i = 0; i < text.length; i++) {
        let idx = text.charCodeAt(i);
        let def = bmfont_mana.chars[idx - 31];

        // replace unknown chars with ?
        if (!def) {
            idx = "?".charCodeAt(0);
            def = bmfont_mana.chars[idx - 31];
        }

        context.drawImage(
            bmfont_mana_img,
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
            DrawText_Original(text, 0, 0, color);
        }
        context = prev_context;
        canvas = prev_canvas;

        _drawtext_cache[key] = o;
    }

    // now just draw the cached canvas onto screen canvas
    context.drawImage(_drawtext_cache[key].canvas, x, y);

}

function DrawText_Original(text, x, y, color) { // 10-12 ms ff
    if (m_simpleui.config.drawtext_bitmap) {
        DrawText_Bitmap(text, x, y, color);
    } else {
        DrawText_Stroke(text, x, y, color);
    }
}
let DrawText = DrawText_Cached; // cached works now, and does increase performance.

function DrawBox_(rect, color) {
    return;
}

// todo: later: pass intent instead of color? or maybe that's a level above this
function DrawBox(rect, color) {

    let x = rect[_x];
    let y = rect[_y];
    let width = rect[_w];
    let height = rect[_h];

    const soft = m_simpleui.config.drawbox_soft_enable;

    //if (color) {
        context.fillStyle = make_css_color(color);
    //}

    if (soft) {
        const z = 1;
        //let z2 = z*2;
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
    if (use_gradient) {
        context.translate(x, y); // for gradient
        context.fillStyle = m_simpleui.config.drawbox_gradient;
        context.fillRect(1, 1, width - 2, height - 2);
        context.translate(-x, -y); // this appears to be faster than wrapping save/restore :->
    }

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

/* */

function setpixelated(context){
    context['imageSmoothingEnabled'] = false;       /* standard */
    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    context['oImageSmoothingEnabled'] = false;      /* Opera */
    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    context['msImageSmoothingEnabled'] = false;     /* IE */
}

let canvas_screen = document.getElementById('myCanvas');
let canvas_off = document.createElement('canvas');
let canvas = canvas_screen; // screen seems slightly faster
console.assert(canvas);
let context = canvas.getContext('2d');
//setpixelated(context);

canvas.addEventListener('mousemove', on_mouse_move, false);
// touch move? (NO!)

canvas.addEventListener('mousedown', on_mouse_down, false);
canvas.addEventListener('touchstart', on_touch_start, {capture: false, passive: true});
    
canvas.addEventListener('mouseup', on_mouse_up, false);
canvas.addEventListener('touchend', on_touch_end, false);

