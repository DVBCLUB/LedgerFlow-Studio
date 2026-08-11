import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getOperationalTelemetryStream,
  generateDiagnosticsSnapshot,
} from './operationalTelemetryStream.ts';

test('getOperationalTelemetryStream returns uptime, memory, and telemetry metrics', () => {
  const telemetry = getOperationalTelemetryStream();

  assert.ok(telemetry.systemUptimeSeconds >= 0);
  assert.ok(telemetry.memoryUsageMB.heapUsed > 0);
  assert.ok(typeof telemetry.backgroundLoopJobs.completed === 'number');
});

test('generateDiagnosticsSnapshot creates 1-click diagnostic snapshot', async () => {
  const snapshot = await generateDiagnosticsSnapshot({
    reason: 'Manual Health Audit',
    requestedBy: 'founder_telegram',
  });

  assert.ok(snapshot.id.startsWith('diag_'));
  assert.equal(snapshot.reason, 'Manual Health Audit');
  assert.equal(snapshot.requestedBy, 'founder_telegram');
  assert.ok(snapshot.diagnosticSummary.includes('Diagnostics Snapshot'));
  assert.ok(snapshot.telemetry.memoryUsageMB.heapUsed > 0);
});
