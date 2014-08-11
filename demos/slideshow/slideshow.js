var amino = require('amino.js');
var fs = require('fs');
var Group = require('amino').Group;
var ImageView = require('amino').ImageView;


if(process.argv.length < 3) {
    console.log("you must provide a directory to use");
    return;
}

var dir = process.argv[2];
var filelist = fs.readdirSync(dir).map(function(file) {
    return dir+'/'+file;
});



function CircularBuffer(arr) {
    this.arr = arr;
    this.index = -1;
    this.next = function() {
        this.index = (this.index+1)%this.arr.length;
        return this.arr[this.index];
    }
}

//wrap files in a circular buffer
var files = new CircularBuffer(filelist);


amino.start(function(core, stage) {
    stage.setSize(800,600);

    var root = new Group();
    stage.setRoot(root);


    var sw = stage.getW();
    var sh = stage.getH();

    //create two image views
    var iv1 = new ImageView().x(0);
    var iv2 = new ImageView().x(1000);

    //add to the scene
    root.add(iv1,iv2);

    //auto scale them
    function scaleImage(img,prop,obj) {
        var scale = Math.min(sw/img.w,sh/img.h);
        obj.sx(scale).sy(scale);
    }
    iv1.image.watch(scaleImage);
    iv2.image.watch(scaleImage);

    //load the first two images
    iv1.src(files.next());
    iv2.src(files.next());



    //animate out and in
    function swap() {
        iv1.x.anim().delay(1000).from(0).to(-sw).dur(3000).start();
        iv2.x.anim().delay(1000).from(sw).to(0).dur(3000)
            .then(afterAnim).start();
    }
    swap();

    function afterAnim() {
        //swap images and move views back in place
        iv1.x(0);
        iv2.x(sw);
        iv1.image(iv2.image());
        iv2.src(files.next());
        //recurse
        swap();
    }

});
