#include "base.h"
#include "klaatu_events.h"
#include <binder/ProcessState.h>
#include "SimpleRenderer.h"


static float near = 150;
static float far = -300;
static float eye = 600;

using android::sp;
using android::ProcessState;

static EGLDisplay mEglDisplay = EGL_NO_DISPLAY;
static EGLSurface mEglSurface = EGL_NO_SURFACE;
static EGLContext mEglContext = EGL_NO_CONTEXT;
static sp<android::SurfaceComposerClient> mSession;
static sp<android::SurfaceControl>        mControl;
static sp<android::Surface>               mAndroidSurface;


void klaatu_init_graphics(int *width, int *height)
{
  
    android::DisplayInfo display_info;
    
    printf("initting klaatu graphics\n");


    // initial part shamelessly stolen from klaatu-api
  static EGLint sDefaultContextAttribs[] = {
    EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE };
  static EGLint sDefaultConfigAttribs[] = {
    EGL_SURFACE_TYPE, EGL_PBUFFER_BIT, EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
    EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8, EGL_ALPHA_SIZE, 8,
    EGL_DEPTH_SIZE, 16, EGL_STENCIL_SIZE, 8, EGL_NONE };


    mSession = new android::SurfaceComposerClient();
  int status = mSession->getDisplayInfo(0, &display_info);
  *width = display_info.w;
  *height = display_info.h;
  
  mControl = mSession->createSurface(0,
      *width, *height, android::PIXEL_FORMAT_RGB_888, 0);
  
  android::SurfaceComposerClient::openGlobalTransaction();
  mControl->setLayer(0x40000000);
  android::SurfaceComposerClient::closeGlobalTransaction();
  mAndroidSurface = mControl->getSurface();
  EGLNativeWindowType eglWindow = mAndroidSurface.get();
  mEglDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
  ASSERT_EQ(EGL_SUCCESS, eglGetError());
  ASSERT_NE(EGL_NO_DISPLAY, mEglDisplay);
  EGLint majorVersion, minorVersion;
  EXPECT_TRUE(eglInitialize(mEglDisplay, &majorVersion, &minorVersion));
  ASSERT_EQ(EGL_SUCCESS, eglGetError());

  EGLint numConfigs = 0;
  EGLConfig  mGlConfig;
  EXPECT_TRUE(eglChooseConfig(mEglDisplay, sDefaultConfigAttribs, &mGlConfig, 1, &numConfigs));
  mEglSurface = eglCreateWindowSurface(mEglDisplay, mGlConfig, eglWindow, NULL);
  ASSERT_EQ(EGL_SUCCESS, eglGetError());
  ASSERT_NE(EGL_NO_SURFACE, mEglSurface);
  mEglContext = eglCreateContext(mEglDisplay, mGlConfig, EGL_NO_CONTEXT, sDefaultContextAttribs);
  ASSERT_EQ(EGL_SUCCESS, eglGetError());
  ASSERT_NE(EGL_NO_CONTEXT, mEglContext);
  EXPECT_TRUE(eglMakeCurrent(mEglDisplay, mEglSurface, mEglSurface, mEglContext));
  ASSERT_EQ(EGL_SUCCESS, eglGetError());
  
}

Handle<Value> init(const Arguments& args) {
	matrixStack = std::stack<void*>();
    HandleScope scope;
    

    EGLint egl_major, egl_minor;
    const char *s;
    klaatu_init_graphics( &width, &height);
    if (!mEglDisplay) {
        printf("Error: eglGetDisplay() failed\n");
    }
    
    s = eglQueryString(mEglDisplay, EGL_VERSION);
    printf("EGL_VERSION = %s\n", s);
    s = eglQueryString(mEglDisplay, EGL_VENDOR);
    printf("EGL_VENDOR = %s\n", s);
    s = eglQueryString(mEglDisplay, EGL_EXTENSIONS);
    printf("EGL_EXTENSIONS = %s\n", s);
    s = eglQueryString(mEglDisplay, EGL_CLIENT_APIS);
    printf("EGL_CLIENT_APIS = %s\n", s);
    printf("GL_RENDERER   = %s\n", (char *) glGetString(GL_RENDERER));
    printf("GL_VERSION    = %s\n", (char *) glGetString(GL_VERSION));
    printf("GL_VENDOR     = %s\n", (char *) glGetString(GL_VENDOR));
    printf("GL_EXTENSIONS = %s\n", (char *) glGetString(GL_EXTENSIONS));
    printf(" window size = %d %d\n",width,height);
    
    
    return scope.Close(Undefined());
}


