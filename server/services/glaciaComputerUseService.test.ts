import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActionHistory,
  clearActionHistory,
  generateReplayScript,
  executeVisionActionLoop,
  type VisionActionStep,
} from './glaciaComputerUseService.ts';

describe('glaciaComputerUseService - Vision-Action Loop & Hands', () => {
  it('tracks and clears action history properly', () => {
    clearActionHistory();
    assert.equal(getActionHistory().length, 0);
  });

  it('generates valid replay JSON script from vision action steps', () => {
    const mockSteps: VisionActionStep[] = [
      {
        stepNumber: 1,
        action: 'click',
        targetDescription: 'Submit Button',
        x: 450,
        y: 220,
        success: true,
        explanation: 'Clicked submit button',
        timestamp: new Date().toISOString(),
      },
      {
        stepNumber: 2,
        action: 'type',
        targetDescription: 'Search Bar',
        text: 'LedgerFlow Studio',
        success: true,
        explanation: 'Typed search keyword',
        timestamp: new Date().toISOString(),
      },
      {
        stepNumber: 3,
        action: 'complete',
        targetDescription: 'Process Finished',
        success: true,
        explanation: 'All steps done',
        timestamp: new Date().toISOString(),
      },
    ];

    const script = generateReplayScript(mockSteps);
    assert.ok(typeof script === 'string');
    const parsed = JSON.parse(script);
    assert.equal(parsed.stepCount, 3);
    assert.equal(parsed.actions[0].action, 'click');
    assert.equal(parsed.actions[1].text, 'LedgerFlow Studio');
    assert.equal(parsed.actions[2].action, 'complete');
  });

  it('executes vision action dry-run loop and returns structured outcome', async () => {
    const result = await executeVisionActionLoop({
      goal: 'Test Dry-run Goal Execution',
      maxSteps: 2,
      dryRun: true,
    });

    assert.ok(result.success);
    assert.equal(result.goal, 'Test Dry-run Goal Execution');
    assert.ok(result.stepsExecuted.length > 0);
    assert.ok(result.durationMs >= 0);
    assert.ok(result.replayScript);
  });
});
