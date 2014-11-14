var amino = require('../../main.js');
var PImage = require('../../../node-pureimage/src/pureimage');
var comp = require('../../../richtext/rt2/component');
var Document = require('../../../richtext/rt2/document').Document;


function makeStyledJSDoc() {
    var frame = Document.makeFrame();
    frame.styles = {
        'bold': {
            'font-style':'normal',
            'font-family':"'Source Serif Pro'",
            'font-weight':'700',
        },
        'italic': {
            'font-style':'italic',
            'font-family':"'Source Serif Pro'",
        },
        'code': {
            'color':'#000000',
            'font-family':"'Source Code Pro'",
            'background-color':'#ccffee',
        },

        'paragraph': {
            'color':'#000000',
            'font-size':15,
            'font-family':"'Source Serif Pro'",
            'font-style':'normal',
            'background-color':'#ffffff',
            'font-weight':'400',
            'block-padding':15,
            'border-color':'#000000',
        },
        'header': {
            'font-size':30,
            'font-family':"'Source Sans Pro'",
            'block-padding':10,
        },
        'subheader': {
            'font-size':20,
            'font-family':"'Source Sans Pro'",
            'block-padding':10,
        },
        'left': {
            'font-size':25,
            'font-family':"'Source Sans Pro'",
            'block-padding':10,
            'text-align':'left',
        },
        'center': {
            'font-size':25,
            'font-family':"'Source Sans Pro'",
            'block-padding':10,
            'text-align':'center',
        },
        'right': {
            'font-size':25,
            'font-family':"'Source Sans Pro'",
            'block-padding':10,
            'text-align':'right',
        },
    }

    var blk = frame.insertBlock();
    blk.stylename = 'paragraph';
    blk.insertSpan("This is some plain text");
    blk.insertSpan(" italic,").stylename = 'italic';
    blk.insertSpan(" bold,").stylename = 'bold';
    blk.insertSpan(" and code,").stylename = 'code';
    blk.insertSpan(" yet again.");
    blk.insertSpan(" And now for a really long span that will have to be wrapped."
    +" It really is pretty long, don't you think?");
    var blk = frame.insertBlock();
    blk.stylename = 'header';
    blk.insertSpan("This is a header");
    var blk = frame.insertBlock();
    blk.stylename = 'subheader';
    blk.insertSpan("This is a sub header");

    var blk = frame.insertBlock();
    blk.stylename = 'paragraph';
    blk.insertSpan("Another paragraph of text is here. I think this is pretty cool. Don't you think so? Let's type some more so that the text will wrap.");
    var blk = frame.insertBlock();
    blk.stylename = 'paragraph';
    blk.insertSpan("Another paragraph of text is here. I think this is pretty cool. Don't you think so? Let's type some more so that the text will wrap.");
    return frame;
}

function syncBuffers(pv,img,ctx) {
    //copy pixels
    for(var i=0; i<img.width; i++) {
        for(var j=0; j<img.height; j++) {
            //var pixel = img.getPixelAsRGB(i,j);
            var pixel = ctx.getPixeli32(i,j);
            //console.log("copying",)
            if(i >= pv.pw()) continue;
            if(j >= pv.ph()) continue;
            pv.setPixeli32(i,j, pixel);
        }
    }
    pv.updateTexture();
}

var pv;
var fnt = PImage.registerFont('../node-pureimage/tests/fonts/SourceSansPro-Regular.ttf','Source Sans Pro');
fnt.load(function() {

    var img = PImage.make(800,600);
    var ctx = img.getContext('2d');
    ctx.setFillStyleRGBA(0,255,0, 1);
    var config = {
        context:ctx,
        frame:makeStyledJSDoc(),
        width:  600,
        height: 400,
        charWidth : function(ch,
                font_size,
                font_family,
                font_weight,
                font_style
            ) {
            ctx.setFont(font_family,font_size);
            return ctx.measureText(ch).width;
        },
        requestAnimationFrame: function(redraw) {
            console.log('redraw requested');
            redraw();
            syncBuffers(pv,img,ctx)
        }
    }
    var rte = comp.makeRichTextView(config);
    rte.relayout();
    rte.redraw();


    amino.start(function(core, stage) {
        var root = new amino.Group().x(0).y(0);
        pv = new amino.PixelView().pw(800).w(800).ph(600).h(600);
        root.add(pv);
        stage.setRoot(root);
        core.on('keypress',null,function(e) {
            console.log("a key was pressed");
            var codes_to_keys = {
                286:'RIGHT',
                285:'LEFT',
                284:'DOWN',
                283:'UP',
                295:'BACK_DELETE',
                46:'FORWARD_DELETE',
                13:'ENTER',
            }
            console.log("raw event = ",e.keycode);
            if(codes_to_keys[e.keycode]) {
                rte.processKeyEvent({
                    recognized:true,
                    key: codes_to_keys[e.keycode],
                });
            }
        })

        pv.setPixel(0,0,255,0,0,255);
        syncBuffers(pv,img,ctx);
        stage.setSize(800,600);
    });
});
