#include <common>
#include <uv_pars_vertex>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>

attribute vec4 tangent;

varying vec3 fragPos;
varying vec3 viewDir;
varying vec2 vUV;
uniform float u_time;
uniform float u_pointsize;
uniform float u_noise_amp_1;
uniform float u_noise_freq_1;
uniform float u_spd_modifier_1;
uniform float u_noise_amp_2;
uniform float u_noise_freq_2;
uniform float u_spd_modifier_2;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
              sin(angle),cos(angle));
}


void main()
{
	#include <uv_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>

    /*vUV = uv;
    vNormal = normalize(normalMatrix * normal);
    fragPos = vec3(modelViewMatrix * vec4(position, 1.0));
    viewDir = normalize(-fragPos);*/
    
	gl_PointSize = u_pointsize;

	vec3 pos = position;

	pos.z += noise(pos.xy * u_noise_freq_1 + u_time * u_spd_modifier_1)*u_noise_amp_1;

	pos.z += noise(rotate2d(PI/4.0)*pos.yx * u_noise_freq_2 - u_time * u_spd_modifier_2 *0.6) *u_noise_amp_2;

	vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
	
    gl_Position = projectionMatrix * mvm;
}
