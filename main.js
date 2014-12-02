console.log("inside of the aminogfx main.js");

var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'./package.json')));
var sgtest = require(binding_path);
console.log('sgtest = ', sgtest);

var OS = "KLAATU";
if(process.arch == 'arm') {
    OS = "RPI";
}
if(process.platform == "darwin") {
    OS = "MAC";
}


var amino = require('./src/amino.js');
amino.OS = OS;
console.log("fully loaded");

amino.sgtest = sgtest;
exports.start = amino.start;
exports.Group = amino.Group;
exports.Circle = amino.Circle;
exports.Rect = amino.Rect;
exports.Polygon = amino.Polygon;
exports.Text = amino.Text;
exports.input = amino.input;
amino.input.init(OS);



exports.makeProps = amino.makeProps;
exports.getCore = amino.getCore;
exports.native = amino.native;
exports.PixelView = amino.primitives.PixelView;
exports.ImageView = amino.primitives.ImageView;
exports.RichTextView = amino.primitives.RichTextView;
exports.registerFont = amino.registerFont;

exports.ParseRGBString = amino.primitives.ParseRGBString;
exports.PureImageView = amino.primitives.PureImageView;
