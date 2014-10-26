#ifndef AMINOBASE
#define AMINOBASE

#include "gfx.h"
#include <node.h>
#include <node_buffer.h>
using namespace node;

#include <uv.h>
#include "shaders.h"
#include "mathutils.h"
#include "image.h"
#include <stdio.h>
#include <string.h>
#include <vector>
#include <stack>
#include <stdlib.h>
#include <string>
#include <string.h>
#include <map>

#include "freetype-gl.h"
#include "mat4.h"
#include "shader.h"
#include "vertex-buffer.h"
#include "texture-font.h"

const int GROUP = 1;
const int RECT = 2;
const int TEXT = 3;
const int ANIM = 4;
const int POLY = 5;
const int GLNODE = 6;
const int INVALID = -1;


static const int FOREVER = -1;
static const int TY = 1;
static const int SCALEX = 2;
static const int SCALEY = 3;
static const int ROTATEZ = 4;
static const int R = 5;
static const int G = 6;
static const int B = 7;
static const int TEXID = 8;
static const int TEXT_PROP = 9;
static const int W_PROP = 10;
static const int H_PROP = 11;
static const int FONTSIZE_PROP = 12;

static const int LERP_LINEAR = 13;
static const int LERP_CUBIC_IN = 14;
static const int LERP_CUBIC_OUT = 15;
static const int LERP_PROP = 16;
static const int LERP_CUBIC_IN_OUT = 17;

static const int VISIBLE = 18;
static const int ROTATEX = 19;
static const int ROTATEY = 20;

static const int X_PROP = 21;
static const int Y_PROP = 22;
static const int TX = 23;
static const int GEOMETRY = 24;
static const int FILLED = 25;

static const int OPACITY_PROP = 27;
static const int FONTID_PROP = 28;

static const int COUNT = 29;

static const int TEXTURELEFT_PROP   = 30;
static const int TEXTURERIGHT_PROP  = 31;
static const int TEXTURETOP_PROP    = 32;
static const int TEXTUREBOTTOM_PROP = 33;

static const int CLIPRECT_PROP = 34;
static const int AUTOREVERSE = 35;
static const int DIMENSION = 36;

using namespace v8;

static bool eventCallbackSet = false;
static Persistent<Function> NODE_EVENT_CALLBACK;

extern int width;
extern int height;

extern ColorShader* colorShader;
extern TextureShader* textureShader;
extern GLfloat* modelView;
extern GLfloat* globaltx;

extern std::stack<void*> matrixStack;
extern int rootHandle;
extern std::map<int,AminoFont*> fontmap;




class AminoNode {
public:
    float tx;
    float ty;
    float scalex;
    float scaley;
    float rotatex;
    float rotatey;
    float rotatez;
    int type;
    int visible;
    AminoNode() {
        tx = 0;
        ty = 0;
        scalex = 1;
        scaley = 1;
        rotatex = 0;
        rotatey = 0;
        rotatez = 0;
        type = 0;
        visible = 1;
    }
    virtual ~AminoNode() {
    }

};

// convert a v8::String to a (char*) -- any call to this should later be free'd
static inline char *TO_CHAR(Handle<Value> val) {
    String::Utf8Value utf8(val->ToString());

    int len = utf8.length() + 1;
    char *str = (char *) calloc(sizeof(char), len);
    strncpy(str, *utf8, len);

    return str;
}

static wchar_t *GetWC(const char *c)
{
    const size_t cSize = strlen(c)+1;
    wchar_t* wc = new wchar_t[cSize];
    mbstowcs (wc, c, cSize);

    return wc;
}

static std::vector<AminoNode*> rects;

static void warnAbort(char * str) {
    printf("%s\n",str);
    exit(-1);
}

class Anim {
public:
    AminoNode* target;
    float start;
    float end;
    int property;
    int id;
    bool started;
    bool active;
    double startTime;
    int loopcount;
    float duration;
    bool autoreverse;
    int direction;
    static const int FORWARD = 1;
    static const int BACKWARD = 2;
    int lerptype;
    Anim(AminoNode* Target, int Property, float Start, float End,
            float Duration) {
        id = -1;
        target = Target;
        start = Start;
        end = End;
        property = Property;
        started = false;
        duration = Duration;
        loopcount = 1;
        autoreverse = false;
        direction = FORWARD;
        lerptype = LERP_LINEAR;
        active = true;
    }

