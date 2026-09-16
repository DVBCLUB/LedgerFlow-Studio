import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadAutonomousLoopState,
  executeFullAutonomousCreativeCycle,
} from './glaciaInfiniteAutonomousLoopEngine.ts';

describe('glaciaInfiniteAutonomousLoopEngine - Level 5 Infinite Autonomous Creative Loop', () => {
  it('loads autonomous loop state with active telemetry', () => {
    const state = loadAutonomousLoopState();
    assert.ok(state.completedCyclesCount >= 0);
    assert.ok(state.totalDollarsSaved >= 0);
  });

  it('executes full 8-stage creative loop autonomously', () => {
    const run = executeFullAutonomousCreativeCycle({
      targetDomain: 'game',
      customTitle: 'Cosmic Invaders 60FPS',
    });

    assert.equal(run.targetDomain, 'game');
    assert.equal(run.stages.length, 8);
    assert.equal(run.finalProductSummary.costUsd, 0.0);
    assert.ok(run.stages.some((s) => s.stageCode === 'goal'));
    assert.ok(run.stages.some((s) => s.stageCode === 'mining'));
    assert.ok(run.stages.some((s) => s.stageCode === 'giants'));
    assert.ok(run.stages.some((s) => s.stageCode === 'audio'));
    assert.ok(run.stages.some((s) => s.stageCode === 'playtest'));
    assert.ok(run.stages.some((s) => s.stageCode === 'self_heal'));
    assert.ok(run.stages.some((s) => s.stageCode === 'distribute'));
  });
});
