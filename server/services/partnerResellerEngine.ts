/**
 * server/services/partnerResellerEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 71 — Partner & Reseller Channel Automation Engine
 * Quản lý vòng đời đối tác, deal registration, MDF và chia sẻ hoa hồng.
 */

export interface PartnerChannel {
  partnerId: string;
  partnerName: string;
  tier: 'Platinum Reseller' | 'Gold Solution Partner' | 'Affiliate';
  activeDealsCount: number;
  totalRevenueGeneratedVnd: number;
  commissionPaidVnd: number;
  commissionRatePercent: number;
  mdfBudgetVnd: number;
  status: 'active' | 'review';
}

export interface PartnerProgramData {
  partners: PartnerChannel[];
  totalChannelRevenueVnd: number;
  averageDealCycleDays: number;
  pendingDealRegistrations: number;
  lastUpdated: string;
}

export function getPartnerProgramData(): PartnerProgramData {
  return {
    totalChannelRevenueVnd: 4_850_000_000,
    averageDealCycleDays: 14.2,
    pendingDealRegistrations: 4,
    partners: [
      { partnerId: 'ptn_01', partnerName: 'Base Vietnam Solution Network', tier: 'Platinum Reseller', activeDealsCount: 8, totalRevenueGeneratedVnd: 2_400_000_000, commissionPaidVnd: 600_000_000, commissionRatePercent: 25, mdfBudgetVnd: 100_000_000, status: 'active' },
      { partnerId: 'ptn_02', partnerName: 'FPT Smart Cloud Distribution', tier: 'Platinum Reseller', activeDealsCount: 5, totalRevenueGeneratedVnd: 1_850_000_000, commissionPaidVnd: 462_500_000, commissionRatePercent: 25, mdfBudgetVnd: 80_000_000, status: 'active' },
      { partnerId: 'ptn_03', partnerName: 'Kế Toán Xây Dựng 4.0 Academy', tier: 'Gold Solution Partner', activeDealsCount: 12, totalRevenueGeneratedVnd: 600_000_000, commissionPaidVnd: 120_000_000, commissionRatePercent: 20, mdfBudgetVnd: 30_000_000, status: 'active' }
    ],
    lastUpdated: new Date().toISOString()
  };
}

export function registerPartnerDeal(partnerId: string, clientName: string, dealValueVnd: number) {
  return {
    success: true,
    dealRegistrationId: 'DEAL-REG-' + Date.now().toString(36).toUpperCase(),
    partnerId,
    clientName,
    dealValueVnd,
    estimatedCommissionVnd: Math.round(dealValueVnd * 0.25),
    protectionPeriodDays: 90,
    status: 'approved_locked',
    registeredAt: new Date().toISOString()
  };
}
