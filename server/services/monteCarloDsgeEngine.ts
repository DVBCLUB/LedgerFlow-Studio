/**
 * server/services/monteCarloDsgeEngine.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 99 — 10-Year DSGE Monte Carlo Engine (REAL engine)
 *
 * Thay thế stub macroeconomicStressSimulatorEngine.ts bằng một mô phỏng thật:
 *   - Lõi DSGE 3 phương trình New Keynesian (IS curve, Phillips, Taylor rule).
 *   - Kỳ vọng thích nghi (adaptive/naive expectations) — xấp xỉ chuẩn dùng trong
 *     stress-test thực tế, giải thuận (forward) nên deterministic theo seed.
 *   - Chuỗi Markov 2 chế độ (bình thường / suy thoái) cho volatility & shock.
 *   - 10,000 path × 10 năm × bước quý → phân phối dòng tiền, VaR/CVaR, runway.
 */

// ─── Deterministic RNG (mulberry32) ───────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DsgeParams {
  sigma: number;  // intertemporal elasticity (inverse)
  beta: number;   // discount factor
  kappa: number;  // Phillips curve slope
  phiPi: number;  // Taylor response to inflation
  phiY: number;   // Taylor response to output gap
  rho: number;    // interest rate smoothing
  revenueQuarterlyVnd: number;
  costQuarterlyVnd: number;
  debtVnd: number;
  cashBufferVnd: number;
}

export interface DsgeRegime {
  label: string;
  probStay: number;   // xác suất giữ nguyên chế độ
  shockVar: number;   // phương sai shock (epsilon_d/s/m)
}

export interface MonteCarloConfig {
  paths: number;        // 10_000
  years: number;        // 10
  stepsPerYear: number; // 4 (quý)
  seed?: number;
}

export interface CashflowPathStats {
  p10: number;
  p50: number;
  p90: number;
  var99: number;        // -quantile(rolling4qMin, 0.01)
  cvar99: number;       // -mean(rolling4qMin <= quantile0.01)
  survivalProbability: number; // P(rolling4qMin + buffer > 0)
  runwayMonthsMedian: number;
}

export const DEFAULT_DSGE_PARAMS: DsgeParams = {
  sigma: 1.5,
  beta: 0.995,
  kappa: 0.1,
  phiPi: 1.5,
  phiY: 0.5,
  rho: 0.8,
  revenueQuarterlyVnd: 5_000_000_000,
  costQuarterlyVnd: 3_500_000_000,
  debtVnd: 10_000_000_000,
  cashBufferVnd: 2_000_000_000,
};

