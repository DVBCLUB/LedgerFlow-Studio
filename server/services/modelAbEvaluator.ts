/**
 * modelAbEvaluator.ts
 * ============================================================
 * Model A/B Evaluator — chạy cùng một prompt qua nhiều model,
 * so sánh kết quả và chọn response tốt nhất dựa trên tiêu chí.
 * 
 * Hỗ trợ: blind test (ẩn model name), multi-criteria scoring,
 * và automatic best-of-N selection.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { recordUsage } from './costObservability';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface ABTestModel {
  id: string;
  label: string;
  modelHint?: string;     // Model hint for Fabric routing
}

export interface ABTestResponse {
  modelId: string;
  modelLabel: string;
  content: string;
  latencyMs: number;
  tokensUsed?: number;
  costUsd: number;
  route: string;
}

export interface ABTestCriteria {
  id: string;
  label: string;
  weight: number;          // 0-1, total should sum to 1
  description: string;
}

export interface ABTestScore {
  modelId: string;
  totalScore: number;
  criteriaScores: Record<string, number>; // criteriaId -> score (0-10)
  rank: number;
  summary: string;
}

export interface ABTestRun {
  id: string;
  name: string;
  prompt: string;
  domain: string;
  models: ABTestModel[];
  responses: ABTestResponse[];
  criteria: ABTestCriteria[];
  scores: ABTestScore[];
  winner: ABTestScore | null;
  blindMode: boolean;
  status: 'running' | 'evaluating' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  totalCostUsd: number;
  evaluatorNotes: string[];
}

// ─── Default criteria ───────────────────────────────────────────────
const DEFAULT_CRITERIA: ABTestCriteria[] = [
  { id: 'accuracy', label: 'Độ chính xác', weight: 0.35, description: 'Kết quả có đúng với yêu cầu không?' },
  { id: 'completeness', label: 'Tính đầy đủ', weight: 0.25, description: 'Có bao quát đủ các khía cạnh không?' },
  { id: 'clarity', label: 'Độ rõ ràng', weight: 0.20, description: 'Trình bày có dễ hiểu, mạch lạc không?' },
  { id: 'efficiency', label: 'Hiệu suất', weight: 0.20, description: 'Độ trễ và chi phí có hợp lý không?' },
];

const DEFAULT_MODELS: ABTestModel[] = [
  { id: 'model_a', label: 'Model A' },
  { id: 'model_b', label: 'Model B' },
];

// ─── Storage ────────────────────────────────────────────────────────
const RUNS_FILE = path.join(process.cwd(), 'ab_test_runs.json');
let runs: ABTestRun[] = [];

async function loadRuns(): Promise<void> {
  try {
    if (fs.existsSync(RUNS_FILE)) runs = JSON.parse(await fs.promises.readFile(RUNS_FILE, 'utf8'));
  } catch { }
}
loadRuns().catch(() => undefined);

async function saveRuns(): Promise<void> {
  await fs.promises.writeFile(RUNS_FILE, JSON.stringify(runs.slice(-50), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export async function runABTest(
  prompt: string,
  options: {
    name?: string;
    domain?: string;
    models?: ABTestModel[];
    criteria?: ABTestCriteria[];
    blindMode?: boolean;
  } = {}
): Promise<ABTestRun> {
  const runId = `ab_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const models = options.models || DEFAULT_MODELS;
  const criteria = options.criteria || DEFAULT_CRITERIA;
  const blindMode = options.blindMode !== false;

  const run: ABTestRun = {
    id: runId,
    name: options.name || `AB Test ${new Date().toLocaleTimeString()}`,
    prompt,
    domain: options.domain || 'general',
    models,
    responses: [],
    criteria,
    scores: [],
    winner: null,
    blindMode,
    status: 'running',
    startedAt: new Date().toISOString(),
    totalCostUsd: 0,
    evaluatorNotes: [],
  };

  runs.push(run);

  // Step 1: Run all models
  for (const model of models) {
    const start = Date.now();
    try {
      const fabricResult = await dispatchTextThroughFabric(
        prompt,
        undefined,
        { domain: options.domain as any, task: options.domain, localFallback: true }
      );

      const response: ABTestResponse = {
        modelId: model.id,
        modelLabel: model.label,
        content: fabricResult.winner?.contentPreview || '',
        latencyMs: Date.now() - start,
        tokensUsed: fabricResult.winner?.contentPreview?.length ? Math.ceil(fabricResult.winner.contentPreview.length / 4) : 0,
        costUsd: 0.001, // Estimate
        route: fabricResult.winner?.route || 'api',
      };

      run.responses.push(response);
      run.totalCostUsd += response.costUsd;

    } catch (err: any) {
      run.responses.push({
        modelId: model.id,
        modelLabel: model.label,
        content: `ERROR: ${err.message}`,
        latencyMs: Date.now() - start,
        costUsd: 0,
        route: 'error',
      });
    }
  }

  // Step 2: Evaluate with AI
  run.status = 'evaluating';

  try {
    const evaluationPrompt = buildEvaluationPrompt(run);
    const evalResult = await dispatchTextThroughFabric(
      evaluationPrompt,
      'Bạn là một AI Evaluator. Chấm điểm khách quan, không thiên vị.',
      { domain: 'general', task: 'general', localFallback: true }
    );

    if (evalResult.status === 'completed' && evalResult.winner?.contentPreview) {
      const parsed = parseScores(evalResult.winner.contentPreview, run);
      run.scores = parsed;
      run.evaluatorNotes = [evalResult.winner.contentPreview.slice(0, 300)];
    } else {
      // Fallback: score by latency
      run.scores = fallbackScore(run);
    }
  } catch {
    run.scores = fallbackScore(run);
  }

  // Step 3: Determine winner
  if (run.scores.length > 0) {
    run.scores.sort((a, b) => b.totalScore - a.totalScore);
    run.scores.forEach((s, i) => { s.rank = i + 1; });
    run.winner = run.scores[0];
  }

  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  await saveRuns();

  return run;
}

export function getABTestRun(id: string): ABTestRun | undefined {
  return runs.find(r => r.id === id);
}

export function listABTestRuns(): ABTestRun[] {
  return [...runs].reverse();
}

export function getDefaultConfig(): { models: ABTestModel[]; criteria: ABTestCriteria[] } {
  return { models: [...DEFAULT_MODELS], criteria: [...DEFAULT_CRITERIA] };
}

// ─── Helpers ────────────────────────────────────────────────────────

function buildEvaluationPrompt(run: ABTestRun): string {
  let prompt = `Đánh giá các AI responses sau cho cùng một prompt. Cho điểm 0-10 cho từng tiêu chí.\n\n`;

  prompt += `PROMPT GỐC:\n${run.prompt}\n\n`;

  if (run.blindMode) {
    prompt += `(BLIND TEST — model names hidden)\n`;
  }

  prompt += `TIÊU CHÍ:\n`;
  for (const c of run.criteria) {
    prompt += `- ${c.id} (${c.label}, weight ${(c.weight * 100).toFixed(0)}%): ${c.description}\n`;
  }

  prompt += `\nRESPONSES:\n`;
  for (const resp of run.responses) {
    const label = run.blindMode ? `Response ${run.responses.indexOf(resp) + 1}` : resp.modelLabel;
    prompt += `\n--- ${label} (${resp.latencyMs}ms) ---\n${resp.content.slice(0, 800)}\n`;
    if (resp.content.length > 800) prompt += '...(truncated)\n';
  }

  prompt += `\nTrả về điểm theo format:\n`;
  for (const resp of run.responses) {
    const label = run.blindMode ? `Response ${run.responses.indexOf(resp) + 1}` : resp.modelLabel;
    prompt += `SCORE:${label}`;
    for (const c of run.criteria) prompt += `|${c.id}:X`;
    prompt += `|SUMMARY:lý do ngắn\n`;
  }

  return prompt;
}

function parseScores(content: string, run: ABTestRun): ABTestScore[] {
  const scores: ABTestScore[] = [];

  for (const resp of run.responses) {
    const label = run.blindMode ? `Response ${run.responses.indexOf(resp) + 1}` : resp.modelLabel;
    const lineRegex = new RegExp(`SCORE:${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\|?(.*)`, 'i');
    const match = content.match(lineRegex);

    const criteriaScores: Record<string, number> = {};
    let totalWeight = 0;
    let totalScore = 0;
    let summary = '';

    if (match) {
      const parts = match[1].split('|');
      for (const part of parts) {
        const [key, val] = part.split(':').map(s => s.trim());
        if (key === 'SUMMARY' || key.toLowerCase() === 'summary') {
          summary = val || '';
        } else if (run.criteria.find(c => c.id === key)) {
          const numericVal = parseFloat(val);
          if (!isNaN(numericVal) && numericVal >= 0 && numericVal <= 10) {
            criteriaScores[key] = numericVal;
            const weight = run.criteria.find(c => c.id === key)?.weight || 0;
            totalWeight += weight;
            totalScore += numericVal * weight;
          }
        }
      }
    }

    // Normalize if weights don't sum to 1
    if (totalWeight > 0 && Math.abs(totalWeight - 1) > 0.01) {
      totalScore = totalScore / totalWeight;
    }

    scores.push({
      modelId: resp.modelId,
      totalScore: totalScore > 0 ? Math.round(totalScore * 10) / 10 : 0,
      criteriaScores,
      rank: 0,
      summary,
    });
  }

  return scores;
}

function fallbackScore(run: ABTestRun): ABTestScore[] {
  // Score by latency (less is better)
  const maxLatency = Math.max(...run.responses.map(r => r.latencyMs), 1);
  return run.responses.map(resp => {
    const latencyScore = 10 * (1 - resp.latencyMs / maxLatency);
    return {
      modelId: resp.modelId,
      totalScore: Math.round(latencyScore * 10) / 10,
      criteriaScores: { efficiency: Math.round(latencyScore) },
      rank: 0,
      summary: 'Fallback: scored by latency only.',
    };
  });
}
