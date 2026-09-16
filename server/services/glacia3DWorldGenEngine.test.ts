import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generate3DProceduralWorld,
  listGenerated3DWorlds,
} from './glacia3DWorldGenEngine.ts';

describe('Glacia 3D Interactive World Simulation & Game Asset Generator (Epoch 7)', () => {
  it('generates a procedural 3D world scene with crystal peaks, objects, materials and lighting', () => {
    const scene = generate3DProceduralWorld({
      theme: 'glacia_crystal_sanctuary',
      objectCount: 6,
    });

    assert.ok(scene.sceneId.startsWith('world3d-'));
    assert.equal(scene.theme, 'glacia_crystal_sanctuary');
    assert.equal(scene.objects.length, 6);
    assert.equal(scene.terrain.heightmapType, 'crystal_peaks');
    assert.ok(scene.gltfExportManifest.meshesCount >= 7);
  });

  it('constructs valid GLTF 2.0 asset manifest with procedural byte size estimation', () => {
    const scene = generate3DProceduralWorld({
      theme: 'cyberpunk_financial_district',
      objectCount: 10,
    });

    assert.equal(scene.gltfExportManifest.asset.version, '2.0');
    assert.ok(scene.gltfExportManifest.estimatedByteSize > 100000);
  });

  it('retrieves persistent list of generated 3D worlds cleanly', () => {
    const list = listGenerated3DWorlds();
    assert.ok(list.length >= 1);
    assert.ok(list[0].sceneName.length > 5);
  });
});
