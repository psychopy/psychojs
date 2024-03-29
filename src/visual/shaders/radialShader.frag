/**
 * Radial grating.
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d radial grating image. Based on https://www.shadertoy.com/view/wtjGzt
 * @usedby GratingStim.js
 */

#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;
uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;

#define M_PI 3.14159265358979
#define PI2 2.* M_PI

float aastep(float x) {     // --- antialiased step(.5)
    float w = fwidth(x);    // pixel width. NB: x must not be discontinuous or factor discont out
    return smoothstep(.7,-.7,(abs(fract(x-.25)-.5)-.25)/w); // just use (offseted) smooth squares
}

void main() {
    vec2 uv = vUvs * 2. - 1.;
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    float v = uFreq * atan(uv.y, uv.x) / 6.28;
    float s = aastep(v) * 2. - 1.;
    shaderOut = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
