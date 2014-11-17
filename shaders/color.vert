uniform mat4 modelviewProjection;
uniform mat4 trans;
uniform float opacity;
attribute vec4 pos;
attribute vec4 color;
varying vec4 v_color;
void main() {
   gl_Position = modelviewProjection * trans * pos;
   v_color = vec4(color.r,color.g,color.b,opacity);
}
