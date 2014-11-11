var amino = require('../main.js');

amino.start(function(core, stage) {
    var root = new amino.Group();
    stage.setRoot(root);
    var iv = new amino.ImageView();
    iv.src("demos/slideshow/images/iTermScreenSnapz001.png");
    root.add(iv);
});
