var renderer = PIXI.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
document.body.appendChild(renderer.view);
var stage = new PIXI.Container();

//

var round = Math.round;
var assert = console.assert;
var log = (function() {}); //console.log;

var box_gradient_x1 = 112; //40;
var box_gradient_y1 = -100; //0;
var box_gradient_x2 = 260; //200;
var box_gradient_y2 = 121; //240;
var box_gradient_color_stop1 = Color(0,0,1,0); //Color(0, 0.1, 0.2, 0.2);
var box_gradient_color_stop2 = Color(0, 204/255, 1, 0.21666666666666667); //Color(0, 0.8, 1, 0.5);
var bg_color = Color(0.15-0.15, 0.2-0.15, 0.3-0.15);
var panel_color1 = Color(0.1,0.15,0.25,1);
var panel_color2 = Color(.2,.3,.4);

var window_active = true;

_mouse_pos = {x:0, y:0};

function len(a) {
    return a.length;
}

function sum(a) {
    var result = 0;
    for (var i=0; i < len(a); i++) {
        var v = a[i];
        result += v;
    }
    return result;
}
assert(sum([1,2,3])==6);

function init_array(size, init_val) {
    var a = [];
    for (var i=0; i < size; i++) {
        a[i] = init_val;
    }
    return a;
}

var util = {}
function util_now() {
    if (performance && performance.now) {
        return performance.now();
    } else {
        return Date.now();
    }
}
util.now = util_now;
function str(s) { return s + ''; }

function longstring() { // es3 multiline string technique
    var args = Array.prototype.slice.call(arguments);
    return args.join('\n');
}

function set_size() {
    canvas.width = window.innerWidth-app.canvas_size_hack;
    canvas.height = window.innerHeight-app.canvas_size_hack;

    canvas.width = Math.max(canvas.width, 800);
    canvas.height = Math.max(canvas.height, 600);
    // later: always stay the max size we see... (maybe)
    
    canvas_screen.width = canvas.width;
    canvas_screen.height = canvas.height;
}

function randomize_color(color) {
    var a = ['r','g','b','a'];
    for (var i=0; i < len(a); i++) {
        var k = a[i];
        var v;
        if (k=='a') {
            v = 0.5 + Math.random()/2;
        } else {
            v = 55 + Math.round(Math.random()*200);
        }
        color[k] = v;
    }
}

function on_mouse_move(evt) {
    var rect = canvas.getBoundingClientRect();
    _mouse_pos.x = evt.clientX - rect.left;
    _mouse_pos.y = evt.clientY - rect.top;
}

function on_mouse_down(evt) {
    //log(evt);
    var x = evt.clientX;
    var y = evt.clientY;
    var button = evt.button;
    // Left button=0, middle button=1 (if present), right button=2
    if (button==0) button = 'l';
    if (button==1) button = 'm';
    if (button==2) button = 'r';
    ui.on_mousepressed(x, y, button);
}

function on_mouse_up(evt) {
    var x = evt.clientX;
    var y = evt.clientY;
    var button = evt.button;
    if (button==0) button = 'l';
    if (button==1) button = 'm';
    if (button==2) button = 'r';
    ui.on_mousereleased(x, y, button);
}

// meh
function on_touch_start(evt) {
    var x = evt.clientX;
    var y = evt.clientY;
    ui.on_mousepressed(x, y, 'l');
}

function on_touch_end(evt) {
    var x = evt.clientX;
    var y = evt.clientX;
    ui.on_mousereleased(x, y, 'l');
}

function make_css_color(color) {
    var css;

    var use_alpha = true;

    if (document.body.ui) { // todo nolive hax : temporal include dilemma
        // window.ui also works
        use_alpha = ui.config.drawbox_gradient_enable;
    }

    if (use_alpha) {
        css = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b  + ', ' + color.a + ')';
    } else {
        css = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b  + ', ' + 1 + ')'; // lol, javascript
    }
    
    return css;
}

function make_drawbox_gradient(context, x1, y1, x2, y2, colorstop1, colorstop2) {
    assert(context);
    var grd=context.createLinearGradient(x1, y1, x2, y2);
    grd.addColorStop(0.0,make_css_color(colorstop1));
    grd.addColorStop(0.5,make_css_color(colorstop2));
    return grd;
}

/* -------------------------------------------------------------------------- */

var canvas_screen = document.getElementById('myCanvas');
var canvas_off = document.createElement('canvas');
var canvas = canvas_screen; // screen seems slightly faster
assert(canvas);
var context = canvas.getContext('2d');

canvas.addEventListener('mousemove', on_mouse_move, false);
// touch move?
canvas.addEventListener('mousedown', on_mouse_down, false);
//canvas.addEventListener('touchdown', on_touch_down, false);
canvas.addEventListener('mouseup', on_mouse_up, false);
canvas.addEventListener('touchend', on_touch_end, false);


/* */

var GetCursorX;
var GetCursorY;

function GetCursorX() {
    return _mouse_pos.x;
}

function GetCursorY() {
    return _mouse_pos.y;
}

function GetFontSize() {
    return 14;
}

