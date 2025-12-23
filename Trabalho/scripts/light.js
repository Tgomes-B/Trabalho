import * as THREE from 'three';

export function createLights(scene) {

    // Hemipheric e ambient light pra falar que tem tres luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.6);
    scene.add(hemiLight);

    //Directional light pra projetar sombra
    const directionalLight = new THREE.DirectionalLight(0xffffee, 2.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Config de sombra
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.normalBias = 0.02;

    scene.add(directionalLight);

    return { ambientLight, hemiLight, directionalLight };
}