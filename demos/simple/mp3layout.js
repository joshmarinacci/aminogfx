var gfx = require('../../main.js');
var cs = require('../../src/ConstraintSolver').getGlobal();

var Lbuild = function() {
    var text  = new gfx.Text();
    gfx.makeProps(text,{w:10,h:10,});
    function recalc() {
        text.w(text.calcWidth());
        text.h(text.calcHeight());
    }
    text.text.watch(recalc);
    text.fontSize.watch(recalc);
    return text;
}

gfx.start(function(core, stage) {
    var root = new gfx.Group();

    var window = new gfx.Group();
    var bg = new gfx.Rect().fill("#cccccc").id("bg");
    bg.acceptsMouseEvents = true;
    window.add(bg);
    cs.c(bg,'w = parent.w');
    cs.c(bg,'h = parent.h');


    var toolbar = new gfx.Group().h(100);
    window.add(toolbar);
    cs.c(toolbar,'w = parent.w');

    var toolbar_bg = new gfx.Rect().fill("#eeeeee").id("tbbg");
    toolbar.add(toolbar_bg);
    cs.c(toolbar_bg,'w = parent.w');
    cs.c(toolbar_bg,'h = parent.h');

    var uigray = '#888888';
    var prev = new gfx.Rect().w(20).h(20).fill(uigray).x(5).y(5);
    toolbar.add(prev);
    cs.c(prev,'x = parent.x + 20');
    cs.c(prev,'y = parent.h / 2');
    var play = new gfx.Rect().w(40).h(40).fill(uigray).x(105).y(5);
    toolbar.add(play);
    cs.c(play,'x = source.x + source.w + 20',prev,prev);
    cs.c(play,'y = parent.h / 2');
    var next = new gfx.Rect().w(20).h(20).fill(uigray).x(205).y(5);
    toolbar.add(next);
    cs.c(next,'x = source.x + source.w + 20',play,play);
    cs.c(next,'y = parent.h / 2');
    toolbar.h(60);


    var search = new gfx.Rect().w(100).h(20).fill(uigray);
    toolbar.add(search);
    cs.c(search,'x = parent.w - 120');
    cs.c(search,'y = parent.h / 2');

    var lcd = new gfx.Rect().fill(uigray).y(10);
    toolbar.add(lcd);
    cs.c(lcd,'x = source.x + source.w + 40', next, next);
    //cs.c(lcd,'y = 20');
    cs.c(lcd,'h = parent.h - 20');
    cs.c(lcd,'w = parent.w - 400 ')




    var sourcelist = new gfx.Rect().fill("#ff0000");
    window.add(sourcelist);
    cs.c(sourcelist,'y = source.h', toolbar);
    cs.c(sourcelist,'h = parent.h - source.h', window, toolbar);

    var column1 = new gfx.Rect().fill('#00ff00');
    window.add(column1);
    cs.c(column1,'x = source.w',sourcelist);
    cs.c(column1,'y = source.h', toolbar);
    cs.c(column1,'h = parent.h - source.h',window,toolbar);
    sourcelist.w(150);
    column1.w(150);


    var albumview = new gfx.Rect().fill("#0000ff");
    window.add(albumview);
    cs.c(albumview,'x = source.w + source.w', sourcelist,column1);
    cs.c(albumview,'h = parent.h - source.h',window,toolbar);
    cs.c(albumview,'y = source.h', toolbar);
    cs.c(albumview,'w = parent.w - source.w + source.w',window,sourcelist,column1);


    var resize = new gfx.Rect().w(20).h(20).fill(uigray);
    resize.acceptsMouseEvents = true;
    window.add(resize);
    cs.c(resize,'x = parent.w - 20');
    cs.c(resize,'y = parent.h - 20');
    core.on('drag',resize,function(e) {
        window.w(window.w()+e.delta.x);
        window.h(window.h()+e.delta.y);
    });

    core.on("drag",bg,function(e) {
        window.x(window.x()+e.delta.x);
        window.y(window.y()+e.delta.y);
    });


    root.add(window);
    cs.process();
    stage.setRoot(root);
    window.w(600).h(400);
    stage.setSize(800,600);
});
