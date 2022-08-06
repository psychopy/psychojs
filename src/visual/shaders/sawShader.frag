/**
 * Sawtooth wave.
 * https://en.wikipedia.org/wiki/Sawtooth_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d sawtooth wave image as if 1d sawtooth graph was extended across Z axis and observed from above.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vUvs;
    float s = uFreq * uv.x + uPhase;
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    s = mod(s, 1.) * 2. - 1.;
    shaderOut = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
