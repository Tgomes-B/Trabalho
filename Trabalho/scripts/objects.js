import * as THREE from 'three';
import { SCENE_CONFIG, getPositions, createNoiseUniforms, createCameraUniforms } from './config.js';
import { loadTexture } from './loaders.js';

export function createSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        metalness: 0.3,
        roughness: 0.4
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.y = SCENE_CONFIG.water.y;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    return sphere;
}

export function createBottomSphere() {
    const pos = getPositions();
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.1,
        roughness: 0.8
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(3.0, pos.bottomY + 1.5, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    return sphere;
}

export function createBox() {
    const group = new THREE.Group();
    const { box } = SCENE_CONFIG;
    const pos = getPositions();
    
    // Material padrão para paredes
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        roughness: 0.9,
        color: new THREE.Color(0, 0, 0)
    });

    // Material com textura de areia para o fundo
    const sandTexture = loadTexture('Trabalho/assest/GLTF/textures/GroundSand.jpg');
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(5, 5); 

    const sandMaterial = new THREE.MeshStandardMaterial({ 
    map: sandTexture,
    color: new THREE.Color(0.5, 0.5, 0.5),
    roughness: 0.95,
    metalness: 0.0
    });

    // Função helper para criar parede
    const createWall = (width, height, depth, position, material, receiveShadow = true, castShadow = true) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.receiveShadow = receiveShadow;
        mesh.castShadow = castShadow;
        return mesh;
    };

    // Fundo com textura de areia
    group.add(createWall(box.size, box.thickness, box.size, new THREE.Vector3(0, pos.bottomY, 0), sandMaterial, true, false));
    
    // Paredes com material padrão
    group.add(createWall(box.size + box.thickness, box.height, box.thickness, new THREE.Vector3(0, pos.wallY, pos.halfBox), wallMaterial));
    group.add(createWall(box.size + box.thickness, box.height, box.thickness, new THREE.Vector3(0, pos.wallY, -pos.halfBox), wallMaterial));
    group.add(createWall(box.thickness, box.height, box.size + box.thickness, new THREE.Vector3(-pos.halfBox, pos.wallY, 0), wallMaterial));
    group.add(createWall(box.thickness, box.height, box.size + box.thickness, new THREE.Vector3(pos.halfBox, pos.wallY, 0), wallMaterial));

    return group;
}

// Criar plano de água com shader
export function createWater(camera, renderer, vertexShader, fragmentShader, dudvMap, depthTexture) {
    const { box, water } = SCENE_CONFIG;
    const geometry = new THREE.PlaneGeometry(box.size, box.size, 32, 32);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            ...createCameraUniforms(camera, renderer),
            tDepth: { value: depthTexture },
            tDudv: { value: dudvMap },
            waterColor: { value: new THREE.Color(water.color) },
            foamColor: { value: new THREE.Color(water.foamColor) },
            //isOrthographic: { value: false },
            biasMultiplier: { value: 1 },
            edgePatternScale: { value: 5.0 },
            falloffDistance: { value: 0.8 },
            leadingEdgeFalloff: { value: 0.5 },
            edgeFalloffBias: { value: 1.0 },
            threshold: { value: 0.1 },
            time: { value: 0 },
            u_pointsize: { value: 1.4 }, 
            material: {
                value: {
                    diffuseColor: new THREE.Vector3(0.75, 0.75, 0.75),
                    specularColor: new THREE.Vector3(12, 12, 12),
                    shininess: 64
                }
            },
            ...createNoiseUniforms()
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = water.y;  
    mesh.receiveShadow = true;
    mesh.castShadow = false;

    mesh.layers.set(1);

    return mesh;
}

// Criar plano de cáusticas (fullscreen quad)
export function createCaustics(camera, renderer, vertexShader, fragmentShader, causticsTexture, depthTexture, lightDir) {
    const { box, water, caustics } = SCENE_CONFIG;
    
    // Usar PlaneGeometry 2x2 em clip space (fullscreen quad)
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            ...createCameraUniforms(camera, renderer),
            tDepth: { value: depthTexture },
            tCaustics: { value: causticsTexture },
            inverseViewProjection: { value: new THREE.Matrix4() },
            lightDirection: { value: lightDir.clone().normalize() },
            causticsScale: { value: caustics.scale },
            causticsSpeed: { value: caustics.speed },
            causticsStrength: { value: caustics.strength },
            causticsSplit: { value: caustics.split },
            causticsColor: { value: new THREE.Color(caustics.color) },
            waterLevel: { value: water.y },
            boxSize: { value: box.size },
            time: { value: 0 },
            ...createNoiseUniforms()
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false  
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    mesh.layers.set(1);

    return mesh;
}