

var amino = require('../main');
var cs = require('../src/ConstraintSolver').build();


/*



hbox and vbox
toggle button
group of radio buttons selected bound to group.selected == this?
formatters for attached labels
new textbox. let labels bind to live or final text values
new listview that uses binding for selection.
    can i use existing one.git be able to recreate
scroll pane

node builder:
    button add a new node
    button to delete selected node
    drag nodes around
    selected node is different color
    click bg to select no node
    panel with list of properties from the node's x/y/w/h. use some sort of custom layout
        name:value labels only, aligned properly.

*/

var theme = {
    padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
    },
    button: {
        fill: '#dddddd',
        label:  {
            fill: '#000000',
        },
        padding: { left: 5, right: 5, top: 5, bottom: 5 },
        pressed: {
            fill: "#ffcccc",
        },
    },
    label: {
        fill: '#000000',
    },
    slider: {
        fill: "#00cc00",
        padding: { top: 5, left: 5, right: 5, bottom: 5 },
        thumb: {
            fill: "#ccffcc",
            width: 20,
            height: 20,
        },
    }

}

var Label = {
    make: function() {
        var text  = new amino.Text();
        amino.makeProps(text,{w:10,h:10,});
        function recalc() {
            text.w(text.calcWidth());
            text.h(text.calcHeight());
        }
        text.text.watch(recalc);
        text.fontSize.watch(recalc);
        return text;
    }
}

var Button = {
    make: function() {
        var base = new amino.Group().id("button_base");
        base.theme = theme.button;
        base.bg = new amino.Rect().w(10).h(10).fill(theme.button.fill).id("button_bg");
        base.bg.acceptsMouseEvents = true;
        base.add(base.bg);
        base.label = Label.make().text("a label").fill(base.theme.label.fill).id("button_label").x(base.theme.padding.left);
        base.add(base.label);
        amino.makeProps(base,{ text:'blah', fontSize:20, fontName: 'source'});
        //some special case stuff for the text label
        base.text.watch(function(v) { base.label.text(v); });
        base.fontSize.watch(function(v) { base.label.fontSize(v); });
        base.fontName.watch(function(v) { base.label.fontName(v); });
        base.label.h.watch(function(v) { base.label.y(v); });

        cparse3(base,   'w = source.w + 10', base.label);
        cparse3(base,   'h = source.h + 10', base.label);
        cparse3(base.bg,'w = parent.w');
        cparse3(base.bg,'h = parent.h');
        //c(base.bg,   "fill = parent.pressed ? parent.theme.pressed.fill : parent.theme.fill");
        base.fontSize(30);
        base.onAction = function(cb) {
            this.cb = cb;
        }
        var self = base;
        amino.getCore().on('press',base.bg, function(e){
            base.bg.fill(base.theme.pressed.fill);
        });
        amino.getCore().on('release',base.bg, function(e){
            base.bg.fill(base.theme.fill);
            if(self.cb) self.cb();
        })
        return base;
    }
}

var Slider = {
    make: function() {
        var base = new amino.Group().id("slider_parent");
        amino.makeProps(base,{ w:300, h:30, min: 0, max: 100, value: 50 });
        base.theme = theme.slider;
        base.h(base.theme.height);
        base.bg = new amino.Rect().fill(base.theme.fill).id("slider_bg");
        base.add(base.bg);
        base.thumb = new amino.Rect().fill(base.theme.thumb.fill);
        base.add(base.thumb);
        cparse3(base.bg, 'x = parent.left');
        cparse3(base.bg, 'y = parent.top');
        cparse3(base.bg, 'w = parent.w');
        cparse3(base.bg, 'h = parent.h');
        base.thumb.w(base.theme.thumb.width);
        base.thumb.h(base.theme.thumb.height);
        base.thumb.y(base.theme.padding.top);
        base.thumb.x(base.theme.padding.left);
        base.thumb.acceptsMouseEvents = true;

        amino.getCore().on('drag',base.thumb,function(e) {
            var tx = e.point.x+base.thumb.x()-base.thumb.w()/2;
            var tval = tx/base.w();
            var sval = base.min() + tval*(base.max()-base.min());
            if(sval < base.min()) sval = base.min();
            if(sval > base.max()) sval = base.max();
            base.value(sval);
            var tval2 = (sval - base.min())/(base.max()-base.min());
            var tval3 = tval2*(base.w()-base.thumb.w() - base.theme.padding.left - base.theme.padding.right) + base.theme.padding.left;
            base.thumb.x(tval3);
        });

        return base;
    }
}

var Scrollbar = {
    make: function() {
        var base = new amino.Group();
        amino.makeProps(base, { min: 0, max: 300, value: 0});
        base.bg  = new amino.Rect().fill("#888888");
        base.add(base.bg);
        cparse3(base.bg,'w = parent.w');
        cparse3(base.bg,'h = parent.h');
        base.prev = Button.make().fontName('awesome').text("\uf139").fontSize(20);
        base.add(base.prev);
        base.next = Button.make().fontName('awesome').text("\uf13a").fontSize(20).y(50);
        base.add(base.next);
        cparse3(base.next,'y = parent.h - 30');
        cparse3(base,'w = source.w', base.prev);

        base.thumb = new amino.Rect().fill("#cccccc").h(40).y(40);
        base.add(base.thumb);
        cparse3(base.thumb,'w = parent.w');

        return base;
    }
}

