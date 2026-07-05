import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmMissionPush, createMission, getMission } from './autonomousSweAgentLoop.ts';

test('autonomous SWE loop creates a safe default mission', () => {
  const mission = createMission({
    id: 'mission_unit_defaults',
    goalPrompt: 'Fix the selected unit test.',
    platform: 'chatgpt',
    testCommand: 'npm test',
    targetFiles: ['server/services/example.ts'],
  });

  assert.equal(mission.id, 'mission_unit_defaults');
  assert.equal(mission.status, 'running_ai_query');
  assert.equal(mission.config.maxAttempts, 3);
  assert.equal(mission.config.requireHumanApprovalBeforePush, true);
  assert.deepEqual(mission.config.targetFiles, ['server/services/example.ts']);
  assert.equal(getMission('mission_unit_defaults'), mission);
});

test('autonomous SWE loop rejects unsafe target file paths', () => {
  assert.throws(
    () => createMission({
      id: 'mission_unit_bad_path',
      goalPrompt: 'Try unsafe path.',
      platform: 'chatgpt',
      testCommand: 'npm test',
      targetFiles: ['../.env'],
    }),
    /Invalid mission file path/
  );
});

test('autonomous SWE loop does not push without approval state', async () => {
  const mission = createMission({
    id: 'mission_unit_no_push',
    goalPrompt: 'No push until tests pass and review is waiting.',
    platform: 'chatgpt',
    testCommand: 'npm test',
    targetFiles: ['server/services/example.ts'],
  });

  await assert.rejects(() => confirmMissionPush(mission.id), /Mission is not awaiting approval/);
});
