import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js'; 
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from '/Trabalho/scripts/light.js';
import {createBox, createWater, createCaustics } from '/Trabalho/scripts/objects.js';
import { loadSkybox, loadShaders, loadTexture, loadModel } from '/Trabalho/scripts/loaders.js';
import { SCENE_CONFIG } from '/Trabalho/scripts/config.js';

let boat = null;
const foamTexture = loadTexture('Trabalho/assest/espuma.png');

async function init() {
    // Config inicial
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    //FPS
    const stats = new Stats();
    document.body.appendChild(stats.dom);

    //camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);
    camera.layers.enable(1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const underwaterRT = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    //Criando Render Target
    const createDepthRT = () => {
        const pr = renderer.getPixelRatio();
        const rt = new THREE.WebGLRenderTarget(window.innerWidth * pr, window.innerHeight * pr);
        rt.texture.minFilter = THREE.NearestFilter;
        rt.texture.magFilter = THREE.NearestFilter;
        rt.depthTexture = new THREE.DepthTexture();
        rt.depthTexture.format = THREE.DepthFormat;
        rt.depthTexture.type = THREE.UnsignedIntType;
        return rt;
    };
    const depthRT = createDepthRT();

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Carregar assets
    const waterShaders = await loadShaders('Trabalho/glsl/vert.glsl', 'Trabalho/glsl/frag.glsl');
    const causticShaders = await loadShaders('Trabalho/glsl/causticVert.glsl', 'Trabalho/glsl/causticFrag.glsl');
    const dudvMap = loadTexture('Trabalho/assest/noise.jpg');
    const causticsTexture = loadTexture('Trabalho/assest/image.png');
    console.log('Caustics Texture:', causticsTexture);

    // Luzes
    const { directionalLight } = createLights(scene);

    // Objetos
    scene.add(createBox());
    
    // Carregando GLTF
    try {
        boat = await loadModel('Trabalho/assest/GLTF/boat.gltf');
        boat.position.set(5.0, SCENE_CONFIG.water.y + 0.15, -4.5);
        boat.rotation.y = (Math.PI) / 4;
        boat.scale.set(0.008, 0.008, 0.008);
        scene.add(boat);

        const fish = await loadModel('Trabalho/assest/GLTF/fish.gltf');
        const fishPositions = [
            { x: -15, y: SCENE_CONFIG.water.y - 2.5, z: -10 },
            { x:  -8, y: SCENE_CONFIG.water.y - 1, z:  9.0 },
            { x: 0, y: SCENE_CONFIG.water.y, z: 5.5 },
            { x: 5, y: SCENE_CONFIG.water.y - 3, z: -10 },
            { x: -15, y: SCENE_CONFIG.water.y - 1.5, z: 10.0 },
            { x: -5.0, y: SCENE_CONFIG.water.y - 1.5, z: -5.0 }
        ];

        for (let i = 0; i < fishPositions.length; i++) {
            const pos = fishPositions[i];
            const fishClone = fish.clone(true);
            fishClone.position.set(pos.x, pos.y, pos.z);
        
            const scale = 0.005;
            fishClone.scale.set(scale, scale, scale);
        
            scene.add(fishClone);
        }


        const anchor = await loadModel('Trabalho/assest/GLTF/anchor.gltf');
        anchor.position.set(6.0, SCENE_CONFIG.water.y + 2.4, 5.5);
        anchor.rotation.z = (5 * Math.PI) / 4;
        anchor.scale.set(5, 5, 5);
        scene.add(anchor);

        const rock = await loadModel('Trabalho/assest/GLTF/rock.gltf');
        const numRocks = 12;
        const rocksPos = [];

        for (let i = 0; i < numRocks; i++) {
        const x = (Math.random() - 0.5) * SCENE_CONFIG.box.size * 0.8;
        const z = (Math.random() - 0.5) * SCENE_CONFIG.box.size * 0.8;
        const y = -2.2; 

        const rockClone = rock.clone(true);
        rockClone.position.set(x, y, z);

        const scale = 0.5 + Math.random() * 2.0;
        rockClone.scale.set(scale, scale, scale);

        rockClone.rotation.y = Math.random() * Math.PI * 2;

        scene.add(rockClone);
        rocksPos.push(rockClone.position.clone());

        }

        const island = await loadModel('Trabalho/assest/GLTF/scene.gltf');

        island.position.set(-8.7, 1.5, -4.3);
        island.scale.set(3.5, 3.5, 3.5);
        
        scene.add(island);
        console.log('Modelo carregado com sucesso!');
    } catch (error) {
        console.error('Falha ao carregar modelo:', error);
    }

    // Adiciona Água e cáusticas
    
    const caustics = createCaustics(
        camera, renderer,
        causticShaders.vert, causticShaders.frag,
        causticsTexture, depthRT.depthTexture,
        directionalLight.position
    );
    scene.add(caustics);

    const water = createWater(
        camera, renderer,
        waterShaders.vert, waterShaders.frag,
        dudvMap, depthRT.depthTexture,
        foamTexture,
        underwaterRT.texture
    );
    scene.add(water);

    // Skybox
    loadSkybox(scene, 'Trabalho/assest/skyBox.png');

    /*
    Obtem as dimensões da janela e atraves delas atualiza camera,
    render, rednderTargets e renderMaterials
     */
    const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pr = renderer.getPixelRatio();
        
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        depthRT.setSize(w * pr, h * pr);
        
        const res = new THREE.Vector2(w * pr, h * pr);
        underwaterRT.setSize(w * pr, h * pr);
        water.material.uniforms.tUnderwater.value = underwaterRT.texture;
        water.material.uniforms.resolution.value.copy(res);
        caustics.material.uniforms.resolution.value.copy(res);
    };
    window.addEventListener('resize', onResize);
    onResize();

    // Animação
    const viewProjection = new THREE.Matrix4();
    const deltaTime = 0.01;
    
    function animate() {

        //Controlado pro barco se movimentar de acordo com as ondas, ou quase igual
        if(boat) {
        const t = water.material.uniforms.time.value;
        const amp = SCENE_CONFIG.noise.amp1;
        const freq = SCENE_CONFIG.noise.freq1;
        const speed = SCENE_CONFIG.noise.speed1;

        const waveY = SCENE_CONFIG.water.y +
            Math.sin(t * speed + boat.position.x * freq) * amp * 0.25 +
            Math.cos(t * speed * 0.7 + boat.position.z * freq * 0.7) * amp * 0.15;

        boat.position.y = waveY + 0.6;

        boat.rotation.x = Math.sin(t * speed + boat.position.x) * 0.07;
        boat.rotation.z = Math.cos(t * speed * 0.7 + boat.position.z) * 0.07;
        }

        controls.update();
        
        // Atualizar matriz inversa para cáusticas
        viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        caustics.material.uniforms.inverseViewProjection.value.copy(viewProjection).invert();

        water.visible = false;
        caustics.visible = false;
        renderer.setRenderTarget(underwaterRT);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        water.visible = true;
        caustics.visible = true;

        // Render depth 
        water.visible = false;
        caustics.visible = false;
        camera.layers.disable(1);
        renderer.setRenderTarget(depthRT);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        
        // Render final
        camera.layers.enable(1);
        water.visible = true;
        caustics.visible = true;
        renderer.render(scene, camera);
        
        // Atualizar tempo
        water.material.uniforms.time.value += deltaTime;
        caustics.material.uniforms.time.value += deltaTime;
        stats.update();
    }

    renderer.setAnimationLoop(animate);
}

init();