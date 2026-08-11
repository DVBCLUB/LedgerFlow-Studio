/**
 * cloudCostCreditsOptimizer.ts
 * ============================================================
 * Cloud Cost & Credits Telemetry Optimizer for LedgerFlow OS.
 *
 * Tracks API credit balances and token costs across specialized Cloud APIs:
 *  - Runway ML Video Render API ($42.50 / $100.00)
 *  - ElevenLabs Voice Synthesizer API ($18.20 / $50.00)
 *  - OpenAI / Claude LLM Gateway ($65.00 / $150.00)
 *  - TikTok & YouTube Open API Gateways
 *  - Encrypted storage in runtime/cloud_cost_credits.local.enc.
 */

import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';

export interface ProviderCreditStatus {
  id: string;
  providerName: string;
  monthlyBudgetUsd: number;
  usedUsd: number;
  remainingUsd: number;
  usageRatio: number;
  alertStatus: 'HEALTHY' | 'WARNING_80' | 'EXHAUSTED';
}

interface CostStore {
  providers: Record<string, ProviderCreditStatus>;
}

let store: CostStore = { providers: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('CLOUD_COST_CREDITS_FILE', 'cloud_cost_credits.local.enc');
}

const PRESET_PROVIDERS: ProviderCreditStatus[] = [
  {
    id: 'prov_runway',
    providerName: 'Runway ML Video Render API',
    monthlyBudgetUsd: 100,
    usedUsd: 42.5,
    remainingUsd: 57.5,
    usageRatio: 0.425,
    alertStatus: 'HEALTHY',
  },
  {
    id: 'prov_elevenlabs',
    providerName: 'ElevenLabs Voice Synthesizer API',
    monthlyBudgetUsd: 50,
    usedUsd: 18.2,
    remainingUsd: 31.8,
    usageRatio: 0.364,
    alertStatus: 'HEALTHY',
  },
  {
    id: 'prov_llm_gateway',
    providerName: 'OpenAI / Claude LLM Gateway',
    monthlyBudgetUsd: 150,
    usedUsd: 65.0,
    remainingUsd: 85.0,
    usageRatio: 0.433,
    alertStatus: 'HEALTHY',
  },
];

async function loadStore(): Promise<CostStore> {
  const parsed = await readSecureJson<CostStore>(storageFile(), { providers: {} });
  store = { providers: parsed.providers || {} };

  if (Object.keys(store.providers).length === 0) {
    for (const p of PRESET_PROVIDERS) {
      store.providers[p.id] = p;
    }
    await saveStore();
  }

  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

loadStore().catch(() => undefined);

export async function listProviderCreditStatuses(): Promise<ProviderCreditStatus[]> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.providers).length === 0) await loadStore();

  return Object.values(store.providers).map((p) => {
    const usageRatio = Math.round((p.usedUsd / p.monthlyBudgetUsd) * 1000) / 1000;
    const alertStatus = usageRatio >= 1.0 ? 'EXHAUSTED' : usageRatio >= 0.8 ? 'WARNING_80' : 'HEALTHY';
    return {
      ...p,
      remainingUsd: Math.round((p.monthlyBudgetUsd - p.usedUsd) * 100) / 100,
      usageRatio,
      alertStatus,
    };
  });
}

export async function recordApiUsageCost(providerId: string, costUsd: number): Promise<ProviderCreditStatus | null> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.providers).length === 0) await loadStore();

  const provider = store.providers[providerId];
  if (!provider) return null;

  provider.usedUsd = Math.round((provider.usedUsd + costUsd) * 100) / 100;
  provider.remainingUsd = Math.round((provider.monthlyBudgetUsd - provider.usedUsd) * 100) / 100;
  provider.usageRatio = Math.round((provider.usedUsd / provider.monthlyBudgetUsd) * 1000) / 1000;
  provider.alertStatus = provider.usageRatio >= 1.0 ? 'EXHAUSTED' : provider.usageRatio >= 0.8 ? 'WARNING_80' : 'HEALTHY';

  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);

  return provider;
}
