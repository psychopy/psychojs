/**
 * Square wave.
 * https://en.wikipedia.org/wiki/Square_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d square wave image as if 1d square graph was extended across Z axis and observed from above.
 * @usedby GratingStim.js
 */

precision mediump float;

varying vec2 vUvs;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vUvs - .25;
    float s = sign(sin((uFreq * uv.x + uPhase) * 2. * M_PI));
    // it's important to convert to [0, 1] while multiplying to uColor, not before, to preserve desired coloring functionality
    gl_FragColor = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
