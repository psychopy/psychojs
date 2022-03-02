#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uThickness;

void main() {
    vec2 uv = vUvs;
    float sx = step(uThickness, length(uv.x - .5));
    float sy = step(uThickness, length(uv.y - .5));
    float s = 1. - sx * sy;
    shaderOut = vec4(vec3(s), 1.0);
}
