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
};


amino.Group = prims.Group;
amino.Rect = prims.Rect;
amino.Text = prims.Text;
amino.Polygon = prims.Polygon;
amino.ImageView = prims.ImageView;
amino.Circle = prims.Circle;

