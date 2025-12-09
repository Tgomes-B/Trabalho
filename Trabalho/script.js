import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from './scripts/light.js';
import { createSphere, createPlane, createBoxPlane } from './scripts/objects.js';
import { loadSkybox } from './scripts/loaders.js';

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Câmera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Objetos
const sphere = createSphere();
scene.add(sphere);

const plane = createPlane();
scene.add(plane);

// Caixa em volta do plano
const box = createBoxPlane();
scene.add(box);

// Luzes
createLights(scene);

// Skybox
loadSkybox(scene, './assest/skyBox.png');

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}

animate();