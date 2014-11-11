#include "SimpleRenderer.h"
#include <node_buffer.h>


SimpleRenderer::SimpleRenderer() {
    modelViewChanged = false;
}
void SimpleRenderer::startRender(AminoNode* root) {
    GLContext* c = new GLContext();
    this->render(c,root);
//    printf("shader count = %d\n",c->shadercount);
//    printf("shader dupe count = %d\n",c->shaderDupCount);
//    printf("texture dupe count = %d\n",c->texDupCount);

}
void SimpleRenderer::render(GLContext* c, AminoNode* root) {
    if(root == NULL) {
        printf("WARNING. NULL NODE!\n");
        return;
    }


    //skip non-visible nodes
    if(root->visible != 1) return;

    c->save();
    c->translate(root->tx,root->ty);
    c->scale(root->scalex,root->scaley);
    c->rotate(root->rotatex,root->rotatey,root->rotatez);

    switch(root->type) {
    case GROUP:
        this->drawGroup(c,(Group*)root);
        break;
    case RECT:
        this->drawRect(c,(Rect*)root);
        break;
    case POLY:
        this->drawPoly(c,(PolyNode*)root);
        break;
    case TEXT:
        this->drawText(c,(TextNode*)root);
        break;
    case GLNODE:
        this->drawGLNode(c, (GLNode*)root);
        break;
    }


    c->restore();
}

void colorShaderApply(GLContext *ctx, ColorShader* shader, GLfloat modelView[16], GLfloat verts[][2], GLfloat colors[][3], GLfloat opacity) {
    ctx->useProgram(shader->prog);
    glUniformMatrix4fv(shader->u_matrix, 1, GL_FALSE, modelView);
    glUniformMatrix4fv(shader->u_trans,  1, GL_FALSE, ctx->globaltx);
    glUniform1f(shader->u_opacity, opacity);

    if(opacity != 1.0) {
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    }

    glVertexAttribPointer(shader->attr_pos,   2, GL_FLOAT, GL_FALSE, 0, verts);
    glVertexAttribPointer(shader->attr_color, 3, GL_FLOAT, GL_FALSE, 0, colors);
    glEnableVertexAttribArray(shader->attr_pos);
    glEnableVertexAttribArray(shader->attr_color);

    glDrawArrays(GL_TRIANGLES, 0, 6);

    glDisableVertexAttribArray(shader->attr_pos);
    glDisableVertexAttribArray(shader->attr_color);
}

void textureShaderApply(GLContext *ctx, TextureShader* shader, GLfloat modelView[16], GLfloat verts[][2], GLfloat texcoords[][2], int texid, GLfloat opacity) {
    //void TextureShader::apply(GLfloat modelView[16], GLfloat trans[16], GLfloat verts[][2], GLfloat texcoords[][2], int texid) {
    //        textureShaderApply(c,textureShader, modelView, verts, texcoords, rect->texid);

    printf("doing texture shader apply %d opacity = %f\n",texid, opacity);

    ctx->useProgram(shader->prog);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    glUniformMatrix4fv(shader->u_matrix, 1, GL_FALSE, modelView);
    glUniformMatrix4fv(shader->u_trans,  1, GL_FALSE, ctx->globaltx);
    glUniform1i(shader->attr_tex, 0);
    glUniform1f(shader->u_opacity, opacity);



    glVertexAttribPointer(shader->attr_texcoords, 2, GL_FLOAT, GL_FALSE, 0, texcoords);
    glEnableVertexAttribArray(shader->attr_texcoords);

    glVertexAttribPointer(shader->attr_pos,   2, GL_FLOAT, GL_FALSE, 0, verts);
    glEnableVertexAttribArray(shader->attr_pos);
    glActiveTexture(GL_TEXTURE0);

    ctx->bindTexture(texid );
    //glBindTexture(GL_TEXTURE_2D, texid);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    glDisableVertexAttribArray(shader->attr_pos);
    glDisableVertexAttribArray(shader->attr_texcoords);
    glDisable(GL_BLEND);
}

