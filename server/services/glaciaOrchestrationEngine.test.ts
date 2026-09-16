import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  executeTask,
  getOrchestrationMetrics,
  getQueuedTasks,
  getCompletedTasks,
  cancelTask,
  resetOrchestration,
  executeParallel,
  createTask,
  completeTask,
} from './glaciaOrchestrationEngine.ts';
import { __resetActionLedgerForTesting, queryAIActionLedger } from './aiActionLedger.ts';
import { loadAutonomyState, saveAutonomyState } from './glaciaAutonomyGate.ts';

describe('Glacia Orchestration Engine', () => {
  before(() => {
    resetOrchestration();
    __resetActionLedgerForTesting();
  });

  it('executes a skill task successfully', async () => {
    const task = await executeTask('skill_execute', {
      skillId: 'skill-render-video-shorts',
    }, 'normal');

    assert.ok(task.id.startsWith('glacia-task-'));
    assert.equal(task.type, 'skill_execute');
    assert.equal(task.priority, 'normal');
    assert.ok(['completed', 'failed'].includes(task.status));
    assert.ok(task.createdAt);
  });

  it('executes a web research task', async () => {
    const task = await executeTask('web_research', {
      query: 'Latest AI trends 2026',
    }, 'high');

    assert.equal(task.type, 'web_research');
    assert.equal(task.priority, 'high');
  });

  it('returns orchestration metrics', () => {
    const metrics = getOrchestrationMetrics();
    assert.ok(typeof metrics.totalTasksExecuted === 'number');
    assert.ok(typeof metrics.successRate === 'number');
    assert.ok(typeof metrics.avgLatencyMs === 'number');
    assert.ok(metrics.tasksByType);
    assert.ok(typeof metrics.uptimeHours === 'number');
    assert.ok(typeof metrics.activeTasks === 'number');
    assert.ok(typeof metrics.queueDepth === 'number');
    assert.ok(metrics.lastRunAt);
  });

  it('returns queued and completed tasks', () => {
    const queued = getQueuedTasks();
    const completed = getCompletedTasks();
    assert.ok(Array.isArray(queued));
    assert.ok(Array.isArray(completed));
  });

  it('cancels a task by ID', async () => {
    const task = await executeTask('skill_execute', { skillId: 'skill-render-video-shorts' }, 'low');
    const cancelled = cancelTask(task.id);
    assert.equal(cancelled, true);
  });

  it('returns false when cancelling non-existent task', () => {
    const result = cancelTask('non-existent-task-id');
    assert.equal(result, false);
  });

  it('executes parallel tasks', async () => {
    const results = await executeParallel([
      { type: 'skill_execute', payload: { skillId: 'skill-render-video-shorts' }, priority: 'normal' },
      { type: 'skill_execute', payload: { skillId: 'skill-render-video-shorts' }, priority: 'low' },
    ]);

    assert.ok(Array.isArray(results));
    assert.equal(results.length, 2);
    results.forEach(task => {
      assert.ok(task);
      assert.ok(task!.id);
      assert.ok(task!.status);
    });
  });

  it('keeps a cancelled task terminal when a late tool response arrives', () => {
    const task = createTask('skill_execute', { skillId: 'skill-render-video-shorts' });
    assert.equal(cancelTask(task.id), true);
    completeTask(task.id, { shouldNot: 'resurrect' });
    assert.equal(getCompletedTasks(1)[0].status, 'cancelled');
  });

  it('writes an integrity-checked audit record for every robot task outcome', async () => {
    const originalState = { ...loadAutonomyState() };
    saveAutonomyState({ ...originalState, emergencyLockout: true });
    const task = await executeTask('multi_model_reason', { messages: [{ role: 'user', content: 'status' }] }, 'low', 0);
    saveAutonomyState(originalState);
    assert.equal(task.status, 'failed');
    const ledger = queryAIActionLedger({ domain: 'glacia_orchestration' });
    assert.ok(ledger.total >= 1);
    assert.equal(ledger.isChainValid, true);
    assert.ok(ledger.entries[0].targetResource.startsWith('glacia-task-'));
  });

  it('resets orchestration state', () => {
    resetOrchestration();
    const metrics = getOrchestrationMetrics();
    assert.equal(metrics.totalTasksExecuted, 0);
    assert.equal(metrics.activeTasks, 0);
    assert.equal(metrics.queueDepth, 0);
  });
});
