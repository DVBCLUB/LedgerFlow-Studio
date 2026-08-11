import { describe, it, expect, beforeEach } from 'vitest';
import {
  isCircuitAllowed,
  recordCircuitCall,
  getCircuitMetrics,
  resetCircuit,
  updateCircuitBreakerConfig,
} from './agentCircuitBreaker.ts';

describe('agentCircuitBreaker', () => {
  const TEST_KEY = 'test:provider_api';

  beforeEach(() => {
    resetCircuit(TEST_KEY);
    updateCircuitBreakerConfig({
      errorRateThreshold: 0.6,
      minCallsForTrip: 3,
      cooldownMs: 50, // fast cooldown for tests
      halfOpenSuccessRequired: 2,
    });
  });

  it('allows calls when circuit is CLOSED', () => {
    const check = isCircuitAllowed(TEST_KEY);
    expect(check.allowed).toBe(true);
  });

  it('trips circuit OPEN when error rate threshold is exceeded', () => {
    recordCircuitCall(TEST_KEY, false, 100, 'Error 1');
    recordCircuitCall(TEST_KEY, false, 100, 'Error 2');
    const metrics = recordCircuitCall(TEST_KEY, false, 100, 'Error 3');

    expect(metrics.state).toBe('OPEN');
    expect(metrics.errorRate).toBe(1.0);

    const check = isCircuitAllowed(TEST_KEY);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('OPEN');
  });

  it('enters HALF_OPEN state after cooldown and recovers after required successes', async () => {
    // Trip circuit
    recordCircuitCall(TEST_KEY, false, 100);
    recordCircuitCall(TEST_KEY, false, 100);
    recordCircuitCall(TEST_KEY, false, 100);

    expect(getCircuitMetrics(TEST_KEY).state).toBe('OPEN');

    // Wait for cooldown
    await new Promise((r) => setTimeout(r, 60));

    // Next check should allow probe and transition to HALF_OPEN
    const check = isCircuitAllowed(TEST_KEY);
    expect(check.allowed).toBe(true);
    expect(getCircuitMetrics(TEST_KEY).state).toBe('HALF_OPEN');

    // Record probe success 1
    recordCircuitCall(TEST_KEY, true, 50);
    expect(getCircuitMetrics(TEST_KEY).state).toBe('HALF_OPEN');

    // Record probe success 2 -> should recover to CLOSED
    recordCircuitCall(TEST_KEY, true, 50);
    expect(getCircuitMetrics(TEST_KEY).state).toBe('CLOSED');
  });
});
