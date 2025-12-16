#include <common>
#include <uv_pars_vertex>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>

varying vec3 fragPos;
varying vec2 vUV;
uniform float time;
uniform float u_pointsize;
uniform float u_noise_amp_1;
uniform float u_noise_freq_1;
uniform float u_spd_modifier_1;
uniform float u_noise_amp_2;
uniform float u_noise_freq_2;
uniform float u_spd_modifier_2;

varying float vWaveHeight;
varying vec2 vWaveUV;
varying vec2 vFoamUV;

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

    
	vec3 pos = position;

	pos.z += noise(pos.xy * u_noise_freq_1 + time * u_spd_modifier_1)*u_noise_amp_1;
	pos.z += noise(rotate2d(PI/6.0)*pos.yx * u_noise_freq_2 - time * u_spd_modifier_2 *0.6) *u_noise_amp_2;

	float wave = noise(pos.xy * u_noise_freq_1 + time * u_spd_modifier_1) * u_noise_amp_1;
    wave += noise(rotate2d(PI/6.0)*pos.yx * u_noise_freq_2 - time * u_spd_modifier_2 *0.6) * u_noise_amp_2;

    vWaveHeight = wave;
	vWaveUV = pos.xy;

	vUV = uv;
	vFoamUV = uv + normal.xz * vWaveHeight * 0.5;

	vec4 worldPos = modelMatrix * vec4(pos,1.0);
	mvPosition = viewMatrix *  worldPos;

	fragPos = worldPos.xyz;
	viewDir = normalize(cameraPosition - worldPos.xyz);

	gl_PointSize = u_pointsize;
    gl_Position = projectionMatrix * mvPosition;
}
