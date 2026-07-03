/**
 * agentEventBus.ts
 * ──────────────────────────────────────────────────────────────────
 * In-process pub/sub event bus for inter-agent communication.
 * Events are also persisted to a local JSON log (max 1000 entries).
 *
 * Usage:
 *   agentEventBus.publish('agent.completed', { runId, goal });
 *   const unsub = agentEventBus.subscribe('agent.completed', handler);
 *   unsub(); // remove listener
 * ──────────────────────────────────────────────────────────────────
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import type { AutomationEventType } from './automationRuleEngine.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export type AgentBusEventType =
  | AutomationEventType
  | 'memory.updated'
  | 'memory.approved'
  | 'pipeline.step.done'
  | 'agent.step.done'
  | 'cron.job.done'
  | 'ai.call.completed'
  | 'ai.call.failed'
  | 'agent.step.approval_required';

export interface AgentBusEvent {
  id: string;
  type: AgentBusEventType;
  source: string;
  payload: Record<string, unknown>;
  publishedAt: string;
}

type AgentBusHandler = (event: AgentBusEvent) => void | Promise<void>;

// ─── In-memory pub/sub ────────────────────────────────────────────────────────

const subscribers = new Map<string, Map<string, AgentBusHandler>>();

function getOrCreate(type: string): Map<string, AgentBusHandler> {
  if (!subscribers.has(type)) subscribers.set(type, new Map());
  return subscribers.get(type)!;
}

export function subscribe(type: AgentBusEventType | '*', handler: AgentBusHandler): () => void {
  const id = randomUUID();
  getOrCreate(type).set(id, handler);
  return () => {
    const map = subscribers.get(type);
    if (map) map.delete(id);
  };
}

// ─── Persistent event log ─────────────────────────────────────────────────────

const MAX_LOG_SIZE = 1_000;

function logFile() {
  return resolveRuntimePathFromEnv('AGENT_EVENT_LOG_FILE', 'agent_events.local.json');
}

function appendToLog(event: AgentBusEvent): void {
  try {
    ensureRuntimeRootSync();
    let log: AgentBusEvent[] = [];
    const readPath = resolveRuntimeReadPathFromEnv('AGENT_EVENT_LOG_FILE', 'agent_events.local.json');
    if (fs.existsSync(readPath)) {
      try { log = JSON.parse(fs.readFileSync(readPath, 'utf-8')) as AgentBusEvent[]; } catch { log = []; }
    }
    log = [event, ...log].slice(0, MAX_LOG_SIZE);
    fs.writeFileSync(logFile(), JSON.stringify(log, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AgentEventBus] Failed to persist event:', err);
  }
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publish(
  type: AgentBusEventType,
  payload: Record<string, unknown>,
  source = 'system',
): Promise<AgentBusEvent> {
  const event: AgentBusEvent = { id: `evt_${randomUUID()}`, type, source, payload, publishedAt: new Date().toISOString() };

  // Fire specific handlers
  const specific = subscribers.get(type);
  if (specific) {
    for (const handler of specific.values()) {
      try { await handler(event); } catch (err) { console.error(`[AgentEventBus] Handler error for ${type}:`, err); }
    }
  }

  // Fire wildcard handlers
  const wildcard = subscribers.get('*');
  if (wildcard) {
    for (const handler of wildcard.values()) {
      try { await handler(event); } catch (err) { console.error('[AgentEventBus] Wildcard handler error:', err); }
    }
  }

  // Persist
  appendToLog(event);

  // Fire automation rules
  try {
    const { fireAutomationEvent } = await import('./automationRuleEngine.ts');
    await fireAutomationEvent(type as any, payload);
  } catch {
    // Non-blocking: rule engine failures must not disrupt event flow
  }

  return event;
}

// ─── Query log ────────────────────────────────────────────────────────────────

export function getEventLog(limit = 100, filterType?: AgentBusEventType): AgentBusEvent[] {
  try {
    const readPath = resolveRuntimeReadPathFromEnv('AGENT_EVENT_LOG_FILE', 'agent_events.local.json');
    if (!fs.existsSync(readPath)) return [];
    const log = JSON.parse(fs.readFileSync(readPath, 'utf-8')) as AgentBusEvent[];
    const filtered = filterType ? log.filter((e) => e.type === filterType) : log;
    return filtered.slice(0, limit);
  } catch {
    return [];
  }
}

export function clearEventLog(): void {
  try {
    ensureRuntimeRootSync();
    fs.writeFileSync(logFile(), '[]', 'utf-8');
  } catch {
    /* ignore */
  }
}

export function getSubscriberCount(type?: AgentBusEventType): number {
  if (type) return subscribers.get(type)?.size ?? 0;
  return [...subscribers.values()].reduce((sum, map) => sum + map.size, 0);
}

/** Export singleton-style API */
export const agentEventBus = { publish, subscribe, getEventLog, clearEventLog, getSubscriberCount };
export default agentEventBus;