var Checkbox = {
    make: function() {
        var base = new amino.Group();
        amino.makeProps(base, { selected:false });
        base.bg    = new amino.Rect().fill("#ff0000").opacity(0);
        base.add(base.bg);
        base.check = Button.make().fontName('awesome').text("\uf096").fontSize(20);
        base.add(base.check);
        cparse3(base.bg, "w = parent.w");
        cparse3(base.bg, "h = parent.h");
        base.label = Label.make().text("a checkbox").fill("#ffff00").fontSize(20);
        base.add(base.label);
        cparse3(base.label,'x = source.right + 10',base.check);
        cparse3(base.label,'y = source.h', base.label);
        cparse3(base,'w = source.w + source.x + 20',base.label, base.label);
        cparse3(base,'h = source.h + 10', base.label);
        amino.getCore().on('press', base.bg, function() {
            base.selected(!base.selected());
        });
        base.check.onAction(function() { base.selected(!base.selected()); });
        base.selected.watch(function(v) {
            if(v == true) {
                base.check.text("\uf046");
            } else {
                base.check.text("\uf096");
            }
        });
        return base;
    }
}

/*
vbox
    when child is added apply the constraints
    child.x = parent.left + theme.vbox.padding.left
    child.y = prev.y + prev.h + theme.vbox.spacing
    child.w // intrinsic
    child.h // intrinsic

    vbox.w = //external or max width of children
    vbox.h = //external or sum height of children

hbox would be simliar
*/

/*
scrollpane
    controls position of all of its children using scrollbars
    scrollbar enabled or disabled based on if max(children.w) > scrollpane.w
    same for height
*/

/*
visual programmer
node is a titlebar and an autosized two column grid
can connect nodes with lines.
lines are objects with start.x and end.x, they may be positioned with constraints
node.x and y are unbound, set with direct manipulation

use constraints for colors? ex:
    node.fill = (global.selected_node == node) ? red : blue
we need:
    prefab function for dragging

do we need to synthsize new functions for each constraint or do tricky things with the 'this' variable?

write an ometa parser to make this easier;
--------
*/

var DNode = {
    make:function() {
        var base = new amino.Group().id("dnode");

        base.bg = new amino.Rect().fill("cc8822").w(100).h(200);
        base.bg.acceptsMouseEvents = true;
        base.add(base.bg);
        cparse3(base.bg,'h = parent.h');
        cparse3(base.bg,'w = parent.w');

        base.label = Label.make().text("node 1").x(5).y(20).fontSize(15).fill("#ffffff");
        base.add(base.label);

        amino.getCore().on('drag', base.bg, function(e){
            base.x(base.x()+e.delta.x);
            base.y(base.y()+e.delta.y);
        });

        return base;
    },
    makeLine: function(A,B) {
        var base = new amino.Polygon().filled(false).closed(false);
        amino.makeProps(base,{
            startx:0,
            starty:0,
            endx:0,
            endy:0,
        });
        function updateLine() {
            base.geometry([base.startx(),base.starty(), base.endx(),base.endy()]);
        }
        base.startx.watch(updateLine);
        base.starty.watch(updateLine);
        base.endx.watch(updateLine);
        base.endy.watch(updateLine);
        cparse3(base,'startx = source.x + source.w/2',A,A);
        cparse3(base,'starty = source.y + source.h/2',A,A);
        cparse3(base,'endx   = source.x + source.w/2',B,B);
        cparse3(base,'endy   = source.y + source.h/2',B,B);
        return base;
    }
}

function demo1() {
    cs.clear();
    var window = new amino.Group().id("window");
    var button = Button.make().text("A Button").x(100).y(200);
    window.add(button);
    cparse3(button,'x = parent.left + 300');
    cparse3(button,'y = parent.top + 50');

    var label = Label.make().text("a label").y(50).fill("#ffff00").id("label1");
    window.add(label);
    label.x(50);
    cparse3(label,'y = parent.top+100');


    var slider = Slider.make().min(50).max(100).value(90);
    window.add(slider);
    cparse3(slider,'x = parent.left + 50');
    cparse3(slider,'y = parent.top  + 200');
    var slabel = Label.make().text("0").fill("#ffff00").fontSize(20);
    window.add(slabel);
    cparse3(slabel,'x = source.right + 20',slider);
    cparse3(slabel,'y = parent.top + 200');


    slider.value.watch(function(v) { slabel.text(""+v) })



    var arrow = Label.make().fontName("awesome").text("\uf139").fill("#00ffff").x(100).y(300);
    window.add(arrow);


    var scrollbar = Scrollbar.make().w(30).h(200).x(500).y(10);
    window.add(scrollbar);


    var checkbox = Checkbox.make().x(10).y(300);
    window.add(checkbox);


    var dnode1 = DNode.make().x(400).y(300).w(100).h(200).id("node 1");
    window.add(dnode1);

    var dnode2 = DNode.make().x(200).y(400).id("node 2");
    window.add(dnode2);

    var line = DNode.makeLine(dnode1,dnode2);
    window.add(line);

    //force a refresh
    cs.process();
    return window;
}

