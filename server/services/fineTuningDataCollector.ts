/**
 * fineTuningDataCollector.ts
 * ============================================================
 * Agent Fine-Tuning Data Collector — thu thập và curate
 * dữ liệu training từ các tương tác thành công của agent.
 *
 * Tạo dataset cho fine-tuning: prompt → completion pairs,
 * phân loại theo domain/task, đánh giá chất lượng.
 */
import { randomUUID } from 'node:crypto';
import { searchMemory } from './compoundMemory';
import { getRecords } from './costObservability';
import { getFeedbackStats } from './feedbackCollector';
import fs from 'fs';
import path from 'path';
import { resolveRuntimeDirPath, resolveRuntimeReadDirFromEnv } from './runtimePaths.ts';

// ─── Types ──────────────────────────────────────────────────────────
export interface TrainingPair {
  id: string;
  domain: string;
  task: string;
  systemPrompt: string;
  userPrompt: string;
  assistantResponse: string;
  quality: 'gold' | 'silver' | 'bronze';
  source: string;               // Where this data came from
  confidence: number;
  tags: string[];
  tokenCount: number;
  collectedAt: string;
  curatedAt?: string;
}

export interface FineTuningDataset {
  id: string;
  name: string;
  description: string;
  domain: string;
  pairs: TrainingPair[];
  format: 'chatml' | 'alpaca' | 'openai';
  totalPairs: number;
  totalTokens: number;
  qualityDistribution: Record<string, number>;
  createdAt: string;
}

// ─── Storage ────────────────────────────────────────────────────────
const PAIRS_DIR = resolveRuntimeDirPath('fine_tuning_data');
const PAIRS_READ_DIR = resolveRuntimeReadDirFromEnv('FINE_TUNING_DATA_DIR', 'fine_tuning_data');
const DATASETS_FILE = path.join(PAIRS_DIR, '_datasets.json');
const DATASETS_READ_FILE = path.join(PAIRS_READ_DIR, '_datasets.json');

let pairs: TrainingPair[] = [];
let datasets: FineTuningDataset[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(PAIRS_DIR)) await fs.promises.mkdir(PAIRS_DIR, { recursive: true });
    if (fs.existsSync(DATASETS_READ_FILE)) datasets = JSON.parse(await fs.promises.readFile(DATASETS_READ_FILE, 'utf8'));
    // Load all pair files
    const pairFiles = fs.existsSync(PAIRS_READ_DIR) ? fs.readdirSync(PAIRS_READ_DIR).filter(f => f.endsWith('.json') && f !== '_datasets.json') : [];
    for (const file of pairFiles.slice(0, 10)) {
      try {
        const filePairs = JSON.parse(await fs.promises.readFile(path.join(PAIRS_READ_DIR, file), 'utf8'));
        pairs.push(...filePairs);
      } catch { }
    }
  } catch { }
}
init().catch(() => undefined);

