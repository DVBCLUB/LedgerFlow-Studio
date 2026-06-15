import { describe, expect, it } from 'vitest';
import {
  calculateBudgetRisk,
  calculateFounderSimulation,
  calculateProductIdeaScore,
} from './accountingVietnamCalculations';

describe('accountingVietnamCalculations', () => {
  it('calculates budget usage and advance settlement ratios', () => {
    const result = calculateBudgetRisk({
      budget: 100_000_000,
      actual: 50_000_000,
      advance: 20_000_000,
      settled: 12_000_000,
    });

    expect(result.budgetUsed).toBe(50);
    expect(result.advanceLeft).toBe(8_000_000);
    expect(result.advanceSettled).toBe(60);
  });

  it('caps budget risk score at 100', () => {
    const result = calculateBudgetRisk({
      budget: 100_000_000,
      actual: 250_000_000,
      advance: 30_000_000,
      settled: 0,
    });

    expect(result.riskScore).toBe(100);
  });

  it('returns GO when founder simulation has strong score and profit', () => {
    const result = calculateFounderSimulation({
      revenue: 100_000_000,
      cost: 30_000_000,
      opsCost: 20_000_000,
      pain: 10,
      buyer: 9,
      mvpCheap: 9,
      distribution: 8,
      techRisk: 2,
    });

    expect(result.grossMargin).toBe(70);
    expect(result.netProfit).toBe(50_000_000);
    expect(result.verdict).toContain('GO');
  });

  it('returns NO-GO for weak product idea economics', () => {
    const result = calculateFounderSimulation({
      revenue: 10_000_000,
      cost: 8_000_000,
      opsCost: 5_000_000,
      pain: 3,
      buyer: 3,
      mvpCheap: 2,
      distribution: 2,
      techRisk: 8,
    });

    expect(result.netProfit).toBeLessThan(0);
    expect(result.verdict).toContain('NO-GO');
  });

  it('calculates product idea score from weighted factors', () => {
    expect(calculateProductIdeaScore({
      pain: 8,
      mvpCheapness: 7,
      distribution: 6,
      technicalRisk: 4,
    })).toBe(41);
  });
});
