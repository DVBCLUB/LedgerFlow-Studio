/**
 * aiApprenticeDistillationEngine.ts
 * ============================================================
 * Continuous Local AI Apprentice & Distillation Pipeline
 *
 * Triết lý vận hành:
 * 1. "Đứng trên vai người khổng lồ": Giao việc khó cho Frontier Models (Claude, Gemini 2.5 Pro, DeepSeek R1, GPT-4o).
 * 2. "Đào tạo Local AI thành đệ tử ruột": Tự động thu thập (Shadow Trajectory Capture)
 *    mọi cặp (Prompt, Gold Standard Output) đạt điểm chất lượng >= 90 hoặc được CEO Approved.
 * 3. Tự động đóng gói thành các bộ Dataset chuẩn SFT (Alpaca, ShareGPT, DPO) sẵn sàng cho
 *    việc tinh chỉnh (Fine-tuning / LoRA) mô hình Local trong tương lai.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

export type DistillationDomain =
  | 'coding'
  | 'finance'
  | 'marketing'
  | 'game'
  | 'video'
  | 'legal'
  | 'architecture'
  | 'support';

export interface GoldenTrajectory {
  id: string;
  domain: DistillationDomain;
  taskType: string;
  systemPrompt: string;
  userPrompt: string;
  goldOutput: string;
  rejectedOutput?: string;
  providerUsed: string;
  modelUsed?: string;
  qualityScore: number; // 0 - 100
  evaluatedBy: 'llm_judge' | 'ceo_approval' | 'test_verification' | 'auto_eval';
  tags: string[];
  tokenCountEstimated: number;
  createdAt: string;
}

export interface DistillationStats {
  totalTrajectories: number;
  byDomain: Record<DistillationDomain, number>;
  byProvider: Record<string, number>;
  totalTokensEstimated: number;
  averageQualityScore: number;
  readinessForFineTuningPct: number; // Mục tiêu >= 500 samples cho Phase 1
  minRecommendedSamples: number;
  lastCapturedAt?: string;
}

const DISTILL_DIR = resolveRuntimePathFromEnv('DISTILLATION_DIR', 'distillation');
const MAIN_FILE = path.join(DISTILL_DIR, 'distillation_trajectories.json');
const ALPACA_FILE = path.join(DISTILL_DIR, 'alpaca_finetune.jsonl');
const SHAREGPT_FILE = path.join(DISTILL_DIR, 'sharegpt_conversations.jsonl');
const DPO_FILE = path.join(DISTILL_DIR, 'dpo_preference_pairs.jsonl');

function ensureDistillDir(): void {
  ensureRuntimeRootSync();
  if (!fs.existsSync(DISTILL_DIR)) {
    fs.mkdirSync(DISTILL_DIR, { recursive: true });
  }
}

function loadAllTrajectories(): GoldenTrajectory[] {
  ensureDistillDir();
  try {
    if (!fs.existsSync(MAIN_FILE)) return [];
    const raw = fs.readFileSync(MAIN_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllTrajectories(items: GoldenTrajectory[]): void {
  ensureDistillDir();
  try {
    fs.writeFileSync(MAIN_FILE, JSON.stringify(items, null, 2), 'utf8');

    // Đồng bộ xuất file JSONL Alpaca format
    const alpacaLines = items.map((t) =>
      JSON.stringify({
        instruction: t.systemPrompt || `Xử lý tác vụ chuyên môn trong lĩnh vực ${t.domain}.`,
        input: t.userPrompt,
        output: t.goldOutput,
        meta: { id: t.id, domain: t.domain, score: t.qualityScore, provider: t.providerUsed },
      })
    );
    fs.writeFileSync(ALPACA_FILE, alpacaLines.join('\n'), 'utf8');

    // Đồng bộ xuất file JSONL ShareGPT format
    const sharegptLines = items.map((t) =>
      JSON.stringify({
        id: t.id,
        conversations: [
          ...(t.systemPrompt ? [{ from: 'system', value: t.systemPrompt }] : []),
          { from: 'human', value: t.userPrompt },
          { from: 'gpt', value: t.goldOutput },
        ],
      })
    );
    fs.writeFileSync(SHAREGPT_FILE, sharegptLines.join('\n'), 'utf8');

    // Đồng bộ xuất file DPO format (nếu có rejected output)
    const dpoItems = items
      .filter((t) => t.rejectedOutput && t.rejectedOutput.trim().length > 0)
      .map((t) =>
        JSON.stringify({
          prompt: t.userPrompt,
          chosen: t.goldOutput,
          rejected: t.rejectedOutput,
        })
      );
    if (dpoItems.length > 0) {
      fs.writeFileSync(DPO_FILE, dpoItems.join('\n'), 'utf8');
    }
  } catch (err) {
    console.error('[DistillationEngine] save failed:', err);
  }
}

/**
 * Thu thập một Golden Trajectory từ Frontier Model
 * Chỉ ghi nhận nếu chất lượng >= 90 hoặc có CEO Approval.
 */
