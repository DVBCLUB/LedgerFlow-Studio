/**
 * promptOptimizer.ts
 * ============================================================
 * Prompt Auto-Optimizer — phân tích các task thành công để
 * tự động tinh chỉnh system prompt cho từng agent role.
 * Ghi version prompt vào registry để có thể rollback.
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchMemory } from './compoundMemory';

// ─── Types ──────────────────────────────────────────────────────────
export interface PromptVersion {
  id: string;
  roleId: string;
  domain: string;
  version: number;
  content: string;
  note: string;
  optimizedAt: string;
  previousVersionId?: string;
  metrics: {
    successRate: number;
    averageLatencyMs: number;
    sampleSize: number;
  };
}

export interface OptimizationSuggestion {
  roleId: string;
  domain: string;
  currentPrompt: string;
  suggestedPrompt: string;
  reasoning: string;
  expectedImprovement: string;
  evidence: string[];
}

// ─── Storage ────────────────────────────────────────────────────────
const PROMPT_VERSIONS_FILE = path.join(process.cwd(), 'prompt_versions.json');

async function loadVersions(): Promise<PromptVersion[]> {
  try {
    if (!fs.existsSync(PROMPT_VERSIONS_FILE)) return [];
    return JSON.parse(await fs.promises.readFile(PROMPT_VERSIONS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function saveVersions(versions: PromptVersion[]): Promise<void> {
  await fs.promises.writeFile(PROMPT_VERSIONS_FILE, JSON.stringify(versions, null, 2), 'utf8');
}

// ─── Public API ─────────────────────────────────────────────────────

export async function analyzeAndOptimize(
  roleId: string,
  domain: string,
  currentPrompt: string
): Promise<OptimizationSuggestion | null> {
  // Search memory for successful tasks in this domain
  const successes = await searchMemory(`success ${domain}`, {
    domain,
    kinds: ['pattern'],
    limit: 10,
  });

  const failures = await searchMemory(`failure ${domain}`, {
    domain,
    kinds: ['lesson'],
    limit: 5,
  });

  if (successes.length < 3) {
    // Not enough data to optimize
    return null;
  }

  // Build evidence from successes
  const evidence = successes.map(s =>
    `Task: ${s.title}\nOutcome: Success (confidence: ${(s.confidence * 100).toFixed(0)}%)\nKey insight: ${s.content.slice(0, 200)}`
  );

  // Add failure patterns
  if (failures.length > 0) {
    evidence.push(`\n--- Common failure patterns to avoid ---`);
    for (const f of failures) {
      evidence.push(`Pitfall: ${f.title} - ${f.content.slice(0, 150)}`);
    }
  }

  // Ask AI to optimize the prompt
  const optimizationPrompt = `Bạn là một Prompt Engineer chuyên nghiệp. Hãy phân tích dữ liệu thành công và thất bại dưới đây, sau đó đề xuất cải tiến system prompt cho agent role "${roleId}" trong domain "${domain}".

CURRENT SYSTEM PROMPT:
${currentPrompt}

EVIDENCE FROM PAST TASKS:
${evidence.join('\n')}

YÊU CẦU:
1. Phân tích pattern thành công và thất bại
2. Đề xuất system prompt MỚI (giữ nguyên cấu trúc, chỉ thêm/sửa phần quan trọng)
3. Giải thích lý do thay đổi
4. Đánh giá mức cải thiện dự kiến

Trả lời theo format:
## ANALYSIS
[phân tích]

## SUGGESTED PROMPT
[system prompt mới]

## REASONING
[lý do]

## EXPECTED IMPROVEMENT
[mô tả ngắn]`;

  try {
    const result = await dispatchTextThroughFabric(optimizationPrompt, undefined, {
      domain: 'coding',
      task: 'general',
      localFallback: true,
    });

    if (result.status !== 'completed' || !result.winner?.contentPreview) {
      return null;
    }

    const content = result.winner.contentPreview;

    // Parse the response
    const suggestedPrompt = extractSection(content, 'SUGGESTED PROMPT');
    const reasoning = extractSection(content, 'REASONING');
    const expectedImprovement = extractSection(content, 'EXPECTED IMPROVEMENT');

    if (!suggestedPrompt) return null;

    return {
      roleId,
      domain,
      currentPrompt,
      suggestedPrompt,
      reasoning: reasoning || 'AI-optimized based on success patterns.',
      expectedImprovement: expectedImprovement || 'Improved relevance and accuracy.',
      evidence: evidence.slice(0, 3),
    };
  } catch {
    return null;
  }
}

export async function savePromptVersion(version: Omit<PromptVersion, 'id'>): Promise<PromptVersion> {
  const versions = await loadVersions();
  const newVersion: PromptVersion = {
    ...version,
    id: `pv_${Date.now()}_${randomUUID().slice(0, 8)}`,
  };

  versions.push(newVersion);
  await saveVersions(versions.slice(-100)); // Keep last 100
  return newVersion;
}

export async function getLatestPromptVersion(roleId: string, domain: string): Promise<PromptVersion | undefined> {
  const versions = await loadVersions();
  const matching = versions.filter(v => v.roleId === roleId && v.domain === domain);
  matching.sort((a, b) => b.version - a.version);
  return matching[0];
}

export async function listPromptVersions(roleId?: string): Promise<PromptVersion[]> {
  const versions = await loadVersions();
  if (roleId) return versions.filter(v => v.roleId === roleId).sort((a, b) => b.version - a.version);
  return versions.sort((a, b) => b.version - a.version);
}

export async function rollbackPrompt(roleId: string, domain: string, targetVersion: number): Promise<PromptVersion | undefined> {
  const versions = await loadVersions();
  const target = versions.find(v => v.roleId === roleId && v.domain === domain && v.version === targetVersion);
  if (!target) return undefined;

  // Create a new version that is a copy of the target
  const rollbackVersion: PromptVersion = {
    ...target,
    id: `pv_${Date.now()}_${randomUUID().slice(0, 8)}`,
    version: (await getLatestPromptVersion(roleId, domain))?.version ?? 0 + 1,
    optimizedAt: new Date().toISOString(),
    note: `Rollback to version ${targetVersion}`,
    previousVersionId: target.id,
  };

  versions.push(rollbackVersion);
  await saveVersions(versions.slice(-100));
  return rollbackVersion;
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`## ${sectionName}\\s*\\n([\\s\\S]*?)(?=## |$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}
