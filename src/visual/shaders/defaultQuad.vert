#version 300 es

precision mediump float;

in vec2 aVertexPosition;
in vec2 aUvs;
out vec2 vUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

void main() {
	vUvs = aUvs;
	gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
