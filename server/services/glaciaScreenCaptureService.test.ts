import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureScreen,
  analyzeScreenWithAI,
  getScreenAnalysisHistory,
  clearScreenAnalysisHistory,
} from './glaciaScreenCaptureService.ts';

describe('Glacia Screen Capture Service', () => {
  it('captures screen (may fail on headless CI, but returns structured response)', async () => {
    const result = await captureScreen();

    // Always returns a structured result
    assert.ok(typeof result.success === 'boolean');
    assert.ok(result.timestamp);
    assert.ok(typeof result.width === 'number');
    assert.ok(typeof result.height === 'number');
    // path may be empty if capture failed
    if (result.path) {
      assert.ok(result.path.endsWith('.png'));
    }
  });

  it('analyzes a screen image (falls back gracefully without AI key)', async () => {
    const result = await analyzeScreenWithAI(
      'fake-base64-data-for-testing',
      'Describe what you see'
    );

    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.description === 'string');
    assert.ok(Array.isArray(result.elements));
    assert.ok(Array.isArray(result.suggestions));
    assert.ok(typeof result.layout === 'string');
  });

  it('returns screen analysis history', () => {
    const history = getScreenAnalysisHistory();
    assert.ok(Array.isArray(history));
  });

  it('clears screen analysis history', () => {
    clearScreenAnalysisHistory();
    const history = getScreenAnalysisHistory();
    assert.equal(history.length, 0);
  });
});
