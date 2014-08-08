/** 
@class dummy
@desc a dummy header to work around a doc generation bug. ignore
*/

if(typeof exports == 'undefined' || exports.inbrowser==true) {
    var widgets = this['widgets'] = {};
    var amino = this['amino'];
    var input = this['aminoinput'];
} else {
    var amino = require('amino.js');
    var widgets = exports;
    var input = require('aminoinput.js');
}


function camelize(s) {
	return s.substring(0,1).toUpperCase() + s.substring(1);
}

/**
@class PushButton
@desc a simple push button. The colors are set by the global amino theme. You can listen for action events on the button
with code like this:
@codestart
core.on('action',myButton,function(event) {
    console.log("the button " + event.source + " fired an action");
});
@codeend
or using the onAction function
@codestart
myButton.onAction(function(event) {
    console.log("the button " + event.source + " fired an action");
});
@codeend
*/
widgets.PushButton = amino.ComposeObject({
    type: "PushButton",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this push button */
            /** @prop h the width of this push button */
            /** @prop fill the fill color this push button. Should be a hex string. */
            promote: ['w','h','fill'],
        },
        label: {
            proto: amino.ProtoText,
            /** @prop text the text label of this button. */
            /** @prop fontSize the font size to use for this button. */
            promote: ['text','fontSize','fontName','fontWeight','fontStyle'],
        },
    },
    props: {
        //override w to center the label
        w: {
            value: 100,
            set: function(w) {
                this.props.w = w;
                this.comps.background.setW(w);
                this.markDirty();
                return this;
            }
        },
        //override h to center the label
        h: {
            value:100, 
            set: function(h) {
                this.props.h = h;
                this.comps.background.setH(h);
                this.markDirty();
                return this;
            }
        },
        color: {
            value: "#000000",
            set: function(color) {
                this.props.color = color;
                this.comps.label.setFill(color);
                this.markDirty();
                return this;
            }
        },
    },
    //replaces all setters
    init: function() {
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.label);
        
        var self = this;
        this.setFill(amino.colortheme.button.fill.normal);
        amino.getCore().on('press', this, function(e) {
            self.setFill(amino.colortheme.button.fill.pressed);
        });
        amino.getCore().on("release",this,function(e) {
            self.setFill(amino.colortheme.button.fill.normal);
        });
        amino.getCore().on("click",this,function(e) {
            var event = {type:'action',source:self};
            amino.getCore().fireEvent(event);
            if(self.actioncb) self.actioncb(event);
        });
        this.setFontSize(15);
        /** @func onAction(cb) a function to call when this button fires an action. You can also listen for the 'action' event. */
        this.onAction = function(cb) {
            this.actioncb = cb;
            return this;
        }
        this.markDirty = function() {
            this.dirty = true;
            amino.dirtylist.push(this);
        }
        this.doLayout = function() {
            var textw = this.comps.label.font.calcStringWidth(this.getText(),this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            this.comps.label.setTx(Math.round((this.getW()-textw)/2));
            var texth = this.comps.label.font.getHeight(this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            this.comps.label.setTy(Math.round(this.getH()/2 + texth/2));
        }
        this.validate = function() {
            this.doLayout();
            this.dirty = false;
        }
    }
});

widgets.ToggleButton = amino.ComposeObject({
    type: "PushButton",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this push button */
            /** @prop h the width of this push button */
            /** @prop fill the fill color this push button. Should be a hex string. */
            promote: ['w','h','fill'],
        },
        label: {
            proto: amino.ProtoText,
            /** @prop text the text label of this button. */
            /** @prop fontSize the font size to use for this button. */
            promote: ['text','fontSize','fontName','fontWeight','fontStyle'],
        },
    },
    props: {
        //override w to center the label
        w: {
            value: 100,
            set: function(w) {
                this.props.w = w;
                this.comps.background.setW(w);
                this.markDirty();
                return this;
            }
        },
        //override h to center the label
        h: {
            value:100, 
            set: function(h) {
                this.props.h = h;
                this.comps.background.setH(h);
                this.markDirty();
                return this;
            }
        },
        selected: {
            value: false,
            set: function(selected) {
                this.props.selected = selected;
                if(selected) {
                    this.setFill(amino.colortheme.button.fill.selected);
                } else {
                    this.setFill(amino.colortheme.button.fill.normal);
                }
                return this;
            }
        }
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.label);
        
        var self = this;
        this.setFill(amino.colortheme.accent);
        amino.getCore().on('press', this, function(e) {
            self.setFill("#aaee88");
        });
        amino.getCore().on("release",this,function(e) {
            self.setFill(amino.colortheme.accent);
        });
        amino.getCore().on("click",this,function(e) {
            self.setSelected(!self.getSelected());
            var event = {type:'action',source:self};
            amino.getCore().fireEvent(event);
            if(self.actioncb) self.actioncb(event);
            
        });
        this.markDirty = function() {
            this.dirty = true;
            amino.dirtylist.push(this);
        }
        this.setFontSize(15);
        this.doLayout = function() {
            var textw = this.comps.label.font.calcStringWidth(this.getText(),this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            this.comps.label.setTx(Math.round((this.getW()-textw)/2));
            var texth = this.comps.label.font.getHeight(this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            this.comps.label.setTy(Math.round(this.getH()/2 + texth/2));
        }
        this.validate = function() {
            this.doLayout();
            this.dirty = false;
        }
        /** @func onAction(cb) a function to call when this button fires an action. You can also listen for the 'action' event. */
        this.onAction = function(cb) {
            this.actioncb = cb;
            return this;
        }
    }
});

/**
@class Slider
@desc A slider to choose a value. The value is restricted to be between the max and min values.
The color of this slider is determined by the global amino theme.
*/
widgets.Slider = amino.ComposeObject({
    type: 'Slider',
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this slider */
            /** @prop h the width of this slider */
            /** @prop fill the fill color this slider. Should be a hex string. */
            promote: ['w','h','fill'],
        },
        thumb: {
            proto: amino.ProtoRect,
        },
    },
    props: {
        /** @prop min the minimum value of this slider */
        min: { value: 0 },
        /** @prop max the maximum value of this slider */
        max: { value: 100 },
        /** @prop value the current value of this slider */
        value: {
            value:"0", 
            set: function(value) {
                if(value < this.getMin()) value = this.getMin();
                if(value > this.getMax()) value = this.getMax();
                this.props.value = value;
                var thumbval = this.valueToPoint(value);
                this.comps.thumb.setTx(thumbval-10);
                var event = {type:'change',source:this, value:this.props.value};
                amino.getCore().fireEvent(event);
                return this;
            }
        }
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.thumb);
        this.setW(100).setH(20);
        this.comps.thumb.setW(20);
        this.comps.thumb.setH(20);
        
        this.valueToPoint = function(v) {
            var range = this.getMax()-this.getMin();
            v = ((v-this.getMin())/range)*this.getW();
            return v;
        }
        
        this.pointToValue = function(x) {
            var range = this.getMax()-this.getMin();
            var v = x/this.getW();
            return v * range + this.getMin();
        }
        
        var self = this;
        this.comps.background.setFill(amino.colortheme.neutral);
        this.comps.thumb.setFill(amino.colortheme.accent);
        amino.getCore().on('drag', this, function(e) {
            self.setValue(self.pointToValue(e.point.x));
        });
    }
});

