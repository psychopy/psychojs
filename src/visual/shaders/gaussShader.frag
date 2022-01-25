#version 300 es
precision mediump float;

in vec2 vUvs;
out vec4 shaderOut;

#define M_PI 3.14159265358979

float gauss(float x) {
    return exp(-(x * x) * 20.);
}

void main() {
    vec2 uv = vUvs;
    float g = gauss(uv.x - .5) * gauss(uv.y - .5);
    shaderOut = vec4(vec3(g), 1.);
}
