import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Agent Loop & Performance', () => {
  test('GET /api/agent/loop/jobs returns job list and queue stats', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/agent/loop/jobs?limit=5`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.stats);
      assert.ok(Array.isArray(data.jobs));
    });
  });

  test('GET /api/ai/circuit-breaker returns circuit breaker states', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/ai/circuit-breaker`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.circuitBreakers, 'Circuit breakers map must be present');
    });
  });

  test('GET /api/agent/performance/dashboard returns performance dashboard', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/agent/performance/dashboard`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.dashboard);
    });
  });
});

