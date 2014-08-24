var amino = require('amino');
var Group = require('amino').Group;
var Rect = require('amino').Rect;
var Text = require('amino').Text;
var Polygon = require('amino').Polygon;

function Adsr() {
    amino.makeProps(this, {
        a:100,
        d:200,
        s:50,
        r:300
    });
    return this;
};




amino.start(function(core, stage) {

    //create the model
    var adsr = new Adsr();

    //root for the whole window
    var root = new Group();
    stage.setRoot(root);

    //group for the polygons and controls (not the text labels)
    var g = new Group();
    root.add(g);


    //4 polygons, each a different color
    var aPoly = new amino.Polygon().fill("#00eecc");
    var dPoly = new Polygon().fill("#00cccc");
    var sPoly = new Polygon().fill("#00aacc");
    var rPoly = new Polygon().fill("#0088aa");
    g.add(aPoly,dPoly,sPoly,rPoly);
    g.find('Polygon').filled(true);

    //5th polygon for the border, not filled
    var border = new Polygon().fill("#ffffff").filled(false);
    g.add(border);


    //update the polygons when the model changes
    function updatePolys() {
        border.geometry([0,200,
            adsr.a(),50,
            adsr.d(),adsr.s(),
            adsr.r(),adsr.s(),
            300,200]);
        aPoly.geometry([
            0,200,
            adsr.a(),50,
            adsr.a(),200
            ]);
        dPoly.geometry([
            adsr.a(),200,
            adsr.a(),50,
            adsr.d(),adsr.s(),
            adsr.d(),200,
            ]);
        sPoly.geometry([
            adsr.d(),200,
            adsr.d(),adsr.s(),
            adsr.r(),adsr.s(),
            adsr.r(),200,
            ])
        rPoly.geometry([
            adsr.r(),200,
            adsr.r(),adsr.s(),
            300,200
            ]);

    }

    adsr.a.watch(updatePolys);
    adsr.d.watch(updatePolys);
    adsr.s.watch(updatePolys);
    adsr.r.watch(updatePolys);


    //util function
    function minus(coeff) {
        return function(val) {
            return val-coeff;
        }
    };

    //make a handle bound to the adsr.a value
    var A = new Rect().y(50-10);
    A.x.bindto(adsr.a,minus(10));
    core.on('press', A, function(e) {
        adsr.a(e.target.x());
    })
    core.on('drag', A, function(e) {
        adsr.a(adsr.a()+e.dx);
    });

    //make a handle bound to the adsr.d value
    var D = new Rect();
    D.x.bindto(adsr.d,minus(10));
    D.y.bindto(adsr.s,minus(10));

    core.on('press', D, function(e) {
        adsr.d(e.target.x());
        adsr.s(e.target.y());
    })
    core.on('drag', D, function(e) {
        adsr.d(adsr.d()+e.dx);
        adsr.s(adsr.s()+e.dy);
    });


    //make a handle bound to the adsr.r value
    var R = new Rect();
    R.y.bindto(adsr.s,minus(10));
    R.x.bindto(adsr.r,minus(10));
    core.on('press', R, function(e) {
        adsr.s(e.target.y());
        adsr.r(e.target.x());
    });
    core.on('drag', R, function(e) {
        adsr.s(adsr.s()+e.dy);
        adsr.r(adsr.r()+e.dx);
    })


    //add and style the handles
    g.add(A,D,R);
    g.find('Rect').fill("#00ffff").w(20).h(20);


    //util function for formatted strings
    function format(str) {
        return function(v) {
            return str.replace("%",v);
        }
    }

    //make 4 text labels, each bound to an adsr value
    var label1 = new Text().y(50*1);
    label1.text.bindto(adsr.a, format("A: %"));

    var label2 = new Text().y(50*2);
    label2.text.bindto(adsr.d, format("D: %"));

    var label3 = new Text().y(50*3);
    label3.text.bindto(adsr.s, format("S: %"));

    var label4 = new Text().y(50*4);
    label4.text.bindto(adsr.r, format("R: %"));

    //add them all and style them
    root.add(label1,label2,label3,label4);
    root.find('Text').x(10).fill("#ffffff");

    //move the whole thing 200px right
    g.x(200).y(0);

    //set intial values of the model, forces an update of everything
    adsr.a(50).d(100).s(100).r(250);
});
