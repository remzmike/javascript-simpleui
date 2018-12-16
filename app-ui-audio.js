const _ui_audio = {
    context: null,
    tone_point: Point(200, 200),
    freq_range: 1200,    
    osc1: null,
    osc1_started: 0 | false,
    osc1_type_index: 0,
    osc_types: ['sine', 'square', 'sawtooth', 'triangle'],
    volume: 10, // [0-100]
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
    if (_ui_audio.play_file_requested) {
        //return;            
    } else {        
        _ui_audio.play_file_requested = 0 | true;
        _ui_audio.play_file_request_time = Date.now();            

        window.fetch(url)
        .then(response => response.arrayBuffer())
        .then(array_buffer => _ui_audio.context.decodeAudioData(array_buffer))
        .then(audio_buffer => {
            _ui_audio.play_pending = 0 | true;
            _ui_audio.play_buffer = audio_buffer;                
        });
        //return;
    }
}

function play() {

    if (!_ui_audio.play_buffer) {

        load_and_play('Yodel_Sound_Effect.mp3');

    } else {

        console.assert(_ui_audio.play_buffer);
    
        // a source object can only be .start()'ed once
        // so you have to make one every time you want to play a sound
        _ui_audio.source1 = _ui_audio.context.createBufferSource();
        _ui_audio.source1.buffer = _ui_audio.play_buffer;
            
        _ui_audio.play_pending = 0 | false;
    
        _ui_audio.analyser1 = _ui_audio.context.createAnalyser();
        _ui_audio.analyser1.smoothingTimeConstant = 0.8; // 0.8 default
        _ui_audio.analyser1.fftSize = 1024;
        
        _ui_audio.analyser1_times = new Uint8Array(_ui_audio.analyser1.frequencyBinCount);
        _ui_audio.analyser1_freqs = new Uint8Array(_ui_audio.analyser1.frequencyBinCount);
    
        _ui_audio.gain1.gain.value = get_volume();
    
        _ui_audio.source1.connect(_ui_audio.analyser1);    
        _ui_audio.analyser1.connect(_ui_audio.gain1);
        _ui_audio.gain1.connect(_ui_audio.context.destination);
    
        _ui_audio.source1.start(); // cannot call this more than once per source object, yadoink
    
        _ui_audio.sound_playing = 0 | true;    
    }
}

function get_volume() {
    const volume2 = _ui_audio.tone_point[_y] / _ui_audio.freq_range;
    const final_volume = (_ui_audio.volume / 100) * volume2;
    return final_volume;
}

function start_tone() {
    console.log('[start_tone]');
    const frequency = _ui_audio.tone_point[_x];
    const osc1_type = _ui_audio.osc_types[_ui_audio.osc1_type_index];

    // i guess i need this for now?
    if (_ui_audio.osc1_started) {
        _ui_audio.osc1.stop();
        _ui_audio.osc1_started = 0 | false;
    }

    _ui_audio.osc1 = _ui_audio.context.createOscillator();
    _ui_audio.conv1 = _ui_audio.context.createConvolver();

    _ui_audio.analyser1 = _ui_audio.context.createAnalyser();
    _ui_audio.analyser1.smoothingTimeConstant = 0.8; // 0.8 default
    _ui_audio.analyser1.fftSize = 1024;

    _ui_audio.analyser1_times = new Uint8Array(_ui_audio.analyser1.frequencyBinCount);
    _ui_audio.analyser1_freqs = new Uint8Array(_ui_audio.analyser1.frequencyBinCount);

    _ui_audio.osc1.type = osc1_type;
    _ui_audio.osc1.frequency.value = frequency;
    
    _ui_audio.gain1.gain.value = get_volume();

    // hmph, connecting things correctly matters xd
    _ui_audio.osc1.connect(_ui_audio.analyser1);
    _ui_audio.analyser1.connect(_ui_audio.gain1);
    _ui_audio.gain1.connect(_ui_audio.context.destination);

    _ui_audio.osc1.start(0);
    _ui_audio.osc1_started = 0 | true;
}

function stop_tone() {
    if (_ui_audio.osc1_started) {
        _ui_audio.osc1.stop(0);
    }
    _ui_audio.osc1_started = 0 | false;
}

let start_tone_limited = ui.throttle(start_tone, _ui_audio.throttle);

function reset_tone() {
    start_tone_limited = ui.throttle(start_tone, _ui_audio.throttle);

    if (_ui_audio.osc1_started) {
        stop_tone();
        start_tone_limited();
    }
}

function sample_analyser() {
    _ui_audio.analyser1.getByteFrequencyData(_ui_audio.analyser1_freqs);
    _ui_audio.analyser1.getByteTimeDomainData(_ui_audio.analyser1_times);
}

