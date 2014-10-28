var amino = require('../../main.js');
var child = require('child_process');

var Workman = {
    count: 4,
    chs:[],
    init: function(chpath, cb, count) {
        if(typeof count == 'number') this.count = count;
        console.log("using thread count", this.count);
        for(var i=0; i<this.count; i++) {
            this.chs[i] = child.fork(chpath);
            this.chs[i].on('message',cb);
        }
    },
    sendcount:0,
    sendWork: function(msg) {
        this.chs[this.sendcount%this.chs.length].send(msg);
        this.sendcount++;
    }
}

amino.start(function(core, stage) {
    var root = new amino.Group().x(0).y(0);
    var pv = new amino.PixelView().pw(500).w(500).ph(500).h(500);
    root.add(pv);
    stage.setRoot(root);

    function generateMandlebrot() {
        var w = pv.pw();
        var h = pv.ph();
        function handleRow(m) {
            var y = m.iy;
            for(var x=0; x<m.row.length; x++) {
                var c = lookupColor(m.row[x]);
                pv.setPixel(x,y,c[0],c[1],c[2],255);
            }
            pv.updateTexture();
        }
        var workman = Workman;
        workman.init(__dirname+'/mandle_child.js',handleRow);
        var scale = 0.01;
        for(var y=0; y<h; y++) {
            var py = (y-h/2)*scale;
            var msg = {
                x0:(-w/2)*scale,
                x1:(+w/2)*scale,
                y:py,
                iw: w,
                iy:y,
                iter:100,
            };
            workman.sendWork(msg);
        }
    }

    var lut = [];
    for(var i=0; i<10; i++) {
        var s = (255/10)*i;
        lut.push([0,s,s]);
    }
    function lookupColor(iter) {
        return lut[iter%lut.length];
    }

    generateMandlebrot();
});
