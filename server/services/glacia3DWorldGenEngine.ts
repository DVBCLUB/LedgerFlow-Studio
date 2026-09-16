/**
 * server/services/glacia3DWorldGenEngine.ts
 * Động cơ Sinh Thế Giới Ảo 3D & Tài Nguyên Game (Procedural 3D & GLTF/WebGL) của Glacia (Epoch 7).
 */

import fs from 'fs';
import path from 'path';

export interface World3DSceneDescriptor {
  sceneId: string;
  sceneName: string;
  theme: 'glacia_crystal_sanctuary' | 'cyberpunk_financial_district' | 'quantum_matrix_lab';
  terrain: {
    resolution: number;
    heightmapType: 'perlin' | 'simplex' | 'crystal_peaks';
    baseColor: string;
    wireframe: boolean;
  };
  objects: Array<{
    id: string;
    type: 'crystal_monolith' | 'floating_data_core' | 'dragon_satellite' | 'neural_node';
    position: [number, number, number];
    scale: [number, number, number];
    material: {
      color: string;
      metalness: number;
      roughness: number;
      emissive?: string;
      transmission?: number; // Glass/Crystal refraction
    };
  }>;
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    auroraDirectional: { color: string; intensity: number; position: [number, number, number] };
  };
  gltfExportManifest: {
    asset: { version: string; generator: string };
    meshesCount: number;
    estimatedByteSize: number;
  };
  generatedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const WORLDS_FILE = path.join(RUNTIME_DIR, 'glacia_3d_worlds.json');

export function generate3DProceduralWorld(payload: {
  theme: World3DSceneDescriptor['theme'];
  sceneName?: string;
  objectCount?: number;
}): World3DSceneDescriptor {
  const sceneId = `world3d-${Date.now()}`;
  const name = payload.sceneName || `Thánh Địa Pha Lê Băng Tuyết Glacia 3D (${payload.theme})`;
  const count = payload.objectCount || 8;

  const objects: World3DSceneDescriptor['objects'] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round((Math.random() - 0.5) * 40);
    const z = Math.round((Math.random() - 0.5) * 40);
    const y = Math.round(Math.random() * 8) + 1;

    objects.push({
      id: `obj-${i + 1}`,
      type: i % 2 === 0 ? 'crystal_monolith' : 'floating_data_core',
      position: [x, y, z],
      scale: [1 + Math.random(), 2 + Math.random() * 3, 1 + Math.random()],
      material: {
        color: payload.theme === 'glacia_crystal_sanctuary' ? '#38bdf8' : '#a855f7',
        metalness: 0.9,
        roughness: 0.1,
        emissive: '#0284c7',
        transmission: 0.85,
      },
    });
  }

  const scene: World3DSceneDescriptor = {
    sceneId,
    sceneName: name,
    theme: payload.theme,
    terrain: {
      resolution: 64,
      heightmapType: 'crystal_peaks',
      baseColor: '#0f172a',
      wireframe: true,
    },
    objects,
    lighting: {
      ambientColor: '#0284c7',
      ambientIntensity: 0.4,
      auroraDirectional: {
        color: '#38bdf8',
        intensity: 1.8,
        position: [15, 30, 20],
      },
    },
    gltfExportManifest: {
      asset: { version: '2.0', generator: 'Glacia 3D Neural Mesh Generator v7.0' },
      meshesCount: objects.length + 1,
      estimatedByteSize: 145000,
    },
    generatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    const current = listGenerated3DWorlds();
    current.unshift(scene);
    fs.writeFileSync(WORLDS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {}

  return scene;
}

export function listGenerated3DWorlds(): World3DSceneDescriptor[] {
  try {
    if (fs.existsSync(WORLDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(WORLDS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const defaultScene = generate3DProceduralWorld({ theme: 'glacia_crystal_sanctuary' });
  return [defaultScene];
}
