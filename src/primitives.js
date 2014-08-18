var amino = require('amino.js');

function mirrorAmino(me,mirrorprops) {
    function camelize(s) {
    	return s.substring(0,1).toUpperCase() + s.substring(1);
    }
    function ParseRGBString(Fill) {
        if(typeof Fill == "string") {
            //strip off any leading #
            if(Fill.substring(0,1) == "#") {
                Fill = Fill.substring(1);
            }
            //pull out the components
            var r = parseInt(Fill.substring(0,2),16);
            var g = parseInt(Fill.substring(2,4),16);
            var b = parseInt(Fill.substring(4,6),16);
            return {
                r:r/255,
                g:g/255,
                b:b/255
            };
        }
        return Fill;
    }

    function mirrorProp(obj,old,native) {
        obj[old].watch(function(newval,oldval){
            if(native == 'fill') {
                var color = ParseRGBString(newval);
                amino.native.updateProperty(obj.handle,'r',color.r);
                amino.native.updateProperty(obj.handle,'g',color.g);
                amino.native.updateProperty(obj.handle,'b',color.b);
                return;
            }
            if(native == 'visible') {
                //console.log("doing visible prop");
                amino.native.updateProperty(obj.handle,native, newval?1:0);
                return;
            }
            if(native == 'filled') {
                //console.log("doing visible prop");
                amino.native.updateProperty(obj.handle,native, newval?1:0);
                return;
            }

            amino.native.updateProperty(obj.handle, native,newval);
        });
        obj['get'+camelize(native)] = function() {
            return obj[old]();
        }
    }

    for(var name in mirrorprops) {
        mirrorProp(me,name,mirrorprops[name]);
    }
}

function contains(x,y) {
    if(x >= 0 && x <= this.w()) {
        if(y >= 0 && y <= this.h()) {
            return true;
        }
    }
    return false;
}

function Rect() {
    amino.makeProps(this,{
        id: 'unknown id',
        visible:true,
        x:0,
        y:0,
        sx:1,
        sy:1,

        w:50,
        h:50,
        opacity: 1.0,
        fill:'#ffffff',
    });
    this.handle = amino.native.createRect();
    mirrorAmino(this,{
        x:'tx',
        y:'ty',
        w:'w',
        h:'h',
        visible:'visible',
        sx:'scalex',
        sy:'scaley',
        fill:'fill',
        id:'id',
        opacity:'opacity',
    });
    this.contains = contains;
}

function Text() {
    amino.makeProps(this,{
        id: 'unknown id',
        visible:true,
        x:0,
        y:0,
        sx:1,
        sy:1,
        text:'silly text',
        fontSize: 20,
        fontName: 'source',
        fontWeight: 400,
        fontStyle:'normal',
        opacity: 1.0,
        fill:'#ffffff',
    });
    this.handle = amino.native.createText();
    mirrorAmino(this,{
        x:'tx',
        y:'ty',
        visible:'visible',
        sx:'scalex',
        sy:'scaley',
        fill:'fill',
        text:'text',
        fontSize:'fontSize',
        id:'id',
    });
    this.font = amino.getCore().defaultFont;
    this.updateFont = function() {
        var id = this.font.getNative(this.fontSize(), this.fontWeight(), 'normal');
        amino.native.updateProperty(this.handle, 'fontId', id);
    }
    this.calcWidth = function() {
        return this.font.calcStringWidth(this.text(), this.fontSize(), this.fontWeight(), 'normal');
    }
    this.calcHeight = function() {
        return this.font.getHeight(this.fontSize(), this.fontWeight(), 'normal');
    }
    this.updateFont();
}


function ImageView() {
    amino.makeProps(this,{
        id: 'unknown id',
        visible:true,
        x:0,
        y:0,
        sx:1,
        sy:1,
        w:100,
        h:100,
        opacity: 1.0,
        fill:'#ffffff',
        src:null,
        textureLeft: 0,
        textureRight: 1,
        textureTop:  0,
        textureBottom: 1,
        image:null,
    });
    var self = this;

    //actually load the image
    this.src.watch(function(src) {
        if(src.toLowerCase().endsWith(".png")) {
            return amino.native.loadPngToTexture(src, self.image);
        }
        if(src.toLowerCase().endsWith(".jpg")) {
            return amino.native.loadJpegToTexture(src, self.image);
        }
        console.log("ERROR! Invalid image",src);
    })

    //when the image is loaded, update the texture id and dimensions
    this.image.watch(function(image) {
        self.w(image.w);
        self.h(image.h);
        amino.native.updateProperty(self.handle, 'texid', self.image().texid);
    });


    this.handle = amino.native.createRect();
    mirrorAmino(this,{
        x:'tx',
        y:'ty',
        w:'w',
        h:'h',
        visible:'visible',
        sx:'scalex',
        sy:'scaley',
        fill:'fill',
        id:'id',
        textureLeft:'textureLeft',
        textureRight: 'textureRight',
        textureTop: 'textureTop',
        textureBottom: 'textureBottom',
    });
    this.contains = contains;
}