/** 
@class Spinner
@desc A spinner to indicate progress of some activity 
*/
widgets.ProgressSpinner = amino.ComposeObject({
    type: 'ProgressSpinner',
    extend: amino.ProtoWidget,
    comps: {
        wrapper: {
            proto: amino.ProtoGroup,
        },
        icon: {
            proto: amino.ProtoText,
            promote: ['text','fontSize','fill','fontName'],
        },
    },
    props: {
        /** @prop active a boolean property to turn the spinner on or off. 
          The spinner will only be visible while it is active. */
        active: {
            value:false,
            set: function(active) {
                this.props.active = active;
                if(this.props.active) {
                    //start animations;
                    this.setVisible(1);
                    this.a1 = amino.getCore().createPropAnim(this.comps.wrapper, "rotateZ", 0,  -360, 1500).setCount(-1);
                } else {
                    //stop animations
                    this.setVisible(0);
                    //this.a1.stop();
                }
                return this;
            }
        },
    },
    init: function() {
        this.comps.base.add(this.comps.wrapper);
        this.comps.wrapper.add(this.comps.icon);
        this.comps.wrapper.setTx(0).setTy(0);
        this.comps.icon.setTx(0).setTy(-10);
        this.comps.icon.setFill(amino.colortheme.text)
            .setFontName('awesome')
            .setText('\uF110')
            //;
            //.setText('A')
            ;
        this.contains = function() { return false; }
        this.setVisible(0);
    }
});

/** 
@class Label
@desc A basic label. Can set a width and do left,center,right alignment. 
*/
widgets.Label = amino.ComposeObject({
    type:"Label",
    extend: amino.ProtoWidget,
    comps: {
        text: {
            proto: amino.ProtoText,
            /** @prop text  the text of this label */
            /** @prop fontSize  the text of this label */
            /** @prop fill  the text of this label */
            /** @prop fontName  the text of this label */
            /** @prop fontWeight  the text of this label */
            /** @prop fontStyle  the text of this label */
            promote: ['text','fontSize','fill','fontName','fontWeight','fontStyle'],
        }
    },
    props: {
        /** @prop w the width of this label. Used for alignment and hit detection */
        w: {
            value: 50,
            set: function(w) {
                this.props.w = w;
                this.doHLayout();
                return this;
            }
        },
        /** @prop h the height of this label. Used for alignment and hit detection */
        h: {
            value: 30,
            set: function(h) {
                this.props.h = h;
                this.doVLayout();
                return this;
            }
        },
        /** @prop align the horizontal alignment of this label. Can be 'left', 'right', or 'center' */
        align: {
            value: 'left',
            set: function(align) {
                this.props.align = align;
                this.doHLayout();
                return this;
            }
        },
        /** @prop valign the vertical alignment of this label. Can be 'top', 'bottom', or 'center' */
        valign: {
            value: "center",
            set: function(valign) {
                this.props.valign = valign;
                this.doVLayout();
                return this;
            }
        },
    },
    init: function() {
        this.comps.base.add(this.comps.text);
        this.doHLayout = function() {
            var textw = this.font.calcStringWidth(this.getText(),this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            if(this.props.align == 'left') {
                this.comps.text.setTx(0);
            }
            if(this.props.align == 'right') {
                this.comps.text.setTx(this.getW()-textw);
            }
            if(this.props.align == 'center') {
                this.comps.text.setTx(Math.round(this.getW()-textw)/2);
            }
        }
        this.doVLayout = function() {
            var texth = this.font.getHeight(this.getFontSize(),this.getFontWeight(),this.getFontStyle());
            var h = this.props.h;
            if(this.props.valign == 'top') {
                this.comps.text.setTy(0+texth);
            }
            if(this.props.valign == 'center') {
                this.comps.text.setTy(Math.round(h/2 + texth/2));
            }
            if(this.props.valign == 'bottom') {
                this.comps.text.setTy(h);
            }
        }
        this.setH(20);
    }
});

/**
@class AnchorPanel
@desc A container which lays out it's children using anchor
constraints like right and bottom. */
widgets.AnchorPanel = amino.ComposeObject({
    type:"AnchorPanel",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            promote: ['w','h','fill'],
        }
    },
    props: {
        /** @prop w the width of this anchor panel. Used for positioning the children. */
        w: {
            value: 300,
            set: function(w) {
                this.props['w'] = w;
                this.comps.background.setW(w);
                this.redoLayout();
                return this;
            }
        },
        /** @prop h the height of this anchor panel. Used for positioning the children. */
        h: {
            value: 300,
            set: function(h) {
                this.props['h'] = h;
                this.comps.background.setH(h);
                this.redoLayout();
                return this;
            }
        },
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.contains = function() { return false; }
        this.children = [];
        this.isParent = function() { return true; }
        /** @func  add(node) adds a new child to this panel */
        this.add = function(node) {
            if(!node) abort("can't add a null child to an anchor panel");
            if(!this.live) abort("error. trying to add child to a group that isn't live yet");
            this.children.push(node);
            this.comps.base.add(node);
            node.parent = this;
            //sgtest.addNodeToGroup(node.handle,this.handle);
            this.redoLayout();
            return this;
        }
        this.live = true;
        /** @func remove(target)  remove the target child */
        this.remove = function(target) {
            this.comps.base.remove(target);
            var n = this.children.indexOf(target);
            this.children.splice(n,1);
            this.redoLayout();
            return this;
        }
        
        this.setFill(amino.colortheme.base);
        this.redoLayout = function() {
            for(var i in this.children) {
                var node = this.children[i];
                if(node.getAnchorTop == undefined) {
                    //console.log("WARNING Node without getAnchorTop. Is it not a widget?");
                    continue;
                }
                //top aligned
                if(node.getAnchorTop() && !node.getAnchorBottom()) {
                    node.setTy(node.getTop());
                }
                
                //bottom aligned
                if(!node.getAnchorTop() && node.getAnchorBottom()) {
                    node.setTy(this.getH() - node.getBottom() - node.getH());
                }
                
                //vertical stretch
                if(node.getAnchorTop()  && node.getAnchorBottom()) {
                    node.setTy(node.getTop());
                    node.setH(this.getH() - node.getTop() - node.getBottom());
                }
                
                //left aligned
                if(node.getAnchorLeft() && !node.getAnchorRight()) {
                    node.setTx(node.getLeft());
                }
                
                //right aligned
                if(!node.getAnchorLeft() && node.getAnchorRight()) {
                    node.setTx(this.getW() - node.getRight() - node.getW());
                }
                
                //horizontal stretch
                if(node.getAnchorRight() && node.getAnchorLeft()) {
                    node.setTx(node.getLeft());
                    node.setW(this.getW()- node.getLeft() - node.getRight());
                }
                
            }
        }
        
        
    }
});


/**
@class VerticalPanel
@desc A panel which lays out it's children in a vertical box. All children will be given the width
of the panel, minus pading.
*/
widgets.VerticalPanel = amino.ComposeObject({
    type:"VerticalPanel",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this panel */
            /** @prop h the height of this panel */
            /** @prop fill color of this panel */
            promote: ['w','h','fill'],
        }
    },
    props: {
        /** @prop gap the gap between widgets in the panel */
        gap: { value: 10 },
        /** @prop padding the padding between widgets and the edges of the panel */
        padding: { value: 10 },
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.contains = function() { return false; }
        this.children = [];
        this.isParent = function() { return true; }
        /** @func add(node) adds a widget to this panel */
        this.add = function(node) {
            if(!node) abort("can't add a null child to an anchor panel");
            if(!this.live) abort("error. trying to add child to a group that isn't live yet");
            this.children.push(node);
            this.comps.base.add(node);
            node.parent = this;
            this.redoLayout();
        }
        this.clear = function() {
            this.children = [];
            this.comps.base.clear();
            this.comps.base.add(this.comps.background);
            this.redoLayout();
        }
        this.live = true;
        this.setFill(amino.colortheme.base);
        this.redoLayout = function() {
            var y = this.getPadding();
            for(var i in this.children) {
                var node = this.children[i];
                node.setTx(this.getPadding());
                node.setTy(y);
                y += node.getH() + this.getGap();
                node.setW(this.getW()-this.getPadding()*2);
            }
        }
        
        
    }
});

