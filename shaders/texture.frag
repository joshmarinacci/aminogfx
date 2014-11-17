varying vec2 uv;
varying float outopacity;
uniform sampler2D tex;
void main() {
   gl_FragColor = texture2D(tex,uv);
 }