async function savePairs(): Promise<void> {
  const file = path.join(PAIRS_DIR, `pairs_${Date.now()}.json`);
  await fs.promises.writeFile(file, JSON.stringify(pairs.slice(-200), null, 2), 'utf8');
}
async function saveDatasets(): Promise<void> {
  await fs.promises.writeFile(DATASETS_FILE, JSON.stringify(datasets, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function collectTrainingPair(input: {
  domain: string; task: string; systemPrompt?: string;
  userPrompt: string; assistantResponse: string;
  quality?: TrainingPair['quality']; source?: string;
  confidence?: number; tags?: string[];
}): TrainingPair {
  const pair: TrainingPair = {
    id: `pair_${Date.now()}_${randomUUID().slice(0, 6)}`,
    domain: input.domain,
    task: (input.task || input.userPrompt || 'Task').slice(0, 150),
    systemPrompt: input.systemPrompt || '',
    userPrompt: input.userPrompt,
    assistantResponse: input.assistantResponse,
    quality: input.quality || 'bronze',
    source: input.source || 'manual',
    confidence: input.confidence || 0.7,
    tags: input.tags || [],
    tokenCount: Math.ceil((input.userPrompt.length + input.assistantResponse.length) / 4),
    collectedAt: new Date().toISOString(),
  };

  pairs.push(pair);

  if (pairs.length % 10 === 0) savePairs().catch(() => undefined);
  return pair;
}

export async function collectFromFeedback(minRating = 'good'): Promise<number> {
  const stats = getFeedbackStats(undefined, 30);
  const goodFeedback = stats.recentRecords.filter(r =>
    r.rating === 'excellent' || r.rating === 'good' || r.rating === minRating
  );

  let collected = 0;
  for (const fb of goodFeedback) {
    // Search memory for the actual conversation
    try {
      const mems = await searchMemory(`feedback:${fb.id}`, { limit: 1 });
      const mem = mems[0];
      if (mem && mem.content.length > 30) {
        const quality: TrainingPair['quality'] = fb.rating === 'excellent' ? 'gold' : 'silver';
        collectTrainingPair({
          domain: fb.domain || 'general',
          task: fb.taskSummary || 'Task',
          userPrompt: mem.title,
          assistantResponse: mem.content,
          quality, source: 'feedback',
          confidence: fb.rating === 'excellent' ? 0.95 : 0.8,
          tags: fb.categories || [],
        });
        collected++;
      }
    } catch { }
  }

  return collected;
}

export async function collectFromMemory(kind: 'pattern' | 'lesson' = 'pattern', limit = 20): Promise<number> {
  const mems = await searchMemory('success', { kinds: [kind], limit });
  let collected = 0;

  for (const mem of mems) {
    if (mem.confidence < 0.7) continue;
    if (mem.content.length < 50) continue;

    collectTrainingPair({
      domain: mem.domain,
      task: mem.title,
      userPrompt: `Learn from experience: ${mem.title}`,
      assistantResponse: mem.content,
      quality: mem.confidence >= 0.9 ? 'gold' : 'silver',
      source: 'compound_memory',
      confidence: mem.confidence,
      tags: [kind, mem.domain],
    });
    collected++;
  }

  return collected;
}

export function listPairs(filter?: {
  domain?: string; quality?: TrainingPair['quality']; limit?: number;
}): TrainingPair[] {
  let result = [...pairs];
  if (filter?.domain) result = result.filter(p => p.domain === filter.domain);
  if (filter?.quality) result = result.filter(p => p.quality === filter.quality);
  result.sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());
  return result.slice(0, filter?.limit || 100);
}

export function createDataset(
  name: string,
  options: {
    description?: string; domain?: string; format?: FineTuningDataset['format'];
    quality?: TrainingPair['quality']; minConfidence?: number; maxPairs?: number;
  } = {}
): FineTuningDataset {
  let filtered = [...pairs];
  if (options.domain) filtered = filtered.filter(p => p.domain === options.domain);
  if (options.quality) filtered = filtered.filter(p => p.quality === options.quality);
  if (options.minConfidence !== undefined) { const minC = options.minConfidence; filtered = filtered.filter(p => p.confidence >= minC); }

  filtered = filtered.slice(0, options.maxPairs || 100);

  const qualityDistribution: Record<string, number> = {};
  for (const p of filtered) {
    qualityDistribution[p.quality] = (qualityDistribution[p.quality] || 0) + 1;
  }

  const dataset: FineTuningDataset = {
    id: `ds_${Date.now()}_${randomUUID().slice(0, 6)}`,
    name: name.slice(0, 100),
    description: options.description || '',
    domain: options.domain || 'general',
    pairs: filtered,
    format: options.format || 'chatml',
    totalPairs: filtered.length,
    totalTokens: filtered.reduce((s, p) => s + p.tokenCount, 0),
    qualityDistribution,
    createdAt: new Date().toISOString(),
  };

  datasets.push(dataset);
  saveDatasets().catch(() => undefined);
  return dataset;
}

export function exportDataset(datasetId: string, format?: FineTuningDataset['format']): string {
  const dataset = datasets.find(d => d.id === datasetId);
  if (!dataset) return '';

  const fmt = format || dataset.format;

  switch (fmt) {
    case 'chatml': {
      const lines: string[] = [];
      for (const p of dataset.pairs) {
        lines.push(JSON.stringify({
          messages: [
            ...(p.systemPrompt ? [{ role: 'system', content: p.systemPrompt }] : []),
            { role: 'user', content: p.userPrompt },
            { role: 'assistant', content: p.assistantResponse },
          ],
        }));
      }
      return lines.join('\n');
    }
    case 'alpaca': {
      const lines: string[] = [];
      for (const p of dataset.pairs) {
        lines.push(JSON.stringify({
          instruction: p.userPrompt,
          ...(p.systemPrompt ? { system: p.systemPrompt } : {}),
          output: p.assistantResponse,
        }));
      }
      return lines.join('\n');
    }
    case 'openai': {
      const lines: string[] = [];
      for (const p of dataset.pairs) {
        lines.push(JSON.stringify({
          prompt: `${p.systemPrompt ? p.systemPrompt + '\n\n' : ''}${p.userPrompt}`,
          completion: p.assistantResponse,
        }));
      }
      return lines.join('\n');
    }
  }
}

export function getDataset(id: string): FineTuningDataset | undefined {
  return datasets.find(d => d.id === id);
}

export function listDatasets(): FineTuningDataset[] {
  return [...datasets].reverse();
}

export function getPairStats(): {
  total: number;
  byDomain: Record<string, number>;
  byQuality: Record<string, number>;
  bySource: Record<string, number>;
  totalTokens: number;
} {
  const byDomain: Record<string, number> = {};
  const byQuality: Record<string, number> = {};
  const bySource: Record<string, number> = {};

  for (const p of pairs) {
    byDomain[p.domain] = (byDomain[p.domain] || 0) + 1;
    byQuality[p.quality] = (byQuality[p.quality] || 0) + 1;
    bySource[p.source] = (bySource[p.source] || 0) + 1;
  }

  return {
    total: pairs.length,
    byDomain,
    byQuality,
    bySource,
    totalTokens: pairs.reduce((s, p) => s + p.tokenCount, 0),
  };
}