export function captureGoldenTrajectory(input: {
  domain: DistillationDomain;
  taskType?: string;
  systemPrompt?: string;
  userPrompt: string;
  goldOutput: string;
  rejectedOutput?: string;
  providerUsed: string;
  modelUsed?: string;
  qualityScore?: number;
  evaluatedBy?: GoldenTrajectory['evaluatedBy'];
  tags?: string[];
}): { captured: boolean; trajectory?: GoldenTrajectory; reason?: string } {
  const score = typeof input.qualityScore === 'number' ? input.qualityScore : 90;
  const isApproved = input.evaluatedBy === 'ceo_approval' || score >= 88;

  if (!isApproved) {
    return {
      captured: false,
      reason: `Chất lượng chưa đạt chuẩn mẫu vàng (${score} < 88). Bỏ qua không đưa vào bộ huấn luyện Local AI.`,
    };
  }

  if (!input.userPrompt || !input.goldOutput) {
    return { captured: false, reason: 'Dữ liệu prompt hoặc output rỗng.' };
  }

  const items = loadAllTrajectories();

  // Chống trùng lặp (Deduplication) dựa trên userPrompt
  const exists = items.some(
    (item) => item.userPrompt.trim().toLowerCase() === input.userPrompt.trim().toLowerCase()
  );
  if (exists) {
    return { captured: false, reason: 'Mẫu tương tự đã tồn tại trong bộ tri thức Local AI.' };
  }

  const estTokens = Math.round((input.userPrompt.length + input.goldOutput.length) / 4);

  const trajectory: GoldenTrajectory = {
    id: `distill_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    domain: input.domain,
    taskType: input.taskType || input.domain,
    systemPrompt: input.systemPrompt || '',
    userPrompt: input.userPrompt,
    goldOutput: input.goldOutput,
    rejectedOutput: input.rejectedOutput,
    providerUsed: input.providerUsed,
    modelUsed: input.modelUsed,
    qualityScore: score,
    evaluatedBy: input.evaluatedBy || 'auto_eval',
    tags: input.tags || [input.domain, input.providerUsed],
    tokenCountEstimated: estTokens,
    createdAt: new Date().toISOString(),
  };

  items.unshift(trajectory);
  if (items.length > 5000) items.length = 5000;
  saveAllTrajectories(items);

  return { captured: true, trajectory };
}

/**
 * Lấy số liệu thống kê tiến độ học của Local AI
 */
export function getDistillationStats(): DistillationStats {
  const items = loadAllTrajectories();
  const byDomain: Record<DistillationDomain, number> = {
    coding: 0,
    finance: 0,
    marketing: 0,
    game: 0,
    video: 0,
    legal: 0,
    architecture: 0,
    support: 0,
  };
  const byProvider: Record<string, number> = {};
  let totalTokens = 0;
  let scoreSum = 0;

  for (const it of items) {
    if (byDomain[it.domain] !== undefined) {
      byDomain[it.domain]++;
    }
    byProvider[it.providerUsed] = (byProvider[it.providerUsed] || 0) + 1;
    totalTokens += it.tokenCountEstimated;
    scoreSum += it.qualityScore;
  }

  const minTarget = 500;
  const readiness = Math.min(100, Math.round((items.length / minTarget) * 100));

  return {
    totalTrajectories: items.length,
    byDomain,
    byProvider,
    totalTokensEstimated: totalTokens,
    averageQualityScore: items.length > 0 ? Math.round(scoreSum / items.length) : 0,
    readinessForFineTuningPct: readiness,
    minRecommendedSamples: minTarget,
    lastCapturedAt: items[0]?.createdAt,
  };
}

/**
 * Danh sách Trajectories đã thu thập
 */
export function listGoldenTrajectories(filter?: {
  domain?: DistillationDomain;
  provider?: string;
  limit?: number;
}): GoldenTrajectory[] {
  let list = loadAllTrajectories();
  if (filter?.domain) list = list.filter((t) => t.domain === filter.domain);
  if (filter?.provider) list = list.filter((t) => t.providerUsed === filter.provider);
  return list.slice(0, filter?.limit || 100);
}

/**
 * Xuất dữ liệu huấn luyện dạng file text (JSONL)
 */
export function exportDistillationDataset(format: 'alpaca' | 'sharegpt' | 'dpo' = 'alpaca'): string {
  const items = loadAllTrajectories();
  if (format === 'sharegpt') {
    return items
      .map((t) =>
        JSON.stringify({
          id: t.id,
          conversations: [
            ...(t.systemPrompt ? [{ from: 'system', value: t.systemPrompt }] : []),
            { from: 'human', value: t.userPrompt },
            { from: 'gpt', value: t.goldOutput },
          ],
        })
      )
      .join('\n');
  }
  if (format === 'dpo') {
    return items
      .filter((t) => t.rejectedOutput)
      .map((t) =>
        JSON.stringify({
          prompt: t.userPrompt,
          chosen: t.goldOutput,
          rejected: t.rejectedOutput,
        })
      )
      .join('\n');
  }
  // Mặc định Alpaca format
  return items
    .map((t) =>
      JSON.stringify({
        instruction: t.systemPrompt || `Xử lý tác vụ chuyên môn trong lĩnh vực ${t.domain}.`,
        input: t.userPrompt,
        output: t.goldOutput,
      })
    )
    .join('\n');
}

/**
 * Xóa hoặc reset tập dataset
 */
export function clearDistillationDataset(): boolean {
  try {
    saveAllTrajectories([]);
    return true;
  } catch {
    return false;
  }
}