EventSingleton* eventSingleton;
class EVDispatcher : public EventSingleton {
public:
    bool down;
    EVDispatcher() {
        down = false;
    }
    virtual void touchStart(float rx, float ry, unsigned int tap_count=0, double time=0) { 
        if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
        if(down) {
            //printf("touch moving\n");
            Local<Object> event = Object::New();
            event->Set(String::NewSymbol("type"), String::New("mouseposition"));
            event->Set(String::NewSymbol("x"), Number::New(rx));
            event->Set(String::NewSymbol("y"), Number::New(ry));
            event->Set(String::NewSymbol("timestamp"), Number::New(time));
            Handle<Value> argv[] = {event};
            NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, argv);
        } else {
            down = true;
            //printf("touch starting\n");
            Local<Object> event = Object::New();
            Handle<Value> argv[] = {event};
            
            event->Set(String::NewSymbol("type"), String::New("mouseposition"));
            event->Set(String::NewSymbol("x"), Number::New(rx));
            event->Set(String::NewSymbol("y"), Number::New(ry));
            event->Set(String::NewSymbol("timestamp"), Number::New(time));
            NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, argv);
            
            event = Object::New();
            argv[0] = event;
            event->Set(String::NewSymbol("type"), String::New("mousebutton"));
            event->Set(String::NewSymbol("button"), Number::New(0));
            event->Set(String::NewSymbol("state"), Number::New(1));
            event->Set(String::NewSymbol("timestamp"), Number::New(time));
            NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, argv);
            
        }
    }
    virtual void touchMove(float rx, float ry, unsigned int tap_count=0) { 
        if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
        //printf("touch moving\n");
    }
    virtual void touchEnd(float rx, float ry, unsigned int tap_count=0) { 
        if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
        //printf("touch ending\n");
        Local<Object> event = Object::New();
        event->Set(String::NewSymbol("type"), String::New("mousebutton"));
        event->Set(String::NewSymbol("button"), Number::New(0));
        event->Set(String::NewSymbol("state"), Number::New(0));
        Handle<Value> argv[] = {event};
        NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, argv);
        down = false;
    }
};

Handle<Value> createWindow(const Arguments& args) {
    HandleScope scope;
    
    colorShader = new ColorShader();
    textureShader = new TextureShader();
    eventSingleton = new EVDispatcher();
    printf("enabling touch with screen size %d %d\n",width,height);
    enable_touch(width,height);
    
    modelView = new GLfloat[16];
    globaltx = new GLfloat[16];
    make_identity_matrix(globaltx);
    
    //have to start the threadpool first or we will get no sound
    ProcessState::self()->startThreadPool();
    glViewport(0,0,width, height);
    return scope.Close(Undefined());
}


// JOSH: NO-OP.  This is here just to match the desktop equivalents
Handle<Value> setWindowSize(const Arguments& args) {
    HandleScope scope;
    return scope.Close(Undefined());
}

Handle<Value> getWindowSize(const Arguments& args) {
    HandleScope scope;
    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("w"), Number::New(width));
    obj->Set(String::NewSymbol("h"), Number::New(height));
    return scope.Close(obj);
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

