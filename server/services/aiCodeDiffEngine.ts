/**
 * aiCodeDiffEngine.ts
 * ============================================================
 * AI Multi-File Code Diff Review & Hunk-Level Apply Engine for LedgerFlow OS.
 *
 * Provides diff calculation, hunk review, and single-click or selective hunk application:
 *  - Calculates line-by-line diffs between original and AI proposed code.
 *  - Groups changes into reviewable Diff Hunks.
 *  - Supports selective Hunk-level Accept / Reject decisions.
 *  - Performs clean patching of target files with audit logging.
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { safeWriteFile, safeReadFile } from './safeFileManager.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiffChangeType = 'add' | 'remove' | 'keep';

export interface DiffLine {
  type: DiffChangeType;
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffHunk {
  id: string;
  header: string;             // E.g. "@@ -12,5 +12,8 @@"
  oldStart: number;
  oldLinesCount: number;
  newStart: number;
  newLinesCount: number;
  lines: DiffLine[];
  accepted: boolean;          // Default true until user rejects
}

export interface FileDiffSession {
  id: string;
  targetFilePath: string;
  originalContent: string;
  proposedContent: string;
  hunks: DiffHunk[];
  status: 'pending' | 'partially_accepted' | 'accepted' | 'rejected' | 'applied';
  createdAt: string;
  updatedAt: string;
}

// ─── Core Diff Algorithm ──────────────────────────────────────────────────────

export function computeFileDiff(
  targetFilePath: string,
  originalContent: string,
  proposedContent: string
): FileDiffSession {
  const sessionId = `diff_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const oldLines = originalContent.split('\n');
  const newLines = proposedContent.split('\n');

  const lines: DiffLine[] = [];
  let i = 0, j = 0;
  let oldLineNo = 1, newLineNo = 1;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      lines.push({ type: 'keep', oldLineNumber: oldLineNo++, newLineNumber: newLineNo++, content: oldLines[i] });
      i++;
      j++;
    } else if (j < newLines.length && (i >= oldLines.length || !oldLines.slice(i).includes(newLines[j]))) {
      lines.push({ type: 'add', newLineNumber: newLineNo++, content: newLines[j] });
      j++;
    } else if (i < oldLines.length) {
      lines.push({ type: 'remove', oldLineNumber: oldLineNo++, content: oldLines[i] });
      i++;
    }
  }

  // Group into Hunks around changed lines
  const hunks: DiffHunk[] = [];
  let currentHunkLines: DiffLine[] = [];
  let hunkIdCount = 1;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const isChange = line.type !== 'keep';

    if (isChange || currentHunkLines.some((l) => l.type !== 'keep')) {
      currentHunkLines.push(line);
    }

    const nextIsChange = idx < lines.length - 1 && lines[idx + 1].type !== 'keep';
    if (!nextIsChange && currentHunkLines.length > 0 && currentHunkLines.filter((l) => l.type !== 'keep').length > 0) {
      const added = currentHunkLines.filter((l) => l.type === 'add').length;
      const removed = currentHunkLines.filter((l) => l.type === 'remove').length;

      hunks.push({
        id: `hunk_${hunkIdCount++}`,
        header: `@@ -${currentHunkLines[0].oldLineNumber || 1},${removed} +${currentHunkLines[0].newLineNumber || 1},${added} @@`,
        oldStart: currentHunkLines[0].oldLineNumber || 1,
        oldLinesCount: removed,
        newStart: currentHunkLines[0].newLineNumber || 1,
        newLinesCount: added,
        lines: currentHunkLines,
        accepted: true,
      });

      currentHunkLines = [];
    }
  }

  return {
    id: sessionId,
    targetFilePath,
    originalContent,
    proposedContent,
    hunks,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function setHunkAcceptedState(session: FileDiffSession, hunkId: string, accepted: boolean): FileDiffSession {
  const hunk = session.hunks.find((h) => h.id === hunkId);
  if (hunk) {
    hunk.accepted = accepted;
  }
  const anyAccepted = session.hunks.some((h) => h.accepted);
  const anyRejected = session.hunks.some((h) => !h.accepted);

  session.status = anyAccepted && anyRejected ? 'partially_accepted' : anyAccepted ? 'accepted' : 'rejected';
  session.updatedAt = new Date().toISOString();
  return session;
}

export function applyAcceptedDiff(session: FileDiffSession): string {
  // If all hunks accepted, return proposedContent
  if (session.hunks.every((h) => h.accepted)) {
    return session.proposedContent;
  }
  // If all hunks rejected, return originalContent
  if (session.hunks.every((h) => !h.accepted)) {
    return session.originalContent;
  }

  const resultLines: string[] = [];
  const origLines = session.originalContent.split('\n');

  // If partially accepted, apply changes from accepted hunks only
  for (const hunk of session.hunks) {
    for (const line of hunk.lines) {
      if (hunk.accepted) {
        if (line.type === 'add' || line.type === 'keep') {
          resultLines.push(line.content);
        }
      } else {
        if (line.type === 'remove' || line.type === 'keep') {
          resultLines.push(line.content);
        }
      }
    }
  }

  return resultLines.length > 0 ? resultLines.join('\n') : session.originalContent;
}

export async function writeDiffToFile(session: FileDiffSession): Promise<{ success: boolean; path: string }> {
  const finalContent = applyAcceptedDiff(session);
  await safeWriteFile(session.targetFilePath, finalContent);

  session.status = 'applied';
  session.updatedAt = new Date().toISOString();

  await appendAuditEvent({
    actor: 'diff-engine',
    workspace: 'Code Review',
    action: 'code_diff.applied',
    target: session.targetFilePath,
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Applied code diff to ${session.targetFilePath} (${session.hunks.filter((h) => h.accepted).length}/${session.hunks.length} hunks accepted)`,
    evidence: { sessionId: session.id, path: session.targetFilePath, hunks: session.hunks.length },
  }).catch(() => undefined);

  return { success: true, path: session.targetFilePath };
}
