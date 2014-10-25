var amino = require('../../main.js');



amino.start(function(core, stage) {
    amino.registerFont({
         name:'Oswald',
         path:__dirname+'/resources/oswald/',
         weights: {
              200: {
                   normal:'Oswald-Light.ttf',
              },
              400: {
                   normal:'Oswald-Regular.ttf',
              },
              800: {
                   normal:'Oswald-Bold.ttf',
              }
         }
    });

    var root = new amino.Group();
    stage.setSize(600,800);
    stage.setRoot(root);


    var text = new amino.Text().fontName('Oswald')
        .text('Oswald Regular')
        .fontSize(80)
        .fontWeight(200)
        .x(50).y(150)
        .fill('#ffff00')
        ;
    root.add(text);

});


/*
BUGS:
    setting fill after setting text doesn't update it properly. text is still old color
    same with font size

*/
