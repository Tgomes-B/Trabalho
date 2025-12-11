varying vec2 vUV;
varying vec3 vWorldPos;

void main()
{
    vUV = uv;
    
    // Calcular posição no mundo
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}