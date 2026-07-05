/**
 * costObservability.ts
 * ============================================================
 * Cost & Observability Engine — theo dõi token usage, chi phí,
 * latency, và hiệu suất của từng agent/model/route.
 * Hỗ trợ budget limits và alert khi vượt ngân sách.
 */
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostRecord {
  id: string;
  agent: string;               // agentic-loop, multi-agent, fabric, chat, etc.
  model: string;               // gpt-4o, claude-3.5, gemini-2.0, etc.
  route: string;               // api, web, local
  domain: string;              // coding, finance, general
  usage: TokenUsage;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  taskSummary: string;         // Tóm tắt task (tối đa 200 ký tự)
  recordedAt: string;
}

export interface AgentBudget {
  agent: string;
  monthlyLimitUsd: number;
  currentUsd: number;
  resetDay: number;            // Ngày reset hàng tháng (1-31)
  alerts: boolean;
  lastAlertedAt?: string;
}

export interface CostSnapshot {
  totalCostUsd: number;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  byRoute: Record<string, { cost: number; calls: number }>;
  byDomain: Record<string, { cost: number; calls: number }>;
  recentRecords: CostRecord[];
  budgets: AgentBudget[];
  period: { from: string; to: string };
}

// ─── Model pricing (USD per 1K tokens) ─────────────────────────────
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'gemini-2.0-flash': { prompt: 0.000075, completion: 0.0003 },
  'gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },
  'deepseek-v3': { prompt: 0.00027, completion: 0.0011 },
  'grok-2': { prompt: 0.002, completion: 0.008 },
  'ollama': { prompt: 0, completion: 0 },           // Local = free
  'local': { prompt: 0, completion: 0 },
  'fabric': { prompt: 0, completion: 0 },
  'unknown': { prompt: 0.002, completion: 0.008 },   // Default estimate
};

// ─── Storage ────────────────────────────────────────────────────────
const COST_FILE = resolveRuntimePathFromEnv('COST_RECORDS_FILE', 'cost_records.json');
const BUDGET_FILE = resolveRuntimePathFromEnv('AGENT_BUDGETS_FILE', 'agent_budgets.json');

let records: CostRecord[] = [];
let budgets: AgentBudget[] = [];

async function loadData(): Promise<void> {
  try {
    const costFile = resolveRuntimeReadPathFromEnv('COST_RECORDS_FILE', 'cost_records.json');
    const budgetFile = resolveRuntimeReadPathFromEnv('AGENT_BUDGETS_FILE', 'agent_budgets.json');
    if (fs.existsSync(costFile)) records = JSON.parse(await fs.promises.readFile(costFile, 'utf8'));
    if (fs.existsSync(budgetFile)) budgets = JSON.parse(await fs.promises.readFile(budgetFile, 'utf8'));
  } catch { /* init empty */ }
}
loadData().catch(() => undefined);

async function saveRecords(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(COST_FILE, JSON.stringify(records.slice(-2000), null, 2), 'utf8');
}
async function saveBudgets(): Promise<void> {
  ensureRuntimeRootSync();
  await fs.promises.writeFile(BUDGET_FILE, JSON.stringify(budgets, null, 2), 'utf8');
}

// ─── Parsing helpers ────────────────────────────────────────────────
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // Rough: 4 chars ≈ 1 token
}

function parseModelIdentifier(modelName: string): string {
  const lower = modelName.toLowerCase();
  for (const known of Object.keys(MODEL_PRICING)) {
    if (lower.includes(known)) return known;
  }
  return 'unknown';
}

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING.unknown;
  return (promptTokens * pricing.prompt + completionTokens * pricing.completion) / 1000;
}

// ─── Core API ───────────────────────────────────────────────────────

