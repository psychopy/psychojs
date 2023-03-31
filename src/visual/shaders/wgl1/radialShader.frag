/**
 * Radial grating.
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates 2d radial grating image. Based on https://www.shadertoy.com/view/wtjGzt
 * @usedby GratingStim.js
 */
precision mediump float;

varying vec2 vUvs;

uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uStep;
uniform float uDX;

#define M_PI 3.14159265358979
#define PI2 2.* M_PI

float aastep(float x, float w) {     // --- antialiased step(.5)
    return smoothstep(.7,-.7,(abs(fract(x-.25)-.5)-.25)/w); // just use (offseted) smooth squares
}

void main() {
    vec2 uv = vUvs * 2. - 1.;
    float v = uFreq * atan(uv.y, uv.x) / 6.28;
    // WGL1 has dFdx, dFdy and fwidth() defined as part of OES_standard_derivatives extension.
    // BUT using this extension fails due to how currently used version of PIXI goes about shader program compilation.
    // Calculating derivatives manually instead.
    float dF_dx = (uFreq * (atan(uv.y, uv.x + uStep) - atan(uv.y, uv.x - uStep)) / 6.28) / uDX;
    float dF_dy = (uFreq * (atan(uv.y + uStep, uv.x) - atan(uv.y - uStep, uv.x)) / 6.28) / uDX;
    float w = abs(dF_dx) + abs(dF_dy);
    // converting first to [-1, 1] space to get the proper color functionality
    // then back to [0, 1]
    float s = aastep(v, w) * 2. - 1.;
    gl_FragColor = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
