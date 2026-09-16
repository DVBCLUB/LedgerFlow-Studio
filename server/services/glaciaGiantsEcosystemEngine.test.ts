import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadGiantsEcosystem,
  invokeGiantCapability,
} from './glaciaGiantsEcosystemEngine.ts';

describe('glaciaGiantsEcosystemEngine - Standing on the Shoulders of Giants', () => {
  it('loads 7 Big Tech giant connectors with zero cost capabilities', () => {
    const giants = loadGiantsEcosystem();
    assert.ok(giants.length >= 7);
    const google = giants.find((g) => g.id === 'google_cloud_ai');
    assert.ok(google);
    assert.ok(google.leveragedTechnologies.some((t) => t.includes('Gemini')));

    const nvidia = giants.find((g) => g.id === 'nvidia_omniverse');
    assert.ok(nvidia);
    assert.ok(nvidia.leveragedTechnologies.some((t) => t.includes('WebGPU')));
  });

  it('invokes giant capability and returns $0 cost result with generated code and throughput', () => {
    const result = invokeGiantCapability({
      giantId: 'blender_epic_games',
      actionName: 'generate_3d_cycles_scene',
    });

    assert.equal(result.giantId, 'blender_epic_games');
    assert.equal(result.status, 'success');
    assert.equal(result.executionDetails.costIncurredUsd, 0.0);
    assert.ok(result.executionDetails.generatedAssetOrCode.includes('bpy'));
    assert.ok(result.glaciaOrchestrationNote.includes('Blender'));
  });

  it('invokes NVIDIA WebGPU compute shader successfully', () => {
    const result = invokeGiantCapability({
      giantId: 'nvidia_omniverse',
      actionName: 'compute_particle_grid',
    });

    assert.equal(result.giantId, 'nvidia_omniverse');
    assert.ok(result.executionDetails.generatedAssetOrCode.includes('WGSL') || result.executionDetails.generatedAssetOrCode.includes('@compute'));
  });
});
