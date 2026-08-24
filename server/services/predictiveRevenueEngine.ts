export interface RevenueForecastPoint { month: string; p10Vnd: number; p50Vnd: number; p90Vnd: number; }
export interface PredictiveRevenueData { currentArrVnd: number; forecastedArrVnd90d: number; confidencePercent: number; churnRiskPercent: number; expansionArrVnd: number; forecastPoints: RevenueForecastPoint[]; keyDrivers: { driver: string; impact: 'positive' | 'negative'; magnitude: string }[]; }
export interface ScenarioResult { success: boolean; scenarioId: string; scenarioName: string; inputAssumptions: Record<string, number>; impactOnArrVnd: number; impactPercent: number; recommendedActions: string[]; simulatedAt: string; }

export function getPredictiveRevenueData(): PredictiveRevenueData {
  const months = ['Sep 2026', 'Oct 2026', 'Nov 2026'];
  return {
    currentArrVnd: 29_760_000_000,
    forecastedArrVnd90d: 34_200_000_000,
    confidencePercent: 87.3,
    churnRiskPercent: 4.2,
    expansionArrVnd: 5_800_000_000,
    forecastPoints: months.map((month, i) => ({
      month,
      p10Vnd: 30_500_000_000 + i * 900_000_000,
      p50Vnd: 31_800_000_000 + i * 1_200_000_000,
      p90Vnd: 33_200_000_000 + i * 1_500_000_000,
    })),
    keyDrivers: [
      { driver: 'PLG Upsell Conversion Rate +34.7%', impact: 'positive', magnitude: '+D3.2B ARR' },
      { driver: 'Onboarding Completion Rate 94.2%', impact: 'positive', magnitude: '+D2.1B ARR' },
      { driver: 'Delta Corp payment overdue', impact: 'negative', magnitude: '-D360M ARR' },
      { driver: 'Enterprise Tier 3 new logos', impact: 'positive', magnitude: '+D1.8B ARR' },
    ],
  };
}

export function runRevenueScenario(scenario: Record<string, unknown>): ScenarioResult {
  const churnDelta = typeof scenario.churnIncreasePct === 'number' ? scenario.churnIncreasePct : 5;
  const impact = -Math.round(29_760_000_000 * (churnDelta / 100) * 0.42);
  return {
    success: true,
    scenarioId: 'SCN-' + Date.now().toString(36).toUpperCase(),
    scenarioName: String(scenario.name || 'Custom Scenario'),
    inputAssumptions: { churnIncreasePct: churnDelta },
    impactOnArrVnd: impact,
    impactPercent: -churnDelta * 0.42,
    recommendedActions: [
      'Tang cuong chien dich giu chan khach hang NPS < 7',
      'Kich hoat Loyalty Gamification voi uu dai Diamond 3 thang',
      'Trien khai Customer Health Score chuong trinh Early Warning',
    ],
    simulatedAt: new Date().toISOString(),
  };
}
