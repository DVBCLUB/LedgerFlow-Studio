import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listCuratedLocalModels,
  checkOllamaLocalStatus,
  CURATED_LOCAL_MODELS,
} from './ollamaLocalHubService.ts';

describe('ollamaLocalHubService - 1-Click Local Model Manager ($0)', () => {
  it('returns curated local models with memory and role recommendations', () => {
    const models = listCuratedLocalModels();

    assert.ok(models.length >= 3);
    assert.ok(models.some((m) => m.modelTag.includes('qwen2.5-coder')));
    assert.ok(models.some((m) => m.modelTag.includes('deepseek-r1')));
  });

  it('checks status gracefully and returns accurate report', async () => {
    const status = await checkOllamaLocalStatus('http://127.0.0.1:99999'); // non-existent port
    assert.equal(status.isOnline, false);
    assert.ok(status.statusMessage.includes('chưa bật'));
    assert.equal(status.curatedModelsCount, CURATED_LOCAL_MODELS.length);
  });
});
