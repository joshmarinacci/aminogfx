
#include "base.h"
#include "SimpleRenderer.h"

// ========== Event Callbacks ===========

static bool windowSizeChanged = true;
static void GLFW_WINDOW_SIZE_CALLBACK_FUNCTION(int newWidth, int newHeight) {
	width = newWidth;
	height = newHeight;
	windowSizeChanged = true;
    if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("windowsize"));
    event_obj->Set(String::NewSymbol("width"), Number::New(width));
    event_obj->Set(String::NewSymbol("height"), Number::New(height));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}
static int GLFW_WINDOW_CLOSE_CALLBACK_FUNCTION(void) {
    if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("windowclose"));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
    return GL_TRUE;
}
static float near = 150;
static float far = -300;
static float eye = 600;

static void GLFW_KEY_CALLBACK_FUNCTION(int key, int action) {
    if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
    Local<Object> event_obj = Object::New();
    if(action == 1) {
        event_obj->Set(String::NewSymbol("type"), String::New("keypress"));
    }
    if(action == 0) {
        event_obj->Set(String::NewSymbol("type"), String::New("keyrelease"));
    }
    event_obj->Set(String::NewSymbol("keycode"), Number::New(key));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}


static void GLFW_MOUSE_POS_CALLBACK_FUNCTION(int x, int y) {
    if(!eventCallbackSet) warnAbort("WARNING. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("mouseposition"));
    event_obj->Set(String::NewSymbol("x"), Number::New(x));
    event_obj->Set(String::NewSymbol("y"), Number::New(y));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}

static void GLFW_MOUSE_BUTTON_CALLBACK_FUNCTION(int button, int state) {
    if(!eventCallbackSet) warnAbort("ERROR. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("mousebutton"));
    event_obj->Set(String::NewSymbol("button"), Number::New(button));
    event_obj->Set(String::NewSymbol("state"), Number::New(state));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}

static void GLFW_MOUSE_WHEEL_CALLBACK_FUNCTION(int wheel) {
    if(!eventCallbackSet) warnAbort("ERROR. Event callback not set");
    Local<Object> event_obj = Object::New();
    event_obj->Set(String::NewSymbol("type"), String::New("mousewheelv"));
    event_obj->Set(String::NewSymbol("position"), Number::New(wheel));
    Handle<Value> event_argv[] = {event_obj};
    NODE_EVENT_CALLBACK->Call(Context::GetCurrent()->Global(), 1, event_argv);
}

Handle<Value> init(const Arguments& args) {
	matrixStack = std::stack<void*>();
    HandleScope scope;
    if(!glfwInit()) {
        printf("error. quitting\n");
        glfwTerminate();
        exit(EXIT_FAILURE);
    }
    return scope.Close(Undefined());
}


Handle<Value> createWindow(const Arguments& args) {
    HandleScope scope;
    int w  = args[0]->ToNumber()->NumberValue();
    int h  = args[1]->ToNumber()->NumberValue();
    width = w;
    height = h;
    glfwOpenWindowHint(GLFW_OPENGL_VERSION_MAJOR, 2);
    glfwOpenWindowHint(GLFW_OPENGL_VERSION_MINOR, 1);
    //glfwOpenWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    //glfwOpenWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    //    if(!glfwOpenWindow(800,600, 0,0,0,0,0,0, GLFW_WINDOW)) {
    if(!glfwOpenWindow(width,height, 8, 8, 8, 0, 24, 8, GLFW_WINDOW)) {
        printf("couldn't open a window. quitting\n");
        glfwTerminate();
        exit(EXIT_FAILURE);
    }

    glfwSetWindowSizeCallback(GLFW_WINDOW_SIZE_CALLBACK_FUNCTION);
    glfwSetWindowCloseCallback(GLFW_WINDOW_CLOSE_CALLBACK_FUNCTION);
    glfwSetMousePosCallback(GLFW_MOUSE_POS_CALLBACK_FUNCTION);
    glfwSetMouseButtonCallback(GLFW_MOUSE_BUTTON_CALLBACK_FUNCTION);
    glfwSetKeyCallback(GLFW_KEY_CALLBACK_FUNCTION);
    glfwSetMouseWheelCallback(GLFW_MOUSE_WHEEL_CALLBACK_FUNCTION);

    colorShader = new ColorShader();
    textureShader = new TextureShader();
    modelView = new GLfloat[16];

    globaltx = new GLfloat[16];
    make_identity_matrix(globaltx);




    glViewport(0,0,width, height);
    return scope.Close(Undefined());
}

Handle<Value> setWindowSize(const Arguments& args) {
    HandleScope scope;
    int w  = args[0]->ToNumber()->NumberValue();
    int h  = args[1]->ToNumber()->NumberValue();
    width = w;
    height = h;
    glfwSetWindowSize(width,height);
    return scope.Close(Undefined());
}

Handle<Value> getWindowSize(const Arguments& args) {
    HandleScope scope;
    Local<Object> obj = Object::New();
    obj->Set(String::NewSymbol("w"), Number::New(width));
    obj->Set(String::NewSymbol("h"), Number::New(height));
    return scope.Close(obj);
}


static int FPS_LEN = 100;
static double frametimes[100];
static double avg_frametime = 0;
static int currentFrame = 0;
void render() {
    DebugEvent de;
    double starttime = getTime();
    //input updates happen at any time
    double postinput = getTime();
    de.inputtime = postinput-starttime;

    //send the validate event

    sendValidate();
    double postvalidate = getTime();
    de.validatetime = postvalidate-postinput;

    //std::size_t updatecount = updates.size();
    //apply processed updates
    for(std::size_t j=0; j<updates.size(); j++) {
        updates[j]->apply();
    }
    updates.clear();
    double postupdates = getTime();
    de.updatestime = postupdates-postvalidate;

    //apply animations
    for(std::size_t j=0; j<anims.size(); j++) {
        anims[j]->update();
    }
    double postanim = getTime();
    de.animationstime = postanim-postupdates;

    //set up the viewport
    GLfloat* scaleM = new GLfloat[16];
    make_scale_matrix(1,-1,1,scaleM);
    GLfloat* transM = new GLfloat[16];
    make_trans_matrix(-((float)width)/2,((float)height)/2,0,transM);
    GLfloat* m4 = new GLfloat[16];
    mul_matrix(m4, transM, scaleM);
    GLfloat* pixelM = new GLfloat[16];
    loadPixelPerfect(pixelM, width, height, eye, near, far);
    mul_matrix(modelView,pixelM,m4);
    make_identity_matrix(globaltx);
    glViewport(0,0,width, height);
    glClearColor(0,0,0,1);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glDisable(GL_DEPTH_TEST);

    //draw
    AminoNode* root = rects[rootHandle];

    SimpleRenderer* rend = new SimpleRenderer();
    double prerender = getTime();
    rend->modelViewChanged = windowSizeChanged;
    windowSizeChanged = false;
    rend->startRender(root);
    delete rend;
    double postrender = getTime();
    de.rendertime = postrender-prerender;
    de.frametime = postrender-starttime;

    //swap
    glfwSwapBuffers();
    double postswap = getTime();
    de.framewithsynctime = postswap-starttime;
    frametimes[currentFrame] = de.framewithsynctime;
    if(currentFrame == FPS_LEN-1) {
        double total = 0;
        for(int i=0; i<FPS_LEN; i++) {
            total += frametimes[i];
        }
        //printf("avg frame len = %f \n",(total/FPS_LEN));
        avg_frametime = total/FPS_LEN;
    }
    currentFrame = (currentFrame+1)%FPS_LEN;
//    printf("input = %.2f validate = %.2f update = %.2f update count %d ",  de.inputtime, de.validatetime, de.updatestime, updatecount);
//    printf("animtime = %.2f render = %.2f frame = %.2f, full frame = %.2f\n", de.animationstime, de.rendertime, de.frametime, de.framewithsynctime);
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
    for(std::size_t j=0; j<updates.size(); j++) {
        updates[j]->apply();
    }
    updates.clear();

    printf("setting up the screen\n");
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
    glDisable(GL_DEPTH_TEST);
    printf("running %d times\n",count);
    for(int i=0; i<count; i++) {
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        AminoNode* root = rects[rootHandle];
        SimpleRenderer* rend = new SimpleRenderer();
        rend->startRender(root);
        delete rend;
        if(sync) {
            glfwSwapBuffers();
        }
    }

    double endTime = getTime();
    Local<Object> ret = Object::New();
    ret->Set(String::NewSymbol("count"),Number::New(count));
    ret->Set(String::NewSymbol("totalTime"),Number::New(endTime-startTime));
    return scope.Close(ret);
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
    exports->Set(String::NewSymbol("createPoly"),       FunctionTemplate::New(createPoly)->GetFunction());
    exports->Set(String::NewSymbol("createGroup"),      FunctionTemplate::New(createGroup)->GetFunction());
    exports->Set(String::NewSymbol("createText"),       FunctionTemplate::New(createText)->GetFunction());
    exports->Set(String::NewSymbol("createGLNode"),     FunctionTemplate::New(createGLNode)->GetFunction());
    exports->Set(String::NewSymbol("createAnim"),       FunctionTemplate::New(createAnim)->GetFunction());
    exports->Set(String::NewSymbol("stopAnim"),         FunctionTemplate::New(stopAnim)->GetFunction());
    exports->Set(String::NewSymbol("updateProperty"),   FunctionTemplate::New(updateProperty)->GetFunction());
    exports->Set(String::NewSymbol("updateAnimProperty"),FunctionTemplate::New(updateAnimProperty)->GetFunction());
    exports->Set(String::NewSymbol("addNodeToGroup"),   FunctionTemplate::New(addNodeToGroup)->GetFunction());
    exports->Set(String::NewSymbol("removeNodeFromGroup"),   FunctionTemplate::New(removeNodeFromGroup)->GetFunction());
    exports->Set(String::NewSymbol("tick"),             FunctionTemplate::New(tick)->GetFunction());
    exports->Set(String::NewSymbol("selfDrive"),        FunctionTemplate::New(selfDrive)->GetFunction());
    exports->Set(String::NewSymbol("setEventCallback"), FunctionTemplate::New(setEventCallback)->GetFunction());
    exports->Set(String::NewSymbol("setRoot"),          FunctionTemplate::New(setRoot)->GetFunction());
    exports->Set(String::NewSymbol("loadPngToTexture"), FunctionTemplate::New(loadPngToTexture)->GetFunction());
    exports->Set(String::NewSymbol("loadJpegToTexture"),FunctionTemplate::New(loadJpegToTexture)->GetFunction());
    exports->Set(String::NewSymbol("createNativeFont"), FunctionTemplate::New(createNativeFont)->GetFunction());
    exports->Set(String::NewSymbol("getCharWidth"),     FunctionTemplate::New(getCharWidth)->GetFunction());
    exports->Set(String::NewSymbol("getFontHeight"),    FunctionTemplate::New(getFontHeight)->GetFunction());
    exports->Set(String::NewSymbol("getFontAscender"),    FunctionTemplate::New(getFontAscender)->GetFunction());
    exports->Set(String::NewSymbol("getFontDescender"),    FunctionTemplate::New(getFontDescender)->GetFunction());
    exports->Set(String::NewSymbol("runTest"),          FunctionTemplate::New(runTest)->GetFunction());
}

NODE_MODULE(aminonative, InitAll)
