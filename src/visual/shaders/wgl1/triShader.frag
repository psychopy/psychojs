/**
 * Triangle wave.
 * https://en.wikipedia.org/wiki/Triangle_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d triangle wave image as if 1d triangle graph was extended across Z axis and observed from above.
 * @usedby GratingStim.js
 */

precision mediump float;

varying vec2 vUvs;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;
uniform float uPeriod;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vUvs;
    float s = uFreq * uv.x + uPhase;
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    s = (2. * abs(s / uPeriod - floor(s / uPeriod + .5))) * 2. - 1.;
    gl_FragColor = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
