#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <unistd.h>
#include "shaders.h"

Shader::Shader() {
    //printf("creating a shader\n");
}

int Shader::compileVertShader(const char* text) {
    GLint stat;
    GLuint vertShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertShader, 1, (const char **) &text, NULL);
    glCompileShader(vertShader);
    glGetShaderiv(vertShader, GL_COMPILE_STATUS, &stat);
    if (!stat) {
        printf("Error: vertex shader did not compile!\n");
        //exit(1);
    }
    return vertShader;
}

int Shader::compileFragShader(const char* text) {
    GLint stat;
    GLuint fragShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragShader, 1, (const char **) &text, NULL);
    glCompileShader(fragShader);
    glGetShaderiv(fragShader, GL_COMPILE_STATUS, &stat);
    if (!stat) {
        printf("Error: fragment shader did not compile!\n");
        //exit(1);
    }
    return fragShader;
}

int Shader::compileProgram(int vertShader, int fragShader) {
    GLuint program = glCreateProgram();
    GLint stat;
    glAttachShader(program, vertShader);
    glAttachShader(program, fragShader);
    glLinkProgram(program);
    
    glGetProgramiv(program, GL_LINK_STATUS, &stat);
    if (!stat) {
        char log[1000];
        GLsizei len;
        glGetProgramInfoLog(program, 1000, &len, log);
        printf("Error: linking:\n%s\n", log);
        //exit(1);
    }
    return program;
}


/* ==== Color Shader impl === */

ColorShader::ColorShader() {
    printf("compiling the color shader\n");
      
   static const char *vertShaderText =
   #ifdef MAC
     "#version 110\n"
   #else
      "#version 100\n"
   #endif
      "uniform mat4 modelviewProjection;\n"
      "uniform mat4 trans;\n"
      "uniform float opacity;\n"
      "attribute vec4 pos;\n"
      "attribute vec4 color;\n"
      "varying vec4 v_color;\n"
      "void main() {\n"
      "   gl_Position = modelviewProjection * trans * pos;\n"
      "   v_color = vec4(color.r,color.g,color.b,opacity)\n;"
      "}\n";

   static const char *fragShaderText =
   #ifdef MAC
     "#version 110\n"
   #else
      "#version 100\n"
      "precision mediump float;\n"
   #endif
      "varying vec4 v_color;\n"
      "void main() {\n"
      "   gl_FragColor = v_color;\n"
      "}\n";
      
   GLuint vert = compileVertShader(vertShaderText);
   GLuint frag = compileFragShader(fragShaderText);
   prog = compileProgram(vert,frag);
   
   glUseProgram(prog);
   attr_pos   = glGetAttribLocation(prog, "pos");
   attr_color = glGetAttribLocation(prog, "color");
   u_opacity = glGetUniformLocation(prog, "opacity");
   u_matrix   = glGetUniformLocation(prog, "modelviewProjection");
   u_trans    = glGetUniformLocation(prog, "trans");
}   

void ColorShader::apply(GLfloat modelView[16], GLfloat trans[16], GLfloat verts[][2], GLfloat colors[][3], GLfloat opacity) {
    glUseProgram(prog);
    glUniformMatrix4fv(u_matrix, 1, GL_FALSE, modelView);
    glUniformMatrix4fv(u_trans,  1, GL_FALSE, trans);
    glUniform1f(u_opacity, opacity);
    
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glVertexAttribPointer(attr_pos,   2, GL_FLOAT, GL_FALSE, 0, verts);
    glVertexAttribPointer(attr_color, 3, GL_FLOAT, GL_FALSE, 0, colors);
    glEnableVertexAttribArray(attr_pos);
    glEnableVertexAttribArray(attr_color);
    
    glDrawArrays(GL_TRIANGLES, 0, 6);
    
    glDisableVertexAttribArray(attr_pos);
    glDisableVertexAttribArray(attr_color);
}    




TextureShader::TextureShader() {
    printf("compiling the texture shader\n");
    static const char *vertShaderText =
  #ifdef MAC
     "#version 110\n"
   #else
      "#version 100\n"
   #endif
      "uniform mat4 modelviewProjection;\n"
      "uniform mat4 trans;\n"
      "uniform float opacity;\n"      
      "attribute vec4 pos;\n"
      "attribute vec2 texcoords;\n"
      "varying vec2 uv;\n"
      "varying float outopacity;\n"
      "void main() {\n"
      "   gl_Position = modelviewProjection * trans * pos;\n"
      "   outopacity = opacity;\n"
      "   uv = texcoords;\n"
      "}\n";
      
    static const char *fragShaderText =
   #ifdef MAC
     "#version 110\n"
   #else
      "#version 100\n"
      "precision mediump float;\n"
   #endif
     "varying vec2 uv;\n"
     "varying float outopacity;\n"
     "uniform sampler2D tex;\n"
     "void main() {\n"
	 "   gl_FragColor = texture2D(tex,uv);\n"
	// "   vec4 col = texture2D(tex,uv);\n"
//     "   gl_FragColor = vec4(col.r,col.g,col.b,col.a*outopacity);\n"
     "}\n";
      
    GLuint vert = compileVertShader(vertShaderText);
    GLuint frag = compileFragShader(fragShaderText);
    prog = compileProgram(vert,frag);
    
    glUseProgram(prog);
    attr_pos   = glGetAttribLocation(prog, "pos");
    attr_texcoords = glGetAttribLocation(prog, "texcoords");
    attr_tex = glGetAttribLocation(prog, "tex");
    u_matrix   = glGetUniformLocation(prog, "modelviewProjection");
    u_trans    = glGetUniformLocation(prog, "trans");
    u_opacity  = glGetUniformLocation(prog, "opacity");
    
    int w;
    int h;
    GLubyte image_data[12] = {
        255,0  ,255,
        255,255,255,
        0  ,255,255,
        0  ,0  ,255
    };
    // Generate the OpenGL texture object
    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 2, 2, 0, GL_RGB, GL_UNSIGNED_BYTE, image_data);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    texID = texture;
}

void TextureShader::apply(GLfloat modelView[16], GLfloat trans[16], GLfloat verts[][2], GLfloat texcoords[][2], int texid) {
    glEnable(GL_BLEND);
    glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
    glUseProgram(prog);
    
    glUniformMatrix4fv(u_matrix, 1, GL_FALSE, modelView);
    glUniformMatrix4fv(u_trans,  1, GL_FALSE, trans);
    glUniform1i(attr_tex, 0);
    

    glVertexAttribPointer(attr_texcoords, 2, GL_FLOAT, GL_FALSE, 0, texcoords);
    glEnableVertexAttribArray(attr_texcoords);

    glVertexAttribPointer(attr_pos,   2, GL_FLOAT, GL_FALSE, 0, verts);
    glEnableVertexAttribArray(attr_pos);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, texid);
    glDrawArrays(GL_TRIANGLES, 0, 6);
    
    glDisableVertexAttribArray(attr_pos);
    glDisableVertexAttribArray(attr_texcoords);
    glDisable(GL_BLEND);
}    

