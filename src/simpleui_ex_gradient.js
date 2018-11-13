import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function do_gradient_stroke_edit(uiid, min, max, x1, y1, x2, y2) {
    let _;

    const min_x = 0 | min;
    const min_y = 0 | min;
    const max_x = 0 | max;
    const max_y = 0 | max;
    const dim_w = max_x - min_x;
    const dim_h = max_y - min_y;
    const dim_w_half = 0 | (dim_w / 2);
    const dim_h_half = 0 | (dim_h / 2);
    const dim_w_quarter = 0 | (dim_w / 4);
    const dim_h_quarter = 0 | (dim_h / 4);
    const grab_dim = 20;
    const grab_dim_half = 0 | grab_dim / 2;

    let changed = 0 | false;
    let result_x1 = 0 | x1;
    let result_y1 = 0 | y1;
    let result_x2 = 0 | x2;
    let result_y2 = 0 | y2;

    const layout = ui.layout_push(_none);
    {
        const p1_x = x1 - min_x;
        const p1_y = y1 - min_y;
        const p2_x = x2 - min_x;
        const p2_y = y2 - min_y;

        // background
        uidraw.rectangle(Rectangle(layout[_x], layout[_y], dim_w, dim_h), uidraw.normal_face);

        // grid lines
        context.lineWidth = 1;
        context.strokeStyle = make_css_color(Color(255, 255, 255, 255));
        draw_line(layout[_x] + dim_w_half, layout[_y], layout[_x] + dim_w_half, layout[_y] + dim_h);
        draw_line(layout[_x], layout[_y] + dim_h_half, layout[_x] + dim_w, layout[_y] + dim_h_half);

        // gradient swatch
        uidraw.rectangle(Rectangle(layout[_x] + dim_w_quarter, layout[_y] + dim_h_quarter, dim_w_half, dim_h_half), uidraw.accent);

        // line between points
        context.lineWidth = 2;
        context.strokeStyle = make_css_color(Color(0, 0, 0, 255));
        draw_line(layout[_x] + p1_x - 1, layout[_y] + p1_y - 2, layout[_x] + p2_x - 1, layout[_y] + p2_y - 2);
        context.strokeStyle = make_css_color(Color(255, 255, 255, 255));
        draw_line(layout[_x] + p1_x, layout[_y] + p1_y, layout[_x] + p2_x, layout[_y] + p2_y);
        context.lineWidth = 1;

        const handle1_rect = Rectangle(p1_x - grab_dim_half, p1_y - grab_dim_half, grab_dim, grab_dim);
        _ = ui.handle('grad-panel-handle-pt1', handle1_rect, p1_x, p1_y);
        if (_[_changed]) {
            changed = 0 | changed | _[_changed];
            result_x1 = 0 | Math.min(max_x, Math.max(min_x, _[_x1] + min_x));
            result_y1 = 0 | Math.min(max_y, Math.max(min_y, _[_y1] + min_y));
        }

        const handle2_rect = Rectangle(p2_x - grab_dim_half, p2_y - grab_dim_half, grab_dim, grab_dim);
        _ = ui.handle('grad-panel-handle-pt2', handle2_rect, p2_x, p2_y);
        if (_[_changed]) {
            changed = 0 | changed | _[_changed];
            result_x2 = 0 | Math.min(max_x, Math.max(min_x, _[_x1] + min_x));
            result_y2 = 0 | Math.min(max_y, Math.max(min_y, _[_y1] + min_y));
        }

        const handle1_nub = ui.layout_translated(uidraw.rectangle_erode(handle1_rect, 4));
        uidraw.rectangle(handle1_nub, uidraw.raised_face);

        const handle2_nub = ui.layout_translated(uidraw.rectangle_erode(handle2_rect, 4));
        uidraw.rectangle(handle2_nub, uidraw.raised_face);
    }
    ui.layout_pop();
    ui.layout_increment2(dim_w, 0);

    return [
        0 | changed,
        0 | result_x1,
        0 | result_y1,
        0 | result_x2,
        0 | result_y2
    ];
}

export {
    do_gradient_stroke_edit
};