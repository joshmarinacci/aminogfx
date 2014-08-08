/**
@class dummy
@desc a dummy header to work around a doc generation bug. ignore
*/

if(typeof document == "undefined") {
    exports.sgtest = require('./aminonative.node');
    var input = require('aminoinput');
} else {
    var exports = this['amino'] = {};
    exports.inbrowser = true;
    var input = this['aminoinput'];
}


var OS = "BROWSER";
if((typeof process) != 'undefined') {
    OS = "KLAATU";
    if(process.arch == 'arm') {
        OS = "RPI";
    }
    if(process.platform == "darwin") {
        OS = "MAC";
    }
}

input.OS = OS;
input.initOS();

var debug = {
    eventCount:0,
}
function d(str) {
    console.log("AMINO: ",str);
}
d("OS is " + OS)
exports.colortheme = {
    base:    "#f9be00",

    neutral: "#cccccc",
    text:    "#000000",
    accent:  "#55ff55",
    listview: {
        cell: {
            fillEven: "#f5f5f5",
            fillOdd:  "#eeeeee",
            fillSelected: "#88ccff",
        }
    },
    textfield: {
        bg: {
            unfocused: "#d0d0d0",
            focused: "#f0f0f0",
        }
    },
    button: {
        fill: {
            normal: "#dddddd",
            selected: "#888888",
            pressed: "#aaaaaa",
        }
    }
}

exports.SOFTKEYBOARD_ENABLED = false;



var fontmap = {};

var defaultFonts = {
    'source': {
        weights: {
            200: {
                normal: "SourceSansPro-ExtraLight.ttf",
                italic: "SourceSansPro-ExtraLightItalic.ttf",
            },
            300: {
                normal: "SourceSansPro-Light.ttf",
                italic: "SourceSansPro-LightItalic.ttf",
            },
            400: {
                normal: "SourceSansPro-Regular.ttf",
                italic: "SourceSansPro-Italic.ttf",
            },

            600: {
                normal: "SourceSansPro-Semibold.ttf",
                italic: "SourceSansPro-SemiboldItalic.ttf",
            },
            700: {
                normal: "SourceSansPro-Bold.ttf",
                italic: "SourceSansPro-BoldItalic.ttf",
            },
            900: {
                normal: "SourceSansPro-Black.ttf",
                italic: "SourceSansPro-BlackItalic.ttf",
            },
        }
    },
    'awesome': {
        weights: {
            400: {
                normal: "fontawesome-webfont.ttf",
            },
        }
    },
}
var validFontSizes = {10:10,15:15,20:20,30:30,40:40,80:80};

function validateFontSize(fs) {
    if(validFontSizes[fs] == undefined) {
        console.log("WARNING.  invalid font size: " + fs);
        return 15;
    }
    return fs;
}

var propertyCount = 0;

exports.registerFont = function(name, font) {
    fontmap[name] = new JSFont(font);
}

exports.native = {
    createNativeFont: function(path) {
        //console.log('creating native font ' + path);
        return exports.sgtest.createNativeFont(path);
    },
    init: function(core) {
        console.log("doing native init. dpi scale = " + Core.DPIScale);
        exports.sgtest.init();
    },
    createWindow: function(core,w,h) {
        exports.sgtest.createWindow(w* Core.DPIScale,h*Core.DPIScale);
        fontmap['source']  = new JSFont(defaultFonts['source']);
        fontmap['awesome'] = new JSFont(defaultFonts['awesome']);
        core.defaultFont = fontmap['source'];
        this.rootWrapper = exports.native.createGroup();
        exports.native.updateProperty(this.rootWrapper, "scalex", Core.DPIScale);
        exports.native.updateProperty(this.rootWrapper, "scaley", Core.DPIScale);
        exports.sgtest.setRoot(this.rootWrapper);
    },
    getFont: function(name) {
        return fontmap[name];
    },
    updateProperty: function(handle, name, value) {
        propertyCount++;
        exports.sgtest.updateProperty(handle, propsHash[name], value);
    },
    setRoot: function(handle) {
        exports.sgtest.addNodeToGroup(handle,this.rootWrapper);
    },
    tick: function() {
        exports.sgtest.tick();
    },
    setImmediate: function(loop) {
        setImmediate(loop);
    },
    setEventCallback: function(cb) {
        exports.sgtest.setEventCallback(cb);
    },
    createRect: function()  {          return exports.sgtest.createRect();    },
    createGroup: function() {          return exports.sgtest.createGroup();   },
    createPoly: function()  {          return exports.sgtest.createPoly();    },
    createGLNode: function(cb)  {        return exports.sgtest.createGLNode(cb);  },
    addNodeToGroup: function(h1,h2) {
        exports.sgtest.addNodeToGroup(h1,h2);
    },
    removeNodeFromGroup: function(h1, h2) {
        exports.sgtest.removeNodeFromGroup(h1, h2);
    },
    loadPngToTexture: function(imagefile,cb) {
        var img = exports.sgtest.loadPngToTexture(imagefile);
        cb(img);
    },
    loadJpegToTexture: function(imagefile, cb) {
        var img = exports.sgtest.loadJpegToTexture(imagefile);
        cb(img);
    },
    createText: function() {
        return exports.sgtest.createText();
    },
    setWindowSize: function(w,h) {
        exports.sgtest.setWindowSize(w*Core.DPIScale,h*Core.DPIScale);
    },
    getWindowSize: function(w,h) {
        var size = exports.sgtest.getWindowSize(w,h);
        return {
            w: size.w/Core.DPIScale,
            h: size.h/Core.DPIScale,
        };
    },
    createAnim: function(handle,prop,start,end,dur,count,rev) {
        return exports.sgtest.createAnim(handle,propsHash[prop],start,end,dur,count,rev);
    },
    updateAnimProperty: function(handle, prop, type) {
        exports.sgtest.updateAnimProperty(handle, propsHash[prop], type);
    },

    createPropAnim: function(node,prop,start,end,dur) {
        return new SGAnim(node,prop,start,end,dur);
    },

    runTest: function(opts) {
        return exports.sgtest.runTest(opts);
    },

}



