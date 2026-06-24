/**
 * modelBenchmark.ts
 * ============================================================
 * Model Benchmark Suite — chạy bộ test chuẩn hóa qua các
 * model để so sánh chất lượng, tốc độ, chi phí một cách
 * khách quan.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { recordUsage } from './costObservability';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface BenchmarkTask {
  id: string;
  name: string;
  domain: string;
  prompt: string;
  expectedKeywords: string[];    // Keywords should appear in response
  expectedPattern?: RegExp;      // Pattern should match
  maxLatencyMs: number;          // Max acceptable latency
}

export interface BenchmarkResult {
  taskId: string;
  taskName: string;
  model: string;
  route: string;
  content: string;
  latencyMs: number;
  passed: boolean;
  score: number;
  checks: Array<{ check: string; passed: boolean; detail: string }>;
}

export interface BenchmarkRun {
  id: string;
  name: string;
  models: string[];
  tasks: BenchmarkTask[];
  results: BenchmarkResult[];
  summary: {
    totalTasks: number;
    totalResults: number;
    byModel: Record<string, { passed: number; total: number; avgLatencyMs: number; avgScore: number }>;
  };
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  durationMs: number;
}

// ─── Standard benchmark tasks ───────────────────────────────────────
const STANDARD_TASKS: BenchmarkTask[] = [
  {
    id: 'code_gen',
    name: 'Basic Code Generation',
    domain: 'coding',
    prompt: 'Write a TypeScript function named "isPalindrome" that checks if a string is a palindrome. Return the code only.',
    expectedKeywords: ['function', 'isPalindrome', 'return', 'split', 'reverse', 'join'],
    maxLatencyMs: 15000,
  },
  {
    id: 'code_explain',
    name: 'Code Explanation',
    domain: 'coding',
    prompt: 'Explain what this TypeScript code does: "const result = items.filter(x => x.active).map(x => x.name).join(\', \');"',
    expectedKeywords: ['filter', 'map', 'active', 'name', 'join', 'comma', 'array'],
    maxLatencyMs: 15000,
  },
  {
    id: 'code_fix',
    name: 'Bug Fixing',
    domain: 'coding',
    prompt: 'Fix this code: "const add = (a,b) => { return a + b } console.log(add(1, \'2\'))" — explain the bug and provide the fix.',
    expectedKeywords: ['string', 'number', 'type', 'fix', 'typeof', 'parseInt', 'Number'],
    maxLatencyMs: 15000,
  },
  {
    id: 'general_reasoning',
    name: 'General Reasoning',
    domain: 'general',
    prompt: 'If a train travels 120km in 2 hours, then 80km in 1 hour, what was the average speed for the entire journey? Show your work.',
    expectedKeywords: ['200', '3', '66.67', 'average', 'total distance', 'total time'],
    maxLatencyMs: 15000,
  },
  {
    id: 'finance_calc',
    name: 'Finance Calculation',
    domain: 'finance',
    prompt: 'Calculate compound interest on $10,000 at 5% annual rate for 3 years. Show the formula and result.',
    expectedKeywords: ['11576', 'compound', 'interest', 'formula', 'principal'],
    maxLatencyMs: 15000,
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'benchmark_runs.json');
let runs: BenchmarkRun[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(FILE)) runs = JSON.parse(await fs.promises.readFile(FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(FILE, JSON.stringify(runs.slice(-20), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function getStandardTasks(): BenchmarkTask[] {
  return [...STANDARD_TASKS];
}

export async function runBenchmark(options: {
  name?: string;
  tasks?: BenchmarkTask[];
  models?: string[];
  maxTasks?: number;
  dryRun?: boolean;
} = {}): Promise<BenchmarkRun> {
  const runId = `bench_${Date.now()}`;
  const started = Date.now();
  const tasks = (options.tasks || STANDARD_TASKS).slice(0, options.maxTasks || 5);

  const run: BenchmarkRun = {
    id: runId,
    name: options.name || `Benchmark ${new Date().toLocaleDateString()}`,
    models: options.models || ['fabric-default'],
    tasks,
    results: [],
    summary: { totalTasks: tasks.length, totalResults: 0, byModel: {} },
    startedAt: new Date().toISOString(),
    status: 'running',
    durationMs: 0,
  };

  runs.push(run);

  if (options.dryRun) {
    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;
    return run;
  }

  try {
    for (const task of tasks) {
      const result = await runSingleTask(task);
      run.results.push(result);
    }

    run.status = 'completed';
  } catch (err: any) {
    run.status = 'failed';
  } finally {
    run.completedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;

    // Build summary
    for (const r of run.results) {
      const modelKey = r.model || 'unknown';
      if (!run.summary.byModel[modelKey]) {
        run.summary.byModel[modelKey] = { passed: 0, total: 0, avgLatencyMs: 0, avgScore: 0 };
      }
      run.summary.byModel[modelKey].total++;
      if (r.passed) run.summary.byModel[modelKey].passed++;
      const prevLatency = run.summary.byModel[modelKey].avgLatencyMs;
      const prevCount = run.summary.byModel[modelKey].total - 1;
      run.summary.byModel[modelKey].avgLatencyMs = Math.round((prevLatency * prevCount + r.latencyMs) / run.summary.byModel[modelKey].total);
      run.summary.byModel[modelKey].avgScore = +((run.summary.byModel[modelKey].avgScore * prevCount + r.score) / run.summary.byModel[modelKey].total).toFixed(1);
    }
    run.summary.totalResults = run.results.length;

    await save();
  }

  return run;
}

async function runSingleTask(task: BenchmarkTask): Promise<BenchmarkResult> {
  const start = Date.now();

  try {
    const fabricResult = await dispatchTextThroughFabric(
      task.prompt,
      undefined,
      { domain: task.domain as any, task: task.domain, localFallback: true }
    );

    const content = fabricResult.winner?.contentPreview || '';
    const latencyMs = Date.now() - start;
    const model = fabricResult.modelUsed || 'fabric';
    const route = fabricResult.winner?.route || 'api';

    // Check
    const checks: BenchmarkResult['checks'] = [];

    // Keyword check
    const contentLower = content.toLowerCase();
    let keywordHits = 0;
    for (const kw of task.expectedKeywords) {
      const hit = contentLower.includes(kw.toLowerCase());
      checks.push({ check: `Keyword "${kw}"`, passed: hit, detail: hit ? 'Found' : 'Not found' });
      if (hit) keywordHits++;
    }
    const keywordScore = task.expectedKeywords.length > 0
      ? keywordHits / task.expectedKeywords.length
      : 1;

    // Pattern check
    let patternPassed = true;
    if (task.expectedPattern) {
      patternPassed = task.expectedPattern.test(content);
      checks.push({ check: 'Pattern match', passed: patternPassed, detail: patternPassed ? 'Matched' : 'No match' });
    }

    // Latency check
    const latencyOk = latencyMs <= task.maxLatencyMs;
    checks.push({ check: `Latency < ${task.maxLatencyMs}ms`, passed: latencyOk, detail: `${latencyMs}ms` });

    // Overall score
    const score = Math.round((keywordScore * 0.5 + (patternPassed ? 0.3 : 0) + (latencyOk ? 0.2 : 0)) * 10) / 10;
    const passed = keywordScore >= 0.6 && latencyOk;

    return {
      taskId: task.id,
      taskName: task.name,
      model,
      route,
      content: content.slice(0, 500),
      latencyMs,
      passed,
      score,
      checks,
    };
  } catch (err: any) {
    return {
      taskId: task.id,
      taskName: task.name,
      model: 'error',
      route: 'error',
      content: `Error: ${err.message}`,
      latencyMs: Date.now() - start,
      passed: false,
      score: 0,
      checks: [{ check: 'Execution', passed: false, detail: err.message }],
    };
  }
}

export function getBenchmarkRuns(): BenchmarkRun[] {
  return [...runs].reverse();
}

export function getBenchmarkRun(id: string): BenchmarkRun | undefined {
  return runs.find(r => r.id === id);
}