void SimpleRenderer::drawGroup(GLContext* c, Group* group) {
    if(group->cliprect == 1) {
        //turn on stenciling
        glDepthMask(GL_FALSE);
        glEnable(GL_STENCIL_TEST);
        //clear the buffers

        //setup the stencil
        glStencilFunc(GL_ALWAYS, 0x1, 0xFF);
        glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);
        glStencilMask(0xFF);
        glColorMask( GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE );
        glDepthMask( GL_FALSE );
        glClear(GL_STENCIL_BUFFER_BIT | GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        //draw the stencil
        float x = 0;
        float y = 0;
        float x2 = group->w;
        float y2 = group->h;
        GLfloat verts[6][2];
        verts[0][0] = x;
        verts[0][1] = y;
        verts[1][0] = x2;
        verts[1][1] = y;
        verts[2][0] = x2;
        verts[2][1] = y2;

        verts[3][0] = x2;
        verts[3][1] = y2;
        verts[4][0] = x;
        verts[4][1] = y2;
        verts[5][0] = x;
        verts[5][1] = y;
        GLfloat colors[6][3];
        for(int i=0; i<6; i++) {
            for(int j=0; j<3; j++) {
                colors[i][j] = 1.0;
            }
        }
        colorShaderApply(c,colorShader, modelView, verts, colors, 1.0);

        //set function to draw pixels where the buffer is equal to 1
        glStencilFunc(GL_EQUAL, 0x1, 0xFF);
        glStencilMask(0x00);
        //turn color buffer drawing back on
        glColorMask(GL_TRUE,GL_TRUE,GL_TRUE,GL_TRUE);

    }
    for(std::size_t i=0; i<group->children.size(); i++) {
        this->render(c,group->children[i]);
    }
    if(group->cliprect == 1) {
        glDisable(GL_STENCIL_TEST);
    }
}

void SimpleRenderer::drawPoly(GLContext* ctx, PolyNode* poly) {
    int len = poly->geometry->size();
    int dim = poly->dimension;
    GLfloat verts[len][dim];// = malloc(sizeof(GLfloat[2])*len);
    for(int i=0; i<len/dim; i++) {
        verts[i][0] = poly->geometry->at(i*dim);
        if(dim >=2) {
            verts[i][1] = poly->geometry->at(i*dim+1);
        }
        if(dim >=3) {
            verts[i][2] = poly->geometry->at(i*dim+2);
        }
    }
    GLfloat colors[len][3];
    for(int i=0; i<len/dim; i++) {
        colors[i][0] = poly->r;
        colors[i][1] = poly->g;
        colors[i][2] = poly->b;
    }

    ctx->useProgram(colorShader->prog);
    glUniformMatrix4fv(colorShader->u_matrix, 1, GL_FALSE, modelView);
    glUniformMatrix4fv(colorShader->u_trans,  1, GL_FALSE, ctx->globaltx);
    glUniform1f(colorShader->u_opacity, poly->opacity);

    if(poly->opacity != 1.0) {
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    }

    if(dim == 2) {
        glVertexAttribPointer(colorShader->attr_pos,   2, GL_FLOAT, GL_FALSE, 0, verts);
    }
    if(dim == 3) {
        glVertexAttribPointer(colorShader->attr_pos,   3, GL_FLOAT, GL_FALSE, 0, verts);
    }
    glVertexAttribPointer(colorShader->attr_color, 3, GL_FLOAT, GL_FALSE, 0, colors);
    glEnableVertexAttribArray(colorShader->attr_pos);
    glEnableVertexAttribArray(colorShader->attr_color);

    if(poly->filled == 1) {
        glDrawArrays(GL_TRIANGLE_FAN, 0, len/dim);
    } else {
        glDrawArrays(GL_LINE_LOOP, 0, len/dim);
    }

    glDisableVertexAttribArray(colorShader->attr_pos);
    glDisableVertexAttribArray(colorShader->attr_color);
}
void SimpleRenderer::drawRect(GLContext* c, Rect* rect) {
    c->save();
    float x =  rect->x;
    float y =  rect->y;
    float x2 = rect->x+rect->w;
    float y2 = rect->y+rect->h;

    GLfloat verts[6][2];
    verts[0][0] = x;
    verts[0][1] = y;
    verts[1][0] = x2;
    verts[1][1] = y;
    verts[2][0] = x2;
    verts[2][1] = y2;

    verts[3][0] = x2;
    verts[3][1] = y2;
    verts[4][0] = x;
    verts[4][1] = y2;
    verts[5][0] = x;
    verts[5][1] = y;

    GLfloat colors[6][3];

    for(int i=0; i<6; i++) {
        for(int j=0; j<3; j++) {
            colors[i][j] = 0.5;
            if(j==0) colors[i][j] = rect->r;
            if(j==1) colors[i][j] = rect->g;
            if(j==2) colors[i][j] = rect->b;
        }
    }

    if(rect->texid != INVALID) {
        GLfloat texcoords[6][2];
        float tx  = rect->left;
        float ty2 = rect->bottom;//1;
        float tx2 = rect->right;//1;
        float ty  = rect->top;//0;
        texcoords[0][0] = tx;    texcoords[0][1] = ty;
        texcoords[1][0] = tx2;   texcoords[1][1] = ty;
        texcoords[2][0] = tx2;   texcoords[2][1] = ty2;

        texcoords[3][0] = tx2;   texcoords[3][1] = ty2;
        texcoords[4][0] = tx;    texcoords[4][1] = ty2;
        texcoords[5][0] = tx;    texcoords[5][1] = ty;
        textureShaderApply(c,textureShader, modelView, verts, texcoords, rect->texid, rect->opacity);
    } else {
        colorShaderApply(c,colorShader, modelView, verts, colors, rect->opacity);
    }
    c->restore();
}