    float cubicIn(float t) {
        return pow(t,3);
    }
    float cubicOut(float t) {
        return 1-cubicIn(1-t);
    }
    float cubicInOut(float t) {
        if(t < 0.5) return cubicIn(t*2.0)/2.0 ;
        return 1-cubicIn((1-t)*2)/2;
    }

    float lerp(float t) {
        if(lerptype != LERP_LINEAR) {
            float t2 = 0;
            if(lerptype == LERP_CUBIC_IN) { t2 = cubicIn(t); }
            if(lerptype == LERP_CUBIC_OUT) { t2 = cubicOut(t); }
            if(lerptype == LERP_CUBIC_IN_OUT) { t2 = cubicInOut(t); }
            return start + (end-start)*t2;
        } else {
            return start + (end-start)*t;
        }
    }

    void toggle() {
        if(autoreverse) {
            if(direction == FORWARD) {
                direction = BACKWARD;
            } else {
                direction = FORWARD;
            }
        }
    }
    void applyValue(float value) {
        if(property == TX) target->tx = value;
        if(property == TY) target->ty = value;
        if(property == SCALEX) target->scalex = value;
        if(property == SCALEY) target->scaley = value;
        if(property == ROTATEX) target->rotatex = value;
        if(property == ROTATEY) target->rotatey = value;
        if(property == ROTATEZ) target->rotatez = value;
    }

void endAnimation() {
     applyValue(end);
     if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
     Local<Object> event_obj = Object::New();
     event_obj->Set(String::NewSymbol("type"), String::New("animend"));
     event_obj->Set(String::NewSymbol("id"), Number::New(id));
     Handle<Value> event_argv[] = {event_obj};
     NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}


void update() {
    	if(!active) return;
        if(loopcount == 0) {
            return;
        }
        if(!started) {
            started = true;
            startTime = getTime();
        }
        double currentTime = getTime();
        float t = (currentTime-startTime)/duration;
        if(t > 1) {
            if(loopcount == FOREVER) {
                startTime = getTime();
                t = 0;
                toggle();
            }
            if(loopcount > 0) {
                loopcount--;
                if(loopcount > 0) {
                    t = 0;
                    startTime = getTime();
                    toggle();
                } else {
                    endAnimation();
                    return;
                }
            }
        }

        if(direction == BACKWARD) {
            t = 1-t;
        }
        float value = lerp(t);
        applyValue(value);
    }
};

static std::vector<Anim*> anims;



class Rect : public AminoNode {
public:
    float x;
    float y;
    float w;
    float h;
    float r;
    float g;
    float b;
    float left;
    float right;
    float top;
    float bottom;
    float opacity;
    int texid;
    Rect() {
        x = 0; y = 0; w = 100; h = 100;
        r = 0; g = 1; b = 0;
        opacity = 1;
        type = RECT;
        texid = INVALID;
        left = 0;
        bottom = 1;
        right = 1;
        top = 0;
    }
    virtual ~Rect() {
    }
};

class PolyNode : public AminoNode {
public:
    float r;
    float g;
    float b;
    float opacity;
    std::vector<float>* geometry;
    int dimension;
    int filled;

    PolyNode() {
        r = 0; g = 1; b = 0;
        filled = 0;
        geometry = new std::vector<float>();
        geometry->push_back(0);
        geometry->push_back(0);
        geometry->push_back(50);
        geometry->push_back(0);
        geometry->push_back(50);
        geometry->push_back(50);
        opacity = 1;
        type = POLY;
        dimension = 2;
    }
    virtual ~PolyNode() {
    }
};

class TextNode : public AminoNode {
public:
    float x;
    float y;
    float r;
    float g;
    float b;
    int fontid;
    int fontsize;
    std::wstring text;
    vertex_buffer_t * buffer;
    TextNode() {
        x = 0; y = 0;
        r = 0; g = 0; b = 0;
        type = TEXT;
        text = L"foo";
        fontsize = 40;
        fontid = INVALID;
        buffer = vertex_buffer_new( "vertex:3f,tex_coord:2f,color:4f" );
    }
    virtual ~TextNode() {
    }
    void refreshText();
};

