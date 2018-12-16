import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function do_scroll_begin(uiid, rect, row_height, item_count) {
    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'scroll_value': 0,
            'rect': rect,
            'row_height': row_height,
            'item_count': item_count,
            'mod': null,
        });
    };
    
    // horizontal layout = [vertical, slider]
    // vertical layout = [item1, item2, ...]
    ui.layout_push(_horizontal, 0, rect[_x], rect[_y]);
    
    const mod = state.scroll_value % state.row_height;
    state.mod = mod;

    ui.layout_push(_vertical, 0, rect[_x], rect[_y] - mod); // mod handles item offset in view
    //ui.layout_push(_vertical, 0, rect[_x], rect[_y]);

    state.first_visible_index = Math.floor(state.scroll_value / state.row_height);    
    const max_visible = Math.ceil(rect[_h] / state.row_height) + 1;
    state.last_visible_index = Math.min(item_count, state.first_visible_index + max_visible);

    let rect2 = uidraw.rectangle_dilate(rect, 1);
    uidraw.rectangle(rect2, uidraw.panel_color);

    uidraw.begin_clip(rect);

    state.rect = rect; // this is equivalent to prop-changed-so-update-state-mirror in vue/react/etc

    return state;
}
function do_scroll_end(uiid) {
    var state = ui.get_state(uiid);
    let item_count = state.item_count;
    let row_height = state.row_height;
    let rect = state.rect;

    uidraw.end_clip();

    ui.layout_pop(); // vert

    var slider_max = item_count * row_height - rect[_h];

    let _ = ui.vslider(uiid + '-vslider', Rectangle(0, 0, 20, rect[_h]), 0, slider_max, state.scroll_value, '');
    if (_[_changed]) {
        state.scroll_value = _[_value];
    }

    if (false) {
        ui.layout_push(_vertical);
        ui.label(state.scroll_value+'', Rectangle(0,0,50,20));    
        ui.label(state.mod+'', Rectangle(0,0,50,20));    
        ui.layout_pop();
    }

    if (state.last_visible_index == state.item_count) {
        // pass (is this a bug) and/or (is there a better way?)
    } else {
        ui.layout_peek()[_maxh] -= row_height;
    }    
    ui.layout_pop(); // horz

}

// todo: messy, latest feature
function do_scroll_item_begin(scroll_uiid, i) {
    //var layout_parent = ui.layout_peek();
    //console.log(layout_parent);
    //var layout = ui.layout_push(_vertical);
    var scroll = ui.get_state(scroll_uiid);
    scroll.translate_y = i * scroll.row_height;
    scroll.widget_y1 = scroll.rect[_y] + scroll.translate_y - scroll.scroll_value;
    scroll.widget_y2 = scroll.widget_y1 + scroll.row_height;

    //const peek = ui.layout_peek();

    // im emulating the layout here, because i know it is vertical... (TODO: LATER: FIXERINO)
    //peek[_y] -= scroll.partial_item; // this handles the offset of every item...
    //console.log(layout);
    //}
}

function do_scroll_item_end(scroll_uiid) {
    var scroll = ui.get_state(scroll_uiid);

    // debug draws
    if (false) {
        uidraw.rectangle(Rectangle(scroll.rect[_x], scroll.widget_y1, 200, 2), Color(51, 102, 102, 200));
        uidraw.rectangle(Rectangle(scroll.rect[_x], scroll.widget_y2 - 1, 200, 1), Color(102, 0, 0, 200));
    }
}


export {
    do_scroll_begin, do_scroll_end,
    do_scroll_item_begin, do_scroll_item_end
};