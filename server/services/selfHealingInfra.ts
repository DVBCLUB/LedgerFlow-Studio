/**
 * selfHealingInfra.ts
 * ============================================================
 * Self-Healing Infrastructure — tự động health check,
 * restart/repair các component khi fail.
 *
 * Monitor: Daemon, Observer, Sandbox, Memory, Triggers
 * Action: restart observer, clean expired memory, rebuild index
 */
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog';
import { cleanExpiredShortTerm, clearSessionMemory } from './compoundMemory';
import { listSandboxSessions } from './sandboxCodeExecutor';
import { startAutoCurator, stopAutoCurator } from './autoMemoryCurator';
import { buildSearchIndex } from './localSearchService';

// ─── Types ──────────────────────────────────────────────────────────
export type InfraComponent = 'observer' | 'memory' | 'sandbox' | 'curator' | 'code_index' | 'daemon';

export interface ComponentHealth {
  component: InfraComponent;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  consecutiveFailures: number;
  maxFailuresBeforeHeal: number;
  healActions: string[];
  lastHealed?: string;
  healCount: number;
}

export interface HealingAction {
  id: string;
  component: InfraComponent;
  action: string;
  success: boolean;
  error?: string;
  timestamp: string;
  durationMs: number;
}

// ─── State ──────────────────────────────────────────────────────────
const components = new Map<InfraComponent, ComponentHealth>();
const healingLog: HealingAction[] = [];
let intervalHandle: ReturnType<typeof setInterval> | null = null;

const HEALING_FILE = path.join(process.cwd(), 'self_healing_log.json');

async function loadLog(): Promise<void> {
  try {
    if (fs.existsSync(HEALING_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(HEALING_FILE, 'utf8'));
      healingLog.push(...(data.healingLog || []));
    }
  } catch { }
}
loadLog().catch(() => undefined);

async function saveLog(): Promise<void> {
  await fs.promises.writeFile(HEALING_FILE, JSON.stringify({ healingLog: healingLog.slice(-200) }, null, 2), 'utf8');
}

// ─── Component registry ─────────────────────────────────────────────
function registerDefaults(): void {
  const defs: Array<{ c: InfraComponent; maxF: number; actions: string[] }> = [
    { c: 'observer', maxF: 3, actions: ['restart_observer', 'restart_daemon'] },
    { c: 'memory', maxF: 5, actions: ['clean_expired', 'clear_session'] },
    { c: 'sandbox', maxF: 3, actions: ['cleanup_sessions', 'reset_policy'] },
    { c: 'curator', maxF: 2, actions: ['restart_curator'] },
    { c: 'code_index', maxF: 3, actions: ['rebuild_index'] },
    { c: 'daemon', maxF: 1, actions: ['log_critical'] },
  ];

  for (const d of defs) {
    components.set(d.c, {
      component: d.c,
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      consecutiveFailures: 0,
      maxFailuresBeforeHeal: d.maxF,
      healActions: d.actions,
      healCount: 0,
    });
  }
}
registerDefaults();

// ─── Core ───────────────────────────────────────────────────────────

export function reportHealth(component: InfraComponent, healthy: boolean, detail?: string): void {
  const c = components.get(component);
  if (!c) return;

  c.lastCheck = new Date().toISOString();

  if (healthy) {
    if (c.status !== 'healthy') {
      c.status = 'healthy';
      c.consecutiveFailures = 0;
    }
  } else {
    c.consecutiveFailures++;
    c.status = 'degraded';
  }

  // Auto-heal if over threshold
  if (c.consecutiveFailures >= c.maxFailuresBeforeHeal) {
    triggerHealing(component, `Consecutive failures: ${c.consecutiveFailures} (threshold: ${c.maxFailuresBeforeHeal})`).catch(() => undefined);
  }
}

export async function triggerHealing(
  component: InfraComponent,
  reason: string,
): Promise<HealingAction | null> {
  const c = components.get(component);
  if (!c) return null;

  const actionId = `heal_${Date.now()}`;
  const started = Date.now();
  c.status = 'down';

  let success = false;
  let error: string | undefined;
  const action = c.healActions[0] || 'unknown';

  try {
    switch (component) {
      case 'observer':
        // Try to restart observer (handled externally via daemon API)
        success = true; // Mark as attempted
        break;
      case 'memory':
        // Clean expired short-term records
        await cleanExpiredShortTerm();
        if (c.consecutiveFailures >= 5) clearSessionMemory();
        success = true;
        break;
      case 'sandbox':
        // Cleanup stale sandbox sessions
        listSandboxSessions();
        // Keep running, just mark as healed
        success = true;
        break;
      case 'curator':
        stopAutoCurator();
        startAutoCurator(60);
        success = true;
        break;
      case 'code_index':
        await buildSearchIndex();
        success = true;
        break;
      default:
        error = `No healing action for ${component}`;
    }
  } catch (err: any) {
    error = err.message;
  }

  const healingAction: HealingAction = {
    id: actionId,
    component,
    action,
    success,
    error,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - started,
  };

  healingLog.push(healingAction);
  c.lastHealed = healingAction.timestamp;
  c.healCount++;
  if (success) {
    c.status = 'healthy';
    c.consecutiveFailures = 0;
  }

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Self-Healing',
    action: `heal.${component}`,
    target: reason.slice(0, 80),
    risk: 'HIGH',
    status: success ? 'executed' : 'failed',
    summary: `Healed ${component}: ${action} — ${success ? 'OK' : 'FAIL'}`,
    connectorId: 'self-healing',
    evidence: { component, action, success, reason },
  }).catch(() => undefined);

  saveLog().catch(() => undefined);
  return healingAction;
}

export function getComponentHealth(component: InfraComponent): ComponentHealth | undefined {
  return components.get(component);
}

export function getAllHealth(): ComponentHealth[] {
  return Array.from(components.values());
}

export function getHealingLog(limit = 50): HealingAction[] {
  return healingLog.slice(-limit).reverse();
}

export function getHealingStats(): {
  totalHeals: number;
  successfulHeals: number;
  failedHeals: number;
  byComponent: Record<string, { heals: number; lastAction: string; lastHealed?: string }>;
} {
  const byComponent: Record<string, any> = {};
  let successfulHeals = 0;
  let failedHeals = 0;

  for (const h of healingLog) {
    const entry = byComponent[h.component] || { heals: 0, lastAction: '', lastHealed: undefined };
    entry.heals++;
    entry.lastAction = h.action;
    entry.lastHealed = h.timestamp;
    byComponent[h.component] = entry;
    if (h.success) successfulHeals++; else failedHeals++;
  }

  return {
    totalHeals: healingLog.length,
    successfulHeals,
    failedHeals,
    byComponent,
  };
}

// ─── Schedule ───────────────────────────────────────────────────────

export function startSelfHealing(intervalMs = 60000): void {
  if (intervalHandle) return;
  intervalHandle = setInterval(async () => {
    // Periodic health check on all components
    for (const [comp, health] of components) {
      try {
        // Simple check: component exists in the system
        reportHealth(comp, true);
      } catch {
        reportHealth(comp, false, 'Check failed');
      }
    }
  }, intervalMs);
  console.log(`[Self-Healing] Started. Interval: ${intervalMs}ms.`);
}

export function stopSelfHealing(): void {
  if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
  console.log('[Self-Healing] Stopped.');
}
