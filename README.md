
IMPORTANT UPDATE
=========

I've done a major refactoring which will make Amino easier to maintain and, eventually, better performance and portability.
Part of this work involved moving the platform specific parts to their own node modules. You should no longer install `aminogfx`
directly. Instead, install the appropriate platform specific module. Currently there is one for GL and one for Canvas.  To
install the canvas version do:

```
   npm install aminogfx-canvas
```

Then require aminogfx-canvas in your own node code like this:


```
var amino = require('aminogfx-canvas');
amino.setCanvas(document.getElementById("mycanvas"));
amino.start(function(core,stage) {
  var rect = new amino.Rect()
             .w(100).h(100)
             .fill("#00ff00");
  stage.setRoot(rect);
});
```

and use browserify to bundle it up for the browser.



To install the OpenGl version for desktop Mac and RaspberryPi, do:

```
   npm install aminogfx-gl
```

That should compile the native bits and install the aminogfx dependencies automatically. Then require in your
node code like this:

```
var amino = require('aminogfx-canvas');
amino.start(function(core,stage) {
  var rect = new amino.Rect()
             .w(100).h(100)
             .fill("#00ff00");
  stage.setRoot(rect);
});
```





Amino Graphics library for NodeJS on Raspberry Pi
========

Amino is a simple but fast api for doing animated graphics on the RaspberryPi from JavaScript (NodeJS). You create groups of shapes, text, and images as a tree of JavaScript objects, similar to the DOM in a web browser, but these objects are backed by blazing fast OpenGL on your Raspberry Pi.  

Amino runs in console mode, so there is no XWindows to get in the way and slow things down. Since Amino is a NodeJS module, you can combine it with other great NodeJS modules out there to parse RSS feeds, connect to Twitter, or control a robot.

Amino on the RaspberryPi can be used to make data dashboards, RSS viewers, rotating 3D geometry, spinning globes, and pretty much anything else you can imagine.

Amino also runs on Mac, Linux, and rooted Android devices, but it’s biggest advantage over other toolkits is good Raspberry Pi support.

Amino use simple shapes control with property chains. To create an animated red rectangle do:
```
     var rect = new amino.Rect().w(100).h(100).fill(“#ff0000”);
     rect.x.anim().to(100).start();

```

The full version, with Amino setup, is

```
var amino = require(‘amino');
amino.start(function(core,stage) {
     var root = new amino.Group();
     stage.setRoot(group);

     var rect = new amino.Rect().w(100).h(100).fill(“#ff0000”);
     group.add(rect);

     rect.x.anim().to(100).start();
});
```


## Shape Primitives

Amino uses only a few primitive objects: Group, Rect, Polygon, Text, and ImageView.  Everything else is created by combining these objects.  Every object has properties which are used to set various attributes of that object. The properties are accessed by a property function, similar to JQuery.  

To _set_ the value of width of a rectangle:

```
rect.w(100);

```
to _get_ the width of a rectangle:

```
console.log(rect.w());
```


## Property Animation

Using the property _without_ the parenthesis (meaning not using it as a function) lets you do other things with the property.  To animate the x property of a rectangle, do:

```
//make x go from -100 to 100 over 5 seconds, 3 times
rect.x.anim().from(-100).to(100).dur(5000).loop(3).start();
```

The `from`, `dir`, and `loop` parts are optional. You only need to provide the `to` value.

To call a function when the animation is done:

```
rect.x.anim().to(100).then(function() {
     console.log(“the animation is done”);
});
```

## Property Binding
To watch a property for changes, use the watch function:

```
rect.x.watch(function(val, prop, obj) {
     console.log(“the new value is “,val);
});
```

You can also bind properties so that one will always have the value of the other:

```
circle.radius.bindto(rect.x);
```

The next time rect.x changes the circle.radius property will be updated as well.  

You can optionally pass in a modifier function to set the value based on an equation. If you want the circle radius to always be 10 more than the rect.x, do:

```
circle.radius.bindto(rect.x, function(val) {
     return val + 10;
});
```

You can also use modifier functions to convert types or format strings. For example, to make a label which shows the value of rect.x:

```
label.text.bindto(rect.x, function(val) {
     return “Rect.x is currently “ + val;
});
```


The combination of simple objects with bindable properties is very powerful.  To make a large text label that spins in 3D, do this:

var text = new Text().text(‘Welcome To Your Doom!’).fill(“#ffffff”);

## Styling

Other notes:
All color properties accept CSS style hex colors
set color to green:

```
rect.fill(“#00ff00”);
```

You can control multiple nodes at once with CSS style selectors:

```
// set the width of all Rects to 50.
group.find(‘Rect’).w(50);
```

All nodes have optional IDs.

```
set the width of the cat rectangle to 50.
var rect = new Rect().id(‘cat’);
group.add(rect);
group.find(‘#cat’).w(50);
```

Nodes have optional classes.

```
//style all pet nodes
group.add(new Rect().addClass(‘pet’));
group.add(new Rect().addClass(‘pet’));
group.find(‘.pet’).w(50).h(50).fill(‘#0000ff’);
```


## Setup

To run Amino, check out the source, build for your platform, then run one of the demos.

First, you'll need to have libpng and libjpeg installed for your platform. On Raspberry Pi do this:

```
sudo apt-get install libjpeg8-dev
sudo apt-get install libpng-dev
```

Eventually we'll get rid of these dependencies.

```
git clone git@github.com:joshmarinacci/aminogfx.git
cd aminogfx
npm install
```

Now it should work. Try this

```
node demos/circle.js
```


## Using 3D

Since Amino uses a full OpenGL ES scene you can rotate anything in 3D by putting it inside a Group and setting the rx, ry, or rz properties.

Text is currently limited to certain fixed sizes: [values].

You can create 2d geometry with a polygon.

spiral

you can create 3d geometry with a polygon, setting dimension to 3.

trig blob

## Utility Classes

You can create a see through 3D globe using the Globe utility class. It has outlines for all of the countries of the world.

```
var globe = new Globe()
     .sx(5).sy(5) //set the scale to 5
     .x(stage.getW()/2) //center x
     .y(stage.getH()/2) //center y

//spin completely every 10 seconds
globe.rz.anim().from(0).to(360).dur(10*1000);
```

You can create a Particle sim using the Particle utility class.  The math is done entirely on the GPU, so your equations need to use only constants or the time variable.

You can use custom OpenGL ES 2.0 code with the GLNode utility class. This is how the Particle class is built.


## Fonts and Text

Amino is bundled with Source Sans Pro and Font Awesome. Source Sans Pro is the default font. You can set the font name on a Text node with:

```
text.fontname(‘source’).text(“My Name is Foo”);
text.fontname(‘awesome’).text(\u1268); //the symbol for ??
```



new repo will be aminogfx

AminoGFX  amino.graphics?

build
src
resources
build.js
demos
     slideshow
     rssheadlines
     globe
     3dgeometry
     particles
tests
     everything/