/**
@class HorizontalPanel
@desc A panel which lays out it's children in a horizontal  box. All children will be given the height of the panel, minus pading.
*/
widgets.HorizontalPanel = amino.ComposeObject({
    type:"HorizontalPanel",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this panel */
            /** @prop h the height of this panel */
            /** @prop fill color of this panel */
            promote: ['w','h','fill'],
        }
    },
    props: {
        /** @prop gap the gap between widgets in the panel */
        gap: { value: 10 },
        /** @prop padding the padding between widgets and the edges of the panel */
        padding: { value: 10 },
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.contains = function() { return false; }
        this.children = [];
        this.isParent = function() { return true; }
        /** @func add(node) adds a widget to this panel */
        this.add = function(node) {
            if(!node) abort("can't add a null child to an anchor panel");
            if(!this.live) abort("error. trying to add child to a group that isn't live yet");
            this.children.push(node);
            this.comps.base.add(node);
            node.parent = this;
            this.redoLayout();
            return this;
        }
        this.live = true;
        this.setFill(amino.colortheme.base);
        this.redoLayout = function() {
            var x = this.getPadding();
            for(var i in this.children) {
                var node = this.children[i];
                node.setTy(this.getPadding());
                node.setTx(x);
                x += node.getW() + this.getGap();
                node.setH(this.getH()-this.getPadding()*2);
            }
        }
        
        
    }
});

/**
@class ListViewCell
@desc A default cell for ListView. It has a background, size, and a single text label. 
*/
widgets.ListViewCell = amino.ComposeObject({
    type: "ListViewCell",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this cell */
            /** @prop h the height of this cell */
            /** @prop fill color of this cell */
            promote: ['w','h','fill'],
        },
        label: {
            proto: widgets.Label,
            /** @prop text text of the cell */
            /** @prop fontSize font size of the label */
            promote: ['text','fontSize'],
        },
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.label);
        this.comps.label.setW(100);
        this.comps.label.setH(32);
        this.setText("foo");
    },
});


/**
@class ListView
@desc Shows a list of items. Scrolls if there are too many items to fit on the screen. It can be customized
by setting a new TextCellRenderer or a new CellGenerator.
*/
widgets.ListView = amino.ComposeObject({
    type:"ListView",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop w the width of this ListView */
            /** @prop h the height of this ListView */
            /** @prop fill color of this ListView */
            promote: ['w','h','fill'],
        },
        cellholder: {
            proto: amino.ProtoGroup,
        },
    },
    props: {
        /** @prop cellHeight the height of cells. All cells have the same height. */
        cellHeight: { value: 32 },
        /** @prop cellWidth the width of cells. Not currently used. */
        cellWidth: { value: 32 },
        /** @prop layout the layout orientation of this list view. Currently only 'vertical' and 'flow' are supported. */
        layout: { 
            value: "vertical",
            set: function(layout) {
                this.props.layout = layout;
                this.markDirty();
                return this;
            }
        },
        /** @prop selectedIndex not supported yet */
        selectedIndex: { 
            value: -1 ,
            set: function(selectedIndex) {
                var cell = this.cells[this.props.selectedIndex];
                if(cell) cell.dirty = true;
                this.props.selectedIndex = selectedIndex;
                cell = this.cells[this.props.selectedIndex];
                if(cell) cell.dirty = true;
            }
        },
        /** @prop w the width of the list view. */
        w: {
            value: 300,
            set: function(w) {
                this.props['w'] = w;
                this.comps.base.setW(w);
                this.comps.background.setW(w);
                this.markDirty();
                this.cells.forEach(function(cell) {
                        cell.dirty = true;
                });
                return this;
            }
        },
        /** @prop h the width of the list view. */
        h: {
            value: 300,
            set: function(h) {
                this.props['h'] = h;
                this.comps.base.setH(h);
                this.comps.background.setH(h);
                this.markDirty();
                return this;
            }
        },
    },
    init: function() {
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.cellholder);
        this.comps.base.setCliprect(true);
        this.setFill(amino.colortheme.listview.cell.fillOdd);

        this.listModel = [];
        for(var i=0; i<30; i++) {
            this.listModel.push(i+" foo");
        }
        this.scroll = 0;
        this.dirty = false;
        
        /** @func setModel(model) sets a new model for this list. Should be an array */
        this.setModel = function(model) {
            this.listModel = model;
            this.cells = [];
            this.markDirty();
        }
        
        var self = this;
        this.markDirty = function() {
            this.dirty = true;
            amino.dirtylist.push(this);
        }
        this.validate = function() {
            this.regenerateCells();
            this.dirty = false;
        }
        amino.getCore().on("mousewheelv",this,function(e) {
            self.scroll -= e.wheel*2;
            if(self.scroll < 0) self.scroll = 0;
            var max = self.listModel.length*self.getCellHeight() - self.getH();
            if(self.scroll > max) { self.scroll = max; }
            if(max < 0) { self.scroll = 0; }
            self.markDirty();
        });
        amino.getCore().on("drag",this,function(e) {
            self.scroll -= e.dy;
            if(self.scroll < 0) self.scroll = 0;
            var max = self.listModel.length*self.getCellHeight() - self.getH();
            if(self.scroll > max) { self.scroll = max; }
            if(max < 0) { self.scroll = 0; }
            self.markDirty();
        });
        amino.getCore().on("press",this,function(e) {
            var y = e.y+self.scroll;
            var n = Math.floor(y/self.getCellHeight());
            self.setSelectedIndex(n);
            self.markDirty();
            var event = {type:'select',source:self};
            amino.getCore().fireEvent(event);
        });
        
        this.cells = [];
        this.bag = [];
        this.cg = function() {
            var cell = new widgets.ListViewCell();
            cell.comps.label.setFontSize(15);
            return cell;
        }
        this.generateCell = function() {
            return this.cg();
        };
        /** @func setCellGenerator(func) set a function which will return new ListCells when called. */
        this.setCellGenerator = function(cg) {
            this.cg = cg;
            this.cells = [];
            this.markDirty();
            return this;
        }
        
        this.textCellRenderer = null;
        /** @func setTextCellRenderer(func) set a function which will customize a list cell with an item.
        The function will be called with the cell, index of the item, and the item.
        */
        this.setTextCellRenderer = function(textCellRenderer) {
            this.textCellRenderer = textCellRenderer;
            this.markDirty();
            this.cells = [];
            return this;
        }
        this.fillCellValues = function(cell,i, item) {
            if(i%2 == 0) {
                cell.setFill(amino.colortheme.listview.cell.fillEven);
            } else {
                cell.setFill(amino.colortheme.listview.cell.fillOdd);
            }
            if(i == this.getSelectedIndex()) {
                cell.setFill(amino.colortheme.listview.cell.fillSelected);
            }
                
            if(this.textCellRenderer) {
                this.textCellRenderer(cell,i,item);
                return;
            }
            if(item == null) {
                cell.setText("");
            } else {
                cell.setText(item);
            }
        }
        
        this.regenerateCells = function() {
            var ch = this.getCellHeight();
            var cw = this.getCellWidth();
            
            this.removeCell = function(cell) {
                var n = this.cells.indexOf(cell);
                //use delete instead of splice so we can support sparse arrays
                delete this.cells[n];
                cell.setVisible(false);
                this.bag.push(cell);
            }
            
            this.comps.cellholder.setTy(-this.scroll);
            if(this.getLayout() == 'flow') {
                var rowlen = Math.floor(this.getW()/cw);
                var start_row = Math.floor(this.scroll/ch);
                var start_maxcells = rowlen*start_row;
                //console.log("start max cells = " + start_maxcells);
                var end_maxcells   = (rowlen+1)*Math.floor((this.getH()+this.scroll)/ch);
                var start = Math.min(this.listModel.length, start_maxcells);
                var end =   Math.min(this.listModel.length,   end_maxcells); 
                var top = this.scroll;
                var height = this.getH();
                if(this.cells[start-1]) {
                    this.removeCell(this.cells[start-1]);
                }
                if(this.cells[end]) {
                    this.removeCell(this.cells[end]);
                }
                //console.log("doing flow layout. start = " + start + ' end = ' + end);
                var cx = 0;
                var cy = start_row*ch;
                for(var n=start; n<end; n++) {
                    var cell = this.cells[n];
                    
                    if(!this.cells[n]) {
                        var cell = null;
                        if(this.bag.length > 0) {
                            cell = this.bag.pop();
                        } else {
                            cell = this.generateCell();
                        }
                        this.cells[n] = cell;
                        this.comps.cellholder.add(cell);
                        cell.index = n;
                        cell.setVisible(true);
                        cell.setTx(cx);
                        cell.setTy(cy);
                        cell.dirty = true;
                    }
                    var cell = this.cells[n];
                    if(cell.dirty) {
                        cell.setW(cw);
                        cell.setH(ch);
                        this.fillCellValues(cell,cell.index,this.listModel[cell.index]);
                        cell.dirty = false;
                    }
                    cx += cw;
                    if(cx+cw > this.getW()) {
                        cx=0;
                        cy+= ch;
                    }
                }
            }
            if(this.getLayout() == 'vertical') {
                
                var maxcells = Math.floor(this.scroll/ch);
                var start = Math.min(this.listModel.length, maxcells);
                var end   = Math.min(this.listModel.length, Math.floor((this.getH()+this.scroll)/ch)) + 1;
                var top = this.scroll;
                var height = (end-start)*ch;
                //console.log("========= window = " + top + " -> " + (top+height) + " range " + start + " " + end);
                
                /*
                loop through all cells
                    if cell is above the window. remove it
                    if cell is below the window. remove it
                if we need another cell for the top of the window. add it
                if we need another cell for the bottom of the window. add it
                */
                
                
                if(this.cells[start-1]) {
                    this.removeCell(this.cells[start-1]);
                }
                if(this.cells[end]) {
                    this.removeCell(this.cells[end]);
                }
                for(var n=start; n<end; n++) {
                    var cell = this.cells[n];
                    if(!this.cells[n]) {
                        var cell = null;
                        if(this.bag.length > 0) {
                            cell = this.bag.pop();
                        } else {
                            cell = this.generateCell();
                        }
                        this.cells[n] = cell;
                        this.comps.cellholder.add(cell);
                        cell.index = n;
                        cell.setVisible(true);
                        cell.setTx(0);
                        cell.setTy(n*ch);
                        cell.dirty = true;
                    }
                    var cell = this.cells[n];
                    if(cell.dirty) {
                        cell.setW(this.getW());
                        cell.setH(this.getCellHeight());
                        this.fillCellValues(cell,cell.index,this.listModel[cell.index]);
                        cell.dirty = false;
                    }
                }
            }
        }
        
        this.markDirty();
    },
});


