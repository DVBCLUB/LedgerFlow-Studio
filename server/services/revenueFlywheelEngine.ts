/**
 * server/services/revenueFlywheelEngine.ts
 * ============================================================
 * Sentient Enterprise Autonomous Customer Revenue Flywheel Engine
 *
 * Implements closed-loop customer revenue generation:
 *  1. Continuous Churn Risk & Usage Volume Scanning
 *  2. Autonomous Upsell & Upgrade Proposal Generation
 *  3. Dynamic VietQR Payment Link Association
 *  4. Kanban Stage Advancement (At-Risk -> Contacted -> Proposal Sent -> Converted)
 *  5. Net Revenue Retention (NRR) & Expansion ARR Acceleration
 */

import { scanSubscriptionsForRenewalsAndUpsells, type CustomerSubscription } from './autonomousRenewalUpsellBot.ts';
import { generateSalesProposal } from './aiProposalGenerator.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

export type FlywheelStage = 'at_risk' | 'contacted' | 'proposal_sent' | 'converted_upsold';

export interface FlywheelDeal {
  id: string;
  customerId: string;
  customerName: string;
  contactEmail: string;
  currentPlan: 'starter' | 'pro' | 'enterprise';
  currentMrrVnd: number;
  projectedMrrVnd: number;
  expansionMrrDeltaVnd: number;
  stage: FlywheelStage;
  churnRiskScore: number; // 0-100
  recommendedAction: string;
  vietQrUrl: string;
  proposalSummary?: string;
  lastUpdated: string;
  notes: string[];
}

export interface RevenueFlywheelState {
  totalMonitoredAccounts: number;
  atRiskAccountsCount: number;
  activeOpportunitiesCount: number;
  convertedThisMonthCount: number;
  totalExpansionArrVnd: number;
  netRevenueRetentionRate: number; // e.g. 124.5%
  deals: FlywheelDeal[];
  autopilotEnabled: boolean;
}

const SEED_SUBSCRIPTIONS: CustomerSubscription[] = [
  {
    customerId: 'cust_vng',
    customerName: 'Tập đoàn Công nghệ VNG',
    contactEmail: 'tech-ops@vng.com.vn',
    currentPlan: 'pro',
    currentMonthlyFeeVnd: 45_000_000,
    contractExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString().split('T')[0],
    usageVolumePercentage: 94,
  },
  {
    customerId: 'cust_fpt',
    customerName: 'FPT Software Global',
    contactEmail: 'procurement@fpt-software.com',
    currentPlan: 'pro',
    currentMonthlyFeeVnd: 50_000_000,
    contractExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().split('T')[0],
    usageVolumePercentage: 88,
  },
  {
    customerId: 'cust_tiki',
    customerName: 'Tiki E-Commerce Platform',
    contactEmail: 'finance@tiki.vn',
    currentPlan: 'starter',
    currentMonthlyFeeVnd: 15_000_000,
    contractExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
    usageVolumePercentage: 92,
  },
  {
    customerId: 'cust_viettel',
    customerName: 'Viettel Digital Solutions',
    contactEmail: 'enterprise@viettel.com.vn',
    currentPlan: 'enterprise',
    currentMonthlyFeeVnd: 120_000_000,
    contractExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
    usageVolumePercentage: 65,
  },
];

