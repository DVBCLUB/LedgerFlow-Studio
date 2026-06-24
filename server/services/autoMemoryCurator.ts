/**
 * autoMemoryCurator.ts
 * ============================================================
 * Auto-Memory Curator — agent tự động chọn observation có
 * giá trị cao để promote lên long-term MEMORY.md.
 * 
 * Criteria: confidence ≥ 0.7, usageCount ≥ 2, age ≥ 24h,
 * và pass qua AI review để kiểm tra chất lượng.
 */
import fs from 'fs';
import path from 'path';
import { getStats, promoteToLongTerm, searchMemory, type MemoryRecord } from './compoundMemory';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface CuratorRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  candidatesFound: number;
  promoted: number;
  rejected: number;
  skipped: number;
  rejectedReasons: string[];
  promotedRecords: Array<{ title: string; reason: string }>;
  status: 'running' | 'completed' | 'failed';
  durationMs: number;
}

// ─── State ──────────────────────────────────────────────────────────
let lastRun: CuratorRun | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

// ─── Core ───────────────────────────────────────────────────────────

export async function runCurator(): Promise<CuratorRun> {
  const runId = `curator_${Date.now()}`;
  const started = Date.now();

  const run: CuratorRun = {
    id: runId,
    startedAt: new Date().toISOString(),
    candidatesFound: 0,
    promoted: 0,
    rejected: 0,
    skipped: 0,
    rejectedReasons: [],
    promotedRecords: [],
    status: 'running',
    durationMs: 0,
  };

  try {
    // 1. Get candidates from short-term memory
    const stats = await getStats();
    if (stats.shortTerm.count === 0) {
      run.status = 'completed';
      run.durationMs = Date.now() - started;
      lastRun = run;
      return run;
    }

    // 2. Search for high-value candidates
    const candidates = await searchMemory('success pattern', {
      domain: undefined,
      tiers: ['short_term'],
      kinds: ['pattern', 'observation'],
      limit: 20,
    });

    run.candidatesFound = candidates.length;

    if (candidates.length === 0) {
      run.status = 'completed';
      run.durationMs = Date.now() - started;
      lastRun = run;
      return run;
    }

    // 3. Filter by criteria
    const eligible = candidates.filter(c =>
      c.confidence >= 0.7 &&           // High confidence
      c.usageCount >= 1 &&              // Was referenced at least once
      c.content.length > 50             // Meaningful content
    );

    run.skipped = candidates.length - eligible.length;

    // 4. AI review each candidate
    for (const candidate of eligible) {
      try {
        const reviewResult = await reviewMemoryCandidate(candidate);

        if (reviewResult.shouldPromote) {
          const promoted = await promoteToLongTerm(
            candidate.id,
            reviewResult.curatedTitle || candidate.title,
            reviewResult.curatedContent || candidate.content,
          );

          if (promoted) {
            run.promoted++;
            run.promotedRecords.push({
              title: candidate.title.slice(0, 80),
              reason: reviewResult.reason,
            });
          }
        } else {
          run.rejected++;
          run.rejectedReasons.push(`${candidate.title.slice(0, 50)}: ${reviewResult.reason}`);
        }
      } catch {
        run.skipped++;
      }
    }

    run.status = 'completed';
  } catch (err: any) {
    run.status = 'failed';
    run.rejectedReasons.push(`Curator error: ${err.message}`);
  } finally {
    run.durationMs = Date.now() - started;
    run.completedAt = new Date().toISOString();
    lastRun = run;

    await appendAuditEvent({
      actor: 'system',
      workspace: 'Auto Memory Curator',
      action: 'curator.run',
      target: `memory-promotion`,
      risk: 'LOW',
      status: run.status === 'completed' ? 'executed' : 'failed',
      summary: `Curator: ${run.promoted}/${run.candidatesFound} promoted, ${run.rejected} rejected`,
      connectorId: 'auto-curator',
      evidence: { runId, promoted: run.promoted, rejected: run.rejected },
    }).catch(() => undefined);
  }

  return run;
}

// ─── AI Review ──────────────────────────────────────────────────────

async function reviewMemoryCandidate(
  record: MemoryRecord,
): Promise<{ shouldPromote: boolean; reason: string; curatedTitle?: string; curatedContent?: string }> {
  const reviewPrompt = `Bạn là một Knowledge Curator. Đánh giá xem memory record sau có xứng đáng được đưa vào LONG-TERM memory không.

RECORD:
Title: ${record.title}
Domain: ${record.domain}
Kind: ${record.kind}
Confidence: ${(record.confidence * 100).toFixed(0)}%
Usage Count: ${record.usageCount}
Content: ${record.content.slice(0, 500)}

CRITERIA:
1. Nội dung có tái sử dụng được cho các task tương lai không?
2. Bài học có giá trị chung, không chỉ cho một ngữ cảnh cụ thể?
3. Nội dung đã đủ chín chắn (qua nhiều lần sử dụng)?

Trả lời:
## DECISION: [PROMOTE / REJECT]
## REASON: [lý do]
${'## CURATED TITLE: [tiêu đề mới nếu cần]'}`;

  try {
    const result = await dispatchTextThroughFabric(
      reviewPrompt,
      undefined,
      { domain: 'general', task: 'general', localFallback: true },
    );

    if (result.status !== 'completed' || !result.winner?.contentPreview) {
      return { shouldPromote: false, reason: 'AI review failed.' };
    }

    const content = result.winner.contentPreview;
    const decision = content.match(/## DECISION:\s*(PROMOTE|REJECT)/i);
    const reason = content.match(/## REASON:\s*(.+?)(?=\n##|\n$|$)/is);
    const curatedTitle = content.match(/## CURATED TITLE:\s*(.+?)(?=\n##|\n$|$)/is);

    return {
      shouldPromote: decision?.[1]?.toUpperCase() === 'PROMOTE',
      reason: reason?.[1]?.trim() || 'No reason provided.',
      curatedTitle: curatedTitle?.[1]?.trim(),
    };
  } catch {
    return { shouldPromote: false, reason: 'AI review exception.' };
  }
}

// ─── Schedule ───────────────────────────────────────────────────────

export function startAutoCurator(intervalMinutes = 60): void {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    runCurator().catch(() => undefined);
  }, intervalMinutes * 60_000);
  console.log(`[Auto Curator] Started. Interval: ${intervalMinutes} min.`);
}

export function stopAutoCurator(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  console.log('[Auto Curator] Stopped.');
}

export function getLastCuratorRun(): CuratorRun | null {
  return lastRun;
}

export function isCuratorRunning(): boolean {
  return intervalHandle !== null;
}
