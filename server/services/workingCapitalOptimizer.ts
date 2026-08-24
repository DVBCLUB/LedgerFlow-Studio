/**
 * server/services/workingCapitalOptimizer.ts
 * ============================================================
 * Automated Working Capital Optimization (REAL engine).
 *
 * Tối thiểu hóa Chu kỳ chuyển đổi tiền mặt (Cash Conversion Cycle):
 *   CCC = DIO + DSO - DPO
 * với chi phí rủi ro nhà cung cấp khi kéo giãn DPO quá mức an toàn.
 * Dùng Nelder-Mead (gradient-free) — bài toán nhỏ, deterministic, testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkingCapitalState {
  dioDays: number;       // Days Inventory Outstanding (hiện tại)
  dsoDays: number;       // Days Sales Outstanding (hiện tại)
  dpoDays: number;       // Days Payables Outstanding (hiện tại)
  inventoryVnd: number;
  receivablesVnd: number;
  payablesVnd: number;
  dailyBurnVnd: number;  // chi phí hoạt động mỗi ngày
}

export interface WorkingCapitalBounds {
  dioMinDays: number;    // sàn tồn kho (không thể cạn về 0)
  dsoMinDays: number;    // sàn công nợ phải thu
  dpoMaxDays: number;    // trần công nợ phải trả (rủi ro nhà cung cấp)
  dpoSafeDays: number;   // ngưỡng an toàn để tính phạt kéo giãn
  supplierRiskWeight: number; // trọng số phạt bậc hai khi DPO vượt ngưỡng
}

export interface WorkingCapitalPlan {
  cccDays: number;                    // trước
  optimizedCccDays: number;           // sau
  recommended: { dioDays: number; dsoDays: number; dpoDays: number };
  freedCashVnd: number;               // (ccc - optimizedCcc) * dailyBurn
  supplierRiskPenalty: number;
}

export const DEFAULT_BOUNDS: WorkingCapitalBounds = {
  dioMinDays: 5,
  dsoMinDays: 10,
  dpoMaxDays: 60,
  dpoSafeDays: 30,
  supplierRiskWeight: 0.02,
};

export function cashConversionCycle(dioDays: number, dsoDays: number, dpoDays: number): number {
  return dioDays + dsoDays - dpoDays;
}

// ─── Nelder-Mead (deterministic) ──────────────────────────────────────────────

function objective(
  v: number[],
  state: WorkingCapitalState,
  bounds: WorkingCapitalBounds,
): number {
  const [dio, dso, dpo] = v;
  const ccc = cashConversionCycle(dio, dso, dpo);
  const stretch = Math.max(0, dpo - bounds.dpoSafeDays);
  return ccc + bounds.supplierRiskWeight * stretch * stretch;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function nelderMead(
  start: number[],
  lo: number[],
  hi: number[],
  obj: (v: number[]) => number,
  maxIter = 200,
): number[] {
  const dim = start.length;
  const alpha = 1.0;
  const gamma = 2.0;
  const rho = 0.5;
  const sigma = 0.5;

  let simplex: number[][] = [start.slice()];
  for (let i = 0; i < dim; i += 1) {
    const p = start.slice();
    p[i] = clamp(p[i] + 1, lo[i], hi[i]);
    simplex.push(p);
  }

  const project = (v: number[]) => v.map((x, i) => clamp(x, lo[i], hi[i]));

  for (let iter = 0; iter < maxIter; iter += 1) {
    simplex = simplex.map(project);
    simplex.sort((a, b) => obj(a) - obj(b));

    const best = simplex[0];
    const worst = simplex[simplex.length - 1];
    const secondWorst = simplex[simplex.length - 2];

    const centroid = new Array(dim).fill(0);
    for (let i = 0; i < simplex.length - 1; i += 1) {
      for (let d = 0; d < dim; d += 1) centroid[d] += simplex[i][d];
    }
    for (let d = 0; d < dim; d += 1) centroid[d] /= simplex.length - 1;

    // Reflection
    const reflected = centroid.map((c, d) => clamp(c + alpha * (c - worst[d]), lo[d], hi[d]));
    if (obj(reflected) < obj(secondWorst) && obj(reflected) >= obj(best)) {
      simplex[simplex.length - 1] = reflected;
      continue;
    }

    // Expansion
    if (obj(reflected) < obj(best)) {
      const expanded = centroid.map((c, d) => clamp(c + gamma * (reflected[d] - c), lo[d], hi[d]));
      simplex[simplex.length - 1] = obj(expanded) < obj(reflected) ? expanded : reflected;
      continue;
    }

    // Contraction
    const contracted = centroid.map((c, d) => clamp(c + rho * (worst[d] - c), lo[d], hi[d]));
    if (obj(contracted) < obj(worst)) {
      simplex[simplex.length - 1] = contracted;
      continue;
    }

    // Shrink toward best
    for (let i = 1; i < simplex.length; i += 1) {
      simplex[i] = simplex[i].map((x, d) => clamp(best[d] + sigma * (x - best[d]), lo[d], hi[d]));
    }
  }

  simplex.sort((a, b) => obj(a) - obj(b));
  return simplex[0].map((x, i) => Math.round(x));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function optimizeWorkingCapital(
  state: WorkingCapitalState,
  bounds: WorkingCapitalBounds = DEFAULT_BOUNDS,
): WorkingCapitalPlan {
  const cccDays = cashConversionCycle(state.dioDays, state.dsoDays, state.dpoDays);

  const lo = [bounds.dioMinDays, bounds.dsoMinDays, state.dpoDays];
  const hi = [state.dioDays, state.dsoDays, bounds.dpoMaxDays];
  const start = [state.dioDays, state.dsoDays, state.dpoDays];

  const obj = (v: number[]) => objective(v, state, bounds);
  const [dio, dso, dpo] = nelderMead(start, lo, hi, obj);

  const optimizedCccDays = cashConversionCycle(dio, dso, dpo);
  const freedCashVnd = Math.max(0, (cccDays - optimizedCccDays) * state.dailyBurnVnd);
  const stretch = Math.max(0, dpo - bounds.dpoSafeDays);

  return {
    cccDays,
    optimizedCccDays,
    recommended: { dioDays: dio, dsoDays: dso, dpoDays: dpo },
    freedCashVnd,
    supplierRiskPenalty: bounds.supplierRiskWeight * stretch * stretch,
  };
}
