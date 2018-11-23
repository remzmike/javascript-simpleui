import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

/* ------------------------------------------------------------------ */
let _gridfonts = {
    'hint-four': {}
}
let _letters = 'abcdefghijklmnopqrstuvwxyz';
let _f = _gridfonts['hint-four'];
// list of segments, each segment is a standalone stroke from x1,y1 to x2,y2
_f[' '] = [];
_f.a = [[0, 2, 1, 2], [1, 2, 2, 3], [2, 3, 1, 4], [1, 4, 0, 3], [0, 3, 1, 3]];
_f.b = [[0, 0, 0, 1], [0, 1, 0, 2], [0, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 3], [2, 3, 1, 2]];
_f.c = [[1, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 4]];
_f.d = [[2, 0, 2, 1], [2, 1, 2, 2], [2, 2, 2, 3], [2, 3, 1, 4], [1, 4, 0, 3], [0, 3, 1, 2]];
_f.e = [[1, 3, 2, 3], [2, 3, 1, 2], [1, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 4]];
_f.f = [[2, 0, 1, 1], [1, 1, 1, 2], [1, 2, 1, 3], [1, 3, 1, 4], [0, 2, 1, 2]];
_f.g = [[1, 4, 0, 3], [0, 3, 1, 2], [1, 2, 2, 3], [2, 3, 2, 4], [2, 4, 2, 5], [2, 5, 1, 6]];
_f.h = [[0, 0, 0, 1], [0, 1, 0, 2], [0, 2, 0, 3], [0, 3, 1, 2], [1, 2, 2, 3], [2, 3, 2, 4]];
_f.i = [[1, 2, 1, 3], [1, 3, 1, 4], [1, 1, 2, 0]];
_f.j = [[1, 2, 1, 3], [1, 3, 1, 4], [1, 4, 1, 5], [1, 5, 0, 6], [1, 1, 2, 0]];
_f.k = [[0, 0, 0, 1], [0, 1, 0, 2], [0, 2, 0, 3], [0, 3, 1, 3], [1, 3, 2, 2], [1, 3, 2, 4]];
_f.l = [[1, 0, 1, 1], [1, 1, 1, 2], [1, 2, 1, 3], [1, 3, 2, 4]];
_f.m = [[0, 4, 0, 3], [0, 3, 1, 2], [1, 2, 2, 3], [2, 3, 2, 4], [1, 3, 1, 4]];
_f.n = [[0, 4, 0, 3], [0, 3, 1, 2], [1, 2, 2, 3], [2, 3, 2, 4]];
_f.o = [[0, 2, 1, 2], [1, 2, 2, 3], [2, 3, 1, 4], [1, 4, 0, 3]];
_f.p = [[0, 6, 0, 5], [0, 5, 0, 4], [0, 4, 0, 3], [0, 3, 1, 2], [1, 2, 2, 3], [2, 3, 1, 4]];
_f.q = [[2, 6, 2, 5], [2, 5, 2, 4], [2, 4, 2, 3], [2, 3, 1, 2], [1, 2, 0, 3], [0, 3, 1, 4]];
_f.r = [[0, 4, 0, 3], [0, 3, 1, 2], [1, 2, 2, 2]];
_f.s = [[1, 2, 0, 3], [0, 3, 1, 3], [1, 3, 2, 3], [2, 3, 1, 4], [1, 4, 0, 4]];
_f.t = [[1, 1, 1, 2], [1, 2, 1, 3], [1, 3, 1, 4], [1, 4, 2, 3], [0, 2, 1, 2]];
_f.u = [[0, 2, 0, 3], [0, 3, 0, 4], [0, 4, 1, 4], [1, 4, 2, 3], [2, 3, 2, 2]];
_f.v = [[0, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 3], [2, 3, 2, 2]];
_f.w = [[0, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 3], [2, 3, 2, 2], [1, 2, 1, 3]];
_f.x = [[0, 2, 1, 3], [1, 3, 2, 4], [2, 2, 1, 3], [1, 3, 0, 4]];
_f.y = [[0, 2, 0, 3], [0, 3, 1, 4], [1, 4, 2, 3], [2, 3, 2, 4], [2, 4, 2, 5], [2, 5, 1, 6]];
_f.z = [[1, 2, 2, 2], [2, 2, 1, 3], [1, 3, 0, 4], [0, 4, 1, 4], [1, 4, 2, 4]];

let _gridfont_gradient = make_drawbox_gradient(
    context,
    400, 400,
    1000, 1000,
    Color(0x00, 0xB5, 0xE3, 255),
    Color(255, 0, 255, 255)
);

//global init
let _gridfont_chars_a = 'abcdefghijklmnopqrstuvwxyz '.split('');
let _gridfont_chars = {};
for (let i = 0; i < _gridfont_chars_a.length; i++) {
    _gridfont_chars[_gridfont_chars_a[i]] = 0 | true;
}

