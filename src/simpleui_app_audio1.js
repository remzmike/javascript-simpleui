// todo:
// text uppercase measurement is using lowercase?
// text color
// garbage collection trim
// song support, tracks, copy patterns, associate instruments

import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

const Color = ui.Color;
const ColorP = ui.ColorP;
const Point = ui.Point;
const PointP = ui.PointP;
const Rectangle = ui.Rectangle;
const RectangleP = ui.RectangleP;
const make_css_color = ui.make_css_color;

const _tone_panel = {
    context: null,
    tone_point: Point(200, 200),
    freq_range: 1200,
    osc1: null,
    osc1_started: 0 | false,
    osc1_type_index: 0,
    osc_types: ['sine', 'square', 'sawtooth', 'triangle'],
    volume: 0 | 5, // [0-100]
    gain1: null,
    analyser1: null,
    analyser1_times: null,
    analyser1_freqs: null,
    throttle: 50,
    conv1: null,
    source1: null,
    sound_playing: 0 | false,
    play_file_requested: 0 | false,
    play_file_request_time: null,
    play_pending: 0 | false,
    play_buffer: null
};

function load_and_play(url) {
    if (_tone_panel.play_file_requested) {
        //return;            
    } else {
        _tone_panel.play_file_requested = 0 | true;
        _tone_panel.play_file_request_time = Date.now();

        window.fetch(url)
            .then(response => response.arrayBuffer())
            .then(array_buffer => _tone_panel.context.decodeAudioData(array_buffer))
            .then(audio_buffer => {
                _tone_panel.play_pending = 0 | true;
                _tone_panel.play_buffer = audio_buffer;
            });
        //return;
    }
}

function play() {

    if (!_tone_panel.play_buffer) {

        load_and_play('Yodel_Sound_Effect.mp3');

    } else {

        console.assert(_tone_panel.play_buffer);

        // a source object can only be .start()'ed once
        // so you have to make one every time you want to play a sound
        _tone_panel.source1 = _tone_panel.context.createBufferSource();
        _tone_panel.source1.buffer = _tone_panel.play_buffer;

        _tone_panel.play_pending = 0 | false;

        _tone_panel.gain1.gain.value = get_tone_volume();

        _tone_panel.source1.connect(_tone_panel.analyser1);
        _tone_panel.analyser1.connect(_tone_panel.gain1);
        _tone_panel.gain1.connect(_tone_panel.context.destination);

        _tone_panel.source1.start(); // cannot call this more than once per source object, yadoink

        _tone_panel.sound_playing = 0 | true;
    }
}

function get_tone_volume() {
    const volume2 = _tone_panel.tone_point.y / _tone_panel.freq_range;
    const final_volume = (_tone_panel.volume / 100) * volume2;
    return final_volume;
}

function set_tempo_index(value) {
    _trix_panel.tempo_index = value;
    _trix_panel.wait = _trix_panel.tempo[_trix_panel.tempo_index];
}

function start_tone() {
    //console.log('[start_tone]');
    const frequency = _tone_panel.tone_point.x;
    const osc1_type = _tone_panel.osc_types[_tone_panel.osc1_type_index];

    // i guess i need this for now?
    if (_tone_panel.osc1_started) {
        _tone_panel.osc1.stop();
        _tone_panel.osc1_started = 0 | false;
    }

    _tone_panel.osc1 = _tone_panel.context.createOscillator();

    _tone_panel.osc1.type = osc1_type;
    _tone_panel.osc1.frequency.value = frequency;

    _tone_panel.gain1.gain.value = get_tone_volume();

    // hmph, connecting things correctly matters xd
    _tone_panel.osc1.connect(_tone_panel.analyser1);
    _tone_panel.analyser1.connect(_tone_panel.gain1);
    _tone_panel.gain1.connect(_tone_panel.context.destination);

    _tone_panel.osc1.start(0);
    _tone_panel.osc1_started = 0 | true;
}

function stop_tone() {
    if (_tone_panel.osc1_started) {
        _tone_panel.osc1.stop(0);
    }
    _tone_panel.osc1_started = 0 | false;
}

let start_tone_limited = ui.throttle(start_tone, _tone_panel.throttle);

function reset_tone() {
    start_tone_limited = ui.throttle(start_tone, _tone_panel.throttle);

    if (_tone_panel.osc1_started) {
        stop_tone();
        start_tone_limited();
    }
}

function sample_tone_analyser() {
    _tone_panel.analyser1.getByteFrequencyData(_tone_panel.analyser1_freqs);
    _tone_panel.analyser1.getByteTimeDomainData(_tone_panel.analyser1_times);
}

function sample_trix_analyser() {
    _trix_panel.analyser.getByteFrequencyData(_trix_panel.analyser_freqs);    
    _trix_panel.analyser.getByteTimeDomainData(_trix_panel.analyser_times);
}

function do_analyser_graph(uiid, local_rect, data1, data2, color1, color2) {
    color1 = color1 || uidraw.normal_face;
    color2 = color2 || uidraw.accent;
    const rect = ui.layout_translated(local_rect);
    const x = rect.x;
    const y = rect.y;
    const w = rect.w;
    const h = rect.h;

    if (data1.length == 0 || data2.length == 0) {
        ui.layout_increment2(w, h);
        return;
    }

    uidraw.push_linewidth(1);
    uidraw.begin_path();
    uidraw.push_strokestyle(make_css_color(color1));
    let irange = data1.length;
    let vrange = 255;
    for (let i = 0; i < irange; i++) {
        const v = 0 | data1[i];
        const xpos = 0 | (i / irange) * w;
        const ypos = 0 | (v / vrange) * h;
        uidraw.move_to(0 | x + xpos, 0 | y + h);
        uidraw.line_to(0 | x + xpos, 0 | y + h - ypos);
    }
    uidraw.pop_strokestyle();
    uidraw.stroke();
    uidraw.pop_linewidth();

    uidraw.push_linewidth(2);
    uidraw.begin_path();
    uidraw.push_strokestyle(make_css_color(color2));
    irange = data2.length;
    vrange = 255; // later: just get data as floats and can remove this
    const ypos_start = (data2[0] / vrange) * h;
    uidraw.move_to(x, y + ypos_start);
    for (let i = 1; i < irange; i++) {
        const v = 0 | data2[i];
        const xpos = 0 | (i / irange) * w;
        const ypos = 0 | (v / vrange) * h;
        uidraw.line_to(x + xpos + 2, y + ypos);
    }
    uidraw.pop_strokestyle();
    uidraw.stroke();
    uidraw.pop_linewidth();

    ui.layout_increment2(w, h);
}

