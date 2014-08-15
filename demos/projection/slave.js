console.log("I am the slave. :(");

var amino = require('amino.js');

amino.start(function(core, stage) {
    var root = new amino.Group();
    stage.setSize(400,400);
    stage.setRoot(root);

    function configure(m) {
        console.log("SLAVE: configuring",m);
        if(m.props.w) {
            stage.setSize(m.props.w,m.props.h);
        }
        if(m.props.dx) {
            root.x(m.props.dx);
        }
        if(m.props.dy) {
            root.y(m.props.dy);
        }
    }

    function make(m) {
        if(m.target == 'amino.Rect') {
            var obj = new amino.Rect();
            for(var name in m.props) {
                obj[name](m.props[name]);
            }
            root.add(obj);
        }
    }

    function find(root, id) {
        for(var i=0; i<root.children.length; i++) {
            var child = root.children[i];
            if(child.id() == id) {
                return child;
            }
        }
    }

    function update(m) {
        var obj = find(root,m.id);
        for(var name in m.props) {
            obj[name](m.props[name]);
        }
    }

    function anim(m) {
        var obj = find(root,m.id);
        var prop = obj[m.prop];
        var anim = prop.anim().from(m.anim.from).to(m.anim.to).dur(m.anim.dur).loop(m.anim.loop);
        anim.start();
    }

    process.on('message',function(m) {
        if(m.command == 'configure') {
            configure(m);
            return;
        }
        if(m.command == 'make') {
            make(m);
            return;
        }
        if(m.command == 'update') {
            update(m);
            return;
        }
        if(m.command == 'anim') {
            anim(m);
            return;
        }

        console.log("SLAVE: unknown command!",m);
    })
})
