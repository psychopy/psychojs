/**
 * Raised-cosine.
 * https://en.wikipedia.org/wiki/Raised-cosine_filter
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d raised-cosine image as if 1d raised-cosine graph was rotated around Y axis and observed from above.
 * @usedby GratingStim.js
 */

precision mediump float;

varying vec2 vUvs;

#define M_PI 3.14159265358979
uniform float uBeta;
uniform float uPeriod;
uniform vec3 uColor;
uniform float uAlpha;

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
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    s = s * 2. - 1.;
    gl_FragColor = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
