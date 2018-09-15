// later: modularize

    function do_panel_begin(uiid, first_x, first_y, first_visible, first_expanded) {

        assert(first_x, 'do_panel_begin: first_x required');
        assert(first_y, 'do_panel_begin: first_y required');
        if (first_visible == null) first_visible = true;
        if (first_expanded == null) first_expanded = true;

        var cache = ui.get_cache(uiid, function() {
            return {
                'uiid' : uiid,
                'rect' : Rectangle(first_x, first_y, 10, 10),
                'visible' : first_visible,
                'expanded' : first_expanded
            };
        });

        if (!cache.visible) return cache;

        var rect = cache.rect;

        var x = rect.x;
        var y = rect.y;

        var dilate = 20;
        var bar_height = 24;

        var handle_x = rect.x;
        var handle_y = rect.y - bar_height - dilate;

        var handle_w;
        if (cache.expanded) {
            handle_w = rect.width;
        } else {
            handle_w = 200;
        }

        var layout = ui.layout_push('vertical', app.panel_layout_padding, x, y); // pops in *_end

        // todo: later: push_id('handle');
        // or: next_id('-handle'); etc.
        ui.layout_push('none');
        {
            _ = ui.handle(uiid + '-handle', Rectangle(handle_x, handle_y, handle_w+dilate, bar_height), x, y);
            if (_.changed) {
                cache.rect.x = _.activated_delta_x;
                cache.rect.y = _.activated_delta_y;
            }

            if (true) { //!cache.expanded) {
                ui.label(uiid + '-handle-label', uiid, Rectangle(handle_x+10, handle_y, handle_w+dilate, bar_height));
            }

            var glyph = cache.expanded ? 'v' : '>';
            var text_width = 10; // hax
            var text_ox = bar_height/2 - text_width/2; // (bar_height/2)-(text_width/2);
            var text_oy = text_ox/2;
            _ = ui.checkbutton(uiid + '-button', glyph, Rectangle(x-dilate, handle_y, bar_height, bar_height),
                cache.expanded, text_ox, text_oy);
            if (_.changed) {
                cache.expanded = !cache.expanded;
            }

            // panel bg
            if (cache.expanded) {
                if (ui.state.step == UIStep_Draw) {
                    if (rect) {
                        rect.x = x;
                        rect.y = y;
                        var rect1 = uidraw.rectangle_dilate(rect, dilate);
                        rect1 = uidraw.rectangle_offset_xy(rect1, 0, 0);
                        uidraw.rectangle(rect1, panel_color1);
                    }
                }
            }
        }
        ui.layout_pop();

        return cache;
    }

    function do_panel_end(uiid) {
        var panel = ui.get_cache(uiid);
        if (panel.visible && panel.expanded) {
            assert(panel); // should have been created in _begin
            var layout = ui.layout_peek();
            if (ui.state.step == UIStep_Init) {
                panel.rect.width = layout.totalw;
                panel.rect.height = layout.totalh;
            }
            ui.layout_pop(); // popping the layout created in do_panel_begin
        }
    }