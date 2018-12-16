import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function do_slider2d(uiid, local_rect, min, max, point_value) {
    const rect = ui.layout_translated(local_rect);
    let _;

    const min_x = 0 | min;
    const min_y = 0 | min;
    const max_x = 0 | max;
    const max_y = 0 | max;
    const rect_w_half = 0 | rect[_w] / 2;
    const rect_h_half = 0 | rect[_h] / 2;
    const grab_size = 20;
    const grab_size_half = 0 | grab_size / 2;

    // this component deals with 2 different coordinate spaces
    // 1. value scale (min to max) : caller input/output    
    const value_x_range = max_x - min_x;
    const value_y_range = max_y - min_y;
    const value_x = 0 | Math.min(max_x, Math.max(min_x, point_value[_x]));
    const value_y = 0 | Math.min(max_y, Math.max(min_y, point_value[_y]));
    // 2. local scale (0 to rect[_w/_h]) : screen/draw/ui
    const local_x_range = rect[_w];
    const local_y_range = rect[_h];
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
        const stroke_color = make_css_color(Color(255, 255, 255, 100));
        uidraw.push_strokestyle(stroke_color);
        uidraw.line(layout[_x] + 1, layout[_y] + rect_h_half, layout[_x] + rect[_w] - 1, layout[_y] + rect_h_half);
        uidraw.line(layout[_x] + rect_w_half, layout[_y] + 1, layout[_x] + rect_w_half, layout[_y] + rect[_h] - 1);
        uidraw.pop_strokestyle();

        let rel_x; // in local scale
        let rel_y;

        if (ui.state.item_went_down == bg_uiid || ui.state.item_held == bg_uiid) {
            rel_x = 0 | ui.driver.GetCursorX() - layout[_x];
            rel_y = 0 | ui.driver.GetCursorY() - layout[_y];
            changed = 0 | true;
            local_x = 0 | Math.min(rect[_w], Math.max(0, rel_x));
            local_y = 0 | Math.min(rect[_h], Math.max(0, rel_y));
        }
        // .........................

        // i want a handle so that selecting near edges of background is easier
        /*_ = ui.handle(uiid_pt1, handle1_rect, local_x, local_y);
        if (_[_changed]) {
            rel_x = _[_x1];
            rel_y = _[_y1];
            changed = 0 | changed | _[_changed];
        }*/

        // handle
        const handle1_rect = Rectangle(local_x - grab_size_half, local_y - grab_size_half, grab_size, grab_size);

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

    const result_x = min_x + (local_x / rect[_w]) * value_x_range;
    const result_y = min_y + (local_y / rect[_h]) * value_y_range;
    return [
        0 | changed,
        0 | result_x,
        0 | result_y
    ];
}

export {
    do_slider2d
};