import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentActiveShift, listAIShifts, executeShiftRoutine } from './aiShiftScheduler.ts';

describe('aiShiftScheduler - Shift Automation System', () => {
  it('determines active shifts accurately based on hour', () => {
    const morning = getCurrentActiveShift(8);
    assert.equal(morning.id, 'morning_shift');
    assert.equal(morning.leaderRoleId, 'role_chief_of_staff');

    const afternoon = getCurrentActiveShift(15);
    assert.equal(afternoon.id, 'afternoon_shift');

    const night = getCurrentActiveShift(23);
    assert.equal(night.id, 'night_shift');
  });

  it('lists all 3 shifts with current real-time state', () => {
    const shifts = listAIShifts();
    assert.equal(shifts.length, 3);
    const activeCount = shifts.filter((s) => s.isActiveNow).length;
    assert.equal(activeCount, 1);
  });

  it('executes shift routine and registers action', () => {
    const res = executeShiftRoutine('morning_shift');
    assert.equal(res.status, 'COMPLETED');
    assert.ok(res.tasksExecuted.length >= 3);
    assert.ok(res.summary.includes('Chief of Staff') || res.summary.includes('role_chief_of_staff'));
  });
});
