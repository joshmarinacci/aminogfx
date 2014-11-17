var fs = require('fs');
var Shader = {
    compileVertShader: function(text) {
        var stat;
        var vertShader = this.GL.glCreateShader(this.GL.GL_VERTEX_SHADER);
        this.GL.glShaderSource(vertShader, 1, text, null);
        this.GL.glCompileShader(vertShader);
        var stat = this.GL.glGetShaderiv(vertShader, this.GL.GL_COMPILE_STATUS);
        if (!stat) {
            console.log("Error: vertex shader did not compile!\n");
            process.exit(1);
        }
        return vertShader;
    },
    compileFragShader:function(text) {
        var stat;
        var vertShader = this.GL.glCreateShader(this.GL.GL_FRAGMENT_SHADER);
        this.GL.glShaderSource(vertShader, 1, text, null);
        this.GL.glCompileShader(vertShader);
        var stat = this.GL.glGetShaderiv(vertShader, this.GL.GL_COMPILE_STATUS);
        if (!stat) {
            console.log("Error: fragment shader did not compile!\n");
            process.exit(1);
        }
        return vertShader;
    },
    compileProgram:function(shader) {
        var program = this.GL.glCreateProgram();
        if(!shader.frag) throw Error("missing shader.frag");
        if(!shader.vert) throw Error("missing shader.vert");
        this.GL.glAttachShader(program, shader.vert);
        this.GL.glAttachShader(program, shader.frag);
        this.GL.glLinkProgram(program);
        var stat = this.GL.glGetProgramiv(program, this.GL.GL_LINK_STATUS);
        if (!stat) {
            var log = this.GL.glGetProgramInfoLog(program, 1000);//, &len, log);
            console.log("error linking ",log);
            process.exit(1);
        }
        return program;
    },

    build: function() {
        this.vert = this.compileVertShader(this.vertText);
        this.frag = this.compileFragShader(this.fragText);
        this.prog = this.compileProgram(this);
    },

    useProgram: function() {
        this.GL.glUseProgram(this.prog);
    },
    attribs:{},
    uniforms:{},

    locateAttrib: function(name) {
        this.attribs[name] = this.GL.glGetAttribLocation(this.prog, name);
        if(this.attribs[name] == -1) {
            console.log("WARNING. got -1 for location of ", name);
        }
    },

    locateUniform: function(name) {
        this.uniforms[name] = this.GL.glGetUniformLocation(this.prog, name);
        if(this.uniforms[name] == -1) {
            console.log("WARNING. got -1 for location of ", name);
        }
    }

}



exports.init = function(sgtest) {
    var cshader = Object.create(Shader);
    cshader.GL = sgtest;
    cshader.vertText = fs.readFileSync("shaders/color.vert").toString();
    cshader.fragText = fs.readFileSync("shaders/color.frag").toString();
    cshader.build();
    cshader.useProgram();
    cshader.locateAttrib('pos');
    cshader.locateUniform('modelviewProjection');
    cshader.locateUniform('trans');
    cshader.locateUniform('opacity');
    cshader.locateAttrib('color');
    sgtest.initColorShader(cshader.prog,
        cshader.uniforms.modelviewProjection,
        cshader.uniforms.trans,
        cshader.uniforms.opacity,
        cshader.attribs.pos,
        cshader.attribs.color);


    var tshader = Object.create(Shader);
    tshader.GL = sgtest;
    tshader.vertText = fs.readFileSync("shaders/texture.vert").toString();
    tshader.fragText = fs.readFileSync("shaders/texture.frag").toString();
    tshader.build();
    tshader.useProgram();
    tshader.locateUniform('modelviewProjection');
    tshader.locateUniform('trans');
    tshader.locateUniform('opacity');
    tshader.locateAttrib('pos');
    tshader.locateAttrib('texcoords');
    tshader.locateAttrib('tex');


    sgtest.initTextureShader(tshader.prog,
        tshader.uniforms.modelviewProjection,
        tshader.uniforms.trans,
        tshader.uniforms.opacity,
        tshader.attribs.pos,
        tshader.attribs.texcoords,
        tshader.attribs.tex);
}
