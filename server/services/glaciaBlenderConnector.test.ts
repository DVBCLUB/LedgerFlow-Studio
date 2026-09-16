import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectBlenderExecutable, getGlaciaBlenderStatus, executeGlaciaBlenderRender } from './glaciaBlenderConnector.ts';

describe('Glacia Blender Connector', () => {
  it('detects blender executable (may not be installed)', async () => {
    const status = await detectBlenderExecutable();
    // Should always return a structured result, even if blender not found
    assert.ok(typeof status.path === 'string' || status.path === null);
    assert.ok(typeof status.version === 'string' || status.version === null);
  });

  it('returns blender status with correct shape', async () => {
    const status = await getGlaciaBlenderStatus();
    assert.ok(typeof status.available === 'boolean');
    assert.ok(Array.isArray(status.capabilities));
  });

  it('executes a blender render request (falls back to simulated output when blender is unavailable)', async () => {
    const result = await executeGlaciaBlenderRender({
      prompt: 'Một viên pha lê xanh phát sáng trong bóng tối',
      sceneType: 'crystal_artifact',
    });

    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.pythonScriptUsed === 'string');
    assert.ok(result.pythonScriptUsed.length > 20);
    assert.ok(result.renderDurationMs >= 0);
    // Even if blender is not installed, we get a simulated/managed response
    if (!result.success) {
      assert.ok(result.message.includes('Blender') || result.message.includes('không'));
    }
  });

  it('supports different scene types', async () => {
    const result = await executeGlaciaBlenderRender({
      prompt: 'Máy bay drone trong thành phố',
      sceneType: 'cyberpunk_drone',
    });

    assert.equal(result.success, true);
    assert.ok(result.pythonScriptUsed.includes('cyberpunk_drone'));
  });
});
