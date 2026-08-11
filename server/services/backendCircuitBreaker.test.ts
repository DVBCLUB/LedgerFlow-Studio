import { describe, it, expect } from 'vitest';
import {
  executeWithCircuitBreaker,
  getOrCreateCircuitBreaker,
  listCircuitBreakerMetrics,
  resetCircuitBreaker,
} from './backendCircuitBreaker.ts';

describe('backendCircuitBreaker', () => {
  it('executes action normally when circuit is CLOSED', async () => {
    const res = await executeWithCircuitBreaker(
      'test_provider_api',
      async () => 'Primary Success Data',
      async () => 'Fallback Data',
      { failureThreshold: 2 }
    );

    expect(res.result).toBe('Primary Success Data');
    expect(res.usedFallback).toBe(false);
    expect(res.state).toBe('CLOSED');
  });

  it('trips circuit to OPEN after consecutive failures and uses fallback', async () => {
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

    expect(res2.usedFallback).toBe(true);
    expect(res2.state).toBe('OPEN');

    const metrics = getOrCreateCircuitBreaker(breakerId);
    expect(metrics.state).toBe('OPEN');
  });
});