//String extension
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
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



exports.dirtylist = [];
function validateScene() {
    exports.dirtylist.forEach(function(node) {
        if(node.dirty == true) {
            if(node.validate) {
                node.validate();
            }
            node.dirty = false;
        }
    });
    exports.dirtylist = [];
}
input.validateScene = validateScene;

/*
bus.filter(typeIs("animend"))
    .onValue(core.notifyAnimEnd);
    */

/**
@func ComposeObject transform the supplied prototype object into a constructor that can then be invoked with 'new'
*/
exports.ComposeObject = function(proto) {
    function delgate(obj, name, comp) {
        obj.comps[name] = new comp.proto();
        if(comp.promote) {
            comp.promote.forEach(function(propname) {
                obj["set"+camelize(propname)] = function(value) {
                    //delegate to the nested component
                    this.comps[name]["set"+camelize(propname)](value);
                    return this;
                };
                obj["get"+camelize(propname)] = function() {
                    return this.comps[name]["get"+camelize(propname)]();
                };
            });
        }
    }

    function delegateProp(obj, name, prop) {
        obj.props[name] = prop.value;
        obj["set"+camelize(name)] = function(value) {
            this.props[name] = value;
            this.dirty = true;
            return this;
        };
        obj["get"+camelize(name)] = function() {
            return this.props[name];
        };
        if(prop.set) {
            obj["set"+camelize(name)] = prop.set;
        }
    }

    function generalizeProp(obj, name, prop) {
        obj["set"+camelize(name)] = function(value) {
            obj.set(name,value);
            return this;
        };
    }
    return function() {
        var obj = this;

        if(proto.extend) {
            var sup = new proto.extend();
            for(var name in sup) {
                obj[name] = sup[name];
            }
        } else {
            obj.props = {};
            obj.comps = {};
        }

        if(proto.comps) {
            for(var name in proto.comps) {
                delgate(obj,name,proto.comps[name]);
            };
        }
        if(proto.props) {
            for(var name in proto.props) {
                delegateProp(obj, name, proto.props[name]);
            }
        }

        if(proto.set) {
            obj.set = proto.set;
            for(var name in proto.props) {
                generalizeProp(obj, name, proto.props[name]);
            }
        }
        if(proto.get) {
            obj.get = proto.get;
            proto.props.forEach(function(prop) {
                obj["get"+camelize(prop.name)] = function() {
                    return obj.get(prop.name);
                };
            });
        }
        if(proto.init) {
            obj.init = proto.init;
            obj.init();
        }
        obj.type = proto.type;
        return this;
    }
}


var propsHash = {

    //general
    "visible":18,
    "opacity":27,
    "r":5,
    "g":6,
    "b":7,
    "texid":8,
    "w":10,
    "h":11,
    "x":21,
    "y":22,

    //transforms
    "tx":23,
    "ty":1,
    "scalex":2,
    "scaley":3,
    "rotateZ":4,
    "rotateX":19,
    "rotateY":20,

    //text
    "text":9,
    "fontSize":12,
    "fontId":28,

    //animation
    "count":29,
    "lerplinear":13,
    "lerpcubicin":14,
    "lerpcubicout":15,
    "lerpprop":16,
    "lerpcubicinout":17,
    "autoreverse":35,


    //geometry
    "geometry":24,
    "filled":25,
    "closed":26,
    "dimension": 36,

    //rectangle texture
    "textureLeft":  30,
    "textureRight": 31,
    "textureTop":   32,
    "textureBottom":33,

    //clipping
    "cliprect": 34,


}

exports.propsHash = propsHash;

function camelize(s) {
	return s.substring(0,1).toUpperCase() + s.substring(1);
}



