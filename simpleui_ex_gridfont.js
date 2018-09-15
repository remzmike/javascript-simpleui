// later: modularize

    /* ------------------------------------------------------------------ */
    // gridfonts : later: breakout
    var _gridfonts = {
        'hint-four': {}
    }
    var _letters = 'abcdefghijklmnopqrstuvwxyz';
    var _f = _gridfonts['hint-four'];
    // list of segments, each segment is a standalone stroke from x1,y1 to x2,y2
    _f[' '] = [ ];
    _f.a = [ [0,2,1,2], [1,2,2,3], [2,3,1,4], [1,4,0,3], [0,3,1,3] ];
    _f.b = [ [0,0,0,1], [0,1,0,2], [0,2,0,3], [0,3,1,4], [1,4,2,3], [2,3,1,2] ];
    _f.c = [ [1,2,0,3], [0,3,1,4], [1,4,2,4] ];
    _f.d = [ [2,0,2,1], [2,1,2,2], [2,2,2,3], [2,3,1,4], [1,4,0,3], [0,3,1,2] ];
    _f.e = [ [1,3,2,3], [2,3,1,2], [1,2,0,3], [0,3,1,4], [1,4,2,4] ];
    _f.f = [ [2,0,1,1], [1,1,1,2], [1,2,1,3], [1,3,1,4], [0,2,1,2] ];
    _f.g = [ [1,4,0,3], [0,3,1,2], [1,2,2,3], [2,3,2,4], [2,4,2,5], [2,5,1,6] ];
    _f.h = [ [0,0,0,1], [0,1,0,2], [0,2,0,3], [0,3,1,2], [1,2,2,3], [2,3,2,4] ];
    _f.i = [ [1,2,1,3], [1,3,1,4], [1,1,2,0] ];
    _f.j = [ [1,2,1,3], [1,3,1,4], [1,4,1,5], [1,5,0,6], [1,1,2,0] ];
    _f.k = [ [0,0,0,1], [0,1,0,2], [0,2,0,3], [0,3,1,3], [1,3,2,2], [1,3,2,4] ];
    _f.l = [ [1,0,1,1], [1,1,1,2], [1,2,1,3], [1,3,2,4] ];
    _f.m = [ [0,4,0,3], [0,3,1,2], [1,2,2,3], [2,3,2,4], [1,3,1,4] ];
    _f.n = [ [0,4,0,3], [0,3,1,2], [1,2,2,3], [2,3,2,4] ];
    _f.o = [ [0,2,1,2], [1,2,2,3], [2,3,1,4], [1,4,0,3] ];
    _f.p = [ [0,6,0,5], [0,5,0,4], [0,4,0,3], [0,3,1,2], [1,2,2,3], [2,3,1,4] ];
    _f.q = [ [2,6,2,5], [2,5,2,4], [2,4,2,3], [2,3,1,2], [1,2,0,3], [0,3,1,4] ];
    _f.r = [ [0,4,0,3], [0,3,1,2], [1,2,2,2] ];
    _f.s = [ [1,2,0,3], [0,3,1,3], [1,3,2,3], [2,3,1,4], [1,4,0,4] ];
    _f.t = [ [1,1,1,2], [1,2,1,3], [1,3,1,4], [1,4,2,3], [0,2,1,2] ];
    _f.u = [ [0,2,0,3], [0,3,0,4], [0,4,1,4], [1,4,2,3], [2,3,2,2] ];
    _f.v = [ [0,2,0,3], [0,3,1,4], [1,4,2,3], [2,3,2,2] ];
    _f.w = [ [0,2,0,3], [0,3,1,4], [1,4,2,3], [2,3,2,2], [1,2,1,3] ];
    _f.x = [ [0,2,1,3], [1,3,2,4], [2,2,1,3], [1,3,0,4] ];
    _f.y = [ [0,2,0,3], [0,3,1,4], [1,4,2,3], [2,3,2,4], [2,4,2,5], [2,5,1,6] ];
    _f.z = [ [1,2,2,2], [2,2,1,3], [1,3,0,4], [0,4,1,4], [1,4,2,4] ];        

    var _gridfont_gradient = make_drawbox_gradient(
        context,
        400, 400,
        1000, 1000,
        Color(0x00/255, 0xB5/255, 0xE3/255),
        Color(1,0,1)
    );

    {//global init
        var _gridfont_chars_a = 'abcdefghijklmnopqrstuvwxyz '.split('');
        var _gridfont_chars = {};
        for(var i=0;i<_gridfont_chars_a.length; i++) {
            _gridfont_chars[_gridfont_chars_a[i]] = true;
        }
    }

    function draw_line(x1,y1,x2,y2) {
        context.strokeStyle = _gridfont_gradient;
        context.beginPath();
        context.moveTo(round(x1), round(y1));
        context.lineTo(round(x2), round(y2));
        context.stroke();
    }

    // http://cogsci.indiana.edu/gridfonts.html
    // see also: hershey fonts: http://sol.gfxile.net/hershey/fontprev.html
    function do_gridfont(uiid, s, name, x, y, scale, reset) {
        var a = s.split('');
        var complete = true;
        var reset_complete = true;
        scale = scale || 6;
        for(var i=0; i<a.length; i++) {
            var letter = a[i];
            if (!_gridfont_chars[letter]) {
                letter = ' ';
            }
            _ = do_gridfont_letter(uiid+'-letter-'+str(i), name, x+i*(scale*3), y, letter, scale, reset);
            complete = complete && _.complete;
            reset_complete = reset_complete && _.reset_complete;
        }

        return {'complete': complete, 'reset_complete': reset_complete};
    }

    function do_gridfont_letter(uiid, name, x, y, letter, scale, reset) {
        var fl = _f[letter]; // font letter
        // nice place for lua coroutines... :-(

        var cache = ui.get_cache(uiid, function() {
            return {
                'complete': false,
                'reset_complete': false,
                'segment': 1,
                'partial': 0
            };
        });

        var segment = cache.segment;
        var partial = cache.partial;

        // draw lines up to segment count
        for (var i=0; i<fl.length; i++) {
            if (i==segment)
                break;
            var a1 = fl[i][0];
            var b1 = fl[i][1];
            var a2 = fl[i][2];
            var b2 = fl[i][3];
            var x1 = x + a1 * scale;
            var y1 = y + b1 * scale;
            var x2 = x + a2 * scale;
            var y2 = y + b2 * scale;
            draw_line(x1, y1, x2, y2);
        }
        // now draw current line... over multiple frames...
        // when complete then increment segment...
        if (segment < fl.length) {
            var i = segment;
            var a1 = fl[i][0];
            var b1 = fl[i][1];
            var a2 = fl[i][2];
            var b2 = fl[i][3];
            var x1 = x + a1 * scale;
            var y1 = y + b1 * scale;
            var x2 = x + a2 * scale;
            var y2 = y + b2 * scale;
            var dx = x2 - x1;
            var dy = y2 - y1;

            var p1 = x1 + dx * partial;
            var p2 = y1 + dy * partial;
            draw_line(x1, y1, p1, p2);

            var cursor_radius = 3;
            //var cursize = (1-partial) * cursor_radius;
            var cursize = cursor_radius;
            context.save();
            context.strokeStyle = _gridfont_gradient;
            context.fillStyle = _gridfont_gradient;
            DrawBox(p1-cursize, p2-cursize, cursize*2, cursize*2);
            //draw_line(Math.random()*2*400,Math.random()*2*500, p1, p2);
            context.restore();

            cache.partial += 0.033;
            partial = cache.partial; // blah.

            if (partial >= 1.0) {
                var leftover = partial - 1;
                if (leftover > 0) {
                    // later: leftovers! :-)
                }
                cache.partial = 0;
                cache.segment += 1;
            }
        }

        if (reset) {
            cache.segment = 1;
            cache.partial = 0;
            cache.reset_complete = true;
        }

        cache.complete = segment>=fl.length;
        return cache;
    }
