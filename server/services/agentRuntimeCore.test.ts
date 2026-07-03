import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setAIFabricRouterForTest } from './aiFabric.ts';
import { clearAIWorkforceOperationalLedgerForTest } from './aiWorkforceOperationalLedger.ts';
import { clearMissionExecutionQueueStoreForTest } from './aiWorkforceMissionExecutionQueueStore.ts';
import { clearAIWorkforceRunMetricStoreForTest } from './aiWorkforceRunMetricStore.ts';
import { getAIWorkforceRuntimeDashboard } from './aiWorkforceRuntimeHub.ts';
import { clearAIWorkforceRuntimeStoreForTest } from './aiWorkforceRuntimeStore.ts';
import { createAgentMemory } from './agentMemoryStore.ts';
import { getRuntimeCoreMissionMemory, subscribeRuntimeCoreMissionMemory } from './agentRuntimeCore.ts';
import { orchestrateMultiAgent } from './multiAgentOrchestrator.ts';

async function withCoreRuntimeStore(t: any) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ledgerflow-runtime-core-'));
  const previousRuntime = process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
  const previousLedger = process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
  const previousMetrics = process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
  const previousQueues = process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
  const previousMemory = process.env.AGENT_MEMORY_STORE_FILE;
  process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = path.join(directory, 'runtime.json');
  process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = path.join(directory, 'ledger.json');
  process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = path.join(directory, 'metrics.json');
  process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = path.join(directory, 'queues.json');
  process.env.AGENT_MEMORY_STORE_FILE = path.join(directory, 'memory.json');
  await clearAIWorkforceRuntimeStoreForTest();
  await clearAIWorkforceOperationalLedgerForTest();
  await clearAIWorkforceRunMetricStoreForTest();
  await clearMissionExecutionQueueStoreForTest();
  t.after(async () => {
    if (previousRuntime === undefined) delete process.env.AI_WORKFORCE_RUNTIME_STORE_FILE;
    else process.env.AI_WORKFORCE_RUNTIME_STORE_FILE = previousRuntime;
    if (previousLedger === undefined) delete process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE;
    else process.env.AI_WORKFORCE_OPERATIONAL_LEDGER_FILE = previousLedger;
    if (previousMetrics === undefined) delete process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE;
    else process.env.AI_WORKFORCE_RUN_METRIC_STORE_FILE = previousMetrics;
    if (previousQueues === undefined) delete process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE;
    else process.env.AI_WORKFORCE_MISSION_QUEUE_STORE_FILE = previousQueues;
    if (previousMemory === undefined) delete process.env.AGENT_MEMORY_STORE_FILE;
    else process.env.AGENT_MEMORY_STORE_FILE = previousMemory;
    await fs.promises.rm(directory, { recursive: true, force: true });
  });
}

test('multi-agent orchestrator records missions in the canonical runtime core store', async (t) => {
  await withCoreRuntimeStore(t);
  const restore = setAIFabricRouterForTest(async (messages) => {
    const prompt = messages.map((message) => message.content).join('\n');
    return {
      content: prompt.includes('TRẢ VỀ danh sách task') || prompt.includes('TRáº¢ Vá»€ danh sĂ¡ch task')
        ? 'TASK: general | high | Produce runtime core smoke evidence'
        : 'Runtime core smoke task completed.',
      modelUsed: 'test/model',
      raw: {},
      toolCalls: [],
    };
  });
  t.after(restore);

  const plan = await orchestrateMultiAgent({
    goal: 'Runtime core dashboard smoke',
    domain: 'general',
    maxAgents: 1,
    parallel: false,
  });

  assert.equal(plan.status, 'completed');

  const dashboard = await getAIWorkforceRuntimeDashboard();
  assert.ok(dashboard.storeStats.byType.agent_runtime_core_mission >= 1);
  assert.ok(dashboard.recentRecords.some((record: any) => (
    record.type === 'agent_runtime_core_mission'
    && record.payload?.source === 'multi_agent_orchestrator'
    && record.payload?.missionId === plan.id
  )));
});

test('agent memory bus publishes mission-scoped updates to runtime core consumers', async (t) => {
  await withCoreRuntimeStore(t);
  const missionId = 'mission-memory-smoke';
  const received: string[] = [];
  const unsubscribe = subscribeRuntimeCoreMissionMemory(missionId, (record) => {
    received.push(record.id);
  });
  t.after(unsubscribe);

  const memory = await createAgentMemory({
    kind: 'observation',
    title: 'Mission memory smoke',
    content: 'Runtime core should receive this memory without polling.',
    source: 'test',
    tags: [`mission:${missionId}`, 'runtime-core'],
    reviewed: true,
  });

  assert.deepEqual(received, [memory.id]);
  assert.equal(getRuntimeCoreMissionMemory(missionId)[0]?.id, memory.id);
});
