import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildGroundedContextPack } from './groundedContextPack.ts';
import {
  appendAIWorkforceAuditEvent,
  appendAIWorkforceTrendSnapshot,
  clearAIWorkforceOperationalLedgerForTest,
  getAIWorkforceOperationalLedgerDashboard,
  persistKnowledgeGraphFromContextPack,
} from './aiWorkforceOperationalLedger.ts';

async function withLedger(t: any) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-aiw-ledger-'));
  const previous = process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
  process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(directory, 'ledger.json');
  await clearAIWorkforceOperationalLedgerForTest();
  t.after(async () => {
    if (previous === undefined) delete process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
    else process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
}

test('AI Workforce Operational Ledger persists graph, audit, and trend snapshots', async (t) => {
  await withLedger(t);
  const pack = buildGroundedContextPack({
    question: 'Persist AI Workforce graph',
    sources: [{ kind: 'decision', title: 'Runtime Ledger', content: 'Persist graph, audit, trend.', tags: ['ledger'], facts: { mode: 'persistent' } }],
  });

  const graph = await persistKnowledgeGraphFromContextPack(pack, '2026-01-01T00:00:00.000Z');
  assert.equal(graph.contextPackId, pack.id);
  assert.ok(graph.nodes.length >= 1);

  await appendAIWorkforceAuditEvent({
    action: 'context_pack_created',
    severity: 'info',
    actor: 'Memory Agent',
    summary: 'Context pack persisted.',
    entityId: pack.id,
    createdAt: '2026-01-01T00:00:01.000Z',
  });

  await appendAIWorkforceTrendSnapshot({
    readinessGrade: 'A',
    readinessScore: 4.5,
    observability: { runs: 3, successRate: 0.8, blockedRate: 0.1, averageLatencyMs: 120, p95LatencyMs: 200, averageQualityScore: 0.9, estimatedCostUsd: 0.01 },
    toolingSummary: { total: 12, healthy: 10, degraded: 2, blocked: 0, approvalRequired: 5, connectorTools: 2 },
    createdAt: '2026-01-01T00:00:02.000Z',
  });

  const dashboard = await getAIWorkforceOperationalLedgerDashboard();
  assert.equal(dashboard.graphStats.totalGraphs, 1);
  assert.ok(dashboard.graphStats.totalNodes >= 1);
  assert.equal(dashboard.auditStats.totalEvents, 1);
  assert.equal(dashboard.trendStats.totalSnapshots, 1);
  assert.equal(dashboard.trendStats.latestTrend?.readinessScore, 4.5);
});

test('AI Workforce Operational Ledger calculates readiness and blocked-rate deltas', async (t) => {
  await withLedger(t);
  await appendAIWorkforceTrendSnapshot({
    readinessGrade: 'B',
    readinessScore: 3.7,
    observability: { runs: 1, successRate: 0.5, blockedRate: 0.3, averageLatencyMs: 300, p95LatencyMs: 300, averageQualityScore: 0.5, estimatedCostUsd: 0.02 },
    toolingSummary: { total: 12, healthy: 8, degraded: 3, blocked: 1, approvalRequired: 5, connectorTools: 2 },
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  await appendAIWorkforceTrendSnapshot({
    readinessGrade: 'A',
    readinessScore: 4.2,
    observability: { runs: 4, successRate: 0.75, blockedRate: 0.1, averageLatencyMs: 140, p95LatencyMs: 220, averageQualityScore: 0.8, estimatedCostUsd: 0.03 },
    toolingSummary: { total: 12, healthy: 10, degraded: 2, blocked: 0, approvalRequired: 5, connectorTools: 2 },
    createdAt: '2026-01-01T00:01:00.000Z',
  });

  const dashboard = await getAIWorkforceOperationalLedgerDashboard();
  assert.equal(dashboard.trendStats.readinessDelta, 0.5);
  assert.equal(dashboard.trendStats.blockedRateDelta, -0.2);
});