int te = 0;

void SimpleRenderer::drawText(GLContext* c, TextNode* text) {
    if(fontmap.size() < 1) return;
    if(text->fontid == INVALID) return;
    AminoFont* font = fontmap[text->fontid];


    c->save();
    //flip the y axis
    c->scale(1,-1);
    glActiveTexture(GL_TEXTURE0);
    c->bindTexture(font->atlas->id );
    glEnable( GL_BLEND );
    glBlendFunc( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA );
    c->useProgram(font->shader);
    {
        //by only doing this init work once we save almost 80% of the time for drawing text
        if(font->texuni == -1) {
            font->texuni   = glGetUniformLocation( font->shader, "texture" );
            font->mvpuni   = glGetUniformLocation( font->shader, "mvp" );
            font->transuni = glGetUniformLocation( font->shader, "trans" );
        }
        glUniform1i(font->texuni,0 );
        if(modelViewChanged) {
            //            glUniformMatrix4fv(font->mvpuni,         1, 0,  modelView  );
        }
        glUniformMatrix4fv(font->mvpuni,         1, 0,  modelView  );
        //only the global transform will change each time
        glUniformMatrix4fv(font->transuni,        1, 0,  c->globaltx );
        vertex_buffer_render(text->buffer, GL_TRIANGLES );
    }
    c->restore();
}

Handle<Value> node_glGetString(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  const char * version = (const char*)glGetString(val);
  Local<String> str = String::New(version);
  return scope.Close(str);
}
Handle<Value> node_glGetError(const Arguments& args) {
  HandleScope scope;
  int val = glGetError();;
  return scope.Close(Number::New(val));
}
/*
Handle<Value> node_glGenVertexArrays(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  GLuint vao;
  glGenVertexArrays(val, &vao);
  Local<Number> str = Number::New(vao);
  return scope.Close(str);
}


Handle<Value> node_glBindVertexArray(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  glBindVertexArray(val);
  return scope.Close(Undefined());
}
*/
Handle<Value> node_glGenBuffers(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  GLuint vbo;
  glGenBuffers(val, &vbo);
  Local<Number> str = Number::New(vbo);
  return scope.Close(str);
}
Handle<Value> node_glBindBuffer(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  int vbo    = args[1]->ToNumber()->NumberValue();
  glBindBuffer(type,vbo);
  return scope.Close(Undefined());
}


Handle<Value> node_glBufferData(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  Handle<Array> array = Handle<Array>::Cast(args[1]);
  float* verts = new float[array->Length()];
  for(std::size_t i=0; i<array->Length(); i++) {
      verts[i] = array->Get(i)->ToNumber()->NumberValue();
  }
  int kind = args[2]->ToNumber()->NumberValue();
  glBufferData(type,sizeof(float)*array->Length(),verts,kind);
  return scope.Close(Undefined());
}

Handle<Value> node_glGenFramebuffers(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  GLuint buf;
  glGenFramebuffers(val, &buf);
  Local<Number> str = Number::New(buf);
  return scope.Close(str);
}
Handle<Value> node_glBindFramebuffer(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  int buf    = args[1]->ToNumber()->NumberValue();
  glBindFramebuffer(type,buf);
  return scope.Close(Undefined());
}

Handle<Value> node_glCheckFramebufferStatus(const Arguments& args) {
  HandleScope scope;
  int buf    = args[0]->ToNumber()->NumberValue();
  GLuint val = glCheckFramebufferStatus(buf);
  Local<Number> nval = Number::New(val);
  return scope.Close(nval);
}

