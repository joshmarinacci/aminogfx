var amino = require('../../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group().x(100).y(100);

    var pv = new amino.PixelView();
    root.add(pv);

    stage.setRoot(root);

});
