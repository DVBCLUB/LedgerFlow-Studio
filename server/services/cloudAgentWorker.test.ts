import { describe, it, expect } from 'vitest';
import {
  enqueueCloudAgentTask,
  getCloudAgentTask,
  listCloudAgentTasks,
} from './cloudAgentWorker.ts';

describe('cloudAgentWorker', () => {
  it('enqueues background task with priority and retrieves status', async () => {
    const task = await enqueueCloudAgentTask({
      title: 'Full Repository SAST Security Scan',
      goal: 'Scan all 285 service files for security anomalies',
      priority: 'high',
    });

    expect(task.id).toBeDefined();
    expect(task.priority).toBe('high');

    const fetched = await getCloudAgentTask(task.id);
    expect(fetched?.title).toBe('Full Repository SAST Security Scan');

    const list = await listCloudAgentTasks();
    expect(list.length).toBeGreaterThan(0);
  });
});
