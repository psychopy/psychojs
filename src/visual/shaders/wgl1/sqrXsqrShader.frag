/**
 * Square wave multiplied by another square wave.
 * https://en.wikipedia.org/wiki/Square_wave
 *
 * @author Nikita Agafonov
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 * @description Creates an image of two 2d square waves multiplied with each other.
 * @usedby GratingStim.js
 */

precision mediump float;

varying vec2 vUvs;

#define M_PI 3.14159265358979
#define PI2 2.* M_PI
uniform float uFreq;
uniform float uPhase;
uniform vec3 uColor;
uniform float uAlpha;

void main() {
    vec2 uv = vec2(vUvs.x - .25, vUvs.y * -1. - .25);
    float sx = sign(sin((uFreq * uv.x + uPhase) * PI2));
    float sy = sign(sin((uFreq * uv.y + uPhase) * PI2));
    float s = sx * sy;
    // it's important to convert to [0, 1] while multiplying to uColor, not before, to preserve desired coloring functionality
    gl_FragColor = vec4(vec3(s) * uColor * .5 + .5, 1.0) * uAlpha;
}
