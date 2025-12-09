import * as THREE from 'three';

// Criar esfera
export function createSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        metalness: 0.3,
        roughness: 0.4
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.y = 1.5;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    return sphere;
}

// Criar plano de água com shader
export function createWaterPlane(camera, renderer, vertexShader, fragmentShader, dudvMap, depthTexture) {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const pixelRatio = renderer.getPixelRatio();
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            ...THREE.UniformsLib.common,
            isOrthographic: { value: false },
            biasMultiplier: { value: 1 },
            tDepth: { value: depthTexture },
            waterColor: { value: new THREE.Color(0x0077be) },
            foamColor: { value: new THREE.Color(0xffffff) },
            threshold: { value: 0.1 },
            time: { value: 0 },
            tDudv: { value: dudvMap },
            resolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) },
            cameraNear: { value: camera.near },
            cameraFar: { value: camera.far },
            material: {
                value: {
                    diffuseColor: new THREE.Vector3(0.75, 0.75, 0.75),
                    specularColor: new THREE.Vector3(1, 1, 1),
                    shininess: 32
                }
            }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 1.5;
    plane.receiveShadow = true;
    plane.castShadow = true;
    return plane;
}

// Criar plano simples (sem shader)
export function createPlane() {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 1.5;
    plane.receiveShadow = true;
    plane.castShadow = true;
    return plane;
}

//Caixa em volta do plano (sem a parte de cima)
export function createBoxPlane() {
    const group = new THREE.Group();
    
    const material = new THREE.MeshStandardMaterial({
        color: "orange",
        roughness: 0.4,
        side: THREE.DoubleSide
    });

    // Fundo
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -1.5;
    bottom.receiveShadow = true;
    group.add(bottom);

    // Parede frontal
    const front = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), material);
    front.position.set(0, 0.5, 5);
    front.rotation.y = Math.PI;
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);

    // Parede traseira
    const back = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), material);
    back.position.set(0, 0.5, -5);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Parede esquerda
    const left = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), material);
    left.position.set(-5, 0.5, 0);
    left.rotation.y = Math.PI / 2;
    left.castShadow = true;
    left.receiveShadow = true;
    group.add(left);

    // Parede direita
    const right = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), material);
    right.position.set(5, 0.5, 0);
    right.rotation.y = -Math.PI / 2;
    right.castShadow = true;
    right.receiveShadow = true;
    group.add(right);

    return group;
}