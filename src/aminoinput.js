"use strict";
(function() {

console.log("inside of input");
var has_require = typeof require !== 'undefined'
if(has_require) {
    var input = exports
} else {
    this['aminoinput'] = {};
    input = this['aminoinput'];
}

console.log("input = ",input);

var keyState = {
    shift:false,
    control:false,
};


var mouseState = {
    pressed:false,
    x:0,
    y:0,
    pressTarget:null,
    downSwipeInProgress:false,
    upSwipeInProgress:false,
}

input.KEY_MAP = {
    UP_ARROW:      283,
    DOWN_ARROW:    284,
    RIGHT_ARROW:   286,
    LEFT_ARROW:    285,
    BACKSPACE:     295,
    ENTER:         294,
    //mac
    LEFT_SHIFT:    287,
    RIGHT_SHIFT:   288,
    LEFT_CONTROL:  289,
    LEFT_META:     323,
    RIGHT_META:    324,
}

var KEY_TO_CHAR_MAP = {};
//lower symbols
for(var i=32; i<=64; i++) {
    KEY_TO_CHAR_MAP[i]= String.fromCharCode(i);
}
//letters
for(var i=65; i<=90; i++) {
    KEY_TO_CHAR_MAP[i]= String.fromCharCode(i+32);
}
//upper symbols
KEY_TO_CHAR_MAP[91]=String.fromCharCode(91);
KEY_TO_CHAR_MAP[92]=String.fromCharCode(92);
KEY_TO_CHAR_MAP[93]=String.fromCharCode(93);
KEY_TO_CHAR_MAP[96]=String.fromCharCode(96);
//console.log(KEY_TO_CHAR_MAP);
var SHIFT_MAP = {};
//capital letters
for(var i=97; i<=122; i++) {
    SHIFT_MAP[String.fromCharCode(i)] = String.fromCharCode(i-32);
}
SHIFT_MAP['1'] = '!';
SHIFT_MAP['2'] = '@';
SHIFT_MAP['3'] = '#';
SHIFT_MAP['4'] = '$';
SHIFT_MAP['5'] = '%';
SHIFT_MAP['6'] = '^';
SHIFT_MAP['7'] = '&';
SHIFT_MAP['8'] = '*';
SHIFT_MAP['9'] = '(';
SHIFT_MAP['0'] = ')';

SHIFT_MAP['-'] = '_';
SHIFT_MAP['='] = '+';
SHIFT_MAP['['] = '{';
SHIFT_MAP[']'] = '}';
SHIFT_MAP['\\'] = '\|';
SHIFT_MAP['`'] = '~';


SHIFT_MAP[';'] = ':';
SHIFT_MAP['\''] = '\"';

SHIFT_MAP[','] = '<';
SHIFT_MAP['.'] = '>';
SHIFT_MAP['/'] = '?';
//console.log(SHIFT_MAP);

input.SHIFT_MAP = SHIFT_MAP;



/* raspberry pi specific for now */
function ascii(ch) {
    return ch.charCodeAt(0);
}
//josh's mac keyboard. must replace with something obtained from the system
var RPI_KEYCODE_MAP = {
    57:ascii(' '),
}

function insertKeyboardRow(n, letters) {
    for(var i=0; i<letters.length; i++) {
        RPI_KEYCODE_MAP[n+i] = ascii(letters[i]);
    }
}

insertKeyboardRow(2,'1234567890-=');
insertKeyboardRow(16,'QWERTYUIOP[]');
insertKeyboardRow(30,'ASDFGHJKL');
insertKeyboardRow(44,'ZXCVBNM,./');
RPI_KEYCODE_MAP[103] = 283; //up arrow
RPI_KEYCODE_MAP[105] = 285; //left arrow
RPI_KEYCODE_MAP[106] = 286; //right arrow
RPI_KEYCODE_MAP[108] = 284; //down arrow

/* end rpi keyboard stuff */

function mapNativeButton(e) {
    if(input.OS != "RPI") return;
}
function mapNativeKey(e) {
    if(e.keycode == input.KEY_MAP.LEFT_SHIFT || e.keycode == input.KEY_MAP.RIGHT_SHIFT) {
        if(e.type == "keypress") {
            keyState.shift = true;
        }
        if(e.type == "keyrelease") {
            keyState.shift = false;
        }
    }
    if(e.keycode == input.KEY_MAP.LEFT_CONTROL) {
        if(e.type == 'keypress') {
            keyState.control = true;
        }
        if(e.type == "keyrelease") {
            keyState.control = false;
        }
    }
    if(e.keycode == input.KEY_MAP.LEFT_META) {
        if(e.type == 'keypress') {
            keyState.system = true;
        }
        if(e.type == "keyrelease") {
            keyState.system = false;
        }
    }


    if(input.OS != "RPI") return;

    //left and right control
    if(e.keycode == 29 || e.keycode == 97) {
        e.control = 1;
    }
    //left and right option/alt
    if(e.keycode == 56 || e.keycode == 100) {
        e.alt = 1;
    }
    //left and right command
    if(e.keycode == 125 || e.keycode == 126) {
        e.system = 1;
    }

    var nc = RPI_KEYCODE_MAP[e.keycode];
    if(nc) {
        var ch = KEY_TO_CHAR_MAP[nc];
        //console.log("mapping: " + e.keycode + " to " + nc + " which is char '"+ch+"'");
        e.keycode = nc;
    }

}

var prevmouse = {};
var repeatEvent = null;
var repeatTimeout = null;

function dumpToParent(node,inset) {
    console.log(inset + "type = " + node.type + " " + node.getTx() + " " + node.getTy());
    if(node.getId) { console.log(inset + "     id = " + node.getId()); }
    if(node.parent) {
        dumpToParent(node.parent, inset+"  ");
    }
}

input.initOS = function() {
    console.log("initing OS specific input bindings for " + input.OS);
    if(input.OS == "MAC") {
        input.KEY_MAP.LEFT_SHIFT = 287;
        input.KEY_MAP.RIGHT_SHIFT = 288;
    }
    if(input.OS == "RPI") {
        input.KEY_MAP.LEFT_SHIFT = 42;
        input.KEY_MAP.RIGHT_SHIFT = 54;
    }
}
var queue = [];

function compressQueue() {
    var others = [];
    var pos = [];
    queue.forEach(function(e) {
        if(e.type == "mouseposition") {
            pos.push(e);
        } else {
            others.push(e);
        }
    });


    //move the mouse positions to the beginning of the queue
    if(pos.length >= 2) {
        var first = pos[0];
        var last = pos[pos.length-1];
        others.unshift(first);
        others.unshift(last);
    } else {
        pos.forEach(function(e) {
            others.unshift(e);
        });
    }

    pos.forEach(function(e) {
        others.push(e);
    });
    queue = others;
}

input.processEvent = function(core,e) {
    if(e.type == "validate") {
        compressQueue();
        queue.forEach(function(evt) {
            input.processOneEvent(core,evt);
        });
        queue = [];
        input.validateScene();
        return;
    }
    queue.push(e);
}

input.processOneEvent = function(core,e) {
    if(e.type == "animend") {
        core.notifyAnimEnd(e);
        return;
    }
    if(e.type == "mousebutton") {
        mapNativeButton(e);
        mouseState.pressed = (e.state == 1);
    }
    if(e.type == "keypress" || e.type == "keyrelease" || e.type == "keyrepeat") {
        mapNativeKey(e);
    }

    var repeatKey = function() {
        if(repeatEvent) {
            core.fireEventAtTarget(repeatEvent.target,repeatEvent);
            repeatTimeout = setTimeout(repeatKey, 20);
        }
    }
    function exitApp() { setTimeout(function() { process.exit(0); },10); };
    if(e.type == "windowclose") {
        exitApp();
        return;
    }
    if(e.type == "windowsize") {
        /**
        @class windowsize
        @desc an event fired whenever the window (stage) is resized.
        */
        core.fireEvent({
                /** @prop type windowsize */
                type:"windowsize",
                /** @prop source the source of this event. Always the window/stage that was resized. */
                source:core.stage,
                /** @prop width the new width of the window/stage that was resized. */
                width:e.width,
                /** @prop height the new height of the window/stage that was resized. */
                height:e.height,
        });
        return;
    }
    if(e.type == "mousewheelv") {
        prevmouse.wheelv = mouseState.wheelv;
        mouseState.wheelv = e.position;
        var dwv = mouseState.wheelv - prevmouse.wheelv;
        if(input.OS == "RPI") {
            dwv = e.position;
        }
        if(dwv==0) return;
        var node = core.findNodeAtXY(mouseState.x,mouseState.y);
        if(node != null) {
            /**
            @class mousewheelv
            @desc an event fired whenever the mouse wheel is turned, if the user has a mouse with a wheel
            */
            core.fireEventAtTarget(node, {
                type:"mousewheelv",
                wheel:dwv,
                target:node,
            });
        }
        return;
    }
    if(e.type == "mouseposition") {
        prevmouse.x = mouseState.x;
        prevmouse.y = mouseState.y;
        mouseState.x = e.x;
        mouseState.y = e.y;
        if(mouseState.pressed) {
            //drag events
            var node = mouseState.pressTarget;
            //console.log("firing: " + (mouseState.x - prevmouse.x));
            if(node == null) {
                node = core.findNodeAtXY(mouseState.x,mouseState.y);
            }
            if(node != null) {
                //var t1 = process.hrtime();
	            var pt = core.globalToLocal({x:mouseState.x,y:mouseState.y},node);
                var prevLocal = core.globalToLocal(prevmouse,node);
                var dx = pt.x - prevLocal.x;
                var dy = pt.y - prevLocal.y;
                //console.log('globalToLocal time',process.hrtime(t1)[1]/1e6);
                /**
                @class drag
                @desc an event fired whenever the mouse is dragged
                */
                core.fireEventAtTarget(
                    node,
                    {
                        type:"drag",
                        pressed:mouseState.pressed,
                        x:pt.x,
                        y:pt.y,
                        dx:dx,
                        dy:dy,
	                    point:pt,
                        target:node,
                        timestamp:e.timestamp,
                        time:e.time,
                    }
                );
            }
        }
        //move events
        /**
        @class move
        @desc an event fired whenever the mouse is moved
        */
        core.fireEvent({
            type: "move",
            x:mouseState.x,
            y:mouseState.y,
            point:{x:mouseState.x, y:mouseState.y},
            source:core,
        });
        return;
    }




    /**
    @class keypress
    @desc an event fired whenever a key on the keyboard is pushed down. special keys like 'shift' are filtered out.
    */
    if(e.type == "keypress") {

        if(repeatTimeout) {
            clearTimeout(repeatTimeout);
            repeatTimeout = null;
            repeatEvent = null;
        }


        var event = {
            type:"keypress",
        }
        event.keycode = e.keycode;
        event.shift   = keyState.shift;
        event.system  = keyState.system;//(e.system == 1);
        event.alt     = (e.alt == 1);
        event.control = keyState.control; //(e.control == 1);
        event.printable = false;
        event.printableChar = 0;
        if(KEY_TO_CHAR_MAP[e.keycode]) {
            event.printable = true;
            var ch = KEY_TO_CHAR_MAP[e.keycode];
            if(event.shift) {
                if(SHIFT_MAP[ch]) {
                    ch = SHIFT_MAP[ch];
                }
            }
            event.printableChar = ch;
        }
        if(input.OS == "RPI") {
            if(e.keycode == 42 || e.keycode == 54) {
                event.printable = false;
            }
        }
        if(core.keyfocus) {
            event.target = core.keyfocus;
        } else {
            event.target = core;
        }
        repeatTimeout = setTimeout(repeatKey,300)
        repeatEvent = event;
        core.fireEventAtTarget(event.target,event);
    }
    /**
    @class keyrelease
    @desc an event fired whenever a key on the keyboard is released up. special keys like 'shift' are filtered out.
    */
    if(e.type == "keyrelease") {
        if(repeatTimeout) {
            clearTimeout(repeatTimeout);
            repeatTimeout = null;
            repeatEvent = null;
        }
    }

    if(e.type == "mousebutton" && mouseState.pressed) {
        var node = core.findNodeAtXY(mouseState.x,mouseState.y);
        if(node != null) {
            mouseState.pressTarget = node;
            var pt = core.globalToLocal({x:mouseState.x,y:mouseState.y},node);
            /**
            @class press
            @desc an event fired whenever a mouse button is pressed.
            */
            core.fireEventAtTarget(node,
                {
                    type:"press",
                    pressed:mouseState.pressed,
                    x:pt.x,
                    y:pt.y,
                    point:pt,
                    target:node,
                    timestamp:e.timestamp,
                    time:e.time,
                }
            );
        }
        return;
    }
    if(e.type == "mousebutton" && !mouseState.pressed) {
        var node = core.findNodeAtXY(mouseState.x,mouseState.y);
        if(node != null) {
            var pt = core.globalToLocal({x:mouseState.x,y:mouseState.y},node);
            /**
            @class release
            @desc an event fired whenever a mouse button is released
            */
            core.fireEventAtTarget(node,
                {
                    type:"release",
                    pressed:mouseState.pressed,
                    x:pt.x,
                    y:pt.y,
                    point:pt,
                    target:node,
                    timestamp:e.timestamp,
                    time:e.time,
                }
            );
            if(node == mouseState.pressTarget) {
                core.fireEventAtTarget(node,
                    {
                        type:"click",
                        x:mouseState.x,
                        y:mouseState.y,
                        target:node
                    }
                    );
            }
        }
        return;
    }

}

}).call(this);