static const bool DEBUG_RENDER_LOOP = false;
void render() {
    DebugEvent de;
    double starttime = getTime();
    double start = getTime();
    if(DEBUG_RENDER_LOOP) {    printf("processing events\n"); }
    if(event_indication) {
        //((EVDispatcher*)eventSingleton)->cb = NODE_EVENT_CALLBACK;
        event_process();
    }
    
    double postinput = getTime();
    de.inputtime = postinput-starttime;

    sendValidate();
    double postvalidate = getTime();
    de.validatetime = postvalidate-postinput;
    

    int updatecount = updates.size();
    for(int j=0; j<updates.size(); j++) {
        updates[j]->apply();
    }
    updates.clear();
    double postupdates = getTime();
    de.updatestime = postupdates-postvalidate;


    for(int j=0; j<anims.size(); j++) {
        anims[j]->update();
    }

    double postanim = getTime();
    de.animationstime = postanim-postupdates;
    
    GLfloat* scaleM = new GLfloat[16];
    make_scale_matrix(1,-1,1,scaleM);
    GLfloat* transM = new GLfloat[16];
    make_trans_matrix(-width/2,height/2,0,transM);
    GLfloat* m4 = new GLfloat[16];
    mul_matrix(m4, transM, scaleM); 
    GLfloat* pixelM = new GLfloat[16];
    loadPixelPerfect(pixelM, width, height, eye, near, far);
    mul_matrix(modelView,pixelM,m4);
    make_identity_matrix(globaltx);
    glViewport(0,0,width, height);

    glClearColor(1,1,1,1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glDisable(GL_DEPTH_TEST);
    
    AminoNode* root = rects[rootHandle];
    SimpleRenderer* rend = new SimpleRenderer();
    double prerender = getTime();
    rend->startRender(root);
    delete rend;
    double postrender = getTime();
    de.rendertime = postrender-prerender;
    de.frametime = postrender-starttime;
    eglSwapBuffers(mEglDisplay, mEglSurface);
    double postswap = getTime();
    de.framewithsynctime = postswap-starttime;
    printf("input = %6.2f validate = %.2f update = %.2f update count %d ",  de.inputtime, de.validatetime, de.updatestime, updatecount);
    printf("animtime = %.2f render = %.2f frame = %.2f, full frame = %.2f\n", de.animationstime, de.rendertime, de.frametime, de.framewithsynctime);
}

Handle<Value> runTest(const Arguments& args) {
    HandleScope scope;
    
    double startTime = getTime();
    int count = 100;
    Local<v8::Object> opts = args[0]->ToObject();
    count = (int)(opts
        ->Get(String::NewSymbol("count"))
        ->ToNumber()
        ->NumberValue()
        );
    
    
    bool sync = false;
    sync = opts
        ->Get(String::NewSymbol("sync"))
        ->ToBoolean()
        ->BooleanValue();
        
    printf("rendering %d times, vsync = %d\n",count,sync);

    printf("applying updates first\n");
    for(int j=0; j<updates.size(); j++) {
        updates[j]->apply();
    }
    updates.clear();
    
    printf("setting up the screen\n");
    GLfloat* scaleM = new GLfloat[16];
    make_scale_matrix(1,-1,1,scaleM);
    //make_scale_matrix(1,1,1,scaleM);
    GLfloat* transM = new GLfloat[16];
    make_trans_matrix(-width/2,height/2,0,transM);
    //make_trans_matrix(10,10,0,transM);
    //make_trans_matrix(0,0,0,transM);
    
    GLfloat* m4 = new GLfloat[16];
    mul_matrix(m4, transM, scaleM); 


    GLfloat* pixelM = new GLfloat[16];
//    loadPixelPerfect(pixelM, width, height, 600, 100, -150);
    loadPixelPerfect(pixelM, width, height, eye, near, far);
    //printf("eye = %f\n",eye);
    //loadPerspectiveMatrix(pixelM, 45, 1, 10, -100);
    
//    GLfloat* m5 = new GLfloat[16];
    //transpose(m5,pixelM);
    
    mul_matrix(modelView,pixelM,m4);
    make_identity_matrix(globaltx);
    glViewport(0,0,width, height);

    glClearColor(1,1,1,1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glDisable(GL_DEPTH_TEST);
    printf("running %d times\n",count);
    for(int i=0; i<count; i++) {
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        AminoNode* root = rects[rootHandle];
        SimpleRenderer* rend = new SimpleRenderer();
        rend->startRender(root);
        delete rend;
        if(sync) {
            eglSwapBuffers(mEglDisplay, mEglSurface);
        }
    }
    
    double endTime = getTime();
    Local<Object> ret = Object::New();
    ret->Set(String::NewSymbol("count"),Number::New(count));
    ret->Set(String::NewSymbol("totalTime"),Number::New(endTime-startTime));
    return scope.Close(ret);
}


Handle<Value> tick(const Arguments& args) {
    HandleScope scope;
    render();
    return scope.Close(Undefined());
}


Handle<Value> selfDrive(const Arguments& args) {
    HandleScope scope;
    for(int i =0; i<100; i++) {
        render();
    }
    return scope.Close(Undefined());
}

Handle<Value> setEventCallback(const Arguments& args) {
    HandleScope scope;
    eventCallbackSet = true;
    NODE_EVENT_CALLBACK = Persistent<Function>::New(Handle<Function>::Cast(args[0]));
    return scope.Close(Undefined());
}


void InitAll(Handle<Object> exports, Handle<Object> module) {
    exports->Set(String::NewSymbol("init"),             FunctionTemplate::New(init)->GetFunction());
    exports->Set(String::NewSymbol("createWindow"),     FunctionTemplate::New(createWindow)->GetFunction());
    exports->Set(String::NewSymbol("setWindowSize"),    FunctionTemplate::New(setWindowSize)->GetFunction());
    exports->Set(String::NewSymbol("getWindowSize"),    FunctionTemplate::New(getWindowSize)->GetFunction());
    exports->Set(String::NewSymbol("createRect"),       FunctionTemplate::New(createRect)->GetFunction());
    exports->Set(String::NewSymbol("createGroup"),      FunctionTemplate::New(createGroup)->GetFunction());
    exports->Set(String::NewSymbol("createText"),       FunctionTemplate::New(createText)->GetFunction());
    exports->Set(String::NewSymbol("createAnim"),       FunctionTemplate::New(createAnim)->GetFunction());
    exports->Set(String::NewSymbol("stopAnim"),         FunctionTemplate::New(stopAnim)->GetFunction());
    exports->Set(String::NewSymbol("updateProperty"),   FunctionTemplate::New(updateProperty)->GetFunction());
    exports->Set(String::NewSymbol("updateAnimProperty"),FunctionTemplate::New(updateAnimProperty)->GetFunction());
    exports->Set(String::NewSymbol("addNodeToGroup"),   FunctionTemplate::New(addNodeToGroup)->GetFunction());
    exports->Set(String::NewSymbol("tick"),             FunctionTemplate::New(tick)->GetFunction());
    exports->Set(String::NewSymbol("selfDrive"),        FunctionTemplate::New(selfDrive)->GetFunction());
    exports->Set(String::NewSymbol("setEventCallback"), FunctionTemplate::New(setEventCallback)->GetFunction());
    exports->Set(String::NewSymbol("setRoot"),          FunctionTemplate::New(setRoot)->GetFunction());
    exports->Set(String::NewSymbol("loadPngToTexture"), FunctionTemplate::New(loadPngToTexture)->GetFunction());   
    exports->Set(String::NewSymbol("loadJpegToTexture"),FunctionTemplate::New(loadJpegToTexture)->GetFunction());
    exports->Set(String::NewSymbol("createNativeFont"), FunctionTemplate::New(createNativeFont)->GetFunction());
    exports->Set(String::NewSymbol("getCharWidth"),     FunctionTemplate::New(getCharWidth)->GetFunction());
    exports->Set(String::NewSymbol("getFontHeight"),    FunctionTemplate::New(getFontHeight)->GetFunction());
    exports->Set(String::NewSymbol("runTest"),          FunctionTemplate::New(runTest)->GetFunction());
}

NODE_MODULE(aminonative, InitAll)

