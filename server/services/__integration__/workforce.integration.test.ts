import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - AI Workforce & Live Board', () => {
  test('GET /api/workforce/live-board returns active board state', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/workforce/live-board`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.equal(typeof data.activeCount, 'number');
    });
  });


  test('GET /api/capacity/forecast returns capacity metrics', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/capacity/forecast`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.forecast);
    });
  });
});
