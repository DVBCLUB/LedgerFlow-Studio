import { useEffect } from 'react';
import type { SessionStatus, SessionStep, StepStatus } from '../types/agentOps';

type AgentSession = {
  id: string;
  title: string;
  kind: string;
  status: SessionStatus;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  goal: string;
  createdAt: string;
  currentStepId: string;
  steps: SessionStep[];
};

type SessionEvent = {
  id: string;
  at: string;
  sessionId: string;
  action: string;
  detail: string;
};

type ReviewResult = {
  sourceSessionId?: string;
  sourceCardId?: string;
  repo?: string;
  branch?: string;
  prNumber?: number | null;
  prUrl?: string | null;
  status?: string;
  workflowStatus?: string | null;
  conclusion?: string | null;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function appendEvent(events: SessionEvent[], sessionId: string, action: string, detail: string): SessionEvent[] {
  return [{ id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, at: new Date().toLocaleString('vi-VN'), sessionId, action, detail }, ...events].slice(0, 160);
}

function markStep(steps: SessionStep[], keywords: string[], status: StepStatus, extraNote?: string) {
  let changed = false;
  const next = steps.map((step) => {
    const haystack = `${step.id} ${step.title} ${step.tool}`.toLowerCase();
    if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      changed = true;
      return { ...step, status, note: extraNote ? `${step.note}\n${extraNote}` : step.note };
    }
    return step;
  });
  return { steps: next, changed };
}

function deriveSessionStatus(steps: SessionStep[], fallback: SessionStatus): SessionStatus {
  if (steps.every((step) => step.status === 'Done')) return 'Done';
  if (steps.some((step) => step.status === 'Blocked')) return 'Blocked';
  if (steps.some((step) => step.status === 'Waiting Approval')) return 'Waiting Approval';
  if (steps.some((step) => step.status === 'Running')) return 'Running';
  return fallback;
}

function syncReviewResult(result: ReviewResult) {
  if (!result?.sourceSessionId) return;
  const sessions = readJson<AgentSession[]>('ledgerflow_agent_sessions_v1', []);
  if (!sessions.length) return;
  const events = readJson<SessionEvent[]>('ledgerflow_agent_session_events_v1', []);
  let found = false;

  const nextSessions = sessions.map((session) => {
    if (session.id !== result.sourceSessionId) return session;
    found = true;
    const prText = result.prNumber ? `PR #${result.prNumber}` : 'PR draft';
    const linkText = result.prUrl ? ` (${result.prUrl})` : '';
    const review = markStep(session.steps, ['review', 'pr draft', 'review desk'], 'Done', `${prText}${linkText} đã được tạo/cập nhật.`);
    let steps = review.steps;
    if (result.workflowStatus || result.conclusion) {
      const ciStatus: StepStatus = result.conclusion === 'success' ? 'Done' : result.conclusion ? 'Blocked' : result.workflowStatus === 'completed' ? 'Done' : 'Running';
      steps = markStep(steps, ['ci', 'build monitor', 'recovery'], ciStatus, `CI: ${result.workflowStatus ?? 'unknown'} / ${result.conclusion ?? 'pending'}.`).steps;
    }
    return { ...session, steps, status: deriveSessionStatus(steps, 'Running'), currentStepId: steps.find((step) => step.status !== 'Done')?.id ?? steps[steps.length - 1]?.id ?? session.currentStepId };
  });

  if (!found) return;
  const detail = `Review Desk cập nhật session: ${result.repo ?? 'repo'} · ${result.branch ?? 'branch'} · ${result.prNumber ? `PR #${result.prNumber}` : 'draft'} · ${result.conclusion ?? result.workflowStatus ?? 'pending'}.`;
  writeJson('ledgerflow_agent_sessions_v1', nextSessions);
  writeJson('ledgerflow_agent_session_events_v1', appendEvent(events, result.sourceSessionId, 'REVIEW_DESK_RESULT_SYNCED', detail));
  window.dispatchEvent(new CustomEvent('ledgerflow-agent-session-synced', { detail: result }));
}

function syncLatestReviewDeskResult() {
  const result = readJson<ReviewResult | null>('ledgerflow_review_desk_last_result_v1', null);
  if (result?.sourceSessionId) syncReviewResult(result);
}

export default function SessionResultBridge() {
  useEffect(() => {
    const onReviewResult = (event: Event) => {
      const detail = (event as CustomEvent<ReviewResult>).detail;
      if (detail) syncReviewResult(detail);
      syncLatestReviewDeskResult();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'ledgerflow_review_desk_last_result_v1') syncLatestReviewDeskResult();
    };
    window.addEventListener('ledgerflow-review-desk-result', onReviewResult);
    window.addEventListener('storage', onStorage);
    syncLatestReviewDeskResult();
    return () => {
      window.removeEventListener('ledgerflow-review-desk-result', onReviewResult);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}
