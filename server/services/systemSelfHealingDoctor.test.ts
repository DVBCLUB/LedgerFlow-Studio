import test from 'node:test';
import assert from 'node:assert/strict';
import { runSelfHealingDiagnostics } from './systemSelfHealingDoctor.ts';

test('systemSelfHealingDoctor - runs diagnostic health check and returns memory and circuit breaker status', async () => {
  const report = await runSelfHealingDiagnostics();

  assert.ok(report.timestamp);
  assert.ok(['HEALTHY', 'DEGRADED', 'CRITICAL'].includes(report.status));
  assert.ok(report.memory.heapUsedMb > 0);
  assert.ok(report.selfHealingActionsTaken.length > 0);
});