function TextModel() {
    this.listeners = [];
    this.text = "this is some text";
    this.setText = function(text) {
        this.text = text;
        this.broadcast();
    }
    this.getElementAt = function(n) {
        var ch = this.text.substring(n,n+1);
        return {
            text:ch,
            newline: (ch == '\n'),
            whitespace: (ch == ' '),
        }
    }
    this.getText = function() {
        return this.text;
    }
    
    this.getLength = function() {
        return this.text.length;
    }
    this.insertAt = function(text, index) {
        this.text = this.text.substring(0,index) + text + this.text.substring(index);
        this.broadcast();
    }
    this.deleteAt = function(count, index) {
        if(index - count < 0) return false;
        this.text = this.text.substring(0,index-1) + this.text.substring(index);
        this.broadcast();
        return true;
    }
    this.listen = function(listener) {
        this.listeners.push(listener);
    }
    this.broadcast = function() {
        var self = this;
        this.listeners.forEach(function(listener) {
            listener.notify(self);
        });
    }
}
function StyleModel() {
    this.runs = [];
    /*
    this.runs.push({
            start: 5,
            end: 10,
            color: new amino.Color(0,1,0),
    });
    
    this.runs.push({
            start:20,
            end: 25,
            color: new amino.Color(0,0,1),
    });
    
    
    this.runs.push({
            start:40,
            end:-1,
            atomic:true,
            kind:"newline",
    });
    */
    
    this.doesStyleChange = function(n) {
        for(var i=0; i<this.runs.length; i++) {
            if(this.runs[i].start == n) return true;
            if(this.runs[i].end   == n) return true;
        }
        return false;
    }
    this.colorAt = function(n) {
        for(var i=0; i<this.runs.length; i++) {
            var run = this.runs[i];
            if(n >= run.start && n < run.end) {
                if(run.color) {
                    return run.color;
                }
            }
        }
        return "#000000";
    }
    
    this.insertAt = function(text, index) {
        var len = text.length;
        this.model.insertAt(text,index);
        var n = index;
        for(var i=0; i<this.runs.length; i++) {
            var run = this.runs[i];
            //before the run
            if(n < run.start) {
                run.start += len;
                run.end += len;
            }
            //inside the run
            if(n >= run.start && n < run.end) {
                run.end += len;
            }
        }
    }
    this.deleteAt = function(count, index) {
        var deleted = this.model.deleteAt(count, index);
        if(!deleted) return;
        var n = index;
        var toremove = [];
        for(var i=0; i<this.runs.length; i++) {
            var run = this.runs[i];
            if(n < run.start) {
                run.start -= count;
                run.end   -= count;
                continue;
            }
            if(n == run.start && run.atomic) {
                toremove.push(run);
                continue;
            }
            if(n == run.start && run.end <= run.start) {
                toremove.push(run);
                continue;
            }
            if(n >= run.start && n < run.end) {
                run.end   -= count;
                continue;
            }
        }
        var self = this;
        toremove.forEach(function(item) {
            var n = self.runs.indexOf(item);
            self.runs.splice(n,1);
        });
    }
}

