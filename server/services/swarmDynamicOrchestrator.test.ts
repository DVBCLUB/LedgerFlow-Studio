import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dispatchAgentSwarm,
  getSwarmExecution,
  listSwarmExecutions,
} from './swarmDynamicOrchestrator.ts';
import { setAIFabricRouterForTest } from './aiFabric.ts';

test('dispatchAgentSwarm dispatches hierarchical swarm and completes task nodes', async (t) => {
  const restore = setAIFabricRouterForTest(async (messages) => {
    return {
      content: 'Swarm sub-task executed successfully.',
      modelUsed: 'test/model',
      raw: {},
      toolCalls: [],
    };
  });
  t.after(restore);

  const result = await dispatchAgentSwarm({
    goal: 'Build automated invoice matching algorithm',
    topology: 'hierarchical',
    domain: 'coding',
  });

  assert.ok(result.id.startsWith('swarm_'));
  assert.equal(result.topology, 'hierarchical');
  assert.equal(result.status, 'completed');
  assert.ok(result.nodes.length >= 2);
  assert.equal(result.nodes[0].status, 'completed');

  const retrieved = getSwarmExecution(result.id);
  assert.equal(retrieved?.id, result.id);
});

test('dispatchAgentSwarm supports sequential_pipeline topology', async (t) => {
  const restore = setAIFabricRouterForTest(async () => ({
    content: 'Pipeline step output.',
    modelUsed: 'test/model',
    raw: {},
    toolCalls: [],
  }));
  t.after(restore);

  const result = await dispatchAgentSwarm({
    goal: 'Marketing campaign generation pipeline',
    topology: 'sequential_pipeline',
    domain: 'marketing',
  });

  assert.equal(result.topology, 'sequential_pipeline');
  assert.equal(result.status, 'completed');
});

test('listSwarmExecutions lists recent swarm runs', async () => {
  const list = listSwarmExecutions(5);
  assert.ok(list.length >= 1);
});