Handle<Value> node_glGenTextures(const Arguments& args) {
  HandleScope scope;
  int val   = args[0]->ToNumber()->NumberValue();
  GLuint tex;
  glGenTextures(val, &tex);
  Local<Number> ntex = Number::New(tex);
  return scope.Close(ntex);
}

Handle<Value> node_glBindTexture(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  int tex    = args[1]->ToNumber()->NumberValue();
  glBindTexture(type,tex);
  return scope.Close(Undefined());
}
Handle<Value> node_glActiveTexture(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  glActiveTexture(type);
  return scope.Close(Undefined());
}

Handle<Value> node_glTexImage2D(const Arguments& args) {
  HandleScope scope;
  int type     = args[0]->ToNumber()->NumberValue();
  int v1       = args[1]->ToNumber()->NumberValue();
  int format1  = args[2]->ToNumber()->NumberValue();
  int width    = args[3]->ToNumber()->NumberValue();
  int height   = args[4]->ToNumber()->NumberValue();
  int depth    = args[5]->ToNumber()->NumberValue();
  int format2  = args[6]->ToNumber()->NumberValue();
  int type2    = args[7]->ToNumber()->NumberValue();
//  int data     = args[8]->ToNumber()->NumberValue();
  glTexImage2D(type,v1,format1,width,height,depth,format2,type2,NULL);
  return scope.Close(Undefined());
}

Handle<Value> node_glTexParameteri(const Arguments& args) {
    HandleScope scope;
    int type     = args[0]->ToNumber()->NumberValue();
    int param    = args[1]->ToNumber()->NumberValue();
    int value    = args[2]->ToNumber()->NumberValue();
    glTexParameteri(type, param, value);
    return scope.Close(Undefined());
}

Handle<Value> node_glFramebufferTexture2D(const Arguments& args) {
    HandleScope scope;
    int type     = args[0]->ToNumber()->NumberValue();
    int attach   = args[1]->ToNumber()->NumberValue();
    int type2    = args[2]->ToNumber()->NumberValue();
    int value    = args[3]->ToNumber()->NumberValue();
    int other    = args[4]->ToNumber()->NumberValue();
    glFramebufferTexture2D(type, attach, type2, value, other);
    return scope.Close(Undefined());
}

using node::Buffer;
Handle<Value> node_glReadPixels(const Arguments& args) {
    HandleScope scope;
    int x     = args[0]->ToNumber()->NumberValue();
    int y     = args[1]->ToNumber()->NumberValue();
    int w     = args[2]->ToNumber()->NumberValue();
    int h     = args[3]->ToNumber()->NumberValue();
    int format= args[4]->ToNumber()->NumberValue();
    int type  = args[5]->ToNumber()->NumberValue();

    int length = w*h*3;
    char* data = (char*)malloc(length);
    glReadPixels(x,y,w,h, format, type, data);
    Buffer *slowBuffer = Buffer::New(length);
    memcpy(Buffer::Data(slowBuffer), data, length);
    Local<Object> globalObj = Context::GetCurrent()->Global();
    Local<Function> bufferConstructor = Local<Function>::Cast(globalObj->Get(String::New("Buffer")));
    Handle<Value> constructorArgs[3] = { slowBuffer->handle_, v8::Integer::New(length), v8::Integer::New(0) };
    Local<Object> actualBuffer = bufferConstructor->NewInstance(3, constructorArgs);
    return scope.Close(actualBuffer);
}



Handle<Value> node_glCreateShader(const Arguments& args) {
  HandleScope scope;
  int type   = args[0]->ToNumber()->NumberValue();
  int shader = glCreateShader(type);
  return scope.Close(Number::New(shader));
}