function TextView() {
    this.lines = [];
    this.wrapping = true;
    this.setModel = function(model) {
        this.model = model;
        this.model.listen(this);
    }
    this.notify = function(sender) {
        this.layout();
    }
    this.getCharWidth = function(ch) {
        return this.font.calcStringWidth(ch,this.getFontSize());
    }
    this.getCharAt = function(n) {
        return this.model.text.substring(n,n+1);
    }
    this.getElementAt = function(n) {
        var elem = this.model.getElementAt(n);
        elem.width = this.getCharWidth(elem.text);
        if(elem.newline) {
            elem.width = 0;
        }
        return elem;
    }
    
    this.getStringWidth = function(str) {
        var len = 0;
        for(var i=0; i<str.length; i++) {
            len += this.getCharWidth(str[i]);
        }
        return len;
    }
    this.indexToXY = function(n) {
        if(n == 0) return {x:0, y:0};
        for(var i=0; i<this.lines.length; i++) {
            var line = this.lines[i];
            if(line.start <= n && n < line.end) {
                var run = line.runs[0];
                var txt = this.model.text.substring(run.start,n);
                var x = line.x + run.x + this.getStringWidth(txt);
                var y = line.y;
                return {x:x, y:y};
            }
        }
        return { x:0, y:0 };
    }
    this.indexToLineNum = function(n) {
        for(var i=0; i<this.lines.length; i++) {
            var line = this.lines[i];
            if(line.start <= n && n <= line.end) {
                return i;
            }
        }
        return -1;
    }
    this.getLine = function(n) {
        return this.lines[n];
    }
    
    this.fontSize = 10;
    this.getFontSize = function() {
        return this.fontSize;
    }
    this.fontWeight = 400;
    this.getFontWeight = function() {
        return this.fontWeight;
    }
    
    this.control = null;
    this.line = null;
    this.run = null;
    this.y = 0;
    this.w = 0;
    this.lineheight = 50;
    this.endLine = function(n) {
        var linegap = this.lineheight * 0.5;
        this.run.end = n+1;
        this.line.end = n+1;
        this.line.runs.push(this.run);
        this.lines.push(this.line);
        this.line.h = this.lineheight;
        this.line.w = this.control.getW();
        this.line = new LineBox();
        this.y+= (this.lineheight + linegap);
        this.line.y = this.y;
        this.line.start = n+1;
        this.run = new RunBox();
        this.run.color = this.styles.colorAt(n);
        this.run.model = this.model;
        this.run.start = n+1;
        this.w = 0;
    }
    this.layout = function() {
        if(!this.font) return;
        this.lines = [];
        
        this.lineheight = this.font.getHeight(this.getFontSize(),this.getFontWeight());
        
        var n = 0;
        this.w = 0;
        this.y = 0;
        this.line = new LineBox();
        this.line.start = n;
        this.run = new RunBox();
        this.run.model = this.model;
        this.run.color = this.styles.colorAt(n);
        this.run.start = n;
        this.lastspace = -1;
        
        while(true) {
            var ch = this.getElementAt(n);
            if(ch.whitespace) {
                this.lastspace = n;
            }
            
            if(ch.newline) {
                this.endLine(n);
            }
            this.w += ch.width;
            if(this.wrapping && (this.w > this.control.getW() || ch == '\n')) {
                //go back to previous space
                if(this.lastspace >= 0) {
                    n = this.lastspace;
                    this.lastspace = -1;
                }
                this.endLine(n);
            }
            n++;
            if(n >= this.model.getLength()) {
                this.endLine(n);
                break;
            }
        }
        
        /*
        this.lines.forEach(function(line) {
            console.log("line " + line.x + "," + line.y, line.h);
            line.runs.forEach(function(run) {
                console.log("   "+run.toString());
            });
        });
        */
    }
}

function LineBox() {
    this.x = 0;
    this.y = 0;
    this.runs = [];
}

function RunBox() {
    this.x = 0;
    this.y = 0;
    this.model = null;
    this.start = 0;
    this.end = 0;
    this.color = "#ff0000";
    this.toString = function() {
        return "run: " + this.model.text.substring(this.start, this.end);
    }
}

function Cursor() {
    this.FORWARD = 1;
    this.BACKWARD = -1;
    this.index = 0;
    this.control = null;
    this.clipboard = "";
    this.bias = this.FORWARD;
    
    this.notify = function() {
        if(this.onnotify) this.onnotify(this);
    }
    
    this.advanceChar = function(offset) {
        this.index += offset;
        if(this.index < 0) {
            this.index = 0;
            this.bias = this.BACKWARD;
        }
        if(this.index > this.model.getLength()-1) {
            this.index = this.model.getLength()-1;
            this.bias = this.FORWARD;
        }
        this.notify();
    }
    
    this.deleteChar = function() {
        if(this.bias == this.FORWARD) {
            this.control.styles.deleteAt(1,this.index+1);
        } else {
            this.control.styles.deleteAt(1,this.index);
        }
        this.advanceChar(-1);
    }
    
    this.deleteNextChar = function() {
        if(this.bias == this.FORWARD) {
            this.control.styles.deleteAt(1,this.index+2);
        } else {
            this.control.styles.deleteAt(1,this.index+1);
        }
    }
    
    this.insertChar = function(ch) {
        if(this.bias == this.BACKWARD) {
            this.control.styles.insertAt(ch,this.index);
        } else {
            this.control.styles.insertAt(ch,this.index+1);
        }
    }
    
    this.insertNewline = function() {
        if(this.bias == this.BACKWARD) {
            this.control.styles.insertAt('\n',this.index);
            this.bias = this.BACKWARD;
            this.advanceChar(1);
        } else {
            this.control.styles.insertAt('\n',this.index+1);
            this.bias = this.BACKWARD;
            this.advanceChar(1);
        }
    }


    this.selectionActive = function() {
        return (this.control.selection != null);
    }
    this.clearSelection = function() {
        this.control.selection = null;
    }
    this.extendSelection = function(offset) {
        if(!this.control.selection) {
            this.control.selection = new TextSelection();
            this.control.selection.start = this.index;
        }
        this.index += offset;
        this.control.selection.end = this.index;
    }
    this.deleteSelection = function() {
        var sel = this.control.selection;
        var text =  this.control.model.text;
        this.control.model.text = text.substring(0,sel.getStart()) + text.substring(sel.getEnd());
        this.index = sel.getStart();
        this.control.model.broadcast();
    }
    
    this.cutSelection = function() {
        var sel = this.control.selection;
        var text =  this.control.model.text;
        this.clipboard = text.substring(sel.start,sel.end);
        this.control.model.text = text.substring(0,sel.getStart()) + text.substring(sel.getEnd());
        this.index = sel.getStart();
        this.clearSelection();
        this.control.model.broadcast();
    }
    this.pasteSelection = function() {
        var paste = child_process.spawn('pbpaste');
        console.log("spawning a process");
        var txt = "";
        var self = this;
        paste.stdout.on('data', function(data) {
                console.log("got data: " + data);
                txt += data;
        });
        paste.stdout.on('close', function() {
            console.log("done with the paste text: " + txt);
            var model = self.control.model;
            self.clipboard = txt;
            model.text = model.text.substring(0,self.index) + self.clipboard + model.text.substring(self.index);
            self.index = self.index + self.clipboard.length;
            self.control.model.broadcast();
        });
            /*
        UTILS.getClipboard(function(str) {
            console.log("got the clipboard: " + str);
            var model = this.control.model;
            model.text = model.text.substring(0,this.index) + this.clipboard + model.text.substring(this.index);
            this.index = this.index + this.clipboard.length;
            this.control.model.broadcast();
        });*/
    }
    this.copySelection = function() {
        var model = this.control.model;
        var sel = this.control.selection;
        var text =  this.control.model.text;
        this.clipboard = text.substring(sel.getStart(), sel.getEnd());
    }
    
    this.advanceLine = function(offset) {
        var lineNum = this.view.indexToLineNum(this.index);
        var oldline = this.view.getLine(lineNum);
        if(!oldline) return;
        
        //how many chars into the oldline are we
        var inset = this.index - oldline.start;

        //move to the new line
        lineNum += offset;
        var newline = this.view.getLine(lineNum);
        
        //if we are off the end of the document now
        if(!newline) {
            //if going down, move to end of line
            if(offset >= 0) {
                this.index = oldline.end-1;
            } else {
                //else move to start of line
                this.index = oldline.start;
            }
            return;
        }
        
        //calc new index
        this.index = newline.start+inset;
        //if too long for the new line, go to end of new line
        if(this.index > newline.end-1) {
            this.index = newline.end-1;
        }
        
        //done!
        
        //p("new     index and line = " + this.index + " " + lineNum);
        this.notify();
    }
}

