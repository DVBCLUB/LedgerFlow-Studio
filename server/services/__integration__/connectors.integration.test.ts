import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Connectors & External Gateway', () => {
  test('GET /api/connectors/edge-tts/voices returns supported voices list', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/connectors/edge-tts/voices`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.voices));
      assert.ok(data.voices.length > 0);
    });
  });

  test('GET /api/ollama/local/models returns local model recommendations', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/ollama/local/models`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.models));
    });
  });

  test('GET /api/radar/competitors returns competitor landscape analysis', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/radar/competitors`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.radar));
    });
  });
});