var doshort = true;
function shortCircuit(target,x,y) {
    if(!target.shortCircuit) return false;
    if(doshort && x === y) {
        return true;
    }
    return false;
}
/**
@class ProtoRect
@desc the basic primitive rectangle
*/
exports.ProtoRect = exports.ComposeObject({
    type: "Rect",
    props: {
        /** @prop id id of the rectangle. might not be unique */
        id: { value: "no id" },
        /** @prop tx translate X */
        tx: { value: 0 },
        /** @prop ty translate Y */
        ty: { value: 0 },
        /** @prop scalex scale X. @default 1*/
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        /** @prop visible visible or not. 1 or 0, not true or false */
        visible: { value: 1 },
        x: { value: 0 },
        y: { value: 0 },
        /** @prop w width of the rectangle. default value = 300 */
        w: { value: 300 },
        /** @prop h height of the rectangle. default value = 100 */
        h: { value: 100 },
        r: { value: 0},
        g: { value: 1},
        b: { value: 0},
        opacity: { value: 1},
        /** @prop fill fill color of the rectangle. Should be a hex value like #af03b6 */
        fill: {
            value: '#ff0000',
        }
    },
    //replaces all setters
    set: function(name, value) {
        if(name == 'visible') value = (value?1:0);
        if(shortCircuit(this, this.props[name],value)) return;
        this.dirty = true;
        this.props[name] = value;
        //mirror the property to the native side
        if(this.live) {
            if(propsHash[name]) {
                exports.native.updateProperty(this.handle,name,value);
            }
        }

        if(name == 'fill') {
            var color = ParseRGBString(value);
            this.setR(color.r);
            this.setG(color.g);
            this.setB(color.b);
            return this;
        }
    },
    /*
    //replaces all getters
    get: function(name) {
        return this.props[name];
    },
    */
    init: function() {
        this.handle = exports.native.createRect();
        this.live = true;
        this.shortCircuit = false;
        //invoke all setters once to push default values to the native side
        for(var propname in this.props) {
            this.set(propname, this.props[propname]);
        }
        this.shortCircuit = true;
        this.type = "rect";
        var rect = this;

        /** @func contains  returns true if the rect contains the x and y.
        x and y should be in the coordinate space of the rectangle.
        */
        this.contains = function(x,y) {
            if(x >=  rect.getX()  && x <= rect.getX() + rect.getW()) {
                if(y >= rect.getY() && y <= rect.getY() + rect.getH()) {
                    return true;
                }
            }
            return false;
        }

    }
});


exports.GLNode = exports.ComposeObject({
    type:"GLNode",
    props: {
        /** @prop tx translate X */
        tx: { value: 0 },
        /** @prop ty translate Y */
        ty: { value: 0 },
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        visible: { value: 1 },
    },
    //replaces all setters
    set: function(name, value) {
        if(name == 'visible') value = (value?1:0);
        if(shortCircuit(this, this.props[name],value)) return;
        this.dirty = true;
        this.props[name] = value;
        //mirror the property to the native side
        if(this.live) {
            if(propsHash[name]) {
                exports.native.updateProperty(this.handle,name,value);
            }
        }
    },
    init: function() {
        var self = this;
        this.handle = exports.native.createGLNode(function(gl) {
            if(self.onrender) {
                self.onrender(gl);
            }
        });
        this.live = true;
    },
});

/**
@class ProtoPoly
@desc the basic primitive polygon composed of lines. may or may not be filled. may or may not be closed.
*/
exports.ProtoPoly = exports.ComposeObject({
    type: "Poly",
    props: {
        /** @prop id id of the rectangle. might not be unique */
        id: { value: "no id" },
        /** @prop tx translate X */
        tx: { value: 0 },
        /** @prop ty translate Y */
        ty: { value: 0 },
        /** @prop scalex scale X. @default 1*/
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        /** @prop visible visible or not. 1 or 0, not true or false */
        visible: { value: 1 },
        r: { value: 0},
        g: { value: 1},
        b: { value: 0},
        geometry: { value: [0,0, 50,0, 50,50]},
        dimension: { value: 2 },
        /** @prop fill fill color of the polygon, if filled. Should be a hex value like #af03b6 */
        fill: {
            value: '#ff0000',
        },
        opacity: { value: 1},
        filled: { value: 0 },
        closed: { value: 1  },
        /** @prop fill fill color of the rectangle. Should be a hex value like #af03b6 */
    },
    //replaces all setters
    set: function(name, value) {
        //remap booleans
        if(name == 'visible') value = (value?1:0);
        if(name == 'filled')  value = (value?1:0);
        if(name == 'closed')  value = (value?1:0);

        if(shortCircuit(this, this.props[name],value)) return;
        this.dirty = true;
        this.props[name] = value;
        //mirror the property to the native side
        if(this.live) {
            if(propsHash[name]) {
                exports.native.updateProperty(this.handle,name,value);
            }
        }

        if(name == 'fill') {
            var color = ParseRGBString(value);
            this.setR(color.r);
            this.setG(color.g);
            this.setB(color.b);
            return this;
        }
        return this;
    },
    /*
    //replaces all getters
    get: function(name) {
        return this.props[name];
    },
    */
    init: function() {
        this.handle = exports.native.createPoly();
        this.live = true;
        this.shortCircuit = false;
        //invoke all setters once to push default values to the native side
        for(var propname in this.props) {
            this.set(propname, this.props[propname]);
        }
        this.shortCircuit = true;
        this.type = "poly";
        this.contains = function(x,y) {
            //dont calc containment for now
            return false;
        }
    }
});

