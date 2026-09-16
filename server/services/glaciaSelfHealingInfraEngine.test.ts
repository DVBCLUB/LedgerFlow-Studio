import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSystemInfraHealth,
  triggerEmergencyHealingAction,
} from './glaciaSelfHealingInfraEngine.ts';

describe('Glacia Self-Healing Infrastructure Engine (Epoch 7)', () => {
  it('measures live system memory usage, uptime and health status accurately', () => {
    const health = getSystemInfraHealth();

    assert.ok(health.uptimeSeconds >= 0);
    assert.ok(health.memory.heapUsedMb > 0);
    assert.ok(health.memory.rssMb > 0);
    assert.ok(['OPTIMAL', 'DEGRADED', 'CRITICAL_HEALING'].includes(health.status));
    assert.equal(health.databaseLockStatus, 'unlocked');
  });

  it('triggers emergency healing, purges memory buffers and records healing audit log', () => {
    const res = triggerEmergencyHealingAction('High memory simulation test');

    assert.equal(res.success, true);
    assert.ok(res.freedMemoryMb >= 12);
    assert.ok(res.newHealth.autoHealingHistory.length > 0);
    assert.equal(res.newHealth.autoHealingHistory[0].status, 'healed');
  });
});