var fonts = [
    {name:'sans-serif', size:14, line_size:14},
    {name:'VJ Nina', size:14, line_size:14},
    {name:'UPF Mana-16', size:8, line_size:14},
    {name:'UPF Elementar Basica 13.11.4 a', size:8, line_size:14}
];
function DrawText_Stroke(text, x, y, color) {
    //context.beginPath();
    var fontsize = GetFontSize();
    var font = fonts[2];
    context.font = font.size + "px '"+font.name+"'";
    if (color == null) {
        color = Color(1,1,1,1);
    }
    context.fillStyle = make_css_color(color);
    var yoffset = fontsize-2;
    context.fillText(text, x, y+yoffset);
    //context.closePath();
}

function DrawText_Bitmap(text, x, y, color) {
    for(var i=0; i<text.length; i++) {
        var idx = text.charCodeAt(i);
        var def = bmfont_mana.chars[idx-31];

        context.drawImage(
            bmfont_mana_img,
            def.x, def.y, def.width, def.height,
            x + def.xoffset, y + def.yoffset, def.width, def.height
        );
        x += def.xadvance;
    }
}

// new idea, cache bitmaps instead of worrying about batching
var _drawtext_cache = {};
function DrawText_Cached(text, x, y, color) {

    // draw normal if it's a number?
    //return DrawText_Original(text, x, y, color);
    //return;
    
    var key = text;
    if (!(key in _drawtext_cache)) {

        var prev_context = context;
        var prev_canvas = canvas;

        var cv = document.createElement('canvas');
        
        var ctx = cv.getContext('2d');
        cv.width = text.length*10;
        cv.height = 20;
        //document.body.appendChild(cv);
        var o = {'canvas':cv, 'context':ctx};                

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
    if (ui.config.drawtext_bitmap) {
        DrawText_Bitmap(text, x, y, color);
    } else {
        DrawText_Stroke(text, x, y, color);
    }
}
var DrawText = DrawText_Cached; // cached works now, and does increase performance.

var _drawbox_cache = {};
// a box cache that uses a single canvas might be possible...
//var _drawbox_cache_canvas;
function DrawBox_Cached(x, y, width, height, color) {
    
    // original is 2, cached is 6-7, lets find out which rects are causing this?
    var use_original = false;
    //use_original = use_original || width<40; // 6-7 becomes 5-6...
    use_original = use_original || width>0; // 6-7 becomes... 2-3...
    // so big ones are a problem apparently...
    // apparently drawing boxes is already fast...
    // i wonder if making them their own dom elements helps anything..
    // can make simpleui without canvas...?
    
    if (use_original) {
        return DrawBox_Original(x, y, width, height, color);
    }
    
    var key = [
        width, height,
        round(color.r*100), 
        round(color.g*100),
        round(color.b*100),
        round(color.a*100)
    ].join(',');
    if (!(key in _drawbox_cache)) {
        
        var prev_context = context;
        var prev_canvas = canvas;

        var cv = document.createElement('canvas');
        
        var ctx = cv.getContext('2d');
        cv.width = width;
        cv.height = height;
        var o = {'canvas':cv, 'context':ctx};

        // draw into custom
        canvas = o.canvas;
        context = o.context;
        {       
            DrawBox_Original(0, 0, width, height, color);
        }
        context = prev_context;
        canvas = prev_canvas;        
        
        _drawbox_cache[key] = o;
    }
    
    // now just draw the cached canvas onto screen canvas
    context.drawImage(_drawbox_cache[key].canvas, x, y); // this seems to be more of a bottleneck than just drawing boxes themselves
   
}

function DrawBox_Original(x, y, width, height, color) {

    // what if, we dont pass color... we pass something else, like an id or a key.. maybe 'purpose' or 'intent' lol (of the box)
    var soft = m_simpleui.config.drawbox_soft_enable;

    if (color) {
        context.fillStyle = make_css_color(color);
    }

    if (soft) {
        var z = 1;
        var z2 = z*2;
        var lines = 1; // adjustor
        context.fillRect(x, y+lines, width, height-(lines*2)); // mid

        for (var i=1; i<=lines; i++) {
            context.fillRect(x+i, y+(lines-i), width-(i*2), 1); //top
            context.fillRect(x+i, y+height-1-(lines-i), width-(i*2), 1); //bot
        }

    } else {
        context.fillRect(x, y, width, height);
    }

    var use_gradient = m_simpleui.config.drawbox_gradient_enable;

    if (use_gradient) {
        var is_size_excluded = width>200 || height>200; // || (width<20 && height<20);
        if (is_size_excluded) {
            use_gradient = false;
        }
    }
    if (use_gradient) {
        //context.translate(x, y); // for gradient
        context.fillStyle = m_simpleui.config.drawbox_gradient;
        context.fillRect(1, 1, width-2, height-2);
        //context.translate(-x, -y); // this appears to be faster than wrapping save/restore :->
    }

}

var DrawBox = DrawBox_Original;

function Color(r, g, b, a) {
    if (a == null) {
        a = 1;
    }
    return {r:round(r*255), g:round(g*255), b:round(b*255), a:a};
}