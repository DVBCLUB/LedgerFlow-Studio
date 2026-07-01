/**
 * aiModelGateway.ts
 * ============================================================
 * AI Model Gateway — production-grade model routing với
 * load balancing, rate limiting, circuit breaker, và
 * failover tự động giữa các provider.
 *
 * Pattern: Request → Gateway (check health, rate, circuit)
 * → Pick best provider → Execute → Return with fallback
 */
import { randomUUID } from 'node:crypto';
import type { AIRoutingTask } from './aiClient.ts';
import { callAIWithFallback, diagnoseAIRouter } from './aiRouter.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type ProviderStatus = 'online' | 'degraded' | 'offline' | 'rate_limited';

export interface ProviderHealth {
  provider: string;
  model: string;
  status: ProviderStatus;
  latencyMs: number;
  successRate: number;
  lastCheck: string;
  consecutiveFailures: number;
  rateLimitRemaining: number;
  rateLimitResetAt?: string;
  circuitOpen: boolean;
  circuitOpenAt?: string;
}

export interface GatewayRequest {
  prompt: string;
  domain: string;
  maxTokens?: number;
  temperature?: number;
  preferredProvider?: string;
  preferredModel?: string;
}

export interface GatewayResponse {
  provider: string;
  model: string;
  content: string;
  latencyMs: number;
  status: 'completed' | 'fallback' | 'failed';
  fallbackChain: string[];  // providers tried before success
}

export interface GatewayStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  byProvider: Record<string, { requests: number; success: number; avgLatency: number; rateLimitHits: number }>;
  circuitBreakersOpen: number;
}

// ─── Provider Config ────────────────────────────────────────────────
interface ProviderConfig {
  provider: string;
  model: string;
  priority: number;
  weight: number;       // Load balancing weight
  maxConcurrent: number;
  rateLimitPerMin: number;
  circuitThreshold: number;  // consecutive failures to open circuit
  circuitRecoveryMs: number; // time before trying again after circuit opens
  costPer1KTokens: number;
}

// Default provider pool
const PROVIDER_POOL: ProviderConfig[] = [
  { provider: 'openai', model: 'gpt-4o', priority: 1, weight: 40, maxConcurrent: 5, rateLimitPerMin: 20, circuitThreshold: 5, circuitRecoveryMs: 60000, costPer1KTokens: 0.01 },
  { provider: 'openai', model: 'gpt-4o-mini', priority: 2, weight: 30, maxConcurrent: 10, rateLimitPerMin: 50, circuitThreshold: 3, circuitRecoveryMs: 30000, costPer1KTokens: 0.001 },
  { provider: 'anthropic', model: 'claude-3.5-sonnet', priority: 1, weight: 30, maxConcurrent: 5, rateLimitPerMin: 15, circuitThreshold: 5, circuitRecoveryMs: 60000, costPer1KTokens: 0.015 },
  { provider: 'anthropic', model: 'claude-3-haiku', priority: 3, weight: 20, maxConcurrent: 10, rateLimitPerMin: 50, circuitThreshold: 3, circuitRecoveryMs: 30000, costPer1KTokens: 0.001 },
  { provider: 'deepseek', model: 'deepseek-chat', priority: 2, weight: 25, maxConcurrent: 8, rateLimitPerMin: 30, circuitThreshold: 4, circuitRecoveryMs: 45000, costPer1KTokens: 0.001 },
  { provider: 'deepseek', model: 'deepseek-reasoner', priority: 3, weight: 20, maxConcurrent: 6, rateLimitPerMin: 20, circuitThreshold: 4, circuitRecoveryMs: 45000, costPer1KTokens: 0.002 },
  { provider: 'groq', model: 'llama-3.3-70b', priority: 2, weight: 15, maxConcurrent: 10, rateLimitPerMin: 30, circuitThreshold: 4, circuitRecoveryMs: 45000, costPer1KTokens: 0.0005 },
  { provider: 'groq', model: 'mixtral-8x7b', priority: 4, weight: 10, maxConcurrent: 15, rateLimitPerMin: 60, circuitThreshold: 3, circuitRecoveryMs: 30000, costPer1KTokens: 0.0003 },
  { provider: 'ollama', model: 'local', priority: 10, weight: 5, maxConcurrent: 2, rateLimitPerMin: 999, circuitThreshold: 10, circuitRecoveryMs: 30000, costPer1KTokens: 0 },
];

