import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';
import { do_panel_begin, do_panel_end } from './simpleui_ex_panel.js';

const _r = consts._r;
const _g = consts._g;
const _b = consts._b;
const _a = consts._a;
const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

const ColorP = ui.ColorP;
const PointP = ui.PointP;
const RectangleP = ui.RectangleP;

function sum(a) {
    let result = 0|0;
    for (let i = 0; i < a.length; i++) {
        let v = a[i];
        result = result + v;
    }
    return result;
}
console.assert(sum([1, 2, 3]) == 6);

const _sincos_none = 0;
const _sincos_sin = 1;
const _sincos_cos = 2;

let _plasma_image; 
let _plasma_data;
let _plasma_time = 0;
let _plasma_step = 0;

let _plasma_r_div = 59;
let _plasma_g_div = 59;
let _plasma_b_div = 64;
let _plasma_r_sincos = _sincos_sin;
let _plasma_g_sincos = _sincos_cos;
let _plasma_b_sincos = _sincos_sin;
let _plasma_r_invert = true;
let _plasma_g_invert = false;
let _plasma_b_invert = true;

let _plasma_zoom;
let _plasma_zoom_slider;
let _plasma_mult;
let _plasma_mult_slider;
let _plasma_step_interval = 4;

set_plasma_zoom(213);
set_plasma_mult(120);

let _plasma_palette;

function plasma_init()
{
    let r, g, b;
    let r_enabled = true;
    let g_enabled = true;
    let b_enabled = true;

    _plasma_palette = [];

    let r_sincos;
    if (_plasma_r_sincos == _sincos_sin) {
        r_sincos = Math.sin;
    } else if (_plasma_r_sincos == _sincos_cos) {
        r_sincos = Math.cos;
    } else {
        r_enabled = false;
    }

    let g_sincos;
    if (_plasma_g_sincos == _sincos_sin) {
        g_sincos = Math.sin;
    } else if (_plasma_g_sincos == _sincos_cos) {
        g_sincos = Math.cos;
    } else {
        g_enabled = false;
    }

    let b_sincos;
    if (_plasma_b_sincos == _sincos_sin) {
        b_sincos = Math.sin;
    } else if (_plasma_b_sincos == _sincos_cos) {
        b_sincos = Math.cos;
    } else {
        b_enabled = false;
    }

    for (let i = 0; i < 256; i++)
    {
        // original: eg. r = sin2byte( Math.cos(Math.PI * i / 128) );        
        if (r_enabled) {            
            r = sin2byte( r_sincos(Math.PI * i / _plasma_r_div) );
            if (_plasma_r_invert) {
                r = 255 - r;
            }
        } else {
            r = 0;
        }

        if (g_enabled) {
            g = 255 - sin2byte( g_sincos(Math.PI * i / _plasma_g_div) );
            if (_plasma_g_invert) {
                g = 255 - g;
            }
        } else {
            g = 0;
        }

        if (b_enabled) {
            b = 255 - sin2byte( b_sincos(Math.PI * i / _plasma_b_div) );
            if (_plasma_b_invert) {
                b = 255 - b;
            }
        } else {
            b = 0;
        }

        _plasma_palette.push([r, g, b]);
    }		
}

plasma_init();

function sin2byte(v)
{
    return Math.trunc((v + 1) * 255 / 2);
}

function distance(x1, y1, x2, y2)
{
    var dx = x2 - x1;
    var dy = y2 - y1;
    var c = dx * dx + dy * dy;
    return Math.sqrt(c);
}

// slider values normalized to 0-1000, and represent a percent along the range of possible values
function set_plasma_zoom(value) {
    _plasma_zoom_slider = value;
    const percent = _plasma_zoom_slider / 1000;
    _plasma_zoom = 1 + 99 * percent; // [1.0 - 100.0]
}
function set_plasma_mult(value) {
    _plasma_mult_slider = value;
    const percent = _plasma_mult_slider / 1000;
    _plasma_mult = percent * 2; // [0.0 - 2.0]
}

function get_color(x, y, t)
{
    const v1 = Math.sin(x * _plasma_mult / _plasma_zoom + t);
    const v2 = Math.sin( distance(x, y, 128, 128) / _plasma_zoom);
    const v = sin2byte( (v1 + v2) / 2 );
    return _plasma_palette[v];
}	

