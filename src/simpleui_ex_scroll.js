import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

const debug = 0 | false;
/*
todo:later: the scroll item hotspot isn't being clipped (might be a problem later...)
if i dont fix it properly, then it might be possible to fix by placing a dead hotspot above the overflow and below any later widgets/hotspots
*/

const RectangleP = ui.RectangleP;

function do_scroll_begin(uiid, local_rect, row_height, item_count) {
    const rect = ui.layout_translated(local_rect);
    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {
            'scroll_value': 0 | 0,
            'rect': rect,
            'row_height': 0 | row_height,
            'item_count': 0 | item_count,
            'mod': null,
        });
    };

    ui.layout_push(_none);
    
    // horizontal layout = [vertical layout, slider]
    ui.layout_push(_horizontal);
    
    const mod = state.scroll_value % state.row_height;
    state.mod = mod;

    // vertical layout = [item1, item2, ...]
    ui.layout_push(_vertical, 0, rect.x, rect.y - mod); // mod handles item offset in view
    //ui.layout_push(_vertical, 0, rect.x, rect.y);

    state.first_visible_index = 0 | Math.floor(state.scroll_value / state.row_height);    
    const max_visible = 0 | Math.ceil(rect.h / state.row_height) + 1;
    state.last_visible_index = 0 | Math.min(item_count, state.first_visible_index + max_visible);

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

    // smi truncate is floor
    const max_items_shown = 0 | rect.h / row_height;    

    if (item_count > max_items_shown) {
        var slider_max = item_count * row_height - rect.h;
        let _ = ui.vslider(uiid + '-vslider', RectangleP(-20, 0, 20, rect.h), 0, slider_max, state.scroll_value, '');
        if (_.changed) {
            state.scroll_value = _.value;
        }
    }

    if (debug) {
        ui.layout_push(_vertical);
        ui.label(state.scroll_value+'', RectangleP(0,0,50,20));    
        ui.label(state.mod+'', RectangleP(0,0,50,20));    
        ui.layout_pop();
    }

    if (state.last_visible_index == state.item_count) {
        // pass (is this a bug) and/or (is there a better way?)
    } else {
        ui.layout_peek().maxh -= row_height;
    }    
    ui.layout_pop(); // horz

    ui.layout_pop(); // none

    ui.layout_increment(rect);

    if (debug) {
        uidraw.rectangle_outline(rect, ColorP(255,0,0,255));
    }
}

// todo: messy, latest feature
function do_scroll_item_begin(scroll_uiid, i) {
    //var layout_parent = ui.layout_peek();
    //console.log(layout_parent);
    //var layout = ui.layout_push(_vertical);
    var scroll = ui.get_state(scroll_uiid);
    scroll.translate_y = i * scroll.row_height;
    scroll.widget_y1 = scroll.rect.y + scroll.translate_y - scroll.scroll_value;
    scroll.widget_y2 = scroll.widget_y1 + scroll.row_height;

    //const peek = ui.layout_peek();

    // im emulating the layout here, because i know it is vertical... (TODO: LATER: FIXERINO)
    //peek.y -= scroll.partial_item; // this handles the offset of every item...
    //console.log(layout);
    //}
}

function do_scroll_item_end(scroll_uiid) {
    // debug draws
    if (false) {
        const scroll = ui.get_state(scroll_uiid);
        uidraw.rectangle(RectangleP(scroll.rect.x, scroll.widget_y1, 200, 2), ColorP(51, 102, 102, 200));
        uidraw.rectangle(RectangleP(scroll.rect.x, scroll.widget_y2 - 1, 200, 1), ColorP(102, 0, 0, 200));
    }
}


export {
    do_scroll_begin, do_scroll_end,
    do_scroll_item_begin, do_scroll_item_end
};