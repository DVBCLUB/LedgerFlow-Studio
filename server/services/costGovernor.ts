/**
 * costGovernor.ts
 * ============================================================
 * Cost Governance — ngân sách toàn cục + chốt chặn trước khi gọi AI.
 *
 * Nguyên tắc CEO/PM: free tier có thể bị cắt bất kỳ lúc nào; phải có
 * budget cap để không "cháy" chi phí API ngoài tầm kiểm soát. Governor
 * chặn API call khi vượt ngân sách (toàn cục hoặc theo từng nhân viên),
 * và cho phép xem trạng thái chi tiêu hiện tại.
 */

import { getSnapshot, getAgentBudget, type AgentBudget } from './costObservability.ts';
import fs from 'node:fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export interface CostGovernorConfig {
  enabled: boolean;
  /** Ngân sách tối đa 30 ngày gần nhất (USD). 0 = không giới hạn. */
  monthlyCapUsd: number;
  /** Ngưỡng cảnh báo (% của cap). 0 = tắt cảnh báo. */
  alertThresholdPct: number;
}

const DEFAULT_CONFIG: CostGovernorConfig = {
  enabled: true,
  monthlyCapUsd: 10,
  alertThresholdPct: 80,
};

const FILE = resolveRuntimePathFromEnv('COST_GOVERNOR_FILE', 'cost_governor.json');

let cache: CostGovernorConfig | null = null;

function loadConfig(): CostGovernorConfig {
  if (cache) return cache;
  try {
    const p = resolveRuntimeReadPathFromEnv('COST_GOVERNOR_FILE', 'cost_governor.json');
    if (!fs.existsSync(p)) {
      cache = { ...DEFAULT_CONFIG };
      return cache;
    }
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<CostGovernorConfig>;
    cache = { ...DEFAULT_CONFIG, ...parsed };
    return cache;
  } catch {
    cache = { ...DEFAULT_CONFIG };
    return cache;
  }
}

function saveConfig(config: CostGovernorConfig): void {
  cache = config;
  try {
    ensureRuntimeRootSync();
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(config, null, 2), 'utf8');
    fs.renameSync(tmp, FILE);
  } catch (err) {
    console.error('[CostGovernor] persist failed:', err);
  }
}

export function getGovernorConfig(): CostGovernorConfig {
  return { ...loadConfig() };
}

// Tinh chỉnh config (clamp) — thuần, dùng được cho test.
export function sanitizeGovernorConfig(input: Partial<CostGovernorConfig>, base?: CostGovernorConfig): CostGovernorConfig {
  const b = base || { ...DEFAULT_CONFIG };
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : b.enabled,
    monthlyCapUsd: typeof input.monthlyCapUsd === 'number' ? Math.max(0, input.monthlyCapUsd) : b.monthlyCapUsd,
    alertThresholdPct: typeof input.alertThresholdPct === 'number' ? Math.max(0, Math.min(100, input.alertThresholdPct)) : b.alertThresholdPct,
  };
}

export function setGovernorConfig(input: Partial<CostGovernorConfig>): CostGovernorConfig {
  const next = sanitizeGovernorConfig(input, loadConfig());
  saveConfig(next);
  return { ...next };
}

export interface BudgetGateResult {
  allowed: boolean;
  reason?: string;
  spentUsd: number;
  capUsd: number;
  agentBudget?: AgentBudget;
}

export function checkBudgetGate(input: { agent: string; domain?: string }): BudgetGateResult {
  const cfg = loadConfig();
  const snapshot = getSnapshot(30);
  const spent = snapshot.totalCostUsd;

  if (cfg.enabled && cfg.monthlyCapUsd > 0 && spent >= cfg.monthlyCapUsd) {
    return {
      allowed: false,
      reason: `Đã chạm ngân sách toàn cục: $${spent.toFixed(2)} / $${cfg.monthlyCapUsd}. Hãy tăng cap hoặc chờ kỳ mới.`,
      spentUsd: spent,
      capUsd: cfg.monthlyCapUsd,
    };
  }

  const budget = getAgentBudget(input.agent);
  if (budget && budget.monthlyLimitUsd > 0 && budget.currentUsd >= budget.monthlyLimitUsd) {
    return {
      allowed: false,
      reason: `Vượt ngân sách của "${input.agent}": $${budget.currentUsd.toFixed(2)} / $${budget.monthlyLimitUsd}.`,
      spentUsd: spent,
      capUsd: cfg.monthlyCapUsd,
      agentBudget: budget,
    };
  }

  return { allowed: true, spentUsd: spent, capUsd: cfg.monthlyCapUsd, agentBudget: budget };
}

export interface GovernanceStatus {
  config: CostGovernorConfig;
  spentUsd: number;
  budgetPct: number;
  alert: boolean;
  gateOpen: boolean;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  byDomain: Record<string, { cost: number; calls: number }>;
  budgets: AgentBudget[];
}

export function getGovernanceStatus(): GovernanceStatus {
  const cfg = loadConfig();
  const snapshot = getSnapshot(30);
  const pct = cfg.monthlyCapUsd > 0 ? Math.min(100, Math.round((snapshot.totalCostUsd / cfg.monthlyCapUsd) * 100)) : 0;
  const gate = checkBudgetGate({ agent: '__global__' });
  return {
    config: { ...cfg },
    spentUsd: snapshot.totalCostUsd,
    budgetPct: pct,
    alert: cfg.alertThresholdPct > 0 && pct >= cfg.alertThresholdPct,
    gateOpen: gate.allowed,
    byAgent: snapshot.byAgent,
    byModel: snapshot.byModel,
    byDomain: snapshot.byDomain,
    budgets: snapshot.budgets,
  };
}
