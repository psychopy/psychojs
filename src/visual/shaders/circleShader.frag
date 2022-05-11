/**
 * Circle Shape.
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates a filled circle shape with sharp edges.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
uniform float uRadius;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vUvs;
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    float s = (1. - step(uRadius, length(uv * 2. - 1.))) * 2. - 1.;
    shaderOut = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
