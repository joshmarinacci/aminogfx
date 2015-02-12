var amino = exports;
var PImage = require('pureimage');
var Shaders = require('./shaders.js');


var fs = require('fs');
var input = require('./aminoinput');
var prims = require('./primitives');
exports.input = input;
exports.primitives = prims;

var debug = {
    eventCount:0
}
function d(str) {
    console.log("AMINO: ",str);
}
var fontmap = {};
var defaultFonts = {
    'source': {
        name:'source',
        weights: {
            200: {
                normal: "SourceSansPro-ExtraLight.ttf",
                italic: "SourceSansPro-ExtraLightItalic.ttf"
            },
            300: {
                normal: "SourceSansPro-Light.ttf",
                italic: "SourceSansPro-LightItalic.ttf"
            },
            400: {
                normal: "SourceSansPro-Regular.ttf",
                italic: "SourceSansPro-Italic.ttf"
            },

            600: {
                normal: "SourceSansPro-Semibold.ttf",
                italic: "SourceSansPro-SemiboldItalic.ttf"
            },
            700: {
                normal: "SourceSansPro-Bold.ttf",
                italic: "SourceSansPro-BoldItalic.ttf"
            },
            900: {
                normal: "SourceSansPro-Black.ttf",
                italic: "SourceSansPro-BlackItalic.ttf"
            }
        }
    },
    'awesome': {
        name:'awesome',
        weights: {
            400: {
                normal: "fontawesome-webfont.ttf",
            }
        }
    }
}

var propertyCount = 0;

amino.registerFont = function(args) {
    amino.native.registerFont(args);
}

amino.getRegisteredFonts = function() {
    return fontmap;
}

amino.SETCOUNT = 0;

amino.makeProps = function(obj,props) {
    for(var name in props) {
        amino.makeProp(obj,name,props[name]);
    }
    return obj;
}
amino.makeProp =function (obj,name,val) {
    var prop = function(v) {
        if(v != undefined) {
            return prop.set(v,obj);
        } else {
            return prop.get();
        }
    };

    prop.value = val;
    prop.propname = name;
    prop.listeners = [];
    prop.watch = function(fun) {
        if(fun === undefined) {
            console.log("function undefined for property ", name, " on object ", "with value",val);
            new Error().printStackTrace();
        }
        this.listeners.push(function(v,v2,v3) {
            fun(v,v2,v3);
        });
        return this;
    };
    prop.get = function(v) {
        return this.value;
    };
    prop.set = function(v,obj) {
        amino.SETCOUNT++;
        this.value = v;
        for(var i=0; i<this.listeners.length; i++) {
            this.listeners[i](this.value,this,obj);
        }
        return obj;
    };
    prop.anim = function() {
        return new PropAnim(obj,name);
    };
    prop.bindto = function(prop, fun) {
        var set = this;
        prop.listeners.push(function(v) {
            if(fun) set(fun(v));
                else set(v);
        });
        return this;
    };

    obj[name] = prop;
}


amino.GETCHARWIDTHCOUNT=0;
amino.GETCHARHEIGHTCOUNT=0;

function JSFont(desc) {
    this.name = desc.name;
    var reg = desc.weights[400];
    this.desc = desc;
    this.weights = {};
    this.filepaths = {};

    var dir = process.cwd();
    process.chdir(__dirname+'/..'); // chdir such that fonts (and internal shaders) may be found
    var aminodir = __dirname+'/../resources/';
    if(desc.path) {
        aminodir = desc.path;
    }
    for(var weight in desc.weights) {
        var filepath = aminodir+desc.weights[weight].normal;
        if(!fs.existsSync(filepath)) {
            console.log("WARNING. File not found",filepath);
            throw new Error();
        }
        this.weights[weight] = amino.native.createNativeFont(filepath);
        this.filepaths[weight] = filepath;
    }
    process.chdir(dir);


    this.getNative = function(size, weight, style) {
        if(this.weights[weight] != undefined) {
            return this.weights[weight];
        }
        console.log("ERROR. COULDN'T find the native for " + size + " " + weight + " " + style);
        return this.weights[400];
    }

    /** @func calcStringWidth(string, size)  returns the width of the specified string rendered at the specified size */
    this.calcStringWidth = function(str, size, weight, style) {
        amino.GETCHARWIDTHCOUNT++;
        return amino.sgtest.getCharWidth(str,size,this.getNative(size,weight,style));
    }
    this.getHeight = function(size, weight, style) {
        amino.GETCHARHEIGHTCOUNT++;
        if(size == undefined) {
            throw new Error("SIZE IS UNDEFINED");
        }
        return amino.sgtest.getFontHeight(size, this.getNative(size, weight, style));
    }
    this.getHeightMetrics = function(size, weight, style) {
        if(size == undefined) {
            throw new Error("SIZE IS UNDEFINED");
        }
        return {
            ascender: amino.sgtest.getFontAscender(size, this.getNative(size, weight, style)),
            descender: amino.sgtest.getFontDescender(size, this.getNative(size, weight, style))
        };
    }
}