// http://cogsci.indiana.edu/gridfonts.html
// see also: hershey fonts: http://sol.gfxile.net/hershey/fontprev.html
function do_gridfont(uiid, s, name, x, y, scale, reset) {
    m_v8.assert_smi(reset);
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(scale);
    m_v8.assert_smi(reset);
    let a = s.split('');
    let complete = 0 | true;
    let reset_complete = 0 | true;

    context.lineWidth = 1;    

    context.strokeStyle = _gridfont_gradient;

    for (let i = 0; i < a.length; i++) {
        let letter = a[i];
        if (!_gridfont_chars[letter]) {
            letter = ' ';
        }
        const x_letter = 0 | (x + i * (scale * 3));
        const _ = do_gridfont_letter(uiid + '-letter-' + str(i), name, x_letter, y, letter, scale, reset);
        complete = complete && _[_complete];
        reset_complete = reset_complete && _[_reset_complete];
    }

    context.strokeStyle = uidraw.default_line_color;
    context.lineWidth = 1;    

    return [complete, reset_complete];
}

function do_gridfont_letter(uiid, name, x, y, letter, scale, reset) {
    m_v8.assert_smi(x);
    m_v8.assert_smi(y);
    m_v8.assert_smi(scale);
    console.assert(name);
    console.assert(letter);
    console.assert(reset != null);
    console.assert(reset != undefined);

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, [
            0 | false,
            0 | false,
            0 | 1,
            0 | 0
        ]);
    };

    const fl = _f[letter]; // font letter

    const segment = state[_segment];
    let partial = state[_partial];

    // opengl and canvas...
    // so i have perf issue here
    // draw_line is bad because in canvas it's better to stroke a complex path than many small paths
    // so that optimization should be possible with the api..
    // reset_line_batch()
    // draw_line_batch()
    // but.. wondering about what this means for opengl drivers...
    // ... if both drivers allow (or can allow lineto/moveto for multi segment paths)
    // (does pixi's shader-based canvas-like api allow moveto/lineto?) A: YES, it does...
    // so my drive could do lineto/moveto at least for now since it seems reasonable to do it with webgl shader api
    
    // draw lines up to segment count
    // sometimes segment is > fl.length due to prev frame    
    if (segment <= fl.length) {
        for (let i = 0; i < segment; i++) {    
            let a1 = 0 | fl[i][0];
            let b1 = 0 | fl[i][1];
            let a2 = 0 | fl[i][2];
            let b2 = 0 | fl[i][3];
            let x1 = 0 | ( x + (a1 * scale) );
            let y1 = 0 | ( y + (b1 * scale) );
            let x2 = 0 | ( x + (a2 * scale) );
            let y2 = 0 | ( y + (b2 * scale) );
            draw_line(x1, y1, x2, y2);
        }
    }
    // now draw current line... over multiple frames...
    // when complete then increment segment...
    if (segment < fl.length) {
        let i = segment;
        let a1 = 0 | fl[i][0];
        let b1 = 0 | fl[i][1];
        let a2 = 0 | fl[i][2];
        let b2 = 0 | fl[i][3];
        let x1 = 0 | (x + (a1 * scale));
        let y1 = 0 | (y + (b1 * scale));
        let x2 = 0 | (x + (a2 * scale));
        let y2 = 0 | (y + (b2 * scale));
        let dx = 0 | (x2 - x1);
        let dy = 0 | (y2 - y1);

        let p1 = 0 | (x1 + dx * partial / 10);
        let p2 = 0 | (y1 + dy * partial / 10);
        draw_line(x1, y1, p1, p2);

        // i promoted partial from float to int, so new partial 1 == old partial 0.1
        // this means some of the logic changes from 1 to 10, and i divide by 10 for local calcs
        // the goal is to avoid float, avoid deopt, avoid heap
        state[_partial] = 0 | (state[_partial] + 1); //0.033 * 3;
        partial = state[_partial]; // blah.

        if (partial >= 10) {
            /*let leftover = partial - 10;
            if (leftover > 0) {
                // later: leftovers! :-)
            }*/
            state[_partial] = 0 | 0;
            state[_segment] = 0 | (state[_segment] + 1);
        }
    }

    console.assert(state.length == 4);
    m_v8.assert_smi(state[_segment]);
    m_v8.assert_smi(state[_partial]);
    m_v8.assert_smi(state[_complete]);
    m_v8.assert_smi(state[_reset_complete]);

    // keeping these out of an if block to avoid weird jit deopt
    state[_segment] = reset ? 0 | 1 : state[_segment];
    state[_partial] = reset ? 0 | 0 : state[_partial];
    state[_reset_complete] = reset ? 0 | true : state[_reset_complete];

    state[_complete] = 0 | (segment >= fl.length);

    m_v8.assert_smi(state[_segment]);
    m_v8.assert_smi(state[_partial]);
    m_v8.assert_smi(state[_complete]);
    m_v8.assert_smi(state[_reset_complete]);

    return state;
}

export {
    do_gridfont
};