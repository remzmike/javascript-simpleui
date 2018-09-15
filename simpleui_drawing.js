var m_simpleui_drawing = (function() {

    var M = {
        font_size : GetFontSize(),

        default_text_color : Color(1,1,1),

        normal_back : {r: 60, g: 79, b: 117, a: 1},
        normal_face : {r: 0, g: 0, b: 0, a: 0.8},
        raised_back : {r: 0, g: 0, b: 0, a: 1},
        raised_face : {r: 185, g: 255, b: 255, a: 0.8416666666666667},
        hot_back : {r: 0, g: 155, b: 155, a: 1},
        hot_face : {r: 0, g: 77, b: 128, a: 0.8},
        activating_back : {r: 255, g: 255, b: 255, a: 1},
        activating_face : {r: 0, g: 204, b: 123, a: 1},
        accent : {r: 121, g: 191, b: 238, a: 0.31666666666666665},
    }

    // > no-alpha debug mode
    if (false) {
        M.accent = Color(0.25, 0.35, 0.35, 1);
        M.activating_face = M.hot_face;
    }

    M.debug = {
        // per-frame counters
        'count_Point': 0,
        'count_Rectangle': 0
    }
    M.focus_back = M.normal_back;
    M.focus_face = M.normal_face;

    // poor js. she'll never get her dress done. without multivalue returns.
    function Point(x, y) {
        M.debug.count_Point++;
        return {
            x:x,
            y:y
        };
    }

    function Rectangle(x, y, width, height) {
        M.debug.count_Rectangle++;
        // if they pass 2 params, they are width and height, not x and y
        if (!width && !height) {
            width = x;
            height = y;
            x = 0;
            y = 0;
        }
        var o = {
            x : x,
            y : y,
            width : width,
            height : height
        }
        return o;
    }

    // center 2 rectangles on each other, return x & y offsets
    function get_centered_offsets(rect1, rect2) {
        var ox = round( (rect1.width - rect2.width) / 2 );
        var oy = round( (rect1.height - rect2.height) / 2 );
        return [ox, oy];
    }

    function vertical_center(rect1, rect2) {
        var height_delta = rect1.height - rect2.height;
        var y_offset = Math.floor( height_delta / 2 );
        var result = Point(rect1.x, rect1.y + y_offset);
        return result;
    }

    function vertical_center_text(rect) {
        var hack_font_size = M.font_size; // round(font_size*1.7)
        var pos = vertical_center(rect, Rectangle(rect.x, rect.y, rect.width, hack_font_size));
        assert(pos!=null, 'pos is null');
        return pos;
    }

    function rectangle_center(rect) {
        return Point(rect.x + rect.width / 2, rect.y + rect.height / 2);
    }

    function rectangle_offset(rect, offset) {
        return Rectangle(rect.x + offset, rect.y + offset, rect.width, rect.height);
    }

    function rectangle_offset_xy(rect, offset_x, offset_y) {
        return Rectangle(rect.x + offset_x, rect.y + offset_y, rect.width, rect.height);
    }

    function rectangle_erode(rect, amount) {
        return Rectangle(rect.x+amount, rect.y+amount, rect.width-amount*2, rect.height-amount*2);
    }

    function rectangle_dilate(rect, amount) {
        return rectangle_erode(rect, amount * -1);
    }

    function rectangle_underline(rect, size) {
        return Rectangle(rect.x, rect.y+rect.height-size, rect.width, size);
    }

    function rectangle_copy(rect) {
        return Rectangle(rect.x, rect.y, rect.width, rect.height);
    }

    function point_translate(pt, x, y) {
        pt.x = pt.x + x;
        pt.y = pt.y + y;
        return pt;
    }

    function draw_text(text, x, y, color) {
        if (m_simpleui.config.drawtext_enable) {
            if (text==null) { text = ''; }
            if (color==null) { color = M.default_text_color; }
            DrawText(text, x, y, color);
        }
    }

    function draw_rectangle(rect, color) {
        DrawBox(rect.x, rect.y, rect.width, rect.height, color);
    }

    function draw_label(text, pt, color) {
        draw_text(text, pt.x, pt.y, color);
    }

    function draw_button(text, rect, state, text_offset_x, text_offset_y) {
        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 2);
        //log(state);
        if (state.Activating) {
            draw_rectangle(rect, M.activating_back);
            draw_rectangle(rect1, M.activating_face);
        } else if (state.Hot) {
            draw_rectangle(rect, M.hot_back);
            draw_rectangle(rect1, M.hot_face);
        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        } else { // normal
            draw_rectangle(rect, M.normal_back);
            draw_rectangle(rect1, M.normal_face);
        }

        var text_pos;
        if ( text_offset_x == null || text_offset_y == null) {
            text_pos = point_translate(vertical_center_text(rect1), 3, 0);
        } else {
            text_pos = point_translate(rect1, text_offset_x, text_offset_y);
        }
        if (state.Activating) {
            valign = point_translate(text_pos,1,1);
            draw_label(text, text_pos);
        } else {
            draw_label(text, text_pos);
        }
    }

    function draw_checkbox(uiid, rect, state, value) {
        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 4);

        if (state.Activating) {
            draw_rectangle(rect, M.activating_back);
            draw_rectangle(rect1, M.activating_face);
        } else if (state.Hot) {
            draw_rectangle(rect, M.hot_back);
            draw_rectangle(rect1, M.hot_face);
        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        } else { // normal
            draw_rectangle(rect, M.normal_back);
            draw_rectangle(rect1, M.normal_face);
        }

        if ( (!value && state.Activating) || value ) {
            draw_rectangle(rect2, Color(1,1,1,1));
        }
    }

    function draw_progressbar(uiid, rect, state, max, value) {
        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 2);
        var rect3 = rectangle_erode(rect, 3);

        if (state.Activating) {
            draw_rectangle(rect, M.activating_back);
            draw_rectangle(rect1, M.activating_face);
        } else if (state.Hot) {
            draw_rectangle(rect, M.hot_back);
            draw_rectangle(rect1, M.hot_face);
        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        } else { // normal
            draw_rectangle(rect, M.normal_back);
            draw_rectangle(rect1, M.normal_face);
        }

        var progrect = Rectangle(rect3.x, rect3.y, rect3.width * (value / max), rect3.height);
        draw_rectangle(progrect, M.accent);
    }

    function draw_slider(uiid, rect, state, min, max, value, handle_label) {
        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 2);
        var rect3 = rectangle_erode(rect, 3);
        var rect4 = rectangle_erode(rect, 4);
        var rect5 = rectangle_erode(rect, 5);

        var range = max - min;
        var absvalue = value;
        var value = absvalue - min; // relative value
        //if (state.Activating) then
        //    draw_rectangle(rect, activating_back)
        //    draw_rectangle(rect1, activating_face)
        //if (state.Hot) then

        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        // normal
        draw_rectangle(rect, M.normal_back);
        draw_rectangle(rect1, M.normal_face);
        //end

        var progrect = Rectangle(rect3.x, rect3.y, rect3.width * (value / range), rect3.height);
        draw_rectangle(progrect, M.accent);

        // handle
        var holder = rect1;
        var handledim = holder.height;
        //var handlepos = round( rect1.width * (value / max), 0 )
        var handlepos = round( (rect1.width-handledim) * (value / range) + handledim/2, 0 );
        var hrect = Rectangle(holder.x + handlepos - handledim/2, holder.y + 0, handledim, handledim);

        var hrect1 = rectangle_erode(hrect, 1);
        var hrect2 = rectangle_erode(hrect, 2);
        var hrect3 = rectangle_erode(hrect, 3);

        if (state.Activating) {
            //draw_rectangle(rect, activating_back)
            //draw_rectangle(rect1, activating_face)
            draw_rectangle(hrect, M.hot_back);
            draw_rectangle(hrect2, M.raised_face);
            //draw_rectangle(rect1, normal_raised)
        } else if (state.Hot) {
            draw_rectangle(hrect, M.hot_back);
            draw_rectangle(hrect2, M.raised_face);
            //draw_rectangle(rect1, normal_raised)
        //elseif (state.Focused) then
        //    draw_rectangle(hrect, focus_back)
        //    draw_rectangle(hrect1, focus_face)
        } else { // normal
            draw_rectangle(hrect, M.raised_back);
            draw_rectangle(hrect2, M.raised_face);
        }
        if (handle_label) {
            // nolive megahax
            draw_text(handle_label, hrect.x+hrect.width/2-5, hrect.y+hrect.height/2-6, Color(0,0,0,0.5));
        }
        // draw value string
        //if (true) then
        //    var pt = Point(rect.x + rect.width + 4, rect.y + rect.height - 1)
        //    draw_label(tostring(value), pt, foreground)
        //end
    }

    function draw_vslider(uiid, rect, state, min, max, value, handle_label) {
        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 2);
        var rect3 = rectangle_erode(rect, 3);
        var rect4 = rectangle_erode(rect, 4);
        var rect5 = rectangle_erode(rect, 5);

        var range = max - min;
        var absvalue = value;
        var value = absvalue - min; // relative value
        //if (state.Activating) then
        //    draw_rectangle(rect, activating_back)
        //    draw_rectangle(rect1, activating_face)
        //if (state.Hot) then

        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        // normal
        draw_rectangle(rect, M.normal_back);
        draw_rectangle(rect1, M.normal_face);
        //end

        var progrect = Rectangle(rect3.x, rect3.y, rect3.width, rect3.height * (value / range));
        draw_rectangle(progrect, M.accent);

        // handle
        var holder = rect1;
        var handledim = holder.width;
        //var handlepos = round( rect1.height* (value / max), 0 )
        var handlepos = round( (rect1.height-handledim) * (value / range) + handledim/2, 0 );
        //var hrect = Rectangle(holder.x + handlepos - handledim/2, holder.y + 0, handledim, handledim);
        var hrect = Rectangle(holder.x + 0, holder.y + handlepos - handledim/2, handledim, handledim);

        var hrect1 = rectangle_erode(hrect, 1);
        var hrect2 = rectangle_erode(hrect, 2);
        var hrect3 = rectangle_erode(hrect, 3);

        if (state.Activating) {
            //draw_rectangle(rect, activating_back)
            //draw_rectangle(rect1, activating_face)
            draw_rectangle(hrect, M.hot_back);
            draw_rectangle(hrect2, M.raised_face);
            //draw_rectangle(rect1, normal_raised)
        } else if (state.Hot) {
            draw_rectangle(hrect, M.hot_back);
            draw_rectangle(hrect2, M.raised_face);
            //draw_rectangle(rect1, normal_raised)
        //elseif (state.Focused) then
        //    draw_rectangle(hrect, focus_back)
        //    draw_rectangle(hrect1, focus_face)
        } else { // normal
            draw_rectangle(hrect, M.raised_back);
            draw_rectangle(hrect2, M.raised_face);
        }
        if (handle_label) {
            // nolive megahax
            draw_text(handle_label, hrect.x+hrect.width/2-5, hrect.y+hrect.height/2-6, Color(0,0,0,0.5));
        }
        // draw value string
        //if (true) then
        //    var pt = Point(rect.x + rect.width + 4, rect.y + rect.height - 1)
        //    draw_label(tostring(value), pt, foreground)
        //end
    }

    function draw_checkbutton(text, rect, state, value, text_offset_x, text_offset_y) {

        var rect1 = rectangle_erode(rect, 1);
        var rect2 = rectangle_erode(rect, 2);
        var rect3 = rectangle_erode(rect, 3);
        var rect4 = rectangle_erode(rect, 4);

        if (state.Activating) {
            draw_rectangle(rect, M.activating_back);
            draw_rectangle(rect1, M.activating_face);
        } else if (state.Hot) {
            draw_rectangle(rect, M.hot_back);
            draw_rectangle(rect1, M.hot_face);
            //log(rect, rect1, M.hot_back, M.hot_face);
        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        } else { // normal
            if (value) {
                draw_rectangle(rect, M.hot_back);
                draw_rectangle(rect2, M.hot_face);
            } else {
                draw_rectangle(rect, M.normal_back);
                draw_rectangle(rect1, M.normal_face);
            }
        }

        var text_pos;
        if (text_offset_x == null || text_offset_y == null) {
            text_pos = point_translate(vertical_center_text(rect1), 3, 0);
        } else {
            text_pos = point_translate(rect1, text_offset_x, text_offset_y);
        }
        if (state.Activating) {
            valign = point_translate(text_pos,1,1);
            draw_label(text, text_pos);
        } else {
            draw_label(text, text_pos);
        }
    }

    function draw_handle(uiid, rect, state) {
        var rect1 = rectangle_erode(rect, 1);

        if (state.Activating) {
            draw_rectangle(rect, M.activating_back);
            draw_rectangle(rect1, M.activating_face);
        } else if (state.Hot) {
            draw_rectangle(rect, M.hot_back);
            draw_rectangle(rect1, M.hot_face);
        //elseif (state.Focused) then
        //    draw_rectangle(rect, focus_back)
        //    draw_rectangle(rect1, focus_face)
        } else { // normal
            draw_rectangle(rect, M.normal_back);
            draw_rectangle(rect1, M.normal_face);
        }

        // rudimentary grip on handle
        var grip_rect = rectangle_copy(rectangle_erode(rect, 2));
        var partial_height = grip_rect.height/8;
        grip_rect.y += -1;
        grip_rect.height = 2;
        var nums = [];
        for (var i=0; i < nums.length; i++) {
            var v = nums[i];
            grip_rect.y += partial_height * v;
            draw_rectangle(grip_rect, M.normal_back);
        }
    }
    
    M.Point = Point;
    M.Rectangle = Rectangle;
    M.get_centered_offsets = get_centered_offsets;
    M.vertical_center = vertical_center;
    M.vertical_center_text = vertical_center_text;
    M.rectangle_center = rectangle_center;
    M.rectangle_offset = rectangle_offset;
    M.rectangle_offset_xy = rectangle_offset_xy;
    M.rectangle_erode = rectangle_erode;
    M.rectangle_dilate = rectangle_dilate;
    M.rectangle_underline = rectangle_underline;
    M.rectangle_copy = rectangle_copy;
    M.point_translate = point_translate;
    //
    M.text = draw_text;
    M.rectangle = draw_rectangle;
    M.label = draw_label;
    M.button = draw_button;
    M.checkbox = draw_checkbox;
    M.progressbar = draw_progressbar;
    M.slider = draw_slider;
    M.vslider = draw_vslider;
    M.checkbutton = draw_checkbutton;
    M.handle = draw_handle;

    return M;

})();