amino.native = {
    createNativeFont: function(path) {
        return amino.sgtest.createNativeFont(path);
    },
    registerFont:function(args) {
        fontmap[args.name] = new JSFont(args);
    },
    init: function(core) {
        console.log("doing native init. dpi scale = " + Core.DPIScale);
        amino.sgtest.init();
    },
    createWindow: function(core,w,h) {
        amino.sgtest.createWindow(w* Core.DPIScale,h*Core.DPIScale);
        Shaders.init(amino.sgtest,amino.OS);
        fontmap['source']  = new JSFont(defaultFonts['source']);
        fontmap['awesome'] = new JSFont(defaultFonts['awesome']);
        core.defaultFont = fontmap['source'];
        this.rootWrapper = amino.native.createGroup();
        amino.native.updateProperty(this.rootWrapper, "scalex", Core.DPIScale);
        amino.native.updateProperty(this.rootWrapper, "scaley", Core.DPIScale);
        amino.sgtest.setRoot(this.rootWrapper);
    },
    getFont: function(name) {
        return fontmap[name];
    },
    updateProperty: function(handle, name, value) {
        if(handle == undefined) throw new Error("Can't set a property on an undefined handle!!");
        //console.log('setting', name, propsHash[name], value, typeof value);
        amino.sgtest.updateProperty(handle, propsHash[name], value);
    },
    setRoot: function(handle) {
        amino.sgtest.addNodeToGroup(handle,this.rootWrapper);
    },
    tick: function() {
        amino.sgtest.tick();
    },
    setImmediate: function(loop) {
        setImmediate(loop);
    },
    setEventCallback: function(cb) {
        amino.sgtest.setEventCallback(cb);
    },
    createRect: function()  {          return amino.sgtest.createRect();    },
    createGroup: function() {          return amino.sgtest.createGroup();   },
    createPoly: function()  {          return amino.sgtest.createPoly();    },
    createGLNode: function(cb)  {        return amino.sgtest.createGLNode(cb);  },
    addNodeToGroup: function(h1,h2) {
        amino.sgtest.addNodeToGroup(h1,h2);
    },
    removeNodeFromGroup: function(h1, h2) {
        amino.sgtest.removeNodeFromGroup(h1, h2);
    },
    decodePngBuffer: function(fbuf, cb) {
        cb(amino.sgtest.decodePngBuffer(fbuf));
    },
    decodeJpegBuffer: function(fbuf, cb) {
        cb(amino.sgtest.decodeJpegBuffer(fbuf));
    },
    loadBufferToTexture: function(texid, w, h, bpp, buf, cb) {
        var img = amino.sgtest.loadBufferToTexture(texid, w,h, bpp, buf)
        cb(img);
    },
    createText: function() {
        return amino.sgtest.createText();
    },
    setWindowSize: function(w,h) {
        amino.sgtest.setWindowSize(w*Core.DPIScale,h*Core.DPIScale);
    },
    getWindowSize: function(w,h) {
        var size = amino.sgtest.getWindowSize(w,h);
        return {
            w: size.w/Core.DPIScale,
            h: size.h/Core.DPIScale
        };
    },
    createAnim: function(handle,prop,start,end,dur,count,rev) {
        return amino.sgtest.createAnim(handle,propsHash[prop],start,end,dur,count,rev);
    },
    updateAnimProperty: function(handle, prop, type) {
        amino.sgtest.updateAnimProperty(handle, propsHash[prop], type);
    },

    runTest: function(opts) {
        return amino.sgtest.runTest(opts);
    }

}



//String extension
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
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
    "cliprect": 34


}


