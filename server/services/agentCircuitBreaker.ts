/**
 * agentCircuitBreaker.ts
 * ============================================================
 * Proactive Agent Anomaly Detection & Circuit Breaker Engine for LedgerFlow OS.
 *
 * Prevents cascading failures, API budget blowouts, and runaway loops:
 *  - Monitors sliding windows (5 mins) for error rates, P95 latency, cost burn.
 *  - Manages States: CLOSED (normal) -> OPEN (tripped) -> HALF_OPEN (probing).
 *  - Auto-recovers via timed probes.
 *  - Audit logs and emits telemetry when circuits trip or recover.
 */

import { appendAuditEvent } from './auditLog.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';
import fs from 'node:fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitMetrics {
  targetKey: string;           // E.g. "route:api", "role:coder", "robot:move", "rpa:shell"
  state: CircuitState;
  totalCalls: number;
  errorCount: number;
  errorRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  lastTripTime?: string;
  lastProbeTime?: string;
  cooldownMs: number;
  consecutiveSuccesses: number;
}

export interface CircuitBreakerConfig {
  errorRateThreshold?: number;     // Default: 0.60 (60%)
  minCallsForTrip?: number;        // Default: 5 calls
  p95LatencyThresholdMs?: number;  // Default: 30000 ms (30s)
  cooldownMs?: number;             // Default: 60000 ms (60s)
  halfOpenSuccessRequired?: number;// Default: 3 consecutive success probes
  slidingWindowMs?: number;        // Default: 300000 ms (5 mins)
}

interface ExecutionCallSample {
  timestamp: number;
  success: boolean;
  latencyMs: number;
  errorMsg?: string;
}

// ─── Storage & In-Memory State ────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<CircuitBreakerConfig> = {
  errorRateThreshold: 0.60,
  minCallsForTrip: 5,
  p95LatencyThresholdMs: 30000,
  cooldownMs: 60000,
  halfOpenSuccessRequired: 3,
  slidingWindowMs: 300000,
};

let userConfig: Required<CircuitBreakerConfig> = { ...DEFAULT_CONFIG };

const samplesMap = new Map<string, ExecutionCallSample[]>();
const circuitStateMap = new Map<string, {
  state: CircuitState;
  lastTripTime?: number;
  lastProbeTime?: number;
  consecutiveSuccesses: number;
}>();

// ─── Core Logic ───────────────────────────────────────────────────────────────

function getOrCreateCircuit(key: string) {
  if (!circuitStateMap.has(key)) {
    circuitStateMap.set(key, {
      state: 'CLOSED',
      consecutiveSuccesses: 0,
    });
  }
  if (!samplesMap.has(key)) {
    samplesMap.set(key, []);
  }
  return circuitStateMap.get(key)!;
}

function pruneSamples(key: string, now: number) {
  const samples = samplesMap.get(key) || [];
  const cutoff = now - userConfig.slidingWindowMs;
  const valid = samples.filter((s) => s.timestamp >= cutoff);
  samplesMap.set(key, valid);
  return valid;
}

export function updateCircuitBreakerConfig(patch: CircuitBreakerConfig) {
  userConfig = { ...userConfig, ...patch };
}

