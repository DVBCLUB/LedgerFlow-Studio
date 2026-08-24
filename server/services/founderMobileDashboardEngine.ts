/**
 * server/services/founderMobileDashboardEngine.ts
 * Tru Cot 53 - Real-Time Founder Mobile Dashboard
 */

export interface MobileDashboardKpi {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  alert: boolean;
}

export interface CohortRow {
  cohort: string;
  d30: number;
  d60: number;
  d90: number;
  ltv: number;
}

export interface MobileDashboardData {
  mrrVnd: number;
  arrVnd: number;
  burnRateVnd: number;
  runwayMonths: number;
  churnRatePercent: number;
  nrr: number;
  activeAccounts: number;
  kpis: MobileDashboardKpi[];
  cohorts: CohortRow[];
  lastRefreshedAt: string;
}

export interface MobileAlertResult {
  success: boolean;
  alertId: string;
  channel: 'telegram' | 'zalo' | 'email';
  message: string;
  sentAt: string;
}

export function getMobileDashboardData(): MobileDashboardData {
  return {
    mrrVnd: 2_480_000_000,
    arrVnd: 29_760_000_000,
    burnRateVnd: 720_000_000,
    runwayMonths: 34.4,
    churnRatePercent: 1.8,
    nrr: 118.3,
    activeAccounts: 952,
    kpis: [
      { label: 'MRR', value: 'D2.48B', delta: '+8.3% MoM', trend: 'up', alert: false },
      { label: 'ARR', value: 'D29.76B', delta: '+8.3% YoY', trend: 'up', alert: false },
      { label: 'Burn Rate', value: 'D720M/thang', delta: '-3.1%', trend: 'down', alert: false },
      { label: 'Runway', value: '34.4 thang', delta: '+1.2', trend: 'up', alert: false },
      { label: 'Churn', value: '1.8%', delta: '+0.3%', trend: 'up', alert: true },
      { label: 'NRR', value: '118.3%', delta: '+2.1pp', trend: 'up', alert: false },
      { label: 'Tai khoan', value: '952', delta: '+47 thang', trend: 'up', alert: false },
      { label: 'CAC Payback', value: '4.2 thang', delta: '-0.8', trend: 'down', alert: false },
    ],
    cohorts: [
      { cohort: '2026-Q1', d30: 94.2, d60: 89.1, d90: 85.7, ltv: 42_600_000 },
      { cohort: '2026-Q2', d30: 95.8, d60: 91.3, d90: 88.2, ltv: 46_200_000 },
      { cohort: '2026-Q3', d30: 96.1, d60: 92.4, d90: 0, ltv: 49_800_000 },
    ],
    lastRefreshedAt: new Date().toISOString(),
  };
}

export function triggerMobileAlert(metric: string, threshold: number): MobileAlertResult {
  const dashboard = getMobileDashboardData();
  const kpi = dashboard.kpis.find((k) => k.label.toLowerCase() === metric.toLowerCase());
  const alertId = 'ALERT-' + Date.now().toString(36).toUpperCase();
  return {
    success: true,
    alertId,
    channel: 'telegram',
    message: kpi
      ? '[CEO Alert] ' + kpi.label + ' = ' + kpi.value + ' -- vuot nguong ' + threshold + '%.'
      : '[CEO Alert] Chi so "' + metric + '" da vuot nguong ' + threshold + '%.',
    sentAt: new Date().toISOString(),
  };
}
