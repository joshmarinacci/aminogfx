var amino = require('amino.js');
var sp = require('superprops');

amino.startApp(function(core, stage) {

    var root = new sp.Group();
    stage.setRoot(root);

    var circle = new sp.Circle().radius(50)
        .fill('#ffcccc').filled(true)
        .x(100).y(100);
    root.add(circle);
});
