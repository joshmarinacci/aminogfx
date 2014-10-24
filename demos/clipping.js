var amino = require('../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group()
        .x(100).y(100).w(100).h(100).cliprect(1);
    stage.setRoot(root);
    var circle = new amino.Circle().radius(50)
        .fill('#ffcccc').filled(true)
        .x(0).y(0);
    root.add(circle);
});
