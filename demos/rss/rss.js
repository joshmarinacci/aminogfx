var amino = require('amino.js');
var FeedParser = require('feedparser');
var http = require('http');

var sw = 1280;
var sh = 720;

parseFeed('http://www.npr.org/rss/rss.php?id=1001',function(titles) {
    var titles = new CircularBuffer(titles);
    amino.start(function(core, stage) {
        var root = new amino.Group();
        stage.setSize(sw,sh);
        stage.setRoot(root);


        var bg = new amino.Group();
        root.add(bg);

        var textgroup = new amino.Group();
        root.add(textgroup);

        var line1 = new amino.Text().x(50).y(200).fill("#ffffff").text('foo').fontSize(80);
        var line2 = new amino.Text().x(50).y(300).fill("#ffffff").text('bar').fontSize(80);
        textgroup.add(line1,line2);

        function rotateOut() {
            textgroup.ry.anim().delay(5000).from(0).to(140).dur(2000).then(rotateIn).start();
        }
        function rotateIn() {
            setHeadlines(titles.next(),line1,line2);
            textgroup.ry.anim().from(220).to(360).dur(2000).then(rotateOut).start();
        }
        function setHeadlines(headline,t1,t2) {
            var max = 34;
            if(headline.length > max) {
                t1.text(headline.substring(0,max));
                t2.text(headline.substring(max));
            } else {
                t1.text(headline);
                t2.text('');
            }
        }

        rotateIn();


        //three rects that fill the screen: red, green, blue.  50% translucent
        var rect1 = new amino.Rect().w(sw).h(sh).opacity(0.5).fill("#ff0000");
        var rect2 = new amino.Rect().w(sw).h(sh).opacity(0.5).fill("#00ff00");
        var rect3 = new amino.Rect().w(sw).h(sh).opacity(0.5).fill("#0000ff");
        bg.add(rect1,rect2,rect3);

        //animate the back two rects
        rect1.x(-1000);
        rect2.x(-1000);
        rect1.x.anim().from(-1000).to(1000).dur(5000)
            .loop(-1).autoreverse(true).start();
        rect2.x.anim().from(-1000).to(1000).dur(3000)
            .loop(-1).autoreverse(true).delay(5000).start();

    });
});

function parseFeed(url, cb) {
    var headlines = [];

    http.get(url, function(res) {
        res.pipe(new FeedParser())
            .on('meta',function(meta) {
                //console.log('the meta is',meta);
            })
            .on('data',function(article) {
                console.log("title = ", article.title);
                headlines.push(article.title);
            })
            .on('end',function() {
                console.log("ended");
                cb(headlines);
            })
    });
}


function CircularBuffer(arr) {
    this.arr = arr;
    this.index = -1;
    this.next = function() {
        this.index = (this.index+1)%this.arr.length;
        return this.arr[this.index];
    }
}
