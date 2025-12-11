#include <common>
#include <packing>

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

varying vec2 vUV;
varying vec3 vWorldPos;

// UVs que se mexem
vec2 panner(vec2 uv, float speed, float tiling)
{
    return (vec2(1.0, 0.0) * time * speed) + (uv * tiling);
}

//Efeito LGBT 
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

float getLinearDepth(float depth)
{
    return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
}

// Converte de screen space pra clip e de clip pra world space
vec3 getWorldPosition(vec2 screenUV, float depth)
{
    vec4 clipPos = vec4(screenUV * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = inverseViewProjection * clipPos;
    return worldPos.xyz / worldPos.w;
}

void main()
{
    vec2 screenUV = gl_FragCoord.xy / resolution;
    float depth = getDepth(screenUV);
    
    // Descartar pixels muito distantes
    if(depth > 0.9999)
    {
        discard;
    }
    
    vec3 worldPos = getWorldPosition(screenUV, depth);
    vec2 causticsUV = worldPos.xz;
    
    // Aplicar influência da direção da luz
    causticsUV += lightDirection.xz * worldPos.y * 0.1;
    
    vec2 uv1 = panner(causticsUV, 0.75 * causticsSpeed, 1.0 / causticsScale);
    vec2 uv2 = panner(causticsUV, 1.0 * causticsSpeed, -1.0 / causticsScale);

    vec3 tex1 = sampleCaustics(uv1, causticsSplit);
    vec3 tex2 = sampleCaustics(uv2, causticsSplit);
    
    vec3 caustics = min(tex1, tex2) * causticsStrength;

    caustics *= causticsColor;
    
    float waterLevel = 1.5; 
    float heightMask = smoothstep(waterLevel, waterLevel - 0.5, worldPos.y);

    // Fade baseado na profundidade
    float depthFade = 1.0 - smoothstep(waterLevel - 3.0, waterLevel - 0.5, worldPos.y);
    depthFade = clamp(depthFade, 0.3, 1.0);
    
    caustics *= heightMask * depthFade;
    gl_FragColor = vec4(caustics, 1.0);
}