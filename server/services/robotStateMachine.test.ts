import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrentRobotState,
  validateRobotStateTransition,
  transitionRobotState,
  analyzePredictiveMaintenance,
  exportRobotStateDiagramMermaid,
} from './robotStateMachine.ts';

test('robotStateMachine - starts in idle state and validates transitions', () => {
  const check = validateRobotStateTransition('move');
  assert.equal(check.allowed, true);
  assert.equal(check.targetState, 'moving');
});

test('robotStateMachine - performs transition to moving and emergency stop reset', () => {
  const moveRes = transitionRobotState('move');
  assert.equal(moveRes.success, true);
  assert.equal(getCurrentRobotState(), 'moving');

  const stopRes = transitionRobotState('stop');
  assert.equal(stopRes.success, true);
  assert.equal(getCurrentRobotState(), 'emergency_stopped');

  const invalidMove = transitionRobotState('move');
  assert.equal(invalidMove.success, false);

  const resetRes = transitionRobotState('reset');
  assert.equal(resetRes.success, true);
  assert.equal(getCurrentRobotState(), 'idle');
});

test('robotStateMachine - generates predictive maintenance report and Mermaid diagram', () => {
  const report = analyzePredictiveMaintenance();
  assert.ok(report.healthScore >= 0);
  assert.ok(report.status);

  const diagram = exportRobotStateDiagramMermaid();
  assert.ok(diagram.includes('stateDiagram-v2'));
  assert.ok(diagram.includes('idle --> moving'));
});

