/**
 * Radial Ramp.
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d radial ramp image.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;
uniform float uSqueeze;

#define M_PI 3.14159265358979

void main() {
    vec2 uv = vUvs;
    float s = 1. - length(uv * 2. - 1.) * uSqueeze;
    shaderOut = vec4(vec3(s), 1.0);
}
