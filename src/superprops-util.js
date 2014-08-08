var amino = require('amino.js');


var remap = {
    'x':'tx',
    'rx':'rotateX',
    'ry':'rotateY',
};

function PropAnim(target,name) {
    this._from = null;
    this._to = null;
    this._duration = 1000;
    this._loop = 1;
    this._delay = 0;
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

    this.start = function() {
        var self = this;
        setTimeout(function(){
            self.handle = amino.native.createAnim(
                target.handle,
                name,
                self._from,self._to,self._duration);
            amino.native.updateAnimProperty(self.handle, 'count', self._loop);
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


var ou = {
    makeProps: function(obj,props) {
        for(var name in props) {
            this.makeProp(obj,name,props[name]);
        }
    },
    makeProp:function (obj,name,val) {
        obj[name] = function(v) {
            if(v != undefined) {
                return obj[name].set(v);
            } else {
                return obj[name].get();
            }
        }
        obj[name].listeners = [];
        obj[name].value = val;
        obj[name].set = function(v) {
            this.value = v;
            for(var i=0; i<this.listeners.length; i++) {
                this.listeners[i](this.value,this,obj);
            }
            return obj;
        }
        obj[name].get = function(v) {
            return this.value;
        }
        obj[name].watch = function(fun) {
            this.listeners.push(function(v,v2,v3) {
                fun(v,v2,v3);
            });
            return this;
        }
        obj[name].anim = function() {
            return new PropAnim(obj,name);
        }
        obj[name].bindto = function(prop, fun) {
            var set = this;
            prop.listeners.push(function(v) {
                if(fun) set(fun(v));
                    else set(v);
            });
            return this;
        }
    }
}

exports.makeProps = ou.makeProps;
exports.makeProp = ou.makeProp;