function do_sound_panel(uiid, first_x, first_y, first_visible, first_expanded) {
    let _;
    let _changed = 0 | false;
    let panel = do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded);
    if (panel.visible && panel.expanded) {

        ui.layout_push(_horizontal);
        _ = ui.slider(uiid + '-slider-volume', Rectangle(0, 0, 200, 20), 0, 100, _ui_audio.volume, '');
        ui.label('volume', Rectangle(0,0,200,20));
        if (_[_changed]) {
            _ui_audio.volume = _[_value];
            reset_tone();
        }
        ui.layout_pop();

        ui.layout_push(_horizontal);
        _ = ui.slider(uiid + '-slider-throttle', Rectangle(0, 0, 200, 20), 0, 1000, _ui_audio.throttle, '');
        ui.label('throttle', Rectangle(0,0,200,20));
        if (_[_changed]) {
            _ui_audio.throttle = _[_value];
            reset_tone();
        }
        ui.layout_pop();

        ui.layout_push(_horizontal, -1);
        ui.group_buttons_begin();
        for (var i = 0; i < _ui_audio.osc_types.length; i++) {
            const iter_type = _ui_audio.osc_types[i];
            const osc1_type = _ui_audio.osc_types[_ui_audio.osc1_type_index];
            const is_checked = iter_type == osc1_type;
            _ = ui.checkbutton(uiid + '-osc_type_button-' + iter_type, iter_type, Rectangle(0, 0, 80, 24), is_checked);
            if (_[_changed] && _[_value]) {
                _ui_audio.osc1_type_index = i;
                // dont relay change for osc1 type change unless currently playing
                _changed = 0 | _ui_audio.osc1_started;
            }
        }
        ui.group_buttons_end();
        ui.layout_pop();

        const peek = ui.layout_peek();
        const lx = peek[_x];
        const ly = peek[_y] + 300;

        _ = do_slider2d(uiid + '-slider2d', Rectangle(0, 0, 400, 400), 0, _ui_audio.freq_range, _ui_audio.tone_point);
        if (_[_changed]) {
            
            // these two lines are bad, slider2d should return what i need instead
            // _[_]
            const bg_uiid = uiid + '-slider2d-bg';
            const item_went_down = ui.state.item_went_down == bg_uiid;

            if (item_went_down || (_ui_audio.tone_point[_x] != _[_x1] || _ui_audio.tone_point[_y] != _[_y1])) {
                _ui_audio.tone_point[_x] = _[_x1];
                _ui_audio.tone_point[_y] = _[_y1];
                _changed = 0 | true;
            }
        }

        if (_changed) {
            start_tone_limited();
        }

        if (_ui_audio.analyser1 && _ui_audio.osc1_started || _ui_audio.sound_playing) {
            //uidraw.label(_ui_audio.analyser1_times.length + '', Point(0, 0));
            //uidraw.label(_ui_audio.analyser1_freqs.length + '', Point(0, 20));

            //console.log(_ui_audio.analyser1_times);
            //console.log(_ui_audio.analyser1_freqs);            

            sample_analyser();

            const data1 = _ui_audio.analyser1_freqs;
            const data2 = _ui_audio.analyser1_times;

            function asdf(uiid, rect, data1, data2) {
                if (data1.length == 0 || data2.length == 0) return;

                uidraw.push_linewidth(2);
                
                const draw_w = (400 - 2);
                const draw_h = 100;

                uidraw.begin_path();
                uidraw.push_strokestyle(make_css_color(uidraw.normal_back));
                let irange = data1.length;
                let vrange = 255;
                for (var i = 0; i < irange; i++) {
                    const v = data1[i];
                    const xpos = (i / irange) * draw_w;
                    const ypos = (v / vrange) * draw_h;
                    uidraw.move_to(lx + xpos + 2, ly + 400 - 300 - 1);
                    uidraw.line_to(lx + xpos + 2, ly + 400 - 300 - 1 - ypos);
                }
                uidraw.pop_strokestyle();
                uidraw.stroke();
                
                uidraw.begin_path();
                uidraw.push_strokestyle(make_css_color(uidraw.accent));
                irange = data2.length;
                vrange = 255; // later: just get data as floats and can remove this
                const ypos_start = (data2[0] / vrange) * 100;
                uidraw.move_to(lx + 2, ly + ypos_start);
                for (var i = 1; i < irange; i++) {
                    const v = data2[i];                
                    const xpos = (i / irange) * (400 - 2);
                    const ypos = (v / vrange) * 100;
                    uidraw.line_to(lx + xpos + 2, ly + ypos);
                }
                uidraw.pop_strokestyle();
                uidraw.stroke();    

                uidraw.pop_linewidth();
            }

            asdf(uiid-'-graph', Rectangle(), data1, data2);
        }

        // show this when (requested) -and- (no buffer -or- buffer was fetched in less than 1 second)
        if ( _ui_audio.play_file_requested && (!_ui_audio.play_buffer || (Date.now() - _ui_audio.play_file_request_time) < 1000)) {
            ui.label('audio file requested...', Rectangle(0,0,200,24));
        } else {
            _ = ui.button(uiid + '-button-yodel', 'play yodel mp3', Rectangle(0,0,200,24));
            if (_ui_audio.play_pending || _[_clicked]) {
                play(_ui_audio.source1);
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
        ui.label(message, Rectangle(0,0,200,20));
    }
    do_panel_end(uiid);
}

function do_ui_audio() {
    const row_x0 = 240;
    const row_y0 = 90;

    const expanded = !is_touch_device();

    if (_ui_audio.context) {
        do_sound_panel('tone panel', row_x0, row_y0, true, expanded);
    } else {        
        if (AudioContext) {
            _ui_audio.context = new AudioContext();
            _ui_audio.gain1 = _ui_audio.context.createGain();            
        } else {
            do_message_panel('audio error', row_x0, row_y0, true, true, 'AudioContext unavailable.');
        }
    }
}