/** @class Stage
@desc A stage represents a window. On mobile devices there will only be one stage. On desktop there can be multiple. A stage
can only be created by using the core.createStage() function.
*/
function SGStage(core) {
	this.core = core;
	/** @func setSize(w,h) set the width and height of the stage. Has no effect on mobile. */
	this.setSize = function(width,height) {
	    amino.native.setWindowSize(width,height);
	};
	/** @func getW returns the width of this stage. */
	this.getW = function() {
	    return amino.native.getWindowSize().w;
	};
	/** @func getH returns the height of this stage. */
	this.getH = function() {
	    return amino.native.getWindowSize().h;
	};
	/** @func on(name,node,cb) sets a callback for events matching the specified name on the
	specified node. Use null for the node to match global events. */
	this.on = function(name, node, cb) {
		this.core.on(name, node, cb);
	};
	/** @func getRoot returns the root node of this stage. */
	this.getRoot = function() {
		return this.core.root;
	};
	/** @func set the root node of this stage. */
	this.setRoot = function(root) {
		this.core.setRoot(root);
		return this;
	};
	/** @func find(id) searches the stage's node tree for a node with the requested ID. Returns null if no node is found. */
    this.find = function(id) {
        return this.findNodeById_helper(id,this.getRoot());
    };
    this.findNodeById_helper = function(id, node) {
        if(node.id && node.id == id) return node;
        if(node.isParent && node.isParent()) {
            for(var i=0; i<node.getChildCount(); i++) {
                var ret = this.findNodeById_helper(id,node.getChild(i));
                if(ret != null) return ret;
            }
        }
        return null;
    };

    var self = this;
    this.core.on('windowsize',this,function(e) {
        var root = self.getRoot();
        if(root.setW) root.setW(self.getW());
        if(root.setH) root.setH(self.getH());
    });
}


amino.startEventLoop = function() {
    console.log("starting the event loop");
    function immediateLoop() {
        try {
            amino.native.tick(amino.getCore());
        } catch (ex) {
            console.log(ex);
            console.log(ex.stack);
            console.log("EXCEPTION. QUITTING!");
            return;
        }
        amino.native.setImmediate(immediateLoop);
    }
    setTimeout(immediateLoop,1);
}

/**
@class Core
@desc The core of Amino. Only one will exist at runtime. Always access through the callback
*/
function Core() {
    this.anims = [];
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
        amino.native.init(this);
        amino.native.setEventCallback(function(e) {
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

    this.handleWindowSizeEvent = function(evt) {
        //console.log("doing nothing with the resize");
    }

    this.root = null;
    this.start = function() {
        var core = this;
        //send a final window size event to make sure everything is lined up correctly
        var size = amino.native.getWindowSize();
        this.stage.width = size.w;
        this.stage.height = size.h;
        input.processEvent(this,{
            type:"windowsize",
            width:size.w,
            height:size.h
        });
        if(!this.root) {
            throw new Error("ERROR. No root set on stage");
        }

        //var self = this;
        /*
        function immediateLoop() {
            try {
                amino.native.tick(core);
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
            amino.native.setImmediate(immediateLoop);
        }*/

        amino.startEventLoop();
        //setTimeout(immediateLoop,1);
    }

    /** @func createStage(w,h)  creates a new stage. Only applies on desktop. */
    this.createStage = function(w,h) {
        amino.native.createWindow(this,w,h);
        this.stage = new SGStage(this);
        return this.stage;
    }

    this.getFont = function(name) {
        return amino.native.getFont(name);
    }

    this.setRoot = function(node) {
        amino.native.setRoot(node.handle);
        this.root = node;
    }
    this.findNodesAtXY = function(pt) {
        return findNodesAtXY_helper(this.root, pt, null,"");
    }
    this.findNodesAtXYFiltered = function(pt, filter) {
        return findNodesAtXY_helper(this.root, pt, filter,"");
    }
    function findNodesAtXY_helper(root, pt, filter, tab) {
        if(!root) return [];
        if(!root.visible()) return [];
        //console.log(tab + "   xy",pt.x,pt.y, root.id());
        var tpt = pt.minus(root.x(),root.y());
        //handle children first, then the parent/root
        var res = [];
        if(filter != null) {
            if(!filter(root)) {
                return res;
            }
        }
        if(root.children && root.children.length && root.children.length > 0) {
            for(var i=root.children.length-1; i>=0; i--) {
                var node = root.children[i];
                var found = findNodesAtXY_helper(node,tpt,filter,tab+'  ');
                res = res.concat(found);
            }
        }
        if(root.contains && root.contains(tpt)) {
            res = res.concat([root]);
        }
        return res;
    }
    this.findNodeAtXY = function(x,y) {
        //var t1 = process.hrtime();
        var node = this.findNodeAtXY_helper(this.root,x,y,"");
        //console.log('search time',process.hrtime(t1)[1]/1e6);
        return node;
    }
    this.findNodeAtXY_helper = function(root,x,y,tab) {
        if(!root) return null;
        if(!root.visible()) return null;

        var tx = x-root.x();
        var ty = y-root.y();
        tx = tx/root.sx();
        ty = ty/root.sy();
        //console.log(tab + "   xy="+tx+","+ty);
        if(root.cliprect && root.cliprect() == 1) {
            if(tx < 0) return false;
            if(tx > root.w()) return false;
            if(ty < 0) return false;
            if(ty > root.h()) return false;
        }

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
                trans.x / node.sx();
                trans.y / node.sy();
            }
            trans.x -= node.x();
            trans.y -= node.y();
            return trans;
        }
        return {x:-node.x(),y:-node.y()};
    }
    this.globalToLocal = function(pt, node) {
        return this.globalToLocal_helper(pt,node);
    }

    this.globalToLocal_helper = function(pt, node) {
    	if(node.parent) {
    		pt =  this.globalToLocal_helper(pt,node.parent);
    	}
        return {
            x: (pt.x - node.x())/node.sx(),
            y: (pt.y - node.y())/node.sy(),
        }
    }
    this.localToGlobal = function(pt, node) {
        pt = {
            x: pt.x + node.x(),
            y: pt.y + node.y(),
        };
        if(node.parent) {
            return this.localToGlobal(pt,node.parent);
        } else {
            return pt;
        }
    }

    this.on = function(name,target,listener) { input.on(name,target,listener); }

    this.runTest = function(opts) {
        console.log("running the test with options",opts);
        return amino.native.runTest(opts);
    }
}

