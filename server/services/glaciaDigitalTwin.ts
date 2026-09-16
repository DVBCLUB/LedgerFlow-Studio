/**
 * glaciaDigitalTwin.ts
 * ============================================================
 * Glacia Digital Twin & Strategy Sandbox Simulator
 * ------------------------------------------------------------
 * 1. Shadow Execution: Chạy thử nghiệm trong sandbox an toàn
 * 2. What-If Strategy Simulation: Dự báo tác động quyết định kinh doanh
 * 3. Đánh giá rủi ro, dự toán chi phí & chỉ số an toàn hệ thống
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface ShadowSimulationResult {
  id: string;
  actionType: string;
  isSafe: boolean;
  riskScore: number; // 0 (an toan) - 100 (cuc ky nguy hiem)
  safetyScore: number; // 0 - 100
  estimatedDurationMs: number;
  estimatedCostUsd: number;
  sideEffects: string[];
  recommendation: 'proceed' | 'proceed_with_caution' | 'block_and_require_ceo_approval';
  simulatedAt: string;
}

export interface BusinessScenarioResult {
  id: string;
  scenarioName: string;
  projectedRevenueChangePercent: number;
  projectedProfitDeltaPercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceInterval: { min: number; max: number };
  keyInsights: string[];
  simulatedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const TWIN_LOG_FILE = path.join(RUNTIME_DIR, 'glacia_digital_twin_log.json');

function ensureTwinStore(): { shadowRuns: ShadowSimulationResult[]; scenarios: BusinessScenarioResult[] } {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
  if (!fs.existsSync(TWIN_LOG_FILE)) {
    const init = { shadowRuns: [], scenarios: [] };
    fs.writeFileSync(TWIN_LOG_FILE, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(TWIN_LOG_FILE, 'utf8'));
  } catch {
    return { shadowRuns: [], scenarios: [] };
  }
}

function saveTwinStore(data: { shadowRuns: ShadowSimulationResult[]; scenarios: BusinessScenarioResult[] }): void {
  ensureTwinStore();
  fs.writeFileSync(TWIN_LOG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Chạy mô phỏng Shadow Dry-Run cho bất kỳ hành động nào
 */
export function runShadowExecution(actionType: string, params: Record<string, any> = {}): ShadowSimulationResult {
  const store = ensureTwinStore();
  const id = `sim_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const aLower = actionType.toLowerCase();

  let riskScore = 15;
  const sideEffects: string[] = [];

  if (aLower.includes('delete') || aLower.includes('drop') || aLower.includes('truncate') || aLower.includes('format')) {
    riskScore = 95;
    sideEffects.push('Nguy cơ mất mát dữ liệu không thể hoàn tác');
  } else if (aLower.includes('push') || aLower.includes('deploy') || aLower.includes('publish')) {
    riskScore = 45;
    sideEffects.push('Tác động trực tiếp tới môi trường phân phối người dùng');
  } else if (aLower.includes('billing') || aLower.includes('transfer') || aLower.includes('money')) {
    riskScore = 80;
    sideEffects.push('Giao dịch tài chính yêu cầu chữ ký số hoặc phê duyệt của CEO');
  } else {
    riskScore = 10;
    sideEffects.push('Thao tác đọc hoặc xử lý cục bộ an toàn');
  }

  const safetyScore = Math.max(0, 100 - riskScore);
  const recommendation: ShadowSimulationResult['recommendation'] =
    riskScore >= 75
      ? 'block_and_require_ceo_approval'
      : riskScore >= 40
      ? 'proceed_with_caution'
      : 'proceed';

  const result: ShadowSimulationResult = {
    id,
    actionType,
    isSafe: riskScore < 75,
    riskScore,
    safetyScore,
    estimatedDurationMs: Math.round(Math.random() * 400 + 100),
    estimatedCostUsd: 0, // 100% local free
    sideEffects,
    recommendation,
    simulatedAt: new Date().toISOString(),
  };

  store.shadowRuns.unshift(result);
  while (store.shadowRuns.length > 50) store.shadowRuns.pop();
  saveTwinStore(store);

  return result;
}

/**
 * Chạy mô phỏng chiến lược kinh doanh What-If
 */
export function runWhatIfScenario(scenario: {
  name: string;
  priceDeltaPercent?: number;
  churnDeltaPercent?: number;
  marketingSpendMultiplier?: number;
}): BusinessScenarioResult {
  const store = ensureTwinStore();
  const id = `whatif_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const { name, priceDeltaPercent = 0, churnDeltaPercent = 0, marketingSpendMultiplier = 1 } = scenario;

  // Elasticity heuristic: 10% price increase -> ~2% churn increase in B2B SaaS
  const netRevenueGrowth = (priceDeltaPercent * 0.85) - (churnDeltaPercent * 1.2) + ((marketingSpendMultiplier - 1) * 8);
  const netProfitGrowth = netRevenueGrowth - ((marketingSpendMultiplier - 1) * 5);

  const riskLevel: 'low' | 'medium' | 'high' =
    Math.abs(priceDeltaPercent) > 25 || churnDeltaPercent > 5 ? 'high' : Math.abs(priceDeltaPercent) > 10 ? 'medium' : 'low';

  const result: BusinessScenarioResult = {
    id,
    scenarioName: name,
    projectedRevenueChangePercent: Number(netRevenueGrowth.toFixed(1)),
    projectedProfitDeltaPercent: Number(netProfitGrowth.toFixed(1)),
    riskLevel,
    confidenceInterval: {
      min: Number((netRevenueGrowth - 3.5).toFixed(1)),
      max: Number((netRevenueGrowth + 4.2).toFixed(1)),
    },
    keyInsights: [
      `Thay đổi giá ${priceDeltaPercent > 0 ? '+' : ''}${priceDeltaPercent}% tạo tác động doanh thu dự kiến ${netRevenueGrowth > 0 ? '+' : ''}${netRevenueGrowth.toFixed(1)}%.`,
      `Độ nhạy rủi ro ở mức ${riskLevel.toUpperCase()}.`,
      'Khuyến nghị áp dụng chính sách giá bậc thang (Tiered Pricing) cho khách hàng trung thành.',
    ],
    simulatedAt: new Date().toISOString(),
  };

  store.scenarios.unshift(result);
  while (store.scenarios.length > 50) store.scenarios.pop();
  saveTwinStore(store);

  return result;
}

export function getDigitalTwinHistory() {
  return ensureTwinStore();
}
