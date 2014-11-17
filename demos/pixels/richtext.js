var amino = require('../../main.js');
var events = require('inputevents');
var comp = require('richtext');
var Document = comp.Document;

function makeStyledJSDoc() {
    var frame = Document.makeFrame();
    frame.styles = {
        'bold': {
            'font-style':'normal',
            'font-family':"'source'",
            'font-weight':'700',
        },
        'italic': {
            'font-style':'italic',
            'font-family':"'source'",
        },
        'code': {
            'color':'#000000',
            'font-family':"'source'",
            'background-color':'#ccffee',
        },

        'paragraph': {
            'color':'#000000',
            'font-size':15,
            'font-family':"'source'",
            'font-style':'normal',
            'background-color':'#ffffff',
            'font-weight':'400',
            'block-padding':15,
            'border-color':'#000000',
        },
        'header': {
            'font-size':30,
            'font-family':"'source'",
            'block-padding':10,
        },
        'subheader': {
            'font-size':20,
            'font-family':"'source'",
            'block-padding':10,
        },
        'left': {
            'font-size':25,
            'font-family':"'source'",
            'block-padding':10,
            'text-align':'left',
        },
        'center': {
            'font-size':25,
            'font-family':"'source'",
            'block-padding':10,
            'text-align':'center',
        },
        'right': {
            'font-size':25,
            'font-family':"'source'",
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




    amino.start(function(core, stage) {
        stage.setSize(800,600);
        var root = new amino.Group().x(0).y(0);
        stage.setRoot(root);

        var pv = new amino.RichTextView();
        root.add(pv);
        pv.build(makeStyledJSDoc());
        pv.sync();
    });
