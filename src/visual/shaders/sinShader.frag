/**
 * Sine wave.
 * https://en.wikipedia.org/wiki/Sine_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d sine wave image as if 1d sine graph was extended across Z axis and observed from above.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;

void main() {
    vec2 uv = vUvs;
    float s = sin(uFreq * uv.x * 2. * M_PI + uPhase);
    shaderOut = vec4(.5 + .5 * vec3(s), 1.0);
}
