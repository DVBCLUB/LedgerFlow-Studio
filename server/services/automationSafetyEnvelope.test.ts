import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertAutomationSafetyEnvelope,
  createEmergencyStopContract,
  validateAutomationSafetyEnvelope,
} from './automationSafetyEnvelope.ts';

test('browser write actions require allowlist, checkpoint, and replay evidence', () => {
  const decision = validateAutomationSafetyEnvelope({
    id: 'browser-login-check',
    surface: 'browser',
    title: 'Inspect local app login',
    allowedTargets: ['http://localhost:5173'],
    humanCheckpoint: true,
    actions: [
      { id: 'a1', type: 'navigate', target: 'http://localhost:5173/login' },
      { id: 'a2', type: 'screenshot', target: 'http://localhost:5173/login' },
    ],
  });

  assert.equal(decision.approved, true);
  assert.equal(decision.mode, 'human_review');
  assert.equal(decision.humanCheckpointRequired, true);
  assert.ok(decision.replay[0].evidenceRequired.includes('screenshot'));
});

test('robot motion is blocked without emergency stop and lab-only mode', () => {
  const decision = validateAutomationSafetyEnvelope({
    id: 'robot-move',
    surface: 'robot',
    title: 'Move robot arm',
    allowedTargets: ['robot://simulator/arm-a'],
    humanCheckpoint: true,
    actions: [{ id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' }],
  });

  assert.equal(decision.approved, false);
  assert.equal(decision.mode, 'blocked');
  assert.ok(decision.issues.some((issue) => issue.includes('emergency stop')));
  assert.throws(
    () => assertAutomationSafetyEnvelope({
      id: 'robot-move',
      surface: 'robot',
      title: 'Move robot arm',
      allowedTargets: ['robot://simulator/arm-a'],
      humanCheckpoint: true,
      actions: [{ id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' }],
    }),
    /Automation safety envelope rejected/,
  );
});

test('robot motion can be approved only as lab-only with emergency stop contract', () => {
  const decision = assertAutomationSafetyEnvelope({
    id: 'robot-sim-move',
    surface: 'robot',
    title: 'Move simulated robot arm',
    allowedTargets: ['robot://simulator/arm-a'],
    humanCheckpoint: true,
    labOnly: true,
    emergencyStop: createEmergencyStopContract(),
    actions: [{ id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' }],
  });

  assert.equal(decision.mode, 'lab_only');
  assert.equal(decision.emergencyStopRequired, true);
  assert.ok(decision.replay[0].evidenceRequired.includes('Telemetry'));
});
