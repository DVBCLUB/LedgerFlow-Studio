/**
 * aiBusinessTwinSimulator.ts
 * ============================================================
 * AI Autonomous Business Twin & Profit Simulation Sandbox Engine.
 *
 * Simulates financial reinvestment scenarios for the Solo Founder:
 *  - Reinvesting % of Affiliate/Ads revenue into GPU VPS or TikTok Ads
 *  - Predicts Net Profit Margin growth after 30 days
 *  - Encrypted storage in runtime/business_twin.local.enc.
 */

import { readSecureJson, writeSecureJson } from './secureJsonStore.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import { calculateTotalRevenue } from './digitalMonetizationLedger.ts';

export interface BusinessTwinScenario {
  scenarioName: string;
  reinvestRatioPercent: number;
  monthlyRevenueVnd: number;
  reinvestAmountVnd: number;
  projectedProfitMarginPercent: number;
  projectedNetIncomeVnd: number;
  recommendation: string;
}

interface TwinStore {
  history: BusinessTwinScenario[];
}

let store: TwinStore = { history: [] };
let writeQueue = Promise.resolve();

function storageFile() {
  return resolveRuntimePathFromEnv('BUSINESS_TWIN_FILE', 'business_twin.local.enc');
}

async function loadStore(): Promise<TwinStore> {
  const parsed = await readSecureJson<TwinStore>(storageFile(), { history: [] });
  store = { history: parsed.history || [] };
  return store;
}

async function saveStore(): Promise<void> {
  await writeSecureJson(storageFile(), store);
}

loadStore().catch(() => undefined);

export async function simulateProfitGrowth(
  scenarioName: string,
  reinvestRatioPercent: number = 25
): Promise<BusinessTwinScenario> {
  await writeQueue.catch(() => undefined);

  const { totalVnd } = await calculateTotalRevenue();
  const baseRevenue = totalVnd > 0 ? totalVnd : 50_000_000;

  const reinvestAmountVnd = Math.round(baseRevenue * (reinvestRatioPercent / 100));
  // ROI factor of 1.45x return on AI media/ads automation reinvestment
  const projectedNetIncomeVnd = Math.round((baseRevenue - reinvestAmountVnd) + (reinvestAmountVnd * 1.45));
  const projectedProfitMarginPercent = Math.round((projectedNetIncomeVnd / baseRevenue) * 100);

  const result: BusinessTwinScenario = {
    scenarioName,
    reinvestRatioPercent,
    monthlyRevenueVnd: baseRevenue,
    reinvestAmountVnd,
    projectedProfitMarginPercent,
    projectedNetIncomeVnd,
    recommendation: `Trích ${reinvestRatioPercent}% tái đầu tư vào AI Media Ads giúp tăng +45% lợi nhuận ròng sau 30 ngày.`,
  };

  store.history.unshift(result);
  if (store.history.length > 20) store.history = store.history.slice(0, 20);

  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);

  return result;
}
