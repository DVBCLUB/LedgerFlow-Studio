import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAgentRateLimit,
  consumeAgentRateLimit,
  resetAgentRateLimit,
  getAgentRateLimiterStatus,
} from './agentRateLimiter.ts';

test('agentRateLimiter - initial bucket capacity allows requests', () => {
  resetAgentRateLimit('test_client_1');
  const check = checkAgentRateLimit('test_client_1', 'agent');
  assert.equal(check.allowed, true);
  assert.equal(check.remainingTokens, 30);
});

test('agentRateLimiter - consuming tokens reduces balance', () => {
  resetAgentRateLimit('test_client_2');
  const consume1 = consumeAgentRateLimit('test_client_2', 'robot', 5);
  assert.equal(consume1.allowed, true);
  assert.equal(consume1.remainingTokens, 15);

  // Consume all remaining tokens
  const consumeAll = consumeAgentRateLimit('test_client_2', 'robot', 15);
  assert.equal(consumeAll.allowed, true);
  assert.equal(consumeAll.remainingTokens, 0);

  // Next consumption should be blocked
  const blocked = consumeAgentRateLimit('test_client_2', 'robot', 1);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test('agentRateLimiter - status report lists active buckets', () => {
  resetAgentRateLimit();
  consumeAgentRateLimit('agent_cfo', 'agent', 2);
  consumeAgentRateLimit('robot_nightly', 'robot', 1);

  const status = getAgentRateLimiterStatus();
  assert.equal(status.activeClientCount, 2);
  assert.ok(status.clients.some((c) => c.clientId === 'agent_cfo'));
  assert.ok(status.clients.some((c) => c.clientId === 'robot_nightly'));
});
