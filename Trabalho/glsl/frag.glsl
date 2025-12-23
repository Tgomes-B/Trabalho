#include <common>
#include <packing>
#include <fog_pars_fragment>

uniform vec3 waterColor;
uniform vec3 foamColor;
varying vec3 vNormal;
uniform vec2 resolution;
varying vec2 vFoamUV;
uniform float edgePatternScale;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;
varying float vWaveHeight;
uniform sampler2D tDepth;
uniform sampler2D tFoam;
uniform sampler2D tDudv;
uniform sampler2D tUnderwater;

//funções getters de profundidade de um ponto na tela
// e profundiade do espaço de visão
float getDepth(vec2 screenPosition) {
    return texture2D(tDepth, screenPosition).x;
}

float getViewZ(float depth) {
    return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
}


void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    //calculo da diferença de profundidade
    float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
    float linearEyeDepth = getViewZ(getDepth(screenUV));
    float depthDiff = linearEyeDepth - fragmentLinearEyeDepth + vWaveHeight;

    // Calculo da espuma
    float foamStart = 0.01;
    float foamEnd = 4.0;
    float foamEdge = 1.0 - smoothstep(foamStart, foamEnd, abs(depthDiff));

    vec2 foamAnimUV = vFoamUV * edgePatternScale + vec2(time * 0.05, time * 0.03);
    float foamMask = texture2D(tFoam, foamAnimUV).r;
    foamMask = pow(foamMask, 0.5);

    //Calculo da refração
    vec2 dudv = texture2D(tDudv, screenUV + time * 0.05).rg * 2.0 - 1.0;
    vec2 refractUV = screenUV + dudv * 0.04 + vNormal.xz * vWaveHeight * 0.02;
    refractUV = clamp(refractUV, 0.0, 1.0);
    vec3 refractedColor = texture2D(tUnderwater, refractUV).rgb;

    //Combina a mask
    float foam = foamEdge * foamMask;

    vec3 baseColor = mix(waterColor, refractedColor, 0.4);
    gl_FragColor = vec4(mix(baseColor, foamColor, foam),0.8 + foam * 0.2);

}