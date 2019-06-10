import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
//const _vertical = consts._vertical;
//const _horizontal = consts._horizontal;

const RectangleP = ui.RectangleP;
const ColorP = ui.ColorP;

function do_slider2d(uiid, local_rect, min, max, point_value) {
    const rect = ui.layout_translated(local_rect);

    const min_x = 0 | min;
    const min_y = 0 | min;
    const max_x = 0 | max;
    const max_y = 0 | max;
    const rect_w_half = 0 | rect.w / 2;
    const rect_h_half = 0 | rect.h / 2;
    const grab_size = 20;
    const grab_size_half = 0 | grab_size / 2;

    // this component deals with 2 different coordinate spaces
    // 1. value scale (min to max) : caller input/output    
    const value_x_range = max_x - min_x;
    const value_y_range = max_y - min_y;
    const value_x = 0 | Math.min(max_x, Math.max(min_x, point_value.x));
    const value_y = 0 | Math.min(max_y, Math.max(min_y, point_value.y));
    // 2. local scale (0 to rect.w/h) : screen/draw/ui
    const local_x_range = rect.w;
    const local_y_range = rect.h;
    let local_x = 0 | ((value_x - min_x) / value_x_range) * local_x_range;
    let local_y = 0 | ((value_y - min_y) / value_y_range) * local_y_range;

    let changed = 0 | false;

    const layout = ui.layout_push(_none);
    {
        // background    
        // this background block is probably a separate component. (active-rectangle) [explore functional (hoc vs wrap vs idk)]
        // .........................         
        const bg_uiid = uiid + '-bg';
        uidraw.rectangle_soft(rect, uidraw.normal_back);
        const rect1 = uidraw.rectangle_erode(rect, 1);
        uidraw.rectangle_soft(rect1, uidraw.normal_face);
        ui.add_hotspot(bg_uiid, rect);

        // draw grid
        const stroke_color = ui.make_css_color(ColorP(255, 255, 255, 100));
        uidraw.push_strokestyle(stroke_color);
        uidraw.line(layout.x + 1, layout.y + rect_h_half, layout.x + rect.w - 1, layout.y + rect_h_half);
        uidraw.line(layout.x + rect_w_half, layout.y + 1, layout.x + rect_w_half, layout.y + rect.h - 1);
        uidraw.pop_strokestyle();

        let rel_x; // in local scale
        let rel_y;

        if (ui.state.item_went_down == bg_uiid || ui.state.item_held == bg_uiid) {
            rel_x = 0 | ui.driver.GetCursorX() - layout.x;
            rel_y = 0 | ui.driver.GetCursorY() - layout.y;
            changed = 0 | true;
            local_x = 0 | Math.min(rect.w, Math.max(0, rel_x));
            local_y = 0 | Math.min(rect.h, Math.max(0, rel_y));
        }
        // .........................

        // i want a handle so that selecting near edges of background is easier
        /*_ = ui.handle(uiid_pt1, handle1_rect, local_x, local_y);
        if (_.changed) {
            rel_x = _.x1;
            rel_y = _.y1;
            changed = 0 | changed | _.changed;
        }*/

        // handle
        const handle1_rect = RectangleP(local_x - grab_size_half, local_y - grab_size_half, grab_size, grab_size);

        // circle indicator
        if (changed && ui.state.item_held == bg_uiid) {
            const handle1_face = ui.layout_translated(uidraw.rectangle_erode(handle1_rect, 4));
            uidraw.circle(handle1_face, uidraw.raised_accent);
        } else {
            const handle1_face = ui.layout_translated(uidraw.rectangle_erode(handle1_rect, 6));
            uidraw.circle(handle1_face, uidraw.raised_face);    
        }

    }
    ui.layout_pop();
    ui.layout_increment(rect);

    const result_x = min_x + (local_x / rect.w) * value_x_range;
    const result_y = min_y + (local_y / rect.h) * value_y_range;

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {changed: 0 | false, x1: 0 | 0, y1: 0 | 0});
    }    
    state.changed = 0 | changed;
    state.x1 = 0 | result_x; // nolive probably should be .x not .x1
    state.y1 = 0 | result_y;
    return state;

    /*return [
        0 | changed,
        0 | result_x,
        0 | result_y
    ];*/
}

export {
    do_slider2d
};