import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

// how does panel module know when it's a new frame?
// need to know new frame so i can reset the collapsed item count to 0

function do_expanded(uiid, rect, state) { // move back to other func later
    const debug_draw = false;
    const debug_color = Color(0, 200, 200, 127);
    const debug_color2 = Color(200, 200, 0, 127);

    let vlayout = ui.layout_push(_vertical, app.panel_layout_padding, rect[_x], rect[_y]); // pops in *_end    

    //if (!state.visible) return state;    

    let dilate = 20;
    let bar_height = 24;

    let x = rect[_x];
    let y = rect[_y];

    let handle_w;
    if (state.expanded) {
        handle_w = 0 | (rect[_w] + dilate * 2 - bar_height);
    } else {
        handle_w = 0 | 200;
    }
    handle_w = handle_w + 1; // move handle left 1 pixel so border overlaps with collapse button, so width needs +1

    // todo: later: push_id('handle');
    // or: next_id('-handle'); etc.

    let inner = ui.layout_push(_none, vlayout[_padding], vlayout[_x] - dilate, vlayout[_y] - dilate - bar_height);
    {
        const is_expanded = state.expanded;
        const is_collapsed = !is_expanded;
        
        // draw panel
        let glyph = 'v';        
        if (state.expanded) {
            let back_rect = Rectangle(inner[_x], inner[_y], rect[_w] + dilate * 2, rect[_h] + dilate * 2 + bar_height);
            let back_rect1 = uidraw.rectangle_erode(back_rect, 1);
            uidraw.rectangle_soft(back_rect, uidraw.normal_back);
            uidraw.rectangle_soft(back_rect1, uidraw.panel_color);
            glyph = '-';
        }

        let text_width = 10; // hax
        let text_ox = 0 | (bar_height / 2 - text_width / 2);
        let text_oy = 0 | (text_ox / 2);
       
        let _button;
        let _handle;

        let collapsed_x = 200 + ui.state.collapsed_panel_index * 224;
        let collapsed_y = 1;

        if (is_expanded) {
            let rect1 = uidraw.rectangle_dilate(rect, dilate);
            ui.add_hotspot(uiid + '-bg-hotspot', rect1);
        }

        // collapsed layout: begin
        if (is_collapsed) ui.layout_push(_none, 0, collapsed_x, collapsed_y);

        // if this is the first collapsed panel, then also draw background bar
        if (is_collapsed && ui.state.collapsed_panel_index == 0) {
            uidraw.rectangle(Rectangle(200, 0, canvas.width-200, 25), uidraw.panel_color);
        }

        const uiid_handle = uiid + '-handle';
        _button = ui.checkbutton(uiid + '-button', glyph, Rectangle(0, 0, bar_height, bar_height), state.expanded, text_ox, text_oy);

        const hrect = Rectangle(bar_height - 1, 0, handle_w, bar_height);
        _handle = ui.handle(uiid_handle, hrect, x, y);
        
        ui.label(uiid, Rectangle(bar_height + 10, 0, handle_w + dilate, bar_height));        
        
        if (_button[_changed]) {
            state.expanded = 0 | !state.expanded;
        }

        // collapsed layout: end
        if (!is_expanded) { 
            ui.layout_pop();
            ui.state.collapsed_panel_index++;
        } 
                
        if (_handle[_changed]) {
            if (state.expanded) {
                state.rect[_x] = 0 | _handle[_x1];
                state.rect[_y] = 0 | _handle[_y1];
            } else {
                // if they click collapsed handle, panel expands
                state.expanded = 0 | !state.expanded;
                // cancel item_held when they do this... *shrug*
                if (ui.state.item_held == uiid_handle) {
                    ui.state.item_held = null;
                }
            }
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

function do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded) {    
    console.assert(first_x, 'do_panel_begin: first_x required');
    console.assert(first_y, 'do_panel_begin: first_y required');
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
    };

    let rect = state.rect;

    return do_expanded(uiid, rect, state); 
}

function do_panel_end(uiid) {
    let state = ui.get_state(uiid);
    if (state.visible && state.expanded) {
        console.assert(state); // should have been created in _begin
        const layout = ui.layout_peek();
        state.rect[_w] = layout[_totalw];
        state.rect[_h] = layout[_totalh];
        // this means one frame of latency between content updates and panel autosizing
    }
    ui.layout_pop(); // popping the layout created in do_panel_begin
}

export {
    do_panel_begin,
    do_panel_end
};