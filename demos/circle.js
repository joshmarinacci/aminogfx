var amino = require('aminogfx');

amino.start(function(core, stage) {
    var root = new amino.Group();
    stage.setRoot(root);
    var circle = new amino.Circle().radius(50)
        .fill('#ffcccc').filled(true)
        .x(100).y(100);
    root.add(circle);
});
