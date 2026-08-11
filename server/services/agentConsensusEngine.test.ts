import assert from 'node:assert/strict';
import test from 'node:test';
import { conductMultiAgentDebate } from './agentConsensusEngine.ts';
import { setAIFabricRouterForTest } from './aiFabric.ts';

test('conductMultiAgentDebate approves proposal when agents agree (consensus >= 80%)', async (t) => {
  const restore = setAIFabricRouterForTest(async () => {
    return {
      content: JSON.stringify({
        vote: 'approve',
        confidence: 0.9,
        reasoning: 'Changes are safe and type-safe.',
      }),
      modelUsed: 'test/model',
      raw: {},
      toolCalls: [],
    };
  });
  t.after(restore);

  const session = await conductMultiAgentDebate({
    topic: 'Refactor authService to use JWT tokens',
    domain: 'coding',
    agentRoles: ['code', 'review', 'test'],
  });

  assert.equal(session.finalDecision, 'approved');
  assert.equal(session.status, 'approved');
  assert.ok(session.consensusScore >= 0.8);
  assert.equal(session.rounds.length, 1);
  assert.equal(session.rounds[0].participants.length, 3);
});

test('conductMultiAgentDebate escalates to human when agents disagree (consensus < 80%)', async (t) => {
  let callCount = 0;
  const restore = setAIFabricRouterForTest(async () => {
    callCount++;
    // First agent approves, second and third reject
    const vote = callCount === 1 ? 'approve' : 'reject';
    return {
      content: JSON.stringify({
        vote,
        confidence: 0.9,
        reasoning: vote === 'reject' ? 'High security risk detected.' : 'Looks good.',
      }),
      modelUsed: 'test/model',
      raw: {},
      toolCalls: [],
    };
  });
  t.after(restore);

  const session = await conductMultiAgentDebate({
    topic: 'Bypass authentication for dev endpoint',
    domain: 'coding',
    agentRoles: ['code', 'review', 'test'],
  });

  assert.equal(session.finalDecision, 'escalated_to_human');
  assert.equal(session.status, 'escalated_to_human');
  assert.ok(session.consensusScore < 0.8);
});
