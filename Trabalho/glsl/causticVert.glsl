varying vec2 vUV;

void main()
{
    vUV = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}