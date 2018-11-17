import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function do_scroll_begin(uiid, rect, row_height, item_count) {
    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'yscroll': 0,
            'rect': rect,
            'row_height': row_height,
            'item_count': item_count,
            'layout': {},
        });
    };

    var layout = ui.layout_push(_vertical, 2, rect[_x], rect[_y]);
    state.layout = layout;

    state.first_visible_index = Math.floor(state.yscroll / state.row_height);
    var max_visible = Math.ceil(rect[_h] / state.row_height) + 1
    state.last_visible_index = state.first_visible_index + max_visible;

    let rect2 = uidraw.rectangle_dilate(rect, 1);
    uidraw.rectangle(rect2, uidraw.panel_color);

    context.save();
    var enable_clip = true;
    if (enable_clip) {
        context.beginPath();
        context.rect(rect[_x], rect[_y], rect[_w], rect[_h]);
        context.clip();
    }

    state.rect = rect; // this is equivalent to prop-changed-so-update-state-mirror in vue/react/etc

    return state;
}
function do_scroll_end(uiid) {
    var state = ui.get_state(uiid);
    let item_count = state.item_count;
    let row_height = state.row_height;
    let rect = state.rect;

    context.restore();

    var slider_max = item_count * row_height - rect[_h];
    // the concept of first_value instead of normal simpleui value param, one way binding...
    state.layout[_y] = state.layout[_y] - (rect[_h] + 42);
    state.layout[_x] = state.layout[_x] + (rect[_h] - 20);
    let _ = ui.vslider('scroll-experiment-slider', Rectangle(0, 0, 20, rect[_h]), 0, slider_max, state.yscroll, '');
    if (_[_changed]) {
        state.yscroll = _[_value];
    }

    ui.layout_pop();
}

// todo: messy, latest feature
function do_scroll_item_begin(scroll_uiid, i) {
    var layout_parent = ui.layout_peek();
    //console.log(layout_parent);
    var layout = ui.layout_push(_vertical);
    var scroll = ui.get_state(scroll_uiid);
    scroll.translate_y = i * scroll.row_height;
    if (false) {
        scroll.widget_y1 = scroll.rect[_y] + scroll.translate_y - scroll.yscroll;
        scroll.widget_y2 = scroll.widget_y1 + scroll.row_height;
    } else {
        scroll.widget_y1 = layout_parent[_y] + scroll.translate_y - scroll.yscroll - layout_parent[_totalh];
        //console.log(layout_parent);
        scroll.widget_y2 = scroll.widget_y1 + scroll.row_height;
    }

    // this stuff became optional once i decided to use static row_height (for now)

    /*scroll.in_view = scroll.widget_y1 >= scroll.rect[_y] && scroll.widget_y1 <= scroll.rect[_y] + scroll.rect[_h]
        || scroll.widget_y2 >= scroll.rect[_y] && scroll.widget_y2 <= scroll.rect[_y] + scroll.rect[_h];*/

    //if (true || scroll.in_view) {
    //var layout = ui.layout_peek();
    //scroll.prev_layout_y = layout[_y];

    scroll.partial_item = (layout[_y] - scroll.widget_y1);
    // im emulating the layout here, because i know it is vertical... (TODO: LATER: FIXERINO)
    layout[_y] -= scroll.partial_item;
    //console.log(layout);
    //}

}

function do_scroll_item_end(scroll_uiid) {
    var scroll = ui.get_state(scroll_uiid);

    if (scroll.in_view) {
        var layout = ui.layout_peek();
        layout[_y] += scroll.partial_item; // not sure if this is needed FOR NOW, but probably could be in the future, and would probably be hard to track down
    }
    // debug draws
    if (false) {
        uidraw.rectangle(Rectangle(scroll.rect[_x], scroll.widget_y1, 200, 2), Color(51, 102, 102, 51));
        uidraw.rectangle(Rectangle(scroll.rect[_x], scroll.widget_y2 - 1, 200, 1), Color(102, 0, 0, 127));
    }

    ui.layout_pop();
}


export {
    do_scroll_begin, do_scroll_end,
    do_scroll_item_begin, do_scroll_item_end
};