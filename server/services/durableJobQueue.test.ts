import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueDurableJob,
  claimDueJob,
  completeDurableJob,
  failDurableJob,
  getDurableQueueSummary,
  checkDeadLetterAlert,
  retryDeadLetterJob,
  cancelDurableJob,
} from './durableJobQueue.ts';

test('durableJobQueue - job lifecycle: enqueue -> claim -> complete', async () => {
  const job = await enqueueDurableJob({
    name: 'test_render_invoice',
    payload: { invoiceId: 'inv_dlq_001', amount: 15000000 },
  });

  assert.ok(job.id.startsWith('job_'));
  assert.equal(job.status, 'queued');

  const claimed = await claimDueJob('worker_test_1', { jobId: job.id });
  assert.ok(claimed);
  assert.equal(claimed?.id, job.id);
  assert.equal(claimed?.status, 'running');

  const completed = await completeDurableJob(job.id, 'worker_test_1');
  assert.equal(completed.status, 'completed');
});

test('durableJobQueue - dead letter queue monitoring & manual retry', async () => {
  const job = await enqueueDurableJob({
    name: 'test_failing_task',
    payload: { taskKey: 'fail_me' },
    maxAttempts: 1,
  });

  const claimed = await claimDueJob('worker_test_2', { jobId: job.id });
  assert.ok(claimed);

  // Fail the job past max attempts -> transitions to dead_letter
  const failed = await failDurableJob(job.id, 'worker_test_2', 'External API Gateway Unreachable');
  assert.equal(failed.status, 'dead_letter');

  const dlqAlert = await checkDeadLetterAlert();
  assert.equal(dlqAlert.hasAlert, true);
  assert.ok(dlqAlert.deadLetterCount >= 1);
  assert.ok(dlqAlert.recommendations.length >= 1);

  // Retry the dead letter job
  const retried = await retryDeadLetterJob(job.id);
  assert.equal(retried.status, 'queued');
  assert.equal(retried.attempts, 0);

  // Cancel job to cleanup
  const cancelled = await cancelDurableJob(job.id);
  assert.equal(cancelled.status, 'cancelled');
});