function TextSelection() {
    this.start = -1;
    this.end = -1;
    this.getStart = function() {
        if(this.end < this.start) return this.end;
        return this.start;
    }
    this.getEnd = function() {
        if(this.end < this.start) return this.start;
        return this.end;
    }
}

function TextControl() {
    this.selection = null;
    this.cursor = new Cursor();
    this.cursor.control = this;
    this.model = new TextModel();
    this.model.listen(this);
    this.view = new TextView();
    this.view.control = this;
    this.styles = new StyleModel();
    this.view.styles = this.styles;
    this.view.setModel(this.model);
    this.styles.model = this.model;
    this.cursor.view = this.view;
    this.cursor.model = this.model;
    this.notify = function() {
        console.log("doing nothing");
    }
    
    this.getText = function() {
        return this.model.getText();
    }
    
    this.wrapping = true;
    this.setWrapping = function(wrapping) {
        this.wrapping = wrapping;
        this.view.wrapping = wrapping;
        return this;
    }
    
    this.setFont = function(font) {
        this.font = font;
        this.view.font = font;
        return this;
    }
    
    this.setFontSize = function(fontSize) {
        this.fontSize = fontSize;
        this.view.fontSize = fontSize;
        return this;
    }
    
    this.drawSelection = function(gfx) {
        if(this.selection != null) {
            var sel = this.selection;
            var view = this.view;
            var model = this.model;
            for(var i=0; i<this.view.lines.length; i++) {
                var line = this.view.lines[i];
                //before selection
                if(line.end < sel.start) continue;
                
                var x = 0;
                //selection start on this line
                if(line.start <= sel.start && line.end > sel.start) {
                    var before = model.text.substring(line.start,sel.start);
                    x = view.getStringWidth(before);
                }
                var x2 = line.w;
                //selection starts and ends on this line
                if(line.start <= sel.start && sel.end < line.end) {
                    var during = model.text.substring(sel.start,sel.end);
                    var w = view.getStringWidth(during);
                    x2 = x + w;
                }
                
                //selection ends on this line
                if(sel.end < line.end) {
                    var during = model.text.substring(line.start, sel.end);
                    var w = view.getStringWidth(during);
                    x2 = w;
                }
                
                //selection ends before this line
                if(sel.end < line.start) continue;
                
                gfx.fillQuadColor("#88ff88", 
                    { x: line.x+x, y: line.y, w: x2-x, h:line.h });
            }
        }
    }
    /*
    this.draw = function(gfx) {
        console.log('drawing the text control');
        gfx.save();

        var bds = this.getBounds();
        bds.w += 10;
        bds.h += 10;
        gfx.fillQuadColor("#888888", bds);
        bds.w -= 2;
        bds.h -= 2;
        gfx.translate(1,1);
        
        var bgcolor = "#dddddd";
        if(this.stage.getKeyboardFocus() == this) {
            bgcolor = "#ffffff";
        }
        gfx.fillQuadColor(bgcolor, bds);
        
        gfx.translate(5,5);
        var font = this.font;
        
        this.drawSelection(gfx);
        
        var ch  = this.view.getElementAt(this.cursor.index);
        //var chw = this.view.getCharWidth(ch);
        var pos = this.view.indexToXY(this.cursor.index);
        
        var chx = 0;
        if(this.cursor.bias == this.cursor.FORWARD && ch.width)  { chx = ch.width; }
        if(this.cursor.bias == this.cursor.BACKWARD) { }
        var chh = this.font.json.height* this.font.scale;

        //draw block cursor
        
        //draw the actual text
        this.view.lines.forEach(function(line) {
            line.runs.forEach(function(run) {
                var txt = run.model.text.substring(run.start,run.end);
                if(txt.length < 1) return;
                gfx.fillQuadText(run.color, 
                    txt, 
                    run.x, line.y,
                    font.scaledsize, font.fontid
                    );
            });
        });
        
        
        //draw line cursor
        gfx.fillQuadColor("#ff00ff", {
                x: pos.x+chx,
                y: pos.y,
                w: 2,
                h: chh,
        });
        gfx.restore();
    }
    */
    
    this.keypressHappened = function(kp) {
        if(kp.control) {
            if(this.controlHandlers[kp.keycode]) {
                this.controlHandlers[kp.keycode](kp);
                return;
            }
        }
        if(this.handlers[kp.keycode]) {
            this.handlers[kp.keycode](kp);
            return;
        }
        if(kp.printable) {
            //console.log(kp);
            if(kp.printableChar == 'x' && kp.system) {
                this.cursor.cutSelection();
                return;
            }
            if(kp.printableChar == 'c' && kp.system) {
                this.cursor.copySelection();
                return;
            }
            if(kp.printableChar == 'v' && kp.system) {
                this.cursor.pasteSelection();
                return;
            }
                
            this.cursor.insertChar(kp.printableChar);
            this.cursor.advanceChar(+1);
            return;
        }
    }
    var self = this;
    this.install = function(stage) {
        self.notify = function(sender) {
            amino.getCore().fireEvent({
                type:"changed",
                target:this
            });            
        }
        
    };
    
    var keyHandlers = {
        moveCursorBackOneCharacter:function(kp) {
            if(kp.shift) {
                self.cursor.extendSelection(-1);
            } else {
                if(self.cursor.selectionActive()) {
                    self.cursor.clearSelection();
                } else {
                    self.cursor.advanceChar(-1);
                }
            }
        },
        cursorForwardCharacter: function(kp) { // right arrow
            if(kp.shift) {
                self.cursor.extendSelection(+1);
            } else {
                if(self.cursor.selectionActive()) {
                    self.cursor.clearSelection();
                } else {
                    self.cursor.advanceChar(+1);
                }
            }
        },
        cursorLineStart:function(kp) {
            if(self.cursor.selectionActive()) {
                self.cursor.clearSelection();
            }
            //get the line number
            var lineNum = self.view.indexToLineNum(self.cursor.index);
            //get the line box
            var linebox = self.view.getLine(lineNum);
            //move cursor to start of the line
            self.cursor.index = linebox.start;
            //set the bias
            self.cursor.bias = self.cursor.BACKWARD;
            self.cursor.notify();
        },
        cursorLineEnd:function(kp) {
            if(self.cursor.selectionActive()) {
                self.cursor.clearSelection();
            }
            //get the line number
            var lineNum = self.view.indexToLineNum(self.cursor.index);
            //get the line box
            var linebox = self.view.getLine(lineNum);
            //move cursor to start of the line
            console.log('end of line = ' + (linebox.end-1));
            self.cursor.index = linebox.end-1;
            //set the bias
            self.cursor.bias = self.cursor.FORWARD;
            self.cursor.notify();
        },
        cursorNextLine: function(kp) {
            if(kp.shift) {
            } else {
                if(self.cursor.selectionActive()) {
                    self.cursor.clearSelection();
                } else {
                    self.cursor.advanceLine(+1);
                }
            }
        },
        cursorPrevLine: function(kp) {
            if(kp.shift) {
            } else {
                if(self.cursor.selectionActive()) {
                    self.cursor.clearSelection();
                } else {
                    self.cursor.advanceLine(-1);
                }
            }
        },
        cursorDeletePrevChar: function(kp) {
            if(self.cursor.index - 1 < -1) return;
            if(self.cursor.selectionActive()) {
                self.cursor.deleteSelection();
                self.cursor.clearSelection();
            } else {
                self.cursor.deleteChar();
            }
        },
        cursorDeleteNextChar: function(kp) {
            //            if(self.cursor.index - 1 < 0) return;
            if(self.cursor.selectionActive()) {
                self.cursor.deleteSelection();
                self.cursor.clearSelection();
            } else {
                self.cursor.deleteNextChar();
            }
        },
    };
    
    this.handlers = { };
    
    this.handlers[input.KEY_MAP.UP_ARROW] = keyHandlers.cursorPrevLine;
    this.handlers[input.KEY_MAP.DOWN_ARROW] = keyHandlers.cursorNextLine;
    this.handlers[input.KEY_MAP.LEFT_ARROW] = keyHandlers.moveCursorBackOneCharacter;
    this.handlers[input.KEY_MAP.RIGHT_ARROW] = keyHandlers.cursorForwardCharacter;
    this.handlers[input.KEY_MAP.BACKSPACE] = keyHandlers.cursorDeletePrevChar;
    this.handlers[input.KEY_MAP.ENTER] = function(kb) { // enter/return key
            if(!kb.target.wrapping) {
                amino.getCore().fireEvent({
                    type:"action",
                    target:kb.target,
                    source:kb.target,
                });
                return;
            }
            self.cursor.insertNewline();
        };
    
    this.controlHandlers = {
        80: keyHandlers.cursorPrevLine, // ctl-P prev line
        78: keyHandlers.cursorNextLine, // ctl-N next line
        66: keyHandlers.moveCursorBackOneCharacter, // ctl-B backward
        70: keyHandlers.cursorForwardCharacter, // ctl-F forward 
        68: keyHandlers.cursorDeleteNextChar, // ctl-D delete next char
        65: keyHandlers.cursorLineStart, //ctl-A start of line action
        69: keyHandlers.cursorLineEnd, //ctl-E end of line action
    };
    
    this.setNewlineText = function(text) {
        this.model.setText(text);
    }
    this.setText = function(text) {
        this.model.setText(text);
    }
    this.getText = function() {
        return this.model.getText();
    }
    
    this.getVisible = function() { return true; }
    this.tx = 0;
    this.ty = 0;
    this.x = 0;
    this.y = 0;
    this.w = 100;
    this.getTx = function() { return this.tx; }
    this.getTy = function() { return this.ty; }
    this.setTx = function(tx) { this.tx = tx; return this; }
    this.setTy = function(ty) { this.ty = ty; return this; }
    this.setW = function(w) { this.w = w; return this; }
    this.setH = function(h) { this.h = h; return this; }
    this.getW = function() { return this.w; }
    this.getH = function() { return this.h; }
    this.setParent = function(p) { this.parent = p; return this; }
    this.contains = function(pt){
        if(pt.x<this.x){
            return false;}
        ;
            if(pt.x>this.x+this.w){
            return false;}
        ;
            if(pt.y<this.y){
            return false;}
        ;
            if(pt.y>this.y+this.h){
            return false;}
        ;
        return true;
    }
    this.getBounds = function() {
        return {
            x:0,
            y:0,
            w:this.w,
            h:this.h
        };
    }
}

