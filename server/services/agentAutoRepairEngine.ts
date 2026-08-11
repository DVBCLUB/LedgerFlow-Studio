/**
 * agentAutoRepairEngine.ts
 * ============================================================
 * Autonomous Self-Healing & Patch Repair Engine for LedgerFlow OS.
 *
 * Workflow:
 *  1. Ingest error log or test failure stack trace.
 *  2. AI Diagnosis: Analyze root cause & identify suspect files.
 *  3. Dynamic Risk Check: Assess repair plan risk via dynamicRiskMatrix.
 *  4. Enqueue Durable Repair Loop: Launch 30-min background job via agentLoopJobRunner.
 *  5. Persistence & Audit: Save session history to runtime/agent_auto_repair_sessions.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric.ts';
import { enqueueAgentLoopJob, getAgentLoopJobStatus } from './agentLoopJobRunner.ts';
import { assessActionRisk, type RiskAssessmentResult } from './dynamicRiskMatrix.ts';
import { recordObservation } from './compoundMemory.ts';
import { appendAuditEvent } from './auditLog.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutoRepairRequest {
  errorLog: string;
  targetFile?: string;
  goal?: string;
  source?: string;
  requestedBy?: string;
}

export interface AutoRepairDiagnosis {
  rootCause: string;
  suspectFiles: string[];
  suggestedFix: string;
  confidence: number;
}

export interface AutoRepairSession {
  id: string;
  goal: string;
  source: string;
  requestedBy: string;
  status: 'diagnosing' | 'repairing' | 'completed' | 'failed' | 'waiting_approval';
  errorLog: string;
  targetFile?: string;
  diagnosis?: AutoRepairDiagnosis;
  riskAssessment?: RiskAssessmentResult;
  backgroundJobId?: string;
  patchSummary?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface AutoRepairStore {
  sessions: Record<string, AutoRepairSession>;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

let store: AutoRepairStore = { sessions: {} };
let writeQueue = Promise.resolve();

function storagePath(): string {
  return resolveRuntimePathFromEnv('AUTO_REPAIR_STORE_FILE', 'agent_auto_repair_sessions.json');
}

async function loadStore(): Promise<void> {
  try {
    const filePath = storagePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      store = { sessions: parsed.sessions || {} };
    }
  } catch {
    store = { sessions: {} };
  }
}

async function saveStore(): Promise<void> {
  ensureRuntimeRootSync();
  const target = storagePath();
  await fs.promises.writeFile(target, JSON.stringify(store, null, 2), 'utf8');
}

function queueSave(): void {
  const task = () => saveStore().catch(() => undefined);
  writeQueue = writeQueue.then(task, task);
}

loadStore().catch(() => undefined);

// ─── Core Repair Engine ───────────────────────────────────────────────────────

/**
 * Triggers an autonomous repair session based on an error log or stack trace.
 */
