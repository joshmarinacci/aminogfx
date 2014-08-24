
var wrench = require('wrench');
var u = require('util');
var fs = require('fs');
var exec = require('child_process').exec;

function mkdir(dir) {
    if(!fs.existsSync(dir)) {
        wrench.mkdirSyncRecursive(dir);
    }
}

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


function eq(a,b) {
    if(a != b) throw (a + " != " + b);
}
function p(s) {
    console.log(s);
}



function copyFileTo(file, dir) {
    var filename = file.substring(file.lastIndexOf('/'));
    var temp = fs.readFileSync(file);
    var outpath = dir+filename;
    console.log("copying to " + outpath);
    fs.writeFileSync(outpath,temp);

}

copyAllTo = function(path, dir) {
    var files = fs.readdirSync(path);
    files.forEach(function(file) {
        var filename = path + '/' + file;//file.substring(file.lastIndexOf('/'));
        var temp = fs.readFileSync(filename);
        var outpath = dir+'/'+file;
        console.log('copying ' + filename + ' to ' + outpath);
        fs.writeFileSync(outpath,temp);
    });
}

function desktop(cb) {
    var out = outdir + "/desktop";
    mkdir(out);
    console.log("copying files to " + out);

    var src = "src/";
    //src files
    copyFileTo(src+"amino.js",out);
    copyFileTo(src+"aminoinput.js",out);
    copyFileTo(src+"primitives.js",out);
    copyFileTo("build/Release/aminonative.node",out);
    copyFileTo(src+"widgets.js",out);
    //copyFileTo("src/jscommon/textcontrol.js",out);
    mkdir(out+"/fonts");
    copyAllTo("resources",out+"/fonts");
    /*
    copyFileTo("resources/SourceSansPro-Regular.ttf",out+"/fonts");
    copyFileTo("resources/fontawesome-webfont.ttf",out+"/fonts");
    */
    mkdir(out+"/shaders");
    copyAllTo("shaders",out+"/shaders");
}

function canvas(cb) {
    var out = outdir + "/canvas";
    mkdir(out);
    console.log("copying files to " + out);

    var src = "src/";
    //src files
    copyFileTo(src+"amino.js",out);
    copyFileTo(src+"aminoinput.js",out);
    copyFileTo(src+"primitives.js",out);
    copyFileTo(src+"canvasamino.js",out);
    copyFileTo(src+"index.html",out);
    //copyFileTo("src/jscommon/textcontrol.js",out);
}
function androidnative(cb) {
    //copy amino.js and out.js to build dir
    //copy font2.png and other resources
    var out = outdir+"/"+"android/native/devicephone/";
    mkdir(out);
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
    mkdir(out);
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
    mkdir(shaders)
    jb.copyAllTo("shaders/",shaders);
    var fonts = out + "/fonts";
    mkdir(fonts);
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
//    mkdir(out);
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
}

if(!command) {
    command = "help";
}
rundeps(command);
