//
// Radial ramp function
//

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979

void main() {
    vec2 uv = vUvs;
    float s = 1. - length(uv * 2. - 1.);
    shaderOut = vec4(vec3(s), 1.0);
}
