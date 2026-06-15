// src/data/taxKnowledgeVietnam.ts
// Vietnam tax and accounting reference data for LedgerFlow AI Accountant/Auditor.
// Keep this file deterministic: no network calls and no UI dependencies.

export const TAX_RATES_VN = {
  VAT: {
    standard: 0.1,
    reduced: 0.05,
    zero: 0,
    exempt: "MIEN",
  },
  CIT: {
    standard: 0.2,
    preferential_10: 0.1,
    preferential_15: 0.15,
    sme_reduced_reference: 0.17,
  },
  PIT: {
    brackets: [
      { from: 0, to: 5_000_000, rate: 0.05 },
      { from: 5_000_000, to: 10_000_000, rate: 0.1 },
      { from: 10_000_000, to: 18_000_000, rate: 0.15 },
      { from: 18_000_000, to: 32_000_000, rate: 0.2 },
      { from: 32_000_000, to: 52_000_000, rate: 0.25 },
      { from: 52_000_000, to: 80_000_000, rate: 0.3 },
      { from: 80_000_000, to: Number.POSITIVE_INFINITY, rate: 0.35 },
    ],
    personal_deduction: 11_000_000,
    dependent_deduction: 4_400_000,
  },
  SOCIAL_INSURANCE: {
    employee_bhxh: 0.08,
    employee_bhyt: 0.015,
    employee_bhtn: 0.01,
    employer_bhxh: 0.175,
    employer_bhyt: 0.03,
    employer_bhtn: 0.01,
    employer_bhtnnld: 0.005,
    max_salary_for_si: 36_000_000,
  },
} as const;

export const VAS_ACCOUNTS: Record<string, string> = {
  "111": "Tiền mặt",
  "112": "Tiền gửi ngân hàng",
  "131": "Phải thu khách hàng",
  "133": "Thuế GTGT được khấu trừ",
  "1331": "Thuế GTGT hàng hóa, dịch vụ",
  "1332": "Thuế GTGT tài sản cố định",
  "138": "Phải thu khác",
  "141": "Tạm ứng",
  "152": "Nguyên liệu, vật liệu",
  "153": "Công cụ, dụng cụ",
  "154": "Chi phí sản xuất, kinh doanh dở dang",
  "156": "Hàng hóa",
  "211": "Tài sản cố định hữu hình",
  "214": "Hao mòn tài sản cố định",
  "242": "Chi phí trả trước",
  "331": "Phải trả người bán",
  "333": "Thuế và các khoản phải nộp Nhà nước",
  "3331": "Thuế GTGT phải nộp",
  "3334": "Thuế TNDN",
  "3335": "Thuế TNCN",
  "334": "Phải trả người lao động",
  "338": "Phải trả, phải nộp khác",
  "411": "Vốn đầu tư của chủ sở hữu",
  "511": "Doanh thu bán hàng và cung cấp dịch vụ",
  "515": "Doanh thu hoạt động tài chính",
  "521": "Các khoản giảm trừ doanh thu",
  "632": "Giá vốn hàng bán",
  "635": "Chi phí tài chính",
  "641": "Chi phí bán hàng",
  "642": "Chi phí quản lý doanh nghiệp",
  "711": "Thu nhập khác",
  "811": "Chi phí khác",
  "911": "Xác định kết quả kinh doanh",
};

export type TaxDeclarationFrequency = "monthly" | "quarterly" | "annual" | "event";

export interface TaxDeclarationVN {
  code: string;
  name: string;
  frequency: TaxDeclarationFrequency;
  deadline: string;
  who: string;
}

export const TAX_DECLARATIONS_VN: TaxDeclarationVN[] = [
  { code: "01/GTGT", name: "Tờ khai thuế GTGT", frequency: "monthly", deadline: "Ngày 20 tháng kế tiếp nếu kê khai tháng", who: "Doanh nghiệp kê khai GTGT" },
  { code: "01/GTGT", name: "Tờ khai thuế GTGT", frequency: "quarterly", deadline: "Ngày cuối cùng tháng đầu quý sau nếu kê khai quý", who: "Doanh nghiệp kê khai GTGT theo quý" },
  { code: "05/KK-TNCN", name: "Tờ khai khấu trừ thuế TNCN", frequency: "monthly", deadline: "Ngày 20 tháng kế tiếp nếu kê khai tháng", who: "Tổ chức chi trả thu nhập" },
  { code: "05/KK-TNCN", name: "Tờ khai khấu trừ thuế TNCN", frequency: "quarterly", deadline: "Ngày cuối cùng tháng đầu quý sau nếu kê khai quý", who: "Tổ chức chi trả thu nhập theo quý" },
  { code: "03/TNDN", name: "Quyết toán thuế TNDN", frequency: "annual", deadline: "Ngày cuối cùng tháng thứ 3 sau năm tài chính", who: "Doanh nghiệp" },
  { code: "05/QTT-TNCN", name: "Quyết toán thuế TNCN", frequency: "annual", deadline: "Ngày cuối cùng tháng thứ 3 sau năm dương lịch", who: "Tổ chức chi trả thu nhập" },
];

export interface PITResult {
  taxableIncome: number;
  pitAmount: number;
  netIncome: number;
}

export function calculatePIT(grossMonthly: number, dependents = 0): PITResult {
  const gross = Math.max(0, Math.round(grossMonthly));
  const dependentCount = Math.max(0, Math.floor(dependents));
  const deductions = TAX_RATES_VN.PIT.personal_deduction + dependentCount * TAX_RATES_VN.PIT.dependent_deduction;
  const taxableIncome = Math.max(0, gross - deductions);

  let pitAmount = 0;
  for (const bracket of TAX_RATES_VN.PIT.brackets) {
    if (taxableIncome <= bracket.from) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.to) - bracket.from;
    pitAmount += taxableInBracket * bracket.rate;
  }

  const roundedPIT = Math.round(pitAmount);
  return {
    taxableIncome,
    pitAmount: roundedPIT,
    netIncome: gross - roundedPIT,
  };
}

export interface SocialInsuranceResult {
  employeeBHXH: number;
  employeeBHYT: number;
  employeeBHTN: number;
  totalDeduction: number;
  employerBHXH: number;
  employerBHYT: number;
  employerBHTN: number;
  employerBHTNNLD: number;
  employerCost: number;
  baseSalary: number;
}

export function calculateSocialInsurance(grossSalary: number): SocialInsuranceResult {
  const baseSalary = Math.min(Math.max(0, Math.round(grossSalary)), TAX_RATES_VN.SOCIAL_INSURANCE.max_salary_for_si);
  const employeeBHXH = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employee_bhxh);
  const employeeBHYT = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employee_bhyt);
  const employeeBHTN = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employee_bhtn);
  const employerBHXH = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employer_bhxh);
  const employerBHYT = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employer_bhyt);
  const employerBHTN = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employer_bhtn);
  const employerBHTNNLD = Math.round(baseSalary * TAX_RATES_VN.SOCIAL_INSURANCE.employer_bhtnnld);

  return {
    employeeBHXH,
    employeeBHYT,
    employeeBHTN,
    totalDeduction: employeeBHXH + employeeBHYT + employeeBHTN,
    employerBHXH,
    employerBHYT,
    employerBHTN,
    employerBHTNNLD,
    employerCost: employerBHXH + employerBHYT + employerBHTN + employerBHTNNLD,
    baseSalary,
  };
}
