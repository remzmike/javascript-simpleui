import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';
import * as consts from './simpleui_consts.js';

const _none = consts._none;
const _vertical = consts._vertical;
const _horizontal = consts._horizontal;

const PointP = ui.PointP;
const RectangleP = ui.RectangleP;
const ColorP = ui.ColorP;

const ends = [];

/*
this function seems to show an interesting performance issue with simpleui > 0.3.1

with new deferred commands rendering, performance chokes after a high number of commands here

maybe the commands could be made smaller:
eg. (beginpath, 1, move_to, 4,x1,y1,x2,y2, line_to, 4,x3,y3,x4,y4) // 14 elements
to. (path, 8, x1, y1, x2, y2, x3, y3, x4, y4) // 10 elements
(it's a significant percentage but probably not enough for me)

i think this is happening because some stack/buffer limit is reached and jit deopts

giant commands buffer = bad performance

immediate rendering benefits from extra closeness to cpu

you should be able to choose deferred or immediate rendering
not just deferred, not just immediate
although if i have to pick one i should probably go immediate

i think... support both, eventually, but probably default to immediate for a long while

BUT, still use a uidraw layer of indirection (not directly calling on context)
AND, still use push_/pop_ uidraw api instead of sets
*/
function draw_star(uiid, segments, joints, webs, rings) {

    ends.length = 0;

    let incr = Math.PI * 2 / segments;

    for (let i = 0; i < segments; i++) {
        let rad = i * incr;
        let pt = ui.angled_norm_line(rad, 200);
        ends.push(pt);
    }

    const peek = ui.layout_peek();        
    uidraw.begin_path();
    const stroke_color = make_css_color(ColorP(200, 220, 200, 127));
    uidraw.push_strokestyle(stroke_color);

    // webs
    webs = Math.min(webs, joints);
    if (webs > 0) {
        for (let i0 = 0; i0 < ends.length; i0++) {
            let pt0 = ends[i0];
            let x0 = pt0.x;
            let y0 = pt0.y;
            // begin
            let i1 = (i0 + 1) % ends.length;
            let pt1 = ends[i1];
            let x1 = pt1.x;
            let y1 = pt1.y;
            for (let j = 0; j < webs; j++) {
                let p0 = (j + 1) / joints;
                uidraw.move_to(peek.x + x0 * p0, peek.y + y0 * p0);
                uidraw.line_to(peek.x + x1 * p0, peek.y + y1 * p0);
                //console.log(x0*p0, y0*p0, x1*p0, y1*p0);
            }
        }
    }

    // rings
    /*
    agg::ellipse e;
    for (int j=0;j<rings;j++)
    {
        double p0 = (j+1)/(double)joints;
        e.init(0, 0, p0, p0, 100);
        //agg::conv_stroke<agg::ellipse> e_stroke(e);

        agg::conv_transform<
            agg::ellipse,
            agg::trans_affine>
                trans_e(e, matrix);

        agg::conv_stroke<
            agg::conv_transform<
                agg::ellipse,
                agg::trans_affine>>
                    e_stroke(trans_e);

        ras.add_path(e_stroke);
        //path->move_to(0, p0);
        //path->arc_rel(0, 0, 4, false, false, p0, p0);
        //path->arc_rel(p0, p0, 4, true, true, p0,p0);
        //cr.move_to(p,0)
        //cr.arc(0, 0, p, 0, 2 * math.pi)
    }
    */

    // star
    for (let i0 = 0; i0 < ends.length; i0++) {
        let pt0 = ends[i0];
        let x0 = pt0.x;
        let y0 = pt0.y;
        // begin
        let i1 = (i0 + 1) % ends.length;
        let pt1 = ends[i1];
        let x1 = pt1.x;
        let y1 = pt1.y;
        for (let j = 0; j < joints; j++) {
            let p0 = (j + 1) / joints;
            let p1 = 1 - p0;
            uidraw.move_to(peek.x + x0 * p0, peek.y + y0 * p0);
            uidraw.line_to(peek.x + x1 * p1, peek.y + y1 * p1);
        }
    }

    uidraw.stroke();
    uidraw.pop_strokestyle();
}

// idea::
// linestar_edit = make_linestar_edit(13, 12, 5);
// linestar_edit(uiid);
function do_linestar_edit(uiid, segments, joints, webs) {
    let _;
    const rings = 19;

    const vertical = ui.layout_push(_vertical);
    const bg_rect = ui.layout_translated(RectangleP(0, 0, 400, 400));
    uidraw.rectangle_soft(bg_rect, uidraw.normal_back);
    ui.layout_increment2(400, 400);

    ui.layout_push(_none, 0, vertical.x + 200, vertical.y - 200);
    draw_star(
        uiid,
        segments,
        joints,
        webs,
        rings,
    );
    ui.layout_pop();

    let changed = 0 | false;
    const rect = RectangleP(0, 0, 200, 20);

    _ = do_slider2d(uiid + '-slider2d', RectangleP(0, 0, 400, 200), 3, 20, PointP(segments, joints));
    if (_.changed) {
        segments = _.x1;
        joints = _.y1;
        changed = 0 | true;
    }

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-segments', rect, 0, 80, segments, '');
    if (_.changed) {
        segments = _.value;
        changed = 0 | true;
    }

    ui.label('segments', rect);
    ui.layout_pop();

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-joints', rect, 0, 80, joints, '');
    if (_.changed) {
        joints = _.value;
        changed = 0 | true;
    }
    ui.label('joints', rect);
    ui.layout_pop();

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-webs', rect, 0, 80, webs, '');
    if (_.changed) {
        webs = _.value;
        changed = 0 | true;
    }

    ui.label('webs', rect);
    ui.layout_pop();
    
    _ = ui.layout_pop(); // vertical

    let state = ui.get_state(uiid);
    if (!state) {
        state = ui.set_state(uiid, {changed: 0 | false, segments: 0 | segments, joints: 0 | joints, webs: 0 | webs});
    }    
    state.changed = 0 | changed;
    state.segments = 0 | segments;
    state.joints = 0 | joints;
    state.webs = 0 | webs;
    return state;

    /*return [
        0 | changed,
        0 | segments,
        0 | joints,
        0 | webs
    ];*/
}

export {
    do_linestar_edit
};