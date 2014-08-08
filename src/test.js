/** 
@class SGNode
@desc the base of all nodes 
*/

function SGNode() {
	this.live = false;
	
	this.createProp = function(name,handle) {
		this["set"+camelize(name)] = function(v) {
			this[name] = v;
			if(this.live) {
			    if(!propsHash[name]) {
			        console.log("WARNING: no prop key for " + name + " " + this.id);
			    }
				sgtest.updateProperty(handle, propsHash[name],v);
				if(this.propertyUpdated) {
				    this.propertyUpdated(name,v);
				}
			}
			return this;
		};
		this["get"+camelize(name)] = function() {
			return this[name];
		};
	}
	
	this.setProp = function(handle, name, value) {
		if(handle == null)  console.log("WARNING can't set prop " + name + ", the handle is null");
		sgtest.updateProperty(handle, propsHash[name],value);
	}

    
	this.delegateProps = function(props, handle) {
		for(var name in props) {
			this[name] = props[name]; //set the initial value
			this.createProp(name,handle);
			sgtest.updateProperty(handle, propsHash[name], props[name]);
		}
	}
	
	/** @prop id  identifier for the node. can be used to find it in the tree. */
	this.id = "noid";
	this.setId = function(id) {
		this.id = id;
		return this;
	}
	this.getId = function() {
	    return this.id;
	}
	
	/** @func getParent returns this node's parent, if any */
	this.getParent = function() {
	    return this.parent;
	}
	
	/** @prop visible indicates if node is visible or not. 
	Non-visible nodes are not drawn to the screen. */
	this.visible = true;
    this.setVisible = function(visible) {
        this.visible = visible;
        this.setProp(this.handle,'visible',visible?1:0);            
        return this;
    }	
    this.getVisible = function() {
        return this.visible;
    }
}

/** 
@class Rect 
@desc  A simple rectangle with a fill color. No border. */
function SGRect() {
	SGNode(this);
    this.init = function() {
        this.handle = sgtest.createRect();
        console.log("==== handle = " + this.handle);
        this.live = true;
        /** @prop tx  translate x. defaults to 0 */
        /** @prop ty  translate y. defaults to 0 */
        /** @prop x  left edge of the rect . defaults to 0 */
        /** @prop y  top edge of the rect. defaults to 0 */
        /** @prop w  width of the rect. defaults to 100 */
        /** @prop h  height of the rect. defaults to 100 */
        
        var props = { tx:0, ty:0, x:0, y:0, w:100, h:100, r: 0, g: 1, b:0, scalex: 1, scaley:1, rotateZ: 0, rotateX:0, rotateY: 0, visible:1 };
        this.delegateProps(props,this.handle);
        this.setFill = function(color) {
            color = ParseRGBString(color);
            this.setProp(this.handle,'r',color.r);
            this.setProp(this.handle,'g',color.g);
            this.setProp(this.handle,'b',color.b);
            return this;
        }
        this.getFill = function() {
            return this.color;
        }
    }
    this.contains = function(x,y) {
        if(x >=  this.getX()  && x <= this.getX() + this.getW()) {
            if(y >= this.getY() && y <= this.getY() + this.getH()) {
                return true;
            }
        }
        return false;
    }
}
SGRect.extend(SGNode);


/**
@class Group
@desc The principle grouping node. Does not render itself, just it's children.
*/
function SGGroup() {
    
    this.live = false;
    this.children = [];
    /** @func add adds the node to this group */
    this.add = function(node) {
    	if(!node) abort("can't add a null child to a group");
        if(!this.live) abort("error. trying to add child to a group that isn't live yet");
        this.children.push(node);
        node.parent = this;
        sgtest.addNodeToGroup(node.handle,this.handle);
    }
    this.isParent = function() { return true; }
    /** @func getChildCount returns number of child nodes */
    this.getChildCount = function() {
    	return this.children.length;
    }
    /** @func getChild returns the child at index i */
    this.getChild = function(i) {
    	return this.children[i];
    }
    /** @func remove removes the target child */
    this.remove = function(target) {
        var n = this.children.indexOf(target);
        this.children.splice(n,1);
        target.parent = null;
    }
    /** @func clear  removes all children */
    this.clear = function() {
        for(var i in this.children) {
            this.children[i].setVisible(false);
        }
        this.children = [];
    }
            
    
    this.init = function() {
        this.handle = sgtest.createGroup();
        var props = { tx:0, ty:0, scalex:1, scaley:1, rotateX:0, rotateY:0, rotateZ:0, visible:1};
        this.delegateProps(props,this.handle);
        this.live = true;
    }
}
SGGroup.extend(SGNode);


/**
@class SGWidget
@desc Base of all UI controls like buttons and labels 
*/
function SGWidget() {
    /** @func contains  returns true if the widget contains the point at x/y */
    this.contains = function(x,y) {
        if(x >=  this.getX()  && x <= this.getX() + this.getW()) {
            if(y >= this.getY() && y <= this.getY() + this.getH()) {
                return true;
            }
        }
        return false;
    }
    this.propertyUpdated = function() {
    }
    this.createLocalProp = function(name,value) {
    	this["set"+camelize(name)]= function(v) {
    		this[name] = v;
    		this.propertyUpdated(name,v);
    		return this;
    	}
		this["get"+camelize(name)] = function() {
			return this[name];
		};
		this["set"+camelize(name)](value);
    }
    this.createLocalProps = function(props) {
		for(var name in props) {
			this.createLocalProp(name,props[name]);
		}
    }
    
    this.createLocalProps({
    /** @prop anchorLeft  set true if left edge of widget is anchored */
    	anchorLeft:true,
    /** @prop anchorRight  set true if right edge of widget is anchored */
    	anchorRight:false,
    /** @prop anchorTop set true if top edge of widget is anchored */
    	anchorTop:true,
    /** @prop anchorBottom  set true if bottom edge of widget is anchored */
    	anchorBottom:false,
    /** @prop left  distance from left edge of widget to container's left. Only matters if anchorLeft = true */
    	left:0,
    /** @prop right  distance from right edge of widget to container's left. Only matters if anchorLeft = true */
		right:0,
    /** @prop top  distance from top edge of widget to container's left. Only matters if anchorLeft = true */
		top:0,
    /** @prop bottom  distance from bottom edge of widget to container's left. Only matters if anchorLeft = true */
		bottom:0,
    });
}
SGWidget.extend(SGNode);

