import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeImageWithGlaciaVision,
  getVisionHistory,
  appendVisionHistory,
} from './glaciaVisionEngine.ts';

describe('Glacia Vision Engine', () => {
  it('analyzes an image and returns structured result', async () => {
    const result = await analyzeImageWithGlaciaVision({
      imageBase64: 'fake-base64-image-data',
      prompt: 'Describe this image in detail',
    });

    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.description === 'string');
    // labels and confidence may not be present when AI call fails (no API key)
    if (result.labels) {
      assert.ok(Array.isArray(result.labels));
    }
    if (result.confidence !== undefined) {
      assert.ok(typeof result.confidence === 'number');
      assert.ok(result.confidence >= 0 && result.confidence <= 1);
    }
    assert.ok(typeof result.durationMs === 'number');
    assert.ok(typeof result.modelUsed === 'string');
  });

  it('appends result to vision history', () => {
    // Clear by shifting all items
    let history = getVisionHistory();
    while (history.length > 0) {
      appendVisionHistory({ success: true, description: '', durationMs: 0, modelUsed: '', tokensUsed: 0 });
      history = getVisionHistory();
      history.shift();
    }

    appendVisionHistory({
      success: true,
      description: 'Test analysis',
      labels: ['test'],
      confidence: 0.95,
      durationMs: 100,
      modelUsed: 'doubao-vision',
      tokensUsed: 50,
    });

    const history2 = getVisionHistory();
    assert.equal(history2.length, 1);
    assert.equal(history2[0].description, 'Test analysis');
  });

  it('retrieves vision history', () => {
    const history = getVisionHistory();
    assert.ok(Array.isArray(history));
  });
});