var settimer = false;
amino.startTime = function() {
    console.time('start');
    settimer = true;
}

Core.DPIScale = 1.0;
function start(cb) {
    Core._core = new Core();
    Core._core.init();
    var stage = Core._core.createStage(600,600);
    //mirror fonts
    var source_font = exports.getRegisteredFonts().source;
    var fnt = PImage.registerFont(source_font.filepaths[400],source_font.name);
    fnt.load(function() {
        cb(Core._core,stage);
        Core._core.start();
    });
}

amino.getCore = function() {
    return Core._core;
}
amino.Core = Core;
amino.start = start;

amino.startTest = function(cb) {
    Core._core = new Core();
    Core._core.init();
    var stage = Core._core.createStage(600,600);
    var root = new amino.ProtoGroup();
    stage.setRoot(root);
    cb(Core._core, root);
}

amino.setHiDPIScale = function(scale) {
    Core.DPIScale = scale;
}


amino.Group = prims.Group;
amino.Rect = prims.Rect;
amino.Text = prims.Text;
amino.Polygon = prims.Polygon;
amino.ImageView = prims.ImageView;
amino.Circle = prims.Circle;
amino.Core = Core;

var remap = {
    'x':'tx',
    'y':'ty',
    'rx':'rotateX',
    'ry':'rotateY',
    'rz':'rotateZ',
};

function PropAnim(target,name) {
    this._from = null;
    this._to = null;
    this._duration = 1000;
    this._loop = 1;
    this._delay = 0;
    this._autoreverse = 0;
    if(remap[name]) {
        name = remap[name];
    }
    this._then_fun = null;

    this.from = function(val) {  this._from = val;        return this;  }
    this.to   = function(val) {  this._to = val;          return this;  }
    this.dur  = function(val) {  this._duration = val;    return this;  }
    this.delay= function(val) {  this._delay = val;       return this;  }
    this.loop = function(val) {  this._loop = val;        return this;  }
    this.then = function(fun) {  this._then_fun = fun;    return this;  }
    this.autoreverse = function(val) { this._autoreverse = val?1:0; return this;  }

    this.start = function() {
        var self = this;
        setTimeout(function(){
            self.handle = amino.native.createAnim(
                target.handle,
                name,
                self._from,self._to,self._duration);
            amino.native.updateAnimProperty(self.handle, 'count', self._loop);
            amino.native.updateAnimProperty(self.handle, 'autoreverse', self._autoreverse);
            amino.native.updateAnimProperty(self.handle, 'lerpprop', 17); //17 is cubic in out
            amino.getCore().anims.push(self);
        },this._delay);
        return this;
    }

    this.finish = function() {
        if(this._then_fun != null) {
            this._then_fun();
        }
    }


}
