#include <common>
#include <packing>
#include <fog_pars_fragment>

uniform vec3 waterColor;
uniform vec3 foamColor;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;
uniform sampler2D tDepth;
uniform sampler2D tFoam;
uniform sampler2D tBottom;

varying float vWaveHeight;
varying vec2 vFoamUV;
varying vec3 vNormal;

uniform float edgePatternScale;

float getDepth(vec2 screenPosition) {
    return texture2D(tDepth, screenPosition).x;
}

float getViewZ(float depth) {
    return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
}

void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
    float linearEyeDepth = getViewZ(getDepth(screenUV));
    float depthDiff = linearEyeDepth - fragmentLinearEyeDepth + vWaveHeight;

    // Parâmetros para controlar a largura da espuma
    float foamStart = 0.01;
    float foamEnd = 4.0;

    // Gradiente suave para a espuma nas bordas
    float foamEdge = 1.0 - smoothstep(foamStart, foamEnd, abs(depthDiff));

    vec2 refractUV = vFoamUV + vNormal.xy * vWaveHeight * 0.1; 
    vec3 refractedColor = texture2D(tBottom, refractUV).rgb; 

    // Animação e contraste da espuma
    vec2 foamAnimUV = vFoamUV * edgePatternScale + vec2(time * 0.05, time * 0.03);
    float foamMask = texture2D(tFoam, foamAnimUV).r;
    foamMask = pow(foamMask, 0.5);

    float foam = foamEdge * foamMask;

    // Mistura a espuma na cor da água
    vec3 baseColor = mix(waterColor, refractedColor, 0.4);
    gl_FragColor = vec4(mix(baseColor, foamColor, foam), 0.8 + foam * 0.2);

    #include <fog_fragment>
}