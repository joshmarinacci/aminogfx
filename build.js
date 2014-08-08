/*
a build system is to:

make sure every part has the things it needs to be built. this includes variables, env, tool installation, etc.

use lazy evaluation and dep management to ensure incremental builds are done properly.

perform common tasks with consise descriptions

next steps:
* create a reusable module that encapsulates all of ometa parsing,
if possible. might need to do some scoping?
* create a newerThan function
* convert the rest of the js and java tests. 
* make sure everything works now.



so I can do:
always input, output, options, callback

    var parserfile = "parsers.js";
    var defsfiles = ["core.def", "controls.def"];
    var outjava = 'build/out.java';
    var outjs = 'build/out.js';

    
    function generateCoreJS() {
        if(newerThan(outjs, [parserfile, defsfiles])) {
            var JoshParser = ometa.loadParser(,"JoshParser");
            var core = fs.readFileSync("core.def","utf8");
            var tree = JoshParser.matchAll(core,'top');
            var code = Josh2JS.matchAll([tree],'blocks');
            fs.writeFileSync('build/out.js,code);
        }
    }

    function generateCoreJava() {
        if(newerThan(outjava, [parserfile, defsfiles])) {
            
        }
    }
    
    function compileJavatests() {
        //do this if code changed. uses filestamps to check.
    }
    function runJavatests() {
        //always do this
    }
    javatests depends on generateCoreJava
*/

var jb = require('./bin/joshbuild');

var wrench = require('wrench');
var u = require('util');
var fs = require('fs');
var exec = require('child_process').exec;
require('./bin/ometa.js');

function p(s) { console.log(s); }

var command = process.argv[2];

function Task(fn, dep, name) {
    this.fn = fn;
    this.dep = dep;
    this.name = name;
    this.did = false;
    this.runthis = function(cb) {
        //p("["+this.name+"]" + " running");
        var self = this;
        this.fn(function() {
            self.did = true;
            if(cb) cb();
        });
    };
    
    this.run = function(cb) {
        if(this.did) {
            if(cb) cb();
            return;
        }
        if(dep.length > 0) {
            p("["+this.name+"]" + " doing deps: " + dep);
            var self = this;
            rundeps(dep[0], function() {
                    self.runthis(cb);
            });
        } else {
            this.runthis(cb);
        }
    }
}

function rundeps(dep, cb) {
    tasks[dep].run(function() {
        if(cb) cb();
    });
}

function doExec(cmd, cb) {
    p("[EXEC] " + cmd);
    exec(cmd,function(er,out,err) {
        p(out);
        p(err);
        if(cb) cb();
    });
}

var outdir = "build";

function translateCode(s) {
  var translationError = function(m, i) { 
    console.log("Translation error - please tell Alex about this!"); throw fail 
  };
  
  var tree = BSOMetaJSParser.matchAll(s, "topLevel", undefined, 
      function(m, i) {
          console.log("in failure: " + m + " " + i);
          throw objectThatDelegatesTo(fail, {errorPos: i}) 
      });
  return BSOMetaJSTranslator.match(tree, "trans", undefined, translationError);
}

function parseit(str) {
    eval(translateCode(str));
}

function eq(a,b) {
    if(a != b) throw (a + " != " + b);
}
function p(s) {
    console.log(s);
}

