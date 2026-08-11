/**
 * backendCircuitBreaker.ts
 * ============================================================
 * Enterprise Backend Circuit Breaker & Resilient Fallback Engine.
 *
 * Protects LedgerFlow OS backend against external API failures (OpenAI, Claude, ElevenLabs, Runway, Midjourney):
 *  - States: 'CLOSED' (Normal) | 'OPEN' (Tripped - Redirects to Fallback) | 'HALF_OPEN' (Testing Probe)
 *  - Configurable failure threshold, recovery timeout, and automatic local fallback execution.
 *  - Telemetry logging and audit stream integration.
 */

import { emitTelemetryEvent } from './agentTelemetryStream.ts';
import { appendAuditEvent } from './auditLog.ts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of consecutive failures before tripping (Default: 3)
  recoveryTimeoutMs: number; // Time to wait in OPEN state before testing HALF_OPEN (Default: 30,000ms)
  halfOpenSuccessThreshold: number; // Successes required in HALF_OPEN to reset to CLOSED (Default: 2)
}

export interface CircuitBreakerMetrics {
  id: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastStateChange: string;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  recoveryTimeoutMs: 30000,
  halfOpenSuccessThreshold: 2,
};

const circuitRegistry = new Map<string, {
  metrics: CircuitBreakerMetrics;
  config: CircuitBreakerConfig;
}>();

export function getOrCreateCircuitBreaker(id: string, customConfig?: Partial<CircuitBreakerConfig>): CircuitBreakerMetrics {
  if (!circuitRegistry.has(id)) {
    const config = { ...DEFAULT_CONFIG, ...customConfig };
    const metrics: CircuitBreakerMetrics = {
      id,
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      lastStateChange: new Date().toISOString(),
    };
    circuitRegistry.set(id, { metrics, config });
  }
  return circuitRegistry.get(id)!.metrics;
}

export async function executeWithCircuitBreaker<T>(
  breakerId: string,
  action: () => Promise<T>,
  fallbackAction: () => Promise<T>,
  customConfig?: Partial<CircuitBreakerConfig>
): Promise<{ result: T; usedFallback: boolean; state: CircuitState }> {
  const entry = circuitRegistry.get(breakerId) || (() => {
    getOrCreateCircuitBreaker(breakerId, customConfig);
    return circuitRegistry.get(breakerId)!;
  })();

  const { metrics, config } = entry;
  const now = Date.now();

  // Check if OPEN state has expired and should transition to HALF_OPEN
  if (metrics.state === 'OPEN') {
    if (metrics.lastFailureTime && now - metrics.lastFailureTime >= config.recoveryTimeoutMs) {
      metrics.state = 'HALF_OPEN';
      metrics.successCount = 0;
      metrics.lastStateChange = new Date().toISOString();

      emitTelemetryEvent({
        category: 'agent_runtime',
        eventType: 'circuit_breaker_half_open',
        source: 'backend_circuit_breaker',
        summary: `Circuit breaker "${breakerId}" transitioned to HALF_OPEN probe state.`,
        payload: { breakerId },
      });
    } else {
      // Still OPEN -> Execute Fallback immediately
      const fallbackResult = await fallbackAction();
      return { result: fallbackResult, usedFallback: true, state: 'OPEN' };
    }
  }

  // Attempt primary execution
  try {
    const result = await action();

    // Success Handling
    if (metrics.state === 'HALF_OPEN') {
      metrics.successCount += 1;
      if (metrics.successCount >= config.halfOpenSuccessThreshold) {
        metrics.state = 'CLOSED';
        metrics.failureCount = 0;
        metrics.successCount = 0;
        metrics.lastStateChange = new Date().toISOString();

        emitTelemetryEvent({
          category: 'agent_runtime',
          eventType: 'circuit_breaker_closed',
          source: 'backend_circuit_breaker',
          summary: `Circuit breaker "${breakerId}" successfully recovered and returned to CLOSED state.`,
          payload: { breakerId },
        });
      }
    } else if (metrics.state === 'CLOSED') {
      metrics.failureCount = 0;
    }

    return { result, usedFallback: false, state: metrics.state };
  } catch (err: any) {
    // Failure Handling
    metrics.failureCount += 1;
    metrics.lastFailureTime = now;

    if (metrics.failureCount >= config.failureThreshold && metrics.state !== 'OPEN') {
      metrics.state = 'OPEN';
      metrics.lastStateChange = new Date().toISOString();

      emitTelemetryEvent({
        category: 'agent_runtime',
        eventType: 'circuit_breaker_tripped',
        source: 'backend_circuit_breaker',
        summary: `Circuit breaker "${breakerId}" TRIPPED to OPEN after ${metrics.failureCount} consecutive failures.`,
        payload: { breakerId, error: err.message },
      });

      appendAuditEvent({
        actor: 'circuit-breaker',
        workspace: 'Backend Governance',
        action: 'circuit.tripped',
        target: breakerId,
        risk: 'HIGH',
        status: 'executed',
        summary: `Circuit breaker "${breakerId}" tripped due to: ${err.message}`,
        evidence: { breakerId, failureCount: metrics.failureCount },
      }).catch(() => undefined);
    }

    const fallbackResult = await fallbackAction();
    return { result: fallbackResult, usedFallback: true, state: metrics.state };
  }
}

export function listCircuitBreakerMetrics(): CircuitBreakerMetrics[] {
  return Array.from(circuitRegistry.values()).map((entry) => ({ ...entry.metrics }));
}

export function resetCircuitBreaker(id: string): boolean {
  const entry = circuitRegistry.get(id);
  if (!entry) return false;
  entry.metrics.state = 'CLOSED';
  entry.metrics.failureCount = 0;
  entry.metrics.successCount = 0;
  entry.metrics.lastFailureTime = null;
  entry.metrics.lastStateChange = new Date().toISOString();
  return true;
}
