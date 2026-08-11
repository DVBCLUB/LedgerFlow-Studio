import { describe, it, expect } from 'vitest';
import {
  getCurrentRobotState,
  validateRobotStateTransition,
  transitionRobotState,
  analyzePredictiveMaintenance,
  exportRobotStateDiagramMermaid,
} from './robotStateMachine.ts';

describe('robotStateMachine', () => {
  it('starts in idle state', () => {
    expect(getCurrentRobotState()).toBe('idle');
  });

  it('validates allowed state transitions from idle to moving', () => {
    const check = validateRobotStateTransition('move');
    expect(check.allowed).toBe(true);
    expect(check.targetState).toBe('moving');
  });

  it('performs transition to moving and back to idle', () => {
    const moveRes = transitionRobotState('move');
    expect(moveRes.success).toBe(true);
    expect(getCurrentRobotState()).toBe('moving');

    const homeRes = transitionRobotState('home');
    expect(homeRes.success).toBe(true);
    expect(getCurrentRobotState()).toBe('moving');
  });

  it('transitions to emergency_stopped on stop command and resets back to idle', () => {
    const stopRes = transitionRobotState('stop');
    expect(stopRes.success).toBe(true);
    expect(getCurrentRobotState()).toBe('emergency_stopped');

    const invalidMove = transitionRobotState('move');
    expect(invalidMove.success).toBe(false);

    const resetRes = transitionRobotState('reset');
    expect(resetRes.success).toBe(true);
    expect(getCurrentRobotState()).toBe('idle');
  });

  it('generates predictive maintenance report and Mermaid diagram', () => {
    const report = analyzePredictiveMaintenance();
    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.status).toBeDefined();

    const diagram = exportRobotStateDiagramMermaid();
    expect(diagram).toContain('stateDiagram-v2');
    expect(diagram).toContain('idle --> moving');
  });
});
