/**
 * glaciaStrategySimulationEngine.ts
 * ============================================================
 * GLACIA MONTE CARLO STRATEGY & BUSINESS SIMULATION ENGINE
 * ------------------------------------------------------------
 * Powers Executive "What-If" Business Simulation for Solo Founder/CEO:
 *  1. Monte Carlo Stochastic Simulation (1,000 Iterations)
 *  2. Multi-Variable Sensitivity (Pricing, CAC, Churn, AI Staff Leverage)
 *  3. Runway Probability Distribution (P10, P50, P90)
 *  4. Strategic Recommendations & Spoken Executive Synthesis
 * ============================================================
 */

export interface SimulationParams {
  monthlyRevenueBase: number;
  monthlyGrowthRatePct: number;
  monthlyOperatingExpense: number;
  cacUsd: number;
  arpuMonthlyUsd: number;
  monthlyChurnRatePct: number;
  currentCashReserveUsd: number;
  aiStaffEfficiencyMultiplier: number;
  simulationHorizonMonths: number;
  iterationCount?: number;
}

export interface SimulationMonthSnapshot {
  month: number;
  revenueMedian: number;
  revenueP10: number;
  revenueP90: number;
  cashReserveMedian: number;
  cashReserveP10: number;
  cashReserveP90: number;
  activeCustomersMedian: number;
}

export interface SimulationResult {
  id: string;
  runAt: string;
  params: SimulationParams;
  summary: {
    runwayMonthsMedian: number;
    survivalProbability24M: number;
    projectedArr24M: number;
    ltvCacRatio: number;
    cashBreakevenMonth: number | null;
    riskScore: number; // 0 (safest) to 100 (critical risk)
    riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  };
  monthlyProjection: SimulationMonthSnapshot[];
  glaciaStrategicAdvice: {
    verdict: string;
    strengths: string[];
    vulnerabilities: string[];
    top3Actions: string[];
    spokenSummary: string;
  };
  executionDurationMs: number;
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  params: SimulationParams;
}

export const PRESET_SCENARIOS: SimulationPreset[] = [
  {
    id: 'bootstrap_frugal',
    name: '🛡️ Tối Ưu Tinh Gọn (Bootstrap Frugal)',
    description: 'Chi phí cực thấp, tận dụng tối đa $0 AI Automation, ưu tiên bảo toàn dòng tiền.',
    params: {
      monthlyRevenueBase: 12000,
      monthlyGrowthRatePct: 8,
      monthlyOperatingExpense: 4500,
      cacUsd: 150,
      arpuMonthlyUsd: 79,
      monthlyChurnRatePct: 2.5,
      currentCashReserveUsd: 85000,
      aiStaffEfficiencyMultiplier: 2.5,
      simulationHorizonMonths: 24,
    },
  },
  {
    id: 'aggressive_growth',
    name: '🚀 Tăng Tốc Chiếm Lĩnh (Aggressive Growth)',
    description: 'Tăng ngân sách quảng cáo và phát hành sản phẩm, chấp nhận đốt tiền để mở rộng tệp khách hàng.',
    params: {
      monthlyRevenueBase: 25000,
      monthlyGrowthRatePct: 18,
      monthlyOperatingExpense: 18000,
      cacUsd: 380,
      arpuMonthlyUsd: 149,
      monthlyChurnRatePct: 4.0,
      currentCashReserveUsd: 150000,
      aiStaffEfficiencyMultiplier: 1.8,
      simulationHorizonMonths: 24,
    },
  },
  {
    id: 'ai_swarm_dominance',
    name: '⚡ Đế Chế AI Satellites ($0 Labor Leverage)',
    description: 'Sử dụng 5 AI Staff thay thế 80% nhân sự văn phòng, tối đa hóa biên lợi nhuận ròng.',
    params: {
      monthlyRevenueBase: 18000,
      monthlyGrowthRatePct: 14,
      monthlyOperatingExpense: 6000,
      cacUsd: 180,
      arpuMonthlyUsd: 119,
      monthlyChurnRatePct: 2.0,
      currentCashReserveUsd: 120000,
      aiStaffEfficiencyMultiplier: 4.0,
      simulationHorizonMonths: 24,
    },
  },
  {
    id: 'cashflow_fortress',
    name: '🏰 Pháo Đài Dòng Tiền (Cashflow Fortress)',
    description: 'Định giá cao cấp (High-ticket B2B), churn cực thấp, đảm bảo dòng tiền dương vững chắc.',
    params: {
      monthlyRevenueBase: 35000,
      monthlyGrowthRatePct: 10,
      monthlyOperatingExpense: 12000,
      cacUsd: 450,
      arpuMonthlyUsd: 299,
      monthlyChurnRatePct: 1.2,
      currentCashReserveUsd: 250000,
      aiStaffEfficiencyMultiplier: 3.0,
      simulationHorizonMonths: 24,
    },
  },
];