class Group : public AminoNode {
public:
    std::vector<AminoNode*> children;
    float w;
    float h;
    int cliprect;
    Group() {
        w = 50;
        h = 50;
        cliprect = 0;
        type = GROUP;
    }
    ~Group() {
    }
};

class GLNode : public AminoNode {
public:
    Persistent<Function> callback;
    GLNode() {
        type = GLNODE;
    }
    ~GLNode() {
    }
};

class Update {
public:
    int type;
    int node;
    int property;
    float value;
    std::wstring text;
    std::vector<float>* arr;
    Update(int Type, int Node, int Property, float Value, std::wstring Text, std::vector<float>* Arr) {
        type = Type;
        node = Node;
        property = Property;
        value = Value;
        text = Text;
        arr = Arr;
    }
    ~Update() { }
    void apply() {
        if(type == ANIM) {
            Anim* anim = anims[node];
            if(property == LERP_PROP) {
                anim->lerptype = value;
            }
            if(property == COUNT) {
                anim->loopcount = value;
            }
            if(property == AUTOREVERSE) {
                anim->autoreverse = value;
            }
            return;
        }
        AminoNode* target = rects[node];

        if(property == TX) target->tx = value;
        if(property == TY) target->ty = value;
        if(property == SCALEX) target->scalex = value;
        if(property == SCALEY) target->scaley = value;
        if(property == ROTATEX) target->rotatex = value;
        if(property == ROTATEY) target->rotatey = value;
        if(property == ROTATEZ) target->rotatez = value;
        if(property == VISIBLE) target->visible = value;

        if(target->type == RECT) {
            Rect* rect = (Rect*)target;
            if(property == R) rect->r = value;
            if(property == G) rect->g = value;
            if(property == B) rect->b = value;
            if(property == X_PROP) rect->x = value;
            if(property == Y_PROP) rect->y = value;
            if(property == W_PROP) rect->w = value;
            if(property == H_PROP) rect->h = value;
            if(property == TEXID) rect->texid = value;
            if(property == OPACITY_PROP) rect->opacity = value;
            if(property == TEXTURELEFT_PROP)   rect->left = value;
            if(property == TEXTURERIGHT_PROP)  rect->right = value;
            if(property == TEXTURETOP_PROP)    rect->top = value;
            if(property == TEXTUREBOTTOM_PROP) rect->bottom = value;
        }

        if(target->type == GROUP) {
            Group* group = (Group*)target;
            if(property == W_PROP) group->w = value;
            if(property == H_PROP) group->h = value;
            if(property == CLIPRECT_PROP) group->cliprect = value;
        }

        if(target->type == TEXT) {
            TextNode* textnode = (TextNode*)target;
            if(property == R) textnode->r = value;
            if(property == G) textnode->g = value;
            if(property == B) textnode->b = value;
            if(property == TEXT_PROP) textnode->text = text;
            if(property == FONTSIZE_PROP) textnode->fontsize = value;
            if(property == FONTID_PROP) textnode->fontid = value;
            textnode->refreshText();
        }

        if(target->type == POLY) {
            PolyNode* polynode = (PolyNode*)target;
            if(property == R) polynode->r = value;
            if(property == G) polynode->g = value;
            if(property == B) polynode->b = value;
            if(property == OPACITY_PROP) polynode->opacity = value;
            if(property == GEOMETRY) {
                polynode->geometry = arr;
            }
            if(property == DIMENSION) {
                polynode->dimension = value;
            }
            if(property == FILLED) {
                polynode->filled = value;
            }
        }
    }
};

static std::vector<Update*> updates;

