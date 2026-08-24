import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueCloudAgentTask,
  getCloudAgentTask,
  listCloudAgentTasks,
} from './cloudAgentWorker.ts';

test('cloudAgentWorker - enqueues background task with priority and retrieves status', async () => {
  const task = await enqueueCloudAgentTask({
    title: 'Full Repository SAST Security Scan',
    goal: 'Scan all 285 service files for security anomalies',
    priority: 'high',
  });

  assert.ok(task.id);
  assert.equal(task.priority, 'high');

  const fetched = await getCloudAgentTask(task.id);
  assert.equal(fetched?.title, 'Full Repository SAST Security Scan');

  const list = await listCloudAgentTasks();
  assert.ok(list.length > 0);
});

