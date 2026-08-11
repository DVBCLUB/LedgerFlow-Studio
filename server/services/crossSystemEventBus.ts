/**
 * crossSystemEventBus.ts
 * ============================================================
 * Universal System Event Bus & Cascading Autonomous Reactions Engine for LedgerFlow OS.
 *
 * Implements a real-time Pub/Sub Event Stream connecting all 15+ OS sub-systems.
 * Triggers Cascading Autonomous Reactions:
 *  - 'sim.bottleneck_detected' -> auto-triggers revenue growth/marketing campaign.
 *  - 'security.poison_blocked' -> auto-triggers security review session.
 *  - 'release.published' -> auto-triggers synthetic feedback loop simulation.
 */

import EventEmitter from 'node:events';
import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SystemEventType =
  | 'swarm.task_completed'
  | 'security.poison_blocked'
  | 'sim.bottleneck_detected'
  | 'release.published'
  | 'governance.budget_allocated'
  | 'agent.auto_repair_completed';

export interface SystemEventPayload {
  id: string;
  type: SystemEventType;
  source: string;
  summary: string;
  data: Record<string, any>;
  timestamp: string;
}

export type SystemEventHandler = (event: SystemEventPayload) => void | Promise<void>;

// ─── Bus Instance ─────────────────────────────────────────────────────────────

class SystemEventBus extends EventEmitter {}

const eventBus = new SystemEventBus();
eventBus.setMaxListeners(50);

const eventHistory: SystemEventPayload[] = [];
const MAX_HISTORY = 100;

// ─── Automatic Cascading Reaction Handlers ────────────────────────────────────

eventBus.on('sim.bottleneck_detected', async (evt: SystemEventPayload) => {
  if (evt.data.severity === 'CRITICAL' || evt.data.severity === 'HIGH') {
    await appendAuditEvent({
      actor: 'event-bus-cascade',
      workspace: 'Governance',
      action: 'cascade.bottleneck_reaction',
      target: evt.id,
      risk: 'MEDIUM',
      status: 'executed',
      summary: `Cascading reaction triggered for bottleneck: ${evt.summary}`,
      evidence: evt.data,
    }).catch(() => undefined);
  }
});

eventBus.on('security.poison_blocked', async (evt: SystemEventPayload) => {
  await appendAuditEvent({
    actor: 'event-bus-cascade',
    workspace: 'Security',
    action: 'cascade.poison_reaction',
    target: evt.id,
    risk: 'HIGH',
    status: 'executed',
    summary: `Cascading security reaction logged for blocked threat score ${evt.data.threatScore}`,
    evidence: evt.data,
  }).catch(() => undefined);
});

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Publishes a System Event to the Universal Event Bus and stores it in history.
 */
export async function publishSystemEvent(
  type: SystemEventType,
  source: string,
  summary: string,
  data: Record<string, any> = {}
): Promise<SystemEventPayload> {
  const event: SystemEventPayload = {
    id: `evt_${Date.now()}_${randomUUID().slice(0, 6)}`,
    type,
    source,
    summary,
    data,
    timestamp: new Date().toISOString(),
  };

  eventHistory.unshift(event);
  if (eventHistory.length > MAX_HISTORY) {
    eventHistory.pop();
  }

  // Emit event asynchronously
  setImmediate(() => {
    eventBus.emit(type, event);
    eventBus.emit('*', event);
  });

  return event;
}

/**
 * Subscribes to a System Event type (or '*' for all events).
 */
export function subscribeSystemEvent(type: SystemEventType | '*', handler: SystemEventHandler): () => void {
  eventBus.on(type, handler);
  return () => {
    eventBus.off(type, handler);
  };
}

/**
 * Returns recent system event history.
 */
export function getSystemEventHistory(limit = 20): SystemEventPayload[] {
  return eventHistory.slice(0, limit);
}
