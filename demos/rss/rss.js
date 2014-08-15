var amino = require('amino.js');
var FeedParser = require('feedparser');
var http = require('http');

parseFeed('http://leoville.tv/podcasts/sn.xml',function(titles) {
    var titles = new CircularBuffer(titles);
    amino.start(function(core, stage) {
        var root = new amino.Group();
        stage.setSize(1000,500);
        stage.setRoot(root);

        var text = new amino.Text().x(50).y(200).fill("#ffffff");
        text.text(titles.next());
        root.add(text);

        function rotateOut() {
            root.ry.anim().from(0).to(140).dur(1000).then(rotateIn).start();
        }
        function rotateIn() {
            text.text(titles.next());
            root.ry.anim().from(220).to(360).dur(1000).then(rotateOut).start();
        }

        rotateOut();

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
