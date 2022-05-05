/**
 * Cross Shape.
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates a filled cross shape with sharp edges.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uThickness;
uniform vec3 uColor;

void main() {
    vec2 uv = vUvs;
    float sx = step(uThickness, length(uv.x * 2. - 1.));
    float sy = step(uThickness, length(uv.y * 2. - 1.));
    float s = 1. - sx * sy;
    shaderOut = vec4(vec3(s) * uColor, 1.0);
}