function do_tone_panel(uiid, first_x, first_y, first_visible, first_expanded) {
    let _;
    let _changed = 0 | false;
    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);
    if (panel.visible && panel.expanded) {

        ui.layout_push(_horizontal);
        {
            _ = ui.slider(uiid + '-slider-volume', Rectangle(0, 0, 200, 20), 0, 100, _tone_panel.volume, '');
            ui.label('volume', Rectangle(0, 0, 200, 20));
            if (_.changed) {
                _tone_panel.volume = _.value;
                reset_tone();
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            _ = ui.slider(uiid + '-slider-throttle', Rectangle(0, 0, 200, 20), 0, 1000, _tone_panel.throttle, '');
            ui.label('throttle', Rectangle(0, 0, 200, 20));
            if (_.changed) {
                _tone_panel.throttle = _.value;
                reset_tone();
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal, -1);
        {
            ui.group_buttons_begin();
            for (let i = 0; i < _tone_panel.osc_types.length; i++) {
                const iter_type = _tone_panel.osc_types[i];
                const osc1_type = _tone_panel.osc_types[_tone_panel.osc1_type_index];
                const is_checked = iter_type == osc1_type;
                _ = ui.checkbutton(uiid + '-osc_type_button-' + iter_type, iter_type, Rectangle(0, 0, 80, 24), is_checked);
                if (_.changed && _.value) {
                    _tone_panel.osc1_type_index = i;
                    // dont relay change for osc1 type change unless currently playing
                    _changed = 0 | _tone_panel.osc1_started;
                }
            }
            ui.group_buttons_end();
        }
        ui.layout_pop();

        _ = do_slider2d(uiid + '-slider2d', Rectangle(0, 0, 400, 400), 0, _tone_panel.freq_range, _tone_panel.tone_point);
        if (_.changed) {

            // these two lines are bad, slider2d should return what i need instead
            // _[_]
            const bg_uiid = uiid + '-slider2d-bg';
            const item_went_down = ui.state.item_went_down == bg_uiid;

            if (item_went_down || (_tone_panel.tone_point.x != _.x1 || _tone_panel.tone_point.y != _.y1)) {
                _tone_panel.tone_point.x = _.x1;
                _tone_panel.tone_point.y = _.y1;
                _changed = 0 | true;
            }
        }

        if (_changed) {
            start_tone_limited();
        }

        if (_tone_panel.analyser1 && _tone_panel.osc1_started || _tone_panel.sound_playing) {

            sample_tone_analyser();

            const peek = ui.layout_peek();
            ui.layout_push(_none, null, peek.x, peek.y - peek.padding * 2 - 100);
            do_analyser_graph(uiid - '-graph', Rectangle(2, 0, 400 - 4, 100), _tone_panel.analyser1_freqs, _tone_panel.analyser1_times, uidraw.normal_back, uidraw.accent);
            ui.layout_pop();
        }

        // show this when (requested) -and- (no buffer -or- buffer was fetched in less than 1 second)
        if (_tone_panel.play_file_requested && (!_tone_panel.play_buffer || (Date.now() - _tone_panel.play_file_request_time) < 1000)) {
            ui.label('audio file requested...', Rectangle(0, 0, 200, 24));
        } else {
            _ = ui.button(uiid + '-button-yodel', 'play yodel mp3', Rectangle(0, 0, 200, 24));
            if (_tone_panel.play_pending || _.clicked) {
                //play(_tone_panel.source1);
                play();
            }
        }

        if (ui.state.mouse_went_up) {
            start_tone_limited.cancel();
            stop_tone();
        }

    }
    do_panel_end(uiid);
}

function do_message_panel(uiid, first_x, first_y, first_visible, first_expanded, message) {
    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);
    if (panel.visible && panel.expanded) {
        ui.label(message, Rectangle(0, 0, 200, 20));
    }
    do_panel_end(uiid);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const freq = [
    1.6818,     // a5   1
    1.5874,     // gs5  2
    1.49831,    // g5   3
    1.4142,     // fs5  4
    1.3348,     // f5   5
    1.2599,     // e5   6
    1.1892,     // ds5  7
    1.1225,     // d5   8 
    1.0595,     // cs5  9
    1.0,        // c5   10 
    0.9439,     // b4   11
    0.8909,     // as4  12
    0.8409,     // a4   13
    0.79370,    // gs4  14
    0.7492,     // g4   15
    0.7071,     // fs4  16
    0.6674,     // f4   17
    0.62996,    // e4   18
    0.5946,     // ds4  19
    0.5611,     // d4   20
    0.5297,     // cs4  21
    0.5,        // c4   22
    0.47194,    // b3   23
    0.44545,    // as3  24
    0.42045,    // a3   25
    0.39685,    // gs3  26
    0.37458,    // g3   27
    0.35355,    // fs3  28
    0.3337,     // f3   29
    0.31498,    // e3   30
    0.2973,     // ds3  31
    0.2806,     // d3   32
    0.26487,    // cs3  33
    0.25,       // c3   34
    0.23597,    // b2   35
    0.2272,     // as2  36
    0.21022,    // a2   37
    0.19843,    // gs2  38
    0.18729,    // g2   39
    0.17678,    // fs2  40
    0.16685,    // f2   41
    0.15749,    // e2   42
    0.14865,    // ds2  43
    0.1403,     // d2   44
    0.13243,    // cs2  45
    0.125       // c2   46
]

const scales = [];
// D pentatonic major
// scale[1] = {"a5","fs5","e5","d5","b4","a4","fs4","e4","d4","b3","a3","fs3","e3","d3","b2","a2"}
scales[0] = [1, 4, 6, 8, 11, 13, 16, 18, 20, 23, 25, 28, 30, 32, 35, 37];
// D pentatonic minor
// scale[2] = {"d5","c5","a4","g4","f4","d4","c4","a3","g3","f3","d3","c3","a2","g2","f2","d2"}
scales[1] = [8, 10, 13, 15, 17, 20, 22, 25, 27, 29, 32, 34, 37, 39, 41, 44];
// C major
// scale[3] = {8"c5","b4","a4","g4","f4","e4","d4","c4","b3","a3","g3","f3","e3","d3","c3","b2"}
scales[2] = [10, 11, 13, 15, 17, 18, 20, 22, 23, 25, 27, 29, 30, 32, 34, 35];
// D blues minor
// scale[4] = {"d5","c5","a4","g4","e4","ds4","d4","c4","a3","g3","e3","ds3","d3","c3","a2","g2"}
scales[3] = [8, 10, 13, 15, 18, 19, 20, 22, 25, 27, 30, 31, 32, 34, 37, 39];
// chromatic
// scale[5] = {"gs4","g4","fs4","f4","e4","ds4","d4","cs4","c4","b3","as3","a3","gs3","g3","fs3","f3"}
scales[4] = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];

// this pattern is called "can you guys soul slide"
const _trix_panel = {
    initialized: 0 | false,
    volume: 0 | 15, // [0-100]
    context: null,
    compressor: null,
    gain: null,
    analyser: null,
    analyser_times: null,
    analyser_freqs: null,
    play_node: null, // this will point to wherever the end of our audio graph begins (the node samples will play on)
    play: 0 | false,    
    //
    biquad_types: ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'],
    shaper_oversample_types: ['none', '2x', '4x'],
    // empty (use presets instead)
    piano_grid: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    bass_grid: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    misc_grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    //
    instrument_names: ['piano', 'bass'],
    selected_instrument_index: 0,    
    piano: {
        dest: null,
        volume: 0 | 50, // [0-100],
        detune: 0,
        gain: null,
        convolver: null,
        convolver_enabled: 0 | true,
        biquad: null,
        biquad_type_index: 0,
        biquad_enabled: 0 | true,
        shaper: null,
        shaper_oversample_index: 2,
        shaper_enabled: 0 | false,
        panner: null,
    },
    //
    bass: {
        dest: null,
        volume: 0 | 80, // [0-100],
        detune: 0,
        gain: null,
        convolver: null,
        convolver_enabled: 0 | false,
        biquad: null,
        biquad_type_index: 0,
        biquad_enabled: 0 | false,
        shaper: null,
        shaper_oversample_index: 0,
        shaper_enabled: 0 | false,
        panner: null,
    },
    //    
    misc_dest: null,
    misc_volume: 0 | 80, // [0-100]
    misc_gain: null,
    //
    time: 0,
    wait: 0,
    play_x: 0,
    schedule_x: 0,
    play_x_long: 0 | 0,
    tempo: [],
    tempo_index: 8,
    scale_index: 0,
    grid_edit_tools: ['+', '-'],
    grid_edit_tool: 0,
    schedule_notes_ahead: 3, // how many notes to schedule ahead-of-time while playing (to ensure precise note timing)
}