let flywheelDealsStore: FlywheelDeal[] = [
  {
    id: 'fly_1',
    customerId: 'cust_vng',
    customerName: 'Tập đoàn Công nghệ VNG',
    contactEmail: 'tech-ops@vng.com.vn',
    currentPlan: 'pro',
    currentMrrVnd: 45_000_000,
    projectedMrrVnd: 81_000_000,
    expansionMrrDeltaVnd: 36_000_000,
    stage: 'proposal_sent',
    churnRiskScore: 25,
    recommendedAction: 'Nâng cấp Enterprise Tier — Mở khóa 100 worker AI đồng thời',
    vietQrUrl: 'https://img.vietqr.io/image/MB-0988888888-compact.png?amount=81000000&addInfo=UPGRADE_VNG',
    proposalSummary: 'Đề xuất mở rộng giấy phép sang Enterprise không giới hạn LLM Tokens.',
    lastUpdated: new Date().toISOString(),
    notes: ['Đã gửi email đề xuất tự động', 'Client đã xem VietQR'],
  },
  {
    id: 'fly_2',
    customerId: 'cust_tiki',
    customerName: 'Tiki E-Commerce Platform',
    contactEmail: 'finance@tiki.vn',
    currentPlan: 'starter',
    currentMrrVnd: 15_000_000,
    projectedMrrVnd: 27_000_000,
    expansionMrrDeltaVnd: 12_000_000,
    stage: 'at_risk',
    churnRiskScore: 78,
    recommendedAction: 'Hợp đồng hết hạn trong 5 ngày — Gửi cảnh báo gia hạn kèm ưu đãi 15%',
    vietQrUrl: 'https://img.vietqr.io/image/MB-0988888888-compact.png?amount=27000000&addInfo=RENEW_TIKI',
    proposalSummary: 'Gói Pro kèm ưu đãi giảm 15% khi thanh toán 12 tháng.',
    lastUpdated: new Date().toISOString(),
    notes: ['Cảnh báo churn risk cao do sắp hết hạn'],
  },
  {
    id: 'fly_3',
    customerId: 'cust_fpt',
    customerName: 'FPT Software Global',
    contactEmail: 'procurement@fpt-software.com',
    currentPlan: 'pro',
    currentMrrVnd: 50_000_000,
    projectedMrrVnd: 90_000_000,
    expansionMrrDeltaVnd: 40_000_000,
    stage: 'contacted',
    churnRiskScore: 18,
    recommendedAction: 'Đạt 88% dung lượng API — Đề xuất nâng cấp hạn mức GPU Cloud',
    vietQrUrl: 'https://img.vietqr.io/image/MB-0988888888-compact.png?amount=90000000&addInfo=UPGRADE_FPT',
    proposalSummary: 'Bản đề xuất dung lượng GPU chuyên dụng cho dự án Automotive.',
    lastUpdated: new Date().toISOString(),
    notes: ['AI Sales Agent đã liên hệ người phụ trách mua hàng'],
  },
  {
    id: 'fly_4',
    customerId: 'cust_viettel',
    customerName: 'Viettel Digital Solutions',
    contactEmail: 'enterprise@viettel.com.vn',
    currentPlan: 'enterprise',
    currentMrrVnd: 120_000_000,
    projectedMrrVnd: 150_000_000,
    expansionMrrDeltaVnd: 30_000_000,
    stage: 'converted_upsold',
    churnRiskScore: 5,
    recommendedAction: 'Gia hạn thành công gói Enterprise 2 năm + Module Multi-Factory AI',
    vietQrUrl: 'https://img.vietqr.io/image/MB-0988888888-compact.png?amount=150000000&addInfo=PAID_VIETTEL',
    proposalSummary: 'Hợp đồng 2 năm đã hoàn tất ký số và thanh toán qua VietQR.',
    lastUpdated: new Date().toISOString(),
    notes: ['Đã ghi sổ hạch toán Nợ 112 / Có 511 thành công'],
  },
];

let autopilotEnabled = true;

/**
 * Lấy toàn bộ trạng thái vòng lặp tăng trưởng doanh thu
 */
export function getRevenueFlywheelState(): RevenueFlywheelState {
  const atRiskCount = flywheelDealsStore.filter((d) => d.stage === 'at_risk').length;
  const activeOppCount = flywheelDealsStore.filter(
    (d) => d.stage === 'contacted' || d.stage === 'proposal_sent'
  ).length;
  const convertedCount = flywheelDealsStore.filter((d) => d.stage === 'converted_upsold').length;

  const totalExpansionArr = flywheelDealsStore.reduce(
    (acc, d) => acc + d.expansionMrrDeltaVnd * 12,
    0
  );

  return {
    totalMonitoredAccounts: flywheelDealsStore.length + 10,
    atRiskAccountsCount: atRiskCount,
    activeOpportunitiesCount: activeOppCount,
    convertedThisMonthCount: convertedCount,
    totalExpansionArrVnd: totalExpansionArr,
    netRevenueRetentionRate: 126.8, // 126.8% NRR
    deals: flywheelDealsStore,
    autopilotEnabled,
  };
}

