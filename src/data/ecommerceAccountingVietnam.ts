// src/data/ecommerceAccountingVietnam.ts
// Marketplace accounting helpers for Shopee, TikTok Shop and Lazada Vietnam.

export type EcommercePlatformKey = "shopee" | "tiktok_shop" | "lazada";

export interface EcommercePlatformConfig {
  name: string;
  commissionRate: number;
  paymentCycleDays: number;
  settlementFloatDays: number;
  vatOnCommission: boolean;
  accountingNotes: string;
}

export const ECOMMERCE_PLATFORMS: Record<EcommercePlatformKey, EcommercePlatformConfig> = {
  shopee: {
    name: "Shopee",
    commissionRate: 0.1,
    paymentCycleDays: 15,
    settlementFloatDays: 15,
    vatOnCommission: true,
    accountingNotes: "Doanh thu ghi nhận khi đơn giao thành công. Phí sàn vào TK 641; tiền chờ đối soát vào TK 131.",
  },
  tiktok_shop: {
    name: "TikTok Shop",
    commissionRate: 0.05,
    paymentCycleDays: 15,
    settlementFloatDays: 15,
    vatOnCommission: true,
    accountingNotes: "Doanh thu ghi nhận theo đơn hoàn tất. Livestream/affiliate/khuyến mại cần tách riêng TK 641.",
  },
  lazada: {
    name: "Lazada",
    commissionRate: 0.08,
    paymentCycleDays: 14,
    settlementFloatDays: 14,
    vatOnCommission: true,
    accountingNotes: "Đối chiếu settlement report theo kỳ. Cross-border và voucher nền tảng cần review riêng.",
  },
};

export const SHOPEE_SETTLEMENT_ENTRIES = {
  sale: { description: "Doanh thu bán hàng trên Shopee", debit: "131", credit: "511", note: "Ghi nhận khi trạng thái đơn là đã giao/hoàn tất." },
  commission: { description: "Phí hoa hồng Shopee", debit: "641", credit: "131", note: "Trừ trực tiếp vào settlement." },
  vat_on_commission: { description: "VAT trên phí hoa hồng", debit: "1331", credit: "131", note: "Căn cứ hóa đơn phí dịch vụ sàn nếu đủ điều kiện khấu trừ." },
  settlement_received: { description: "Nhận tiền settlement", debit: "112", credit: "131", note: "Khi tiền về tài khoản ngân hàng." },
  return_goods: { description: "Hàng hoàn trả", debit: "521", credit: "131", note: "Hoặc điều chỉnh doanh thu theo chính sách kế toán đang áp dụng." },
} as const;

export interface SettlementCalculationInput {
  grossRevenue: number;
  platform: EcommercePlatformKey;
  returnsAmount?: number;
  shippingSubsidy?: number;
  extraPlatformFees?: number;
}

export interface SettlementCalculationResult {
  grossRevenue: number;
  platform: EcommercePlatformKey;
  platformName: string;
  commission: number;
  commissionVAT: number;
  returns: number;
  shippingSubsidy: number;
  extraPlatformFees: number;
  netSettlement: number;
  accountingEntries: string;
}

export function calculateSettlement(inputOrGrossRevenue: SettlementCalculationInput | number, platformArg?: EcommercePlatformKey, returnsAmount = 0, shippingSubsidy = 0): SettlementCalculationResult {
  const input: SettlementCalculationInput = typeof inputOrGrossRevenue === "number"
    ? { grossRevenue: inputOrGrossRevenue, platform: platformArg || "shopee", returnsAmount, shippingSubsidy }
    : inputOrGrossRevenue;

  const platform = ECOMMERCE_PLATFORMS[input.platform];
  const grossRevenue = Math.max(0, Math.round(input.grossRevenue));
  const returns = Math.max(0, Math.round(input.returnsAmount || 0));
  const subsidy = Math.max(0, Math.round(input.shippingSubsidy || 0));
  const extraFees = Math.max(0, Math.round(input.extraPlatformFees || 0));
  const commission = Math.round(grossRevenue * platform.commissionRate);
  const commissionVAT = platform.vatOnCommission ? Math.round(commission * 0.1) : 0;
  const netSettlement = grossRevenue - commission - commissionVAT - returns - extraFees + subsidy;

  return {
    grossRevenue,
    platform: input.platform,
    platformName: platform.name,
    commission,
    commissionVAT,
    returns,
    shippingSubsidy: subsidy,
    extraPlatformFees: extraFees,
    netSettlement,
    accountingEntries: [
      `Nợ TK 131: ${grossRevenue.toLocaleString("vi-VN")} ₫ - phải thu ${platform.name}`,
      `  Có TK 511: ${grossRevenue.toLocaleString("vi-VN")} ₫ - doanh thu gross`,
      `Nợ TK 641: ${commission.toLocaleString("vi-VN")} ₫ - phí hoa hồng`,
      `Nợ TK 1331: ${commissionVAT.toLocaleString("vi-VN")} ₫ - VAT phí sàn`,
      `  Có TK 131: ${(commission + commissionVAT).toLocaleString("vi-VN")} ₫`,
      returns > 0 ? `Nợ TK 521/Có TK 131: ${returns.toLocaleString("vi-VN")} ₫ - hàng hoàn/giảm trừ` : "",
      extraFees > 0 ? `Nợ TK 641/Có TK 131: ${extraFees.toLocaleString("vi-VN")} ₫ - phí sàn khác` : "",
      `Nợ TK 112: ${netSettlement.toLocaleString("vi-VN")} ₫ - tiền settlement nhận về`,
      `  Có TK 131: ${netSettlement.toLocaleString("vi-VN")} ₫`,
    ].filter(Boolean).join("\n"),
  };
}
