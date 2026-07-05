/**
 * smartFileWatcher.ts
 * ============================================================
 * Smart File Watcher — giám sát filesystem và tự động
 * kích hoạt agent workflow khi phát hiện thay đổi.
 *
 * Hỗ trợ: watch patterns, debounce, trigger rules,
 * và chaining nhiều hành động.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog';
import { autoRemediate } from './autoRemediationPipeline';
import { executeScript } from './rpaEngine';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type WatchEventType = 'created' | 'modified' | 'deleted' | 'renamed';

export interface WatchRule {
  id: string;
  name: string;
  watchPath: string;
  patterns: string[];           // Glob patterns to watch (e.g., "*.ts", "src/**/*.tsx")
  events: WatchEventType[];     // Events to trigger on
  debounceMs: number;           // Debounce time to avoid duplicate triggers
  enabled: boolean;
  actions: WatchAction[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchAction {
  id: string;
  type: 'run_rpa_script' | 'auto_remediate' | 'dispatch_ai' | 'run_agent_loop' | 'audit_security' | 'notify';
  scriptId?: string;
  targetPattern?: string;       // {{filePath}} will be replaced
  goalTemplate?: string;
  priority: number;
}

export interface WatchEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  event: WatchEventType;
  filePath: string;
  detectedAt: string;
  triggered: boolean;
  triggerResult?: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const RULES_FILE = resolveRuntimePathFromEnv('WATCH_RULES_FILE', 'watch_rules.json');
const EVENTS_FILE = resolveRuntimePathFromEnv('WATCH_EVENTS_FILE', 'watch_events.json');

let rules: WatchRule[] = [];
let events: WatchEvent[] = [];
const activeWatchers = new Map<string, fs.FSWatcher>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function loadAll(): Promise<void> {
  try {
    const rulesFile = resolveRuntimeReadPathFromEnv('WATCH_RULES_FILE', 'watch_rules.json');
    const eventsFile = resolveRuntimeReadPathFromEnv('WATCH_EVENTS_FILE', 'watch_events.json');
    if (fs.existsSync(rulesFile)) rules = JSON.parse(await fs.promises.readFile(rulesFile, 'utf8'));
    if (fs.existsSync(eventsFile)) events = JSON.parse(await fs.promises.readFile(eventsFile, 'utf8'));
  } catch { }
}
loadAll().catch(() => undefined);

async function saveRules(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(RULES_FILE, JSON.stringify(rules, null, 2), 'utf8');
}
async function saveEvents(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(EVENTS_FILE, JSON.stringify(events.slice(-200), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function createWatchRule(input: {
  name: string; watchPath: string; patterns?: string[];
  events?: WatchEventType[]; debounceMs?: number; actions?: WatchAction[];
  tags?: string[];
}): WatchRule {
  const rule: WatchRule = {
    id: `watch_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: input.name.slice(0, 100),
    watchPath: input.watchPath,
    patterns: input.patterns || ['*'],
    events: input.events || ['modified', 'created'],
    debounceMs: input.debounceMs || 2000,
    enabled: true,
    actions: input.actions || [],
    tags: input.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rules.push(rule);
  saveRules().catch(() => undefined);

  if (rule.enabled) startWatching(rule);
  return rule;
}

export function getRule(id: string): WatchRule | undefined { return rules.find(r => r.id === id); }
export function listRules(): WatchRule[] { return [...rules]; }

export function deleteRule(id: string): boolean {
  stopWatching(id);
  const idx = rules.findIndex(r => r.id === id);
  if (idx < 0) return false;
  rules.splice(idx, 1);
  saveRules().catch(() => undefined);
  return true;
}

export function toggleRule(id: string, enabled: boolean): boolean {
  const rule = rules.find(r => r.id === id);
  if (!rule) return false;
  rule.enabled = enabled;
  rule.updatedAt = new Date().toISOString();
  if (enabled) startWatching(rule);
  else stopWatching(id);
  saveRules().catch(() => undefined);
  return true;
}

// ─── File Watching ──────────────────────────────────────────────────

function startWatching(rule: WatchRule): void {
  if (activeWatchers.has(rule.id)) return;
  if (!fs.existsSync(rule.watchPath)) return;

  try {
    const watcher = fs.watch(rule.watchPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      let watchEvent: WatchEventType;
      if (eventType === 'rename') {
        watchEvent = fs.existsSync(path.join(rule.watchPath, filename)) ? 'created' : 'deleted';
      } else {
        watchEvent = eventType as WatchEventType;
      }

      if (!rule.events.includes(watchEvent)) return;

      // Pattern matching
      if (!matchesPattern(filename, rule.patterns)) return;

      const fullPath = path.join(rule.watchPath, filename);

      // Debounce
      const debounceKey = `${rule.id}:${fullPath}:${watchEvent}`;
      if (debounceTimers.has(debounceKey)) {
        clearTimeout(debounceTimers.get(debounceKey)!);
      }

      debounceTimers.set(debounceKey, setTimeout(async () => {
        debounceTimers.delete(debounceKey);
        await handleFileEvent(rule, watchEvent, fullPath);
      }, rule.debounceMs));
    });

    activeWatchers.set(rule.id, watcher);
    console.log(`[File Watcher] Watching "${rule.name}" at ${rule.watchPath}`);
  } catch (err: any) {
    console.error(`[File Watcher] Failed to watch ${rule.watchPath}: ${err.message}`);
  }
}

function stopWatching(ruleId: string): void {
  const watcher = activeWatchers.get(ruleId);
  if (watcher) { watcher.close(); activeWatchers.delete(ruleId); }
}

function matchesPattern(filename: string, patterns: string[]): boolean {
  if (patterns.length === 0 || patterns.includes('*')) return true;
  for (const pattern of patterns) {
    // Simple glob matching
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    if (regex.test(filename)) return true;
  }
  return false;
}

async function handleFileEvent(rule: WatchRule, eventType: WatchEventType, filePath: string): Promise<void> {
  const eventId = `wev_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const watchEvent: WatchEvent = {
    id: eventId, ruleId: rule.id, ruleName: rule.name,
    event: eventType, filePath, detectedAt: new Date().toISOString(),
    triggered: true,
  };

  events.push(watchEvent);

  console.log(`[File Watcher] ${eventType}: ${filePath} → rule "${rule.name}"`);

  // Execute actions
  const results: string[] = [];
  for (const action of rule.actions.sort((a, b) => a.priority - b.priority)) {
    try {
      const goal = (action.goalTemplate || '').replace(/\{\{filePath\}\}/g, filePath);
      const target = (action.targetPattern || filePath).replace(/\{\{filePath\}\}/g, filePath);

      switch (action.type) {
        case 'run_rpa_script':
          if (action.scriptId) {
            const exec = await executeScript(action.scriptId, 'watcher');
            results.push(`RPA: ${exec.status}`);
          }
          break;
        case 'auto_remediate':
          const rem = await autoRemediate(target, `File ${eventType}: ${filePath}`, { trigger: 'manual', autoApply: false });
          results.push(`Remediate: ${rem.finalStatus}`);
          break;
        case 'dispatch_ai':
          const { dispatchTextThroughFabric } = require('./aiFabric');
          const ai = await dispatchTextThroughFabric(goal, undefined, { domain: 'coding', localFallback: true });
          results.push(`AI: ${ai.winner?.contentPreview?.slice(0, 80) || ai.status}`);
          break;
        case 'audit_security':
          const { auditFile: secAudit } = require('./aiSecurityAuditor');
          const audit = await secAudit(target);
          results.push(`Security: ${audit.score}/100`);
          break;
        case 'notify':
          results.push(`Notify: ${goal}`);
          break;
      }
    } catch (err: any) {
      results.push(`Error: ${err.message}`);
    }
  }

  watchEvent.triggerResult = results.join(' | ');

  await appendAuditEvent({
    actor: 'system', workspace: 'File Watcher', action: 'watcher.triggered',
    target: filePath, risk: 'LOW', status: 'executed',
    summary: `File ${eventType}: ${filePath} → rule "${rule.name}"`,
    connectorId: 'file-watcher',
    evidence: { eventId, filePath, eventType, ruleId: rule.id },
  }).catch(() => undefined);

  if (events.length % 20 === 0) saveEvents().catch(() => undefined);
}

// ─── Utility ────────────────────────────────────────────────────────

export function listEvents(limit = 50): WatchEvent[] { return events.slice(-limit).reverse(); }
export function getEvents(): WatchEvent[] { return [...events].reverse(); }

export function stopAllWatchers(): void {
  for (const [id, watcher] of activeWatchers) {
    watcher.close();
  }
  activeWatchers.clear();
  console.log('[File Watcher] All watchers stopped.');
}

export function getWatchStats(): { rules: number; active: number; totalEvents: number } {
  return { rules: rules.length, active: activeWatchers.size, totalEvents: events.length };
}