function Group() {
    amino.makeProps(this, {
        id: 'unknown id',
        visible:true,

        x:0,
        y:0,
        sx:1,
        sy:1,
        rx:0,
        ry:0,
        rz:0,

    });

    this.handle = amino.native.createGroup();
    mirrorAmino(this, {
        x:'tx',
        y:'ty',
        sx:'scalex',
        sy:'scaley',
        rx:'rotateX',
        ry:'rotateY',
        rz:'rotateZ',
        visible:'visible',
        id:'id',
    });

    this.children = [];
    this.addSingle = function(node) {
        if(node == undefined) throw new Error("can't add a null child to a group");
        if(node.handle == undefined) throw new Error("the child doesn't have a handle");
        this.children.push(node);
        node.parent = this;
        amino.native.addNodeToGroup(node.handle,this.handle);
        return this;
    }
    this.add = function() {
        for(var i=0; i<arguments.length; i++) {
            this.addSingle(arguments[i]);
        }
        return this;
    }
    this.remove = function(child) {
        var n = this.children.indexOf(child);
        if(n >=  0) {
            this.children.splice(n, 1);
        }
        return this;
    }
    this.clear = function() {
        this.children = [];
        return this;
    }
    this.isParent = function() { return true; }

    this.getVisible = this.visible;

    function treeSearch(root, considerRoot, filter) {
        var res = [];
        if(root.isParent && root.isParent()) {
            for(var i=0; i<root.children.length; i++) {
                res =res.concat(treeSearch(root.children[i],true, filter));
            }
        }
        if(considerRoot && filter(root)) {
            return res.concat([root]);
        }
        return res;
    }

    this.find = function(pattern) {
        var results = new FindResults();
        if(pattern.indexOf('#') == 0) {
            var id = pattern.substring(1);
            results.children = treeSearch(this, false, function(child) {
                return (child.id().toLowerCase() == id);
            });
        } else {
            results.children = treeSearch(this, false, function(child) {
                return (child.constructor.name.toLowerCase() == pattern.toLowerCase());
            });
        }
        return results;
    }
}

function FindResults() {
    this.children = [];
    function makefindprop(obj, name) {
        obj[name] = function(val) {
            this.children.forEach(function(child) {
                if(child[name]) child[name](val);
            });
            return this;
        }
    }

    makefindprop(this,'fill');
    makefindprop(this,'filled');
    makefindprop(this,'x');
    makefindprop(this,'y');
    makefindprop(this,'w');
    makefindprop(this,'h');
    this.length = function() {
        return this.children.length;
    }
}


function Button() {
    Group.call(this);
    amino.makeProps(this, {
        w:100,
        h:50,
        text:'a button',
    });
    this.background = new Rect();
    this.add(this.background);
    this.background.fill("#0044cc");
    this.background.w.match(this.w);
    this.background.h.match(this.h);

    this.label = new Text().fill("#ffffff").y(20);
    this.add(this.label);
    this.label.text.match(this.text);
    this.text('a button');
    var self = this;
    this.w.watch(function() {
        var textw = self.label.calcWidth()*2;
        var texth = self.label.calcHeight()*2;
        self.label.x((self.w()-textw)/2);
        self.label.y((self.h()-texth)/2 + texth);
    });

    this.contains = contains;
    var self = this;
    amino.getCore().on('press', this.background, function(e) {
        self.background.fill('#44ccff');
    });
    amino.getCore().on('release', this.background, function(e) {
        self.background.fill('#0044cc');
    });
}


function Polygon() {
    amino.makeProps(this, {
        id:'polygon',
        visible:true,
        x:0,
        y:0,
        sx:1,
        sy:1,
        closed:true,
        filled:true,
        fill:'#ff0000',
        opacity:1.0,
        dimension:2,
        geometry:[0,0, 50,0, 0,0],
    });
    this.handle = amino.native.createPoly();
    mirrorAmino(this,{
        x:'tx',
        y:'ty',
        visible:'visible',
        sx:'scalex',
        sy:'scaley',
        fill:'fill',
        id:'id',
        filled:'filled',
        geometry:'geometry',
    });
    this.contains = function() { return false };
    return this;
}


function Circle() {
    Polygon.call(this);
    amino.makeProps(this, {
        radius:50,
        steps:30,
    });
    var self = this;
    this.radius.watch(function() {
        var r = self.radius();
        var points = [];
        var steps = self.steps();
        for(var i=0; i<steps; i++) {
            var theta = Math.PI*2/steps * i;
            points.push(Math.sin(theta)*r);
            points.push(Math.cos(theta)*r);
        }
        self.geometry(points);
    })
}


exports.Group = Group;
exports.Rect = Rect;
exports.Text = Text;
exports.Button = Button;
exports.mirrorAmino = mirrorAmino;
exports.Polygon = Polygon;
exports.Circle = Circle;
exports.ImageView = ImageView;
