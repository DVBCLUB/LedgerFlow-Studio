import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startGlaciaAutonomousDaemon,
  getGlaciaAutonomousDaemonStatus,
} from './glaciaAutonomousBackgroundRunner.ts';

describe('Glacia Autonomous Background Daemon Runner', () => {
  it('initializes and runs silent background daemon with $0 token cost and low resource impact', () => {
    const status = startGlaciaAutonomousDaemon(1000);

    assert.equal(status.status, 'running_silent');
    assert.equal(status.systemResourceImpact.tokenCostUsd, 0.0);
    assert.ok(status.systemResourceImpact.cpuPercent < 1.0);
    assert.ok(status.totalTicksExecuted >= 1);
    assert.ok(status.activeDirectives.length >= 3);
    assert.equal(status.taskIsolationPolicy.silentBackendOnly, true);
    assert.equal(status.taskIsolationPolicy.frontendNoiseSuppressed, true);
  });

  it('retrieves persistent background daemon telemetry cleanly', () => {
    const current = getGlaciaAutonomousDaemonStatus();
    assert.equal(current.daemonId, 'glacia-daemon-silent-core');
    assert.ok(current.silentTasksExecuted.selfHealingPurges > 0);
    assert.ok(current.silentTasksExecuted.geneticBreedingCycles > 0);
    assert.ok(current.silentTasksExecuted.swarmConsensusTicks > 0);
    assert.ok(current.silentTasksExecuted.offlineInferenceCycles > 0);
    assert.ok(current.silentTasksExecuted.proceduralWorldSeeds > 0);
    assert.ok(current.silentTasksExecuted.telegramMediaDispatches > 0);
  });
});