/**
@class TextField
@desc An box holding editable text. It holds a single line of text by default.
*/
widgets.TextField = amino.ComposeObject({
    type: "TextField",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            /** @prop fill the fill color of this text field */
            promote: ['w','h','fill'],
        },
        cursor: {
            proto: amino.ProtoRect,
        },
        texts: {
            proto: amino.ProtoGroup,
        },
    },
    props: {
        /** @prop w the width of this text field */
        w: {
            value: 100,
            set: function(w) {
                this.props['w'] = w;
                this.comps.background.setW(w);
                this.tc.setW(w-3*2); //inset
                return this;
            },
        },
        /** @prop h the height of this text field */
        h: {
            value: 30,
            set: function(h) {
                this.props['h'] = h;
                this.comps.background.setH(h);
                this.tc.setH(h);
                return this;
            }
        },
        /** @prop fontSize the font size of this text field */
        fontSize: {
            value: 15,
            set: function(fontSize) {
                this.props['fontSize'] = fontSize;
                this.tc.setFontSize(fontSize);
                return this;
            }
        },
        wrapping: {
            value: false,
            set: function(wrapping) {
                this.props['wrapping'] = wrapping;
                this.tc.setWrapping(wrapping);
                return this;
            }
        }
    },
    init: function() {
        this.tc = new TextControl();
        this.comps.base.add(this.comps.background);
        this.comps.base.add(this.comps.texts);
        this.comps.base.add(this.comps.cursor);
        this.comps.texts.setTy(5).setTx(3); //inset
        this.comps.cursor.setW(2).setH(20);
        this.comps.background.setH(30);
        this.setH(30);
        this.setFill("#cccccc");
        this.tc.install();
        var self = this;
        amino.getCore().on("press",this,function() {
            amino.getCore().requestFocus(self);
        });
        self.comps.cursor.setVisible(false);
        amino.getCore().on("focusgain",this,function() {
            self.setFill(amino.colortheme.textfield.bg.focused);
            self.comps.cursor.setVisible(true);
            if(amino.SOFTKEYBOARD_ENABLED) {
                var stage = amino.getCore().stage;
                console.log(stage);
                self.kb = new widgets.SoftKeyboard()
                    .setW(stage.getW()).setH(140)
                    .setTy(stage.getH()-140);
                self.kb.setTargetTextControl(self);
                stage.getRoot().add(self.kb);
            }
            
        });
        amino.getCore().on("focusloss",this,function() {
            self.comps.cursor.setVisible(false);
            self.setFill(amino.colortheme.textfield.bg.unfocused);
            console.log("lost the focus");
            if(self.kb) {
                var stage = amino.getCore().stage;
                console.log("removing the keyboard");
                stage.getRoot().remove(self.kb);
                self.kb.setVisible(false);
                self.kb = null;
            }
        });
        amino.getCore().on("keypress",this,function(kp) {
            self.tc.keypressHappened(kp);
        });
        
        var oldlayout = this.tc.view.layout;
        this.tc.cursor.onnotify = function(cursor) {
            var ch  = self.tc.view.getElementAt(cursor.index);
            var pos = self.tc.view.indexToXY(cursor.index);
            var chx = 0;
            if(self.tc.cursor.bias == self.tc.cursor.FORWARD && ch.width)  { chx = ch.width; }
            if(self.tc.cursor.bias == self.tc.cursor.BACKWARD) { }
            self.comps.cursor.setTx(pos.x+chx+3);
            self.comps.cursor.setTy(pos.y+5);
        }
        this.tc.view.layout = function() {
            var texts = self.comps.texts.children;
            self.tc.view.font = self.font;
            //invoke the old layout routines
            oldlayout.call(self.tc.view);
            //now change the text primitives to match the layout
            if(!this.lines || this.lines.length < 1) return;
            
            var l = 0;
            while(l < this.lines.length) {
                var line = this.lines[l];
                if(!line.runs || line.runs.length < 1) continue;
                var run = line.runs[0];
                if(texts.length-1 < l) {
                    self.comps.texts.add(new amino.ProtoText());
                }
                var text = self.comps.texts.children[l];
                text.setTy(Math.floor(line.y + line.h));
                text.setFontSize(self.getFontSize());
                text.setVisible(1);
                text.setText(run.model.text.substring(run.start, run.end));                
                l++;
            }
            if(texts.length > l) {
                for(var i=l; i<texts.length; i++) {
                    texts[i].setVisible(0);
                }
            }
            var pos = this.indexToXY(this.control.cursor.index);
            self.comps.cursor.setTx(pos.x+3);
            self.comps.cursor.setTy(pos.y+5);
        }
        this.setText = function(text) {
            this.tc.model.setText(text);
            this.tc.view.layout();
            return this;
        }
        this.getText = function() {
            return this.tc.getText();
        }
        
        this.tc.model.listen({
            notify:function() {
                var event = {type:'change',source:self, name:'text', text:self.tc.model.getText()};
                amino.getCore().fireEvent(event);
            },
        });        
        this.setText("a text field");
        this.tc.setWrapping(false);
        
        this.insertStringAtCursor = function(str) {
            this.tc.cursor.insertChar(str);
            this.tc.cursor.advanceChar(+str.length);
        }
        
        this.setFontSize(15);
    }
});