inline Handle<Value> createRect(const Arguments& args) {
    HandleScope scope;
    Rect* rect = new Rect();
    rects.push_back(rect);
    rects.size();
    Local<Number> num = Number::New(rects.size()-1);
    return scope.Close(num);
}
inline Handle<Value> createPoly(const Arguments& args) {
    HandleScope scope;
    PolyNode* node = new PolyNode();
    rects.push_back(node);
    Local<Number> num = Number::New(rects.size()-1);
    return scope.Close(num);
}
inline Handle<Value> createText(const Arguments& args) {
    HandleScope scope;
    TextNode * node = new TextNode();
    rects.push_back(node);
    Local<Number> num = Number::New(rects.size()-1);
    return scope.Close(num);
}
inline Handle<Value> createGroup(const Arguments& args) {
    HandleScope scope;

    Group* node = new Group();
    rects.push_back(node);
    rects.size();

    Local<Number> num = Number::New(rects.size()-1);
    return scope.Close(num);
}
inline Handle<Value> createGLNode(const Arguments& args) {
    HandleScope scope;

    GLNode* node = new GLNode();
    node->callback = Persistent<Function>::New(Handle<Function>::Cast(args[0]));
    rects.push_back(node);
    rects.size();

    Local<Number> num = Number::New(rects.size()-1);
    return scope.Close(num);
}

inline Handle<Value> createAnim(const Arguments& args) {
    HandleScope scope;

    int rectHandle   = args[0]->ToNumber()->NumberValue();
    int property     = args[1]->ToNumber()->NumberValue();
    float start      = args[2]->ToNumber()->NumberValue();
    float end        = args[3]->ToNumber()->NumberValue();
    float duration   = args[4]->ToNumber()->NumberValue();

    Anim* anim = new Anim(rects[rectHandle],property, start,end,  duration);
    anims.push_back(anim);
    anims.size();
    Local<Number> num = Number::New(anims.size()-1);
    anim->id = anims.size()-1;
    anim->active = true;
    return scope.Close(num);
}


inline Handle<Value> stopAnim(const Arguments& args) {
	HandleScope scope;
	int id = args[0]->ToNumber()->NumberValue();
	Anim* anim = anims[id];
	anim->active = false;
	return scope.Close(Undefined());
}

static std::wstring GetWString(v8::Handle<v8::String> str) {
    std::wstring wstr = L"";
    uint16_t* buf = new uint16_t[str->Length()+1];
    str->Write(buf);
    for(int i=0; i<str->Length()+1; i++) {
        wstr.push_back(buf[i]);
    }
    return wstr;
}

static std::vector<float>* GetFloatArray(v8::Handle<v8::Array> obj) {
    Handle<Array>  oarray = Handle<Array>::Cast(obj);
    std::vector<float>* carray = new std::vector<float>();
    for(std::size_t i=0; i<oarray->Length(); i++) {
        carray->push_back((float)(oarray->Get(i)->ToNumber()->NumberValue()));
    }
    return carray;
}

inline Handle<Value> updateProperty(const Arguments& args) {
    HandleScope scope;
    int rectHandle   = args[0]->ToNumber()->NumberValue();
    int property     = args[1]->ToNumber()->NumberValue();
    float value = 0;
    std::wstring wstr = L"";
    if(args[2]->IsNumber()) {
        value = args[2]->ToNumber()->NumberValue();
    }
    if(args[2]->IsString()) {
        wstr = GetWString(args[2]->ToString());
    }
    std::vector<float>* arr = NULL;
    if(args[2]->IsArray()) {
        arr = GetFloatArray(v8::Handle<v8::Array>::Cast(args[2]));
    }
    updates.push_back(new Update(RECT, rectHandle, property, value, wstr,arr));
    return scope.Close(Undefined());
}

inline Handle<Value> updateAnimProperty(const Arguments& args) {
    HandleScope scope;
    int rectHandle   = args[0]->ToNumber()->NumberValue();
    int property     = args[1]->ToNumber()->NumberValue();
    float value = 0;
    //char* cstr = "";
    std::wstring wstr = L"";
    if(args[2]->IsNumber()) {
        value = args[2]->ToNumber()->NumberValue();
    }
    if(args[2]->IsString()) {
       char* cstr = TO_CHAR(args[2]);
        wstr = GetWC(cstr);
    }
    updates.push_back(new Update(ANIM, rectHandle, property, value, wstr, NULL));
    return scope.Close(Undefined());
}

inline Handle<Value> addNodeToGroup(const Arguments& args) {
    HandleScope scope;
    int rectHandle   = args[0]->ToNumber()->NumberValue();
    int groupHandle  = args[1]->ToNumber()->NumberValue();
    Group* group = (Group*)rects[groupHandle];
    AminoNode* node = rects[rectHandle];
    group->children.push_back(node);
    return scope.Close(Undefined());
}

