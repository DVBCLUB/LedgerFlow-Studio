import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { advanceAgentRun, approveAgentRunStep, createAgentRun, setAgentRuntimeEmergencyStop } from './agentRuntime.ts';
import { createAgentMemory, reviewAgentMemory, searchAgentMemory } from './agentMemoryStore.ts';
import { approveAgentToolExecution, consumeAgentToolExecution, createAgentToolExecutionPreview } from './agentToolExecutionGate.ts';
import { setRobotEmergencyStop, simulateRobotCommand } from './robotConnector.ts';
import { clearAIWorkforceRuntimeStoreForTest, listAIWorkforceRuntimeRecords } from './aiWorkforceRuntimeStore.ts';

test('agent runtime executes safe steps and waits for fingerprint-bound approval', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-agent-run-'));
  const previousRuntime = process.env.AGENT_RUNTIME_STORE_FILE;
  const previousRuntimeRecords = process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
  const previousMemory = process.env.AGENT_MEMORY_STORE_FILE;
  process.env.AGENT_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(directory, 'runtime-records.json');
  process.env.AGENT_MEMORY_STORE_FILE = path.join(directory, 'memory.json');
  await clearAIWorkforceRuntimeStoreForTest();
  t.after(async () => {
    if (previousRuntime === undefined) delete process.env.AGENT_RUNTIME_STORE_FILE; else process.env.AGENT_RUNTIME_STORE_FILE = previousRuntime;
    if (previousRuntimeRecords === undefined) delete process.env.AI_WORKFORCE_RUNTIME_STORE_FILE; else process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = previousRuntimeRecords;
    if (previousMemory === undefined) delete process.env.AGENT_MEMORY_STORE_FILE; else process.env.AGENT_MEMORY_STORE_FILE = previousMemory;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });

  const created = await createAgentRun({ goal: 'Prepare a reviewed product patch', requestedTools: ['draft_patch'] });
  const waiting = await advanceAgentRun(created.id);
  assert.equal(waiting.status, 'waiting_approval');
  assert.equal(waiting.steps[0].status, 'completed');
  assert.equal(waiting.steps[1].status, 'completed');
  const approvalStep = waiting.steps[2];
  assert.equal(approvalStep.status, 'waiting_approval');
  assert.ok(approvalStep.approvalFingerprint);
  await assert.rejects(() => approveAgentRunStep(created.id, { stepId: approvalStep.id, fingerprint: '0'.repeat(64), phrase: 'APPROVE AGENT STEP' }), /does not match/);
  const approved = await approveAgentRunStep(created.id, { stepId: approvalStep.id, fingerprint: approvalStep.approvalFingerprint!, phrase: 'APPROVE AGENT STEP' });
  assert.equal(approved.status, 'completed');
  assert.equal(approved.artifacts.length, 3);

  const runtimeRecords = await listAIWorkforceRuntimeRecords({ type: 'agent_execution_run' });
  const record = runtimeRecords.find((item) => item.id === `agent_execution_run_${created.id}`);
  assert.ok(record);
  assert.deepEqual(
    {
      surface: (record.payload as any).surface,
      event: (record.payload as any).event,
      status: (record.payload as any).status,
      stepCount: (record.payload as any).stepCount,
      completedStepCount: (record.payload as any).completedStepCount,
    },
    {
      surface: 'agent_runtime',
      event: 'approved_step',
      status: 'completed',
      stepCount: 3,
      completedStepCount: 3,
    },
  );
});