function mapDomainToTask(domain?: string): AIRoutingTask {
  const normalized = String(domain || '').toLowerCase();
  if (normalized.includes('market')) return 'marketing';
  if (normalized.includes('sale') || normalized.includes('crm')) return 'sales';
  if (normalized.includes('account')) return 'accounting';
  if (normalized.includes('analytic') || normalized.includes('data')) return 'analytics';
  if (normalized.includes('code') || normalized.includes('dev')) return 'coding';
  return 'general';
}

// ─── Health Registry ────────────────────────────────────────────────
const healthMap = new Map<string, ProviderHealth>();
const rateLimitCounters = new Map<string, { count: number; windowStart: number }>();
const activeConnections = new Map<string, number>();
let totalRequests = 0;
let totalSuccess = 0;
let totalFailed = 0;
let totalLatencyMs = 0;

// Init health
function initHealth(): void {
  for (const cfg of PROVIDER_POOL) {
    const key = `${cfg.provider}:${cfg.model}`;
    healthMap.set(key, {
      provider: cfg.provider,
      model: cfg.model,
      status: 'online',
      latencyMs: 0,
      successRate: 100,
      lastCheck: new Date().toISOString(),
      consecutiveFailures: 0,
      rateLimitRemaining: cfg.rateLimitPerMin,
      circuitOpen: false,
    });
    rateLimitCounters.set(key, { count: 0, windowStart: Date.now() });
    activeConnections.set(key, 0);
  }
}
initHealth();

// ─── Core API ───────────────────────────────────────────────────────

export function getProviderHealth(): ProviderHealth[] {
  return Array.from(healthMap.values());
}

export async function getProviderHealthSnapshot(): Promise<ProviderHealth[]> {
  try {
    const diagnostics = await diagnoseAIRouter();
    if (!diagnostics.results?.length) return getProviderHealth();
    return diagnostics.results.map((item) => ({
      provider: item.provider,
      model: item.model || 'default',
      status: item.status === 'ok' ? 'online' : item.status === 'quota' ? 'rate_limited' : 'degraded',
      latencyMs: item.latencyMs || 0,
      successRate: item.status === 'ok' ? 100 : item.status === 'quota' ? 60 : 30,
      lastCheck: diagnostics.checkedAt,
      consecutiveFailures: item.status === 'ok' ? 0 : 1,
      rateLimitRemaining: item.status === 'quota' ? 0 : 1,
      circuitOpen: false,
    }));
  } catch {
    return getProviderHealth();
  }
}

export function getGatewayStats(): GatewayStats {
  const byProvider: Record<string, any> = {};
  for (const cfg of PROVIDER_POOL) {
    byProvider[cfg.provider] = {
      requests: totalRequests,
      success: totalSuccess,
      avgLatency: totalRequests > 0 ? +(totalLatencyMs / totalRequests).toFixed(1) : 0,
      rateLimitHits: rateLimitCounters.get(`${cfg.provider}:${cfg.model}`)?.count || 0,
    };
  }

  return {
    totalRequests, successfulRequests: totalSuccess, failedRequests: totalFailed,
    avgLatencyMs: totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
    byProvider,
    circuitBreakersOpen: Array.from(healthMap.values()).filter(h => h.circuitOpen).length,
  };
}

export async function getGatewayStatsSnapshot(): Promise<GatewayStats> {
  const base = getGatewayStats();
  try {
    const diagnostics = await diagnoseAIRouter();
    const success = diagnostics.results.filter((item) => item.status === 'ok').length;
    const failed = diagnostics.results.filter((item) => item.status !== 'ok').length;
    return {
      ...base,
      successfulRequests: Math.max(base.successfulRequests, success),
      failedRequests: Math.max(base.failedRequests, failed),
    };
  } catch {
    return base;
  }
}

