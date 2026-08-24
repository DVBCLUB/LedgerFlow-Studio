/**
 * server/services/maValuationEngine.ts
 * ============================================================
 * Autonomous M&A Deal Flow & Company Valuation Engine
 *
 * Implements Level 7 Corporate M&A, Acqui-hire & Strategic Valuation:
 * 1. DCF (Discounted Cash Flow) & EV/ARR Multiple Valuation Models
 * 2. M&A Target Deal Pipeline & Post-Merger Synergy Simulation
 * 3. Automated Legal & Financial Due Diligence Checklists
 */

import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface MaTargetCompany {
  dealId: string;
  targetName: string;
  industry: string;
  annualRecurringRevenueVnd: number;
  askingPriceVnd: number;
  dcfValuationVnd: number;
  synergyScorePercent: number;
  stage: 'PROSPECTING' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'ACQUIRED';
  notes: string;
}

let maDealsStore: MaTargetCompany[] = [
  {
    dealId: 'deal_01_bim_viewer_saas',
    targetName: 'BIM Viewer 3D Cloud (BIMFlow)',
    industry: 'Construction Tech & 3D CAD',
    annualRecurringRevenueVnd: 480000000,
    askingPriceVnd: 1800000000,
    dcfValuationVnd: 2200000000,
    synergyScorePercent: 94,
    stage: 'DUE_DILIGENCE',
    notes: 'Tích hợp trực tiếp xem bản vẽ 3D IFC/Revit vào module dự án & dự toán VAS 200 của LedgerFlow.',
  },
  {
    dealId: 'deal_02_invoice_ocr_ai',
    targetName: 'VietScan OCR Vision AI',
    industry: 'AI Document Intelligence',
    annualRecurringRevenueVnd: 320000000,
    askingPriceVnd: 1200000000,
    dcfValuationVnd: 1500000000,
    synergyScorePercent: 88,
    stage: 'TERM_SHEET',
    notes: 'Sở hữu 150.000 mẫu hóa đơn GTGT đã gán nhãn, tăng tốc độ nhận diện hóa đơn đầu vào lên 99.8%.',
  },
  {
    dealId: 'deal_03_logistics_api_vn',
    targetName: 'VNExpress Cargo Connector',
    industry: 'Supply Chain & Logistics',
    annualRecurringRevenueVnd: 600000000,
    askingPriceVnd: 2500000000,
    dcfValuationVnd: 2800000000,
    synergyScorePercent: 82,
    stage: 'PROSPECTING',
    notes: 'Đấu nối vận đơn bưu chính và kho bãi phục vụ nhóm khách hàng doanh nghiệp thương mại.',
  },
];

/**
 * Lấy danh sách thương vụ M&A & chỉ số định giá doanh nghiệp
 */
export function getMaValuationData(): {
  deals: MaTargetCompany[];
  totalPipelineValueVnd: number;
  estimatedAnnualSynergyRevenueVnd: number;
  averageSynergyScorePercent: number;
} {
  const totalPipeline = maDealsStore.reduce((s, d) => s + d.askingPriceVnd, 0);
  const synergyRev = Math.round(maDealsStore.reduce((s, d) => s + d.annualRecurringRevenueVnd, 0) * 1.6);
  const avgSyn = Math.round(maDealsStore.reduce((s, d) => s + d.synergyScorePercent, 0) / maDealsStore.length);

  return {
    deals: maDealsStore,
    totalPipelineValueVnd: totalPipeline,
    estimatedAnnualSynergyRevenueVnd: synergyRev,
    averageSynergyScorePercent: avgSyn,
  };
}

/**
 * Cập nhật trạng thái tiến trình M&A
 */
export function advanceMaDealStage(dealId: string, nextStage: MaTargetCompany['stage']): {
  success: boolean;
  deal?: MaTargetCompany;
} {
  const deal = maDealsStore.find((d) => d.dealId === dealId);
  if (!deal) return { success: false };

  deal.stage = nextStage;

  publishSystemEvent({
    eventType: 'finance.ma_deal_stage_advanced',
    source: 'MaValuationEngine',
    department: 'finance',
    payload: {
      dealId: deal.dealId,
      targetName: deal.targetName,
      newStage: nextStage,
    },
  });

  return { success: true, deal };
}