/*

evaluation algorithm

backward:
    when property is set, mark it as invalid.
    find all constraints which use this property
        mark their targets invalid
        recurse until nothing is left
forward:
    when property is queried,
    if invalid
        find constraint which defines it
            calculate source properties
                if any source property is invalid
                    query that property
            evaluate the constraint and save value and return value
    else
        return value

*/



function eq(a,b) {
    if(a != b) throw new Error("TEST FAILED " + a + " != " + b);
    console.log("test passed");
}

//test basic equality lookup and simple functions
{
    var obj1 = new amino.Group().id("obj1");
    var obj2 = new amino.Group().id('obj2');
    cparse3(obj2,'x = source.x',obj1);
    cparse3(obj1,'y = source.y * 2',obj2);

    eq(cs.query(obj2,'x'),0);
    obj1.x(50);
    eq(cs.query(obj2,'x'),50);

    eq(cs.query(obj1,'y'),0);
    obj2.y(100);
    eq(cs.query(obj1,'y'),200);
}

//test parent lookup

{
    cs.clear();
    var parent = new amino.Group().id('group_parent');
    var child  = new amino.Group().id('group_child');
    parent.add(child);
    cparse3(child,'x = parent.x+30');
    eq(cs.query(child,'x'),30);
    parent.x(50);
    eq(cs.query(child,'x'),80);
    cparse3(child,'y = parent.x * 2');
    eq(cs.query(child,'y'),100);
    cparse3(child,'sx=parent.sx-20');
    eq(cs.query(child,'sx'),1-20);
    cparse3(child,'sy=parent.sy/2');
    eq(cs.query(child,'sy'),0.5);
    cs.clear();
}



{
    cs.clear();
    var parent = new amino.Group().id("group_parent")
        .x(50).w(50)
        .y(50).h(50);
    var child = new amino.Group().id("group_child")
    parent.add(child);
    cparse3(child,'x = parent.x + parent.w');
    eq(cs.query(child,'x'),100);
    parent.x(100);
    eq(cs.query(child,'x'),150);
    parent.w(100);
    eq(cs.query(child,'x'),200);

    cparse3(child,'y = parent.y + parent.h / 2');
    eq(cs.query(child,'y'),75);
    parent.y(100);
    eq(cs.query(child,'y'),125);
    parent.h(100);
    eq(cs.query(child,'y'),150);


    cs.clear();
    parent.x(50);
    parent.y(50);
    cparse3(child,'x = source.x + source.y',parent,parent);
    eq(cs.query(child,'x'),parent.x()+parent.y());

}

{
    //test the 'this' pseudo element
    cs.clear();
    var parent = new amino.Group().id("group_parent");
    var child  = new amino.Group().id("group_child");
    parent.add(child);
    cs.c(child,'x = parent.w - this.w');
    //cs.c(child,'x = parent.w - this.w');
    parent.w(200);
    child.w(50);
    eq(child.x(),150);
    //cs.debug_dumpAllConstraints();

    //this constraint doesn't work:  cs.c(next,'y = parent.h / 2 - 10');
    cs.c(child,'y = parent.h / 2 - 10');
    parent.h(200);
    eq(child.y(), 0);
}



// test that parent pseudo object really updates rules
{
    console.log("=========");
    cs.clear();
    var parent = new amino.Group().id("group_parent")
        .x(50).w(50)
        .y(50).h(50);
    var child = new amino.Group().id("group_child");
    parent.add(child);
    cs.parseConstraint(child,'x = parent.x');

    eq(cs.query(child,'x'),50);
    parent.x(100);
    eq(cs.query(child,'x'),100);
    parent.x(150);
    eq(child.x(),150);
}


//test that setting source property really updates the target without processing
{
    console.log("========");
    cs.clear();
    var source = new amino.Group().id("source").x(50);
    var target = new amino.Group().id("target").x(30);
    cs.parseConstraint(target,'x = source.x',source);
    var cons = cs.debug_findConstraintsForTarget(target);
    eq(cons.length,1);
    var con = cons[0];
    eq(con.target,target);
    //check that the newly created constraint is invalid
    eq(con.invalid,true);
    //hasn't updated yet
    eq(target.x(),30);
    cs.process();


    //now constraint should be valid
    eq(con.invalid,false);
    //now it should be updated
    eq(target.x(),50);

    source.x(60);
    //now it should be automatically updated
    eq(target.x(),60);

}


return;
amino.start(function(core,stage) {
    var root = new amino.Group();
    stage.setRoot(root);
    root.add(demo1());
});


function cparse3() {
    cs.parseConstraint.apply(cs,arguments);
}