function docs(cb) {
    var parsersjs = fs.readFileSync('src/aminolang/docparser.js','utf8');
    parseit(parsersjs);
    //console.log("doc parser = ", DocParser);
    //var source = fs.readFileSync('src/sg/test.js') + "";
    var source = fs.readFileSync('src/sg/amino.js') + "";
    //console.log(u.inspect(Calc.matchAll('6*(4+3)', 'expr'),false,20));
    var struct = DocParser.matchAll(source,"top");
    console.log(u.inspect(struct2,false,20));
    
    var source2 = fs.readFileSync('src/sg/widgets.js') + "";
    var struct2 = DocParser.matchAll(source2,"top");
    
    for(var name in struct2) {
        struct[name] = struct2[name];
    }
    
    console.log('parsed the code');
    console.log(u.inspect(struct2,false,20));
    var outdir = 'build/docs';
    console.log("making directory " + outdir);
    jb.mkdir(outdir);
    copyFileTo('resources/bootstrap.min.css',outdir);


    console.log("opening "+outdir+"/index.html for writing");
    var stream = fs.createWriteStream(outdir+'/index.html');
    
    function p(s) {
        stream.write(s+'\n');
    }
    
    p("<html>")
    p("<head>");
    p("<title>Amino Documentation</title>");
    p('<link href="bootstrap.min.css" rel="stylesheet" media="screen">');
    p("</head>");

    p("<body>")
    p("<div class='container'>");
    p("<div class='row'><div class='col-lg-12'><h1>Amino Documentation</h1></div></div>");

    p("<div class='row'>");
    
    p("<div class='col-lg-3'><div class='list-group'>");
    for(var cname in struct) {
        var clazz = struct[cname];
        p("<a href='#"+cname+"' class='list-group-item'>"+cname+"</a>");
    }
    p("</div></div>");
    
    p("<div class='col-lg-9'>");
    for(var cname in struct) {
        var clazz = struct[cname];
        p("<h3 id='"+clazz.id+"'>"+clazz.id+"</h3>");
        p("<p class='lead'>"+clazz.desc+"</p>");
        
        p("<dl class='dl-horizontal panel panel-primary'>");
        p("<div class='panel-heading'><h3 class='panel-title'>Properties</h3></div>");
        clazz.props.forEach(function(prop) {
            p("  <dt>"+prop.name+"</dt><dd>"+prop.desc+"</dd>");
        });
        p("</dl>");
        p("<dl class='dl-horizontal panel panel-primary'>");
        p("<div class='panel-heading'><h3 class='panel-title'>Functions</h3></div>");
        clazz.funcs.forEach(function(func) {
            p("  <dt>"+func.name+"</dt><dd>"+func.desc+"</dd>");
        });
        p("</dl>");
    }
    p("</div></div>");
    p("</div></body></html>");
    stream.end();
    console.log("done writing");
}


function copyFileTo(file, dir) {
    var filename = file.substring(file.lastIndexOf('/'));
    var temp = fs.readFileSync(file);
    var outpath = dir+filename;
    console.log("copying to " + outpath);
    fs.writeFileSync(outpath,temp);
    
}


function desktop(cb) {
    var out = outdir + "/desktop";
    jb.mkdir(out);
    console.log("copying files to " + out);
    
    var src = "src/sg/";
    //src files
    copyFileTo(src+"amino.js",out);
    copyFileTo(src+"aminoinput.js",out);
    copyFileTo("build/Release/aminonative.node",out);
    copyFileTo(src+"widgets.js",out);
    //copyFileTo("src/jscommon/textcontrol.js",out);
    copyFileTo("resources/font.png",out);
    copyFileTo("resources/font.json",out);
    jb.mkdir(out+"/fonts");
    jb.copyAllTo("fonts",out+"/fonts");
    copyFileTo("fonts/SourceSansPro-Regular.ttf",out+"/fonts");
    copyFileTo("fonts/fontawesome-webfont.ttf",out+"/fonts");
    jb.mkdir(out+"/shaders");
    jb.copyAllTo("shaders",out+"/shaders");
}

