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