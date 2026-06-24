/**
 * browserRunbookEngine.ts
 * ============================================================
 * Browser Runbook Engine — ghi nhận và replay mọi phiên
 * browser automation. Mỗi lần Web AI chạy đều để lại
 * runbook entry với evidence, screenshot path, và timeline.
 * Hỗ trợ review lại toàn bộ phiên làm việc của agent.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export type BrowserRunbookAction =
  | 'login'
  | 'navigate'
  | 'type_prompt'
  | 'click_send'
  | 'wait_response'
  | 'extract_text'
  | 'extract_code'
  | 'capture_screenshot'
  | 'encounter_error'
  | 'quota_detected'
  | 'session_expired';

export interface BrowserRunbookStep {
  id: string;
  action: BrowserRunbookAction;
  timestamp: string;
  durationMs: number;
  success: boolean;
  detail: string;
  evidence?: {
    screenshotPath?: string;
    textPreview?: string;
    errorMessage?: string;
    selector?: string;
  };
}

export interface BrowserRunbookSession {
  id: string;
  platform: string;
  profileId?: string;
  profileName?: string;
  prompt: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: BrowserRunbookStep[];
  startedAt: string;
  completedAt?: string;
  totalDurationMs: number;
  modelUsed?: string;
  error?: string;
  artifacts: Array<{
    id: string;
    type: 'screenshot' | 'text' | 'code' | 'log';
    path?: string;
    content?: string;
    createdAt: string;
  }>;
  replayAvailable: boolean;
}

export interface RunbookSummary {
  totalSessions: number;
  completed: number;
  failed: number;
  averageDurationMs: number;
  byPlatform: Record<string, { total: number; failed: number; avgDurationMs: number }>;
  recentErrors: Array<{ platform: string; error: string; at: string }>;
}

// ─── Store ──────────────────────────────────────────────────────────
const RUNBOOK_FILE = path.join(process.cwd(), 'browser_runbook.json');
const ARTIFACTS_DIR = path.join(process.cwd(), 'artifacts', 'browser');

// Ensure artifacts dir exists
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// ─── In-memory sessions ─────────────────────────────────────────────
const activeSessions = new Map<string, BrowserRunbookSession>();

// ─── Persistence ────────────────────────────────────────────────────
async function readPersisted(): Promise<BrowserRunbookSession[]> {
  try {
    if (!fs.existsSync(RUNBOOK_FILE)) return [];
    return JSON.parse(await fs.promises.readFile(RUNBOOK_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function writePersisted(sessions: BrowserRunbookSession[]): Promise<void> {
  // Keep only last 500 sessions
  const trimmed = sessions.slice(-500);
  await fs.promises.writeFile(RUNBOOK_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
}

// ─── Public API ─────────────────────────────────────────────────────

export async function startBrowserSession(
  platform: string,
  prompt: string,
  profileId?: string,
  profileName?: string
): Promise<BrowserRunbookSession> {
  const id = `browser_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const session: BrowserRunbookSession = {
    id,
    platform,
    profileId,
    profileName,
    prompt: prompt.slice(0, 500),
    status: 'running',
    steps: [],
    startedAt: new Date().toISOString(),
    totalDurationMs: 0,
    artifacts: [],
    replayAvailable: true,
  };

  activeSessions.set(id, session);

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Browser Runbook',
    action: 'browser.session.start',
    target: platform,
    risk: 'LOW',
    status: 'executed',
    summary: `Browser session ${id} started for ${platform}`,
    connectorId: 'browser-runbook',
    evidence: { sessionId: id, profileId },
  }).catch(() => undefined);

  return session;
}

export function addRunbookStep(
  sessionId: string,
  action: BrowserRunbookAction,
  success: boolean,
  detail: string,
  evidence?: BrowserRunbookStep['evidence'],
  durationMs = 0
): BrowserRunbookStep | undefined {
  const session = activeSessions.get(sessionId);
  if (!session) return undefined;

  const step: BrowserRunbookStep = {
    id: randomUUID(),
    action,
    timestamp: new Date().toISOString(),
    durationMs,
    success,
    detail: detail.slice(0, 300),
    evidence,
  };

  session.steps.push(step);
  return step;
}

export async function completeBrowserSession(
  sessionId: string,
  success: boolean,
  modelUsed?: string,
  error?: string
): Promise<BrowserRunbookSession | undefined> {
  const session = activeSessions.get(sessionId);
  if (!session) return undefined;

  session.status = success ? 'completed' : 'failed';
  session.completedAt = new Date().toISOString();
  session.totalDurationMs = Date.now() - new Date(session.startedAt).getTime();
  session.modelUsed = modelUsed;
  session.error = error;

  // Persist to disk
  const persisted = await readPersisted();
  persisted.push({ ...session });
  await writePersisted(persisted);

  // Remove from active
  activeSessions.delete(sessionId);

  await appendAuditEvent({
    actor: 'system',
    workspace: 'Browser Runbook',
    action: 'browser.session.complete',
    target: session.platform,
    risk: session.status === 'failed' ? 'HIGH' : 'MEDIUM',
    status: session.status === 'completed' ? 'executed' : 'failed',
    summary: `Browser session ${sessionId} ${session.status} (${session.totalDurationMs}ms, ${session.steps.length} steps)`,
    connectorId: 'browser-runbook',
    evidence: { sessionId, status: session.status, steps: session.steps.length, modelUsed },
  }).catch(() => undefined);

  return session;
}

export function getActiveBrowserSession(id: string): BrowserRunbookSession | undefined {
  return activeSessions.get(id);
}

export function listActiveBrowserSessions(): BrowserRunbookSession[] {
  return Array.from(activeSessions.values());
}

export async function getRunbookHistory(limit = 50): Promise<BrowserRunbookSession[]> {
  const persisted = await readPersisted();
  return persisted.slice(-limit).reverse();
}

export async function getBrowserRunbookSummary(): Promise<RunbookSummary> {
  const all = await readPersisted();
  const byPlatform: Record<string, { total: number; failed: number; avgDurationMs: number }> = {};
  const recentErrors: RunbookSummary['recentErrors'] = [];

  for (const s of all) {
    const entry = byPlatform[s.platform] || { total: 0, failed: 0, avgDurationMs: 0 };
    entry.total++;
    if (s.status === 'failed') entry.failed++;
    entry.avgDurationMs = Math.round(
      (entry.avgDurationMs * (entry.total - 1) + s.totalDurationMs) / entry.total
    );
    byPlatform[s.platform] = entry;

    if (s.status === 'failed' && s.error) {
      recentErrors.push({ platform: s.platform, error: s.error, at: s.startedAt });
    }
  }

  return {
    totalSessions: all.length,
    completed: all.filter(s => s.status === 'completed').length,
    failed: all.filter(s => s.status === 'failed').length,
    averageDurationMs: all.length > 0
      ? Math.round(all.reduce((sum, s) => sum + s.totalDurationMs, 0) / all.length)
      : 0,
    byPlatform,
    recentErrors: recentErrors.slice(-10),
  };
}

export async function replayBrowserSession(sessionId: string): Promise<BrowserRunbookSession | undefined> {
  // Search in active first, then persisted
  const active = activeSessions.get(sessionId);
  if (active) return active;

  const persisted = await readPersisted();
  return persisted.find(s => s.id === sessionId);
}

export function addRunbookArtifact(
  sessionId: string,
  type: BrowserRunbookSession['artifacts'][number]['type'],
  content?: string,
  filePath?: string
): void {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  session.artifacts.push({
    id: randomUUID(),
    type,
    path: filePath,
    content: content?.slice(0, 5000),
    createdAt: new Date().toISOString(),
  });
}

export async function cancelBrowserSession(sessionId: string): Promise<boolean> {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  session.status = 'cancelled';
  session.completedAt = new Date().toISOString();
  session.totalDurationMs = Date.now() - new Date(session.startedAt).getTime();

  const persisted = await readPersisted();
  persisted.push({ ...session });
  await writePersisted(persisted);
  activeSessions.delete(sessionId);

  return true;
}

export async function cleanOldRunbookEntries(maxAgeDays = 30): Promise<number> {
  const all = await readPersisted();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const kept = all.filter(s => new Date(s.startedAt).getTime() > cutoff);
  await writePersisted(kept);
  return all.length - kept.length;
}
