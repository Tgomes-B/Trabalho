import * as THREE from 'three';

// Texture Loader
export const textureLoader = new THREE.TextureLoader();

// Carregar skybox
export function loadSkybox(scene, path) {
    const skyboxTexture = textureLoader.load(path);
    skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = skyboxTexture;
    scene.environment = skyboxTexture;
    return skyboxTexture;
}

// Carregar shaders GLSL
export async function loadShaders(vertPath, fragPath) {
    const vert = await (await fetch(vertPath)).text();
    const frag = await (await fetch(fragPath)).text();
    return { vert, frag };
}

// Carregar textura
export function loadTexture(path) {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}