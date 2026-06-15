import { calculatePIT } from "./taxKnowledgeVietnam";

interface PITCase {
  name: string;
  grossMonthly: number;
  dependents: number;
  expectedTaxableIncome: number;
  expectedPitAmount: number;
}

export const pitCalculationSmokeTests: PITCase[] = [
  { name: "No PIT under personal deduction", grossMonthly: 10_000_000, dependents: 0, expectedTaxableIncome: 0, expectedPitAmount: 0 },
  { name: "First bracket only", grossMonthly: 16_000_000, dependents: 0, expectedTaxableIncome: 5_000_000, expectedPitAmount: 250_000 },
  { name: "One dependent reduces taxable income", grossMonthly: 25_000_000, dependents: 1, expectedTaxableIncome: 9_600_000, expectedPitAmount: 710_000 },
];

export function runPITCalculationSmokeTests(): void {
  for (const testCase of pitCalculationSmokeTests) {
    const result = calculatePIT(testCase.grossMonthly, testCase.dependents);
    if (result.taxableIncome !== testCase.expectedTaxableIncome || result.pitAmount !== testCase.expectedPitAmount) {
      throw new Error(`${testCase.name} failed: got taxable=${result.taxableIncome}, pit=${result.pitAmount}`);
    }
  }
}