Handle<Value> node_glShaderSource(const Arguments& args) {
  HandleScope scope;
  int shader   = args[0]->ToNumber()->NumberValue();
  int count    = args[1]->ToNumber()->NumberValue();
  v8::String::Utf8Value jsource(args[2]->ToString());
  const char *source = *jsource;
  glShaderSource(shader, count, &source, NULL);
  return scope.Close(Undefined());
}
Handle<Value> node_glCompileShader(const Arguments& args) {
  HandleScope scope;
  int shader   = args[0]->ToNumber()->NumberValue();
  glCompileShader(shader);
  return scope.Close(Undefined());
}
Handle<Value> node_glGetShaderiv(const Arguments& args) {
  HandleScope scope;
  int shader   = args[0]->ToNumber()->NumberValue();
  int flag   = args[1]->ToNumber()->NumberValue();
  GLint status;
  glGetShaderiv(shader,flag,&status);
  return scope.Close(Number::New(status));
}
Handle<Value> node_glGetProgramiv(const Arguments& args) {
  HandleScope scope;
  int prog   = args[0]->ToNumber()->NumberValue();
  int flag   = args[1]->ToNumber()->NumberValue();
  GLint status;
  glGetProgramiv(prog,flag,&status);
  return scope.Close(Number::New(status));
}
Handle<Value> node_glGetShaderInfoLog(const Arguments& args) {
  HandleScope scope;
  int shader   = args[0]->ToNumber()->NumberValue();
  char buffer[513];
  glGetShaderInfoLog(shader,512,NULL,buffer);
  return scope.Close(String::New(buffer,strlen(buffer)));
}
Handle<Value> node_glGetProgramInfoLog(const Arguments& args) {
  HandleScope scope;
  int shader   = args[0]->ToNumber()->NumberValue();
  char buffer[513];
  glGetProgramInfoLog(shader,512,NULL,buffer);
  return scope.Close(String::New(buffer,strlen(buffer)));
}
Handle<Value> node_glCreateProgram(const Arguments& args) {
  HandleScope scope;
  int prog = glCreateProgram();
  return scope.Close(Number::New(prog));
}
Handle<Value> node_glAttachShader(const Arguments& args) {
  HandleScope scope;
  int prog     = args[0]->ToNumber()->NumberValue();
  int shader   = args[1]->ToNumber()->NumberValue();
  glAttachShader(prog,shader);
  return scope.Close(Undefined());
}

int gprog;
Handle<Value> node_glLinkProgram(const Arguments& args) {
  HandleScope scope;
  int prog     = args[0]->ToNumber()->NumberValue();
  glLinkProgram(prog);
  gprog = prog;
  return scope.Close(Undefined());
}
Handle<Value> node_glUseProgram(const Arguments& args) {
  HandleScope scope;
  int prog     = args[0]->ToNumber()->NumberValue();
  glUseProgram(prog);
  return scope.Close(Undefined());
}
Handle<Value> node_glGetAttribLocation(const Arguments& args) {
  HandleScope scope;
  int prog                 = args[0]->ToNumber()->NumberValue();
  v8::String::Utf8Value name(args[1]->ToString());
  int loc = glGetAttribLocation(prog,*name);
  return scope.Close(Number::New(loc));
}

Handle<Value> node_glGetUniformLocation(const Arguments& args) {
  HandleScope scope;
  int prog                 = args[0]->ToNumber()->NumberValue();
  v8::String::Utf8Value name(args[1]->ToString());
  int loc = glGetUniformLocation(prog,*name);
  return scope.Close(Number::New(loc));
}


Handle<Value> node_glEnableVertexAttribArray(const Arguments& args) {
  HandleScope scope;
  int loc                 = args[0]->ToNumber()->NumberValue();
  glEnableVertexAttribArray(loc);
  return scope.Close(Number::New(loc));
}


Handle<Value> node_glVertexAttribPointer(const Arguments& args) {
  HandleScope scope;
  int loc                        = args[0]->ToNumber()->NumberValue();
  int count                      = args[1]->ToNumber()->NumberValue();
  int size                       = args[2]->ToNumber()->NumberValue();
  int other                      = args[3]->ToNumber()->NumberValue();
  int size2  = sizeof(float)*(int)(args[4]->ToNumber()->NumberValue());
  int offset = sizeof(float)*(int)(args[5]->ToNumber()->NumberValue());
  glVertexAttribPointer(loc,count,size,other,size2,(void*)offset);
  return scope.Close(Undefined());
}

Handle<Value> node_glUniform1f(const Arguments& args) {
  HandleScope scope;
  int loc                 = args[0]->ToNumber()->NumberValue();
  float value             = args[1]->ToNumber()->NumberValue();
  glUniform1f(loc,value);
  return scope.Close(Undefined());
}
Handle<Value> node_glUniform2f(const Arguments& args) {
  HandleScope scope;
  int loc                 = args[0]->ToNumber()->NumberValue();
  float value             = args[1]->ToNumber()->NumberValue();
  float value2            = args[2]->ToNumber()->NumberValue();
  glUniform2f(loc,value,value2);
  return scope.Close(Undefined());
}


Handle<Value> node_glPointSize(const Arguments& args) {
  HandleScope scope;
  float size                 = args[0]->ToNumber()->NumberValue();
  glPointSize(size);
  return scope.Close(Undefined());
}

