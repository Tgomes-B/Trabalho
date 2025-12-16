varying vec2 vUV;

void main()
{
    vUV = uv;
    
    // Fullscreen quad - posição já está em clip space (-1 a 1)
    gl_Position = vec4(position.xy, 0.0, 1.0);
}