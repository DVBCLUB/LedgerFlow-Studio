import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeRobotWorkflowFromGoal } from './robotWorkflowSynthesizer.ts';
import { runDigitalTwinRobotSandboxSimulation } from './robotDigitalTwinSandbox.ts';

describe('Milestone 2: Digital Twin Sandbox Pre-Simulation Engine', () => {
  it('pre-simulates 1,000 virtual headless iterations with 100% safety clearance', () => {
    const workflow = synthesizeRobotWorkflowFromGoal('Xuất báo cáo tài chính hàng tuần');
    const simulation = runDigitalTwinRobotSandboxSimulation(workflow, 1000);

    assert.equal(simulation.workflowId, workflow.id);
    assert.equal(simulation.virtualIterations, 1000);
    assert.equal(simulation.status, 'CLEARANCE_APPROVED');
    assert.equal(simulation.safetyClearanceScorePercent, 100);
    assert.equal(simulation.misclickRiskPercent, 0);
  });
});