function do_app_plasma() {
    let expanded = !ui.driver.IsTouchDevice();

    const row_x0 = 222;
    const row_y0 = 47;
    do_plasma_panel('plasma panel', row_x0, row_y0, true, expanded);
}

function do_plasma_panel(uiid, first_x, first_y, first_visible, first_expanded) {
    let _;
    const dim_x = 512;
    const dim_y = 512 + 20 + 4 + 2 + 1 + 1;

    if (_plasma_image == null) {
        _plasma_image = ui.context.createImageData(dim_x, dim_y);
        _plasma_data = _plasma_image.data;
    }

    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);

    if (panel.expanded) {                
        const horizontal = ui.layout_push(_horizontal);

        _plasma_step++;

        if (_plasma_step % _plasma_step_interval == 0) { // perf: update every x-th frame
            _plasma_time = _plasma_time % 0x7fffffff;
            _plasma_time++;    
            let color;
            for (let x = 0; x < dim_x; x++) {
                for (let y = 0; y < dim_y; y++) {
                    color = get_color(x, y, _plasma_time / 60);
                    const i = 0 | x * 4 + y * dim_x * 4;
                    _plasma_data[i + 0] = 0 | color[0]; //x;
                    _plasma_data[i + 1] = 0 | color[1]; //y;
                    _plasma_data[i + 2] = 0 | color[2]; //-y;
                    _plasma_data[i + 3] = 0 | 255;                
                }
            }
        }

        ui.context.putImageData(_plasma_image, horizontal.x, horizontal.y);
        ui.layout_increment2(dim_x + 20, dim_y);

        const vertical = ui.layout_push(_vertical);

        // todo: inset on a darker padded rect?

        ui.layout_push(_horizontal);
        {
            ui.label('zoom: ' + _plasma_zoom_slider, Rectangle(0, 0, 100, 20));
            _ = ui.slider(uiid + '-zoom-slider', Rectangle(0, 0, 200, 20), 0, 1000, _plasma_zoom_slider, '');
            if (_.changed) {
                set_plasma_zoom(_.value);
            }            
        }
        ui.layout_pop();

        ui.layout_push(_horizontal)
        {
            ui.label('mult: ' + _plasma_mult_slider, Rectangle(0, 0, 100, 20));
            _ = ui.slider(uiid + '-mult-slider', Rectangle(0, 0, 200, 20), 0, 1000, _plasma_mult_slider, '');
            if (_.changed) {
                set_plasma_mult(_.value);
            }                        
        }
        ui.layout_pop();

        ui.layout_increment2(0, 4);

        _ = do_slider2d(uiid + '-slider2d', RectangleP(0, 0, 300, 200), 0, 1000, PointP(_plasma_zoom_slider, _plasma_mult_slider));
        if (_.changed) {           
            set_plasma_zoom(_.x1);
            set_plasma_mult(_.y1);
        }

        ui.layout_increment2(0, 4);
        
        ui.layout_push(_horizontal);
        {
            ui.label('r invert', RectangleP(0,0,100,20));
            _ = ui.checkbox(uiid + '-checkbox-r-invert', RectangleP(0,0,20,20), _plasma_r_invert);
            if (_.changed) {
                _plasma_r_invert = _.value;
                plasma_init();        
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            ui.label('g invert', RectangleP(0,0,100,20));
            _ = ui.checkbox(uiid + '-checkbox-g-invert', RectangleP(0,0,20,20), _plasma_g_invert);
            if (_.changed) {
                _plasma_g_invert = _.value;
                plasma_init();
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            ui.label('b invert', RectangleP(0,0,100,20));
            _ = ui.checkbox(uiid + '-checkbox-b-invert', RectangleP(0,0,20,20), _plasma_b_invert);
            if (_.changed) {
                _plasma_b_invert = _.value;
                plasma_init();
            }
        }
        ui.layout_pop();
        
        ui.layout_push(_horizontal);
        {
            ui.label('r div', RectangleP(0,0,100,20));
            _ = ui.slider(uiid + '-slider-r-div', RectangleP(0,0,200,20), 2, 360, _plasma_r_div, '');
            if (_.changed) {
                _plasma_r_div = _.value;
                plasma_init();
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            ui.label('g div', RectangleP(0,0,100,20));
            _ = ui.slider(uiid + '-slider-g-div', RectangleP(0,0,200,20), 2, 360, _plasma_g_div, '');
            if (_.changed) {
                _plasma_g_div = _.value;
                plasma_init();
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            ui.label('b div', RectangleP(0,0,100,20));
            _ = ui.slider(uiid + '-slider-b-div', RectangleP(0,0,200,20), 2, 360, _plasma_b_div, '');
            if (_.changed) {
                _plasma_b_div = _.value;
                plasma_init();
            }
        }
        ui.layout_pop();

        ui.layout_increment2(0, 4);
        _ = ui.button(uiid + '-button-randomize', 'randomize', Rectangle(0,0,300,40));
        if (_.clicked) {            
            // zoom: 0-1000
            const random_zoom = Math.trunc( Math.random() * 1000 );
            set_plasma_zoom(random_zoom);
            // mult: 0-1000
            const random_mult = Math.trunc( Math.random() * 1000 );
            set_plasma_mult(random_mult);
            // step interval: 1-8 (not gonna randomize this)            
            // rgb sincos: 0-2
            //_plasma_r_sincos = randomInt(0,2);
            //_plasma_g_sincos = randomInt(0,2);
            //_plasma_b_sincos = randomInt(0,2);
            // rgb invert: 0-1
            _plasma_r_invert = Math.random() < 0.5 ? true : false;
            _plasma_g_invert = Math.random() < 0.5 ? true : false;
            _plasma_b_invert = Math.random() < 0.5 ? true : false;
            // rgb div: 2-360
            _plasma_r_div = randomInt(2,360);
            _plasma_g_div = randomInt(2,360);
            _plasma_b_div = randomInt(2,360);
            plasma_init();
        }

        // ---

        ui.layout_increment2(0, 4);
        ui.hline(300, 1, uidraw.normal_face);
        ui.layout_increment2(0, 4);

        ui.layout_push(_horizontal)
        {
            ui.label('step interval', RectangleP(0,0,100,20));
            _ = ui.slider(uiid + '-step-slider', Rectangle(0, 0, 200, 20), 1, 8, _plasma_step_interval, '');
            if (_.changed) {
                _plasma_step_interval = _.value;
            }            
        }
        ui.layout_pop();
        
        _ = do_slider_sincos(uiid + '-slider-sincos-r', 'r', _plasma_r_sincos);
        if (_.changed) {
            _plasma_r_sincos = _.value;
            console.log('_plasma_r_sincos', _.value);
            plasma_init();
        }

        _ = do_slider_sincos(uiid + '-slider-sincos-g', 'g', _plasma_g_sincos);
        if (_.changed) {
            _plasma_g_sincos = _.value;   
            console.log('_plasma_g_sincos', _.value);
            plasma_init();
        }

        _ = do_slider_sincos(uiid + '-slider-sincos-b', 'b', _plasma_b_sincos);
        if (_.changed) {
            _plasma_b_sincos = _.value;
            console.log('_plasma_b_sincos', _.value);
            plasma_init();
        }

        ui.layout_pop(); // vertical

        ui.layout_pop(); // horizontal
    
    } // panel.expanded

    do_panel_end(uiid);
    return panel;
}    

function do_slider_sincos(uiid, key, value) {
    let _;

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            changed: 0 | false,
            value: 0 | value
        });
    }

    ui.layout_push(_horizontal)
    {
        ui.label(key + ' sin/cos', RectangleP(0,0,100,20));
        _ = ui.slider(uiid + '-slider', Rectangle(0, 0, 200, 20), 0, 2, value, '');
        if (_.changed) {
            state.changed = true;
            state.value = _.value;
        }            
    }
    ui.layout_pop();

    return state;
} // do_slider_sincos

function randomInt(a, b) {
    const delta = b - a;
    const rand = Math.floor(Math.random() * delta);
    return a + rand;
}

export {
    do_app_plasma
};