import { describe, it, expect } from 'vitest';
import { runSelfHealingDiagnostics } from './systemSelfHealingDoctor.ts';

describe('systemSelfHealingDoctor', () => {
  it('runs diagnostic health check and returns memory and circuit breaker status', async () => {
    const report = await runSelfHealingDiagnostics();

    expect(report.timestamp).toBeDefined();
    expect(report.status).toMatch(/HEALTHY|DEGRADED|CRITICAL/);
    expect(report.memory.heapUsedMb).toBeGreaterThan(0);
    expect(report.selfHealingActionsTaken.length).toBeGreaterThan(0);
  });
});