/**
 * Standard Normal Box-Muller Transform
 */
function randomNormal(mean = 0, stdDev = 1): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

function quantile(arr: number[], q: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/**
 * Execute Monte Carlo Business Simulation
 */
export async function runMonteCarloStrategySimulation(
  params: SimulationParams
): Promise<SimulationResult> {
  const startTime = Date.now();
  const iterations = params.iterationCount || 1000;
  const horizon = params.simulationHorizonMonths || 24;

  // Track raw trajectories
  const monthlyRevenueTrajectories: number[][] = Array.from({ length: horizon }, () => []);
  const monthlyCashTrajectories: number[][] = Array.from({ length: horizon }, () => []);
  const monthlyCustomerTrajectories: number[][] = Array.from({ length: horizon }, () => []);

  let survivedRuns = 0;
  const runwayList: number[] = [];
  let breakevenMonthsList: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let currentCash = params.currentCashReserveUsd;
    let currentCustomers = Math.max(10, Math.round(params.monthlyRevenueBase / Math.max(1, params.arpuMonthlyUsd)));
    let currentRevenue = currentCustomers * params.arpuMonthlyUsd;

    let hasRunwayEnded = false;
    let runwayMonth = horizon;
    let firstBreakeven: number | null = null;

    for (let m = 0; m < horizon; m++) {
      // Stochastic fluctuations
      const growthNoise = randomNormal(params.monthlyGrowthRatePct / 100, 0.04);
      const churnNoise = Math.max(0.005, randomNormal(params.monthlyChurnRatePct / 100, 0.008));
      const opexEfficiency = 1 - Math.min(0.5, (params.aiStaffEfficiencyMultiplier - 1) * 0.1);
      const adjustedOpex = params.monthlyOperatingExpense * opexEfficiency * (1 + m * 0.015);

      // Customer dynamics
      const newCustomers = Math.max(0, Math.round(currentCustomers * Math.max(-0.1, growthNoise)));
      const lostCustomers = Math.round(currentCustomers * churnNoise);
      currentCustomers = Math.max(1, currentCustomers + newCustomers - lostCustomers);

      currentRevenue = currentCustomers * params.arpuMonthlyUsd;
      const netCashflow = currentRevenue - adjustedOpex;
      currentCash += netCashflow;

      if (!hasRunwayEnded && currentCash <= 0) {
        hasRunwayEnded = true;
        runwayMonth = m + 1;
      }

      if (firstBreakeven === null && netCashflow > 0) {
        firstBreakeven = m + 1;
      }

      monthlyRevenueTrajectories[m].push(currentRevenue);
      monthlyCashTrajectories[m].push(currentCash);
      monthlyCustomerTrajectories[m].push(currentCustomers);
    }

    if (!hasRunwayEnded) {
      survivedRuns++;
    }
    runwayList.push(runwayMonth);
    if (firstBreakeven !== null) {
      breakevenMonthsList.push(firstBreakeven);
    }
  }

  // Calculate monthly stats
  const monthlyProjection: SimulationMonthSnapshot[] = [];
  for (let m = 0; m < horizon; m++) {
    monthlyProjection.push({
      month: m + 1,
      revenueMedian: Math.round(quantile(monthlyRevenueTrajectories[m], 0.5)),
      revenueP10: Math.round(quantile(monthlyRevenueTrajectories[m], 0.1)),
      revenueP90: Math.round(quantile(monthlyRevenueTrajectories[m], 0.9)),
      cashReserveMedian: Math.round(quantile(monthlyCashTrajectories[m], 0.5)),
      cashReserveP10: Math.round(quantile(monthlyCashTrajectories[m], 0.1)),
      cashReserveP90: Math.round(quantile(monthlyCashTrajectories[m], 0.9)),
      activeCustomersMedian: Math.round(quantile(monthlyCustomerTrajectories[m], 0.5)),
    });
  }

  const runwayMedian = quantile(runwayList, 0.5);
  const survivalPct = Math.round((survivedRuns / iterations) * 100);
  const projectedArr24M = Math.round(monthlyProjection[horizon - 1].revenueMedian * 12);
  const ltvMonths = 1 / Math.max(0.005, params.monthlyChurnRatePct / 100);
  const ltvUsd = ltvMonths * params.arpuMonthlyUsd;
  const ltvCacRatio = Number((ltvUsd / Math.max(1, params.cacUsd)).toFixed(2));
  const cashBreakevenMedian = breakevenMonthsList.length > 0 ? Math.round(quantile(breakevenMonthsList, 0.5)) : null;

  // Risk Score calculation
  let riskScore = 20;
  if (survivalPct < 80) riskScore += 30;
  if (survivalPct < 50) riskScore += 30;
  if (ltvCacRatio < 3.0) riskScore += 15;
  if (params.monthlyChurnRatePct > 3.5) riskScore += 10;
  if (params.currentCashReserveUsd < params.monthlyOperatingExpense * 6) riskScore += 15;
  riskScore = Math.min(100, Math.max(0, riskScore));

  const riskLevel: SimulationResult['summary']['riskLevel'] =
    riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'moderate' : 'low';

  // Glacia Strategic Advice Generation
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  const top3Actions: string[] = [];

  if (ltvCacRatio >= 4.0) {
    strengths.push(`Tỷ lệ LTV/CAC xuất sắc (${ltvCacRatio}x), biên lợi nhuận khách hàng vượt trội.`);
  } else {
    vulnerabilities.push(`LTV/CAC ở mức ${ltvCacRatio}x cần tối ưu hóa phễu chuyển đổi để giảm chi phí CAC.`);
  }

  if (survivalPct >= 90) {
    strengths.push(`Xác suất sống sót 24 tháng đạt ${survivalPct}%, nền tảng ngân quỹ vững chắc.`);
  } else {
    vulnerabilities.push(`Xác suất cạn kiệt ngân quỹ trước 24 tháng ở mức ${100 - survivalPct}%. Cần thận trọng với chi tiêu.`);
  }

  if (params.aiStaffEfficiencyMultiplier >= 2.5) {
    strengths.push(`Đòn bẩy AI Staff đạt x${params.aiStaffEfficiencyMultiplier} giúp tiết kiệm chi phí OPEX đáng kể.`);
  }

  top3Actions.push(
    `1. Duy trì tỷ lệ Churn dưới ${params.monthlyChurnRatePct}% bằng tính năng CSKH chủ động 24/7 của Glacia.`
  );
  top3Actions.push(
    `2. Phân bổ thêm 20% ngân sách marketing vào các kênh B2B có tỷ lệ LTV/CAC cao.`
  );
  top3Actions.push(
    `3. Tự động hóa hoàn toàn quy trình đối soát và báo cáo thuế để giữ chi phí vận hành ở mức tối thiểu.`
  );

  const verdict =
    riskLevel === 'low' || riskLevel === 'moderate'
      ? `Kịch bản kinh doanh rất khả quan với doanh thu dự phóng ARR 24 tháng đạt $${projectedArr24M.toLocaleString()} và tỷ lệ sống sót ${survivalPct}%. Đòn bẩy AI giúp doanh nghiệp đạt hiệu năng vượt bậc.`
      : `Cảnh báo rủi ro dòng tiền: Mô hình cần tối ưu hóa chi phí CAC hoặc tăng giá bán ARPU để đảm bảo an toàn thanh khoản dài hạn.`;

  const spokenSummary = `Dạ thưa Giám đốc, mô phỏng 1000 kịch bản cho thấy xác suất thành công đạt ${survivalPct} phần trăm, ARR dự phóng 24 tháng là ${projectedArr24M.toLocaleString()} đô la. Glacia khuyến nghị giữ vững đòn bẩy AI để tối đa hóa lợi nhuận ròng ạ!`;

  return {
    id: `sim-${Date.now().toString(36)}`,
    runAt: new Date().toISOString(),
    params,
    summary: {
      runwayMonthsMedian: runwayMedian,
      survivalProbability24M: survivalPct,
      projectedArr24M,
      ltvCacRatio,
      cashBreakevenMonth: cashBreakevenMedian,
      riskScore,
      riskLevel,
    },
    monthlyProjection,
    glaciaStrategicAdvice: {
      verdict,
      strengths,
      vulnerabilities,
      top3Actions,
      spokenSummary,
    },
    executionDurationMs: Date.now() - startTime,
  };
}
