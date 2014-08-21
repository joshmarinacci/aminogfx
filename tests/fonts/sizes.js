var amino = require('amino.js');



amino.start(function(core, stage) {

    var root = new amino.Group();
    stage.setSize(600,800);
    stage.setRoot(root);


    amino.registerFont({
         name:'CoolFont',
         path:__dirname+'/fonts/',
         weights: {
              100: {
                   normal:'CoolFont-ExtraLight.ttf',
                   italic:'CoolFont-ExtraLight-Italic.ttf',
              },
              400: {
                   normal:'CoolFont-regular.ttf',
                   italic:'CoolFont-italic.ttf',
              },
              900: {
                   normal:'CoolFont-ExtraBold-Regular.ttf',
                   italic:'CoolFont-ExtraBold-Italic.ttf',
              }
         }
    });



    for(var i=0; i<10; i++) {
        var text = new amino.Text()
            .fontSize(10+i*3)
            .fill('#ffffff')
            .text("ABC def 123 .,/")
            .y(50+i*40)
            .x(50)
            ;
        root.add(text);
    }




});


/*
BUGS:
    setting fill after setting text doesn't update it properly. text is still old color
    same with font size

*/