Handle<Value> node_glEnable(const Arguments& args) {
  HandleScope scope;
  int var                 = args[0]->ToNumber()->NumberValue();
  glEnable(var);
  return scope.Close(Undefined());
}

Handle<Value> node_glBlendFunc(const Arguments& args) {
  HandleScope scope;
  int src                 = args[0]->ToNumber()->NumberValue();
  int dst                 = args[1]->ToNumber()->NumberValue();
  glBlendFunc(src,dst);
  return scope.Close(Undefined());
}

Handle<Value> node_glBlendFuncSeparate(const Arguments& args) {
  HandleScope scope;
  int a                 = args[0]->ToNumber()->NumberValue();
  int b                 = args[1]->ToNumber()->NumberValue();
  int c                 = args[2]->ToNumber()->NumberValue();
  int d                = args[3]->ToNumber()->NumberValue();
  glBlendFuncSeparate(a,b,c,d);
  return scope.Close(Undefined());
}

Handle<Value> node_glBlendEquation(const Arguments& args) {
  HandleScope scope;
  int eq                 = args[0]->ToNumber()->NumberValue();
  glBlendEquation(eq);
  return scope.Close(Undefined());
}


Handle<Value> node_glDrawArrays(const Arguments& args) {
  HandleScope scope;
  int type               = args[0]->ToNumber()->NumberValue();
  int c1                 = args[1]->ToNumber()->NumberValue();
  int count              = args[2]->ToNumber()->NumberValue();
  glDrawArrays(type,c1,count);
  return scope.Close(Undefined());
}

Handle<Value> node_setModelView(const Arguments& args) {
  HandleScope scope;
  int id               = args[0]->ToNumber()->NumberValue();
  //printf("setting to %d\n",id);
  glUniformMatrix4fv(id, 1, GL_FALSE, modelView);
//    glUniformMatrix4fv(u_trans,  1, GL_FALSE, trans);
  return scope.Close(Undefined());
}

static GLContext* sctx;
Handle<Value> node_setGlobalTransform(const Arguments& args) {
  HandleScope scope;
  int id               = args[0]->ToNumber()->NumberValue();
//  sctx->dumpGlobalTransform();
  glUniformMatrix4fv(id, 1, GL_FALSE, sctx->globaltx);
  return scope.Close(Undefined());
}

void SimpleRenderer::drawGLNode(GLContext* ctx, GLNode* glnode) {
    sctx = ctx;
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("glnode"));
    event_obj->Set(String::NewSymbol("GL_SHADING_LANGUAGE_VERSION"), Number::New(GL_SHADING_LANGUAGE_VERSION));
    event_obj->Set(String::NewSymbol("GL_ARRAY_BUFFER"), Number::New(GL_ARRAY_BUFFER));
    event_obj->Set(String::NewSymbol("GL_STATIC_DRAW"), Number::New(GL_STATIC_DRAW));
    event_obj->Set(String::NewSymbol("GL_VERTEX_SHADER"), Number::New(GL_VERTEX_SHADER));
    event_obj->Set(String::NewSymbol("GL_FRAGMENT_SHADER"), Number::New(GL_FRAGMENT_SHADER));
    event_obj->Set(String::NewSymbol("GL_COMPILE_STATUS"), Number::New(GL_COMPILE_STATUS));
    event_obj->Set(String::NewSymbol("GL_LINK_STATUS"), Number::New(GL_LINK_STATUS));
    event_obj->Set(String::NewSymbol("GL_TRUE"), Number::New(GL_TRUE));
    event_obj->Set(String::NewSymbol("GL_FALSE"), Number::New(GL_FALSE));
    event_obj->Set(String::NewSymbol("GL_FLOAT"), Number::New(GL_FLOAT));
    event_obj->Set(String::NewSymbol("GL_BLEND"), Number::New(GL_BLEND));
    event_obj->Set(String::NewSymbol("GL_SRC_ALPHA"), Number::New(GL_SRC_ALPHA));
    event_obj->Set(String::NewSymbol("GL_ONE_MINUS_SRC_ALPHA"), Number::New(GL_ONE_MINUS_SRC_ALPHA));
