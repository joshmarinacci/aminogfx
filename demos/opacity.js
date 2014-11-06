var amino = require('../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group();
    stage.setRoot(root);
    var rect = new amino.Rect().fill("#00ff00").opacity(1.0);
    root.add(rect);
    rect.opacity.anim().from(1.0).to(0.0).dur(1000).loop(-1).start();
});
