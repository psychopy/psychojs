#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979

void main() {
    vec2 uv = vUvs;
    float s = 1. - step(.5, length(uv - .5));
    shaderOut = vec4(vec3(s), 1.0);
}