/**
@class ProtoGroup
@desc The group primitive. Use it to group other nodes together.
*/
exports.ProtoGroup = exports.ComposeObject({
    type: "Group",
    props: {
        /** @prop tx translate X. @default 0 */
        tx: { value: 0 },
        /** @prop ty translate Y. @default 0*/
        ty: { value: 0 },
        /** @prop scalex scale X. @default 1*/
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        rotateX: { value: 0},
        rotateY: { value: 0},
        rotateZ: { value: 0},
        /** @prop visible visible or not. 1 or 0, not true or false. @default 1 */
        visible: { value: 1 },
        w: { value: 100 },
        h: { value: 100 },
        cliprect: { value: 0 },
        id: { value: "no id" },
    },
    //replaces all setters
    set: function(name, value) {
        if(name == 'visible') value = (value?1:0);
        if(name == 'cliprect') value = (value?1:0);
        if(shortCircuit(this,this.props[name],value)) return;
        this.dirty = true;
        this.props[name] = value;
        //mirror the property to the native side
        if(this.live) {
            exports.native.updateProperty(this.handle, name, this.props[name]);
        }
    },
    init: function() {
        this.handle = exports.native.createGroup();
        this.children = [];
        this.live = true;
        /** @func add(child)  add a child to the group. Must be a non-null node. */
        this.add = function(node) {
            if(node == undefined) abort("can't add a null child to a group");
            if(!this.live) abort("error. trying to add child to a group that isn't live yet");
            if(node.handle == undefined) abort("the child doesn't have a handle");
            this.children.push(node);
            node.parent = this;
            exports.native.addNodeToGroup(node.handle,this.handle);
            return this;
        }
        this.isParent = function() { return true; }

        /** @func getChildCount()  returns the number of child nodes inside this group */
        this.getChildCount = function() {
            return this.children.length;
        }
        /** @func getChild(i)  returns the child at index i */
        this.getChild = function(i) {
            return this.children[i];
        }
        /** @func remove(target)  remove the target child */
        this.remove = function(target) {
            var n = this.children.indexOf(target);
            this.children.splice(n,1);
            exports.native.removeNodeFromGroup(target.handle, this.handle);
            target.parent = null;
        }
        /** @func clear() remove all children of this group */
        this.clear = function() {
            while(this.children.length > 0) {
                this.remove(this.children[this.children.length-1]);
            }
            this.children = [];
        }
        //invoke all setters once to push default values to the native side
        for(var propname in this.props) {
            this.set(propname, this.props[propname]);
        }
        this.shortCircuit = true;
        this.type = "group";

        this.raiseToTop = function(node) {
            if(node == undefined) abort("can't move a null child");
            if(!this.live) abort("error. can't move a child in a group that isn't live yet");
            if(node.handle == undefined) abort("the child doesn't have a handle");
            this.remove(node);
            this.add(node);
            return this;
        };
    }
});

