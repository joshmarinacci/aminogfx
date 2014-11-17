#include "gfx.h"

class ColorShader {
public:
    ColorShader();
    int prog;
    GLint u_matrix, u_trans, u_opacity;
    GLint attr_pos;
    GLint attr_color;
};

class TextureShader {
public:
    TextureShader();
    int prog;
    GLint u_matrix, u_trans, u_opacity;
    GLint attr_pos;
    GLint attr_texcoords, attr_tex, texID;
};
