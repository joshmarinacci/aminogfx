#include "base.h"

using namespace v8;



ColorShader* colorShader;
TextureShader* textureShader;
GLfloat* modelView;
GLfloat* globaltx;
int width = 640;
int height = 480;


std::stack<void*> matrixStack;
int rootHandle;
std::map<int,AminoFont*> fontmap;


void scale(double x, double y){
    GLfloat scale[16];
    GLfloat temp[16];
    make_scale_matrix((float)x,(float)y, 1.0, scale);
    mul_matrix(temp, globaltx, scale);
    copy_matrix(globaltx,temp);
}

void translate(double x, double y) {
    GLfloat tr[16];
    GLfloat trans2[16];
    make_trans_matrix((float)x,(float)y,0,tr);
    mul_matrix(trans2, globaltx, tr);
    copy_matrix(globaltx,trans2);
}

void rotate(double x, double y, double z) {
    GLfloat rot[16];
    GLfloat temp[16];

    make_x_rot_matrix(x, rot);
    mul_matrix(temp, globaltx, rot);
    copy_matrix(globaltx,temp);

    make_y_rot_matrix(y, rot);
    mul_matrix(temp, globaltx, rot);
    copy_matrix(globaltx,temp);

    make_z_rot_matrix(z, rot);
    mul_matrix(temp, globaltx, rot);
    copy_matrix(globaltx,temp);
}

void save() {
    GLfloat* temp = new GLfloat[16];
    copy_matrix(temp,globaltx);
    matrixStack.push(globaltx);
    globaltx = temp;
}

void restore() {
    delete globaltx;
    globaltx = (GLfloat*)matrixStack.top();
    matrixStack.pop();
}

// --------------------------------------------------------------- add_text ---
static void add_text( vertex_buffer_t * buffer, texture_font_t * font,
               wchar_t * text, vec4 * color, vec2 * pen )
{
    size_t i;
    float r = color->red, g = color->green, b = color->blue, a = color->alpha;
    for( i=0; i<wcslen(text); ++i )
    {
        texture_glyph_t *glyph = texture_font_get_glyph( font, text[i] );
        if( glyph != NULL )
        {
            int kerning = 0;
            if( i > 0)
            {
                kerning = texture_glyph_get_kerning( glyph, text[i-1] );
            }
            pen->x += kerning;
            int x0  = (int)( pen->x + glyph->offset_x );
            int y0  = (int)( pen->y + glyph->offset_y );
            int x1  = (int)( x0 + glyph->width );
            int y1  = (int)( y0 - glyph->height );
            float s0 = glyph->s0;
            float t0 = glyph->t0;
            float s1 = glyph->s1;
            float t1 = glyph->t1;
            GLushort indices[6] = {0,1,2, 0,2,3};
            vertex_t vertices[4] = { { x0,y0,0,  s0,t0,  r,g,b,a },
                                     { x0,y1,0,  s0,t1,  r,g,b,a },
                                     { x1,y1,0,  s1,t1,  r,g,b,a },
                                     { x1,y0,0,  s1,t0,  r,g,b,a } };
            vertex_buffer_push_back( buffer, vertices, 4, indices, 6 );
            pen->x += glyph->advance_x;
        }
    }
}

void TextNode::refreshText() {
    if(fontid == INVALID) return;
    AminoFont* font = fontmap[fontid];
    std::map<int,texture_font_t*>::iterator it = font->fonts.find(fontsize);
    if(it == font->fonts.end()) {
        printf("loading size %d for font %s\n",fontsize,font->filename);
        font->fonts[fontsize] = texture_font_new(font->atlas, font->filename, fontsize);
    }


    vec2 pen = {{5,400}};
    vec4 black = {{0,1,0,1}};
    pen.x = 0;
    pen.y = 0;
    black.r = r;
    black.g = g;
    black.b = b;
    black.a = opacity;

    wchar_t *t2 = const_cast<wchar_t*>(text.c_str());
    vertex_buffer_delete(buffer);
    buffer = vertex_buffer_new( "vertex:3f,tex_coord:2f,color:4f" );
    texture_font_t *f = font->fonts[fontsize];
    assert(f);
    add_text(buffer,font->fonts[fontsize],t2,&black,&pen);
//    texture_font_delete(afont->font);
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

Handle<Value> node_glLinkProgram(const Arguments& args) {
    HandleScope scope;
    int prog     = args[0]->ToNumber()->NumberValue();
    glLinkProgram(prog);
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
