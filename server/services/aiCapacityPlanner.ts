/**
 * aiCapacityPlanner.ts
 * ============================================================
 * SMART AI CAPACITY PLANNER & BUDGET FORECASTER
 *
 * Forecasts AI token consumption and monthly budget depletion timelines.
 * Provides actionable optimization recommendations to prevent sudden budget cuts.
 */

import { getGovernanceStatus } from './costGovernor.ts';
import { recordAIAction } from './aiActionLedger.ts';

export type BudgetRiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface CapacityOptimizationTip {
  tipId: string;
  category: 'ROUTING_TIER' | 'SCHEDULE_TUNING' | 'MODEL_DOWNGRADE' | 'LOCAL_OFFLOAD';
  title: string;
  description: string;
  potentialSavingsUsd: number;
  isActionableNow: boolean;
}

export interface CapacityForecast {
  forecastId: string;
  currentSpentUsd: number;
  monthlyCapUsd: number;
  dailyBurnRateUsd: number;
  estimatedDaysUntilCap: number; // e.g. 18 days left
  projectedMonthEndSpendUsd: number;
  riskLevel: BudgetRiskLevel;
  budgetUsedPct: number;
  recommendations: CapacityOptimizationTip[];
  generatedAt: string;
}

/**
 * Generate Capacity & Budget Forecast
 */
export function generateCapacityForecast(customDaysInMonth: number = 30): CapacityForecast {
  const gov = getGovernanceStatus();
  const currentSpentUsd = gov.spentUsd;
  const monthlyCapUsd = gov.config.monthlyCapUsd || 10;
  const budgetUsedPct = gov.budgetPct;

  // Estimate burn rate: assuming 7 days average window or minimum baseline
  const dayOfMonth = Math.max(1, new Date().getDate());
  const dailyBurnRateUsd = Number((currentSpentUsd / dayOfMonth).toFixed(3));

  const remainingBudgetUsd = Math.max(0, monthlyCapUsd - currentSpentUsd);
  const estimatedDaysUntilCap = dailyBurnRateUsd > 0
    ? Math.max(0, Math.round(remainingBudgetUsd / dailyBurnRateUsd))
    : 999;

  const daysRemainingInMonth = Math.max(0, customDaysInMonth - dayOfMonth);
  const projectedMonthEndSpendUsd = Number((currentSpentUsd + dailyBurnRateUsd * daysRemainingInMonth).toFixed(2));

  let riskLevel: BudgetRiskLevel = 'SAFE';
  if (estimatedDaysUntilCap <= 5 || projectedMonthEndSpendUsd > monthlyCapUsd * 1.2) {
    riskLevel = 'CRITICAL';
  } else if (estimatedDaysUntilCap <= 14 || projectedMonthEndSpendUsd > monthlyCapUsd * 0.9) {
    riskLevel = 'WARNING';
  }

  const recommendations: CapacityOptimizationTip[] = [];

  if (riskLevel === 'CRITICAL' || riskLevel === 'WARNING') {
    recommendations.push({
      tipId: 'opt_ollama_local',
      category: 'LOCAL_OFFLOAD',
      title: 'Kích hoạt mô hình cục bộ Ollama Local $0 cho AI Dev',
      description: 'Chuyển các task lập trình và kiểm thử sang Ollama Qwen 2.5 Coder để tiết kiệm 100% chi phí API.',
      potentialSavingsUsd: Number((monthlyCapUsd * 0.4).toFixed(2)),
      isActionableNow: true,
    });

    recommendations.push({
      tipId: 'opt_tune_night_sweeper',
      category: 'SCHEDULE_TUNING',
      title: 'Tối ưu tần suất Robot Quét Dọn Ban Đêm',
      description: 'Giảm tần suất chạy robot sweeper từ mỗi 2 giờ sang 1 lần/đêm lúc 02:00 sáng.',
      potentialSavingsUsd: Number((monthlyCapUsd * 0.15).toFixed(2)),
      isActionableNow: true,
    });
  }

  recommendations.push({
    tipId: 'opt_free_tier_first',
    category: 'ROUTING_TIER',
    title: 'Ưu tiên Groq Free & Gemini Flash cho tác vụ tóm tắt',
    description: 'Chuyển các tác vụ tổng hợp của Chief of Staff và AI Support sang Groq Llama 3.3 Free Tier.',
    potentialSavingsUsd: Number((monthlyCapUsd * 0.2).toFixed(2)),
    isActionableNow: true,
  });

  const forecastId = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const forecast: CapacityForecast = {
    forecastId,
    currentSpentUsd,
    monthlyCapUsd,
    dailyBurnRateUsd,
    estimatedDaysUntilCap,
    projectedMonthEndSpendUsd,
    riskLevel,
    budgetUsedPct,
    recommendations,
    generatedAt: new Date().toISOString(),
  };

  recordAIAction({
    agentId: 'capacity_planner_engine',
    roleId: 'role_ai_cfo_director',
    domain: 'finance_vas200',
    actionType: 'CAPACITY_FORECAST_GENERATED',
    targetResource: forecastId,
    outputSummary: `Dự báo ngân sách AI: $${currentSpentUsd}/$${monthlyCapUsd} (${budgetUsedPct}%). Rủi ro: ${riskLevel}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return forecast;
}
