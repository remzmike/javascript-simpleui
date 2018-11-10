let round = Math.round;

var box_gradient_x1 = 40;
var box_gradient_y1 = 0;
var box_gradient_x2 = 260;
var box_gradient_y2 = 121;
var box_gradient_color_stop1 = Color(72, 157, 210, 55);
var box_gradient_color_stop2 = Color(15, 15, 76, 100);
var bg_color = Color(0, 15, 38, 255);
var panel_color1 = Color(26, 38, 64, 255);
var panel_color2 = Color(51, 77, 102, 255);

var window_active = true;

let _mouse_pos = [0 | 0, 0 | 0]; //m_simpleui.Point(0, 0);

function init_array(size, init_val) {
    let a = [];
    for (let i = 0; i < size; i++) {
        a[i] = init_val;
    }
    return a;
}

function set_size() {
    let w = window.innerWidth - app.canvas_size_hack;
    let h = window.innerHeight - app.canvas_size_hack;
    
    //w = Math.max(w, 800);
    //h = Math.max(h, 600);
    pixi_app.renderer.resize(w,h)
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
    /*console.assert(context);
    let grd = context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0.0, make_css_color(colorstop1));
    grd.addColorStop(0.5, make_css_color(colorstop2));
    return grd;*/
    return {};
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

        /*context.drawImage(
            bmfont_mana_img,
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
            {fontFamily : 'Arial', fontSize: 14, fill : int_color}
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

function DrawBox(rect, color) {
    
    const x = rect[_x];
    const y = rect[_y];
    const width = rect[_w];
    const height = rect[_h];

    const soft = m_simpleui.config.drawbox_soft_enable;

    //if (color) {
        const rgb = color[_r] << 16 | color[_g] << 8 | color[_b] << 0;
        graphics.beginFill(rgb); //, color.a/255);
        //graphics.beginFill(0xFF3300);
        //graphics.lineStyle(4, 0xffd900, 1);
    
    //}

    /*
    // test texture resampling from white pixel in font
    context.drawImage(
        bmfont_mana_img,
        2, 2, 1, 1,
        rect[_x], rect[_y], rect[_w], rect[_h],       
    );*/

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
    const disabled_for_gl_port = true;
    if (!disabled_for_gl_port && use_gradient) {
        context.translate(x, y); // for gradient
        context.fillStyle = m_simpleui.config.drawbox_gradient;
        context.fillRect(1, 1, width - 2, height - 2);
        context.translate(-x, -y); // this appears to be faster than wrapping save/restore :->
    }

}

function draw_line(x1, y1, x2, y2) {
    x1 = 0 | x1;
    y1 = 0 | y1;
    x2 = 0 | x2;
    y2 = 0 | y2;
    graphics.lineStyle(1, 0xFFFFFF, 1);
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
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

const DrawText = DrawText_PixiText;

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST; // {LINEAR: 0 (default), NEAREST: 1}

let pixi_app = new PIXI.Application({
    width: 512,
    height: 512,
    antialias: false,
    transparent: false,
    resolution: 1
});
let canvas = pixi_app.view;
document.body.appendChild(canvas);
let canvas_off = document.createElement('canvas'); // vestige

let graphics = new PIXI.Graphics();

let context = graphics;
context.fillRect = function(x,y,w,h) {
    //graphics.beginFill(0xFF3300);
    graphics.lineStyle(0, 0xffffff, 1);
    context.drawRect(x,y,w,h);
}
context.save = function() {};
context.restore = function() {};
context.clip = function() {};
context.rect = function() {};
context.translate = function() {};
context.stroke = function() {};
context.beginPath = function() {};

//pixi_app.stage.addChild(graphics);

let font_sprite;

function on_pixi_ready() {
    font_sprite = new PIXI.Sprite(
        PIXI.loader.resources['upfmana16_0.png'].texture
    );
}

canvas.addEventListener('mousemove', on_mouse_move, false);
// touch move? (NO!)

canvas.addEventListener('mousedown', on_mouse_down, false);
canvas.addEventListener('touchstart', on_touch_start, {capture: false, passive: true});
    
canvas.addEventListener('mouseup', on_mouse_up, false);
canvas.addEventListener('touchend', on_touch_end, false);

/*
let renderer = PIXI.autoDetectRenderer(800, 600, { antialias: false, backgroundColor: 0x1099bb });
if (renderer instanceof PIXI.CanvasRenderer) {
    console.warning('[PIXI is rendering to canvas]');
}*/
//document.body.appendChild(renderer.view);

//let stage = new PIXI.Container();

/*var stage = new PIXI.Stage(0xFFFFFF, true);
stage.setInteractive(false);

var sprite = PIXI.Sprite.fromImage("upfmana16_0.png");
//stage.addChild(sprite);
// create a renderer instance
//var renderer = new PIXI.CanvasRenderer(800, 600);//PIXI.autoDetectRenderer(800, 600);
var renderer = PIXI.autoDetectRenderer(620, 380);

// set the canvas width and height to fill the screen
//renderer.view.style.width = window.innerWidth + "px";
//renderer.view.style.height = window.innerHeight + "px";
renderer.view.style.display = "block";
    
// add render view to DOM
document.body.appendChild(renderer.view);
*/

// -------------------------------------------------------- //