const MIN_TEMPO = 0.5;
const MAX_TEMPO = 0.04;

for (let i = 0; i < 16; i++) {
    _trix_panel.tempo[i] = MIN_TEMPO - i * ((MIN_TEMPO - MAX_TEMPO) / 16);
}
set_tempo_index(_trix_panel.tempo_index);

/*
> dbfs_to_gain(100)
100000
> dbfs_to_gain(0)
1
> dbfs_to_gain(0)
1
> dbfs_to_gain(-50)
0.0031622776601683794
> dbfs_to_gain(-100)
0.00001
*/
function dbfs_to_gain(dbfs) {
    return Math.pow(10, dbfs / 20);
}

/*
> volume_to_gain(0)
0.00001
> volume_to_gain(100)
1
*/
// todo: nolive: asdfasdfasdf... hjalp
function volume_to_gain(volume) {    
    if (volume == 0) { // i guess
        return 0;
    }

    // gain of 1 is ridiculously loud, idk
    let gain = (Math.exp( volume/100 ) - 1) / (Math.E - 1);
    gain = gain / 4;
    return gain;
    
    //const actual = dbfs_to_gain(-(100-volume));
    //return actual;
}

function volume_to_gain_OLD(volume) {
    const volume_float = volume / 100;
    // > (Math.exp(0.01)-1)/(Math.E-1)
    // 0.005848963143130564
    const gain = (Math.exp(volume_float) - 1) / (Math.E - 1);
    return gain;
}

// col indicator
function draw_col_indicator(rect, dilate1, dilate2, color1, color2) {
    uidraw.rectangle_outline(uidraw.rectangle_dilate(rect, dilate1), color1);
    uidraw.push_linewidth(2);
    uidraw.rectangle_outline(uidraw.rectangle_dilate(rect, dilate2), color2);
    uidraw.pop_linewidth();
}

const _trix_grid_color1 = Color(36 + 18 + 9, 36 + 18 + 9, 36 + 18 + 9, 255);
const _trix_grid_color2 = Color(36 + 9 + 9, 36 + 9 + 9, 36 + 9 + 9, 255);
const _trix_grid_line_color = ui.make_css_color(uidraw.normal_back);

/** pass grid width, height (in cells), cell dim (in pixels), values (array of columns) */
function draw_trix_grid(w, h, dim, values) {
    // forwardport
    const current_column = _trix_panel.play_x;

    const rect = ui.layout_translated(Rectangle(0, 0, dim * w, dim * h));
    //uidraw.rectangle(rect, uidraw.normal_back);

    // alternating background
    uidraw.rectangle(rect, _trix_grid_color1);
    uidraw.rectangle(Rectangle(0 | rect.x + rect.w * (1 / 4), rect.y, 0 | rect.w / 4, rect.h), _trix_grid_color2);
    uidraw.rectangle(Rectangle(0 | rect.x + rect.w * (3 / 4), rect.y, 0 | rect.w / 4, rect.h), _trix_grid_color2);

    // main grid lines
    uidraw.push_strokestyle(_trix_grid_line_color);
    uidraw.push_linewidth(2);
    uidraw.begin_path();
    for (let x = 1; x < w; x++) {
        uidraw.move_to(rect.x + x * dim, rect.y);
        uidraw.line_to(rect.x + x * dim, rect.y + rect.h);
    }
    for (let y = 1; y < h; y++) {
        uidraw.move_to(rect.x, rect.y + y * dim);
        uidraw.line_to(rect.x + rect.w, rect.y + y * dim);
    }
    uidraw.stroke();
    uidraw.pop_linewidth();
    uidraw.pop_strokestyle();

    // main outline
    uidraw.rectangle_outline(rect, _trix_grid_line_color);

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const value = values[x][y];
            if (value != 0 && value != -1) {
                let color_on;
                if (x == current_column) {
                    color_on = uidraw.activating_face;
                } else {
                    color_on = uidraw.accent;
                }
                uidraw.rectangle3d(Rectangle(rect.x + x * dim + 1, rect.y + y * dim + 1, dim - 2, dim - 2), color_on);
            }
        }
    }

    // song_schedule_x indicator (debug)
    //const column_rect2 = Rectangle(rect.x + (_trix_panel.song_schedule_x % 16) * dim, rect.y, dim, dim * h);
    //draw_col_indicator(column_rect2, 3, 4, Color(0, 0, 0, 255), Color(255, 0, 0, 127));

    // song_x indicator
    const column_rect = Rectangle(rect.x + current_column * dim, rect.y, dim, dim * h);
    draw_col_indicator(column_rect, 3, 2, Color(0, 0, 0, 255), Color(128, 128, 128, 255));

    ui.layout_increment2(dim * w, dim * h);
}

function do_trix_grid(uiid, w, h, dim, values) {
    update_trix_grid(uiid, w, h, dim, values);
    draw_trix_grid(w, h, dim, values);
}

function update_trix_grid(uiid, w, h, dim, values) {

    const on_value = 1;
    const off_value = 0;

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'previous_drag_x': null,
            'previous_drag_y': null,
        });
    };

    const peek = ui.layout_peek();
    const _ = logic_for_grid(state, uiid, peek.x, peek.y, w, h, dim);

    const cell_clicked = _[0];
    const cell_dragged = _[1];
    const cell_clicked_right = _[2];
    const cell_dragged_right = _[3];
    const x = _[4];
    const y = _[5];

    if (cell_dragged || cell_clicked) {
        values[x][y] = 0 | on_value;
        state.previous_drag_x = x;
        state.previous_drag_y = y;
    }

    if (cell_dragged_right || cell_clicked_right) {
        values[x][y] = 0 | off_value;
        state.previous_drag_x = x;
        state.previous_drag_y = y;
    }
    
}

function logic_for_grid(state, uiid, ox, oy, w, h, dim) {
    ui.add_hotspot(uiid, Rectangle(ox, oy, dim * w, dim * h));

    const cell_clicked = ui.state.item_went_down == uiid;
    const cell_clicked_right = ui.state.item_went_down_right == uiid;
    
    // welp, this is same as GetCursor*
    let x = 0 | (ui.state.mouselocation.x - ox) / dim;
    let y = 0 | (ui.state.mouselocation.y - oy) / dim;

    /*if (cell_clicked || cell_clicked_right) {
        console.assert(x<16);
        console.assert(y<16);
        console.log('mousepressed_x', ui.state.mousepressed_x);
        console.log('mousepressed_y', ui.state.mousepressed_y);
        console.log('mousereleased_x', ui.state.mousereleased_x);
        console.log('mousereleased_y', ui.state.mousereleased_y);
        console.log('driver vs system deltas', (ui.driver.GetCursorX() - ui.state.mousepressed_x), (ui.driver.GetCursorY() - ui.state.mousepressed_y));
    }*/

    const cell_dragged = (
        ui.state.item_held == uiid
    ) && (
        x >= 0 && x < w && y >= 0 && y < h
    ) && (
        state.previous_drag_x != x
        || state.previous_drag_y != y
    );

    const cell_dragged_right = (
        ui.state.item_held_right == uiid
    ) && (
        x >= 0 && x < w && y >= 0 && y < h
    ) && (
        state.previous_drag_x != x
        || state.previous_drag_y != y
    );

    return [cell_clicked, cell_dragged, cell_clicked_right, cell_dragged_right, x, y];
}

