import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from './scripts/light.js';
import { createSphere, createBottomSphere, createBox, createWater, createCaustics } from './scripts/objects.js';
import { loadSkybox, loadShaders, loadTexture, loadModel } from './scripts/loaders.js';
import { SCENE_CONFIG } from './scripts/config.js';


async function init() {
    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 25);
    camera.layers.enable(1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // PCFSoft funciona melhor
    document.body.appendChild(renderer.domElement);

    // Depth Render Target
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
    const waterShaders = await loadShaders('./glsl/vert.glsl', './glsl/frag.glsl');
    const causticShaders = await loadShaders('./glsl/causticVert.glsl', './glsl/causticFrag.glsl');
    const dudvMap = loadTexture('./assest/noise.jpg');
    const causticsTexture = loadTexture('./assest/caustic.jpg'); 

    // Luzes
    const { directionalLight } = createLights(scene);

    // Objetos
    scene.add(createBox());
    
    try {
        const island = await loadModel('./assest/scene.gltf');
        
        island.position.set(0, 2.62, 0);  
        island.scale.set(0.03, 0.03, 0.03);  
        // island.rotation.y = Math.PI / 2;  // Rotação se necessário
        
        scene.add(island);
        console.log('Modelo carregado com sucesso!');
    } catch (error) {
        console.error('Falha ao carregar modelo:', error);
    }

    // Água e cáusticas
    const water = createWater(
        camera, renderer,
        waterShaders.vert, waterShaders.frag,
        dudvMap, depthRT.depthTexture
    );
    scene.add(water);

    const caustics = createCaustics(
        camera, renderer,
        causticShaders.vert, causticShaders.frag,
        causticsTexture, depthRT.depthTexture,
        directionalLight.position
    );
    scene.add(caustics);

    // Skybox
    loadSkybox(scene, './assest/skyBox.png');

    const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pr = renderer.getPixelRatio();
        
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        depthRT.setSize(w * pr, h * pr);
        
        const res = new THREE.Vector2(w * pr, h * pr);
        water.material.uniforms.resolution.value.copy(res);
        caustics.material.uniforms.resolution.value.copy(res);
    };
    window.addEventListener('resize', onResize);

    // Animação
    const viewProjection = new THREE.Matrix4();
    const deltaTime = 0.01;
    
    function animate() {
        controls.update();
        
        // Atualizar matriz inversa para cáusticas
        viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        caustics.material.uniforms.inverseViewProjection.value.copy(viewProjection).invert();

        // Render depth (sem água e cáusticas)
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
        
    }

    renderer.setAnimationLoop(animate);
}

init();