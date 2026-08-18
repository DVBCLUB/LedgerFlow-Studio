import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueTask,
  dequeueNextTaskForRole,
  completeSmartTask,
  getQueueSnapshot,
  computePriorityScore,
  __resetTaskQueueForTesting,
} from './aiSmartTaskQueue.ts';

describe('aiSmartTaskQueue - Priority-based Task Queue', () => {
  beforeEach(() => {
    __resetTaskQueueForTesting();
  });

  it('calculates priority score accurately with urgency, impact, and deadline', () => {
    const scoreHigh = computePriorityScore(10, 10, new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
    const scoreLow = computePriorityScore(1, 1, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    assert.ok(scoreHigh >= 90);
    assert.ok(scoreLow <= 30);
  });

  it('orders tasks so higher priority tasks are dequeued first for a role', () => {
    enqueueTask({
      title: 'Viết bài blog định kỳ',
      assignedRoleId: 'role_ai_code_specialist',
      urgency: 2,
      businessImpact: 3,
    });

    enqueueTask({
      title: 'HOTFIX: Lỗi tính toán hóa đơn VAS 200',
      assignedRoleId: 'role_ai_code_specialist',
      urgency: 10,
      businessImpact: 10,
      deadlineAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    enqueueTask({
      title: 'Refactor UI button',
      assignedRoleId: 'role_ai_code_specialist',
      urgency: 4,
      businessImpact: 4,
    });

    const nextTask = dequeueNextTaskForRole('role_ai_code_specialist');
    assert.ok(nextTask);
    assert.equal(nextTask.title, 'HOTFIX: Lỗi tính toán hóa đơn VAS 200');
    assert.equal(nextTask.status, 'IN_PROGRESS');

    const completed = completeSmartTask(nextTask.taskId, 'Đã sửa và push patch.');
    assert.equal(completed.status, 'COMPLETED');

    const snapshot = getQueueSnapshot();
    assert.equal(snapshot.completedCount, 1);
    assert.equal(snapshot.queuedCount, 2);
  });

  it('returns null when no tasks available for a role', () => {
    const task = dequeueNextTaskForRole('role_non_existent');
    assert.equal(task, null);
  });
});
