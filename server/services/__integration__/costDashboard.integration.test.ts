/**
 * costDashboard.integration.test.ts
 * ============================================================
 * Integration tests for Cost Dashboard, 2-Tier Metrics, and
 * Cost Governor endpoints.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Cost Dashboard', () => {
  test('GET /api/cost/snapshot returns cost snapshot', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/snapshot');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.snapshot);
      assert.equal(typeof data.snapshot.totalCostUsd, 'number');
      assert.ok(data.snapshot.byAgent);
      assert.ok(data.snapshot.byModel);
      assert.ok(data.snapshot.byRoute);
      assert.ok(data.snapshot.byDomain);
      assert.ok(Array.isArray(data.snapshot.recentRecords));
      assert.ok(Array.isArray(data.snapshot.budgets));
      assert.ok(data.snapshot.period);
    });
  });

  test('GET /api/cost/daily returns daily costs', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/daily?days=7');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.daily));
      assert.equal(data.daily.length, 7);
    });
  });

  test('GET /api/cost/daily defaults to 7 and clamps to 90', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/daily');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.daily.length, 7);

      const res2 = await fetch(baseUrl + '/api/cost/daily?days=200');
      assert.equal(res2.status, 200);
      const d2: any = await res2.json();
      assert.equal(d2.daily.length, 90);
    });
  });

  test('GET /api/cost/records returns records', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/records?limit=10');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.records));
    });
  });

  test('GET /api/cost/two-tier/metrics returns summary', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/two-tier/metrics');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.metrics);
      assert.equal(typeof data.metrics.totalRequests, 'number');
      assert.equal(typeof data.metrics.cheapTierRatioPct, 'number');
      assert.equal(typeof data.metrics.estimatedCostSavedUsd, 'number');
    });
  });

  test('POST /api/cost/two-tier/record records a metric', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/two-tier/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'tier_cheap', isCached: false, promptTokens: 500 }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
    });
  });

  test('POST /api/cost/two-tier/record returns 400 when tier missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/two-tier/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data: any = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error);
    });
  });

  test('GET /api/cost/governor/config returns config', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/config');
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.config);
      assert.equal(typeof data.config.enabled, 'boolean');
      assert.equal(typeof data.config.monthlyCapUsd, 'number');
      assert.equal(typeof data.config.alertThresholdPct, 'number');
    });
  });

  test('PUT /api/cost/governor/config updates config', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, monthlyCapUsd: 50 }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.config.monthlyCapUsd, 50);
    });
  });

  test('POST /api/cost/governor/check validates budget gate', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'test-agent', domain: 'coding' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.result);
      assert.equal(typeof data.result.allowed, 'boolean');
    });
  });

  test('POST /api/cost/governor/check returns 400 when agent missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });
  test('POST /api/cost/governor/evaluate-tier evaluates downgrade', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/evaluate-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedTier: 'tier_flagship' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.result);
      assert.equal(typeof data.result.downgraded, 'boolean');
    });
  });

  test('POST /api/cost/governor/evaluate-tier returns 400 when tier missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/cost/governor/evaluate-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  test('POST /api/ai/two-tier/classify classifies a task', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/ai/two-tier/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'write a poem', userPrompt: 'haiku about coding' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.result);
    });
  });

  test('POST /api/ai/two-tier/classify returns 400 when task missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/ai/two-tier/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  test('POST /api/ai/two-tier/execute calls the execute endpoint', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/ai/two-tier/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'summarize', userPrompt: 'Tell me a short story' }),
      });
      // Returns 200 if AI works, 500 if no AI keys configured (expected in test env)
      assert.ok(res.status === 200 || res.status === 500);
      const data: any = await res.json();
      assert.equal(data.success, res.status === 200);
    });
  });

  test('POST /api/ai/two-tier/execute returns 400 when userPrompt missing', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(baseUrl + '/api/ai/two-tier/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'test' }),
      });
      assert.equal(res.status, 400);
    });
  });
});