/**
@class ProtoText
@desc  The text primitive. Use it to draw a single run of text with the
same font, size, and color.
*/
exports.ProtoText = exports.ComposeObject({
    type:"Text",
    props: {
        /** @prop tx translate X. @default 0 */
        tx: { value: 0 },
        /** @prop ty translate Y. @default 0 */
        ty: { value: 0 },
        /** @prop scalex scale X. @default 1*/
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        /** @prop visible  @default true */
        visible: { value: 1 },
        /** @prop text  the exact string to display */
        text: { value: 'silly text' },
        /** @prop fontSize the fontsize of this text string */
        fontSize: { value: 20 },
        fontName: { value: 'source' },
        fontWeight: { value: 400 },
        fontStyle: { value: 'normal' },
        r: { value: 0},
        g: { value: 1},
        b: { value: 0},
        /** @prop fill fill color of the rectangle. Should be a hex value like #af03b6 */
        fill: {
            value: '#000000',
        },
        id: { value: 'no id' },
    },
    //replaces all setters
    set: function(name, value) {
        if(name == 'visible') value = (value?1:0);
        if(shortCircuit(this,this.props[name],value)) return;
        this.props[name] = value;
        this.markDirty();
        //mirror the property to the native side
        if(this.live) {
            if(name == 'fontName') {
                if(!fontmap[value]) {
                    console.log("WARNING. No font '" + value + "' found!!!");
                }
                this.font = fontmap[value];
                this.updateFont();
                return;
            }
            if(name == "fontSize") {
                value = validateFontSize(value*Core.DPIScale);
                this.setScalex(1.0/Core.DPIScale);
                this.setScaley(1.0/Core.DPIScale);
            }
            exports.native.updateProperty(this.handle, name, value);
        }

        if(name == 'fill') {
            var color = ParseRGBString(value);
            this.setR(color.r);
            this.setG(color.g);
            this.setB(color.b);
            return this;
        }
    },
    init: function() {
        var self = this;
        this.markDirty = function() {
            this.dirty = true;
            exports.dirtylist.push(this);
        }
        this.validate = function() {
            this.updateFont();
            exports.native.updateProperty(this.handle, 'text', this.getText());
        }
        this.live = true;
        this.handle = exports.native.createText();
        this.updateFont = function() {
            var id = this.font.getNative(this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            exports.native.updateProperty(this.handle, 'fontId', id);
        }
        this.type = "text";
        this.font = Core._core.defaultFont;
        this.updateFont();
        //invoke all setters once to push default values to the native side
        for(var propname in this.props) {
            this.set(propname, this.props[propname]);
        }
        this.shortCircuit = true;
    }
});

/**
@class ImageView
@desc a view which shows an image loaded from a path. It will always show the full image.
*/
exports.ProtoImageView = exports.ComposeObject({
    props: {
        /** @prop id id of the rectangle. might not be unique */
        id: { value: "no id" },
        /** @prop tx translate X. @default 0 */
        tx: { value: 0   },
        /** @prop ty translate Y. @default 0 */
        ty: { value: 0   },
        /** @prop scalex scale X. @default 1*/
        scalex: { value: 1 },
        /** @prop scaley scale Y. @default 1*/
        scaley: { value: 1 },
        /** @prop x x value. @default 0 */
        x:  { value: 0   },
        /** @prop y y value. @default 0 */
        y:  { value: 0   },
        r:  { value: 0   },
        g:  { value: 0   },
        b:  { value: 1   },
        /** @prop x width of the image view @default 100 */
        w:  { value: 100 },
        /** @prop h height of the image view @default 100 */
        h:  { value: 100 },
        /** @prop visible @default true */
        visible: { value:1 },
        /** @prop src  the file to load this image from @default null */
        src: {
            value: null ,
        },

        textureLeft:   { value: 0 },
        textureRight:  { value: 1 },
        textureTop:    { value: 0 },
        textureBottom: { value: 1 },
    },
    //replaces all setters
    set: function(name, value) {
        if(name == 'visible') value = (value?1:0);
        this.props[name] = value;
        this.dirty = true;
        //mirror the property to the native side
        if(this.live) {
            exports.native.updateProperty(this.handle, name, value);
        }
        if(name == 'src' && value != null) {
            console.log("trying to load " + value);
            var src = this.props.src;
            var self = this;
            if(src.toLowerCase().endsWith(".png")) {
                exports.native.loadPngToTexture(src, function(image) {
                    self.image = image;
                    self.setW(image.w);
                    self.setH(image.h);
                    if(self.image) {
                        exports.native.updateProperty(self.handle, "texid", self.image.texid);
                    }
                });
            } else {
                exports.native.loadJpegToTexture(src, function(image) {
                    self.setW(image.w);
                    self.setH(image.h);
                    self.image = image;
                    if(self.image) {
                        exports.native.updateProperty(self.handle, "texid", self.image.texid);
                    }
                });
            }

        }
    },
    init: function() {
        this.live = true;
        this.handle = exports.native.createRect();
        //invoke all setters once to push default values to the native side
        for(var propname in this.props) {
            this.set(propname, this.props[propname]);
        }
        /** @func contains  returns true if the rect contains the x and y.
        x and y should be in the coordinate space of the rectangle.
        */
        var rect = this;
        this.contains = function(x,y) {
            if(x >=  rect.getX()  && x <= rect.getX() + rect.getW()) {
                if(y >= rect.getY() && y <= rect.getY() + rect.getH()) {
                    return true;
                }
            }
            return false;
        }
    }
});


/**
@class ProtoWidget
@desc  the base class for all widgets. Widgets are a kind of node used for UI controls. All widgets
have a size (width/height), can be hidden (visible = false), an ID, and left/right/top/bottom properties
to be used by layout panels.
*/
exports.ProtoWidget = exports.ComposeObject({
    type: "widget",
    comps: {
        base: {
            proto: exports.ProtoGroup,
            promote: ["tx","ty","scalex","scaley","visible"],
        },
    },
    props: {
        /** @prop id  The id of the widget. It is set to the string 'no id' by default. You should set it to some unique value. Can be used
        later to search for the node. similar to the HTML DOM form of 'id'.*/
        id: { value: "no id" },
        /** @prop left The distance from the left edge of this widget to it's parent container. Only applies when put inside
        of an anchor panel and when the anchorLeft property is set to true. @default = 0 */
        left: { value: 0 },
        /** @prop right The distance from the right edge of this widget to it's parent container. Only applies when put inside
        of an anchor panel and when the anchorRight property is set to true. @default = 0 */
        right: { value: 0 },
        /** @prop top The distance from the top edge of this widget to it's parent container. Only applies when put inside
        of an anchor panel and when the anchorTop property is set to true. @default = 0 */
        top: { value: 0 },
        /** @prop bottom The distance from the bottom edge of this widget to it's parent container. Only applies when put inside
        of an anchor panel and when the anchorBottom property is set to true. @default = 0 */
        bottom: { value: 0 },
        /** @prop anchorLeft Determines if this widget should be left anchored by its parent. Only applies when put inside
        of an anchor panel. @default = false */
        anchorLeft: { value: false },
        /** @prop anchorRight Determines if this widget should be right anchored by its parent. Only applies when put inside
        of an anchor panel. @default = false */
        anchorRight: { value: false },
        /** @prop anchorTop Determines if this widget should be top anchored by its parent. Only applies when put inside
        of an anchor panel. @default = false */
        anchorTop: { value: false },
        /** @prop anchorBottom Determines if this widget should be bottom anchored by its parent. Only applies when put inside
        of an anchor panel. @default = false */
        anchorBottom: { value: false },
        /** @prop parent A reference to this widget's immediate parent container. */
        parent: { value: null },
    },
    init: function() {
        this.handle = this.comps.base.handle;
        this.font = Core._core.defaultFont;
        /** @func contains(x,y)  returns true if the bounds of this widget contain the passed in x and y. */
        this.contains = function(x,y) {
            if(x >=  0  && x <= this.getW()) {
                if(y >= 0 && y <= this.getH()) {
                    return true;
                }
            }
            return false;
        }
    }
});



/** @class Stage
@desc A stage represents a window. On mobile devices there will only be one stage. On desktop there can be multiple. A stage
can only be created by using the core.createStage() function.
*/
function SGStage(core) {
	this.core = core;
	/** @func setSize(w,h) set the width and height of the stage. Has no effect on mobile. */
	this.setSize = function(width,height) {
	    exports.native.setWindowSize(width,height);
	}
	/** @func getW returns the width of this stage. */
	this.getW = function() {
	    return exports.native.getWindowSize().w;
	}
	/** @func getH returns the height of this stage. */
	this.getH = function() {
	    return exports.native.getWindowSize().h;
	}
	/** @func on(name,node,cb) sets a callback for events matching the specified name on the
	specified node. Use null for the node to match global events. */
	this.on = function(name, node, cb) {
		this.core.on(name, node, cb);
	}
	/** @func getRoot returns the root node of this stage. */
	this.getRoot = function() {
		return this.core.root;
	}
	/** @func set the root node of this stage. */
	this.setRoot = function(root) {
		this.core.setRoot(root);
		return this;
	}
	/** @func find(id) searches the stage's node tree for a node with the requested ID. Returns null if no node is found. */
    this.find = function(id) {
        return this.findNodeById_helper(id,this.getRoot());
    }
    this.findNodeById_helper = function(id, node) {
        if(node.id && node.id == id) return node;
        if(node.isParent && node.isParent()) {
            for(var i=0; i<node.getChildCount(); i++) {
                var ret = this.findNodeById_helper(id,node.getChild(i));
                if(ret != null) return ret;
            }
        }
        return null;
    }

    var self = this;
    this.core.on('windowsize',this,function(e) {
        var root = self.getRoot();
        if(root.setW) root.setW(self.getW());
        if(root.setH) root.setH(self.getH());
    });
}

/**
@class Font
@desc Represents a particular font face. The face is set to a specific style,
but can be used at multiple sizes.
*/
function JSFont(desc) {
    var reg = desc.weights[400];
    this.desc = desc;
    this.weights = {};

    var dir = process.cwd();
    process.chdir(__dirname); // chdir such that fonts (and internal shaders) may be found
    var aminodir = process.cwd();
    for(var weight in desc.weights) {
        this.weights[weight] = exports.native.createNativeFont(aminodir+"/fonts/"+desc.weights[weight].normal);
    }
    process.chdir(dir);

    this.getNative = function(size, weight, style) {
        if(this.weights[weight] != undefined) {
            return this.weights[weight];
        }
        //console.log("ERROR. COULDN'T find the native for " + size + " " + weight + " " + style);
        return this.weights[400];
    }
    /** @func calcStringWidth(string, size)  returns the width of the specified string rendered at the specified size */
    this.calcStringWidth = function(str, size, weight, style) {
        return exports.sgtest.getCharWidth(str,size,this.getNative(size,weight,style));
    }
    /** @func getHeight(size) returns the height of this font at the requested size */
    this.getHeight = function(size, weight, style) {
        if(size == undefined) {
            throw new Error("SIZE IS UNDEFINED");
        }
        return exports.sgtest.getFontHeight(size, this.getNative(size, weight, style));
    }
    /** @func getAscent(fs) returns the ascent of this font at the requested size */
    this.getAscent = function(fs) {
        return 15;
    }
}





/** @class Anim
@desc  Anim animates ones property of a node. It must be created using the
core.createAnim() function.
*/
function SGAnim(node, prop, start, end, dur) {
    this.node = node;
    this.prop = prop;
    this.start = start;
    this.end = end;
    this.duration = dur;
    this.count = 1;
    this.autoreverse = false;
    this.afterCallbacks = [];
    this.beforeCallbacks = [];
    this.init = function(core) {
        this.handle = exports.native.createAnim(
            this.node.handle,
            this.prop,
            this.start,this.end,this.duration);
    }
    /** @func setIterpolator(type) Sets the interpolator to use for this animation. Valid values include:
      amino.Interpolators.CubicIn and amino.Interpolators.CubicInOut and amino.Interpolators.Linear
     */
    this.setInterpolator = function(lerptype) {
        this.lerptype = lerptype;
        exports.native.updateAnimProperty(this.handle, "lerpprop", lerptype);
        return this;
    }
    this.setCount = function(count) {
        this.count = count;
        exports.native.updateAnimProperty(this.handle, "count", count);
        return this;
    }
    this.setAutoreverse = function(av) {
        this.autoreverse = av;
        exports.native.updateAnimProperty(this.handle, "autoreverse", av?1:0);
        return this;
    }
    this.finish = function() {
        var setterName = "set"+camelize(this.prop);
        var setter = this.node[setterName];
        if(setter) {
            setter.call(this.node,this.end);
        }
        for(var i in this.afterCallbacks) {
            this.afterCallbacks[i]();
        }
    }
    /** @func after(cb)  Sets a callback to be called when the animation finishes. Note: an infinite animation will never finish. */
    this.after = function(cb) {
        this.afterCallbacks.push(cb);
        return this;
    }

    this.before = function(cb) {
        this.beforeCallbacks.push(cb);
        return this;
    }
}



/**
@class Core
@desc The core of Amino. Only one will exist at runtime. Always access through the callback
*/
function Core() {
    this.anims = [];
    /** @func createPropAnim(node, propertyName, startValue, endValue, duration, count, autoreverse)
    creates a new property animation. Node is the node to be animated. propertyName is the string name of the property
    to animate. This should be a numeric property like tx or scalex. start and end are the starting and ending values
    of the animation. Duration is the length of the animation in milliseconds. 1000 = one second. Count is
    how many times the animation should loop. Use -1 to loop forever. Autoreverse determines if the animation should
    alternate direction on every other time. Only applies if the animatione will play more than one time.
    */
    this.createPropAnim = function(node, prop, start, end, dur) {
        var anim = exports.native.createPropAnim(node,prop,start,end,dur);
        anim.init(this);
        this.anims.push(anim);
        return anim;
    }
    var self = this;
    //TODO: actually clean out dead animations when they end
    this.notifyAnimEnd = function(e) {
        var found = -1;
        for(var i=0; i<self.anims.length; i++) {
            var anim = self.anims[i];
            if(anim.handle == e.id) {
                found = i;
                anim.finish();
            }
        }
    }

    var self = this;
    this.init = function() {
        exports.native.init(this);
        exports.native.setEventCallback(function(e) {
            debug.eventCount++;
            e.time = new Date().getTime();
            if(e.x) e.x = e.x/Core.DPIScale;
            if(e.y) e.y = e.y/Core.DPIScale;
            if(e.type == "windowsize") {
                e.width = e.width/Core.DPIScale;
                e.height = e.height/Core.DPIScale;
            }
            input.processEvent(self,e);
        });
    }

    this.root = null;
    this.start = function() {
        var core = this;
        //send a final window size event to make sure everything is lined up correctly
        var size = exports.native.getWindowSize();
        this.stage.width = size.w;
        this.stage.height = size.h;
        input.processEvent(this,{
            type:"windowsize",
            width:size.w,
            height:size.h,
        });
        if(!this.root) {
            throw new Error("ERROR. No root set on stage");
        }

        var self = this;
        function immediateLoop() {
            try {
                exports.native.tick(core);
                if(settimer) {
                    console.timeEnd('start');
                    settimer = false;
                }
                if(propertyCount > 0) {
                    //console.log("propcount = " + propertyCount);
                }
                propertyCount = 0;
            } catch (ex) {
                console.log(ex);
                console.log(ex.stack);
                console.log("EXCEPTION. QUITTING!");
                return;
            }
            exports.native.setImmediate(immediateLoop);
        }
        setTimeout(immediateLoop,1);
    }

    /** @func createStage(w,h)  creates a new stage. Only applies on desktop. */
    this.createStage = function(w,h) {
        exports.native.createWindow(this,w,h);
        this.stage = new SGStage(this);
        return this.stage;
    }

    this.getFont = function(name) {
        return exports.native.getFont(name);
    }

    this.setRoot = function(node) {
        exports.native.setRoot(node.handle);
        this.root = node;
    }
    this.findNodeAtXY = function(x,y) {
        //var t1 = process.hrtime();
        var node = this.findNodeAtXY_helper(this.root,x,y,"");
        //console.log('search time',process.hrtime(t1)[1]/1e6);
        return node;
    }
    this.findNodeAtXY_helper = function(root,x,y,tab) {
        if(!root) return null;
        //console.log(tab +
        //    (root.getId?root.getId():"-") + " " + root.getTx() + " " + root.getTy() + " "
        //    + (root.getW?root.getW():"-") + " x " + (root.getH?root.getH():"-"));            
        if(!root.getVisible()) return null;

        var tx = x-root.getTx();
        var ty = y-root.getTy();
        tx = tx/root.getScalex();
        ty = ty/root.getScaley();
        //console.log(tab + "   xy="+tx+","+ty);
        if(root.children) {
            //console.log(tab+"children = ",root.children.length);
            for(var i=root.children.length-1; i>=0; i--) {
                var node = root.children[i];
                var found = this.findNodeAtXY_helper(node,tx,ty,tab+"  ");
                if(found) {
                	return found;
            	}
            }
        }
        //console.log(tab+"contains " + tx+' '+ty);
        if(root.contains && root.contains(tx,ty)) {
            //console.log(tab,"inside!",root.getId());
           return root;
        }
        return null;
    }
    function calcGlobalToLocalTransform(node) {
        if(node.parent) {
            var trans = calcGlobalToLocalTransform(node.parent);
            if(node.getScalex() != 1) {
                trans.x / node.getScalex();
                trans.y / node.getScaley();
            }
            trans.x -= node.getTx();
            trans.y -= node.getTy();
            return trans;
        }
        return {x:-node.getTx(),y:-node.getTy()};
    }
    this.globalToLocal = function(pt, node) {
        return this.globalToLocal_helper(pt,node);
    }

    this.globalToLocal_helper = function(pt, node) {
    	if(node.parent) {
    		pt =  this.globalToLocal_helper(pt,node.parent);
    	}
        return {
            x: (pt.x - node.getTx())/node.getScalex(),
            y: (pt.y - node.getTy())/node.getScaley(),
        }
    }
    this.localToGlobal = function(pt, node) {
        pt = {
            x: pt.x + node.getTx(),
            y: pt.y + node.getTy(),
        };
        if(node.parent) {
            return this.localToGlobal(pt,node.parent);
        } else {
            return pt;
        }
    }
    this.listeners = {};
    this.on = function(name, target, listener) {
        name = name.toLowerCase();
        if(target == null) {
            target = this;
        }
        if(!this.listeners[name]) {
            this.listeners[name] = [];
        }
        this.listeners[name].push({
                target:target,
                func:listener
        });
    }
    this.fireEventAtTarget= function(target, event) {
        //        console.log("firing an event at target:",event.type);
        if(!event.type) { console.log("WARNING. Event has no type!"); }
        if(this.listeners[event.type]) {
            this.listeners[event.type].forEach(function(l) {
                    if(l.target == target) {
                        l.func(event);
                    }
            });
        }
    }
    this.fireEvent = function(event) {
        if(!event.type) { console.log("WARNING. Event has no type!"); }

       // var t1 = process.hrtime();
        if(this.listeners[event.type]) {
            var arr = this.listeners[event.type];
            var len = arr.length;
            for(var i=0; i<len; i++) {
                var listener = arr[i];
                if(listener.target == event.source) {
                    listener.func(event);
                }
            }
        }
        if(event.type == "validate") {
            //console.log('validate time = ',process.hrtime(t1)[1]/1e6);
        }
    };

    this.requestFocus = function(target) {
        if(this.keyfocus) {
            this.fireEventAtTarget(this.keyfocus,{type:"focusloss",target:this.keyfocus});
        }
        this.keyfocus = target;
        if(this.keyfocus) {
            this.fireEventAtTarget(this.keyfocus,{type:"focusgain",target:this.keyfocus});
        }
    }

    this.runTest = function(opts) {
        console.log("running the test with options",opts);
        return exports.native.runTest(opts);
    }
}

var settimer = false;
exports.startTime = function() {
    console.time('start');
    settimer = true;
}

Core.DPIScale = 1.0;
function startApp(cb) {
    Core._core = new Core();
    Core._core.init();
    var stage = Core._core.createStage(600,600);
    cb(Core._core,stage);
    Core._core.start();
}

exports.getCore = function() {
    return Core._core;
}
exports.startApp = startApp;

exports.startTest = function(cb) {
    Core._core = new Core();
    Core._core.init();
    var stage = Core._core.createStage(600,600);
    var root = new exports.ProtoGroup();
    stage.setRoot(root);
    cb(Core._core, root);
}
exports.Interpolators = {
    Linear:propsHash["lerplinear"],
    CubicIn:propsHash["lerpcubicin"],
    CubicInOut:propsHash["lerpcubicinout"],
}

exports.setHiDPIScale = function(scale) {
    Core.DPIScale = scale;
}
