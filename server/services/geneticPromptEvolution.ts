/**
 * server/services/geneticPromptEvolution.ts
 * ─────────────────────────────────────────────────────────────
 * Trụ Cột 91 — Autonomous Genetic Prompt Mutation Engine (REAL engine)
 *
 * Thay thế stub trả dữ liệu cứng bằng một giải thuật di truyền thật:
 *   - Biểu diễn prompt dưới dạng chuỗi token (cụm câu).
 *   - Fitness đa mục tiêu: chất lượng + chi phí + độ trễ + an toàn + novelty.
 *   - Tournament selection (k), elitism, crossover BLX-alpha, đột biến thích nghi.
 *   - Hoàn toàn thuần (pure), deterministic theo seed — chạy offline, testable.
 *
 * Không gọi LLM trong lõi GA. Chất lượng được chấm bằng heuristic từ khóa
 * (bỏ dấu tiếng Việt), tái sử dụng triết lý của aiEvalHarness nhưng không
 * kéo theo dependency nặng để giữ module này side-effect-free.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FitnessComponents {
  quality: number;   // 0..1 — keyword coverage theo vai trò
  cost: number;      // 0..1 — chuẩn hóa theo độ dài prompt
  latency: number;   // 0..1 — chuẩn hóa theo độ dài prompt
  safety: number;    // 0..1 — quét mẫu tiêm nhiễm/leak secret
  novelty: number;   // 0..1 — khoảng cách tới k-láng giềng (Jaccard)
}

export interface PromptGenome {
  id: string;
  agentRole: string;
  tokens: string[];
  fitness: number;
  generation: number;
  metrics: FitnessComponents;
}

export interface GaConfig {
  populationSize: number;      // 32
  tournamentSize: number;      // 3
  elitismRate: number;         // 0.10
  crossoverRate: number;       // 0.70
  mutationRateInit: number;    // 0.30
  mutationRateMin: number;     // 0.05
  noveltyWeight: number;       // 0.10
  complexityPenalty: number;   // 0.005
  maxGenerations: number;      // 20
  seed: number;
}

export interface PromptEvolutionResult {
  role: string;
  champion: PromptGenome;
  history: PromptGenome[];      // champion của mỗi thế hệ
  generationsRun: number;
  initialAvgFitness: number;
  finalAvgFitness: number;
  improvementPercent: number;
}

export interface PromptEvolutionSummary {
  totalGenerationsEvolved: number;
  rolesOptimized: number;
  bestFitnessByRole: Record<string, number>;
  lastEvolutionAt: string;
}

export const DEFAULT_GA_CONFIG: GaConfig = {
  populationSize: 32,
  tournamentSize: 3,
  elitismRate: 0.10,
  crossoverRate: 0.70,
  mutationRateInit: 0.30,
  mutationRateMin: 0.05,
  noveltyWeight: 0.10,
  complexityPenalty: 0.005,
  maxGenerations: 20,
  seed: 20260824,
};

// ─── Deterministic RNG (mulberry32) ───────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Text helpers (pure) ──────────────────────────────────────────────────────

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ─── Domain vocabulary (real, domain-neutral) ─────────────────────────────────

const ROLE_KEYWORDS: Record<string, string[]> = {
  finance: ['vnd', 'hoa don', 'thue', 'doi soat', 'cong no', 'bao cao', 'dong tien', 'ifrs', 'vas', 'chi phi', 'doanh thu'],
  sales: ['khach hang', 'lead', 'bao gia', 'deal', 'pipeline', 'chot', 'doanh thu', 'san pham', 'gia tri'],
  marketing: ['kenh', 'noi dung', 'chien dich', 'ctr', 'chuyen doi', 'audience', 'thong diep', 'kpi'],
  coding: ['typescript', 'ham', 'kiem thu', 'loi', 'api', 'hieu nang', 'bao mat', 'interface'],
  media: ['video', 'kich ban', 'am thanh', 'hinh anh', '9:16', 'noi dung ngan'],
  support: ['khach hang', 'ho tro', 'giai quyet', 'thoi gian', 'kenh'],
  general: ['muc tieu', 'ket qua', 'rang buoc', 'chat luong', 'rui ro'],
};

const BASE_PROMPTS: Record<string, string[]> = {
  general: ['Ban la tro ly AI chuyen nghiep.', 'Tra loi ro rang, co cau truc.', 'Neu ro rang buoc va gia dinh.'],
  finance: ['Ban la chuyen gia tai chinh.', 'Tuan thu chuan muc ke toan VAS va IFRS.', 'Kiem tra doi soat truoc khi ket luan.'],
  sales: ['Ban la chuyen vien ban hang.', 'Ca nhan hoa theo nhu cau khach hang.', 'Ghi nhan deal va theo doi pipeline.'],
  marketing: ['Ban la chuyen gia marketing.', 'Do luong hieu qua theo KPI.', 'Toi uu thong diep theo kenh.'],
  coding: ['Ban la ky su phan mem.', 'Viet ma sach, co kieu va xu ly loi.', 'Kem theo kiem thu cho moi thay doi.'],
  media: ['Ban la nha san xuat noi dung.', 'Toi uu cho video 9:16.', 'Dong nhat giong dieu thuong hieu.'],
  support: ['Ban la nhan vien ho tro khach hang.', 'Giai quyet van de nhanh va dung.', 'Ghi nhan thoi gian va kenh xu ly.'],
};

const MUTATION_BANK: string[] = [
  'Luon kiem tra du lieu dau vao truoc khi xu ly.',
  'Tra ket qua kem nguon goc va do tin cay.',
  'Xu ly ngoai le va bao loi ro rang, khong im lang.',
  'Uu tien cau tra loi ngan gon, co cau truc.',
  'Tach biet su kien khoi suy doan.',
  'Xac nhan lai yeu cau mo ho truoc khi thuc hien.',
  'Dua ra it nhat 2 phuong an khi quyet dinh rui ro cao.',
  'Ghi nhat ky moi hanh dong co anh huong tai chinh.',
];

const SAFETY_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ignore (all )?(previous|prior|above) instructions/i, label: 'injection' },
  { pattern: /\bdan\b|do anything now/i, label: 'jailbreak' },
  { pattern: /api[_ ]?key|secret|password|token\s*[:=]/i, label: 'secret_leak' },
  { pattern: /bypass|circumvent|jailbreak/i, label: 'bypass' },
];

// ─── Pure operators ───────────────────────────────────────────────────────────

export function safetyScan(text: string): number {
  const normalized = normalizeText(text);
  let matches = 0;
  for (const { pattern } of SAFETY_PATTERNS) {
    if (pattern.test(normalized)) matches += 1;
  }
  return Math.max(0, 1 - 0.25 * matches);
}

export function keywordCoverage(tokens: string[], role: string): number {
  const keywords = ROLE_KEYWORDS[role] ?? ROLE_KEYWORDS.general;
  const text = normalizeText(tokens.join(' '));
  let hits = 0;
  for (const kw of keywords) {
    if (text.includes(normalizeText(kw))) hits += 1;
  }
  const coverage = hits / keywords.length;
  return Math.max(0.1, coverage); // floor để không có genome nào 0 tuyệt đối
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function noveltyScore(genome: PromptGenome, population: PromptGenome[], k: number): number {
  const self = new Set(genome.tokens.map(normalizeText));
  const others = population.filter((g) => g.id !== genome.id);
  if (others.length === 0) return 1;
  const distances = others
    .map((g) => 1 - jaccardSimilarity(self, new Set(g.tokens.map(normalizeText))))
    .sort((x, y) => x - y);
  const nearest = distances.slice(0, Math.max(1, k));
  return nearest.reduce((s, d) => s + d, 0) / nearest.length;
}

export function composeFitness(metrics: FitnessComponents, noveltyWeight: number, complexityPenalty: number, tokenCount: number): number {
  const base =
    0.45 * metrics.quality +
    0.20 * (1 - metrics.cost) +
    0.15 * (1 - metrics.latency) +
    0.10 * metrics.safety;
  const novelty = noveltyWeight * metrics.novelty;
  const penalty = complexityPenalty * tokenCount;
  return Math.max(0, Math.min(1, base + novelty - penalty));
}

export function adaptiveMutationRate(generation: number, mu0: number, muMin: number, maxGenerations: number): number {
  const tau = Math.max(1, maxGenerations * 0.35);
  return muMin + (mu0 - muMin) * Math.exp(-generation / tau);
}

export function tournamentSelect(population: PromptGenome[], k: number, rng: () => number): PromptGenome {
  let best = population[Math.floor(rng() * population.length)];
  for (let i = 1; i < k; i += 1) {
    const candidate = population[Math.floor(rng() * population.length)];
    if (candidate.fitness > best.fitness) best = candidate;
  }
  return best;
}

export function crossoverBLX(a: string[], b: string[], alpha: number, rng: () => number): string[] {
  if (a.length === 0) return [...b];
  if (b.length === 0) return [...a];
  const d = Math.abs(a.length - b.length);
  const lo = Math.max(1, Math.min(a.length, b.length) - Math.floor(alpha * d));
  const hi = Math.max(a.length, b.length) + Math.floor(alpha * d);
  const childLen = lo + Math.floor(rng() * (hi - lo + 1));
  const child: string[] = [];
  for (let i = 0; i < childLen; i += 1) {
    const pick = rng();
    if (pick < 0.45) child.push(a[i % a.length]);
    else if (pick < 0.90) child.push(b[i % b.length]);
    else child.push(`${a[i % a.length]} ${b[i % b.length]}`.trim());
  }
  return child;
}

export function mutateTokens(tokens: string[], rate: number, bank: string[], rng: () => number): string[] {
  const out = [...tokens];
  for (let i = 0; i < out.length; i += 1) {
    if (rng() < rate) {
      const op = rng();
      if (op < 0.34) {
        out[i] = bank[Math.floor(rng() * bank.length)];
      } else if (op < 0.67) {
        out[i] = `${out[i]} — ${bank[Math.floor(rng() * bank.length)]}`;
      } else {
        out.splice(i, 1);
        i -= 1;
      }
    }
  }
  if (rng() < rate) out.push(bank[Math.floor(rng() * bank.length)]);
  if (out.length === 0) out.push(bank[Math.floor(rng() * bank.length)]);
  return out;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

function evaluateGenome(genome: PromptGenome, role: string, population: PromptGenome[], cfg: GaConfig): void {
  const tokenCount = genome.tokens.length;
  const costNorm = Math.min(1, tokenCount / 60);
  const metrics: FitnessComponents = {
    quality: keywordCoverage(genome.tokens, role),
    cost: costNorm,
    latency: costNorm,
    safety: safetyScan(genome.tokens.join(' ')),
    novelty: noveltyScore(genome, population, 3),
  };
  genome.metrics = metrics;
  genome.fitness = composeFitness(metrics, cfg.noveltyWeight, cfg.complexityPenalty, tokenCount);
}

function seedPopulation(role: string, baseTokens: string[], size: number, cfg: GaConfig, rng: () => number): PromptGenome[] {
  const population: PromptGenome[] = [];
  for (let i = 0; i < size; i += 1) {
    const tokens = i === 0 ? [...baseTokens] : mutateTokens(baseTokens, 0.5, MUTATION_BANK, rng);
    population.push({
      id: `g0_${i}`,
      agentRole: role,
      tokens,
      fitness: 0,
      generation: 0,
      metrics: { quality: 0, cost: 0, latency: 0, safety: 1, novelty: 0 },
    });
  }
  return population;
}

function runGeneration(population: PromptGenome[], cfg: GaConfig, rng: () => number, role: string, mutationRate: number): PromptGenome[] {
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
  const eliteCount = Math.max(1, Math.floor(cfg.elitismRate * population.length));
  const next: PromptGenome[] = sorted.slice(0, eliteCount).map(cloneGenome);

  while (next.length < population.length) {
    const parentA = tournamentSelect(sorted, cfg.tournamentSize, rng);
    const parentB = tournamentSelect(sorted, cfg.tournamentSize, rng);
    let childTokens: string[];
    if (rng() < cfg.crossoverRate) {
      childTokens = crossoverBLX(parentA.tokens, parentB.tokens, 0.5, rng);
    } else {
      childTokens = [...parentA.tokens];
    }
    childTokens = mutateTokens(childTokens, mutationRate, MUTATION_BANK, rng);
    next.push({
      id: `g${parentA.generation + 1}_${next.length}`,
      agentRole: role,
      tokens: childTokens,
      fitness: 0,
      generation: parentA.generation + 1,
      metrics: { quality: 0, cost: 0, latency: 0, safety: 1, novelty: 0 },
    });
  }

  for (const g of next) evaluateGenome(g, role, next, cfg);
  return next;
}

function cloneGenome(g: PromptGenome): PromptGenome {
  return { ...g, tokens: [...g.tokens], metrics: { ...g.metrics } };
}

function bestOf(population: PromptGenome[]): PromptGenome {
  return population.reduce((best, g) => (g.fitness > best.fitness ? g : best), population[0]);
}

function avgFitness(population: PromptGenome[]): number {
  return population.reduce((s, g) => s + g.fitness, 0) / population.length;
}

// ─── Evolution state ──────────────────────────────────────────────────────────

interface EvolutionRunRecord {
  role: string;
  champion: PromptGenome;
  history: PromptGenome[];
  improvementPercent: number;
}

const summary: PromptEvolutionSummary = {
  totalGenerationsEvolved: 0,
  rolesOptimized: 0,
  bestFitnessByRole: {},
  lastEvolutionAt: '',
};

const runHistory: EvolutionRunRecord[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

export function evolvePromptsForRole(role: string, cfgPartial: Partial<GaConfig> = {}): PromptEvolutionResult {
  const cfg: GaConfig = { ...DEFAULT_GA_CONFIG, ...cfgPartial };
  const rng = mulberry32(cfg.seed);
  const baseTokens = BASE_PROMPTS[role] ?? BASE_PROMPTS.general;

  let population = seedPopulation(role, baseTokens, cfg.populationSize, cfg, rng);
  for (const g of population) evaluateGenome(g, role, population, cfg);
  const initialAvg = avgFitness(population);

  const history: PromptGenome[] = [cloneGenome(bestOf(population))];

  for (let gen = 1; gen <= cfg.maxGenerations; gen += 1) {
    const mutationRate = adaptiveMutationRate(gen, cfg.mutationRateInit, cfg.mutationRateMin, cfg.maxGenerations);
    population = runGeneration(population, cfg, rng, role, mutationRate);
    history.push(cloneGenome(bestOf(population)));
  }

  const champion = bestOf(population);
  const finalAvg = avgFitness(population);
  const improvementPercent = initialAvg > 0 ? Math.max(0, ((finalAvg - initialAvg) / initialAvg) * 100) : 0;

  runHistory.push({ role, champion: cloneGenome(champion), history, improvementPercent });
  summary.totalGenerationsEvolved += cfg.maxGenerations;
  summary.rolesOptimized = runHistory.length;
  summary.bestFitnessByRole[role] = Math.max(summary.bestFitnessByRole[role] ?? 0, champion.fitness);
  summary.lastEvolutionAt = new Date().toISOString();

  return {
    role,
    champion: cloneGenome(champion),
    history,
    generationsRun: cfg.maxGenerations,
    initialAvgFitness: initialAvg,
    finalAvgFitness: finalAvg,
    improvementPercent,
  };
}

export function getPromptEvolutionSummary(): PromptEvolutionSummary {
  return { ...summary, bestFitnessByRole: { ...summary.bestFitnessByRole } };
}

export function getRunHistory(): EvolutionRunRecord[] {
  return runHistory.map((r) => ({ ...r, champion: cloneGenome(r.champion), history: r.history.map(cloneGenome) }));
}
