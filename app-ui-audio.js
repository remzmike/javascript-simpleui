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
    const volume2 = _tone_panel.tone_point[_y] / _tone_panel.freq_range;
    const final_volume = (_tone_panel.volume / 100) * volume2;
    return final_volume;
}

function start_tone() {
    //console.log('[start_tone]');
    const frequency = _tone_panel.tone_point[_x];
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
    const x = rect[_x];
    const y = rect[_y];
    const w = rect[_w];
    const h = rect[_h];

    if (data1.length == 0 || data2.length == 0) {
        ui.layout_increment2(w, h);
        return;
    }
    
    uidraw.begin_path();
    uidraw.push_strokestyle(make_css_color(color1));
    let irange = data1.length;
    let vrange = 255;
    for (let i = 0; i < irange; i++) {
        const v = data1[i];
        const xpos = (i / irange) * w;
        const ypos = (v / vrange) * h;
        uidraw.move_to(x + xpos, y + h + 1);
        uidraw.line_to(x + xpos, y + h - ypos);
    }
    uidraw.pop_strokestyle();
    uidraw.stroke();

    uidraw.push_linewidth(2);
    uidraw.begin_path();
    uidraw.push_strokestyle(make_css_color(color2));
    irange = data2.length;
    vrange = 255; // later: just get data as floats and can remove this
    const ypos_start = (data2[0] / vrange) * h;
    uidraw.move_to(x, y + ypos_start);
    for (let i = 1; i < irange; i++) {
        const v = data2[i];
        const xpos = (i / irange) * w;
        const ypos = (v / vrange) * h;
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
        _ = ui.slider(uiid + '-slider-volume', Rectangle(0, 0, 200, 20), 0, 100, _tone_panel.volume, '');
        ui.label('volume', Rectangle(0, 0, 200, 20));
        if (_[_changed]) {
            _tone_panel.volume = _[_value];
            reset_tone();
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        _ = ui.slider(uiid + '-slider-throttle', Rectangle(0, 0, 200, 20), 0, 1000, _tone_panel.throttle, '');
        ui.label('throttle', Rectangle(0, 0, 200, 20));
        if (_[_changed]) {
            _tone_panel.throttle = _[_value];
            reset_tone();
        }
        ui.layout_pop();

        ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (let i = 0; i < _tone_panel.osc_types.length; i++) {
            const iter_type = _tone_panel.osc_types[i];
            const osc1_type = _tone_panel.osc_types[_tone_panel.osc1_type_index];
            const is_checked = iter_type == osc1_type;
            _ = ui.checkbutton(uiid + '-osc_type_button-' + iter_type, iter_type, Rectangle(0, 0, 80, 24), is_checked);
            if (_[_changed] && _[_value]) {
                _tone_panel.osc1_type_index = i;
                // dont relay change for osc1 type change unless currently playing
                _changed = 0 | _tone_panel.osc1_started;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();

        _ = do_slider2d(uiid + '-slider2d', Rectangle(0, 0, 400, 400), 0, _tone_panel.freq_range, _tone_panel.tone_point);
        if (_[_changed]) {

            // these two lines are bad, slider2d should return what i need instead
            // _[_]
            const bg_uiid = uiid + '-slider2d-bg';
            const item_went_down = ui.state.item_went_down == bg_uiid;

            if (item_went_down || (_tone_panel.tone_point[_x] != _[_x1] || _tone_panel.tone_point[_y] != _[_y1])) {
                _tone_panel.tone_point[_x] = _[_x1];
                _tone_panel.tone_point[_y] = _[_y1];
                _changed = 0 | true;
            }
        }

        if (_changed) {
            start_tone_limited();
        }

        if (_tone_panel.analyser1 && _tone_panel.osc1_started || _tone_panel.sound_playing) {

            sample_tone_analyser();

            const peek = ui.layout_peek();
            ui.layout_push(_none, null, peek[_x], peek[_y] - peek[_padding] * 2 - 100);
            do_analyser_graph(uiid - '-graph', Rectangle(2, 0, 400 - 4, 100), _tone_panel.analyser1_freqs, _tone_panel.analyser1_times, uidraw.normal_back, uidraw.accent);
            ui.layout_pop();
        }

        // show this when (requested) -and- (no buffer -or- buffer was fetched in less than 1 second)
        if (_tone_panel.play_file_requested && (!_tone_panel.play_buffer || (Date.now() - _tone_panel.play_file_request_time) < 1000)) {
            ui.label('audio file requested...', Rectangle(0, 0, 200, 24));
        } else {
            _ = ui.button(uiid + '-button-yodel', 'play yodel mp3', Rectangle(0, 0, 200, 24));
            if (_tone_panel.play_pending || _[_clicked]) {
                play(_tone_panel.source1);
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
    1.6818, 	// a5	1
    1.5874, 	// gs5	2
    1.49831, 	// g5	3
    1.4142, 	// fs5	4
    1.3348, 	// f5	5
    1.2599, 	// e5	6
    1.1892, 	// ds5	7
    1.1225, 	// d5	8 
    1.0595, 	// cs5	9
    1.0, 		// c5	10 
    0.9439, 	// b4	11
    0.8909, 	// as4	12
    0.8409, 	// a4	13
    0.79370, 	// gs4	14
    0.7492, 	// g4	15
    0.7071, 	// fs4	16
    0.6674, 	// f4	17
    0.62996, 	// e4	18
    0.5946, 	// ds4	19
    0.5611, 	// d4	20
    0.5297, 	// cs4	21
    0.5, 		// c4	22
    0.47194, 	// b3	23
    0.44545, 	// as3	24
    0.42045, 	// a3	25
    0.39685, 	// gs3	26
    0.37458, 	// g3	27
    0.35355, 	// fs3	28
    0.3337, 	// f3	29
    0.31498, 	// e3	30
    0.2973, 	// ds3	31
    0.2806, 	// d3	32
    0.26487, 	// cs3	33
    0.25, 		// c3	34
    0.23597, 	// b2	35
    0.2272, 	// as2	36
    0.21022, 	// a2	37
    0.19843, 	// gs2	38
    0.18729, 	// g2	39
    0.17678, 	// fs2	40
    0.16685, 	// f2	41
    0.15749, 	// e2	42
    0.14865, 	// ds2	43
    0.1403, 	// d2	44
    0.13243,	// cs2	45
    0.125 		// c2	46
]

const scales = [];
// D pentatonic major
// scale[1] = {"a5","fs5","e5","d5","b4","a4","fs4","e4","d4","b3","a3","fs3","e3","d3","b2","a2"}
scales[0] = [1, 4, 6, 8, 11, 13, 16, 18, 20, 23, 25, 28, 30, 32, 35, 37];
// D pentatonic minor
// scale[2] = {"d5","c5","a4","g4","f4","d4","c4","a3","g3","f3","d3","c3","a2","g2","f2","d2"}
scales[1] = [8, 10, 13, 15, 17, 20, 22, 25, 27, 29, 32, 34, 37, 39, 41, 44];
// C major
// scale[3] = {"c5","b4","a4","g4","f4","e4","d4","c4","b3","a3","g3","f3","e3","d3","c3","b2"}
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
    context: null,
    compressor: null,
    gain: null,
    analyser: null,
    analyser_times: null,
    analyser_freqs: null,
    play: 0 | false,
    volume: 0 | 5, // [0-100]
    piano_grid: [[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0],[0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0]],        
    bass_grid: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0]],    
    misc_grid: [[0,1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,0],[0,1,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,1,0,0],[1,0,0,0],[0,0,1,0],[0,0,0,0],[0,1,0,0],[1,0,0,0],[0,0,0,0],[0,0,0,0]],
    piano_gain: null,
    bass_gain: null,    
    misc_gain: null,
    piano_volume: 0 | 50, // [0-100]
    bass_volume: 0 | 80, // [0-100]
    misc_volume: 0 | 100, // [0-100]
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
_trix_panel.wait = _trix_panel.tempo[_trix_panel.tempo_index];

function volume_to_gain(volume) {
    const volume_float = volume / 100;
    // > (Math.exp(0.01)-1)/(Math.E-1)
    // 0.005848963143130564
    const gain = (Math.exp(volume_float) - 1) / (Math.E - 1);
    return gain;
}

/** pass grid width, height (in cells), cell dim (in pixels), values (array of columns) */
function draw_trix_grid(w, h, dim, values) {
    const peek = ui.layout_peek();
    const rect = ui.layout_translated(Rectangle(0, 0, dim * w, dim * h));
    uidraw.rectangle(rect, uidraw.normal_back);

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            if ((x >= 0 && x < 4) || (x >= 8 && x < 12)) {
                uidraw.rectangle(Rectangle(rect[_x] + x * dim + 1, rect[_y] + y * dim + 1, dim - 2, dim - 2), Color(36 + 18 + 9, 36 + 18 + 9, 36 + 18 + 9, 255));
            } else {
                uidraw.rectangle(Rectangle(rect[_x] + x * dim + 1, rect[_y] + y * dim + 1, dim - 2, dim - 2), Color(36 + 9 + 9, 36 + 9 + 9, 36 + 9 + 9, 255));
            }
            if (values[x][y]) {
                let color_on;
                if (x == _trix_panel.play_x) {
                    color_on = uidraw.activating_face;
                } else {
                    color_on = uidraw.accent;
                }
                uidraw.rectangle(Rectangle(rect[_x] + x * dim + 1, rect[_y] + y * dim + 1, dim - 2, dim - 2), color_on);
            }
        }
    }
    
    uidraw.rectangle_outline(uidraw.rectangle_dilate(Rectangle(rect[_x] + _trix_panel.play_x * dim, peek[_y], dim, dim * h), 3), Color(0, 0, 0, 255));
    uidraw.push_linewidth(2);
    uidraw.rectangle_outline(uidraw.rectangle_dilate(Rectangle(rect[_x] + _trix_panel.play_x * dim, peek[_y], dim, dim * h), 2), Color(128, 128, 128, 255));
    uidraw.pop_linewidth();
    //uidraw.rectangle(uidraw.rectangle_erode(Rectangle(peek[_x] + _trix_panel.play_x * dim, peek[_y], dim, dim * 16), 1), Color(255,255,255,255));    
}

function do_trix_grid(uiid, w, h, dim, values) {
    draw_trix_grid(w, h, dim, values);
    do_trix_grid_nodraw(uiid, w, h, dim, values);
}

function do_trix_grid_nodraw(uiid, w, h, dim, values) {

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'previous_drag_x': null,
            'previous_drag_y': null,
        });
    };

    const peek = ui.layout_peek();
    ui.add_hotspot(uiid, Rectangle(peek[_x], peek[_y], dim * w, dim * h));
    const ox = 0 | peek[_x];
    const oy = 0 | peek[_y];

    let x = 0 | (ui.driver.GetCursorX() - ox) / dim;
    let y = 0 | (ui.driver.GetCursorY() - oy) / dim;

    const cell_clicked = ui.state.item_went_down == uiid;
    const cell_clicked_right = ui.state.item_went_down_right == uiid;

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

    if (cell_dragged || cell_clicked) {
        values[x][y] = 0 | _trix_panel.grid_edit_tool == 0;
        state.previous_drag_x = x;
        state.previous_drag_y = y;
    }

    if (cell_dragged_right || cell_clicked_right) {
        values[x][y] = 0 | _trix_panel.grid_edit_tool == 1;
        state.previous_drag_x = x;
        state.previous_drag_y = y;
    }

    ui.layout_increment2(dim * w, dim * h);
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

        ui.layout_push(_horizontal); // play/pause/volume row
        ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        const buttons = ['pause', 'play'];
        for (var i = 0; i < buttons.length; i++) {
            const is_current = (i == 1 && _trix_panel.play) || (i == 0 && !_trix_panel.play);
            const button_text = buttons[i];
            _ = ui.checkbutton(uiid + '-playpause-buttons-' + i, button_text, Rectangle(0, 0, 100, 24), is_current, 28, 2);
            if (_[_changed] && _[_value]) {
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
        ui.layout_pop();

        ui.layout_increment2(140, 0);

        ui.layout_push(_horizontal);
        _ = ui.slider(uiid + '-slider-volume', Rectangle(0, 0, 200, 24), 0, 100, _trix_panel.volume, '');
        ui.label('volume', Rectangle(4, 0, 100, 20));
        if (_[_changed]) {
            _trix_panel.volume = _[_value];
            _trix_panel.gain.gain.value = volume_to_gain(_[_value]);
        }
        ui.layout_pop();
        ui.layout_pop();

        /*ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (var i = 0; i < _trix_panel.grid_edit_tools.length; i++) {
            const name = _trix_panel.grid_edit_tools[i];
            const is_current = name == _trix_panel.grid_edit_tools[_trix_panel.grid_edit_tool];
            _ = ui.checkbutton(uiid + '-grid_edit_tool-' + i + '-checkbutton', ' ' + name, Rectangle(0, 0, 30, 30), is_current);
            if (_[_changed] && _[_value]) {
                _trix_panel.grid_edit_tool = i;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();*/        
        
        const grid_w = dim * 16;
        const grid_w_left = 0 | grid_w/2;
        const grid_w_right = grid_w - grid_w_left;

        ui.layout_push(_horizontal)        
        ui.label('piano:', Rectangle(0, 0, grid_w_left, 24));
        _ = ui.slider(uiid + '-piano-volume', Rectangle(0, 12, grid_w_right, 12), 0, 100, _trix_panel.piano_volume, '');
        if (_[_changed]) {
            _trix_panel.piano_volume = _[_value];
            _trix_panel.piano_gain.gain.value = volume_to_gain(_[_value]);
        }

        ui.label('bass:', Rectangle(20, 0, grid_w_left, 24));
        _ = ui.slider(uiid + '-bass-volume', Rectangle(20, 12, grid_w_right, 12), 0, 100, _trix_panel.bass_volume, '');
        if (_[_changed]) {
            _trix_panel.bass_volume = _[_value];
            _trix_panel.bass_gain.gain.value = volume_to_gain(_[_value]);
        }
        ui.layout_pop();

        const bar_color = Color(255, 255, 255, 92);
        const peek = ui.layout_peek();
        ui.layout_push(_horizontal);

        do_trix_grid(uiid + '-piano-grid', 16, 16, dim, _trix_panel.piano_grid);

        ui.layout_increment2(20, 0);

        // --

        // -- 

        do_trix_grid(uiid + '-bass-grid', 16, 16, dim, _trix_panel.bass_grid);

        ui.layout_pop(); // dual horizontal grids

        ui.label('( edit cells with left and right mouse drag )', Rectangle(173, 0, 100, 20));

        ui.layout_push(_horizontal);
        ui.label('misc:', Rectangle(0, 0, 100, 24));
        _ = ui.slider(uiid + '-misc-volume', Rectangle(60, 12, grid_w_right, 12), 0, 100, _trix_panel.misc_volume, '');
        if (_[_changed]) {
            _trix_panel.misc_volume = _[_value];
            _trix_panel.misc_gain.gain.value = volume_to_gain(_[_value]);
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        do_trix_grid(uiid + '-misc-grid', 16, 4, dim, _trix_panel.misc_grid);

        ui.layout_increment2(20, 0);

        ui.layout_push(_vertical, 0);
        ui.label('tempo', Rectangle(0, 0, 200, dim));
        _ = ui.slider(uiid + '-slider-tempo', Rectangle(0, 0, 200, 20), 0, _trix_panel.tempo.length - 1, _trix_panel.tempo_index, '');
        if (_[_changed]) {
            _trix_panel.tempo_index = _[_value];
            _trix_panel.wait = _trix_panel.tempo[_trix_panel.tempo_index];
        }
        ui.label('scale', Rectangle(0, 0, 200, dim));
        ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (var i = 0; i < scales.length; i++) {
            const is_current = i == _trix_panel.scale_index;
            const button_text = i + '';
            _ = ui.checkbutton(uiid + '-scale-button-' + i, button_text, Rectangle(0, 0, 40, dim), is_current, 14, 0);
            if (_[_changed] && _[_value]) {
                _trix_panel.scale_index = i;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();
        ui.layout_pop(); // right half or misc-grid row
        ui.layout_pop(); // misc-grid row's container

        ui.layout_increment2(0, 20);        

        // analyser graph        
        const graph_w = dim * 16 * 2 + 20;
        const graph_h = 100;
        sample_trix_analyser();
        uidraw.rectangle(ui.layout_translated(Rectangle(0, 0, graph_w, graph_h)), uidraw.normal_back);
        do_analyser_graph(uiid - '-analyser-graph', Rectangle(0, 0, graph_w, graph_h), _trix_panel.analyser_freqs, _trix_panel.analyser_times);

        ui.label('advanced:', Rectangle(0,0,200,20));
        ui.layout_push(_horizontal);
        _ = ui.slider(uiid + '-schedule-notes-ahead-slider', Rectangle(0,0,200,20), 0, 8, _trix_panel.schedule_notes_ahead, '');
        if (_[_changed]) {
            _trix_panel.schedule_notes_ahead = _[_value];
        }                
        ui.label('schedule '+_trix_panel.schedule_notes_ahead+' notes ahead', Rectangle(4,0,200,20));
        ui.layout_pop();

        //-----------------------------------------------------------------------------------------

        if (_trix_panel.play) {
            trix_play();
        }
    }
    do_panel_end(uiid);
}

function trix_play_column(x, time) {
    const scale = scales[_trix_panel.scale_index];
    //const dest = _trix_panel.gain;

    // all notes in col start play now
    for (let y = 0; y < 16; y++) {
        if (_trix_panel.piano_grid[x][y]) {                    
            const piano_rate = freq[scale[y]];
            play_sample('piano.ogg', _trix_panel.piano_gain, time, piano_rate);
        }
        if (_trix_panel.bass_grid[x][y]) {
            const bass_rate = freq[scale[y]];
            play_sample('bass.ogg', _trix_panel.bass_gain, time, bass_rate);
        }
    }
    const misc_keys = ['kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg'];
    for (let y = 0; y < 4; y++) {
        if (_trix_panel.misc_grid[x][y]) {
            const key = misc_keys[y];
            play_sample(key, _trix_panel.misc_gain, time, 1);
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

function play_sample(key, output_node, time, rate) {
    //console.assert(_fetched_audio[key]);
    //console.log(key, time);
    const source = _trix_panel.context.createBufferSource();
    source.buffer = _fetched_audio[key];
    source.playbackRate.value = rate;
    source.connect(output_node);
    source.start(time);
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function do_ui_audio() {
    const row_x0 = 240;
    const row_y0 = 90;

    const expanded = !is_touch_device();

    if (_tone_panel.context) {
        do_trix_panel('trix panel', row_x0, row_y0, true, expanded);
        do_tone_panel('tone panel', row_x0 + 727, row_y0, true, true && expanded);
    } else {
        if (AudioContext) {
            _tone_panel.context = new AudioContext();
            _tone_panel.gain1 = _tone_panel.context.createGain();
            _tone_panel.analyser1 = _tone_panel.context.createAnalyser();
            //_tone_panel.analyser1.smoothingTimeConstant = 0.8; // 0.8 default
            _tone_panel.analyser1.fftSize = 512;    
            _tone_panel.analyser1_times = new Uint8Array(_tone_panel.analyser1.frequencyBinCount);
            _tone_panel.analyser1_freqs = new Uint8Array(_tone_panel.analyser1.frequencyBinCount);    

            _trix_panel.context = new AudioContext();
            _trix_panel.gain = _trix_panel.context.createGain();
            _trix_panel.gain.gain.value = volume_to_gain(_trix_panel.volume);
            _trix_panel.piano_gain = _trix_panel.context.createGain();
            _trix_panel.piano_gain.gain.value = volume_to_gain(_trix_panel.piano_volume);
            _trix_panel.bass_gain = _trix_panel.context.createGain();
            _trix_panel.bass_gain.gain.value = volume_to_gain(_trix_panel.bass_volume);
            _trix_panel.misc_gain = _trix_panel.context.createGain();
            _trix_panel.misc_gain.gain.value = volume_to_gain(_trix_panel.misc_volume);            
            _trix_panel.compressor = _trix_panel.context.createDynamicsCompressor();

            _trix_panel.analyser = _trix_panel.context.createAnalyser();
            //_trix_panel.analyser.smoothingTimeConstant = 0.8; // 0.8 default
            _trix_panel.analyser.fftSize = 512;

            _trix_panel.analyser_times = new Uint8Array(_trix_panel.analyser.frequencyBinCount);
            _trix_panel.analyser_freqs = new Uint8Array(_trix_panel.analyser.frequencyBinCount);

            // connect individual grid gains to master gain
            _trix_panel.piano_gain.connect(_trix_panel.gain);
            _trix_panel.bass_gain.connect(_trix_panel.gain);
            _trix_panel.misc_gain.connect(_trix_panel.gain);

            // RIGHT
            _trix_panel.gain.connect(_trix_panel.compressor);
            _trix_panel.compressor.connect(_trix_panel.analyser);
            _trix_panel.analyser.connect(_trix_panel.context.destination);

            const audio_files = ['piano.ogg', 'bass.ogg', 'kick.ogg', 'snare.ogg', 'hat.ogg', 'ride.ogg'];
            for (let i = 0; i < audio_files.length; i++) {
                fetch_audio(audio_files[i]);
            }
        } else {
            do_message_panel('audio error', row_x0, row_y0, true, true, 'AudioContext unavailable.');
        }
    }
}