import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchRobotOutputToEmployee, listDispatchedRobotTasks } from './robotToEmployeeDispatcher.ts';

describe('robotToEmployeeDispatcher - Autonomous Dispatching', () => {
  it('dispatches budget alert from nightly sweeper directly to AI CFO', () => {
    const task = dispatchRobotOutputToEmployee({
      sourceRobot: 'robot_nightly_sweeper',
      data: { budgetPct: 85, healthScore: 92 },
    });

    assert.equal(task.targetRoleId, 'role_ai_cfo_director');
    assert.equal(task.priority, 'HIGH');
    assert.equal(task.taskCategory, 'FINANCIAL_ACTION');
    assert.ok(task.suggestedAction.includes('Ollama'));
  });

  it('dispatches health drop to AI Security Judge', () => {
    const task = dispatchRobotOutputToEmployee({
      sourceRobot: 'robot_nightly_sweeper',
      data: { budgetPct: 40, healthScore: 65 },
    });

    assert.equal(task.targetRoleId, 'role_ai_security_judge');
    assert.equal(task.priority, 'CRITICAL');
    assert.equal(task.taskCategory, 'SECURITY_REVIEW');
  });

  it('dispatches revenue reconciliation findings to AI CFO', () => {
    const task = dispatchRobotOutputToEmployee({
      sourceRobot: 'robot_revenue_reconciler',
      data: { unpaidCount: 4 },
    });

    assert.equal(task.targetRoleId, 'role_ai_cfo_director');
    assert.ok(task.title.includes('Hóa Đơn'));
  });

  it('lists dispatched tasks properly', () => {
    const all = listDispatchedRobotTasks();
    assert.ok(all.length >= 3);
  });
});
