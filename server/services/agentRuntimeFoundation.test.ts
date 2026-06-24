import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApprovalFingerprint, getAgentToolContract, listAgentToolContracts } from './agentToolRegistry.ts';
import { getLocalPipeline, saveLocalPipeline } from './pipelineStore.ts';
import type { Pipeline } from './pipelineOrchestrator.ts';
import { approveAgentToolExecution, consumeAgentToolExecution, createAgentToolExecutionPreview } from './agentToolExecutionGate.ts';
import { cancelDurableJob, claimDueJob, enqueueDurableJob, failDurableJob, getDurableQueueSummary, pruneDurableJobs, retryDeadLetterJob } from './durableJobQueue.ts';

test('tool registry exposes least-privilege risk and approval policy', () => {
  const tools = listAgentToolContracts();
  assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length);
  assert.equal(getAgentToolContract('read_knowledge')?.requiresApproval, false);
  assert.deepEqual(
    { risk: getAgentToolContract('external_connector')?.risk, approval: getAgentToolContract('external_connector')?.requiresApproval },
    { risk: 'high', approval: true },
  );
});

test('approval fingerprint changes when reviewed output changes', () => {
  const first = createApprovalFingerprint({ pipelineId: 'p1', stepId: 's1', output: 'draft one' });
  const second = createApprovalFingerprint({ pipelineId: 'p1', stepId: 's1', output: 'draft two' });
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

test('local pipeline store survives a read cycle', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-pipeline-test-'));
  const previous = process.env.AGENT_PIPELINE_STORE_FILE;
  process.env.AGENT_PIPELINE_STORE_FILE = path.join(directory, 'pipelines.json');
  t.after(async () => {
    if (previous === undefined) delete process.env.AGENT_PIPELINE_STORE_FILE;
    else process.env.AGENT_PIPELINE_STORE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  const pipeline: Pipeline = {
    id: 'pipeline-local-test', userId: 'local', type: 'daily_brief', name: 'Test', status: 'waiting_approval',
    steps: [], input: {}, currentStepIndex: 0, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
  };
  await saveLocalPipeline(pipeline);
  assert.deepEqual(await getLocalPipeline(pipeline.id), pipeline);
});

test('tool approval token is fingerprint-bound and single-use', () => {
  const input = { toolId: 'browser_check', title: 'Inspect login', target: 'local UI', payload: { route: '/login' }, executionMode: 'simulation' as const };
  const preview = createAgentToolExecutionPreview(input);
  assert.equal(preview.requiresApproval, true);
  const approval = approveAgentToolExecution(preview.id, preview.fingerprint);
  assert.equal(consumeAgentToolExecution({ ...input, previewId: preview.id, approvalToken: approval.approvalToken }).id, preview.id);
  assert.throws(() => consumeAgentToolExecution({ ...input, previewId: preview.id, approvalToken: approval.approvalToken }), /required or has expired/);
});

test('tool execution rejects input changed after preview', () => {
  const input = { toolId: 'draft_plan', title: 'Draft plan', payload: { scope: 'P1' }, executionMode: 'simulation' as const };
  const preview = createAgentToolExecutionPreview(input);
  assert.throws(
    () => consumeAgentToolExecution({ ...input, title: 'Changed plan', previewId: preview.id }),
    /changed after preview/,
  );
});

test('durable queue deduplicates active jobs and leases once', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-job-queue-test-'));
  const previous = process.env.DURABLE_JOB_QUEUE_FILE;
  process.env.DURABLE_JOB_QUEUE_FILE = path.join(directory, 'jobs.json');
  t.after(async () => {
    if (previous === undefined) delete process.env.DURABLE_JOB_QUEUE_FILE;
    else process.env.DURABLE_JOB_QUEUE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  const first = await enqueueDurableJob({ name: 'daily', payload: { userId: 'u1' }, dedupeKey: 'daily:u1' });
  const duplicate = await enqueueDurableJob({ name: 'daily', payload: { userId: 'u1' }, dedupeKey: 'daily:u1' });
  assert.equal(duplicate.id, first.id);
  const [claimA, claimB] = await Promise.all([claimDueJob('worker-a'), claimDueJob('worker-b')]);
  assert.equal([claimA, claimB].filter(Boolean).length, 1);
  await assert.rejects(() => cancelDurableJob(first.id), /Only queued, retry, or dead-letter/);
});

test('durable queue retries then moves exhausted work to dead letter', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-job-retry-test-'));
  const previous = process.env.DURABLE_JOB_QUEUE_FILE;
  process.env.DURABLE_JOB_QUEUE_FILE = path.join(directory, 'jobs.json');
  t.after(async () => {
    if (previous === undefined) delete process.env.DURABLE_JOB_QUEUE_FILE;
    else process.env.DURABLE_JOB_QUEUE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  const queued = await enqueueDurableJob({ name: 'retry-me', payload: {}, maxAttempts: 2 });
  const first = await claimDueJob('worker-a', { jobId: queued.id });
  assert.ok(first);
  assert.equal((await failDurableJob(queued.id, 'worker-a', new Error('first failure'), 0)).status, 'retry');
  const second = await claimDueJob('worker-b', { jobId: queued.id });
  assert.ok(second);
  assert.equal((await failDurableJob(queued.id, 'worker-b', new Error('second failure'), 0)).status, 'dead_letter');
  assert.equal((await getDurableQueueSummary()).counts.dead_letter, 1);
  assert.equal((await retryDeadLetterJob(queued.id)).status, 'queued');
  assert.equal((await cancelDurableJob(queued.id)).status, 'cancelled');
  assert.equal((await pruneDurableJobs(30, 0)).removed, 1);
});
