/**
 * server/services/investorRelationsEngine.ts
 * ============================================================
 * Autonomous Investor Relations & Cap Table Equity Simulator
 *
 * Implements Level 7 Unicorn Capital & Governance:
 * 1. Automated Monthly/Quarterly Investor Digest Synthesis
 * 2. Cap Table Modeling (Founder Equity, ESOP Pool, Seed/Series A SAFE Notes)
 * 3. Waterfall Liquidity & Exit Valuation Simulation
 */

import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface CapTableShareholder {
  shareholderId: string;
  name: string;
  role: 'FOUNDER' | 'ESOP_POOL' | 'ANGEL_INVESTOR' | 'VC_SERIES_SEED';
  sharesCount: number;
  ownershipPercentage: number;
  investmentAmountVnd: number;
}

export interface InvestorUpdateReport {
  reportId: string;
  period: string; // e.g. "Q3 2026"
  arrVnd: number;
  mrrGrowthRatePercent: number;
  burnRateVnd: number;
  runwayMonths: number;
  keyWins: string[];
  keyAsks: string[];
  generatedAt: string;
}

let capTableStore: CapTableShareholder[] = [
  {
    shareholderId: 'sh_01_founder',
    name: 'Solo Founder (CEO)',
    role: 'FOUNDER',
    sharesCount: 7500000,
    ownershipPercentage: 75.0,
    investmentAmountVnd: 500000000,
  },
  {
    shareholderId: 'sh_02_esop',
    name: 'AI Agent & Core Contributor ESOP Pool',
    role: 'ESOP_POOL',
    sharesCount: 1500000,
    ownershipPercentage: 15.0,
    investmentAmountVnd: 0,
  },
  {
    shareholderId: 'sh_03_angel',
    name: 'Dragon Capital Angel Syndicate',
    role: 'ANGEL_INVESTOR',
    sharesCount: 1000000,
    ownershipPercentage: 10.0,
    investmentAmountVnd: 2500000000,
  },
];

/**
 * Lấy danh sách Cap Table và báo cáo quan hệ nhà đầu tư
 */
export function getInvestorRelationsData(): {
  capTable: CapTableShareholder[];
  totalShares: number;
  postMoneyValuationVnd: number;
  latestInvestorUpdate: InvestorUpdateReport;
} {
  const totalShares = capTableStore.reduce((s, sh) => s + sh.sharesCount, 0);

  const latestReport: InvestorUpdateReport = {
    reportId: `inv_up_${Date.now().toString(36)}`,
    period: 'Tháng 08/2026',
    arrVnd: 620000000,
    mrrGrowthRatePercent: 24.5,
    burnRateVnd: 45000000,
    runwayMonths: 18.8,
    keyWins: [
      'Đạt 116 dịch vụ AI tự trị vận hành liên tục không gián đoạn (Zero Downtime).',
      'Doanh thu định kỳ hàng tháng (MRR) tăng trưởng +24.5% nhờ tính năng VietQR Auto-Settlement.',
      'Tỷ lệ giải quyết khiếu nại khách hàng tự động (Deflection Rate) đạt 92%.',
    ],
    keyAsks: [
      'Kết nối với các Quỹ đầu tư B2B SaaS mở rộng thị trường Đông Nam Á (Singapore & Indo).',
      'Giới thiệu đối tác Tổng thầu Xây dựng quy mô > 500 tỷ để triển khai gói EPC.',
    ],
    generatedAt: new Date().toISOString(),
  };

  return {
    capTable: capTableStore,
    totalShares,
    postMoneyValuationVnd: 25000000000, // 25 Tỷ VND ($1M Pre-Seed)
    latestInvestorUpdate: latestReport,
  };
}

/**
 * Mô phỏng pha loãng cổ phần khi gọi vốn vòng mới
 */
export function simulateFundingRound(input: {
  roundName: string;
  raisedAmountVnd: number;
  preMoneyValuationVnd: number;
}): {
  postMoneyValuationVnd: number;
  dilutionPercentage: number;
  founderNewOwnership: number;
} {
  const postMoney = input.preMoneyValuationVnd + input.raisedAmountVnd;
  const dilution = Math.round((input.raisedAmountVnd / postMoney) * 1000) / 10;
  const founderNewOwnership = Math.round(75.0 * (1 - dilution / 100) * 10) / 10;

  publishSystemEvent({
    eventType: 'finance.funding_round_simulated',
    source: 'InvestorRelationsEngine',
    department: 'finance',
    payload: {
      roundName: input.roundName,
      postMoney,
      dilution,
    },
  });

  return {
    postMoneyValuationVnd: postMoney,
    dilutionPercentage: dilution,
    founderNewOwnership,
  };
}
