/*


add a constraint like this:

var cs = require('ConstraintSolver').getGlobal();

cs.parseConstraint(target,'x = parent.x + 20');

restrictions:

1) you must run cs.process() once after adding all constraints, or else the
first updates won't be refreshed. alternatively, set the value of the sources
after you add them. ex:  parent.x(30) in the example above.

2) if you use a parent constraint, the target must actually have a parent
at the time you add the constraint. adding child to parent after making
the constraint will crash. ex:

var parent = new gfx.Group();
var child = new gfx.Group();
cs.parseConstraint(child,'x = parent.x + 20'); //this will crash
parent.add(child);


*/


var ometajs = require('ometa-js');
var Parser = require('./constraint-parser.ometajs').Parser;

    var concount = 0;
function ConstraintSolver() {
    var constraints = [];
    this.makeConstraint = function(target, rule) {
        var con = {target:target, rule: rule, invalid:true, id: concount++};
        constraints.push(con);
    }
    function findConstraintsForTarget(obj) {
        var res = [];
        for(var i=0; i<constraints.length; i++) {
            var cons = constraints[i];
            if(cons.target == obj) res.push(cons);
        }
        return res;
    }
    this.debug_findConstraintsForTarget = findConstraintsForTarget;
    this.debug_getAllConstraints        = function() {
        return constraints;
    }
    var self = this;
    this.process = function() {
        self.getDirtyConstraints().forEach(function(con) {
            self.query(con.target, con.rule.target);
        })
    }

    function lookupObjectByContext(tgt,src) {
        //console.log("lookup = ",tgt.id(),src);
        if(src == 'parent') {
            return tgt.parent;
        }
        if(src == 'this') {
            return tgt;
        }
        console.log("WARNING: couldn't find " + src + " for " + tgt);
        return null;
    }
    var synthetic_props = {
        'left': function(obj) { return 0 },
        'top':function(obj) { return 0; },
        'right':function(obj) {
            return obj.x() + obj.w();
        },
    }
    function getObjectPropertyValue(obj, prop) {
        if(obj == null) console.log("WARNING obj is null");
        if(synthetic_props[prop]) {
            return synthetic_props[prop](obj);
        }
        if(!obj[prop]) console.log("WARNING obj",obj.id(),'has no property', prop);
        return obj[prop]();
    }
    var self = this;
    this.query = function(obj, prop) {
        var cons = findConstraintsForTarget(obj);
        //if no constraint, just fetch from the object directly
        if(cons.length < 1) {
            return getObjectPropertyValue(obj,prop);
        }
        var pcons = cons.filter(function(con) { return con.rule.target == prop});
        if(pcons.length < 1) {
            return getObjectPropertyValue(obj,prop);
        }
        var pcon = pcons[0];
        if(pcon.invalid == true) {
            // check each source property
            var real_sources = [];
            pcon.rule.sources.forEach(function(src) {
                var obj = null;
                if(src.type == 'const') {
                    real_sources.push(src.value);
                    return;
                }
                if(src.obj) {
                    obj = src.obj;
                }
                if(src.name) {
                    obj = lookupObjectByContext(pcon.target,src.name);
                    if(obj == null) console.log("WARNING. lookup by context failed:", src.name);
                }
                if(obj == null) console.log('WARNING: constraint source has no object or name',src);
                var val = self.query(obj, src.prop);
                real_sources.push(val);
            });
            // run the constraint function
            var oldval = pcon.val;
            pcon.val = pcon.rule.fun.apply(null,real_sources);
            //mirror this back to the real component
            if(oldval != pcon.val) {
                pcon.target[pcon.rule.target](pcon.val);
            }
            //mark as valid
            pcon.invalid = false;
        }
        return pcon.val;
    }
    function findConstraintsWithSource(obj, prop) {
        return constraints.filter(function(con) {
            for(var i=0; i<con.rule.sources.length; i++) {
                var src = con.rule.sources[i];
                if(src.obj == obj && src.prop == prop) return true;
            }
            return false;
        });
    }

    function markConstraintsInvalid(obj,prop) {
        //console.log("marking source invalid", obj.id(), prop);
        //find constraints which use obj.prop as a source
        var cons = findConstraintsWithSource(obj,prop);
        cons.forEach(function(con) {
            //console.log("looking at constraint for ", con.target.id(), con.rule.target);
            //mark as invalid
            con.invalid = true;
            markConstraintsInvalid(con.target, con.rule.target);
        });
    }
    this.update = function(obj, prop, val) {
        //first set the value
        obj[prop](val);
        markConstraintsInvalid(obj,prop);
    }
    this.updated = function(obj, prop) {
        markConstraintsInvalid(obj,prop);
        this.process();
    }
    this.clear = function() {
        constraints = [];
    }
    this.getDirtyConstraints = function() {
        return constraints.filter(function(con) { return con.invalid });
    }

    this.parseConstraint = function(node, rule, source0, source1, source2) {
        var src_objs = [source0, source1, source2];
        var ops = {
            '+':function(a,b) {  return a + b;   },
            '-':function(a,b) {  return a - b;   },
            '*':function(a,b) {  return a * b;   },
            '/':function(a,b) {  return a / b;   },
        }

        var cons = Parser.matchAll(rule,'start');
        if(src_objs[0]) {
            cons.source = {
                obj:src_objs.shift(),
                prop:cons.source.prop,
            }
        }
        var sources = [cons.source];
        var fun = function(v) {  return v; }
        cons.predicates.forEach(function(pred) {
            if(pred.ref.name) {
                if(pred.ref.name == 'source') {
                    sources.push({obj: src_objs.shift(), prop:pred.ref.prop});
                } else {
                    sources.push(pred.ref);
                }
            }
            if(pred.ref.type == 'const') {
                sources.push(pred.ref);
            }
            var opfun   = ops[pred.op];
            var prevfun = fun;
            fun = function() {
                var args = Array.prototype.slice.call(arguments);
                var b = args.pop();
                var a = args.pop();
                args.push(opfun(a,b));
                return prevfun.apply(null,args);
            }
        });

        //add a listener to each source property so we know when to update it
        sources.forEach(function(src) {
            if(src.type == 'const') return;
            var obj = null;
            if(src.name == 'parent') {
                obj = lookupObjectByContext(node,src.name);
                if(obj == null) console.log("WARNING. parent is null!");
            }
            if(src.name == 'this') {
                obj = lookupObjectByContext(node,src.name);
                if(obj == null) console.log("WARNING. this is null!");
            }
            if(src.obj) obj = src.obj;
            if(synthetic_props[src.prop]) return;//console.log("skipping synthetic property");
            if(!obj[src.prop]) console.log("WARNING. Property not found ", src.prop);

            obj[src.prop].watch(function(v){
                self.updated(src.obj,src.prop);
            })
        })

        return self.makeConstraint(node, {
            target: cons.target,
            sources: sources,
            fun: fun,
        });
    }

    this.c = this.parseConstraint;

    this.debug_dumpAllConstraints = function() {
        var cons = this.debug_getAllConstraints();
        cons.forEach(function(c) {
            console.log("constraint ", 'invalid=',c.invalid, 'id=',c.target.id(), 'prop=',c.rule.target, 'cid=',c.id);
            c.rule.sources.forEach(function(src) {
                if(src.obj)   console.log("   source obj  = ", src.obj.id());
                if(src.name ) console.log("   source name = ", src.name);
                if(src.type ) console.log("   source const = ", src.value);
            });
        });
    }

    return this;
}


exports.build = function() {
    return new ConstraintSolver();
}

var _global = null;
exports.getGlobal = function() {
    if(_global == null) {
        _global = new ConstraintSolver();
    }
    return _global;
}
