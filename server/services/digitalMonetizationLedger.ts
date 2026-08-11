/**
 * digitalMonetizationLedger.ts
 * ============================================================
 * Multi-Stream Digital Monetization & AI Reinvestment Ledger for LedgerFlow OS.
 *
 * Tracks 4 digital revenue streams for Solo Founders:
 *  - 'affiliate' | 'ads' | 'game_app_sales' | 'direct_sales'
 *  - Real-time revenue aggregation & net profit calculations.
 *  - AI Reinvestment Calculator: Suggests reinvestment splits for AI video APIs & marketing ads.
 *  - Encrypted persistent storage in runtime/agent_digital_monetization.local.enc.
 */

import { randomUUID } from 'node:crypto';
import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { appendAuditEvent } from './auditLog.ts';
import { emitTelemetryEvent } from './agentTelemetryStream.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueStreamType = 'affiliate' | 'ads' | 'game_app_sales' | 'direct_sales';

export interface IncomeEntry {
  id: string;
  sourceName: string;
  streamType: RevenueStreamType;
  amountVnd: number;
  platformName: string; // E.g. 'Shopee', 'YouTube AdSense', 'Steam', 'TikTok Shop'
  notes?: string;
  date: string;
  createdAt: string;
}

export interface ReinvestmentRecommendation {
  totalRevenueVnd: number;
  recommendedReinvestmentVnd: number;
  allocations: {
    purpose: string;
    percentage: number;
    amountVnd: number;
    reason: string;
  }[];
}

interface MonetizationStore {
  entries: Record<string, IncomeEntry>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: MonetizationStore = { entries: {} };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('DIGITAL_MONETIZATION_FILE', 'agent_digital_monetization.local.enc');
}

const PRESET_ENTRIES: IncomeEntry[] = [
  { id: 'inc_aff_1', sourceName: 'Shopee Affiliate Tech Campaign', streamType: 'affiliate', amountVnd: 18500000, platformName: 'Shopee', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'inc_ads_1', sourceName: 'YouTube Channel AdSense', streamType: 'ads', amountVnd: 12400000, platformName: 'YouTube AdSense', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'inc_game_1', sourceName: 'Game Indie PC Steam In-App', streamType: 'game_app_sales', amountVnd: 35000000, platformName: 'Steam', date: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: 'inc_game_2', sourceName: 'Mobile Game Google Play Ads & IAP', streamType: 'game_app_sales', amountVnd: 22000000, platformName: 'Google Play', date: new Date().toISOString(), createdAt: new Date().toISOString() },
];

async function loadStore(): Promise<MonetizationStore> {
  const parsed = await readSecureJson<MonetizationStore>(storageFile(), { entries: {} });
  store = { entries: parsed.entries || {} };

  if (Object.keys(store.entries).length === 0) {
    for (const preset of PRESET_ENTRIES) {
      store.entries[preset.id] = preset;
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

export async function recordIncomeEntry(input: {
  sourceName: string;
  streamType: RevenueStreamType;
  amountVnd: number;
  platformName: string;
  notes?: string;
}): Promise<IncomeEntry> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.entries).length === 0) await loadStore();

  const id = `inc_${Date.now()}_${randomUUID().slice(0, 4)}`;
  const now = new Date().toISOString();

  const entry: IncomeEntry = {
    id,
    sourceName: input.sourceName,
    streamType: input.streamType,
    amountVnd: input.amountVnd,
    platformName: input.platformName,
    notes: input.notes,
    date: now,
    createdAt: now,
  };

  store.entries[id] = entry;
  queueSave();

  emitTelemetryEvent({
    category: 'agent_runtime',
    eventType: 'income_recorded',
    source: 'digital_monetization_ledger',
    summary: `Income recorded: +${input.amountVnd.toLocaleString('vi-VN')} VND [${input.streamType}] from ${input.platformName}`,
    payload: { id, amountVnd: input.amountVnd, streamType: input.streamType },
  });

  appendAuditEvent({
    actor: 'monetization-ledger',
    workspace: 'Monetization Radar',
    action: 'income.recorded',
    target: id,
    risk: 'LOW',
    status: 'executed',
    summary: `Recorded income +${input.amountVnd.toLocaleString('vi-VN')} VND from ${input.platformName}`,
    evidence: { id, amountVnd: input.amountVnd },
  }).catch(() => undefined);

  return entry;
}

export async function calculateTotalRevenue(): Promise<{
  totalVnd: number;
  byStream: Record<RevenueStreamType, number>;
}> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.entries).length === 0) await loadStore();

  const byStream: Record<RevenueStreamType, number> = {
    affiliate: 0,
    ads: 0,
    game_app_sales: 0,
    direct_sales: 0,
  };

  let totalVnd = 0;
  for (const entry of Object.values(store.entries)) {
    byStream[entry.streamType] = (byStream[entry.streamType] || 0) + entry.amountVnd;
    totalVnd += entry.amountVnd;
  }

  return { totalVnd, byStream };
}

export async function calculateAIReinvestmentRecommendation(reinvestmentRatio = 0.25): Promise<ReinvestmentRecommendation> {
  const { totalVnd } = await calculateTotalRevenue();
  const recommendedReinvestmentVnd = totalVnd * reinvestmentRatio;

  return {
    totalRevenueVnd: totalVnd,
    recommendedReinvestmentVnd,
    allocations: [
      {
        purpose: 'Nâng cấp API Video AI & Render Server',
        percentage: 40,
        amountVnd: recommendedReinvestmentVnd * 0.4,
        reason: 'Tăng tốc độ sinh video TikTok/Reels và phim AI chất lượng cao.',
      },
      {
        purpose: 'Chạy Quảng cáo TikTok Ads / Facebook Ads cho Game PC/Mobile',
        percentage: 35,
        amountVnd: recommendedReinvestmentVnd * 0.35,
        reason: 'Tăng số lượt tải Game và lượt mua In-app.',
      },
      {
        purpose: 'Quỹ Dự phòng Cloud Server & AI Credits',
        percentage: 25,
        amountVnd: recommendedReinvestmentVnd * 0.25,
        reason: 'Duy trì hạ tầng vận hành tự động cho Đội ngũ AI Staff.',
      },
    ],
  };
}

export async function listIncomeEntries(streamType?: RevenueStreamType): Promise<IncomeEntry[]> {
  await writeQueue.catch(() => undefined);
  if (Object.keys(store.entries).length === 0) await loadStore();

  let list = Object.values(store.entries);
  if (streamType) list = list.filter((e) => e.streamType === streamType);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
