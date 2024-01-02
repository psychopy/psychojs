/**
 * Gaussian Function.
 * https://en.wikipedia.org/wiki/Gaussian_function
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates a 2d Gaussian image as if 1d Gaussian graph was rotated arount Y axis and observed from above.
 * @usedby GratingStim.js
 */

precision mediump float;

varying vec2 vUvs;

uniform float uA;
uniform float uB;
uniform float uC;
uniform vec3 uColor;
uniform float uAlpha;

#define M_PI 3.14159265358979

void main() {
    vec2 uv = vUvs;
    float c2 = uC * uC;
    float x = length(uv - .5);
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    float g = uA * exp(-pow(x - uB, 2.) / c2 * .5) * 2. - 1.;
    gl_FragColor = vec4(vec3(g) * uColor * .5 + .5, 1.) * uAlpha;
}
