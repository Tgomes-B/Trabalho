import * as THREE from 'three';

// Configurações da cena - TUDO CENTRALIZADO AQUI
export const SCENE_CONFIG = {
    // Dimensões da box
    box: {
        size: 30,
        height: 6,
        thickness: 0.3
    },
    
    // Água
    water: {
        y: 1.5,
        color: 0xaaccff,
        foamColor: 0xeeeeee
    },
    
    // Noise compartilhado (água e cáusticas usam os mesmos valores!)
    noise: {
        amp1: 0.6,
        freq1: 2.0,
        speed1: 0.5,
        amp2: 0.5,
        freq2: 3.0,
        speed2: 0.7
    },
    
    // Cáusticas
    caustics: {
        scale: 1.0,
        speed: 0.08,
        strength: 0.4,
        split: 0.008,
        color: 0xaaccff
    }
};

// Calcula posições baseadas na config
export function getPositions() {
    const { box, water } = SCENE_CONFIG;
    return {
        waterY: water.y,
        bottomY: water.y - 4,
        wallY: (water.y - 4) + box.height / 2,
        halfBox: box.size / 2
    };
}

// Cria uniforms de noise (compartilhados)
export function createNoiseUniforms() {
    const { noise } = SCENE_CONFIG;
    return {
        u_noise_amp_1: { value: noise.amp1 },
        u_noise_freq_1: { value: noise.freq1 },
        u_spd_modifier_1: { value: noise.speed1 },
        u_noise_amp_2: { value: noise.amp2 },
        u_noise_freq_2: { value: noise.freq2 },
        u_spd_modifier_2: { value: noise.speed2 }
    };
}

// Cria uniforms de câmera (compartilhados)
export function createCameraUniforms(camera, renderer) {
    const pixelRatio = renderer.getPixelRatio();
    return {
        resolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) },
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far }
    };
}