export function recordUsage(input: {
  agent: string;
  model: string;
  route: string;
  domain: string;
  promptText?: string;
  completionText?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  success: boolean;
  taskSummary?: string;
}): CostRecord {
  const modelKey = parseModelIdentifier(input.model);
  const promptTokens = input.promptTokens || estimateTokens(input.promptText || '');
  const completionTokens = input.completionTokens || estimateTokens(input.completionText || '');
  const costUsd = calculateCost(modelKey, promptTokens, completionTokens);

  const record: CostRecord = {
    id: `cost_${Date.now()}_${randomUUID().slice(0, 6)}`,
    agent: input.agent,
    model: modelKey,
    route: input.route,
    domain: input.domain,
    usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    costUsd,
    latencyMs: input.latencyMs,
    success: input.success,
    taskSummary: (input.taskSummary || 'unknown').slice(0, 200),
    recordedAt: new Date().toISOString(),
  };

  records.push(record);

  // Update budgets
  const budget = budgets.find(b => b.agent === input.agent);
  if (budget) {
    budget.currentUsd += costUsd;
    // Alert if over budget
    if (budget.alerts && budget.currentUsd >= budget.monthlyLimitUsd && !budget.lastAlertedAt) {
      budget.lastAlertedAt = new Date().toISOString();
      console.warn(`[Cost Alert] Agent "${input.agent}" đã vượt ngân sách: $${budget.currentUsd.toFixed(2)} / $${budget.monthlyLimitUsd}`);
    }
  }

  // Save periodically (every 10 records)
  if (records.length % 10 === 0) {
    saveRecords().catch(() => undefined);
    if (budgets.length > 0) saveBudgets().catch(() => undefined);
  }

  return record;
}

export function getSnapshot(days = 30): CostSnapshot {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = records.filter(r => new Date(r.recordedAt) >= cutoff);

  const byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }> = {};
  const byModel: Record<string, { cost: number; calls: number; tokens: number }> = {};
  const byRoute: Record<string, { cost: number; calls: number }> = {};
  const byDomain: Record<string, { cost: number; calls: number }> = {};

  for (const r of filtered) {
    // By agent
    const ag = byAgent[r.agent] || { cost: 0, calls: 0, avgLatencyMs: 0 };
    ag.cost += r.costUsd;
    ag.calls++;
    ag.avgLatencyMs = Math.round((ag.avgLatencyMs * (ag.calls - 1) + r.latencyMs) / ag.calls);
    byAgent[r.agent] = ag;

    // By model
    const md = byModel[r.model] || { cost: 0, calls: 0, tokens: 0 };
    md.cost += r.costUsd;
    md.calls++;
    md.tokens += r.usage.totalTokens;
    byModel[r.model] = md;

    // By route
    const rt = byRoute[r.route] || { cost: 0, calls: 0 };
    rt.cost += r.costUsd;
    rt.calls++;
    byRoute[r.route] = rt;

    // By domain
    const dm = byDomain[r.domain] || { cost: 0, calls: 0 };
    dm.cost += r.costUsd;
    dm.calls++;
    byDomain[r.domain] = dm;
  }

  return {
    totalCostUsd: filtered.reduce((s, r) => s + r.costUsd, 0),
    byAgent, byModel, byRoute, byDomain,
    recentRecords: filtered.slice(-20).reverse(),
    budgets: budgets.map(b => ({ ...b })),
    period: { from: cutoff.toISOString(), to: new Date().toISOString() },
  };
}

export function getAgentBudget(agent: string): AgentBudget | undefined {
  return budgets.find(b => b.agent === agent);
}

export function setAgentBudget(input: Omit<AgentBudget, 'lastAlertedAt'>): AgentBudget {
  const existing = budgets.findIndex(b => b.agent === input.agent);
  const budget: AgentBudget = { ...input, lastAlertedAt: undefined };
  if (existing >= 0) {
    // Reset current if it's a new month
    const today = new Date().getDate();
    if (today <= input.resetDay && budgets[existing].currentUsd > 0) {
      budget.currentUsd = 0; // Reset monthly
    }
    budgets[existing] = budget;
  } else {
    budgets.push(budget);
  }
  saveBudgets().catch(() => undefined);
  return budget;
}

export function getModelPricing(): Record<string, { prompt: number; completion: number }> {
  return { ...MODEL_PRICING };
}

export function getRecords(limit = 50): CostRecord[] {
  return records.slice(-limit).reverse();
}

export function getDailyCosts(days = 7): Array<{ date: string; cost: number; calls: number }> {
  const result: Array<{ date: string; cost: number; calls: number }> = [];
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = records.filter(r => new Date(r.recordedAt) >= cutoff);

  const byDay: Record<string, { cost: number; calls: number }> = {};
  for (const r of filtered) {
    const day = r.recordedAt.slice(0, 10); // YYYY-MM-DD
    const entry = byDay[day] || { cost: 0, calls: 0 };
    entry.cost += r.costUsd;
    entry.calls++;
    byDay[day] = entry;
  }

  // Fill all days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, cost: +(byDay[key]?.cost || 0).toFixed(4), calls: byDay[key]?.calls || 0 });
  }

  return result;
}
