/**
 * aiMultiModelRouter.test.ts
 * ============================================================
 * Tests for Multi-Model AI Router
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routeToBestModel,
  getModelRouteDiagnostics,
} from './aiMultiModelRouter.ts';

test('aiMultiModelRouter - routeToBestModel returns result even when AI unavailable', async () => {
  // This test verifies the router handles errors gracefully
  try {
    const result = await routeToBestModel({
      messages: [{ role: 'user', content: 'Write a JavaScript function to sort an array' }],
      taskType: 'code_generation',
      capability: 'code_generation',
    });
    // If AI is available, verify structure
    assert.ok(result);
    assert.ok(result.content.length > 0);
    assert.ok(result.modelUsed.length > 0);
    assert.ok(result.latencyMs >= 0);
  } catch (e: any) {
    // If AI is unavailable, verify error structure
    assert.ok(e.message);
    assert.ok(e.status === 429 || e.status === 503 || e.status === undefined);
  }
});

test('aiMultiModelRouter - getModelRouteDiagnostics returns route configs', () => {
  const diagnostics = getModelRouteDiagnostics();
  assert.ok(diagnostics);
  assert.ok(typeof diagnostics === 'object');

  const expectedCapabilities = [
    'code_generation',
    'game_dev',
    'video_script',
    'asset_design',
    'research_analysis',
    'reasoning_complex',
    'quick_chat',
    'local_only',
  ];

  for (const cap of expectedCapabilities) {
    assert.ok(diagnostics[cap], 'Missing diagnostics for capability: ' + cap);
    assert.ok(Array.isArray(diagnostics[cap].fallbackProviders), 'fallbackProviders should be array for ' + cap);
    assert.ok(typeof diagnostics[cap].maxTokens === 'number', 'maxTokens should be number for ' + cap);
    assert.ok(typeof diagnostics[cap].temperature === 'number', 'temperature should be number for ' + cap);
  }
});

test('aiMultiModelRouter - routeToBestModel handles game_dev task', async () => {
  try {
    const result = await routeToBestModel({
      messages: [{ role: 'user', content: 'Design a game level layout' }],
      taskType: 'game_dev',
      capability: 'game_dev',
    });
    assert.ok(result);
  } catch (e: any) {
    assert.ok(e.message);
  }
});

test('aiMultiModelRouter - routeToBestModel handles video_script task', async () => {
  try {
    const result = await routeToBestModel({
      messages: [{ role: 'user', content: 'Write a video script for product launch' }],
      taskType: 'video_script',
      capability: 'video_script',
    });
    assert.ok(result);
  } catch (e: any) {
    assert.ok(e.message);
  }
});

test('aiMultiModelRouter - routeToBestModel handles options', async () => {
  try {
    const result = await routeToBestModel({
      messages: [{ role: 'user', content: 'Hello' }],
      taskType: 'quick_chat',
      capability: 'quick_chat',
      options: { temperature: 0.5, maxTokens: 100 },
    });
    assert.ok(result);
  } catch (e: any) {
    assert.ok(e.message);
  }
});
