var m_simpleui = (function() { // WISH: pass in driver......

    var M = {};
    M.config = {
        drawhotspots_enable : false,
        drawbox_soft_enable : true,
        drawbox_gradient_enable : true,
        drawtext_enable : true,
        drawtext_bitmap : true,
        _ : null // trailing comma grabber
    }
    M.cache = {};

    var draw = m_simpleui_drawing;
    var Point = draw.Point;
    var Rectangle = draw.Rectangle;

    var debug_draw_debuglines = false;
    var debuglines = [];

    var layout_stack = [];

    UIStep_None = 0;
    UIStep_Create = 1;
    UIStep_Init = 2;
    UIStep_Logic = 3;
    UIStep_Draw = 4;

    var uistate = {};
    uistate.hotitem = '';
    uistate.focusitem = '';
    uistate.activatingitem = '';
    uistate.activateditem = '';
    uistate.step = UIStep_None;
    uistate.hotspots = [];
    uistate.mouselocation = [0,0];
    uistate.focuspoint = [0,0];
    uistate.leftpress = false;
    uistate.leftheld = false;
    uistate.leftrelease = false;

    function Hotspot(id, rect) {
        assert(id != null, 'hotspot with null id');
        assert(rect != null, 'hotspot with null rect');
        return {
            id : id,
            rect : rect
        };
    }

    function clamp(value, x1, x2) {
        return Math.min(Math.max(value, x1), x2);
    }

    function get_cache(uiid, setter) {
        var cache = M.cache[uiid];
        if (!cache) {
            if (setter) {
                cache = ui.set_cache(uiid, setter.call());
            } else {
                // pass
            }
        }
        return cache;
    }

    function set_cache(uiid, val) {
        M.cache[uiid] = val;
        return M.cache[uiid];
    }

    function rectangle_contains(rect, pt) {
        var x2 = rect.x + rect.width;
        var y2 = rect.y + rect.height;
        return (pt.x >= rect.x && pt.x <= x2 && pt.y >= rect.y && pt.y <= y2);
    }

    function DrawState() {
        return {
            Hot : false,
            Focused : false,
            Activating : false,
            Activated : false
        };
    }

    function calc_drawstate(uiid) {
        var ishot = uistate.hotitem == uiid;
        var isfocus = uistate.focusitem == uiid;
        var isactivating = uistate.activatingitem == uiid;
        var isactivated = uistate.activateditem == uiid;
        var state = DrawState();
        if (ishot) { state.Hot = true; }
        if (isfocus) { state.Focused = true; }
        if (isactivating) { state.Activating = true; }
        if (isactivated) { state.Activated = true; }
        return state;
    }

    function layout_peek() {
        var stacksize = layout_stack.length;
        if ( stacksize == 0 ) {
            return null;
        } else {
            return layout_stack[stacksize-1];
        }
    }

    // modes: 'none', 'vertical', 'horizontal', later: 'grid', 'columns', 'rows'
    function layout_push(mode, padding, x, y) { // last 3 params are inherited from containing layout
        // get x and y from the current layout, if one exists
        //print('layout_push', mode, padding, x, y)
        var current = layout_peek();
        if (current != null) {
            //print('inheriting from current');
            // inherit x and y
            if (x == null) {
                //print('inherit layout x', current.x);
                x = current.x;
            }
            if( y == null) {
                //print('inherit layout y', current.y);
                y = current.y;
            }
            // inherit padding
            if (padding == null) {
                padding = current.padding;
            }
        }
        var layout = {
            x:x, y:y, ox:x, oy:y, mode:mode, padding:padding, maxw:0, maxh:0,
            totalw:0, totalh:0
        };
        //log('pushing layout', mode, padding, x, y, layout.ox, layout.oy);
        layout_stack.push(layout);
        return layout; // so you can modify it
    }

    function layout_increment(rect) {
        var layout = layout_peek();
        if (layout != null) {
            if (layout.mode=='vertical') {
                var dy = rect.height + layout.padding;
                layout.y += dy;
                layout.totalh = layout.y - layout.oy;
                layout.totalw = Math.max(layout.totalw, rect.width);
                layout.maxw = layout.totalw;
            } else if (layout.mode=='horizontal') {
                var dx = rect.width + layout.padding;
                layout.x += dx;
                layout.totalw = layout.x - layout.ox;
                layout.totalh = Math.max(layout.totalh, rect.height);
                layout.maxh = layout.totalh;
            }
            if (layout.mode!='none') {
                layout.maxw = Math.max(layout.maxw, rect.width);
                layout.maxh = Math.max(layout.maxh, rect.height);
            }
        }
    }

    function layout_pop(increment) {
        if (increment == null) { increment = true; }
        var child = layout_stack.pop();
        // increment underlying layout by popped layout
        var parent = layout_peek();
        if ((parent != null) && increment) {
            var dx = child.x - child.ox;
            var dy = child.y - child.oy;
            //print('popping, delta x,y:', w, h);
            //print('popping, max w,h:', result.maxw, result.maxh);
            // increment parent by prev
            layout_increment(Rectangle(child.maxw, child.maxh));
            // update totals when... parent is
            // this is flcking confusing, but it's right
            if (parent.mode=='vertical' && child.mode=='horizontal') {
                // now we do some magik
                parent.totalw = Math.max(parent.totalw, child.x - child.ox);
                parent.totalh = Math.max(parent.totalh, parent.y - parent.oy);
            }
            if (parent.mode=='horizontal' && child.mode=='vertical') {
                // untested. nolive
                parent.totalw = Math.max(parent.totalw, parent.x - parent.oy);
                parent.totalh = Math.max(parent.totalh, child.y - child.oy);
            }
        }
        return child;
    }

    // modify the rect based on layout
    function layout_translate(rect) {
        var layout = layout_peek();
        if (layout != null && layout.mode != 'none') {
            //print('layout_translate', rect.x, rect.y, '>', layout.x, layout.y);
            rect.x = layout.x;
            rect.y = layout.y;
        }
    }

    function layout_translated(rect) {
        var new_rect = Rectangle(rect.x, rect.y, rect.width, rect.height);
        layout_translate(new_rect);
        return new_rect;
    }

    function on_mousepressed(x, y, button) {
        if (button=='l') {
            uistate.leftpress = true;
            uistate.leftheld = true;
        }
    }

    function on_mousereleased(x, y, button) {
        if (button=='l') {
            uistate.leftrelease = true;
            uistate.leftheld = false;
        }
    }

    // collect ticks here, run them later
    var tick_functions = [];
    function tick(fn) {
        tick_functions.push(fn);
        //print('inserting tick function')
    }

    function run_all_ticks() {
        //print('run_all_ticks', uistate.step, #tick_functions)
        for (var i=0; i < tick_functions.length; i++) {
            var fn = tick_functions[i];
            //print('!');
            fn();
        }
    }

    function main_loop(fn) {
        // print('main_loop');
        assert(fn!=null, 'fn is null');

        uistate.hotspots = [];
        uistate.hotitem = '';
        uistate.mouselocation = Point(GetCursorX(), GetCursorY());

        uistate.step = UIStep_Init;
        fn();

        // reverse iterate for hotspot z-index
        for (var i=uistate.hotspots.length-1; i >= 0; i--) {
            var hotspot = uistate.hotspots[i];
            if (!uistate.leftpress && uistate.leftheld) {
                uistate.hotitem = uistate.focusitem;
                break; //don't make items hot when mouse down unless they are also the focus item
            }
            if (rectangle_contains(hotspot.rect, uistate.mouselocation)) {
                uistate.hotitem = hotspot.id;
                break;
            }
        }

        uistate.step = UIStep_Logic;
        fn();

        if (debug_draw_debuglines) {
            throw 'not implemented (nolive)'; // nolive string format not implemented
            debuglines.push( string.format('hotitem: %s', uistate.hotitem) );
            debuglines.push( string.format('focusitem: %s', uistate.focusitem) );
            debuglines.push( string.format('activatingitem: %s', uistate.activatingitem) );
            debuglines.push( string.format('activateditem: %s', uistate.activateditem) );
            debuglines.push( string.format('mouse x: %d', uistate.mouselocation.x) );
            debuglines.push( string.format('mouse y: %d', uistate.mouselocation.y) );
            debuglines.push( string.format('leftpress: %s', tostring(uistate.leftpress)) );
            debuglines.push( string.format('leftheld: %s', tostring(uistate.leftheld)) );
            debuglines.push( string.format('leftrelease: %s', tostring(uistate.leftrelease)) );
            DrawText(table.concat(debuglines,'\n'), 200, 50, Color(1,0,0,1));
            debuglines = {};
        }

        uistate.step = UIStep_Draw;
        fn();

        if (M.config.drawhotspots_enable) {
            for (var i=1; i < uistate.hotspots.length; i++) {
                var hotspot = uistate.hotspots[i];
                draw.rectangle(hotspot.rect, Color(1,0,0,0.5));
            }
        }

        // reset before next tick
        uistate.leftpress = false;
        uistate.leftrelease = false;
        layout_stack = [];
    }

    function on_tick() {
        //var start = os.clock()
        
        main_loop(run_all_ticks);
        tick_functions = [];
        
        // now draw offscreen canvas to screen canvas, if that's how we configured in driver
        if (canvas === canvas_off) {
            canvas_screen.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height);
        }        
    }

    function add_hotspot(uiid, rect) {
        layout_translate(rect);
        assert(rect.x != null, 'rect.x cannot be null');
        assert(rect.y != null, 'rect.y cannot be null');
        assert(rect.width != null, 'rect.width cannot be null');
        assert(rect.height != null, 'rect.height cannot be null');
        var hotspot = Hotspot(uiid, rect);
        uistate.hotspots.push(hotspot);
    }

    function standard_logic(uiid, activatingtrigger, activatedtrigger) {
        if (activatingtrigger == null) { activatingtrigger = uistate.leftpress; }
        if (activatedtrigger == null) { activatedtrigger = uistate.leftrelease; }

        var just_activated = false;
        var just_activating = false;

        if (uistate.hotitem == uiid) {
            if (activatingtrigger) {
                uistate.focusitem = uiid;
                uistate.activatingitem = uiid;
                just_activating = true;
            }
            if (uistate.focusitem == uiid) {
                if (uistate.activatingitem == uiid) {
                    if (activatedtrigger) {
                        uistate.activateditem = uiid;
                        just_activated = true;
                    }
                }
            }
        }

        if (activatedtrigger && uistate.activatingitem == uiid) {
            uistate.activatingitem = '';
            uistate.activateditem = uiid;
        }

        return {
            just_activated:just_activated, changed:just_activated,
            just_activating:just_activating
        };
    }

    // optional color
    function do_label(id, text, rect, color) {
        if (uistate.step == UIStep_Init) {
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
            // pass
            layout_increment(rect);
        } else if (uistate.step == UIStep_Draw) {
            layout_translate(rect);
            var valign = draw.vertical_center_text(rect);
            draw.label(text, valign, color);
            layout_increment(rect);
        }
    }

    function do_rectangle(uiid, rect, color) {
        if (uistate.step == UIStep_Init) {
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
            layout_increment(rect);
            return {};
        } else if (uistate.step == UIStep_Draw) {
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.rectangle(rect, color);
            layout_increment(rect);
        }
        return {};
    }

    // todo: rect param is actually first_rect
    function do_button(uiid, text, rect, text_offset_x, text_offset_y) {
        var cache = ui.get_cache(uiid, function() {
            return {
                'rect': rect,
            }
        });
        if (uistate.step == UIStep_Init) {
            add_hotspot(uiid, rect);
            //var trect = layout_translated(rect);
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
            layout_translate(rect);
            //draw.rectangle(rect, Color(0,1,1));
            layout_increment(rect);

            var res = standard_logic(uiid);
            res.cache = cache;
            return res

        } else if (uistate.step == UIStep_Draw) {
            var state = calc_drawstate(uiid);
            layout_translate(cache.rect);
            //draw.rectangle(Rectangle(rect.x, rect.y, rect.width, 1), Color(0,1,1,0.2));
            draw.button(text, cache.rect, state, text_offset_x, text_offset_y);
            layout_increment(cache.rect);
        }
        return cache;
    }

    // returns changed, new_value
    // result, my_bool = do_checkbox('checkbox-a', Rectangle(x,y,w,h), my_bool)
    function do_checkbox(uiid, rect, value) {
        if (uistate.step == UIStep_Init) {
            add_hotspot(uiid, rect);
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
            var logic = standard_logic(uiid);
            logic.value = !value;
            return logic;
        } else if (uistate.step == UIStep_Draw) {
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.checkbox(uiid, rect, state, value);
            layout_increment(rect);
        }
        return {just_activated:false, changed:false, value:value};
    }

    // returns changed, new_value (when clamped)
    function do_progressbar(uiid, rect, max, value) {
        assert(uiid != '', 'id cannot be blank');
        assert(max != null, 'max cannot be null');
        if (uistate.step == UIStep_Init) {
            layout_increment(rect)
        } else if (uistate.step == UIStep_Logic) {
            var clamped_value = clamp(value, 0, max);
            if (clamped_value != value) {
                return {changed:true, just_activated:true, value:clamped_value};
            }
        } else if (uistate.step == UIStep_Draw) {
            // todo: just pass uistate?
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.progressbar(uiid, rect, state, max, value);
            layout_increment(rect);
        }
        return {value:value};
    }

    function do_slider(uiid, rect, min, max, value, fractional, handle_label) {
        assert(uiid != '', 'id cannot be blank');
        assert(rect != null, 'rect cannot be null');
        assert(min != null, 'min cannot be null');
        assert(max != null, 'max cannot be null');
        assert(value != null, 'value cannot be null');
        var result = false;
        if (uistate.step == UIStep_Init) {
            // todo: cache hotspots? ya
            add_hotspot(uiid, rect);
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
    	    layout_translate(rect);
            var x = rect.x;
            var y = rect.y;
    	    var w = rect.width;
    	    var h = rect.height;
    	    var range = max - min;

            var res = standard_logic(uiid);

            if (uistate.focusitem == uiid && uistate.activatingitem == uiid) {
                var mousepos = uistate.mouselocation.x - x;
                mousepos = clamp(mousepos, 0, w);
                // range / w == units per pixel
                var v = mousepos * (range / w) + min;
                if (!fractional) {
                    v = round(v, 0);
                }
                if (v != value) {
                    result = true;
                    value = v;
                }
            }
            //layout_increment(rect);
        } else if (uistate.step == UIStep_Draw) {
            // todo: just pass uistate?
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.slider(uiid, rect, state, min, max, value, handle_label);
            layout_increment(rect);
        }
        return {changed:result, just_activated:result, value:value};
    }

    function do_vslider(uiid, rect, min, max, value, fractional, handle_label) {
        assert(uiid != '', 'id cannot be blank');
        assert(rect != null, 'rect cannot be null');
        assert(min != null, 'min cannot be null');
        assert(max != null, 'max cannot be null');
        assert(value != null, 'value cannot be null');
        var result = false;
        if (uistate.step == UIStep_Init) {
            // todo: cache hotspots? ya
            add_hotspot(uiid, rect);
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
    	    layout_translate(rect);
            var x = rect.x;
            var y = rect.y;
    	    var w = rect.width;
    	    var h = rect.height;
    	    var range = max - min;

            var res = standard_logic(uiid);

            if (uistate.focusitem == uiid && uistate.activatingitem == uiid) {
                var mousepos = uistate.mouselocation.y - y;
                mousepos = clamp(mousepos, 0, h);
                // range / w == units per pixel
                var v = mousepos * (range / h) + min;
                if (!fractional) {
                    v = round(v, 0);
                }
                if (v != value) {
                    result = true;
                    value = v;
                }
            }
            //layout_increment(rect);
        } else if (uistate.step == UIStep_Draw) {
            // todo: just pass uistate?
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.vslider(uiid, rect, state, min, max, value, handle_label);
            layout_increment(rect);
        }
        return {changed:result, just_activated:result, value:value};
    }

    // value is expected to be truthy
    function do_checkbutton(uiid, text, rect, value, text_offset_x, text_offset_y) {
        assert(uiid != '', 'id cannot be blank');
        var result = false;
        if (uistate.step == UIStep_Init) {
            add_hotspot(uiid, rect);
            layout_increment(rect);
        } else if (uistate.step == UIStep_Logic) {
            var res = standard_logic(uiid);
            if (res.just_activated) {
                result = true;
                value = !value;
            }
        } else if (uistate.step == UIStep_Draw) {
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.checkbutton(text, rect, state, value, text_offset_x, text_offset_y);
            layout_increment(rect);
        }
        return {changed:result, just_activated:result, value:value};
    }

    // you can drag it around, anywhere.
    var activated_delta_x = 0;
    var activated_delta_y = 0;
    function do_handle(uiid, rect, value1, value2) {
        assert(uiid != '', 'id cannot be blank');
        assert(rect != null, 'rect cannot be null');
        var result = false;
        if (uistate.step == UIStep_Init) {
            // todo: cache hotspots? ya
            add_hotspot(uiid, rect)
            layout_increment(rect)
        } else if (uistate.step == UIStep_Logic) {
    	    layout_translate(rect);
    	    var x = rect.x;
    	    var y = rect.y;
    	    var w = rect.width;
    	    var h = rect.height;
    	    var i = w;

            var res = standard_logic(uiid);

            if (res.just_activating) {
                activated_delta_x = uistate.mouselocation.x - value1; // rect.x
                activated_delta_y = uistate.mouselocation.y - value2; // rect.y
            }

            if (uistate.activatingitem == uiid) {
                //var mousepos = uistate.mouselocation.x - x
                //mousepos = clamp(mousepos, 0, i)
                //var v = round(mousepos * max / i, 0)
                //if (v != value) then
                    result = true;
                    value1 = uistate.mouselocation.x - activated_delta_x;
                    value2 = uistate.mouselocation.y - activated_delta_y;
                //end
            }
            //draw.text('x',uistate.mouselocation.x-5,uistate.mouselocation.y-5,0xffff0000)
            layout_increment(rect);
        } else if (uistate.step == UIStep_Draw) {
            // todo: just pass uistate?
            var state = calc_drawstate(uiid);
            layout_translate(rect);
            draw.handle(uiid, rect, state);
            layout_increment(rect);
        }
        return {changed:result, just_activated:result, activated_delta_x:value1, activated_delta_y:value2};
    }

    M.tick = tick;
    M.Hotspot = Hotspot;
    M.clamp = clamp;
    M.rectangle_contains = rectangle_contains;
    M.DrawState = DrawState;
    M.calc_drawstate = calc_drawstate;
    M.get_cache = get_cache;
    M.set_cache = set_cache;
    M.layout_push = layout_push;
    M.layout_pop = layout_pop;
    M.layout_peek = layout_peek;
    M.layout_translate = layout_translate;
    M.add_hotspot = add_hotspot;
    M.layout_increment = layout_increment;
    M.on_mousepressed = on_mousepressed;
    M.on_mousereleased = on_mousereleased;
    M.on_tick = on_tick;
    M.standard_logic = standard_logic;
    //
    M.label = do_label;
    M.rectangle = do_rectangle;
    M.button = do_button;
    M.checkbox = do_checkbox;
    M.progressbar = do_progressbar;
    M.slider = do_slider;
    M.vslider = do_vslider;
    M.checkbutton = do_checkbutton;
    M.handle = do_handle;
    //
    M.state = uistate;
    //

    M.config.drawbox_gradient = make_drawbox_gradient(
        context,
        box_gradient_x1, box_gradient_y1,
        box_gradient_x2, box_gradient_y2,
        box_gradient_color_stop1,
        box_gradient_color_stop2
    );

    return M;

})();
