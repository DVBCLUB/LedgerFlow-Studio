import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runOfflineInference,
  getOfflineLlmEngineStatus,
  setOfflineLlmBackend,
} from './glaciaLocalOfflineLlmEngine.ts';

test('glaciaLocalOfflineLlmEngine - getOfflineLlmEngineStatus returns active models and state', () => {
  const status = getOfflineLlmEngineStatus();
  assert.ok(status.engineVersion.includes('offline'));
  assert.ok(status.models.length >= 3);
  assert.ok(status.models.some(m => m.id === 'qwen2.5-coder-1.5b'));
});

test('glaciaLocalOfflineLlmEngine - runOfflineInference generates game code at $0 token cost', () => {
  const res = runOfflineInference({
    prompt: 'Tạo game arcade 3D',
    taskType: 'game_code',
    preferredModel: 'qwen2.5-coder-1.5b',
  });
  assert.equal(res.tokenCostUSD, 0);
  assert.equal(res.isAirGapped, true);
  assert.ok(res.output.includes('OfflineArcadeGameLoop'));
  assert.ok(res.tokensGenerated > 0);
});

test('glaciaLocalOfflineLlmEngine - runOfflineInference generates video storyboard offline', () => {
  const res = runOfflineInference({
    prompt: 'Viết kịch bản video trailer 4K',
    taskType: 'video_script',
    preferredModel: 'llama-3.2-1b-instruct',
  });
  assert.equal(res.tokenCostUSD, 0);
  assert.ok(res.output.includes('KỊCH BẢN VIDEO OFFLINE'));
});

test('glaciaLocalOfflineLlmEngine - setOfflineLlmBackend switches backend properly', () => {
  const updated = setOfflineLlmBackend('ollama_native');
  assert.equal(updated.activeBackend, 'ollama_native');
  // Reset back to webllm_webgpu
  const reverted = setOfflineLlmBackend('webllm_webgpu');
  assert.equal(reverted.activeBackend, 'webllm_webgpu');
});
