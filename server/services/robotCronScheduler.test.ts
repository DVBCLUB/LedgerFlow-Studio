import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerRobotCronJob,
  listRobotCronJobs,
  triggerRobotCronJobNow,
} from './robotCronScheduler.ts';

describe('Milestone 2: Autonomous Robot Cron & Task Scheduler', () => {
  it('registers, lists, and manually triggers scheduled robot cron jobs', async () => {
    const job = registerRobotCronJob({
      cronExpression: '0 9 * * *',
      title: 'Daily System Diagnostics Robot',
      webTarget: 'https://sandbox.ledgerflow.io/health',
    });

    assert.ok(job.id.startsWith('cron_'));
    assert.equal(job.cronExpression, '0 9 * * *');

    const jobs = listRobotCronJobs();
    assert.ok(jobs.length >= 2);

    const mission = await triggerRobotCronJobNow(job.id);
    assert.ok(mission.id.startsWith('rpa_multi_'));
    assert.equal(mission.status, 'completed');
  });
});
