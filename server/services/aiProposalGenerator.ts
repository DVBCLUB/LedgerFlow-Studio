/**
 * aiProposalGenerator.ts
 * ============================================================
 * AI-Powered Sales Proposal & Quote Generator for LedgerFlow OS.
 *
 * Tự động sinh báo giá PDF từ deal data trong CRM:
 *  - Phân tích nhu cầu khách hàng → đề xuất gói phù hợp
 *  - Sinh nội dung báo giá bằng tiếng Việt (markdown → PDF-ready)
 *  - Tính giá tự động theo discount tier
 *  - Tạo VietQR payment link
 *  - Ghi lại vào audit log
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
export type DiscountTier = 'standard' | 'partner' | 'enterprise' | 'startup';

export interface ProposalLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPriceVnd: number;
  discountPercent: number;
  vatPercent: number;
  totalVnd: number;
  vatAmountVnd: number;
}

export interface SalesProposal {
  id: string;
  dealId: string;
  customerName: string;
  customerEmail: string;
  customerTaxCode?: string;
  customerAddress?: string;
  contactPerson?: string;
  proposalTitle: string;
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  lineItems: ProposalLineItem[];
  subtotalVnd: number;
  totalVatVnd: number;
  grandTotalVnd: number;
  discountTier: DiscountTier;
  overallDiscountPercent: number;
  validUntil: string;
  paymentTermsDays: number;
  vietqrLink?: string;
  markdownContent: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  pdfReadyMarkdown: string;
}

export interface GenerateProposalInput {
  dealId: string;
  customerName: string;
  customerEmail: string;
  customerTaxCode?: string;
  customerAddress?: string;
  contactPerson?: string;
  dealAmount?: number;
  productInterest?: string;
  notes?: string;
  discountTier?: DiscountTier;
  validDays?: number;
}

export interface ProposalListResult {
  proposals: SalesProposal[];
  total: number;
  sentCount: number;
  acceptedCount: number;
  totalValueVnd: number;
}

// ─── Pricing Catalog ──────────────────────────────────────────────────────────

const PRODUCT_CATALOG = [
  {
    id: 'ledgerflow_starter',
    name: 'LedgerFlow Starter',
    description: 'Gói kế toán cơ bản cho doanh nghiệp nhỏ — Thông tư 200/133, VietQR, e-Invoice TT78',
    baseMonthlyVnd: 2_500_000,
    setupFeeVnd: 5_000_000,
    vatPercent: 10,
  },
  {
    id: 'ledgerflow_professional',
    name: 'LedgerFlow Professional',
    description: 'Kế toán + CRM + AI Staff 5 roles — phù hợp doanh nghiệp vừa',
    baseMonthlyVnd: 8_000_000,
    setupFeeVnd: 10_000_000,
    vatPercent: 10,
  },
  {
    id: 'ledgerflow_enterprise',
    name: 'LedgerFlow Enterprise AI-Native',
    description: 'Toàn bộ Company OS — 25 AI Staff, Digital Factory, Autonomous ERP, Multi-Entity',
    baseMonthlyVnd: 25_000_000,
    setupFeeVnd: 30_000_000,
    vatPercent: 10,
  },
  {
    id: 'implementation_service',
    name: 'Dịch vụ Triển khai & Đào tạo',
    description: 'Tư vấn cài đặt, tùy chỉnh, và đào tạo nhân viên (tính theo ngày công)',
    baseDailyRateVnd: 5_000_000,
    vatPercent: 10,
  },
];

const DISCOUNT_RATES: Record<DiscountTier, number> = {
  standard: 0,
  startup: 20,
  partner: 15,
  enterprise: 10,
};

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const proposals: SalesProposal[] = [];

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generates a professional Vietnamese sales proposal from deal data.
 */
