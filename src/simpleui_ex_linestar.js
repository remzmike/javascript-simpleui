import * as ui from './simpleui.js';
import * as uidraw from './simpleui_drawing.js';

function angled_norm_line(rad, scale) {
    const x = Math.sin(rad) * scale;
    const y = Math.cos(rad) * scale;
    return [x, y];
}

function draw_star(uiid, segments, joints, webs, rings) {

    let incr = Math.PI * 2 / segments;

    let ends = [];

    const peek = ui.layout_peek();
    context.beginPath();
    //context.translate(peek[_x], peek[_y]);
    context.lineWidth = 1;
    context.strokeStyle = make_css_color(Color(200, 220, 200, 127));

    for (let i = 0; i < segments; i++) {
        let rad = i * incr;
        let pt = angled_norm_line(rad, 200);
        ends.push(pt);
    }

    // webs
    webs = Math.min(webs, joints);
    if (webs > 0) {
        for (let i0 = 0; i0 < ends.length; i0++) {
            let pt0 = ends[i0];
            let x0 = pt0[_x];
            let y0 = pt0[_y];
            // begin
            let i1 = (i0 + 1) % ends.length;
            let pt1 = ends[i1];
            let x1 = pt1[_x];
            let y1 = pt1[_y];
            for (let j = 0; j < webs; j++) {
                let p0 = (j + 1) / joints;
                context.moveTo(peek[_x] + x0 * p0, peek[_y] + y0 * p0);
                context.lineTo(peek[_x] + x1 * p0, peek[_y] + y1 * p0);
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
        let x0 = pt0[_x];
        let y0 = pt0[_y];
        // begin
        let i1 = (i0 + 1) % ends.length;
        let pt1 = ends[i1];
        let x1 = pt1[_x];
        let y1 = pt1[_y];
        for (let j = 0; j < joints; j++) {
            let p0 = (j + 1) / joints;
            let p1 = 1 - p0;
            context.moveTo(peek[_x] + x0 * p0, peek[_y] + y0 * p0);
            context.lineTo(peek[_x] + x1 * p1, peek[_y] + y1 * p1);
        }
    }

    context.stroke();
    //context.translate(-peek[_x], -peek[_y]);
}

// idea::
// linestar_edit = make_linestar_edit(13, 12, 5);
// linestar_edit(uiid);
function do_linestar_edit(uiid, segments, joints, webs) {
    let _;
    const rings = 19;

    const vertical = ui.layout_push(_vertical);
    ui.rectangle(Rectangle(0, 0, 400, 400), uidraw.normal_back);

    ui.layout_push(_none, 0, vertical[_x] + 200, vertical[_y] - 200);
    draw_star(
        uiid,
        segments,
        joints,
        webs,
        rings,
    );
    ui.layout_pop();

    let changed = 0 | false;
    const rect = Rectangle(0, 0, 200, 20);

    _ = do_slider2d(uiid + '-slider2d', Rectangle(0, 0, 400, 200), 3, 20, Point(segments, joints));
    if (_[_changed]) {
        segments = _[_x1];
        joints = _[_y1];
        changed = 0 | true;
    }

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-segments', rect, 0, 80, segments, '');
    if (_[_changed]) {
        segments = _[_value];
        changed = 0 | true;
    }

    ui.label('segments', rect);
    ui.layout_pop();

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-joints', rect, 0, 80, joints, '');
    if (_[_changed]) {
        joints = _[_value];
        changed = 0 | true;
    }
    ui.label('joints', rect);
    ui.layout_pop();

    ui.layout_push(_horizontal);
    _ = ui.slider(uiid + '-slider-webs', rect, 0, 80, webs, '');
    if (_[_changed]) {
        webs = _[_value];
        changed = 0 | true;
    }

    ui.label('webs', rect);
    ui.layout_pop();
    
    _ = ui.layout_pop(); // vertical
    ui.layout_increment2(0, _[_totalh] - 400);    

    return [
        0 | changed,
        0 | segments,
        0 | joints,
        0 | webs
    ];
}

export {
    do_linestar_edit
};