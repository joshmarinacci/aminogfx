var amino = require('../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group();
    stage.setRoot(root);
    var rect = new amino.Rect().fill("#00ff00").opacity(1.0);
    root.add(rect);
    rect.opacity.anim().from(1.0).to(0.0).dur(1000).loop(-1).start();

    var text = new amino.Text().fill("#ff0000").opacity(1.0).x(100).y(200);
    text.opacity.anim().from(0.0).to(1.0).dur(1000).loop(-1).start();
    root.add(text);

    var circle = new amino.Circle().radius(50)
        .fill('#0000ff').filled(true)
        .opacity(0.5)
        .x(200).y(50);

    root.add(circle);

});
