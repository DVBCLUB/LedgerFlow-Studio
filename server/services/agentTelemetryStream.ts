/**
 * agentTelemetryStream.ts
 * ============================================================
 * Real-Time Agent & Robot Telemetry Stream Service for LedgerFlow OS.
 *
 * Provides real-time event streaming for:
 *  - Agent step progress, replanning, and completion
 *  - Robot telemetry snapshots, commands, and emergency stops
 *  - Swarm dispatch and task completion
 *  - Consensus debate voting rounds
 *  - Circuit breaker trips and auto-repairs
 *
 * Supports SSE (Server-Sent Events) subscribers and desktop notifications.
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TelemetryCategory =
  | 'agent_runtime'
  | 'agentic_loop'
  | 'swe_agent'
  | 'robot'
  | 'swarm'
  | 'consensus'
  | 'circuit_breaker'
  | 'auto_repair';

export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryEvent {
  id: string;
  category: TelemetryCategory;
  eventType: string;
  severity: TelemetrySeverity;
  source: string;
  summary: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export type TelemetryListener = (event: TelemetryEvent) => void;

// ─── Event Buffer & Subscriber Registry ───────────────────────────────────────

const MAX_BUFFER_SIZE = 200;
const eventBuffer: TelemetryEvent[] = [];
const subscribers = new Set<TelemetryListener>();

// ─── Core API ─────────────────────────────────────────────────────────────────

export function emitTelemetryEvent(input: {
  category: TelemetryCategory;
  eventType: string;
  severity?: TelemetrySeverity;
  source: string;
  summary: string;
  payload?: Record<string, unknown>;
}): TelemetryEvent {
  const event: TelemetryEvent = {
    id: `tel_evt_${Date.now()}_${randomUUID().slice(0, 6)}`,
    category: input.category,
    eventType: input.eventType,
    severity: input.severity || 'info',
    source: input.source,
    summary: input.summary,
    payload: input.payload || {},
    timestamp: new Date().toISOString(),
  };

  // Add to ring buffer
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  // Notify subscribers (SSE listeners)
  for (const listener of subscribers) {
    try {
      listener(event);
    } catch {
      // Ignore dead subscribers
    }
  }

  // Log high severity events to audit log
  if (event.severity === 'error' || event.severity === 'critical') {
    appendAuditEvent({
      actor: 'telemetry-stream',
      workspace: 'AI-Ops',
      action: `telemetry.${input.category}.${input.eventType}`,
      target: input.source,
      risk: event.severity === 'critical' ? 'HIGH' : 'MEDIUM',
      status: 'failed',
      summary: input.summary,
      evidence: input.payload,
    }).catch(() => undefined);
  }

  return event;
}

export function subscribeTelemetry(listener: TelemetryListener): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function getRecentTelemetryEvents(limit = 50, category?: TelemetryCategory): TelemetryEvent[] {
  let list = eventBuffer;
  if (category) {
    list = list.filter((e) => e.category === category);
  }
  return list.slice(-limit).reverse();
}

export function getTelemetryStats(): {
  totalBuffered: number;
  activeSubscribers: number;
  categoryCounts: Record<TelemetryCategory, number>;
} {
  const categoryCounts: Record<TelemetryCategory, number> = {
    agent_runtime: 0,
    agentic_loop: 0,
    swe_agent: 0,
    robot: 0,
    swarm: 0,
    consensus: 0,
    circuit_breaker: 0,
    auto_repair: 0,
  };

  for (const event of eventBuffer) {
    if (categoryCounts[event.category] !== undefined) {
      categoryCounts[event.category] += 1;
    }
  }

  return {
    totalBuffered: eventBuffer.length,
    activeSubscribers: subscribers.size,
    categoryCounts,
  };
}
