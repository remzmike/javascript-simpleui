import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded) {

    const debug_draw = false;
    const debug_color = Color(0, 200, 200, 127);
    const debug_color2 = Color(200, 200, 0, 127);

    console.assert(first_x, 'do_panel_begin: first_x required');
    console.assert(first_y, 'do_panel_begin: first_y required');
    if (first_visible == null) first_visible = true;
    if (first_expanded == null) first_expanded = true;

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'uiid': uiid,
            'rect': Rectangle(first_x, first_y, 1, 1),
            'visible': 0 | first_visible,
            'expanded': 0 | first_expanded
        });
    };

    let rect = state.rect;

    let vlayout = ui.layout_push(_vertical, app.panel_layout_padding, rect[_x], rect[_y]); // pops in *_end    

    if (!state.visible) return state;

    let x = rect[_x];
    let y = rect[_y];

    let dilate = 20;
    let bar_height = 24;

    let handle_w;
    if (state.expanded) {
        handle_w = 0 | (rect[_w] + dilate * 2 - bar_height);
    } else {
        handle_w = 0 | 200;
    }

    // todo: later: push_id('handle');
    // or: next_id('-handle'); etc.

    let inner = ui.layout_push(_none, vlayout[_padding], vlayout[_x] - dilate, vlayout[_y] - dilate - bar_height);
    {
        if (state.expanded) {
            let back_rect = Rectangle(inner[_x], inner[_y], rect[_w] + dilate * 2, rect[_h] + dilate * 2 + bar_height);
            let back_rect_d1 = uidraw.rectangle_dilate(back_rect, 1);
            let back_rect_e1 = uidraw.rectangle_erode(back_rect, 1);
            uidraw.rectangle(back_rect, panel_color2);
            uidraw.rectangle(back_rect_e1, panel_color1);
        }

        let glyph = state.expanded ? 'v' : '>';
        let text_width = 10; // hax
        let text_ox = 0 | (bar_height / 2 - text_width / 2); // (bar_height/2)-(text_width/2);
        let text_oy = 0 | (text_ox / 2);

        const _button = ui.checkbutton(uiid + '-button', glyph, Rectangle(0, 0, bar_height, bar_height), state.expanded, text_ox, text_oy);
        const _handle = ui.handle(uiid + '-handle', Rectangle(bar_height, 0, handle_w, bar_height), x, y);

        ui.label(uiid, Rectangle(bar_height + 10, 0, handle_w + dilate, bar_height));

        // panel bg
        if (state.expanded) {
            if (rect) {
                let rect0 = Rectangle(rect[_x], rect[_y], rect[_w], rect[_h]);
                let rect1 = uidraw.rectangle_dilate(rect0, dilate);
                let rect2 = uidraw.rectangle_dilate(rect0, dilate - 1);

                //uidraw.rectangle(rect1, Color(255,0,0,255));
                //uidraw.rectangle(rect1, panel_color2);                
                //uidraw.rectangle(rect2, panel_color1);

                ui.add_hotspot(uiid + '-bg-hotspot', rect1);
            }
        }

        if (_button[_changed]) {
            state.expanded = 0 | !state.expanded;
        }
        if (_handle[_changed]) {
            state.rect[_x] = 0 | _handle[_delta_x];
            state.rect[_y] = 0 | _handle[_delta_y];
        }

    }

    if (debug_draw) {
        // draw xy indicator
        uidraw.rectangle(Rectangle(x - 4, y - 4, 8, 8), debug_color2);

        // draw layout origin
        let layout = ui.layout_peek();
        let absolute_rect = Rectangle(layout[_x] - 2, layout[_y] - 2, 4, 4);
        uidraw.rectangle(absolute_rect, debug_color);

        //ui.label('first xy', Rectangle(0, 0, 100, 40), debug_color);
    }

    ui.layout_pop(); // inner

    return state;
}

function do_panel_end(uiid) {
    let state = ui.get_state(uiid);
    if (state.visible && state.expanded) {
        console.assert(state); // should have been created in _begin
        const layout = ui.layout_peek();
        state.rect[_w] = layout[_totalw];
        state.rect[_h] = layout[_totalh];
    }
    ui.layout_pop(); // popping the layout created in do_panel_begin
}

export {
    do_panel_begin,
    do_panel_end
};