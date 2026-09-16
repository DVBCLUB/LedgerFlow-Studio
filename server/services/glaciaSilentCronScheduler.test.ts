import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startGlaciaSilentCronScheduler,
  getGlaciaSilentCronSchedulerState,
  executeCronTick,
} from './glaciaSilentCronScheduler.ts';

describe('Glacia Silent Cron Scheduler', () => {
  it('initializes silent enterprise background jobs correctly', () => {
    const schedulerState = startGlaciaSilentCronScheduler(1000);
    assert.equal(schedulerState.isRunning, true);
    assert.ok(schedulerState.jobs.length >= 5);
    assert.equal(schedulerState.schedulerId, 'glacia-silent-cron-master');
  });

  it('executes cron tick and updates timestamps for all jobs', () => {
    const updated = executeCronTick();
    assert.ok(updated.totalJobsExecuted >= 1);
    const taxJob = updated.jobs.find((j) => j.id === 'job-tax-vas-sentinel');
    assert.ok(taxJob);
    assert.equal(taxJob?.status, 'active_silent');
    assert.ok(taxJob?.totalExecutions > 0);
  });
});
