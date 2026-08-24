import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCircuitAllowed,
  recordCircuitCall,
  getCircuitMetrics,
  resetCircuit,
  updateCircuitBreakerConfig,
} from './agentCircuitBreaker.ts';

const TEST_KEY = 'test:provider_api';

function setupTest() {
  resetCircuit(TEST_KEY);
  updateCircuitBreakerConfig({
    errorRateThreshold: 0.6,
    minCallsForTrip: 3,
    cooldownMs: 50, // fast cooldown for tests
    halfOpenSuccessRequired: 2,
  });
}

test('agentCircuitBreaker - allows calls when circuit is CLOSED', () => {
  setupTest();
  const check = isCircuitAllowed(TEST_KEY);
  assert.equal(check.allowed, true);
});

test('agentCircuitBreaker - trips circuit OPEN when error rate threshold is exceeded', () => {
  setupTest();
  recordCircuitCall(TEST_KEY, false, 100, 'Error 1');
  recordCircuitCall(TEST_KEY, false, 100, 'Error 2');
  const metrics = recordCircuitCall(TEST_KEY, false, 100, 'Error 3');

  assert.equal(metrics.state, 'OPEN');
  assert.equal(metrics.errorRate, 1.0);

  const check = isCircuitAllowed(TEST_KEY);
  assert.equal(check.allowed, false);
  assert.ok(check.reason?.includes('OPEN'));
});

test('agentCircuitBreaker - enters HALF_OPEN state after cooldown and recovers after required successes', async () => {
  setupTest();
  // Trip circuit
  recordCircuitCall(TEST_KEY, false, 100);
  recordCircuitCall(TEST_KEY, false, 100);
  recordCircuitCall(TEST_KEY, false, 100);

  assert.equal(getCircuitMetrics(TEST_KEY).state, 'OPEN');

  // Wait for cooldown
  await new Promise((r) => setTimeout(r, 60));

  // Next check should allow probe and transition to HALF_OPEN
  const check = isCircuitAllowed(TEST_KEY);
  assert.equal(check.allowed, true);
  assert.equal(getCircuitMetrics(TEST_KEY).state, 'HALF_OPEN');

  // Record probe success 1
  recordCircuitCall(TEST_KEY, true, 50);
  assert.equal(getCircuitMetrics(TEST_KEY).state, 'HALF_OPEN');

  // Record probe success 2 -> should recover to CLOSED
  recordCircuitCall(TEST_KEY, true, 50);
  assert.equal(getCircuitMetrics(TEST_KEY).state, 'CLOSED');
});

