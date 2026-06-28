import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReleaseGateDashboardExport } from './aiWorkforceReleaseGateExport.ts';

const dashboard = {
  totalRecords: 2,
  latestDecision: 'ready',
  latestReleaseReady: true,
  latestScore: 96,
  latestChecksum: 'gate_checksum_123',
  latestFinalAction: 'Ready for release handoff.',
  latestMissingEvidence: [],
  trendAnalytics: {
    total: 2,
    readyCount: 1,
    holdCount: 1,
    notReadyCount: 0,
    readyRate: 0.5,
    averageScore: 78.5,
    scoreDelta: 35,
    trendDirection: 'improving',
    decisionBreakdown: { ready: 1, hold: 1 },
  },
  timeline: [
    { id: 'gate_ready', createdAt: '2026-06-28T00:01:00.000Z', decision: 'ready', releaseReady: true, score: 96, checksum: 'gate_checksum_123', finalAction: 'Ready for release handoff.' },
    { id: 'gate_hold', createdAt: '2026-06-28T00:00:00.000Z', decision: 'hold', releaseReady: false, score: 61, checksum: 'gate_checksum_000', finalAction: 'Hold for evidence.' },
  ],
};

test('release gate dashboard export creates JSON artifact with trend summary', () => {
  const artifact = buildReleaseGateDashboardExport(dashboard, { format: 'json', createdAt: '2026-06-28T00:02:00.000Z' });
  const payload = JSON.parse(artifact.content);

  assert.equal(artifact.format, 'json');
  assert.match(artifact.filename, /release-gate-dashboard-2026-06-28\.json/);
  assert.ok(artifact.checksum.length >= 32);
  assert.equal(artifact.summary.latestDecision, 'ready');
  assert.equal(artifact.summary.readyRate, 0.5);
  assert.equal(payload.kind, 'ai_workforce_release_gate_dashboard_export');
  assert.equal(payload.trendAnalytics.trendDirection, 'improving');
  assert.equal(payload.timeline.length, 2);
});

test('release gate dashboard export creates Markdown handoff artifact with timeline', () => {
  const artifact = buildReleaseGateDashboardExport(dashboard, { format: 'markdown', createdAt: '2026-06-28T00:02:00.000Z' });

  assert.equal(artifact.format, 'markdown');
  assert.match(artifact.filename, /release-gate-dashboard-2026-06-28\.md/);
  assert.ok(artifact.content.includes('# AI Workforce Release Gate Export Summary'));
  assert.ok(artifact.content.includes('## Trend analytics'));
  assert.ok(artifact.content.includes('## Release gate timeline'));
  assert.ok(artifact.content.includes('Trend direction: improving'));
  assert.ok(artifact.content.includes('gate_checksum_123'));
});
