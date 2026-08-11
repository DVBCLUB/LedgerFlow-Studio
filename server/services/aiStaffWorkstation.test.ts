import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listAIStaffWorkstations,
  assignTaskToAIStaff,
} from './aiStaffWorkstation.ts';
import { setAIFabricRouterForTest } from './aiFabric.ts';

test('listAIStaffWorkstations returns telemetry for all 7 AI Staff roles', () => {
  const workstations = listAIStaffWorkstations();
  assert.equal(workstations.length, 7);

  const roles = workstations.map((w) => w.role);
  assert.ok(roles.includes('planner'));
  assert.ok(roles.includes('code'));
  assert.ok(roles.includes('review'));

  assert.ok(workstations[0].utilizationPercent >= 0);
  assert.ok(workstations[0].successRatePercent >= 0);
});

test('assignTaskToAIStaff assigns and executes task for an AI Staff role', async (t) => {
  const restore = setAIFabricRouterForTest(async () => ({
    content: 'Completed code review for feature PR.',
    modelUsed: 'test/model',
    raw: {},
    toolCalls: [],
  }));
  t.after(restore);

  const result = await assignTaskToAIStaff({
    role: 'review',
    taskTitle: 'Review pull request #105 for security compliance',
    assignedBy: 'executive',
  });

  assert.ok(result.taskId.startsWith('task_'));
  assert.equal(result.role, 'review');
  assert.equal(result.status, 'COMPLETED');
  assert.ok(result.outputPreview?.includes('Completed code review'));
});
