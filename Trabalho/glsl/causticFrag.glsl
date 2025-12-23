#include <common>
#include <packing>

#ifndef PI
#define PI 3.14159265359
#endif

uniform sampler2D tDepth;
uniform sampler2D tCaustics;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;

uniform mat4 inverseViewProjection;
uniform vec3 lightDirection;
uniform float causticsScale;
uniform float causticsSpeed;
uniform float causticsStrength;
uniform float causticsSplit;
uniform vec3 causticsColor;
uniform float boxSize;
uniform float waterLevel;

uniform float u_pointsize;
uniform float u_noise_amp_1;
uniform float u_noise_freq_1;
uniform float u_spd_modifier_1;
uniform float u_noise_amp_2;
uniform float u_noise_freq_2;
uniform float u_spd_modifier_2;

varying vec2 vUV;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
	
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f*f*(3.0-2.0*f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
              sin(angle),cos(angle));
}

//getter que me da a altura onda
float getWaveHeight(vec2 pos) {
    // Converter world.xz para local.xy da água
    vec2 localPos = vec2(pos.x, -pos.y); 
    
    float height = 0.0;
    height += noise(localPos * u_noise_freq_1 + time * u_spd_modifier_1) * u_noise_amp_1;
    height += noise(rotate2d(PI / 6.0) * localPos.yx * u_noise_freq_2 - time * u_spd_modifier_2 * 0.6) * u_noise_amp_2;
    return height;
}

//Cria o efeito de movimento da caustica
vec2 panner(vec2 uv, float speed, float tiling)
{
    return (vec2(1.0, 0.0) * time * speed) + (uv * tiling);
}

//Caustica com efeito de refração da luz aplicado no RGB
vec3 sampleCaustics(vec2 uv, float split)
{
    vec2 uv1 = uv + vec2(split, split);
    vec2 uv2 = uv + vec2(split, -split);
    vec2 uv3 = uv + vec2(-split, -split);

    float r = texture2D(tCaustics, uv1).r;
    float g = texture2D(tCaustics, uv2).r;
    float b = texture2D(tCaustics, uv3).r;

    return vec3(r, g, b);
}

float getDepth(vec2 screenUV)
{
    return texture2D(tDepth, screenUV).x;
}

// Getter pra me retorna as coordenadas no mundo convertendo depth e screenUV
vec3 getWorldPosition(vec2 screenUV, float depth)
{
    vec4 clipPos = vec4(screenUV * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = inverseViewProjection * clipPos;
    return worldPos.xyz / worldPos.w;
}

void main()
{
    gl_FragColor = vec4(0.0);
    
    vec2 screenUV = gl_FragCoord.xy / resolution;
    float depth = getDepth(screenUV);
    
    //descarte fora de profundidade
    if(depth >= 0.9999 || depth <= 0.0001)
    {
        return;
    }
    
    vec3 worldPos = getWorldPosition(screenUV, depth);
    
    // Descarta valores que estejam fora da Box
    float halfBox = boxSize / 2.0;
    if(abs(worldPos.x) > halfBox || abs(worldPos.z) > halfBox)
    {
        return;
    }
    
    // Calcular altura da onda neste ponto XZ
    float waveHeight = getWaveHeight(worldPos.xz);
    float dynamicWaterLevel = waterLevel + waveHeight;
    
    // Só renderiza abaixo da água (
    if(worldPos.y > dynamicWaterLevel)
    {
        return;
    }
    
    // UVs das cáusticas com distorção da onda
    vec2 causticsUV = worldPos.xz;
    causticsUV += vec2(waveHeight * 0.5);
    causticsUV += lightDirection.xz * (dynamicWaterLevel - worldPos.y) * 0.15;
    
    vec2 uv1 = panner(causticsUV, 0.75 * causticsSpeed, 1.0 / causticsScale);
    vec2 uv2 = panner(causticsUV, 1.0 * causticsSpeed, -1.0 / causticsScale);

    //textura das causticas com efeito de refração
    vec3 tex1 = sampleCaustics(uv1, causticsSplit);
    vec3 tex2 = sampleCaustics(uv2, causticsSplit);
    
    //combia as duas texturas e faz ajustes de cor e intensidade
    vec3 caustics = min(tex1, tex2);
    caustics = pow(caustics, vec3(1.5));
    caustics *= causticsStrength;
    caustics *= causticsColor;
    
    // Fade baseado na profundidade
    float depthBelowWater = dynamicWaterLevel - worldPos.y;
    float depthFade = 1.0 - smoothstep(0.0, 5.0, depthBelowWater);
    depthFade = clamp(depthFade, 0.2, 1.0);
    
    caustics *= depthFade;
    caustics = clamp(caustics, 0.0, 0.5);
    
    gl_FragColor = vec4(caustics, 0.75);
}