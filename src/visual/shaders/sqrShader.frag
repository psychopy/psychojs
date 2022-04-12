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

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uFreq;
uniform float uPhase;

void main() {
    vec2 uv = vUvs;
    float s = sign(sin((uFreq * uv.x + uPhase) * 2. * M_PI));
    shaderOut = vec4(.5 + .5 * vec3(s), 1.0);
}
