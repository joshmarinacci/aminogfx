var amino = exports;
var input = require('./aminoinput');
var prims = require('./primitives');
exports.input = input;
exports.primitives = prims;

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
        return amino.getCore().getNative().createPropAnim(obj,name);
        //return new PropAnim(obj,name);
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

//String extension
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}


amino.getCore = function() {
    return Core._core;
}


amino.Group = prims.Group;
amino.Rect = prims.Rect;
amino.Text = prims.Text;
amino.Polygon = prims.Polygon;
amino.ImageView = prims.ImageView;
amino.Circle = prims.Circle;


var remap = {
    'x':'tx',
    'y':'ty',
    'rx':'rotateX',
    'ry':'rotateY',
    'rz':'rotateZ',
};

/*
function PropAnim(target,name) {
    console.log("prop anim called");
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
            var nat = amino.getCore().getNative();
            self.handle = nat.createAnim(target.handle, name, self._from,self._to,self._duration);
            nat.updateAnimProperty(self.handle, 'count', self._loop);
            nat.updateAnimProperty(self.handle, 'autoreverse', self._autoreverse);
            nat.updateAnimProperty(self.handle, 'lerpprop', 17); //17 is cubic in out
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
*/