export const DEFAULT_REGIMES: DsgeRegime[] = [
  { label: 'normal', probStay: 0.92, shockVar: 0.0004 },
  { label: 'recession', probStay: 0.80, shockVar: 0.0036 },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Giải thuận DSGE 3 phương trình với kỳ vọng thích nghi (naive):
 *   i_t = rho*i_{t-1} + (1-rho)*(phiPi*pi_t + phiY*y_t) + eps_m
 *   pi_t = beta*E[pi_{t+1}] + kappa*y_t + eps_s
 *   y_t  = E[y_{t+1}] - (1/sigma)*(i_t - E[pi_{t+1}]) + eps_d
 * với E[y_{t+1}] = y_{t-1}, E[pi_{t+1}] = pi_{t-1}.
 */
export function solveDsgePath(params: DsgeParams, shocks: { d: number[]; s: number[]; m: number[] }): { y: number[]; pi: number[]; i: number[] } {
  const { sigma, beta, kappa, phiPi, phiY, rho } = params;
  const steps = shocks.d.length;
  const y = new Array<number>(steps).fill(0);
  const pi = new Array<number>(steps).fill(0);
  const i = new Array<number>(steps).fill(0);

  let iPrev = 0;
  let yPrev = 0;  // y_{t-1}
  let piPrev = 0; // pi_{t-1}

  const A = (1 - rho) * (phiPi * kappa + phiY);

  for (let t = 0; t < steps; t += 1) {
    const Ey = yPrev;   // naive expectation of y_{t+1}
    const Epi = piPrev; // naive expectation of pi_{t+1}

    const numerator =
      rho * iPrev +
      (1 - rho) * phiPi * beta * Epi +
      (1 - rho) * phiPi * shocks.s[t] +
      shocks.m[t] +
      A * Ey +
      (A / sigma) * Epi +
      A * shocks.d[t];

    const it = numerator / (1 + A / sigma);
    const yt = Ey - (1 / sigma) * (it - Epi) + shocks.d[t];
    const pit = beta * Epi + kappa * yt + shocks.s[t];

    y[t] = yt;
    pi[t] = pit;
    i[t] = it;

    iPrev = it;
    yPrev = yt;
    piPrev = pit;
  }

  return { y, pi, i };
}

export function cashflowFromPath(params: DsgeParams, macro: { y: number[]; pi: number[]; i: number[] }): number[] {
  const { revenueQuarterlyVnd, costQuarterlyVnd, debtVnd } = params;
  return macro.y.map((yt, t) => {
    const revenue = revenueQuarterlyVnd * (1 + yt);
    const cost = costQuarterlyVnd * (1 + macro.pi[t]);
    const interest = debtVnd * (Math.max(0, macro.i[t]) / 4);
    return revenue - cost - interest;
  });
}

export function rollingWindowMin(series: number[], window: number): number[] {
  const result: number[] = [];
  for (let t = 0; t + window <= series.length; t += 1) {
    let min = series[t];
    for (let k = 1; k < window; k += 1) min = Math.min(min, series[t + k]);
    result.push(min);
  }
  return result;
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil(p * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

// ─── Core engine ──────────────────────────────────────────────────────────────

export function runMonteCarloDsge(
  params: DsgeParams = DEFAULT_DSGE_PARAMS,
  cfg: Partial<MonteCarloConfig> = {},
  regimes: DsgeRegime[] = DEFAULT_REGIMES,
): { paths: number[][]; stats: CashflowPathStats } {
  const paths = Math.max(10, cfg.paths ?? 10_000);
  const years = Math.max(1, cfg.years ?? 10);
  const stepsPerYear = Math.max(1, cfg.stepsPerYear ?? 4);
  const seed = cfg.seed ?? 20260824;
  const rng = mulberry32(seed);
  const steps = years * stepsPerYear;

  const cashflowPaths: number[][] = [];
  const rollingMins: number[] = [];
  const runways: number[] = [];

  for (let p = 0; p < paths; p += 1) {
    // Markov regime sequence + shocks
    let regimeIdx = 0;
    const shocks = { d: new Array<number>(steps), s: new Array<number>(steps), m: new Array<number>(steps) };
    for (let t = 0; t < steps; t += 1) {
      if (rng() > regimes[regimeIdx].probStay) regimeIdx = regimeIdx === 0 ? 1 : 0;
      const sd = Math.sqrt(regimes[regimeIdx].shockVar);
      shocks.d[t] = gaussian(rng) * sd;
      shocks.s[t] = gaussian(rng) * sd;
      shocks.m[t] = gaussian(rng) * sd * 0.5;
    }

    const macro = solveDsgePath(params, shocks);
    const cf = cashflowFromPath(params, macro);
    cashflowPaths.push(cf);

    const worst12m = Math.min(...rollingWindowMin(cf, Math.min(4, stepsPerYear)));
    rollingMins.push(worst12m);

    // runway: months until cumulative cash (starting from buffer) goes negative
    let cash = params.cashBufferVnd;
    let runwayMonths = steps * (12 / stepsPerYear);
    for (let t = 0; t < steps; t += 1) {
      cash += cf[t];
      if (cash < 0) {
        runwayMonths = t * (12 / stepsPerYear);
        break;
      }
    }
    runways.push(runwayMonths);
  }

  const sorted = [...rollingMins].sort((a, b) => a - b);
  const q001 = percentile(sorted, 0.01);
  const tail = sorted.filter((v) => v <= q001);
  const cvar99 = tail.length ? -(tail.reduce((s, v) => s + v, 0) / tail.length) : 0;
  const survival = rollingMins.filter((v) => v + params.cashBufferVnd > 0).length / rollingMins.length;
  const runwaysSorted = [...runways].sort((a, b) => a - b);

  return {
    paths: cashflowPaths,
    stats: {
      p10: percentile(sorted, 0.10),
      p50: percentile(sorted, 0.50),
      p90: percentile(sorted, 0.90),
      var99: -q001,
      cvar99,
      survivalProbability: survival,
      runwayMonthsMedian: percentile(runwaysSorted, 0.50),
    },
  };
}