export async function triggerAutoRepairSession(request: AutoRepairRequest): Promise<AutoRepairSession> {
  const sessionId = `repair_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const requestedBy = request.requestedBy || 'system';
  const source = request.source || 'ci_doctor';

  const session: AutoRepairSession = {
    id: sessionId,
    goal: request.goal || `Auto-repair error: ${request.errorLog.slice(0, 80)}`,
    source,
    requestedBy,
    status: 'diagnosing',
    errorLog: request.errorLog,
    targetFile: request.targetFile,
    createdAt: now,
    updatedAt: now,
  };

  store.sessions[sessionId] = session;
  queueSave();

  await appendAuditEvent({
    actor: requestedBy,
    workspace: 'AI-Ops',
    action: 'auto_repair.triggered',
    target: sessionId,
    risk: 'MEDIUM',
    status: 'executed',
    summary: `Auto-repair session ${sessionId} started for error: ${request.errorLog.slice(0, 60)}`,
    evidence: { sessionId, targetFile: request.targetFile, source },
  }).catch(() => undefined);

  // Phase 1: Diagnose Error with AI
  const prompt = [
    'Bạn là AI Auto-Repair Diagnostic Agent chuyên phân tích stack trace và lỗi runtime.',
    'Mục tiêu: Tìm nguyên nhân gốc (root cause) và danh sách file nghi vấn.',
    '',
    `TARGET FILE: ${request.targetFile || 'unspecified'}`,
    `ERROR LOG:\n${request.errorLog.slice(0, 1500)}`,
    '',
    'Trả về JSON theo format:',
    '{',
    '  "rootCause": "mô tả nguyên nhân gốc ngắn gọn",',
    '  "suspectFiles": ["path/to/file.ts"],',
    '  "suggestedFix": "đề xuất sửa lỗi",',
    '  "confidence": 0.85',
    '}',
  ].join('\n');

  try {
    const result = await dispatchTextThroughFabric(prompt, undefined, {
      domain: 'coding',
      task: 'analysis',
      localFallback: true,
    });

    let diagnosis: AutoRepairDiagnosis = {
      rootCause: 'Unable to parse stack trace automatically.',
      suspectFiles: request.targetFile ? [request.targetFile] : [],
      suggestedFix: 'Review error log manually.',
      confidence: 0.5,
    };

    if (result.status === 'completed' && result.winner?.contentPreview) {
      try {
        const jsonMatch = result.winner.contentPreview.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          diagnosis = {
            rootCause: parsed.rootCause || diagnosis.rootCause,
            suspectFiles: Array.isArray(parsed.suspectFiles) ? parsed.suspectFiles : diagnosis.suspectFiles,
            suggestedFix: parsed.suggestedFix || diagnosis.suggestedFix,
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
          };
        }
      } catch {
        // Fallback to text diagnosis
        diagnosis.rootCause = result.winner.contentPreview.slice(0, 200);
      }
    }

    session.diagnosis = diagnosis;
    session.status = 'repairing';
    session.updatedAt = new Date().toISOString();

    // Phase 2: Assess Risk
    const riskAssessment = assessActionRisk({
      actionId: 'write_file',
      category: 'write',
      agentRole: 'AI Dev',
      domain: 'coding',
      environment: 'sandbox',
      payload: { targetFile: request.targetFile, diagnosis },
    });
    session.riskAssessment = riskAssessment;

    // Phase 3: Enqueue Background Repair Loop Job
    const repairGoal = `Auto-repair patch for ${diagnosis.suspectFiles[0] || 'codebase'}: ${diagnosis.rootCause}`;
    const jobId = enqueueAgentLoopJob(
      {
        goal: repairGoal,
        domain: 'coding',
        maxLoops: 4,
        autoRepair: true,
        stopOnFirstError: true,
        sandboxMode: 'isolated',
        testCommand: 'npm test',
        systemInstruction: `Suggested Fix: ${diagnosis.suggestedFix}\nRoot Cause: ${diagnosis.rootCause}`,
        requestedBy: `auto-repair:${sessionId}`,
      },
      { priority: 'high', timeoutMs: 20 * 60 * 1000 },
    );

    session.backgroundJobId = jobId;
    session.updatedAt = new Date().toISOString();
    queueSave();

    // Record learning observation
    await recordObservation(
      'coding',
      `Auto-repair session ${sessionId}`,
      `Root cause: ${diagnosis.rootCause}. Suspects: ${diagnosis.suspectFiles.join(', ')}`,
      diagnosis.confidence,
      `auto-repair:${sessionId}`,
      true,
    ).catch(() => undefined);
  } catch (err: any) {
    session.status = 'failed';
    session.updatedAt = new Date().toISOString();
    session.patchSummary = `Diagnosis failed: ${err.message}`;
    queueSave();
  }

  return session;
}

/**
 * Gets status of an auto-repair session.
 */
export function getAutoRepairSession(sessionId: string): AutoRepairSession | null {
  const session = store.sessions[sessionId];
  if (!session) return null;

  // Sync status if background job exists
  if (session.backgroundJobId && session.status === 'repairing') {
    const jobStatus = getAgentLoopJobStatus(session.backgroundJobId);
    if (jobStatus) {
      if (jobStatus.status === 'completed') {
        session.status = 'completed';
        session.completedAt = jobStatus.completedAt;
        session.patchSummary = jobStatus.result || 'Repair job completed successfully.';
        session.updatedAt = new Date().toISOString();
        queueSave();
      } else if (jobStatus.status === 'failed' || jobStatus.status === 'dead_letter') {
        session.status = 'failed';
        session.completedAt = jobStatus.completedAt;
        session.patchSummary = jobStatus.error || 'Repair job failed.';
        session.updatedAt = new Date().toISOString();
        queueSave();
      }
    }
  }

  return session;
}

/**
 * Lists all recent auto-repair sessions.
 */
export function listAutoRepairSessions(limit = 20): AutoRepairSession[] {
  return Object.values(store.sessions)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Helper for unit tests to clear store.
 */
export async function clearAutoRepairStoreForTest(): Promise<void> {
  store = { sessions: {} };
  await saveStore();
}
