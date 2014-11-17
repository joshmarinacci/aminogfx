uniform mat4 modelviewProjection;
uniform mat4 trans;
uniform float opacity;
attribute vec4 pos;
attribute vec2 texcoords;
varying vec2 uv;
varying float outopacity;
void main() {
   gl_Position = modelviewProjection * trans * pos;
   outopacity = opacity;
   uv = texcoords;
}