inline Handle<Value> removeNodeFromGroup(const Arguments& args) {
    HandleScope scope;
    int rectHandle   = args[0]->ToNumber()->NumberValue();
    int groupHandle  = args[1]->ToNumber()->NumberValue();
    Group* group = (Group*)rects[groupHandle];
    AminoNode* node = rects[rectHandle];
    int n = -1;
    for(std::size_t i=0; i<group->children.size(); i++) {
        if(group->children[i] == node) {
            n = i;
        }
    }

    group->children.erase(group->children.begin()+n);
    return scope.Close(Undefined());
}

inline static Handle<Value> setRoot(const Arguments& args) {
    HandleScope scope;
    rootHandle = args[0]->ToNumber()->NumberValue();
    return scope.Close(Undefined());
}

inline static Handle<Value> loadJpegToTexture(const Arguments& args) {
    HandleScope scope;
    v8::String::Utf8Value param1(args[0]->ToString());
    std::string text = std::string(*param1);
    char * file = new char [text.length()+1];
    strcpy (file, text.c_str());
    printf("LoadJpegFromFile %s\n",file);
    Image* image = jpegfile_to_bytes(file);
    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    glPixelStorei(GL_UNPACK_ALIGNMENT,1);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, image->w, image->h, 0, GL_RGB, GL_UNSIGNED_BYTE, image->data);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    free(image->data);

    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("texid"), Number::New(texture));
    obj->Set(String::NewSymbol("w"),     Number::New(image->w));
    obj->Set(String::NewSymbol("h"),     Number::New(image->h));
    return scope.Close(obj);
}

inline static Handle<Value> loadPngToTexture(const Arguments& args) {
    HandleScope scope;
    v8::String::Utf8Value param1(args[0]->ToString());
    std::string text = std::string(*param1);
    char * file = new char [text.length()+1];
    strcpy (file, text.c_str());
    printf("LoadPngFromFile %s\n",file);
    Image* image = pngfile_to_bytes(file);
    if(image == 0) {
        printf("error loading\n");
        return scope.Close(Undefined());
    }

    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    glPixelStorei(GL_UNPACK_ALIGNMENT,1);
    if(image->hasAlpha) {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, image->w, image->h, 0, GL_RGBA, GL_UNSIGNED_BYTE, image->data);
    } else {
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, image->w, image->h, 0, GL_RGB, GL_UNSIGNED_BYTE, image->data);
    }
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    free(image->data);

    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("texid"), Number::New(texture));
    obj->Set(String::NewSymbol("w"),     Number::New(image->w));
    obj->Set(String::NewSymbol("h"),     Number::New(image->h));
    return scope.Close(obj);
}

inline static Handle<Value> loadBufferToTexture(const Arguments& args) {
    HandleScope scope;
    int texid   = args[0]->ToNumber()->NumberValue();
    int w   = args[1]->ToNumber()->NumberValue();
    int h   = args[2]->ToNumber()->NumberValue();
    Local<Object> bufferObj = args[3]->ToObject();
    char* bufferData = Buffer::Data(bufferObj);
    size_t bufferLength = Buffer::Length(bufferObj);

    assert(w*h*4 == bufferLength);

    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    glPixelStorei(GL_UNPACK_ALIGNMENT,1);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, bufferData);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("texid"), Number::New(texture));
    obj->Set(String::NewSymbol("w"),     Number::New(w));
    obj->Set(String::NewSymbol("h"),     Number::New(h));
    return scope.Close(obj);
}
/*static float* toFloatArray(Local<Object> obj, char* name) {
    Handle<Array>  oarray = Handle<Array>::Cast(obj->Get(String::New(name)));
    float* carray = new float[oarray->Length()];
    for(int i=0; i<oarray->Length(); i++) {
        carray[i] = oarray->Get(i)->ToNumber()->NumberValue();
    }
    return carray;
}
*/

typedef struct {
    float x, y, z;    // position
    float s, t;       // texture
    float r, g, b, a; // color
} vertex_t;


