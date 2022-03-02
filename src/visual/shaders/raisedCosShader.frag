//
// Raised-cosine function:
// https://en.wikipedia.org/wiki/Raised-cosine_filter
//

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uBeta;
uniform float uPeriod;

void main() {
    vec2 uv = vUvs;
    float absX = length(uv * 2. - 1.);
    float edgeArgument1 = (1. - uBeta) / (2. * uPeriod);
    float edgeArgument2 = (1. + uBeta) / (2. * uPeriod);
    float frequencyFactor = (M_PI * uPeriod) / uBeta;
    float s = .5 * (1. + cos(frequencyFactor * (absX - edgeArgument1)));
    if (absX <= edgeArgument1) {
        s = 1.;
    } else if (absX > edgeArgument2) {
        s = 0.;
    }
    shaderOut = vec4(vec3(s), 1.0);
}
