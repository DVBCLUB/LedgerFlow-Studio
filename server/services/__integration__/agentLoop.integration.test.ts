import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Agent Loop & Auto Repair', () => {
  test('POST /api/agent/loop/enqueue creates a background loop job', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/agent/loop/enqueue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'integration-test' },
        body: JSON.stringify({
          goal: 'Integration test job validation',
          domain: 'coding',
          maxLoops: 1,
          sandboxMode: 'dry_run',
          autoRepair: false,
        }),
      });

      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.jobId, 'Job ID must be returned');
    });
  });

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
});