//    event_obj->Set(String::NewSymbol("GL_MAX"), Number::New(GL_MAX_EXT));
    //event_obj->Set(String::NewSymbol("GL_ADD"), Number::New(GL_ADD));
    event_obj->Set(String::NewSymbol("GL_POINTS"), Number::New(GL_POINTS));
    event_obj->Set(String::NewSymbol("GL_LINES"), Number::New(GL_LINES));
    event_obj->Set(String::NewSymbol("GL_LINE_STRIP"), Number::New(GL_LINE_STRIP));
    event_obj->Set(String::NewSymbol("GL_LINE_LOOP"), Number::New(GL_LINE_LOOP));
    event_obj->Set(String::NewSymbol("GL_TRIANGLE_FAN"), Number::New(GL_TRIANGLE_FAN));
    event_obj->Set(String::NewSymbol("GL_TRIANGLE_STRIP"), Number::New(GL_TRIANGLE_STRIP));
    event_obj->Set(String::NewSymbol("GL_TRIANGLES"), Number::New(GL_TRIANGLES));

    event_obj->Set(String::NewSymbol("GL_NO_ERROR"), Number::New(GL_NO_ERROR));
    event_obj->Set(String::NewSymbol("GL_INVALID_ENUM"), Number::New(GL_INVALID_ENUM));
    event_obj->Set(String::NewSymbol("GL_INVALID_VALUE"), Number::New(GL_INVALID_VALUE));
    event_obj->Set(String::NewSymbol("GL_INVALID_OPERATION"), Number::New(GL_INVALID_OPERATION));
    event_obj->Set(String::NewSymbol("GL_OUT_OF_MEMORY"), Number::New(GL_OUT_OF_MEMORY));
    event_obj->Set(String::NewSymbol("GL_TEXTURE_2D"), Number::New(GL_TEXTURE_2D));
    event_obj->Set(String::NewSymbol("GL_TEXTURE0"), Number::New(GL_TEXTURE0));
    event_obj->Set(String::NewSymbol("GL_RGB"), Number::New(GL_RGB));
    event_obj->Set(String::NewSymbol("GL_TEXTURE_MIN_FILTER"), Number::New(GL_TEXTURE_MIN_FILTER));
    event_obj->Set(String::NewSymbol("GL_TEXTURE_MAG_FILTER"), Number::New(GL_TEXTURE_MAG_FILTER));
    event_obj->Set(String::NewSymbol("GL_LINEAR"), Number::New(GL_LINEAR));
    event_obj->Set(String::NewSymbol("GL_UNSIGNED_BYTE"), Number::New(GL_UNSIGNED_BYTE));
    event_obj->Set(String::NewSymbol("NULL"), Number::New(NULL));
    event_obj->Set(String::NewSymbol("GL_FRAMEBUFFER"), Number::New(GL_FRAMEBUFFER));
    event_obj->Set(String::NewSymbol("GL_FRAMEBUFFER_COMPLETE"), Number::New(GL_FRAMEBUFFER_COMPLETE));
    event_obj->Set(String::NewSymbol("GL_COLOR_ATTACHMENT0"), Number::New(GL_COLOR_ATTACHMENT0));


    event_obj->Set(String::NewSymbol("glGetString"), FunctionTemplate::New(node_glGetString)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetError"), FunctionTemplate::New(node_glGetError)->GetFunction());
//    event_obj->Set(String::NewSymbol("glGenVertexArrays"), FunctionTemplate::New(node_glGenVertexArrays)->GetFunction());
//    event_obj->Set(String::NewSymbol("glBindVertexArray"), FunctionTemplate::New(node_glBindVertexArray)->GetFunction());
    event_obj->Set(String::NewSymbol("glGenBuffers"), FunctionTemplate::New(node_glGenBuffers)->GetFunction());
    event_obj->Set(String::NewSymbol("glBindBuffer"), FunctionTemplate::New(node_glBindBuffer)->GetFunction());
    event_obj->Set(String::NewSymbol("glBufferData"), FunctionTemplate::New(node_glBufferData)->GetFunction());
    event_obj->Set(String::NewSymbol("glCreateShader"), FunctionTemplate::New(node_glCreateShader)->GetFunction());
    event_obj->Set(String::NewSymbol("glShaderSource"), FunctionTemplate::New(node_glShaderSource)->GetFunction());
    event_obj->Set(String::NewSymbol("glCompileShader"), FunctionTemplate::New(node_glCompileShader)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetShaderiv"), FunctionTemplate::New(node_glGetShaderiv)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetProgramiv"), FunctionTemplate::New(node_glGetProgramiv)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetShaderInfoLog"), FunctionTemplate::New(node_glGetShaderInfoLog)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetProgramInfoLog"), FunctionTemplate::New(node_glGetProgramInfoLog)->GetFunction());
    event_obj->Set(String::NewSymbol("glCreateProgram"), FunctionTemplate::New(node_glCreateProgram)->GetFunction());
    event_obj->Set(String::NewSymbol("glAttachShader"), FunctionTemplate::New(node_glAttachShader)->GetFunction());
    event_obj->Set(String::NewSymbol("glLinkProgram"), FunctionTemplate::New(node_glLinkProgram)->GetFunction());
    event_obj->Set(String::NewSymbol("glUseProgram"), FunctionTemplate::New(node_glUseProgram)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetAttribLocation"), FunctionTemplate::New(node_glGetAttribLocation)->GetFunction());
    event_obj->Set(String::NewSymbol("glGetUniformLocation"), FunctionTemplate::New(node_glGetUniformLocation)->GetFunction());
    event_obj->Set(String::NewSymbol("glEnableVertexAttribArray"), FunctionTemplate::New(node_glEnableVertexAttribArray)->GetFunction());
    event_obj->Set(String::NewSymbol("glVertexAttribPointer"), FunctionTemplate::New(node_glVertexAttribPointer)->GetFunction());
    event_obj->Set(String::NewSymbol("glUniform1f"), FunctionTemplate::New(node_glUniform1f)->GetFunction());
    event_obj->Set(String::NewSymbol("glUniform2f"), FunctionTemplate::New(node_glUniform2f)->GetFunction());
    event_obj->Set(String::NewSymbol("glPointSize"), FunctionTemplate::New(node_glPointSize)->GetFunction());
    event_obj->Set(String::NewSymbol("glEnable"), FunctionTemplate::New(node_glEnable)->GetFunction());
    event_obj->Set(String::NewSymbol("glBlendFunc"), FunctionTemplate::New(node_glBlendFunc)->GetFunction());
    event_obj->Set(String::NewSymbol("glBlendFuncSeparate"), FunctionTemplate::New(node_glBlendFuncSeparate)->GetFunction());
    event_obj->Set(String::NewSymbol("glBlendEquation"), FunctionTemplate::New(node_glBlendEquation)->GetFunction());
    event_obj->Set(String::NewSymbol("GL_FUNC_ADD"), Number::New(GL_FUNC_ADD));
    event_obj->Set(String::NewSymbol("GL_ONE"), Number::New(GL_ONE));
    event_obj->Set(String::NewSymbol("GL_ZERO"), Number::New(GL_ZERO));
    event_obj->Set(String::NewSymbol("glDrawArrays"), FunctionTemplate::New(node_glDrawArrays)->GetFunction());

    event_obj->Set(String::NewSymbol("glGenFramebuffers"), FunctionTemplate::New(node_glGenFramebuffers)->GetFunction());
    event_obj->Set(String::NewSymbol("glBindFramebuffer"), FunctionTemplate::New(node_glBindFramebuffer)->GetFunction());
    event_obj->Set(String::NewSymbol("glCheckFramebufferStatus"), FunctionTemplate::New(node_glCheckFramebufferStatus)->GetFunction());
    event_obj->Set(String::NewSymbol("glGenTextures"), FunctionTemplate::New(node_glGenTextures)->GetFunction());
    event_obj->Set(String::NewSymbol("glBindTexture"), FunctionTemplate::New(node_glBindTexture)->GetFunction());
    event_obj->Set(String::NewSymbol("glActiveTexture"), FunctionTemplate::New(node_glActiveTexture)->GetFunction());
    event_obj->Set(String::NewSymbol("glTexImage2D"), FunctionTemplate::New(node_glTexImage2D)->GetFunction());
    event_obj->Set(String::NewSymbol("glTexParameteri"), FunctionTemplate::New(node_glTexParameteri)->GetFunction());
    event_obj->Set(String::NewSymbol("glFramebufferTexture2D"), FunctionTemplate::New(node_glFramebufferTexture2D)->GetFunction());
    event_obj->Set(String::NewSymbol("glReadPixels"), FunctionTemplate::New(node_glReadPixels)->GetFunction());


    event_obj->Set(String::NewSymbol("setModelView"), FunctionTemplate::New(node_setModelView)->GetFunction());
    event_obj->Set(String::NewSymbol("setGlobalTransform"), FunctionTemplate::New(node_setGlobalTransform)->GetFunction());

    Handle<Value> event_argv[] = {event_obj};
    glnode->callback->Call(Context::GetCurrent()->Global(),1,event_argv);


}