export async function generateSalesProposal(input: GenerateProposalInput): Promise<SalesProposal> {
  const {
    dealId, customerName, customerEmail, customerTaxCode, customerAddress,
    contactPerson, dealAmount = 0, productInterest = 'LedgerFlow Enterprise', notes = '',
    discountTier = 'standard', validDays = 30,
  } = input;

  const discount = DISCOUNT_RATES[discountTier];

  // Auto-select products based on deal amount and interest
  const selectedProduct = dealAmount >= 100_000_000
    ? PRODUCT_CATALOG[2]  // Enterprise
    : dealAmount >= 30_000_000
    ? PRODUCT_CATALOG[1]  // Professional
    : PRODUCT_CATALOG[0]; // Starter

  const contractMonths = 12;
  const baseTotal = (selectedProduct.baseMonthlyVnd ?? 0) * contractMonths;
  const afterDiscount = Math.round(baseTotal * (1 - discount / 100));
  const vatAmount = Math.round(afterDiscount * selectedProduct.vatPercent / 100);
  const setupFee = selectedProduct.setupFeeVnd || 0;

  const lineItems: ProposalLineItem[] = [
    {
      id: `li_${randomUUID().slice(0, 6)}`,
      name: `${selectedProduct.name} — Bản quyền 12 tháng`,
      description: selectedProduct.description,
      quantity: contractMonths,
      unitPriceVnd: selectedProduct.baseMonthlyVnd ?? 0,
      discountPercent: discount,
      vatPercent: selectedProduct.vatPercent,
      totalVnd: afterDiscount,
      vatAmountVnd: vatAmount,
    },
  ];

  if (setupFee > 0) {
    const setupAfterDiscount = Math.round(setupFee * (1 - discount / 100));
    const setupVat = Math.round(setupAfterDiscount * 0.1);
    lineItems.push({
      id: `li_${randomUUID().slice(0, 6)}`,
      name: 'Phí Triển khai & Đào tạo',
      description: 'Cài đặt, cấu hình hệ thống và đào tạo nhân viên sử dụng',
      quantity: 1,
      unitPriceVnd: setupFee,
      discountPercent: discount,
      vatPercent: 10,
      totalVnd: setupAfterDiscount,
      vatAmountVnd: setupVat,
    });
  }

  const subtotalVnd = lineItems.reduce((sum, li) => sum + li.totalVnd, 0);
  const totalVatVnd = lineItems.reduce((sum, li) => sum + li.vatAmountVnd, 0);
  const grandTotalVnd = subtotalVnd + totalVatVnd;

  const validUntil = new Date(Date.now() + validDays * 86400_000).toISOString().split('T')[0];
  const vietqrLink = `https://img.vietqr.io/image/VCB-1234567890-compact2.png?amount=${grandTotalVnd}&addInfo=BG_${dealId.slice(-6).toUpperCase()}`;

  const markdownContent = `# BÁO GIÁ DỊCH VỤ PHẦN MỀM
## Kính gửi: ${customerName}

**Ngày:** ${new Date().toLocaleDateString('vi-VN')}  
**Mã báo giá:** BG-${dealId.slice(-8).toUpperCase()}  
**Hiệu lực đến:** ${validUntil}

---

### TÓM TẮT ĐIỀU HÀNH

LedgerFlow Studio trân trọng gửi đến **${customerName}** báo giá triển khai **${selectedProduct.name}** — giải pháp Company OS thế hệ mới, vận hành bởi AI, thiết kế đặc biệt cho doanh nghiệp Việt Nam muốn:

- ✅ Kế toán tự động theo Thông tư 200/133 & VAS
- ✅ Hóa đơn điện tử TT78 (MISA/VNPT/Viettel)
- ✅ 25 AI Staff vận hành 24/7 thay thế nhân lực thủ công
- ✅ Tự động hóa Sales, Marketing, Finance, Delivery

### VẤN ĐỀ DOANH NGHIỆP ĐANG GẶP PHẢI

${notes || `Doanh nghiệp đang phải đối mặt với chi phí nhân sự cao, quy trình thủ công tốn thời gian và thiếu khả năng phân tích dữ liệu real-time để ra quyết định kinh doanh nhanh chóng.`}

### GIẢI PHÁP ĐỀ XUẤT

${selectedProduct.description}

Với LedgerFlow, **${customerName}** sẽ có một hệ thống tự vận hành: sáng sớm AI CFO báo cáo tài chính, AI Sales theo dõi pipeline, AI Accountant đăng bút toán tự động và xuất hóa đơn điện tử mà không cần nhân lực thủ công.

---

### CHI TIẾT BÁO GIÁ

| STT | Dịch vụ | SL | Đơn giá (VND) | CK | Thành tiền (VND) |
|-----|---------|----|--------------|----|-----------------|
${lineItems.map((li, i) => `| ${i + 1} | ${li.name} | ${li.quantity} | ${li.unitPriceVnd.toLocaleString('vi-VN')} | ${li.discountPercent}% | ${li.totalVnd.toLocaleString('vi-VN')} |`).join('\n')}

**Tạm tính:** ${subtotalVnd.toLocaleString('vi-VN')} VND  
**Thuế VAT (10%):** ${totalVatVnd.toLocaleString('vi-VN')} VND  
**TỔNG CỘNG:** **${grandTotalVnd.toLocaleString('vi-VN')} VND**

---

### ĐIỀU KHOẢN THANH TOÁN

- **Thanh toán:** Chuyển khoản ngân hàng hoặc quét VietQR
- **Thời hạn:** Thanh toán trong ${30} ngày kể từ ngày ký hợp đồng
- **Bảo hành:** 12 tháng hỗ trợ kỹ thuật miễn phí

### THÔNG TIN CHUYỂN KHOẢN

- **Ngân hàng:** Vietcombank
- **Số TK:** 1234567890
- **Chủ TK:** CÔNG TY TNHH LEDGERFLOW STUDIO
- **Nội dung:** BG_${dealId.slice(-6).toUpperCase()} - ${customerName}

---

*Báo giá có hiệu lực đến ngày ${validUntil}. Liên hệ: sales@ledgerflow.vn | 0901 234 567*`;

  const proposal: SalesProposal = {
    id: `prop_${randomUUID().slice(0, 8)}`,
    dealId,
    customerName,
    customerEmail,
    customerTaxCode,
    customerAddress,
    contactPerson,
    proposalTitle: `Báo giá ${selectedProduct.name} — ${customerName}`,
    executiveSummary: `Đề xuất triển khai ${selectedProduct.name} cho ${customerName}`,
    problemStatement: notes || 'Tối ưu hóa quy trình vận hành bằng AI',
    proposedSolution: selectedProduct.description,
    lineItems,
    subtotalVnd,
    totalVatVnd,
    grandTotalVnd,
    discountTier,
    overallDiscountPercent: discount,
    validUntil,
    paymentTermsDays: 30,
    vietqrLink,
    markdownContent,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pdfReadyMarkdown: markdownContent,
  };

  proposals.unshift(proposal);

  await publishSystemEvent(
    'sales.proposal_sent',
    'ai-proposal-generator',
    `Báo giá ${grandTotalVnd.toLocaleString('vi-VN')} VND cho ${customerName}`,
    { proposalId: proposal.id, dealId, grandTotalVnd, customerName }
  ).catch(() => undefined);

  await appendAuditEvent({
    actor: 'ai-proposal-generator',
    workspace: 'Sales-CRM',
    action: 'proposal.generated',
    target: proposal.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Báo giá tự động: ${customerName} — ${grandTotalVnd.toLocaleString('vi-VN')} VND`,
    evidence: { proposalId: proposal.id, dealId, grandTotalVnd },
  }).catch(() => undefined);

  return proposal;
}

/**
 * Returns all proposals.
 */
export function listProposals(): ProposalListResult {
  return {
    proposals: [...proposals],
    total: proposals.length,
    sentCount: proposals.filter(p => p.status === 'sent' || p.status === 'viewed').length,
    acceptedCount: proposals.filter(p => p.status === 'accepted').length,
    totalValueVnd: proposals.reduce((sum, p) => sum + p.grandTotalVnd, 0),
  };
}

/**
 * Gets a proposal by ID.
 */
export function getProposalById(id: string): SalesProposal | null {
  return proposals.find(p => p.id === id) || null;
}

/**
 * Updates proposal status (e.g., after sending, after customer response).
 */
export async function updateProposalStatus(id: string, status: ProposalStatus): Promise<boolean> {
  const p = proposals.find(p => p.id === id);
  if (!p) return false;
  p.status = status;
  p.updatedAt = new Date().toISOString();
  if (status === 'sent') p.sentAt = new Date().toISOString();

  if (status === 'accepted') {
    await publishSystemEvent(
      'sales.deal_closed',
      'ai-proposal-generator',
      `Khách hàng ${p.customerName} chấp nhận báo giá ${p.grandTotalVnd.toLocaleString('vi-VN')} VND`,
      { proposalId: p.id, dealId: p.dealId, customerName: p.customerName, amountVnd: p.grandTotalVnd }
    ).catch(() => undefined);
  }

  return true;
}

/**
 * Returns proposal product catalog.
 */
export function getProductCatalog() {
  return PRODUCT_CATALOG;
}
