import * as ui from './simpleui.js';
import { Color, make_css_color } from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
//const _vertical = consts._vertical;
//const _horizontal = consts._horizontal;

const RectangleP = ui.RectangleP;
const ColorP = ui.ColorP;

let css_line_color2;
let css_line_color1;

function initialize() {
    css_line_color2 = make_css_color(Color(255, 255, 255, 255));
    css_line_color1 = make_css_color(Color(0, 0, 0, 255));
}

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
        uidraw.rectangle3d(RectangleP(layout.x, layout.y, dim_w, dim_h), uidraw.normal_face);

        // grid lines
        const stroke_color = make_css_color(ColorP(255, 255, 255, 255));
        uidraw.push_strokestyle(stroke_color);
        uidraw.line(layout.x + dim_w_half, layout.y, layout.x + dim_w_half, layout.y + dim_h);
        uidraw.line(layout.x, layout.y + dim_h_half, layout.x + dim_w, layout.y + dim_h_half);
        uidraw.pop_strokestyle();

        // gradient swatch
        uidraw.rectangle3d(RectangleP(layout.x + dim_w_quarter, layout.y + dim_h_quarter, dim_w_half, dim_h_half), uidraw.accent);

        // line between points 1     
        // --->
        const handle1_rect = RectangleP(p1_x - grab_dim_half, p1_y - grab_dim_half, grab_dim, grab_dim);
        const handle2_rect = RectangleP(p2_x - grab_dim_half, p2_y - grab_dim_half, grab_dim, grab_dim);

        const dx = handle2_rect.x - handle1_rect.x;
        const dy = handle2_rect.y - handle1_rect.y;

        const radians = Math.atan2(dx, dy);
        const pt = ui.angled_norm_line(radians, grab_dim_half);
        
        uidraw.push_linewidth(3);
        uidraw.push_strokestyle(css_line_color1);    
        uidraw.line(layout.x + p1_x + pt.x, layout.y + p1_y + pt.y, layout.x + p2_x - pt.x, layout.y + p2_y - pt.y);
        uidraw.pop_strokestyle();
        uidraw.pop_linewidth();
        // line between points 2
        uidraw.push_linedash([2,2]);
        uidraw.push_linewidth(2);        
        uidraw.push_strokestyle(css_line_color2);
        uidraw.line(layout.x + p1_x + pt.x, layout.y + p1_y + pt.y, layout.x + p2_x - pt.x, layout.y + p2_y - pt.y);        
        uidraw.pop_strokestyle();
        uidraw.pop_linewidth();
        uidraw.pop_linedash();
        // <---

        const uiid_pt1 = uiid + '-pt1';
        _ = ui.reticle(uiid_pt1, handle1_rect, p1_x, p1_y);
        if (_.changed) {
            changed = 0 | changed | _.changed;
            result_x1 = 0 | Math.min(max_x, Math.max(min_x, _.x1 + min_x));
            result_y1 = 0 | Math.min(max_y, Math.max(min_y, _.y1 + min_y));
        }

        const uiid_pt2 = uiid + '-pt2';
        _ = ui.reticle(uiid_pt2, handle2_rect, p2_x, p2_y);
        if (_.changed) {
            changed = 0 | changed | _.changed;
            result_x2 = 0 | Math.min(max_x, Math.max(min_x, _.x1 + min_x));
            result_y2 = 0 | Math.min(max_y, Math.max(min_y, _.y1 + min_y));
        }
    }
    ui.layout_pop();
    ui.layout_increment2(dim_w, 0);

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {changed: 0 | false, x1: 0 | x1, y1: 0 | y1, x2: 0 | x2, y2: 0 | y2});
    }    
    state.changed = 0 | changed;
    state.x1 = 0 | result_x1;
    state.y1 = 0 | result_y1;
    state.x2 = 0 | result_x2;
    state.y2 = 0 | result_y2;
    return state;

    /*return [
        0 | changed,
        0 | result_x1,
        0 | result_y1,
        0 | result_x2,
        0 | result_y2
    ];*/
}

export {
    do_gradient_stroke_edit,
    initialize
};