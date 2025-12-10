import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from './scripts/light.js';
import { createSphere, createWaterPlane, createBoxPlane } from './scripts/objects.js';
import { loadSkybox, loadShaders, loadTexture } from './scripts/loaders.js';


async function init() {
    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Câmera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Criar Depth Render Target
    const pixelRatio = renderer.getPixelRatio();
    const depthRenderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth * pixelRatio,
        window.innerHeight * pixelRatio
    );
    depthRenderTarget.texture.minFilter = THREE.NearestFilter;
    depthRenderTarget.texture.magFilter = THREE.NearestFilter;
    depthRenderTarget.depthTexture = new THREE.DepthTexture();
    depthRenderTarget.depthTexture.format = THREE.DepthFormat;
    depthRenderTarget.depthTexture.type = THREE.UnsignedShortType;

    // Material para renderizar apenas depth
    const depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.depthPacking = THREE.RGBADepthPacking;
    depthMaterial.blending = THREE.NoBlending;

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Carregar shaders
    const { vert, frag } = await loadShaders('./glsl/vert.glsl', './glsl/frag.glsl');

    // Carregar textura dudv (noise)
    const dudvMap = loadTexture('./assest/noise.jpg');

    // Objetos
    const sphere = createSphere();
    scene.add(sphere);

    const box = createBoxPlane();
    scene.add(box);

    const waterPlane = createWaterPlane(camera, renderer, vert, frag, dudvMap, depthRenderTarget.depthTexture);
    scene.add(waterPlane);

    // Luzes
    createLights(scene);

    // Skybox
    loadSkybox(scene, './assest/skyBox.png');

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Atualizar resolução do shader e depth target
        const newPixelRatio = renderer.getPixelRatio();
        const width = window.innerWidth * newPixelRatio;
        const height = window.innerHeight * newPixelRatio;
        
        depthRenderTarget.setSize(width, height);
        waterPlane.material.uniforms.resolution.value.set(width, height);
    });

    // Animação
    function animate() {
        controls.update();
        
        // Passo 1: Renderizar depth da cena (sem a água)
        waterPlane.visible = false;
        renderer.setRenderTarget(depthRenderTarget);
        renderer.render(scene, camera);
        
        // Passo 2: Renderizar cena final com a água
        waterPlane.visible = true;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        
        // Atualizar tempo do shader de água
        waterPlane.material.uniforms.time.value += 0.01;
        
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
    }

    // Usar setAnimationLoop do renderer
    renderer.setAnimationLoop(animate);
}

// Iniciar
init();