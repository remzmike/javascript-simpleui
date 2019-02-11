import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

const ColorP = ui.ColorP;
const Rectangle = ui.Rectangle;
const RectangleP = ui.RectangleP;

// how does panel module know when it's a new frame?
// need to know new frame so i can reset the collapsed item count to 0

// these are set in _begin and checked in _end
// it's important to handle events at end of _end
let _button;
let _handle;

const panel_pad = 0 | 20;
const bar_height = 0 | 24;
const debug_draw = 0 | false;
const text_width = 0 | 10; // hax
const text_ox = 0 | (bar_height / 2 - text_width / 2);
const text_oy = 0 | (text_ox / 2);

function do_collapsed(uiid, rect, state) {
    let collapsed_x = 0 | 200 + ui.state.collapsed_panel_index * 224;
    let collapsed_y = 0 | 1;

    // handle is positioned left 1 pixel so border overlaps with collapse button, so width needs +1
    const handle_w = 0 | 200 + 1; // this 200 needs to be configureable
    const glyph = 'v';
    let x = rect.x;
    let y = rect.y;

    // collapsed layout
    ui.layout_push(_none, 0, collapsed_x, collapsed_y);
    {
        // draw background bar before first collapsed panel
        if (ui.state.collapsed_panel_index == 0) {
            uidraw.rectangle(RectangleP(200, 0, canvas.width - 200, 25), uidraw.panel_color);
        }

        const uiid_handle = uiid + '-handle';
        _button = ui.checkbutton(uiid + '-button', glyph, RectangleP(0, 0, bar_height, bar_height), state.expanded, text_ox, text_oy);

        const hrect = RectangleP(bar_height - 1, 0, handle_w, bar_height);
        _handle = ui.handle(uiid_handle, hrect, x, y);

        ui.label(uiid, RectangleP(bar_height + 10, 0, handle_w + panel_pad, bar_height));

    }
    ui.layout_pop();

    ui.state.collapsed_panel_index++;
}

function do_expanded(uiid, rect, state) {

    ui.layout_push(_none); // breakout of whatever layout we might be in (absolute positioning)

    let x = 0 | rect.x;
    let y = 0 | rect.y;

    // todo: later: push_id('handle');
    // or: next_id('-handle'); etc.

    let bar_layout = ui.layout_push(_horizontal, -1, x, y); // app.panel_layout_padding
    {
        // background        
        let back_rect = RectangleP(bar_layout.x, bar_layout.y, rect.w + panel_pad * 2, rect.h + panel_pad * 2 + bar_height);
        let back_rect1 = uidraw.rectangle_erode(back_rect, 1);
        uidraw.rectangle_soft(back_rect, uidraw.normal_back);
        uidraw.rectangle_soft(back_rect1, uidraw.panel_color);

        //let rect1 = uidraw.rectangle_panel_pad(rect, panel_pad);
        ui.add_hotspot(uiid + '-bg-hotspot', back_rect);

        _button = ui.checkbutton(uiid + '-button', '-', RectangleP(0, 0, bar_height, bar_height), state.expanded, text_ox, text_oy);

        const handle_w = 0 | (rect.w + panel_pad * 2 - bar_height) + 1;
        const handle_rect = RectangleP(0, 0, handle_w, bar_height);
        const uiid_handle = uiid + '-handle';
        _handle = ui.handle(uiid_handle, handle_rect, x, y);

        //ui.label(uiid, Rectangle(bar_height + 10, 0, handle_w + panel_pad, bar_height));
        const label_rect = RectangleP(x + bar_height + 8, y, handle_w + panel_pad, bar_height);
        uidraw.label(uiid, uidraw.vertical_center_text(label_rect), ColorP(255, 255, 255, 255));
    }
    ui.layout_pop(); // bar_layout

    const padding = 2; // app.panel_layout_padding
    ui.layout_push(_vertical, padding, x + panel_pad, y + bar_height + panel_pad); // content layout

    if (debug_draw) {
        const debug_color = ColorP(0, 200, 200, 127);
        const debug_color2 = ColorP(200, 200, 0, 127);

        // draw xy indicator
        uidraw.rectangle(RectangleP(x - 4, y - 4, 8, 8), debug_color2);

        // draw layout origin
        let layout = ui.layout_peek();
        let absolute_rect = RectangleP(layout.x - 2, layout.y - 2, 4, 4);
        uidraw.rectangle(absolute_rect, debug_color);

        //ui.label('first xy', Rectangle(0, 0, 100, 40), debug_color);
    }

}

function do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded) {
    console.assert(first_x != null, 'do_panel_begin: first_x required');
    console.assert(first_y != null, 'do_panel_begin: first_y required');
    //if (first_visible == null) first_visible = true;
    if (first_expanded == null) first_expanded = true;

    //uidraw.label('#' + ui.state.collapsed_panel_index, Point(200, 20*ui.state.collapsed_panel_index), Color(255,255,255,255));    

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'uiid': uiid,
            'rect': Rectangle(first_x, first_y, 1, 1),
            'visible': 0 | true, //first_visible,
            'expanded': 0 | first_expanded
        });
    }

    if (state.expanded) {
        do_expanded(uiid, state.rect, state);
    } else {
        do_collapsed(uiid, state.rect, state);
    }

    return state;
}

function do_panel_end(uiid) {
    const state = ui.get_state(uiid);

    if (state.expanded) {
        const peek = ui.layout_peek();
        ui.layout_pop(); // content layout

        if (state.visible) {
            console.assert(state); // should have been created in _begin            
            state.rect.w = 0 | peek.totalw; // idk: nolive, panels are jank cuz i was bad, fixing
            state.rect.h = 0 | peek.totalh;
            // this means one frame of latency between content updates and panel autosizing
        }

        ui.layout_pop(); // none layout
    }

    // state changes last
    if (state.expanded) {
        if (_button.changed) {
            state.expanded = 0 | false;
        }
        if (_handle.changed) {
            state.rect.x = 0 | _handle.x1;
            state.rect.y = 0 | _handle.y1;
        }
    } else {
        if (_button.changed) {
            state.expanded = 0 | true;
        }
        if (_handle.changed) {
            // if they click collapsed handle, panel expands
            state.expanded = 0 | true;
            // cancel item_held when they do this... *shrug* (todo:later:architecture)
            const uiid_handle = uiid + '-handle';
            if (ui.state.item_held == uiid_handle) {
                ui.state.item_held = null;
            }
        }
    }
}

export {
    do_panel_begin,
    do_panel_end
};