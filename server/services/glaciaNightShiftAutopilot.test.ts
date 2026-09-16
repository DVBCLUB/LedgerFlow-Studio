import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startNightShiftAutopilot,
  getNightShiftHistory,
  getLatestMorningBriefing,
} from './glaciaNightShiftAutopilot.ts';

describe('glaciaNightShiftAutopilot - 24/7 Autonomous Night Mode', () => {
  it('executes night shift autopilot session and completes queued tasks', async () => {
    const session = await startNightShiftAutopilot();

    assert.ok(session.id.startsWith('night_'));
    assert.equal(session.status, 'completed');
    assert.equal(session.tasksCompleted, 8);
    assert.equal(session.tasksFailed, 0);
    assert.ok(session.morningHandoffBriefing?.includes('David Bao'));
    assert.ok(session.systemHealthScore >= 90);
  });

  it('retrieves night shift history and morning handoff briefing', () => {
    const history = getNightShiftHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 0);

    const briefing = getLatestMorningBriefing();
    assert.ok(typeof briefing === 'string');
    assert.ok(briefing.length > 0);
  });
});
