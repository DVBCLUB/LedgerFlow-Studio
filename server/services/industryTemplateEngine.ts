/**
 * industryTemplateEngine.ts
 * ============================================================
 * Flexible Industry Template Engine for LedgerFlow Studio (Company OS).
 *
 * Provides specialized chart-of-accounts mappings, voucher defaults,
 * and cost allocation routines for different product/business lines:
 *  1. SaaS & Software Product Studio (Default Primary Template)
 *  2. Trading & E-Commerce
 *  3. Manufacturing (BOM Material Allocation)
 *  4. Services & Consulting
 *  5. Construction & Engineering (Optional Template Pack)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type IndustryTemplateId = 'saas_software' | 'trading_ecommerce' | 'manufacturing' | 'services' | 'construction';

export interface AccountMapping {
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description: string;
}

export interface IndustryTemplateConfig {
  id: IndustryTemplateId;
  name: string;
  description: string;
  isDefault: boolean;
  primaryAccounts: AccountMapping[];
  defaultVoucherTypes: string[];
  keyMetrics: string[];
}

export interface BOMItem {
  itemId: string;
  itemName: string;
  quantityRequired: number;
  unitCostVnd: number;
}

export interface BOMCostResult {
  totalMaterialCostVnd: number;
  breakdown: Array<BOMItem & { subtotalVnd: number }>;
}

// ─── Template Registry ────────────────────────────────────────────────────────

const INDUSTRY_TEMPLATES: Record<IndustryTemplateId, IndustryTemplateConfig> = {
  saas_software: {
    id: 'saas_software',
    name: 'SaaS & Software Product Studio (Mặc định)',
    description: 'Dành cho công ty phần mềm, ứng dụng AI, game và sản phẩm công nghệ số.',
    isDefault: true,
    primaryAccounts: [
      { code: '5111', name: 'Doanh thu Đăng ký Thuê bao (MRR/ARR)', category: 'Revenue', description: 'Doanh thu từ SaaS & ứng dụng số' },
      { code: '6422', name: 'Chi phí Cloud, R&D & Máy chủ AI', category: 'Expense', description: 'Chi phí API, AWS, Vercel, LLM Token' },
      { code: '131', name: 'Phải thu Khách hàng Doanh nghiệp/SaaS', category: 'Asset', description: 'Công nợ dịch vụ phần mềm' },
      { code: '1121', name: 'Tiền gửi Ngân hàng Doanh nghiệp', category: 'Asset', description: 'Tài khoản thanh toán tự động' },
    ],
    defaultVoucherTypes: ['Hóa đơn SaaS', 'Phiếu chi Cloud API', 'Báo có Ngân hàng'],
    keyMetrics: ['MRR (Monthly Recurring Revenue)', 'ARR', 'ARPU', 'Churn Rate', 'LTV'],
  },
  trading_ecommerce: {
    id: 'trading_ecommerce',
    name: 'Thương mại & E-Commerce',
    description: 'Dành cho doanh nghiệp bán lẻ, xuất nhập khẩu, kênh bán hàng đa nền tảng.',
    isDefault: false,
    primaryAccounts: [
      { code: '156', name: 'Hàng hóa Bất động / Kho', category: 'Asset', description: 'Tồn kho hàng hóa sẵn sàng bán' },
      { code: '331', name: 'Phải trả Nhà cung cấp / Nhà xưởng', category: 'Liability', description: 'Công nợ mua hàng đầu vào' },
      { code: '5111', name: 'Doanh thu Bán lẻ & Shopee/TikTok', category: 'Revenue', description: 'Doanh thu đơn hàng e-commerce' },
      { code: '632', name: 'Giá vốn Hàng bán (COGS)', category: 'Expense', description: 'Giá gốc hàng hóa xuất kho' },
    ],
    defaultVoucherTypes: ['Phiếu Nhập kho', 'Phiếu Xuất kho', 'Hóa đơn Mua hàng', 'Hóa đơn Bán hàng'],
    keyMetrics: ['Vòng quay Tồn kho (Inventory Turnover)', 'Biên Lợi nhuận Gộp (Gross Margin)', 'Công nợ Phải trả'],
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Sản xuất & Gia công (BOM Engine)',
    description: 'Dành cho nhà máy sản xuất, xưởng lắp ráp và chế tạo linh kiện.',
    isDefault: false,
    primaryAccounts: [
      { code: '152', name: 'Nguyên vật liệu Chính/Phụ', category: 'Asset', description: 'Vật tư đầu vào sản xuất' },
      { code: '154', name: 'Chi phí Sản xuất Dở dang', category: 'Asset', description: 'Chi phí nhân công, điện nước xưởng sản xuất' },
      { code: '155', name: 'Thành phẩm Nhập kho', category: 'Asset', description: 'Sản phẩm hoàn thiện' },
      { code: '621', name: 'Chi phí Nguyên vật liệu Trực tiếp', category: 'Expense', description: 'Vật tư tiêu hao theo định mức BOM' },
    ],
    defaultVoucherTypes: ['Lệnh Sản xuất', 'Phiếu Xuất NVL theo BOM', 'Phiếu Nhập Thành phẩm'],
    keyMetrics: ['Định mức Vật tư BOM', 'Tỷ lệ Hao hụt', 'Hiệu suất Xưởng (OEE)'],
  },
  services: {
    id: 'services',
    name: 'Cung cấp Dịch vụ & Tư vấn',
    description: 'Dành cho công ty agency, tư vấn luật/tài chính, thiết kế, triển khai giải pháp.',
    isDefault: false,
    primaryAccounts: [
      { code: '5113', name: 'Doanh thu Cung cấp Dịch vụ', category: 'Revenue', description: 'Doanh thu hợp đồng dịch vụ' },
      { code: '154', name: 'Chi phí Hợp đồng Dịch vụ Dở dang', category: 'Asset', description: 'Chi phí chuyên gia & nhân sự thực hiện dự án' },
      { code: '131', name: 'Phải thu Khách hàng Dịch vụ', category: 'Asset', description: 'Tiến độ thanh toán hợp đồng' },
    ],
    defaultVoucherTypes: ['Biên bản Bàn giao Dịch vụ', 'Hóa đơn Dịch vụ', 'Nghiệm thu Hợp đồng'],
    keyMetrics: ['Billable Hours Utilization', 'Lợi nhuận theo Hợp đồng', 'Công nợ Dịch vụ'],
  },
  construction: {
    id: 'construction',
    name: 'Dự án Công trình (Gói Mẫu Phụ)',
    description: 'Dành cho dự án hạ tầng, xây lắp và công trình thi công.',
    isDefault: false,
    primaryAccounts: [
      { code: '154', name: 'Chi phí Thi công Công trình Dở dang', category: 'Asset', description: 'Chi phí vật tư, máy thi công, thầu phụ' },
      { code: '331', name: 'Phải trả Nhà thầu phụ / Đội thi công', category: 'Liability', description: 'Công nợ nhà thầu phụ' },
      { code: '131', name: 'Phải thu Theo Nghiệm thu Đợt', category: 'Asset', description: 'Công nợ khối lượng nghiệm thu' },
    ],
    defaultVoucherTypes: ['Biên bản Nghiệm thu Khối lượng', 'Hóa đơn Thi công', 'Phê duyệt Thầu phụ'],
    keyMetrics: ['Tiến độ Giải ngân', 'Ngân sách so với Thực tế (Budget vs Actual)', 'Khối lượng Dở dang (WIP)'],
  },
};

// ─── Core API ─────────────────────────────────────────────────────────────────

export function listIndustryTemplates(): IndustryTemplateConfig[] {
  return Object.values(INDUSTRY_TEMPLATES);
}

export function getIndustryTemplate(id: IndustryTemplateId): IndustryTemplateConfig | null {
  return INDUSTRY_TEMPLATES[id] || null;
}

/**
 * Calculates Bill of Materials (BOM) cost breakdown for Manufacturing template.
 */
export function calculateBOMCost(bomItems: BOMItem[]): BOMCostResult {
  let totalMaterialCostVnd = 0;
  const breakdown = bomItems.map((item) => {
    const subtotalVnd = Math.round(item.quantityRequired * item.unitCostVnd);
    totalMaterialCostVnd += subtotalVnd;
    return {
      ...item,
      subtotalVnd,
    };
  });

  return {
    totalMaterialCostVnd,
    breakdown,
  };
}

/**
 * Calculates Progress Billing percentage and amount for Project templates.
 */
export function calculateProgressBilling(
  totalContractValueVnd: number,
  completedPercent: number
): { billedAmountVnd: number; remainingAmountVnd: number; progressPercent: number } {
  const validPercent = Math.max(0, Math.min(100, completedPercent));
  const billedAmountVnd = Math.round((totalContractValueVnd * validPercent) / 100);
  const remainingAmountVnd = totalContractValueVnd - billedAmountVnd;

  return {
    billedAmountVnd,
    remainingAmountVnd,
    progressPercent: validPercent,
  };
}
