export const FOUNDER_DECISION_LOG_STORAGE_KEY = 'ledgerflow-founder-decision-log-v1';

export type BudgetRiskInput = {
  budget: number;
  actual: number;
  advance: number;
  settled: number;
};

export type FounderSimulationInput = {
  revenue: number;
  cost: number;
  opsCost: number;
  pain: number;
  buyer: number;
  mvpCheap: number;
  distribution: number;
  techRisk: number;
};

export type ProductIdeaScoreInput = {
  pain: number;
  mvpCheapness: number;
  distribution: number;
  technicalRisk: number;
};

export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

export function calculateBudgetRisk({ budget, actual, advance, settled }: BudgetRiskInput) {
  const budgetUsed = budget ? (actual / budget) * 100 : 0;
  const advanceLeft = advance - settled;
  const advanceSettled = advance ? (settled / advance) * 100 : 0;
  const riskScore = Math.min(100, Math.round(budgetUsed * 0.45 + (advanceLeft / Math.max(advance, 1)) * 35 + (advanceSettled < 60 ? 20 : 5)));

  return { budgetUsed, advanceLeft, advanceSettled, riskScore };
}

export function calculateFounderSimulation({ revenue, cost, opsCost, pain, buyer, mvpCheap, distribution, techRisk }: FounderSimulationInput) {
  const grossMargin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
  const netProfit = revenue - cost - opsCost;
  const productScore = Math.round(pain * 3 + buyer * 2 + mvpCheap * 2 + distribution * 1.5 - techRisk * 1.5);
  const risk = Math.min(100, Math.max(0, 100 - grossMargin + techRisk * 6 + (netProfit < 0 ? 25 : 0)));
  const verdict = productScore >= 45 && netProfit >= 0
    ? 'GO - có thể làm MVP nhỏ để kiểm chứng'
    : productScore >= 35
      ? 'HOLD - cần khảo sát thêm trước khi code'
      : 'NO-GO - chưa nên tốn công build';

  return { grossMargin, netProfit, productScore, risk, verdict };
}

export const calculateProductIdeaScore = (idea: ProductIdeaScoreInput) =>
  Math.round(idea.pain * 3 + idea.mvpCheapness * 2 + idea.distribution * 1.5 - idea.technicalRisk * 1.5);
