import * as THREE from 'three';

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
            isOrthographic: { value: false },
            biasMultiplier: { value: 1 },
            tDepth: { value: depthTexture },
            edgePatternScale: { value: 5.0 },
            falloffDistance: { value: 0.8 },
            leadingEdgeFalloff: { value: 0.5 },
            edgeFalloffBias: { value: 1.0 },
            waterColor: { value: new THREE.Color(0xaaccff) },
            foamColor: { value: new THREE.Color(0xeeeeee) },
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
            },
            u_time: { value: 0 },
            u_pointsize: { value: 1.0 },
            u_noise_amp_1: { value: 0.15 },
            u_noise_freq_1: { value: 1.0 },
            u_spd_modifier_1: { value: 0.5 },
            u_noise_amp_2: { value: 0.1 },
            u_noise_freq_2: { value: 3.0 },
            u_spd_modifier_2: { value: 0.3 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 1.5;
    plane.receiveShadow = true;
    plane.castShadow = true;
    return plane;
}

// Criar plano de cáusticas
export function createCausticsPlane(camera, renderer, vertexShader, fragmentShader, causticsTexture, depthTexture, lightDir) {
    const geometry = new THREE.PlaneGeometry(10, 10);
    const pixelRatio = renderer.getPixelRatio();
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            tDepth: { value: depthTexture },
            tCaustics: { value: causticsTexture },
            resolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) },
            cameraNear: { value: camera.near },
            cameraFar: { value: camera.far },
            time: { value: 0 },
            inverseViewProjection: { value: new THREE.Matrix4() },
            lightDirection: { value: lightDir.clone().normalize() },
            causticsScale: { value: 2.5 },
            causticsSpeed: { value: 0.05 },
            causticsStrength: { value: 0.2 },
            causticsSplit: { value: 0.0005 },
            causticsColor: { value: new THREE.Color(0.5, 0.6, 0.7) },
            u_time: { value: 0 },
            u_pointsize: { value: 1.0 },
            u_noise_amp_1: { value: 0.15 },
            u_noise_freq_1: { value: 1.0 },
            u_spd_modifier_1: { value: 0.5 },
            u_noise_amp_2: { value: 0.1 },
            u_noise_freq_2: { value: 3.0 },
            u_spd_modifier_2: { value: 0.3 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 1.4; 
    plane.frustumCulled = false;
    
    return plane;
}

// Criar plano simples
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

//Caixa 
export function createBoxPlane() {
    const group = new THREE.Group();
    
    const boxMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xea4d10
    });

    // Fundo
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(11, 1, 11), boxMaterial);
    bottom.rotation.y = -Math.PI / 2;
    bottom.position.y = -1.5;
    bottom.receiveShadow = true;
    group.add(bottom);

    // Parede frontal
    const front = new THREE.Mesh(new THREE.BoxGeometry(11, 4, 1), boxMaterial);
    front.position.set(0, 0.5, 5);
    front.rotation.y = Math.PI;
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);

    // Parede traseira
    const back = new THREE.Mesh(new THREE.BoxGeometry(11, 4, 1), boxMaterial);
    back.position.set(0, 0.5, -5);
    back.castShadow = true;
    back.receiveShadow = true;
    group.add(back);

    // Parede esquerda
    const left = new THREE.Mesh(new THREE.BoxGeometry(11, 4, 1), boxMaterial);
    left.position.set(-5, 0.5, 0);
    left.rotation.y = Math.PI / 2;
    left.castShadow = true;
    left.receiveShadow = true;
    group.add(left);

    // Parede direita
    const right = new THREE.Mesh(new THREE.BoxGeometry(11, 4, 1), boxMaterial);
    right.position.set(5, 0.5, 0);
    right.rotation.y = -Math.PI / 2;
    right.castShadow = true;
    right.receiveShadow = true;
    group.add(right);

    return group;
}