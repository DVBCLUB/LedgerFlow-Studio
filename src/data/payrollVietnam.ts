// src/data/payrollVietnam.ts
// Payroll helpers for Vietnam salary, PIT and social insurance calculations.

import { calculatePIT, calculateSocialInsurance } from "./taxKnowledgeVietnam";

export type ContractType = "permanent" | "fixed_term" | "probation" | "freelance";

export interface Employee {
  id: string;
  name: string;
  taxCode?: string;
  grossSalary: number;
  allowances: number;
  taxableAllowances: number;
  dependents: number;
  contractType: ContractType;
  department: string;
  position: string;
}

export interface PayrollRecord {
  employee: Employee;
  grossSalary: number;
  allowances: number;
  taxableAllowances: number;
  totalGross: number;
  bhxh: number;
  bhyt: number;
  bhtn: number;
  totalSIDeduction: number;
  taxableIncome: number;
  pitDeductions: number;
  netTaxableIncome: number;
  pit: number;
  netSalary: number;
  employerBHXH: number;
  employerBHYT: number;
  employerBHTN: number;
  employerBHTNNLD: number;
  totalEmployerCost: number;
  journalEntries: string;
}

export function calculatePayroll(employee: Employee): PayrollRecord {
  const grossSalary = Math.max(0, Math.round(employee.grossSalary));
  const allowances = Math.max(0, Math.round(employee.allowances));
  const taxableAllowances = Math.max(0, Math.round(employee.taxableAllowances));
  const totalGross = grossSalary + allowances + taxableAllowances;
  const si = employee.contractType === "freelance"
    ? {
        employeeBHXH: 0,
        employeeBHYT: 0,
        employeeBHTN: 0,
        totalDeduction: 0,
        employerBHXH: 0,
        employerBHYT: 0,
        employerBHTN: 0,
        employerBHTNNLD: 0,
        employerCost: 0,
        baseSalary: 0,
      }
    : calculateSocialInsurance(grossSalary);

  const taxableIncome = Math.max(0, grossSalary + taxableAllowances - si.totalDeduction);
  const pit = calculatePIT(taxableIncome + 11_000_000 + Math.max(0, employee.dependents) * 4_400_000, employee.dependents).pitAmount;
  const netSalary = totalGross - si.totalDeduction - pit;
  const totalEmployerCost = totalGross + si.employerCost;

  const journalEntries = [
    `Nợ TK 642/641/622: ${totalGross.toLocaleString("vi-VN")} ₫ - ghi nhận chi phí lương ${employee.name}`,
    `  Có TK 334: ${totalGross.toLocaleString("vi-VN")} ₫ - phải trả người lao động`,
    si.employerCost > 0 ? `Nợ TK 642/641/622: ${si.employerCost.toLocaleString("vi-VN")} ₫ - BHXH/BHYT/BHTN phần doanh nghiệp` : "",
    si.employerCost > 0 ? `  Có TK 338: ${si.employerCost.toLocaleString("vi-VN")} ₫` : "",
    `Nợ TK 334: ${(si.totalDeduction + pit + netSalary).toLocaleString("vi-VN")} ₫ - thanh toán/khấu trừ lương`,
    `  Có TK 112/111: ${netSalary.toLocaleString("vi-VN")} ₫ - thực lãnh`,
    si.totalDeduction > 0 ? `  Có TK 338: ${si.totalDeduction.toLocaleString("vi-VN")} ₫ - BHXH/BHYT/BHTN NLĐ` : "",
    pit > 0 ? `  Có TK 3335: ${pit.toLocaleString("vi-VN")} ₫ - thuế TNCN` : "",
  ].filter(Boolean).join("\n");

  return {
    employee,
    grossSalary,
    allowances,
    taxableAllowances,
    totalGross,
    bhxh: si.employeeBHXH,
    bhyt: si.employeeBHYT,
    bhtn: si.employeeBHTN,
    totalSIDeduction: si.totalDeduction,
    taxableIncome,
    pitDeductions: 11_000_000 + Math.max(0, employee.dependents) * 4_400_000,
    netTaxableIncome: Math.max(0, taxableIncome - (11_000_000 + Math.max(0, employee.dependents) * 4_400_000)),
    pit,
    netSalary: Math.round(netSalary),
    employerBHXH: si.employerBHXH,
    employerBHYT: si.employerBHYT,
    employerBHTN: si.employerBHTN,
    employerBHTNNLD: si.employerBHTNNLD,
    totalEmployerCost: Math.round(totalEmployerCost),
    journalEntries,
  };
}

export function generatePayrollSummary(payrolls: PayrollRecord[]): string {
  const totalGross = payrolls.reduce((sum, item) => sum + item.totalGross, 0);
  const totalNet = payrolls.reduce((sum, item) => sum + item.netSalary, 0);
  const totalPIT = payrolls.reduce((sum, item) => sum + item.pit, 0);
  const totalSI = payrolls.reduce((sum, item) => sum + item.totalSIDeduction, 0);
  const totalEmployerCost = payrolls.reduce((sum, item) => sum + item.totalEmployerCost, 0);

  return [
    "BẢNG LƯƠNG TỔNG HỢP",
    `Tổng nhân viên: ${payrolls.length} người`,
    `Tổng lương gross + phụ cấp: ${totalGross.toLocaleString("vi-VN")} ₫`,
    `Tổng khấu trừ BHXH-BHYT-BHTN NLĐ: ${totalSI.toLocaleString("vi-VN")} ₫`,
    `Tổng thuế TNCN: ${totalPIT.toLocaleString("vi-VN")} ₫`,
    `Tổng thực lãnh: ${totalNet.toLocaleString("vi-VN")} ₫`,
    `Tổng chi phí NSDLĐ: ${totalEmployerCost.toLocaleString("vi-VN")} ₫`,
  ].join("\n");
}
