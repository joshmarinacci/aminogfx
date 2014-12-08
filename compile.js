var ometajs = require('ometa-js');

function translateCode(s) {
    var parseError = function(source) {
        return function(matchingError, index) {
            var line = 1,
                column = 0,
                i = 0,
                char,
                start;
            for(; i < index; i++) {
                char = source.charAt(i);
                column++;
                if(char == '\n') {
                    line++;
                    column = 0;
                }
            }
            console.error('Error on line ' + line + ', column ' + column);
            /*
            start = Math.max(0, index - 20);
            console.error('Error around: ' + source.substring(start, Math.min(source.length, start + 40)));
            console.error('Error around: ' + source.substring(index - 2, Math.min(source.length, index + 2)));
            */
            throw matchingError;
        }
    };
    var tree = ometajs.BSOMetaJSParser.matchAll(s, "topLevel", undefined, parseError(s));
    return ometajs.BSOMetaJSTranslator.match(tree, "trans");
}


var fs = require('fs');
//console.log('compiling',process.argv[2]);
var text = fs.readFileSync(process.argv[2]).toString();
var out = translateCode(text);
console.log("var OMeta = require('ometa-js').core;");
console.log(out);