test('runtime emergency stop blocks new execution', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-agent-stop-'));
  const previous = process.env.AGENT_RUNTIME_STORE_FILE;
  process.env.AGENT_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  t.after(async () => {
    if (previous === undefined) delete process.env.AGENT_RUNTIME_STORE_FILE; else process.env.AGENT_RUNTIME_STORE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
  const run = await createAgentRun({ goal: 'Safe planning task' });
  await setAgentRuntimeEmergencyStop(true, 'Safety test');
  await assert.rejects(() => advanceAgentRun(run.id), /emergency stop/);
  await setAgentRuntimeEmergencyStop(false);
});

test('memory search excludes drafts until reviewed and returns citations', async (t) => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-agent-memory-'));
  const previous = process.env.AGENT_MEMORY_STORE_FILE;
  process.env.AGENT_MEMORY_STORE_FILE = path.join(directory, 'memory.json');
  t.after(async () => {
    if (previous === undefined) delete process.env.AGENT_MEMORY_STORE_FILE; else process.env.AGENT_MEMORY_STORE_FILE = previous;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
  const memory = await createAgentMemory({ kind: 'procedure', title: 'Release safety', content: 'Always create a draft pull request.', source: 'test' });
  assert.equal((await searchAgentMemory('draft pull request')).length, 0);
  await reviewAgentMemory(memory.id, 'reviewed');
  const results = await searchAgentMemory('draft pull request');
  assert.equal(results.length, 1);
  assert.match(results[0].citation, new RegExp(memory.id));
});

test('agent tool execution gate attaches automation safety decision and consumes approval once', () => {
  const preview = createAgentToolExecutionPreview({
    toolId: 'draft_patch',
    title: 'Draft reviewed code patch',
    target: 'agent-tool://draft_patch',
    executionMode: 'simulation',
  });

  assert.equal(preview.safetyDecision.approved, true);
  assert.equal(preview.safetyDecision.humanCheckpointRequired, true);
  assert.equal(preview.safetyPlan.surface, 'computer');
  assert.equal(preview.requiresApproval, true);

  assert.throws(() => consumeAgentToolExecution({ toolId: 'draft_patch', title: 'Draft reviewed code patch', target: 'agent-tool://draft_patch', executionMode: 'simulation', previewId: preview.id }), /approval token/i);
  const approval = approveAgentToolExecution(preview.id, preview.fingerprint);
  const consumed = consumeAgentToolExecution({ toolId: 'draft_patch', title: 'Draft reviewed code patch', target: 'agent-tool://draft_patch', executionMode: 'simulation', previewId: preview.id, approvalToken: approval.approvalToken });
  assert.equal(consumed.id, preview.id);
  assert.throws(() => consumeAgentToolExecution({ toolId: 'draft_patch', title: 'Draft reviewed code patch', target: 'agent-tool://draft_patch', executionMode: 'simulation', previewId: preview.id, approvalToken: approval.approvalToken }), /expired|required/);
});

test('agent tool execution gate blocks non-allowlisted automation targets', () => {
  assert.throws(
    () => createAgentToolExecutionPreview({
      toolId: 'browser_check',
      title: 'Read unsafe browser target',
      target: 'browser://external/admin',
      payload: { allowedTargets: ['browser://sandbox'] },
      executionMode: 'simulation',
    }),
    /non-allowlisted/,
  );
});

test('robot connector remains simulation-only and enforces safety limits', () => {
  setRobotEmergencyStop(false);
  assert.throws(() => simulateRobotCommand({ command: 'move', position: { x: 10, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 } }), /approvalPhrase|approval phrase/i);
  assert.throws(() => simulateRobotCommand({ command: 'move', position: { x: 501, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 }, approvalPhrase: 'APPROVE ROBOT SIMULATION' }), /safety envelope|simulation envelope/i);
  const result = simulateRobotCommand({ command: 'move', position: { x: 10, y: 20, z: 30, roll: 0, pitch: 0, yaw: 0 }, velocity: 25, approvalPhrase: 'APPROVE ROBOT SIMULATION' });

  assert.equal(result.mode, 'simulation');
  assert.deepEqual((result.evidence.state as { position: unknown }).position, { x: 10, y: 20, z: 30, roll: 0, pitch: 0, yaw: 0 });
  simulateRobotCommand({ command: 'stop' });

  assert.throws(() => simulateRobotCommand({ command: 'home' }), /emergency stop/);
  setRobotEmergencyStop(false);
});
