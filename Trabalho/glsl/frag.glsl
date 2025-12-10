#include <common>
#include <packing>
#include <fog_pars_fragment>

struct Material
{
    vec3 diffuseColor;
    vec3 specularColor;
    float shininess;
};

//uniform bool isOrthographic;
uniform vec3 waterColor;
uniform vec3 foamColor;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
uniform float threshold;
uniform float time;
uniform sampler2D tDepth;
uniform sampler2D tDudv;
uniform Material material;

uniform float edgePatternScale;
uniform float falloffDistance;
uniform float leadingEdgeFalloff;
uniform float edgeFalloffBias;

varying vec2 vUV;
varying vec3 vNormal;
varying vec3 viewDir;
varying vec3 fragPos;


const float strength = 1.0;

float getDepth(vec2 screenPosition)
{
    return texture2D(tDepth, screenPosition).x;
}

float getViewZ(float depth)
{
    if (isOrthographic)
        return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
    else
        return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
}

void main()
{
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
    float linearEyeDepth = getViewZ(getDepth(screenUV));

    float diff = saturate(fragmentLinearEyeDepth - linearEyeDepth);

    vec2 scaledUV = vUV * edgePatternScale;

    float channelA = texture2D(tDudv, scaledUV - vec2(time * 0.05, cos(vUV.x))).r;
    float channelB = texture2D(tDudv, scaledUV * 0.5 + vec2(sin(vUV.y), time * 0.05)).b;

    float mask = (channelA + channelB) * 0.95;
    mask = pow(mask, 2.0);
    mask = clamp(mask, 0.0, 1.0);

    gl_FragColor = vec4(waterColor, 1.0);

    if(diff < falloffDistance * leadingEdgeFalloff)
    {
        float leading = diff / (falloffDistance * leadingEdgeFalloff);
        gl_FragColor.a *= leading;
        mask *= leading;
    }

    float falloff = 1.0 - (diff / falloffDistance) + edgeFalloffBias;
    falloff = clamp(falloff, 0.0, 1.0);

    vec3 edge = foamColor * falloff;
    gl_FragColor.rgb += clamp(edge - vec3(mask), 0.0, 1.0); 
    gl_FragColor.a = 1.0;
}