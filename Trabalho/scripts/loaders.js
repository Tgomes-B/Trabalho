import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const textureLoader = new THREE.TextureLoader();
export const gltfLoader = new GLTFLoader();

export function loadSkybox(scene, path) {
    const skyboxTexture = textureLoader.load(path);
    skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = skyboxTexture;
    scene.environment = skyboxTexture;
    return skyboxTexture;
}

export async function loadShaders(vertPath, fragPath) {
    const vert = await (await fetch(vertPath)).text();
    const frag = await (await fetch(fragPath)).text();
    return { vert, frag };
}

export function loadTexture(path) {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}


export async function loadModel(path) {
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.layers.set(0);
                    }
                });
                
                resolve(model);
            },
            (progress) => {
                console.log('Carregando modelo:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
            },
            (error) => {
                console.error('Erro ao carregar modelo:', error);
                reject(error);
            }
        );
    });
}