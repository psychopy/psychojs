//
// Gaussian Function:
// https://en.wikipedia.org/wiki/Gaussian_function
//

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

uniform float uA;
uniform float uB;
uniform float uC;

#define M_PI 3.14159265358979

void main() {
    vec2 uv = vUvs;
    float c2 = uC * uC;
    float x = length(uv - .5);
    float g = uA * exp(-pow(x - uB, 2.) / c2 * .5);
    shaderOut = vec4(vec3(g), 1.);
}
