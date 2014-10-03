console.log("inside of the aminogfx main.js");

var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'./package.json')));
var sgtest = require(binding_path);
console.log('sgtest = ', sgtest);

var amino = require('./src/amino.js');
console.log("fully loaded");

amino.sgtest = sgtest;
exports.start = amino.start;
exports.Group = amino.Group;
exports.Circle = amino.Circle;
exports.Rect = amino.Rect;
exports.input = amino.input;
exports.makeProps = amino.makeProps;
exports.getCore = amino.getCore;
exports.native = amino.native;

exports.ParseRGBString = amino.primitives.ParseRGBString;