export async function routeThroughGateway(request: GatewayRequest): Promise<GatewayResponse> {
  const requestId = `gw_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const start = Date.now();
  totalRequests++;

  const fallbackChain: string[] = [];

  // Step 1: Filter providers by status
  const candidates = PROVIDER_POOL
    .filter(cfg => {
      const key = `${cfg.provider}:${cfg.model}`;
      const health = healthMap.get(key);
      if (!health) return false;

      // Circuit breaker check
      if (health.circuitOpen) {
        const openMs = health.circuitOpenAt ? Date.now() - new Date(health.circuitOpenAt).getTime() : 0;
        if (openMs < cfg.circuitRecoveryMs) return false; // Still in recovery
        // Recovery attempt — half-open
        health.status = 'degraded';
      }

      // Rate limit check
      const counter = rateLimitCounters.get(key);
      if (counter) {
        const elapsed = Date.now() - counter.windowStart;
        if (elapsed > 60000) { counter.count = 0; counter.windowStart = Date.now(); }
        if (counter.count >= cfg.rateLimitPerMin) {
          health.status = 'rate_limited';
          return false;
        }
      }

      // Concurrency check
      if ((activeConnections.get(key) || 0) >= cfg.maxConcurrent) return false;

      // Preferred provider filter
      if (request.preferredProvider && cfg.provider !== request.preferredProvider) return false;
      if (request.preferredModel && cfg.model !== request.preferredModel) return false;

      return true;
    })
    .sort((a, b) => a.priority - b.priority || b.weight - a.weight);

  if (candidates.length === 0) {
    // All providers down — try any with circuit recovery
    const anyAvailable = PROVIDER_POOL.filter(cfg => {
      const health = healthMap.get(`${cfg.provider}:${cfg.model}`);
      return health && !health.circuitOpen;
    });
    if (anyAvailable.length === 0) {
      return {
        provider: 'none', model: 'none', content: 'ALL_PROVIDERS_UNAVAILABLE',
        latencyMs: Date.now() - start, status: 'failed', fallbackChain,
      };
    }
    candidates.push(...anyAvailable.sort((a, b) => a.priority - b.priority));
  }

  // Step 2: Try providers in order
  for (const cfg of candidates) {
    const key = `${cfg.provider}:${cfg.model}`;
    const health = healthMap.get(key)!;
    fallbackChain.push(key);

    try {
      // Increment rate limit counter
      const counter = rateLimitCounters.get(key)!;
      counter.count++;
      health.rateLimitRemaining = cfg.rateLimitPerMin - counter.count;

      // Increment active connections
      activeConnections.set(key, (activeConnections.get(key) || 0) + 1);

      const callStart = Date.now();
      const aiResult = await callAIWithFallback(
        [{ role: 'user', content: request.prompt }],
        {
          task: mapDomainToTask(request.domain),
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          preferredProvider: cfg.provider as any,
          preferredModel: cfg.model,
          strictPreferred: true,
        },
      );
      const content = aiResult.content || '';

      const callLatency = Date.now() - callStart;

      // Decrement active connections
      activeConnections.set(key, Math.max(0, (activeConnections.get(key) || 1) - 1));

      // Update health
      health.consecutiveFailures = 0;
      health.latencyMs = +(health.latencyMs * 0.7 + callLatency * 0.3).toFixed(1);
      health.lastCheck = new Date().toISOString();
      health.successRate = +(health.successRate * 0.9 + 100 * 0.1).toFixed(1);
      if (health.circuitOpen) health.circuitOpen = false;

      totalSuccess++;
      totalLatencyMs += Date.now() - start;

      return {
        provider: cfg.provider, model: cfg.model, content,
        latencyMs: Date.now() - start, status: 'completed', fallbackChain,
      };
    } catch (err: any) {
      activeConnections.set(key, Math.max(0, (activeConnections.get(key) || 1) - 1));
      health.consecutiveFailures++;
      health.successRate = +(health.successRate * 0.9).toFixed(1);

      // Open circuit breaker if threshold reached
      if (health.consecutiveFailures >= cfg.circuitThreshold) {
        health.circuitOpen = true;
        health.circuitOpenAt = new Date().toISOString();
        health.status = 'offline';
      }
    }
  }

  // All providers failed
  totalFailed++;
  return {
    provider: candidates[0]?.provider || 'none',
    model: candidates[0]?.model || 'none',
    content: 'GATEWAY_EXHAUSTED',
    latencyMs: Date.now() - start,
    status: 'failed',
    fallbackChain,
  };
}

export function resetCircuitBreaker(provider: string, model: string): boolean {
  const key = `${provider}:${model}`;
  const health = healthMap.get(key);
  if (!health) return false;
  health.circuitOpen = false;
  health.consecutiveFailures = 0;
  health.status = 'online';
  return true;
}

export function resetAllCircuits(): number {
  let count = 0;
  for (const [, health] of healthMap) {
    if (health.circuitOpen) {
      health.circuitOpen = false;
      health.consecutiveFailures = 0;
      health.status = 'online';
      count++;
    }
  }
  return count;
}

export function getProviderConfigs(): ProviderConfig[] {
  return [...PROVIDER_POOL];
}
