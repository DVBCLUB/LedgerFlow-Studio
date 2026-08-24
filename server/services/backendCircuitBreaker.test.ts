import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeWithCircuitBreaker,
  getOrCreateCircuitBreaker,
  listCircuitBreakerMetrics,
  resetCircuitBreaker,
} from './backendCircuitBreaker.ts';

test('backendCircuitBreaker - executes action normally when circuit is CLOSED', async () => {
  const res = await executeWithCircuitBreaker(
    'test_provider_api',
    async () => 'Primary Success Data',
    async () => 'Fallback Data',
    { failureThreshold: 2 }
  );

  assert.equal(res.result, 'Primary Success Data');
  assert.equal(res.usedFallback, false);
  assert.equal(res.state, 'CLOSED');
});

test('backendCircuitBreaker - trips circuit to OPEN after consecutive failures and uses fallback', async () => {
  const breakerId = 'failing_provider_api';
  resetCircuitBreaker(breakerId);

  // Failing Call 1
  await executeWithCircuitBreaker(
    breakerId,
    async () => { throw new Error('API Rate Limit 429'); },
    async () => 'Fallback 1',
    { failureThreshold: 2, recoveryTimeoutMs: 500 }
  );

  // Failing Call 2 -> Trips Circuit to OPEN
  const res2 = await executeWithCircuitBreaker(
    breakerId,
    async () => { throw new Error('API Rate Limit 429'); },
    async () => 'Fallback 2',
    { failureThreshold: 2, recoveryTimeoutMs: 500 }
  );

  assert.equal(res2.usedFallback, true);
  assert.equal(res2.state, 'OPEN');

  const metrics = getOrCreateCircuitBreaker(breakerId);
  assert.equal(metrics.state, 'OPEN');
});

