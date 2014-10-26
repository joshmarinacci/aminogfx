var amino = require('../../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group().x(100).y(100);

    var pv = new amino.PixelView().w(200).h(200).x(0).y(0);
    //var pv = new amino.Rect();
    root.add(pv);

    stage.setRoot(root);

});
