import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { triggerAutoHealingMission, getMission } from './autonomousSweAgentLoop.ts';

describe('Autonomous Self-Healing SWE Loop v2', () => {
  it('triggers an auto-healing mission from CI failure log summary', () => {
    const result = triggerAutoHealingMission({
      ciFailureSummary: 'TypeScript build failed: missing property in agentToolRegistry.ts',
      targetFiles: ['package.json'],
      testCommand: 'npm test',
    });

    assert.ok(result.mission.id);
    assert.equal(result.mission.status, 'running_ai_query');
    assert.ok(result.message.includes('Autonomous self-healing mission'));

    const reloaded = getMission(result.mission.id);
    assert.ok(reloaded);
    assert.equal(reloaded?.id, result.mission.id);
    assert.equal(reloaded?.config.platform, 'github_ci');
  });
});