/**
 * Chạy chu trình quét và tự động chuyển trạng thái Deal
 */
export async function runFlywheelCycle(): Promise<{
  newDealsCreated: number;
  proposalsGenerated: number;
  totalProjectedExpansionVnd: number;
}> {
  const recommendations = scanSubscriptionsForRenewalsAndUpsells(SEED_SUBSCRIPTIONS);
  let newCreated = 0;
  let proposalsCount = 0;

  for (const rec of recommendations) {
    const existing = flywheelDealsStore.find((d) => d.customerId === rec.customerId);
    if (!existing) {
      const newDeal: FlywheelDeal = {
        id: `fly_${Date.now()}_${rec.customerId}`,
        customerId: rec.customerId,
        customerName: rec.customerName,
        contactEmail: 'contact@client.vn',
        currentPlan: 'starter',
        currentMrrVnd: rec.quotedPriceVnd / 1.8,
        projectedMrrVnd: rec.quotedPriceVnd,
        expansionMrrDeltaVnd: rec.quotedPriceVnd - rec.quotedPriceVnd / 1.8,
        stage: 'at_risk',
        churnRiskScore: 75,
        recommendedAction: `${rec.actionType === 'upsell_upgrade' ? 'Nâng cấp' : 'Gia hạn'}: ${rec.emailSubject}`,
        vietQrUrl: rec.vietQrUrl,
        lastUpdated: new Date().toISOString(),
        notes: ['Tự động phát hiện từ Subscription Scanner'],
      };
      flywheelDealsStore.push(newDeal);
      newCreated += 1;
    }
  }

  // Auto-generate proposals for deals in 'contacted' stage
  for (const deal of flywheelDealsStore) {
    if (deal.stage === 'contacted' && !deal.proposalSummary) {
      deal.proposalSummary = `Đề xuất hợp đồng gói ${deal.currentPlan === 'starter' ? 'Pro' : 'Enterprise'} tối ưu chi phí 25%.`;
      deal.stage = 'proposal_sent';
      deal.notes.push('AI Sales Agent tự sinh báo giá và tạo link VietQR');
      proposalsCount += 1;
    }
  }

  publishSystemEvent({
    eventType: 'sales.flywheel_cycle_executed',
    source: 'RevenueFlywheelEngine',
    department: 'sales',
    payload: {
      newDealsCreated: newCreated,
      proposalsGenerated: proposalsCount,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    newDealsCreated: newCreated,
    proposalsGenerated: proposalsCount,
    totalProjectedExpansionVnd: flywheelDealsStore.reduce((acc, d) => acc + d.expansionMrrDeltaVnd, 0),
  };
}

/**
 * Chuyển trạng thái giai đoạn của Deal trên Kanban
 */
export function advanceFlywheelDeal(
  dealId: string,
  targetStage: FlywheelStage,
  notes?: string
): { success: boolean; deal?: FlywheelDeal } {
  const deal = flywheelDealsStore.find((d) => d.id === dealId);
  if (!deal) {
    return { success: false };
  }

  deal.stage = targetStage;
  deal.lastUpdated = new Date().toISOString();
  if (notes) {
    deal.notes.push(notes);
  }

  if (targetStage === 'converted_upsold') {
    deal.churnRiskScore = 0;
    publishSystemEvent({
      eventType: 'sales.deal_converted',
      source: 'RevenueFlywheelEngine',
      department: 'sales',
      payload: {
        customerId: deal.customerId,
        expansionMrr: deal.expansionMrrDeltaVnd,
        customerName: deal.customerName,
      },
    });
  }

  return { success: true, deal };
}

export function toggleFlywheelAutopilot(enabled: boolean): boolean {
  autopilotEnabled = enabled;
  return autopilotEnabled;
}