function do_preset_buttons() {
    let _;    
    const uiid = 'preset-buttons-';
    ui.layout_push(_horizontal);
    {
        _ = ui.button(uiid + 'button-a', 'a', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_a();
        }

        _ = ui.button(uiid + 'button-b', 'b', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_b();
        }

        _ = ui.button(uiid + 'button-c', 'c', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_c();
        }

        _ = ui.button(uiid + 'button-d', 'd', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_d();
        }

        _ = ui.button(uiid + 'button-e', 'e', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_e();
        }

        _ = ui.button(uiid + 'button-f', 'f', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_f();
        }

        _ = ui.button(uiid + 'button-g', 'g', Rectangle(0, 0, 40, 24))
        if (_.clicked) {
            load_preset_g();
        }

        ui.label('presets', Rectangle(4, 0, 100, 24));
    }
    ui.layout_pop();
}

function do_trix_panel(uiid, first_x, first_y, first_visible, first_expanded) {
    let _;
    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);
    if (panel.visible && panel.expanded) {

        const dim = 20;

        if (false) {
            ui.label('initialized: ' + _trix_panel.initialized, Rectangle(0, 0, 200, 20));
            ui.label('tempo_index: ' + _trix_panel.tempo_index, Rectangle(0, 0, 200, 20));
            ui.label('wait: ' + _trix_panel.wait, Rectangle(0, 0, 200, 20));
            ui.label('time: ' + _trix_panel.time, Rectangle(0, 0, 200, 20));
            ui.label('play_x: ' + _trix_panel.play_x, Rectangle(0, 0, 200, 20));
            ui.label('play_x_long: ' + _trix_panel.play_x_long, Rectangle(0, 0, 200, 20));
            ui.label('schedule_x: ' + _trix_panel.schedule_x, Rectangle(0, 0, 200, 20));
        }

        do_preset_buttons();

        ui.layout_increment2(0, 4);

        ui.layout_push(_horizontal); // play/pause/volume row      
        {
            ui.layout_push(_horizontal, -1);
            {
                ui.group_buttons_begin();
                const buttons = ['pause', 'play'];
                for (var i = 0; i < buttons.length; i++) {
                    const is_current = (i == 1 && _trix_panel.play) || (i == 0 && !_trix_panel.play);
                    const button_text = buttons[i];
                    _ = ui.checkbutton(uiid + '-playpause-buttons-' + i, button_text, Rectangle(0, 0, 100, 24), is_current, 4, 2);
                    if (_.changed && _.value) {
                        if (i == 0) {
                            // reset playahead
                            _trix_panel.schedule_x = _trix_panel.play_x;
                            _trix_panel.play_x_long = _trix_panel.play_x;
                            _trix_panel.play = 0 | false;
                        } else {
                            _trix_panel.play = 0 | true;
                        }
                    }
                }
                ui.group_buttons_end();
            }
            ui.layout_pop();

            ui.layout_increment2(140, 0);

            ui.layout_push(_horizontal);
            {
                // master volume
                _ = ui.slider(uiid + '-slider-volume', Rectangle(0, 0, 200, 24), 0, 100, _trix_panel.volume, '');                
                ui.label('volume', Rectangle(4, 0, 100, 20));
                if (_.changed) {
                    _trix_panel.volume = _.value;
                    _trix_panel.gain.gain.value = volume_to_gain(_.value);
                }
            }
            ui.layout_pop();
        }
        ui.layout_pop(); // play/pause/volume row      

        /*ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (var i = 0; i < _trix_panel.grid_edit_tools.length; i++) {
            const name = _trix_panel.grid_edit_tools[i];
            const is_current = name == _trix_panel.grid_edit_tools[_trix_panel.grid_edit_tool];
            _ = ui.checkbutton(uiid + '-grid_edit_tool-' + i + '-checkbutton', ' ' + name, Rectangle(0, 0, 30, 30), is_current);
            if (_.changed && _.value) {
                _trix_panel.grid_edit_tool = i;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();*/

        const grid_w = dim * 16;
        const grid_w_left = 0 | grid_w / 2;
        const grid_w_right = grid_w - grid_w_left;

        ui.layout_push(_horizontal)
        {
            ui.label('piano:', Rectangle(0, 0, grid_w_left, 24));
            _ = ui.slider(uiid + '-piano-volume', Rectangle(0, 12, grid_w_right, 12), 0, 100, _trix_panel.piano.volume, '');
            if (_.changed) {
                _trix_panel.piano.volume = _.value;
                _trix_panel.piano.gain.gain.value = volume_to_gain(_.value);
            }

            ui.label('bass:', Rectangle(20, 0, grid_w_left, 24));
            _ = ui.slider(uiid + '-bass-volume', Rectangle(20, 12, grid_w_right, 12), 0, 100, _trix_panel.bass.volume, '');
            if (_.changed) {
                _trix_panel.bass.volume = _.value;
                _trix_panel.bass.gain.gain.value = volume_to_gain(_.value);
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            do_trix_grid(uiid + '-piano-grid', 16, 16, dim, _trix_panel.piano_grid);
            ui.layout_increment2(20, 0);
            do_trix_grid(uiid + '-bass-grid', 16, 16, dim, _trix_panel.bass_grid);
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        {
            ui.label('misc:', Rectangle(0, 0, 100, 24));
            _ = ui.slider(uiid + '-misc-volume', Rectangle(60, 12, grid_w_right, 12), 0, 100, _trix_panel.misc_volume, '');
            if (_.changed) {
                _trix_panel.misc_volume = _.value;
                _trix_panel.misc_gain.gain.value = volume_to_gain(_.value);
            }
        }
        ui.layout_pop();

        ui.layout_push(_horizontal); // misc-grid row's container
        {
            do_trix_grid(uiid + '-misc-grid', 16, 4, dim, _trix_panel.misc_grid);

            ui.layout_increment2(20, 0);

            ui.layout_push(_vertical, 0);
            {
                ui.label('tempo', Rectangle(0, 0, 200, dim));
                _ = ui.slider(uiid + '-slider-tempo', Rectangle(0, 0, 200, 20), 0, _trix_panel.tempo.length - 1, _trix_panel.tempo_index, '');
                if (_.changed) {
                    set_tempo_index(_.value);
                }
                ui.label('scale', Rectangle(0, 0, 200, dim));
                ui.layout_push(_horizontal, -1);
                {
                    ui.group_buttons_begin();
                    for (var i = 0; i < scales.length; i++) {
                        const is_current = i == _trix_panel.scale_index;
                        const button_text = i + '';
                        _ = ui.checkbutton(uiid + '-scale-button-' + i, button_text, Rectangle(0, 0, 40, dim), is_current, 14, 0);
                        if (_.changed && _.value) {
                            _trix_panel.scale_index = i;
                        }
                    }
                    ui.group_buttons_end();
                }
                ui.layout_pop();
            }
            ui.layout_pop(); // right half or misc-grid row
        }
        ui.layout_pop();

        ui.label('( edit cells with left and right mouse drag )', Rectangle(0, 0, 100, 20));

        ui.layout_increment2(0, 20);

        // analyser graph        
        //const graph_w = 512;
        const graph_w = dim * 16 * 2 + 20;
        const graph_h = 100;
        sample_trix_analyser();
        uidraw.rectangle(ui.layout_translated(Rectangle(0, 0, graph_w, graph_h)), uidraw.normal_back);
        do_analyser_graph(uiid - '-analyser-graph', Rectangle(2, 0, graph_w, graph_h), _trix_panel.analyser_freqs, _trix_panel.analyser_times);
        
        ui.layout_increment2(0, 20);

        ui.layout_push(_horizontal);
        {
            _ = ui.slider(uiid + '-schedule-notes-ahead-slider', Rectangle(0, 0, 200, 20), 0, 8, _trix_panel.schedule_notes_ahead, '');
            if (_.changed) {
                _trix_panel.schedule_notes_ahead = _.value;
            }
            ui.label('schedule ' + _trix_panel.schedule_notes_ahead + ' notes ahead', Rectangle(4, 0, 200, 20));
        }
        ui.layout_pop();

        //-----------------------------------------------------------------------------------------

        if (_trix_panel.play) {
            trix_play();
        }
    }
    do_panel_end(uiid);
}

function load_convolver_sample() {
    const impulseUrl = 'impulse.mp3';

    const req = new XMLHttpRequest();
    req.open('GET', impulseUrl, true);
    req.responseType = 'arraybuffer';

    req.onload = function () {
        var impulseData = req.response;
        _trix_panel.context.decodeAudioData(impulseData, function (buffer) {
            _trix_panel.piano.convolver.buffer = buffer;
            _trix_panel.piano.convolver.loop = false;
            _trix_panel.piano.convolver.normalize = true;
            connect_instrument('piano');
            _trix_panel.bass.convolver.buffer = buffer;
            _trix_panel.bass.convolver.loop = false;
            _trix_panel.bass.convolver.normalize = true;
            connect_instrument('bass');
        },
            function (e) { "Error decoding audio data" + e.err });
    }

    req.send();
}

function trix_play_column(x, time) {
    const scale = scales[_trix_panel.scale_index];

    // all notes in col start play now
    for (let y = 0; y < 16; y++) {
        if (_trix_panel.piano_grid[x][y]) {
            const piano_rate = freq[scale[y]];
            play_sample('piano.ogg', _trix_panel.piano.dest, time, piano_rate, _trix_panel.piano.detune * 100);
        }
        if (_trix_panel.bass_grid[x][y]) {
            const bass_rate = freq[scale[y]];
            play_sample('bass.ogg', _trix_panel.bass.dest, time, bass_rate, _trix_panel.bass.detune * 100);
        }
    }
    const misc_keys = ['kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg'];
    for (let y = 0; y < 4; y++) {
        if (_trix_panel.misc_grid[x][y]) {
            const key = misc_keys[y];
            play_sample(key, _trix_panel.misc_dest, time, 1);
        }
    }
}

function trix_play() {
    const dt = app.main_loop_time / 1000; // todo: make delta time part of simpleui

    _trix_panel.time = _trix_panel.time + dt;

    const audio_time = _trix_panel.context.currentTime;
    const do_next_column = _trix_panel.time >= _trix_panel.wait && _trix_panel.play == true;

    const debug = 0 | false;

    if (debug) {
        _trix_panel.schedule_x = 13;
        _trix_panel.play_x = 13;
    }

    if (do_next_column) {
        if (debug) _trix_panel.play = 0 | false;

        // schedule up to 1 note now and 3 notes into the future
        // 2nd note: schedule = 1, play = 4, should schedule fifth note, but with 4 waits not the 0 or 1 it will do
        // so actual time isn't based on j, but on the delta between two x cursors
        // time needs to be... (x - play_x)        
        const schedule_x2 = _trix_panel.play_x_long + _trix_panel.schedule_notes_ahead;
        while (_trix_panel.schedule_x <= schedule_x2) {
            const delta = _trix_panel.schedule_x - _trix_panel.play_x_long;
            const time_offset = delta * _trix_panel.wait; // 0 * wait = now, 1 * wait = next
            const x = _trix_panel.schedule_x;
            trix_play_column(x % 16, audio_time + time_offset);
            _trix_panel.schedule_x += 1;
        }

        /*if (_trix_panel.schedule_x == 16) {
            _trix_panel.schedule_x = 0;
        } */
        //_trix_panel.schedule_x = _trix_panel.schedule_x % 16;

        _trix_panel.play_x += 1;
        if (_trix_panel.play_x == 16) {
            _trix_panel.play_x = 0;
        }
        _trix_panel.play_x_long = 0 | _trix_panel.play_x_long + 1;

        _trix_panel.time = _trix_panel.time % _trix_panel.wait;
    }

}

const _fetched_audio = {};
function fetch_audio(url) {
    window.fetch(url)
        .then(response => response.arrayBuffer())
        .then(array_buffer => _trix_panel.context.decodeAudioData(array_buffer))
        .then(audio_buffer => {
            _fetched_audio[url] = audio_buffer;
        });
}

function play_sample(key, output_node, time, rate, detune) {
    detune = detune || 0;
    //console.assert(_fetched_audio[key]);
    //console.log(key, time);
    const source = _trix_panel.context.createBufferSource();
    source.buffer = _fetched_audio[key];
    source.playbackRate.value = rate;
    source.detune.value = detune;
    source.connect(output_node);
    source.start(time);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function connect_instrument(name) {
    /*
    piano_shaper
    piano_biquad
    piano_panner
    piano_convolver
    piano_gain    
    > compressor > master gain > analyser > (out)    
    */

    const o = _trix_panel[name];

    //const keys = ['piano_convolver', 'piano_shaper', 'piano_biquad', 'piano_panner', 'piano_gain'];
    //const keys = ['convolver', 'shaper', 'biquad', 'gain'];
    //const keys = ['shaper', 'convolver', 'biquad', 'gain'];
    
    // this is good
    // const keys = ['shaper', 'biquad', 'convolver', 'gain'];
    // but i wanna try moving convolver
    // convolver before biquad sounds good
    //const keys = ['shaper', 'convolver', 'biquad', 'gain'];
    // i like convolver first and i think it makes more sense    
    const keys = ['convolver', 'shaper', 'biquad', 'gain']; // v >0.4.1

    for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        o[key].disconnect();
    }

    const use_convolver = o.convolver_enabled && o.convolver.buffer;
    const use_biquad = o.biquad_enabled;
    const use_shaper = o.shaper_enabled;

    //console.log('connect_instrument', name);

    let prev_key = null;
    for (var i = 0; i < keys.length; i++) {
        const key = keys[i];
        let do_connect = false;
        if (key == 'convolver') {
            //console.log(name, 'use_convolver', use_convolver);
            do_connect = use_convolver;
        } else if (key == 'biquad') {
            //console.log(name, 'use_biquad', use_biquad);
            do_connect = use_biquad;
        } else if (key == 'shaper') {
            //console.log(name, 'use_shaper', use_shaper);
            do_connect = use_shaper;
        } else {
            do_connect = true;
        }
        if (do_connect) {
            if (prev_key == null) {
                // first connection is sample destination
                o.dest = o[key];
            } else {
                // subsequent connects
                o[prev_key].connect(o[key]);
            }
            prev_key = key;
        }
    }

    // connect back to system
    const end_key = keys[keys.length - 1];
    o[end_key].connect(_trix_panel.play_node);
}

function connect_misc() {
    _trix_panel.misc_gain.connect(_trix_panel.play_node);
    _trix_panel.misc_dest = _trix_panel.misc_gain;
}

function dbToY(db, height, pixelsPerDb) {
    var y = (0.5 * height) - pixelsPerDb * db;
    return y;
}

function draw_biquad_filter(filter, local_rect) {
    const rect = ui.layout_translated(local_rect);

    const width = rect.w;
    const height = rect.h;

    const line_color = ui.make_css_color(Color(180, 0, 40, 255));
    const grid_color = ui.make_css_color(Color(100, 100, 100, 255));
    const text_color = ui.make_css_color(Color(255, 255, 255, 255));

    const dbScale = 60;
    const pixelsPerDb = (0.5 * height) / dbScale;

    var noctaves = 11;

    var frequencyHz = new Float32Array(width);
    var magResponse = new Float32Array(width);
    var phaseResponse = new Float32Array(width);
    var nyquist = 0.5 * _trix_panel.context.sampleRate;
    // First get response.
    for (var i = 0; i < width; ++i) {
        var f = i / width;

        // Convert to log frequency scale (octaves).
        f = nyquist * Math.pow(2.0, noctaves * (f - 1.0));

        frequencyHz[i] = f;
    }

    filter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);

    // grid
    uidraw.begin_path();
    uidraw.push_linewidth(1);
    uidraw.push_strokestyle(grid_color)
    for (let octave = 0; octave <= noctaves; octave++) {
        const x = octave * width / noctaves;
        uidraw.move_to(rect.x + x, rect.y + 33);
        uidraw.line_to(rect.x + x, rect.y + height);
        uidraw.stroke();
    }
    uidraw.pop_linewidth();
    uidraw.pop_strokestyle();

    // labels
    uidraw.push_strokestyle(text_color);
    for (let octave = 1; octave <= noctaves; octave += 2) {
        const x = octave * width / noctaves;
        const f = nyquist * Math.pow(2.0, octave - noctaves);
        let value = f.toFixed(0);
        //let unit = 'Hz';
        let unit = '';
        if (f > 1000) {
            //unit = 'KHz';
            unit = 'K';
            value = (f / 1000).toFixed(1);
        }

        let y_offset = 0;
        if (octave % 2 == 0) {
            y_offset = 20;
        }
        //uidraw.text(value + unit, rect.x + x - 40, rect.y + 14 + y_offset, Color(255,255,255,255));        
    }
    uidraw.pop_strokestyle();

    // Draw 0dB line.
    uidraw.begin_path();
    uidraw.move_to(rect.x + 0, rect.y + 0.5 * height);
    uidraw.line_to(rect.x + width, rect.y + 0.5 * height);
    uidraw.stroke();

    // Draw decibel scale.    
    uidraw.push_strokestyle(text_color);
    for (let db = -dbScale; db < dbScale - 10; db += 10) {
        const y = dbToY(db, height, pixelsPerDb);
        //uidraw.text(db.toFixed(0) + "dB", rect.x + width - 40, rect.y + y);
        uidraw.push_strokestyle(grid_color);
        uidraw.begin_path();
        uidraw.move_to(rect.x + 0, rect.y + y);
        uidraw.line_to(rect.x + width, rect.y + y);
        uidraw.stroke();
        uidraw.pop_strokestyle();
    }
    uidraw.pop_strokestyle();

    // redline
    uidraw.begin_clip(rect);
    uidraw.push_strokestyle(line_color);
    uidraw.push_linewidth(3);
    uidraw.begin_path();
    uidraw.move_to(rect.x, rect.y);
    for (var i = 0; i < width; ++i) {
        var f = magResponse[i];
        var response = magResponse[i];
        var dbResponse = 20.0 * Math.log(response) / Math.LN10;

        var x = i;
        var y = dbToY(dbResponse, height, pixelsPerDb);

        if (i == 0)
            uidraw.move_to(rect.x + x, rect.y + y);
        else
            uidraw.line_to(rect.x + x, rect.y + y);
    }
    uidraw.stroke();
    uidraw.pop_strokestyle();
    uidraw.pop_linewidth();
    uidraw.end_clip();

    ui.layout_increment(rect);
}