function canvas(cb) {
    var out = outdir + "/canvas";
    jb.mkdir(out);
    console.log("copying files to " + out);
    
    var src = "src/sg/";
    //src files
    copyFileTo(src+"amino.js",out);
    copyFileTo(src+"aminoinput.js",out);
    copyFileTo(src+"canvasamino.js",out);
    copyFileTo(src+"widgets.js",out);
    //copyFileTo("src/jscommon/textcontrol.js",out);
}
function androidnative(cb) {
    //copy amino.js and out.js to build dir
    //copy font2.png and other resources
    var out = outdir+"/"+"android/native/devicephone/";
    jb.mkdir(out);
    //native addon
    copyFileTo("aminonative.node",out);
    //prebuilts
    copyFileTo("prebuilt/binaries/libv8.so",out);
    copyFileTo("prebuilt/binaries/libfreetype.so",out);
    copyFileTo("prebuilt/binaries/node",out);
    doExec("adb push " + out + " /data/phonetest");
}
function androidjs(cb) {
    //copy amino.js and out.js to build dir
    //copy font2.png and other resources
    var out = outdir+"/"+"android/js/devicephone/";
    jb.mkdir(out);
    var src = "src/sg/";
    //src files
    copyFileTo(src+"amino.js",out);
    copyFileTo(src+"aminoinput.js",out);
    copyFileTo(src+"widgets.js",out);
    //resource files
    
    //various demos and tests
    copyFileTo("tests/runit.sh",out);
    jb.copyAllTo("tests/phone",out);
    var shaders = out + "/shaders";
    jb.mkdir(shaders)
    jb.copyAllTo("shaders/",shaders);
    var fonts = out + "/fonts";
    jb.mkdir(fonts);
    jb.copyAllTo("fonts/",fonts);
    
    copyFileTo("tests/perf/drag1.js",out);
    copyFileTo("tests/perf/textspeed.js",out);
    copyFileTo("tests/perf/shaderswitch.js",out);
    
    copyFileTo("node_modules/Faker/Faker.js",out);
    copyFileTo("node_modules/moment/moment.js",out);
    copyFileTo("tests/photos/photo1.jpg",out);
    
    
    var dirs = fs.readdirSync(out);
    console.log(dirs);
    doExec("adb push " + out + " /data/phonetest");
}

function android(cb) {
    console.log("copying files to the device attached with ADB");
    //copy amino.js and out.js to build dir
    //copy font2.png and other resources
//    var out = outdir+"/"+"devicephone/";
//    jb.mkdir(out);
}




function help(cb) {
    p("Available commands");
    var keys = Object.keys(tasks);
    for(var i in keys) {
        p("   " + keys[i]);
    }
}

tasks = {
    help:        new Task(help,       [],            "Help Info"),
  /*
    java2dgen:      new Task(java2dgen,      [],                      "Generate Java2D Core"),
    java2dcompile:  new Task(java2dcompile,  ["java2dgen"],           "Compile Java2D Core"),
    java2dtest:     new Task(java2dtest,     ["java2dcompile"],       "Compile and Run Java2D tests"),
    java2dtest2:    new Task(java2dtest2,    ["java2dcompile"],       "Compile and Run Java2D tests, 2"),
    
    joglgen:        new Task(joglgen,        [],                      "Generate JOGL Core"),
    joglcompile:    new Task(joglcompile,    ["joglgen"],             "Compile JOGL Core"),
    jogltest:       new Task(jogltest,       ["joglcompile"],         "Test JOGL"),
    
    jscanvasgen:    new Task(jscanvasgen,    [],                      "Generate JavaScript Canvas Core"),
    jscanvastest:   new Task(jscanvastest,   ["jscanvasgen"],         "Test JS Canvas"),

    cppgen:         new Task(cppgen,         [],                      "Generate C++ Core"),
    
    langtest:       new Task(langtest,       [],                      "Test AminoLang itself"),
    */
    
    desktop:       new Task(desktop,        [],          "Amino for Desktop"),
    canvas:        new Task(canvas,         [],          "Amino for HTML Canvas"),
    androidnative: new Task(androidnative,  [],          "Amino for headless Android Device"),
    androidjs:     new Task(androidjs,      [],          "Amino for headless Android Device"),
    android:   new Task(android,            ["androidnative", "androidjs"],          "Amino for headless Android Device"),
    docs:      new Task(docs,               [],          "Generate API Docs"),
}

if(!command) {
    command = "help";
}
rundeps(command);
