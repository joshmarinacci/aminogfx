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

    var base = new gfx.Group().id("button_base");
    //base.theme = theme.button;
    base.bg = new gfx.Rect().w(10).h(10).fill("#ff0000").id("button_bg");
    base.bg.acceptsMouseEvents = true;
    base.add(base.bg);
    base.label = Lbuild().text("a label")
        .fill('#ffffff')
        .id("button_label")
        .x(5);
    base.add(base.label);

    gfx.makeProps(base,{ text:'blah', fontSize:20, fontName: 'source'});
    //some special case stuff for the text label
    base.text.watch(function(v) { base.label.text(v); });
    base.fontSize.watch(function(v) { base.label.fontSize(v); });
    base.fontName.watch(function(v) { base.label.fontName(v); });
    base.label.h.watch(function(v) { base.label.y(v); });

    cs.c(base,   'w = source.w + 10', base.label);
    cs.c(base,   'h = source.h + 10', base.label);
    cs.c(base.bg,'w = parent.w');
    cs.c(base.bg,'h = parent.h');
    //c(base.bg,   "fill = parent.pressed ? parent.theme.pressed.fill : parent.theme.fill");
    base.fontSize(20)//base.theme.fontSize)
    base.onAction = function(cb) {
        this.cb = cb;
        return this;
    }
    var self = base;
    gfx.getCore().on('press',base.bg, function(e){
        base.bg.fill("#00ff00");
    });
    gfx.getCore().on('release',base.bg, function(e){
        base.bg.fill("#0000ff");
        if(self.cb) self.cb();
    })

    root.add(base);
    cs.process();
    cs.debug_dumpAllConstraints();

    stage.setRoot(root);
});
