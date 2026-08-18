import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getLiveBoardSnapshot } from './aiWorkforceLiveBoard.ts';

describe('aiWorkforceLiveBoard - Real-time Operations Dashboard', () => {
  it('returns a comprehensive snapshot of active employees, shift and activity feed', () => {
    const board = getLiveBoardSnapshot();

    assert.ok(board.activeShift.name);
    assert.ok(board.totalEmployeesCount >= 4);
    assert.ok(board.employees.length >= 4);
    assert.equal(typeof board.activeCount, 'number');
    assert.equal(typeof board.quarantinedCount, 'number');
    assert.ok(Array.isArray(board.recentFeed));

    for (const emp of board.employees) {
      assert.ok(emp.roleName);
      assert.ok(['ACTIVE', 'IDLE', 'IN_SHIFT', 'QUARANTINED'].includes(emp.status));
      assert.ok(emp.currentAction);
    }
  });
});
