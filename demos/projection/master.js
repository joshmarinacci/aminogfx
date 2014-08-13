var cp = require('child_process');
var amino = require('amino');

console.log("I am the master!");


var children = [];
children.push(cp.fork('demos/projection/slave.js'));
children.push(cp.fork('demos/projection/slave.js'));
//children.push(cp.fork('demos/projection/slave.js'));

function projectProp(val,prop,obj) {
    var props = {};
    props[prop.pname] = obj[prop.pname]();
    children.forEach(function(ch) {
        ch.send({
            command:'update',
            id:obj.id(),
            props: props,
        });
    });
}
function Rect() {
    amino.makeProps(this,{
        id:'rect1',
        w: 100,
        h: 65,
        fill: '#ffffff'
    });

    this.w.watch(projectProp);
    this.h.watch(projectProp);
    this.fill.watch(projectProp);
}
function make(target, props) {
    children.forEach(function(ch) {
        ch.send({
            command:'make',
            target:target,
            props: props
        });
    });
}

//configure the child windows
for(var i=0; i<children.length; i++) {
    children[i].send({
        command:'configure',
        props: {
            w: 400,
            h: 400,
            dx: i*-400,
            dy: 0,
        }
    });
}


var rect = new Rect();
make('amino.Rect', { id: rect.id(), });

function anim(id,prop) {
    return {
        from: function(val) {
            this._from = val;
            return this;
        },
        to: function(val) {
            this._to = val;
            return this;
        },
        dur: function(val) {
            this._dur = val;
            return this;
        },
        loop: function(val) {
            this._loop = val;
            return this;
        },
        send: function(val) {
            var self = this;
            children.forEach(function(ch) {
                ch.send({
                    command: 'anim',
                    id:      id,
                    prop:    prop,
                    anim: {
                        from: self._from,
                        to:   self._to,
                        dur:  self._dur,
                        loop: self._loop,
                    }
                });
            });
        },
    }
}

setTimeout(function() {
    rect.w(200);
    rect.h(200);
    rect.fill("#00ffcc");
    anim(rect.id(),'x').from(0).to(1000).dur(1000).loop(-1).send();
},3000);