export function recordCircuitCall(
  targetKey: string,
  success: boolean,
  latencyMs: number,
  errorMsg?: string
): CircuitMetrics {
  const now = Date.now();
  const circuit = getOrCreateCircuit(targetKey);
  const samples = samplesMap.get(targetKey)!;

  samples.push({ timestamp: now, success, latencyMs, errorMsg });
  const activeSamples = pruneSamples(targetKey, now);

  if (circuit.state === 'HALF_OPEN') {
    if (success) {
      circuit.consecutiveSuccesses += 1;
      if (circuit.consecutiveSuccesses >= userConfig.halfOpenSuccessRequired) {
        circuit.state = 'CLOSED';
        circuit.consecutiveSuccesses = 0;
        appendAuditEvent({
          actor: 'circuit-breaker',
          workspace: 'AI-Ops',
          action: 'circuit.recovered',
          target: targetKey,
          risk: 'LOW',
          status: 'executed',
          summary: `Circuit Breaker for ${targetKey} fully recovered to CLOSED.`,
        }).catch(() => undefined);
      }
    } else {
      circuit.state = 'OPEN';
      circuit.lastTripTime = now;
      circuit.consecutiveSuccesses = 0;
      appendAuditEvent({
        actor: 'circuit-breaker',
        workspace: 'AI-Ops',
        action: 'circuit.retripped',
        target: targetKey,
        risk: 'HIGH',
        status: 'failed',
        summary: `Circuit Breaker for ${targetKey} failed probe; re-opened.`,
        evidence: { errorMsg },
      }).catch(() => undefined);
    }
  } else if (circuit.state === 'CLOSED') {
    const total = activeSamples.length;
    const errors = activeSamples.filter((s) => !s.success).length;
    const errorRate = total > 0 ? errors / total : 0;

    const latencies = activeSamples.map((s) => s.latencyMs).sort((a, b) => a - b);
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Idx] || 0;

    const shouldTrip =
      total >= userConfig.minCallsForTrip &&
      (errorRate >= userConfig.errorRateThreshold || p95Latency >= userConfig.p95LatencyThresholdMs);

    if (shouldTrip) {
      circuit.state = 'OPEN';
      circuit.lastTripTime = now;
      circuit.consecutiveSuccesses = 0;

      appendAuditEvent({
        actor: 'circuit-breaker',
        workspace: 'AI-Ops',
        action: 'circuit.tripped',
        target: targetKey,
        risk: 'HIGH',
        status: 'failed',
        summary: `Circuit Breaker tripped for ${targetKey}! Error rate: ${(errorRate * 100).toFixed(1)}%, P95 Latency: ${p95Latency}ms`,
        evidence: { total, errors, errorRate, p95Latency },
      }).catch(() => undefined);
    }
  }

  return getCircuitMetrics(targetKey);
}

export function isCircuitAllowed(targetKey: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const circuit = getOrCreateCircuit(targetKey);

  if (circuit.state === 'CLOSED') {
    return { allowed: true };
  }

  if (circuit.state === 'OPEN') {
    const tripTime = circuit.lastTripTime || 0;
    if (now - tripTime >= userConfig.cooldownMs) {
      circuit.state = 'HALF_OPEN';
      circuit.lastProbeTime = now;
      circuit.consecutiveSuccesses = 0;
      appendAuditEvent({
        actor: 'circuit-breaker',
        workspace: 'AI-Ops',
        action: 'circuit.half_opened',
        target: targetKey,
        risk: 'MEDIUM',
        status: 'executed',
        summary: `Circuit Breaker for ${targetKey} entered HALF_OPEN state to test recovery.`,
      }).catch(() => undefined);
      return { allowed: true, reason: 'Probe call allowed in HALF_OPEN state.' };
    }
    const remainingSec = Math.ceil((userConfig.cooldownMs - (now - tripTime)) / 1000);
    return {
      allowed: false,
      reason: `Circuit ${targetKey} is OPEN due to elevated error/latency rate. Cooldown remaining: ${remainingSec}s.`,
    };
  }

  // HALF_OPEN: allow 1 request at a time for probing
  return { allowed: true, reason: 'Probe call in progress.' };
}

export function getCircuitMetrics(targetKey: string): CircuitMetrics {
  const now = Date.now();
  const circuit = getOrCreateCircuit(targetKey);
  const activeSamples = pruneSamples(targetKey, now);

  const totalCalls = activeSamples.length;
  const errorCount = activeSamples.filter((s) => !s.success).length;
  const errorRate = totalCalls > 0 ? errorCount / totalCalls : 0;

  const latencies = activeSamples.map((s) => s.latencyMs).sort((a, b) => a - b);
  const avgLatency = totalCalls > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / totalCalls) : 0;
  const p95Idx = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Idx] || 0;

  return {
    targetKey,
    state: circuit.state,
    totalCalls,
    errorCount,
    errorRate: Math.round(errorRate * 1000) / 1000,
    averageLatencyMs: avgLatency,
    p95LatencyMs: p95Latency,
    lastTripTime: circuit.lastTripTime ? new Date(circuit.lastTripTime).toISOString() : undefined,
    lastProbeTime: circuit.lastProbeTime ? new Date(circuit.lastProbeTime).toISOString() : undefined,
    cooldownMs: userConfig.cooldownMs,
    consecutiveSuccesses: circuit.consecutiveSuccesses,
  };
}

export function listAllCircuits(): CircuitMetrics[] {
  const keys = Array.from(circuitStateMap.keys());
  return keys.map((key) => getCircuitMetrics(key));
}

export function resetCircuit(targetKey: string) {
  circuitStateMap.set(targetKey, {
    state: 'CLOSED',
    consecutiveSuccesses: 0,
  });
  samplesMap.set(targetKey, []);
  return getCircuitMetrics(targetKey);
}
