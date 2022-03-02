//
// Triangle wave:
// https://en.wikipedia.org/wiki/Triangle_wave
//

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;
uniform float uPeriod;

void main() {
    vec2 uv = vUvs;
    float s = uFreq * uv.x + uPhase;
    s = 2. * abs(s / uPeriod - floor(s / uPeriod + .5));
    shaderOut = vec4(vec3(s), 1.0);
}
