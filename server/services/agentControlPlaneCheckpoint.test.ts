import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveControlPlaneRunCheckpoint,
  loadControlPlaneRunCheckpoint,
  listControlPlaneRunCheckpoints,
  saveSwarmMissionCheckpoint,
  loadSwarmMissionCheckpoint,
  listSwarmMissionCheckpoints,
} from './agentControlPlaneCheckpoint.ts';
import type { ControlPlaneRun } from './agentControlPlane.ts';
import type { SwarmMission } from './agentSwarmCoordinator.ts';

describe('Agent Control Plane SQLite Checkpoint Engine', () => {
  it('persists and reloads ControlPlaneRun checkpoints correctly', () => {
    const mockRun: ControlPlaneRun = {
      id: `cp_test_${Date.now()}`,
      goal: 'Refactor accounting ledger tax calculation module',
      status: 'running',
      phases: ['analyze', 'plan'],
      steps: [
        { phase: 'analyze', status: 'completed', startedAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveControlPlaneRunCheckpoint(mockRun);

    const reloaded = loadControlPlaneRunCheckpoint(mockRun.id);
    assert.ok(reloaded);
    assert.equal(reloaded?.id, mockRun.id);
    assert.equal(reloaded?.goal, mockRun.goal);
    assert.equal(reloaded?.status, 'running');
    assert.equal(reloaded?.steps.length, 1);

    const list = listControlPlaneRunCheckpoints();
    assert.ok(list.some((r) => r.id === mockRun.id));
  });

  it('persists and reloads SwarmMission checkpoints correctly', () => {
    const mockMission: SwarmMission = {
      id: `swarm_test_${Date.now()}`,
      goal: 'Perform automated security audit across API endpoints',
      domain: 'security',
      agents: [],
      tasks: [],
      results: [],
      mergedOutput: 'Audit complete: No critical vulnerability found.',
      status: 'completed',
      summary: 'Security audit finished cleanly.',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalLatencyMs: 1200,
      log: ['Swarm initialized', 'Tasks completed'],
    };

    saveSwarmMissionCheckpoint(mockMission);

    const reloaded = loadSwarmMissionCheckpoint(mockMission.id);
    assert.ok(reloaded);
    assert.equal(reloaded?.id, mockMission.id);
    assert.equal(reloaded?.status, 'completed');
    assert.equal(reloaded?.mergedOutput, mockMission.mergedOutput);

    const list = listSwarmMissionCheckpoints();
    assert.ok(list.some((m) => m.id === mockMission.id));
  });
});
