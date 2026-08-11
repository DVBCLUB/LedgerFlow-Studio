import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkEdgeLlmHealth, callEdgeLlm } from './edgeLlmAdapter.ts';

describe('Zero-Trust Air-Gapped Edge LLM Adapter', () => {
  it('checks health of local Ollama/LMStudio endpoint gracefully', async () => {
    const health = await checkEdgeLlmHealth();
    assert.equal(health.provider, 'ollama_local');
    assert.ok(typeof health.ok === 'boolean');
    assert.ok(typeof health.latencyMs === 'number');
  });

  it('executes edge LLM generation in air-gapped local mode with fallback', async () => {
    const result = await callEdgeLlm({
      prompt: 'Perform financial audit on confidential ledger items',
      systemInstruction: 'You are an AI Accountant operating in zero-trust air-gapped mode.',
      model: 'deepseek-r1:8b',
    });

    assert.equal(result.provider, 'ollama_local');
    assert.ok(result.text.length > 0);
    assert.ok(result.latencyMs >= 0);
  });
});
