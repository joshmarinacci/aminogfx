//the job of this class is to route input events and calculate semantic events.
//it does not map from platform specific events to generic ones. that is the job
//of the inputevents module

/*
todos:

//key press, key release
//shift/control/etc. keys
//keyboard focus management  (do we need multiple of these?)
//focusgain/focuslose events
//browser support

repeating keys
direct keystate query
mouse move event, required on rpi for a cursor
windowclose event
windowsizing event
*/


var IE = require('inputevents');

function makePoint(x,y) {
    return {
        x:x,
        y:y,
        minus: function() {
            if(arguments.length == 1) {
                var pt = arguments[0];
                return makePoint(this.x-pt.x,this.y-pt.y);
            }
            if(arguments.length == 2) {
                var xy = arguments;
                return makePoint(this.x - xy[0], this.y - xy[1]);
            }
        },
        divide: function(x,y) {
            return makePoint(this.x/x,this.y/y);
        }
    }
}

exports.init = function(OS) {
    console.log("initing input for OS ", OS);
    this.OS = OS;
    IE.init();
}

var listeners = {};
var focusobjects = {
    pointer: {
        target: null,
    },
    scroll: {
        target: null,
    },
    keyboard: {
        target: null,
    }
};

var statusobjects = {
    pointer: {
        pt: makePoint(-1,-1),
        prevpt: makePoint(-1,-1),
    },
    keyboard: {
        state:{},
    }
};

var handlers = {
    validate: function() { },
    animend: function(core,evt) { core.notifyAnimEnd(evt);  },
    mouseposition: function(core,evt) {
        var s = statusobjects.pointer;
        s.prevpt = s.pt;
        s.pt = makePoint(evt.x,evt.y);
        var target = focusobjects.pointer.target;
        if(target != null && statusobjects.pointer.state == 1) {
            sendDragEvent(core,evt);
        }
    },

    mousebutton: function(core,evt) {
        if(evt.button == '0') {
            statusobjects.pointer.state = evt.state;
            if(evt.state == '1') {
                var pts = statusobjects.pointer;
                setupPointerFocus(core,pts.pt);
                sendPressEvent(core,evt);
                return;
            }
            if(evt.state == '0') {
                sendReleaseEvent(core,evt);
                stopPointerFocus();
                return;
            }
        }
    },

    mousewheelv: function(core,evt) {
        var pts = statusobjects.pointer;
        setupScrollFocus(core,pts.pt);
        sendScrollEvent(core,evt);
    },

    keypress: function(core,evt) {
        statusobjects.keyboard.state[evt.keycode] = true;
        if(this.OS == 'BROWSER') {
            var evt2 = IE.fromBrowserKeyboardEvent(evt, statusobjects.keyboard.state);
        } else {
            var evt2 = IE.fromAminoKeyboardEvent(evt, statusobjects.keyboard.state);
        }
        sendKeyboardPressEvent(core,evt2);
    },

    keyrelease: function(core,evt) {
        statusobjects.keyboard.state[evt.keycode] = false;
        sendKeyboardReleaseEvent(core,IE.fromAminoKeyboardEvent(evt, statusobjects.keyboard.state));
    },

    windowsize: function(core,evt) {
        core.handleWindowSizeEvent(evt);
    }
}

exports.processEvent = function(core,evt) {
    if(typeof handlers[evt.type] !== 'undefined') {
        return handlers[evt.type](core,evt);
    }
    console.log("unhandled event", evt);
}

exports.on = function(name, target, listener) {
    name = name.toLowerCase();
    if(!listeners[name]) listeners[name] = [];
    listeners[name].push({
        target:target,
        func:listener
    });
}

function setupPointerFocus(core,pt) {
    var nodes = core.findNodesAtXYFiltered(pt, function(node) {
        if(node.children && typeof node.acceptsMouseEvents !== 'undefined' && node.acceptsMouseEvents === false) {
            return false;
        }
        return true;
    });
    var pressnodes = nodes.filter(function(n) { return n.acceptsMouseEvents === true });

    if(pressnodes.length > 0) {
        focusobjects.pointer.target = pressnodes[0];
    } else {
        focusobjects.pointer.target = null;
    }

    var keyboardnodes = nodes.filter(function(n) { return n.acceptsKeyboardEvents === true });
    if(keyboardnodes.length > 0) {
        if(focusobjects.keyboard.target !== null) {
            fireEventAtTarget(focusobjects.keyboard.target, {
                type:'focuslose',
                target: focusobjects.keyboard.target,
            });
        }
        focusobjects.keyboard.target = keyboardnodes[0];
        fireEventAtTarget(focusobjects.keyboard.target, {
            type:'focusgain',
            target: focusobjects.keyboard.target,
        });
    } else {
        if(focusobjects.keyboard.target !== null) {
            fireEventAtTarget(focusobjects.keyboard.target, {
                type:'focuslose',
                target: focusobjects.keyboard.target,
            });
        }
        focusobjects.keyboard.target = null;
    }

}

function stopPointerFocus() {
    focusobjects.pointer.target = null;
}

function sendPressEvent(core, e) {
    var node = focusobjects.pointer.target;
    if(node == null) return;

    var pt = core.globalToLocal(statusobjects.pointer.pt,node);
    fireEventAtTarget(node, {
        type:"press",
        button:e.button,
        point:pt,
        target:node,
    });

}

function sendReleaseEvent(core,e) {
    var node = focusobjects.pointer.target;
    if(node == null) return;
    var pt = core.globalToLocal(statusobjects.pointer.pt,node);
    fireEventAtTarget(node, {
        type:"release",
        button:e.button,
        point:pt,
        target:node,
    });

    if(node.contains(pt)) {
        fireEventAtTarget(node,{
            type:"click",
            button:e.button,
            point:pt,
            target:node,
        });
    }
}

function sendDragEvent(core,e) {
    var node = focusobjects.pointer.target;
    var s = statusobjects.pointer;
    if(node == null) return;
    var localpt = core.globalToLocal(s.pt,node);
    fireEventAtTarget(node, {
        type:"drag",
        button:e.button,
        point:localpt,
        delta: s.pt.minus(s.prevpt),
        target:node,
    });
}

function setupScrollFocus(core,pt) {
    var nodes = core.findNodesAtXY(pt);
    var nodes = nodes.filter(function(n) { return n.acceptsScrollEvents === true });
    if(nodes.length > 0) {
        focusobjects.scroll.target = nodes[0];
    } else {
        focusobjects.scroll.target = null;
    }
}

function sendScrollEvent(core,e) {
    var target = focusobjects.scroll.target;
    if(target == null) return;
    fireEventAtTarget(target, {
        type:'scroll',
        target: target,
        position: e.position,
    })
}


function sendKeyboardPressEvent(core,event) {
    if(focusobjects.keyboard.target === null) return;
    event.type = 'keypress';
    event.target = focusobjects.keyboard.target;
    fireEventAtTarget(event.target,event);
}

function sendKeyboardReleaseEvent(core,event) {
    if(focusobjects.keyboard.target === null) return;
    event.type = 'keyrelease';
    event.target = focusobjects.keyboard.target;
    fireEventAtTarget(event.target,event);
}

fireEventAtTarget= function(target, event) {
    //console.log("firing an event at target:",event.type,target.id());
    if(!event.type) { console.log("WARNING. Event has no type!"); }
    if(listeners[event.type]) {
        listeners[event.type].forEach(function(l) {
            if(l.target == target) {
                l.func(event);
            }
        });
    }
}
