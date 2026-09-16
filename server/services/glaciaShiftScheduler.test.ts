import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGlaciaShiftOverview,
  executeNightShiftAutonomousCycle,
} from './glaciaShiftScheduler.ts';

describe('Glacia Shift Scheduler', () => {
  it('returns shift overview with agents', () => {
    const overview = getGlaciaShiftOverview();
    assert.ok(overview.currentShift);
    assert.ok(overview.shiftLabel);
    assert.ok(overview.activeAgentsCount > 0);
    assert.ok(typeof overview.swarmHealthPct === 'number');
    assert.ok(overview.nextShiftChange);
    assert.ok(Array.isArray(overview.agents));
    assert.ok(Array.isArray(overview.recentShiftLogs));
  });

  it('returns day or night shift', () => {
    const overview = getGlaciaShiftOverview();
    assert.ok(['day_interactive', 'night_autonomous'].includes(overview.currentShift));
  });

  it('returns agents with correct structure', () => {
    const overview = getGlaciaShiftOverview();
    const agent = overview.agents[0];
    assert.ok(agent.id);
    assert.ok(agent.name);
    assert.ok(agent.role);
    assert.ok(agent.currentTask);
    assert.ok(['idle', 'working', 'completed', 'standby'].includes(agent.status));
    assert.ok(agent.lastActive);
  });

  it('executes night shift autonomous cycle', async () => {
    const log = await executeNightShiftAutonomousCycle();
    assert.ok(log.id);
    assert.equal(log.shift, 'night_autonomous');
    assert.ok(Array.isArray(log.executedTasks));
    assert.ok(log.summary);
    assert.ok(log.timestamp);
  });
});