inline static Handle<Value> getFontHeight(const Arguments& args) {
    HandleScope scope;
    int fontsize   = args[0]->ToNumber()->NumberValue();
    int fontindex  = args[1]->ToNumber()->NumberValue();
    AminoFont * font = fontmap[fontindex];
    texture_font_t *tf = font->fonts[fontsize];
    Local<Number> num = Number::New(tf->ascender-tf->descender);
    return scope.Close(num);
}
inline static Handle<Value> getFontAscender(const Arguments& args) {
    HandleScope scope;
    int fontsize   = args[0]->ToNumber()->NumberValue();
    int fontindex  = args[1]->ToNumber()->NumberValue();
    AminoFont * font = fontmap[fontindex];
    std::map<int,texture_font_t*>::iterator it = font->fonts.find(fontsize);
    if(it == font->fonts.end()) {
        printf("Font is missing glyphs for size %d\n",fontsize);
        printf("loading size %d for font %s\n",fontsize,font->filename);
        font->fonts[fontsize] = texture_font_new(font->atlas, font->filename, fontsize);
    }
    texture_font_t *tf = font->fonts[fontsize];
    Local<Number> num = Number::New(tf->ascender);
    return scope.Close(num);
}
inline static Handle<Value> getFontDescender(const Arguments& args) {
    HandleScope scope;
    int fontsize   = args[0]->ToNumber()->NumberValue();
    int fontindex  = args[1]->ToNumber()->NumberValue();
    AminoFont * font = fontmap[fontindex];
    std::map<int,texture_font_t*>::iterator it = font->fonts.find(fontsize);
    if(it == font->fonts.end()) {
        printf("Font is missing glyphs for size %d\n",fontsize);
        printf("loading size %d for font %s\n",fontsize,font->filename);
        font->fonts[fontsize] = texture_font_new(font->atlas, font->filename, fontsize);
    }
    texture_font_t *tf = font->fonts[fontsize];
    Local<Number> num = Number::New(tf->descender);
    return scope.Close(num);
}
inline static Handle<Value> getCharWidth(const Arguments& args) {
    HandleScope scope;
    std::wstring wstr = GetWString(args[0]->ToString());

    int fontsize  = args[1]->ToNumber()->NumberValue();
    int fontindex  = args[2]->ToNumber()->NumberValue();

    AminoFont * font = fontmap[fontindex];
    assert(font);

    std::map<int,texture_font_t*>::iterator it = font->fonts.find(fontsize);
    if(it == font->fonts.end()) {
        printf("Font is missing glyphs for size %d\n",fontsize);
        printf("loading size %d for font %s\n",fontsize,font->filename);
        font->fonts[fontsize] = texture_font_new(font->atlas, font->filename, fontsize);
    }

    texture_font_t *tf = font->fonts[fontsize];
    assert( tf );

    float w = 0;
    //length seems to include the null string
    for(std::size_t i=0; i<wstr.length(); i++) {
        wchar_t ch  = wstr.c_str()[i];
        //skip null terminators
        if(ch == '\0') continue;
        texture_glyph_t *glyph = texture_font_get_glyph(tf, wstr.c_str()[i]);
        if(glyph == 0) {
            printf("WARNING. Got empty glyph from texture_font_get_glyph");
        }
        w += glyph->advance_x;
    }
    Local<Number> num = Number::New(w);
    return scope.Close(num);
}

inline static Handle<Value> createNativeFont(const Arguments& args) {
    HandleScope scope;

    AminoFont* afont = new AminoFont();
    int id = fontmap.size();
    fontmap[id] = afont;

    afont->filename = TO_CHAR(args[0]);
    printf("loading font file %s\n",afont->filename);


    afont->atlas = texture_atlas_new(512,512,1);
    afont->shader = shader_load("shaders/v3f-t2f-c4f.vert",
                         "shaders/v3f-t2f-c4f.frag");
    Local<Number> num = Number::New(id);
    return scope.Close(num);
}

static void sendValidate() {
    if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("validate"));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}


struct DebugEvent {
    double inputtime;
    double validatetime;
    double updatestime;
    double animationstime;
    double rendertime;
    double frametime;
    double framewithsynctime;
};

#endif