/**
@class SoftKeyboard
@desc A software keyboard for use on mobile devices without physical keyboards.
*/
widgets.SoftKeyboard = amino.ComposeObject({
    type:"SoftKeyboard",
    extend: amino.ProtoWidget,
    comps: {
        background: {
            proto: amino.ProtoRect,
            promote: ['w','h','fill'],
        }
    },
    init: function() {
        this.setFill("#888888");
        this.comps.base.add(this.comps.background);
        var keysvals = [
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L'],
            ['Z','X','C','V','B','N','M'],
        ];
        var rowoffset = [5,20,50];
        var keyw = 30;
        var keyh = 30;
        var gapw = 2;
        var gaph = 2;
        
        var keybgs = [];
        for(var r=0; r<keysvals.length; r++) {
            var row = keysvals[r];
            var off = rowoffset[r];
            for(var i=0; i<row.length; i++) {
                var ch = row[i];
                var keybg = new amino.ProtoRect().setW(keyw).setH(keyh)
                    .setTx(i*(keyw+gapw)+off).setTy(r*(keyh+gaph))
                    .setFill("#e0e0e0");
                keybg.ch = ch;
                this.comps.base.add(keybg);
                var keytext = new amino.ProtoText()
                    .setTx(i*(keyw+gapw)+3+off).setTy(20+r*(keyh+gaph))
                    .setFill("#000000").setText(ch);
                this.comps.base.add(keytext);
                keybgs.push(keybg);
            }
        }
        this.shiftOn = false;
        var self = this;
        amino.getCore().on('press',this,function(e) {
            keybgs.forEach(function(key) {
                var x = e.point.x - key.getTx();
                var y = e.point.y - key.getTy();
                if(key.contains(x,y)) {
                    amino.getCore().fireEvent({
                            type:'softkeypress',
                            source:self,
                            key:key.ch,
                    });
                    if(self.tf) {
                        var ch = key.ch;
                        if(self.shiftOn) {
                            ch = ch.toUpperCase();
                        } else {
                            ch = ch.toLowerCase();
                        }
                        self.tf.insertStringAtCursor(ch);
                    }
                }
            });
        });
        
        this.children = [];
        this.isParent = function() { return true; }
        
        this.setTargetTextControl = function(tf) {
            this.tf = tf;
        }

        var done = new widgets.PushButton()
            .setText('done').onAction(function() {
                self.setVisible(false);
                delete self.tf;
            })
            .setW(80).setH(keyh).setTx(235).setTy(100)
            ;
        this.comps.base.add(done);
        this.children.push(done);
        
        var deletechar = '\uF137';
        var bs = new widgets.PushButton()
            .setFontName('awesome')
            .setText(deletechar).onAction(function() {
                if(self.tf) {
                    self.tf.tc.cursor.deleteChar();
                }
            })
            .setW(40).setH(keyh).setTx(280).setTy(65)
            ;
        this.comps.base.add(bs);
        this.children.push(bs);
        
        
        var space = new widgets.PushButton()
            .setW(120).setH(keyh).setTx(100).setTy(100)
            .setText("space").onAction(function() {
                if(self.tf) {
                    self.tf.insertStringAtCursor(" ");//tc.cursor.deleteChar();
                }
            });
        this.comps.base.add(space);
        this.children.push(space);
        
        var shiftchar = '\uF062';
        var shift = new widgets.PushButton()
            .setFontName('awesome')
            .setText(shiftchar).onAction(function() {
                self.shiftOn = !self.shiftOn;
                if(self.shiftOn) {
                    shift.setFill("#00ffff");
                } else {
                    shift.setFill("#aaee88");
                }
            })
            .setW(40).setH(keyh).setTx(5).setTy(65)
            ;
        this.comps.base.add(shift);
        this.children.push(shift);
        
        

    },
});


var SceneParser = function() {
    
    this.parseChildren = function(core, val, obj) {
        for(var i=0; i<obj.children.length; i++) {
            var ch = obj.children[i];
            var chv = this.parse(core, ch);
            if(chv) val.add(chv);
        }
    }
    
    this.fillProps = function(out, obj) {
        for(var prop in obj) {
           	var setter = "set"+camelize(prop);
            if(prop == "type") continue;
            if(prop == "self") continue;
            if(prop == "children") continue;
            if(prop == "fill") {
                if(out[setter]) {
                    out["set"+camelize(prop)](obj[prop]);
                } else {
                    console.log("WARNING. Setter not found: " + setter + " for type " + obj.type);
                }
                continue;
            }
            if(!out[setter]) {
                console.log("warning. no setter: " + setter);
            } else {
            	   out[setter](obj[prop]);
            }
        }
        //fill in missing props
        if(!obj.left) {
            out.left = obj.tx;
        }
        if(!obj.top) {
            out.top = obj.ty;
        }
        	//console.log(out.type + " " + out.id);
    }
    
    this.findNode = function(id, node) {
        if(node.id && node.id == id) return node;
        if(node.isparent && node.isparent()) {
            for(var i=0; i<node.getChildCount(); i++) {
                var ret = this.findNode(id,node.getChild(i));
                if(ret != null) return ret;
            }
        }
        return null;
    }
    
    this.typeMap = {
        "Group":amino.ProtoGroup,
        "Rect": amino.ProtoRect,
        "PushButton": exports.PushButton,
        "ToggleButton":"createToggleButton",
        "Label":exports.Label,
        "Slider":exports.Slider,
        "ListView":exports.AnchorPanel,//"createListView",
        "Document":amino.ProtoGroup,
        "DynamicGroup":amino.ProtoGroup,
        "AnchorPanel":exports.AnchorPanel,
        "ImageView":exports.ImageView,
        "TextField":exports.Label, //"createTextField",
        "TextArea":exports.Label, //"createTextArea",
    };
    this.parentTypeMap = {
        "Group":amino.ProtoGroup,
        "Document":amino.ProtoGroup,
        "DynamicGroup":amino.ProtoGroup,
        "AnchorPanel":exports.AnchorPanel,
    };
    
    this.parse = function(core, obj) {
	   	var type = this.typeMap[obj.type];
        if(type) {
            console.log("doing type ", obj.type);
            var out = type();
            out.type = obj.type;
            
            if(this.parentTypeMap[obj.type]) {
                this.fillProps(out,obj);
                this.parseChildren(core, out,obj);
            } else {
                this.fillProps(out,obj);
            }
            
            return out;
        }
        console.log("warning. no object for type " + obj.type);
    }
}




exports.SceneParser = SceneParser;
