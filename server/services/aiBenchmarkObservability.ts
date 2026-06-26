export type AIRunStatus = 'success' | 'failed' | 'blocked' | 'needs_review';

export interface AIRunMetric {
  id: string;
  lane: string;
  agentRole: string;
  toolId?: string;
  status: AIRunStatus;
  latencyMs: number;
  estimatedCostUsd?: number;
  qualityScore?: number;
  safetyBlocks?: number;
  createdAt: string;
}

export interface AIBaselineTask {
  id: string;
  lane: string;
  prompt: string;
  expectedSignals: string[];
  minQualityScore: number;
}

export interface AIBaselineResult {
  taskId: string;
  lane: string;
  matchedSignals: string[];
  missingSignals: string[];
  qualityScore: number;
  passed: boolean;
}

export interface AIObservabilitySummary {
  runs: number;
  successRate: number;
  blockedRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  averageQualityScore: number;
  estimatedCostUsd: number;
  laneBreakdown: Array<{ lane: string; runs: number; successRate: number; averageQualityScore: number }>;
}

const metrics: AIRunMetric[] = [];

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function makeId(metric: Omit<AIRunMetric, 'id' | 'createdAt'>, createdAt: string) {
  return `ai_run_${metric.lane}_${metric.agentRole}_${createdAt}`.replace(/[^a-zA-Z0-9_]+/g, '_');
}

export function recordAIRunMetric(metric: Omit<AIRunMetric, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AIRunMetric {
  if (metric.latencyMs < 0) throw new Error('latencyMs must be non-negative.');
  if (metric.qualityScore !== undefined && (metric.qualityScore < 0 || metric.qualityScore > 1)) {
    throw new Error('qualityScore must be between 0 and 1.');
  }
  const createdAt = metric.createdAt || new Date().toISOString();
  const run: AIRunMetric = {
    ...metric,
    id: metric.id || makeId(metric, createdAt),
    createdAt,
  };
  metrics.push(run);
  return { ...run };
}

export function resetAIRunMetricsForTest() {
  metrics.splice(0, metrics.length);
}

export function listAIRunMetrics() {
  return metrics.map((metric) => ({ ...metric }));
}

export function summarizeAIObservability(inputMetrics: AIRunMetric[] = metrics): AIObservabilitySummary {
  const runs = inputMetrics.length;
  const successes = inputMetrics.filter((metric) => metric.status === 'success').length;
  const blocked = inputMetrics.filter((metric) => metric.status === 'blocked').length;
  const qualityValues = inputMetrics.map((metric) => metric.qualityScore).filter((value): value is number => typeof value === 'number');
  const lanes = Array.from(new Set(inputMetrics.map((metric) => metric.lane)));

  return {
    runs,
    successRate: runs ? round(successes / runs) : 0,
    blockedRate: runs ? round(blocked / runs) : 0,
    averageLatencyMs: runs ? Math.round(inputMetrics.reduce((sum, metric) => sum + metric.latencyMs, 0) / runs) : 0,
    p95LatencyMs: percentile(inputMetrics.map((metric) => metric.latencyMs), 95),
    averageQualityScore: qualityValues.length ? round(qualityValues.reduce((sum, value) => sum + value, 0) / qualityValues.length) : 0,
    estimatedCostUsd: round(inputMetrics.reduce((sum, metric) => sum + (metric.estimatedCostUsd || 0), 0), 5),
    laneBreakdown: lanes.map((lane) => {
      const laneMetrics = inputMetrics.filter((metric) => metric.lane === lane);
      const laneQuality = laneMetrics.map((metric) => metric.qualityScore).filter((value): value is number => typeof value === 'number');
      return {
        lane,
        runs: laneMetrics.length,
        successRate: round(laneMetrics.filter((metric) => metric.status === 'success').length / laneMetrics.length),
        averageQualityScore: laneQuality.length ? round(laneQuality.reduce((sum, value) => sum + value, 0) / laneQuality.length) : 0,
      };
    }),
  };
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function evaluateAIBaselineTask(task: AIBaselineTask, output: string): AIBaselineResult {
  const normalizedOutput = normalize(output);
  const matchedSignals = task.expectedSignals.filter((signal) => normalizedOutput.includes(normalize(signal)));
  const missingSignals = task.expectedSignals.filter((signal) => !matchedSignals.includes(signal));
  const qualityScore = task.expectedSignals.length ? round(matchedSignals.length / task.expectedSignals.length) : 1;

  return {
    taskId: task.id,
    lane: task.lane,
    matchedSignals,
    missingSignals,
    qualityScore,
    passed: qualityScore >= task.minQualityScore,
  };
}

export function evaluateAIBaselineSuite(tasks: AIBaselineTask[], outputsByTaskId: Record<string, string>) {
  const results = tasks.map((task) => evaluateAIBaselineTask(task, outputsByTaskId[task.id] || ''));
  const passRate = results.length ? round(results.filter((result) => result.passed).length / results.length) : 0;
  const averageQualityScore = results.length ? round(results.reduce((sum, result) => sum + result.qualityScore, 0) / results.length) : 0;
  return { results, passRate, averageQualityScore };
}

export const AI_WORKFORCE_BASELINE_TASKS: AIBaselineTask[] = [
  {
    id: 'memory-grounding-smoke',
    lane: 'knowledge-spine',
    prompt: 'Explain a decision using grounded sources.',
    expectedSignals: ['source', 'confidence', 'contradiction'],
    minQualityScore: 0.67,
  },
  {
    id: 'software-factory-smoke',
    lane: 'mission-control',
    prompt: 'Prepare a safe PR handoff.',
    expectedSignals: ['diff risk', 'ci', 'readiness'],
    minQualityScore: 0.67,
  },
  {
    id: 'automation-safety-smoke',
    lane: 'execution-layer',
    prompt: 'Validate robot/browser action safety.',
    expectedSignals: ['allowlist', 'replay', 'emergency stop'],
    minQualityScore: 0.67,
  },
];
