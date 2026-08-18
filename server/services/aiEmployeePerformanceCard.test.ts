import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEmployeeKpiCard, listAllEmployeeKpiCards } from './aiEmployeePerformanceCard.ts';

describe('aiEmployeePerformanceCard - Employee Scorecards', () => {
  it('generates a complete KPI card for a specific role', () => {
    const card = getEmployeeKpiCard('role_chief_of_staff');

    assert.equal(card.roleId, 'role_chief_of_staff');
    assert.ok(card.overallScore >= 80);
    assert.ok(['A+', 'A', 'B'].includes(card.grade));
    assert.ok(card.metrics.tasksCompleted > 0);
    assert.ok(card.executiveEvaluationText.length > 20);
  });

  it('lists KPI scorecards for all registered roles', () => {
    const all = listAllEmployeeKpiCards();
    assert.ok(all.length >= 4);
    for (const card of all) {
      assert.ok(card.roleId);
      assert.ok(card.department);
      assert.ok(typeof card.overallScore === 'number');
    }
  });
});
