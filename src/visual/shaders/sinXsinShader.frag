/**
 * Sine wave multiplied by another sine wave.
 * https://en.wikipedia.org/wiki/Sine_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates an image of two 2d sine waves multiplied with each other.
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979
#define PI2 2.* M_PI
uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vec2(vUvs.x - .25, vUvs.y * -1. - .25);
    float sx = sin((uFreq * uv.x + uPhase) * PI2);
    float sy = sin((uFreq * uv.y + uPhase) * PI2);
    float s = sx * sy;
    // it's important to convert to [0, 1] while multiplying to uColor, not before, to preserve desired coloring functionality
    shaderOut = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
