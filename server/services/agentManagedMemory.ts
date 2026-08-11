/**
 * agentManagedMemory.ts
 * ============================================================
 * Managed Agent Memory & Cross-Session Rules Engine for LedgerFlow OS.
 *
 * Provides persistent memory rules across AI sessions:
 *  - Categories: 'coding_style' | 'architecture_rules' | 'project_context' | 'user_preferences'
 *  - Full CRUD & toggle controls for UI management panel.
 *  - Context compiler for system prompt injection.
 *  - Encrypted storage in runtime/agent_managed_memory.local.enc.
 */

import { randomUUID } from 'node:crypto';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ManagedMemoryCategory =
  | 'coding_style'
  | 'architecture_rules'
  | 'project_context'
  | 'user_preferences';

export interface ManagedMemoryRule {
  id: string;
  category: ManagedMemoryCategory;
  title: string;
  ruleText: string;
  enabled: boolean;
  source: 'user_created' | 'ai_extracted';
  createdAt: string;
  updatedAt: string;
}

interface MemoryStore {
  rules: Record<string, ManagedMemoryRule>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: MemoryStore = { rules: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('MANAGED_MEMORY_FILE', 'agent_managed_memory.local.enc');
}

const PRESET_RULES: ManagedMemoryRule[] = [
  {
    id: 'rule_arch_ai_fabric',
    category: 'architecture_rules',
    title: 'Route AI through AI Fabric',
    ruleText: 'All AI model calls must route through aiFabric.ts / aiRouter.ts. Do not call provider API endpoints directly from frontend components.',
    enabled: true,
    source: 'user_created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_style_ts_strict',
    category: 'coding_style',
    title: 'TypeScript Strict Mode & Clean Imports',
    ruleText: 'Use explicit types, avoid "any", use standard ES module imports with .ts extensions.',
    enabled: true,
    source: 'user_created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rule_lang_vietnamese',
    category: 'user_preferences',
    title: 'Vietnamese Explanations & Bullet Summaries',
    ruleText: 'Provide user explanations in clear, professional Vietnamese with structured markdown bullet points.',
    enabled: true,
    source: 'user_created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function loadStore(): Promise<MemoryStore> {
  const parsed = await readSecureJson<MemoryStore>(storageFile(), { rules: {} });
  store = { rules: parsed.rules || {} };

  if (Object.keys(store.rules).length === 0) {
    for (const preset of PRESET_RULES) {
      store.rules[preset.id] = preset;
    }
    await saveStore();
  }

  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

// ─── Core API ─────────────────────────────────────────────────────────────────

export async function addManagedMemoryRule(input: {
  category: ManagedMemoryCategory;
  title: string;
  ruleText: string;
  source?: ManagedMemoryRule['source'];
}): Promise<ManagedMemoryRule> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.rules).length === 0) await loadStore();

  const ruleId = `rule_${input.category}_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const now = new Date().toISOString();

  const rule: ManagedMemoryRule = {
    id: ruleId,
    category: input.category,
    title: input.title.trim(),
    ruleText: input.ruleText.trim(),
    enabled: true,
    source: input.source || 'user_created',
    createdAt: now,
    updatedAt: now,
  };

  store.rules[ruleId] = rule;
  queueSave();

  appendAuditEvent({
    actor: 'managed-memory',
    workspace: 'Managed Memory',
    action: 'memory_rule.added',
    target: ruleId,
    risk: 'LOW',
    status: 'executed',
    summary: `Managed memory rule added: "${rule.title}" [${rule.category}]`,
    evidence: { ruleId, category: rule.category },
  }).catch(() => undefined);

  return rule;
}

export async function toggleManagedMemoryRule(ruleId: string, enabled: boolean): Promise<ManagedMemoryRule | null> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.rules).length === 0) await loadStore();

  const rule = store.rules[ruleId];
  if (!rule) return null;

  rule.enabled = enabled;
  rule.updatedAt = new Date().toISOString();
  queueSave();
  return rule;
}

export async function deleteManagedMemoryRule(ruleId: string): Promise<boolean> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.rules).length === 0) await loadStore();

  if (store.rules[ruleId]) {
    delete store.rules[ruleId];
    queueSave();
    return true;
  }
  return false;
}

export async function listManagedMemoryRules(category?: ManagedMemoryCategory): Promise<ManagedMemoryRule[]> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.rules).length === 0) await loadStore();

  let list = Object.values(store.rules);
  if (category) list = list.filter((r) => r.category === category);
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function compileActiveMemoryContext(): Promise<string> {
  const rules = await listManagedMemoryRules();
  const activeRules = rules.filter((r) => r.enabled);

  if (activeRules.length === 0) return '';

  const blocks = activeRules.map((r, idx) => `${idx + 1}. [${r.title}] (${r.category}): ${r.ruleText}`);
  return [
    '─── PERSISTENT MANAGED MEMORY & PROJECT CONVENTIONS ───',
    ...blocks,
    '───────────────────────────────────────────────────────',
  ].join('\n');
}
