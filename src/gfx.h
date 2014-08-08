#ifndef AMINOGFX
#define AMINOGFX
#include "freetype-gl.h"
#include "vertex-buffer.h"

#ifdef MAC
#include <GL/glfw.h>
#include <stdlib.h>
#include <sys/time.h>

//return the current time in msec
static double getTime(void) {
    timeval time;
    gettimeofday(&time, NULL);
    double millis = (time.tv_sec * 1000.0) + (time.tv_usec / 1000.0);    
    return millis;
}

#endif

#ifdef KLAATU
#include <ui/DisplayInfo.h>
#include <ui/FramebufferNativeWindow.h>
#include <gui/SurfaceComposerClient.h>

//return the current time in msec
static double getTime(void) {
    struct timespec res;
    clock_gettime(CLOCK_REALTIME, &res);
    return 1000.0 * res.tv_sec + ((double) res.tv_nsec / 1e6);
}
#endif

#ifdef LINUX
#include <GL/glfw.h>
#include <GL/glext.h>
#include <sys/time.h>
//return the current time in msec
static double getTime(void) {
    timeval time;
    gettimeofday(&time, NULL);
    double millis = (time.tv_sec * 1000.0) + (time.tv_usec / 1000.0);    
    return millis;
}
#endif

#ifdef RPI
#include "GLES/gl.h"
#include "GLES2/gl2.h"
#include "GLES2/gl2ext.h"
//return the current time in msec
static double getTime(void) {
    struct timespec res;
    clock_gettime(CLOCK_REALTIME, &res);
    return 1000.0 * res.tv_sec + ((double) res.tv_nsec / 1e6);
}
#endif


#include <map>
class AminoFont {
public:
    int id;
    texture_atlas_t *atlas;
    std::map<int,texture_font_t*> fonts;
    GLuint shader;
    GLint texuni;
    GLint mvpuni;
    GLint transuni;
    AminoFont() {
        texuni = -1;
    }
};

#endif
