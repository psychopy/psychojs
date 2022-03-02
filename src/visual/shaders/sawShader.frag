//
// Sawtooth wave:
// https://en.wikipedia.org/wiki/Sawtooth_wave
//

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;

void main() {
    vec2 uv = vUvs;
    float s = uFreq * uv.x + uPhase;
    s = mod(s, 1.);
    shaderOut = vec4(vec3(s), 1.0);
}