function instrument_set_biquad_type(o, type_index) {
    o.biquad_type_index = type_index;
    o.biquad.type = _trix_panel.biquad_types[type_index];
}

function instrument_set_volume(o, value) {
    o.volume = value;
    o.gain.gain.value = volume_to_gain(value);    
}

function do_instrument_edit(instrument_index) {
    let _;
    const uiid = '---instrument-edit-' + instrument_index;
    const name = _trix_panel.instrument_names[instrument_index];
    const o = _trix_panel[name];    

    ui.layout_push(_horizontal);
    {
        _ = ui.checkbutton(uiid + '-' + name + '-convolver-checkbox', 'reverb', Rectangle(0, 0, 100, 24), o.convolver_enabled);
        if (_.changed) {
            o.convolver_enabled = _.value;
            connect_instrument(name);
        }
        _ = ui.checkbutton(uiid + '-' + name + '-shaper-checkbox', 'shaper', Rectangle(0, 0, 100, 24), o.shaper_enabled);
        if (_.changed) {
            o.shaper_enabled = _.value;
            connect_instrument(name);
        }
        _ = ui.checkbutton(uiid + '-' + name + '-biquad-checkbox', 'biquad', Rectangle(0, 0, 100, 24), o.biquad_enabled);
        if (_.changed) {
            o.biquad_enabled = _.value;
            connect_instrument(name);
        }
    }
    ui.layout_pop();

    ui.layout_increment2(0, 12);
    ui.label('source', Rectangle(0, 0, 100, 20));
    ui.hline(400, 1, uidraw.normal_face);

    ui.layout_push(_horizontal);
    ui.label('volume', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-' + name + '-volume', Rectangle(0, 0, 200, 20), 0, 100, o.volume, '');
    if (_.changed) {
        instrument_set_volume(o, _.value);
    }
    ui.label(o.volume + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_push(_horizontal);
    ui.label('detune', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-' + name + '-detune', Rectangle(0, 0, 200, 20), -12, 12, o.detune, '');
    if (_.changed) {
        o.detune = _.value;
    }
    ui.label(o.detune * 100 + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_increment2(0, 12);
    ui.label('biquad filter', Rectangle(0, 0, 100, 20));
    ui.hline(400, 1, uidraw.normal_face);

    ui.layout_push(_horizontal);
    ui.label('type', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-biquad-type-index', Rectangle(0, 0, 200, 20), 0, _trix_panel.biquad_types.length - 1, o.biquad_type_index, '');
    if (_.changed) {
        instrument_set_biquad_type(o, _.value);
    };
    ui.label(_trix_panel.biquad_types[o.biquad_type_index], Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_push(_horizontal);
    ui.label('freq', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-biquad-frequency', Rectangle(0, 0, 200, 20), 0, 8000, o.biquad.frequency.value, '');
    if (_.changed) { o.biquad.frequency.value = _.value; };
    ui.label(o.biquad.frequency.value + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_push(_horizontal);
    ui.label('detune', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-biquad-detune', Rectangle(0, 0, 200, 20), -1200, 1200, o.biquad.detune.value, '');
    if (_.changed) { o.biquad.detune.value = _.value; };
    ui.label(o.biquad.detune.value + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_push(_horizontal);
    ui.label('q factor', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-biquad-qfactor', Rectangle(0, 0, 200, 20), -100, 100, o.biquad.Q.value, '');
    if (_.changed) { o.biquad.Q.value = _.value; };
    ui.label(o.biquad.Q.value + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    ui.layout_push(_horizontal);
    ui.label('gain', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-biquad-gain', Rectangle(0, 0, 200, 20), -100, 100, o.biquad.gain.value, '');
    if (_.changed) { o.biquad.gain.value = _.value; };
    ui.label(o.biquad.gain.value + '', Rectangle(4, 0, 100, 20));
    ui.layout_pop();

    draw_biquad_filter(o.biquad, Rectangle(0, 0, 400, 200));

    // shaper
    ui.layout_increment2(0, 12);
    ui.label('shaper', Rectangle(0, 0, 100, 20));
    ui.hline(400, 1, uidraw.normal_face);

    ui.layout_push(_horizontal);
    ui.label('oversample', Rectangle(0, 0, 100, 20));
    _ = ui.slider(uiid + '-shaper-oversample-index', Rectangle(0, 0, 200, 20), 0, _trix_panel.shaper_oversample_types.length - 1, o.shaper_oversample_index, '');
    if (_.changed) {
        o.shaper_oversample_index = _.value;
        o.shaper.oversample = _trix_panel.shaper_oversample_types[o.shaper_oversample_index];
    };
    ui.label(_trix_panel.shaper_oversample_types[o.shaper_oversample_index], Rectangle(4, 0, 100, 20));
    ui.layout_pop();

}

function do_instrument_panel(uiid, first_x, first_y, first_visible, first_expanded) {
    let _;

    // this uiid is for panel_begin (probably need to rename functions like this (run_instrument_panel or w/e idk))
    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);
    if (panel.visible && panel.expanded) {

        ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (var i = 0; i < _trix_panel.instrument_names.length; i++) {
            const is_current = i == _trix_panel.selected_instrument_index;
            const name = _trix_panel.instrument_names[i];
            const button_text = name;
            _ = ui.checkbutton(uiid + '-select-instrument-button-' + i, button_text, Rectangle(0, 0, 80, 24), is_current, 4, 2);
            if (_.changed && _.value) {
                _trix_panel.selected_instrument_index = i;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();

        ui.layout_increment2(0, 12);
        ui.hline(400, 1, uidraw.normal_face);

        do_instrument_edit(_trix_panel.selected_instrument_index);
    }
    do_panel_end(uiid);
}

function makeDistortionCurve(amount) { // copied
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

function do_app_audio() {
    const row_x0 = 222;
    const row_y0 = 47;

    const expanded = !ui.driver.IsTouchDevice();

    if (_tone_panel.context) {
        do_trix_panel('trix panel', row_x0, row_y0, true, expanded);
        do_instrument_panel('instrument panel', row_x0 + 727, row_y0, true, expanded);
        do_tone_panel('tone panel', row_x0 + 727 + 467, row_y0, true, false && expanded);
    } else {
        if (AudioContext) {
            _tone_panel.context = new AudioContext();
            _tone_panel.gain1 = _tone_panel.context.createGain();
            _tone_panel.analyser1 = _tone_panel.context.createAnalyser();
            _tone_panel.analyser1.fftSize = 512;
            _tone_panel.analyser1_times = new Uint8Array(_tone_panel.analyser1.frequencyBinCount);
            _tone_panel.analyser1_freqs = new Uint8Array(_tone_panel.analyser1.frequencyBinCount);

            // standard
            _trix_panel.context = new AudioContext();
            _trix_panel.gain = _trix_panel.context.createGain();
            _trix_panel.gain.gain.value = volume_to_gain(_trix_panel.volume);
            _trix_panel.compressor = _trix_panel.context.createDynamicsCompressor();
            _trix_panel.analyser = _trix_panel.context.createAnalyser();
            _trix_panel.analyser.fftSize = 256;
            _trix_panel.analyser_times = new Uint8Array(_trix_panel.analyser.frequencyBinCount);
            _trix_panel.analyser_freqs = new Uint8Array(_trix_panel.analyser.frequencyBinCount);

            // piano init
            _trix_panel.piano.gain = _trix_panel.context.createGain();
            _trix_panel.piano.gain.gain.value = volume_to_gain(_trix_panel.piano.volume);
            _trix_panel.piano.convolver = _trix_panel.context.createConvolver();
            _trix_panel.piano.biquad = _trix_panel.context.createBiquadFilter();
            instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
            _trix_panel.piano.shaper = _trix_panel.context.createWaveShaper();
            _trix_panel.piano.shaper.curve = makeDistortionCurve(400);
            _trix_panel.piano.shaper_oversample_index = 2;
            _trix_panel.piano.shaper.oversample = _trix_panel.shaper_oversample_types[_trix_panel.bass.shaper_oversample_index];
            _trix_panel.piano.panner = _trix_panel.context.createStereoPanner();

            // bass init
            _trix_panel.bass.gain = _trix_panel.context.createGain();
            _trix_panel.bass.gain.gain.value = volume_to_gain(_trix_panel.bass.volume);
            _trix_panel.bass.convolver = _trix_panel.context.createConvolver();
            _trix_panel.bass.biquad = _trix_panel.context.createBiquadFilter();
            instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);
            _trix_panel.bass.shaper = _trix_panel.context.createWaveShaper();
            _trix_panel.bass.shaper.curve = makeDistortionCurve(400);
            _trix_panel.bass.shaper_oversample_index = 0;
            _trix_panel.bass.shaper.oversample = _trix_panel.shaper_oversample_types[_trix_panel.bass.shaper_oversample_index];
            _trix_panel.bass.panner = _trix_panel.context.createStereoPanner();

            // misc init
            _trix_panel.misc_gain = _trix_panel.context.createGain();
            _trix_panel.misc_gain.gain.value = volume_to_gain(_trix_panel.misc_volume);

            // end (should start on play_node)
            // v <= 0.4.1:
            //_trix_panel.gain.connect(_trix_panel.compressor);
            //_trix_panel.compressor.connect(_trix_panel.analyser);
            // v > 0.4.1:            
            // https://www.softube.com/index.php?id=eq_before_compressor
            // " Placing an EQ before a compressor can have the effect of exaggerating the applied EQ, due to a phenomenon similar to the psychoacoustic effect known as "frequency masking". "
            // ( gain will give similar problem as eq )
            _trix_panel.play_node = _trix_panel.compressor;
            _trix_panel.compressor.connect(_trix_panel.gain);
            _trix_panel.gain.connect(_trix_panel.analyser);
            _trix_panel.analyser.connect(_trix_panel.context.destination);

            // later: a 2nd analyser before compressor, drawn in red (freqs only), to show pre-compress

            load_preset_a();

            load_convolver_sample();

            const audio_files = ['piano.ogg', 'bass.ogg', 'kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg'];
            for (let i = 0; i < audio_files.length; i++) {
                fetch_audio(audio_files[i]);
            }
        } else {
            do_message_panel('audio error', row_x0, row_y0, true, true, 'AudioContext unavailable.');
        }
    }
}

function reconnect_instruments() {
    connect_instrument('piano');
    connect_instrument('bass');
    connect_misc();
}

function load_preset_a() { // 'canyouguyssoulslide'
    _trix_panel.piano_grid = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    _trix_panel.bass_grid = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    _trix_panel.misc_grid = [[0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    
    _trix_panel.piano.biquad.frequency.value = 1000;
    _trix_panel.piano.biquad.detune.value = 0;
    _trix_panel.piano.biquad.gain.value = 10;
    _trix_panel.piano.biquad.Q.value = 10;

    // bass biquad not used

    const _piano = {"volume":50,"detune":0,"convolver_enabled":1,"biquad_type_index":4,"biquad_enabled":1,"shaper_oversample_index":2,"shaper_enabled":0};
    Object.assign(_trix_panel.piano, _piano);
    const _bass = {"volume":80,"detune":0,"convolver_enabled":0,"biquad_type_index":0,"biquad_enabled":0,"shaper_oversample_index":0,"shaper_enabled":0};
    Object.assign(_trix_panel.bass, _bass);

    _trix_panel.misc_volume = 80;
    set_tempo_index(8);

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();
}

function load_preset_b() { // 'idontknowhowtocode'
    _trix_panel.piano_grid = [[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    _trix_panel.bass_grid = [[0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    _trix_panel.misc_grid = [[0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

    _trix_panel.piano.biquad.frequency.value = 3320;
    _trix_panel.piano.biquad.detune.value = 480;
    _trix_panel.piano.biquad.gain.value = 18;
    _trix_panel.piano.biquad.Q.value = 33;

    _trix_panel.bass.biquad.frequency.value = 350;
    _trix_panel.bass.biquad.detune.value = 192;
    _trix_panel.bass.biquad.gain.value = 0;
    _trix_panel.bass.biquad.Q.value = 1;

    const _piano = { "volume": 20, "detune": 12, "convolver_enabled": 1, "biquad_type_index": 3, "biquad_enabled": 1, "shaper_oversample_index": 2, "shaper_enabled": 1 };
    Object.assign(_trix_panel.piano, _piano);
    const _bass = { "volume": 70, "detune": 0, "convolver_enabled": 1, "biquad_type_index": 0, "biquad_enabled": 0, "shaper_oversample_index": 0, "shaper_enabled": 0 };
    Object.assign(_trix_panel.bass, _bass);

    _trix_panel.misc_volume = 80;
    set_tempo_index(8);

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();
}

function load_preset_c() { // 'washedupoxygenthief'
    _trix_panel.piano_grid = [[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0]];   
    _trix_panel.bass_grid = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
    _trix_panel.misc_grid = [[0,1,0,0],[0,0,0,0],[0,0,1,0],[0,0,0,0],[0,1,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,1,0,0],[0,0,0,0],[0,0,1,0],[0,0,0,0],[0,1,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0]];

    _trix_panel.piano.biquad.frequency.value = 1000;
    _trix_panel.piano.biquad.detune.value = -444;
    _trix_panel.piano.biquad.gain.value = 4;
    _trix_panel.piano.biquad.Q.value = 0;

    _trix_panel.bass.biquad.frequency.value = 350;
    _trix_panel.bass.biquad.detune.value = 0;
    _trix_panel.bass.biquad.gain.value = 8;
    _trix_panel.bass.biquad.Q.value = 1;

    const _piano = {"volume":100,"detune":0,"convolver_enabled":0,"biquad_type_index":4,"biquad_enabled":0,"shaper_oversample_index":2,"shaper_enabled":1};
    Object.assign(_trix_panel.piano, _piano);
    const _bass = {"volume":80,"detune":0,"convolver_enabled":0,"biquad_type_index":3,"biquad_enabled":1,"shaper_oversample_index":0,"shaper_enabled":0}
    Object.assign(_trix_panel.bass, _bass);

    _trix_panel.misc_volume = 80;
    set_tempo_index(8);

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();    
}

function load_preset_d() {
    _trix_panel.piano_grid = [[0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0],[0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];  
    _trix_panel.bass_grid = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
    _trix_panel.misc_grid = [[0,1,0,0],[1,0,1,0],[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,1,0],[1,0,0,0],[0,0,1,0],[0,1,0,0],[1,0,1,0],[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,1,0],[1,0,0,0],[0,0,1,0]];

    _trix_panel.piano.biquad.frequency.value = 1000;
    _trix_panel.piano.biquad.detune.value = -444;
    _trix_panel.piano.biquad.gain.value = 10;
    _trix_panel.piano.biquad.Q.value = 10;

    // no bass biquad

    const _piano = {"volume":39,"detune":0,"convolver_enabled":0,"biquad_type_index":4,"biquad_enabled":1,"shaper_oversample_index":0,"shaper_enabled":0};
    Object.assign(_trix_panel.piano, _piano);
    const _bass = {"volume":100,"detune":0,"convolver_enabled":0,"biquad_type_index":0,"biquad_enabled":0,"shaper_oversample_index":0,"shaper_enabled":0}
    Object.assign(_trix_panel.bass, _bass);

    _trix_panel.misc_volume = 80;
    set_tempo_index(8);

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();    
}

function load_preset_e() {
    _trix_panel.piano_grid = [[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];  
    _trix_panel.bass_grid = [[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0]];
    _trix_panel.misc_grid = [[1,0,0,0],[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],[0,0,1,0],[1,0,0,0],[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1],[0,0,1,0]];

    _trix_panel.piano.biquad.frequency.value = 3320;
    _trix_panel.piano.biquad.detune.value = 480;
    _trix_panel.piano.biquad.Q.value = 33;
    _trix_panel.piano.biquad.gain.value = 18;    

    _trix_panel.bass.biquad.frequency.value = 350;
    _trix_panel.bass.biquad.detune.value = 192;
    _trix_panel.bass.biquad.Q.value = 1;
    _trix_panel.bass.biquad.gain.value = 0;    

    const _piano = { "volume": 10, "detune": 12, "convolver_enabled": 1, "biquad_type_index": 3, "biquad_enabled": 1, "shaper_oversample_index": 2, "shaper_enabled": 1 };
    Object.assign(_trix_panel.piano, _piano);
    const _bass = { "volume": 100, "detune": 0, "convolver_enabled": 0, "biquad_type_index": 0, "biquad_enabled": 1, "shaper_oversample_index": 0, "shaper_enabled": 0 };
    Object.assign(_trix_panel.bass, _bass);
    
    _trix_panel.misc_volume = 100;
    set_tempo_index(8);
    /*const _misc = {
        volume: 100, biquad_type_index: 0, shaper_oversample_index: 2, convolver_enabled: 0, biquad_enabled: 0,
        row_sample_keys: ['kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg']
    }*/

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();    
}

function load_preset_f() {
    _trix_panel.piano_grid = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];  
    _trix_panel.bass_grid = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
    _trix_panel.misc_grid = [[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,1,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

    const _piano = { "volume": 60, "detune": 0, "convolver_enabled": 1, "biquad_type_index": 4, "biquad_enabled": 0, "shaper_oversample_index": 0, "shaper_enabled": 0 };
    Object.assign(_trix_panel.piano, _piano);
    const _bass = { "volume": 100, "detune": 0, "convolver_enabled": 0, "biquad_type_index": 0, "biquad_enabled": 0, "shaper_oversample_index": 0, "shaper_enabled": 0 };
    Object.assign(_trix_panel.bass, _bass);
    
    _trix_panel.misc_volume = 100;
    set_tempo_index(15);
    /*const _misc = {
        volume: 100, biquad_type_index: 0, shaper_oversample_index: 2, convolver_enabled: 0, biquad_enabled: 0,
        row_sample_keys: ['kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg']
    }*/

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();    
}

function load_preset_g() { // eazydoesit
    _trix_panel.piano_grid = [[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];  
    _trix_panel.bass_grid = [[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0]];
    _trix_panel.misc_grid = [[0,0,0,0],[1,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,0],[0,0,0,0]];

    const _piano = { "volume": 70, "detune": 0, "convolver_enabled": 0, "biquad_type_index": 3, "biquad_enabled": 0, "shaper_oversample_index": 0, "shaper_enabled": 1 };
    Object.assign(_trix_panel.piano, _piano);
    const _bass = { "volume": 100, "detune": 0, "convolver_enabled": 0, "biquad_type_index": 0, "biquad_enabled": 0, "shaper_oversample_index": 0, "shaper_enabled": 1 };
    Object.assign(_trix_panel.bass, _bass);
    
    _trix_panel.misc_volume = 100;
    set_tempo_index(7);

    instrument_set_volume(_trix_panel.piano, _trix_panel.piano.volume);
    instrument_set_biquad_type(_trix_panel.piano, _trix_panel.piano.biquad_type_index);
    instrument_set_volume(_trix_panel.bass, _trix_panel.bass.volume);
    instrument_set_biquad_type(_trix_panel.bass, _trix_panel.bass.biquad_type_index);

    reconnect_instruments();    
}

export {
    do_app_audio
}