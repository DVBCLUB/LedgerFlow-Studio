import { useEffect } from 'react';
import type { ApprovalRequest, ApprovalStatus, SessionStatus, StepStatus } from '../../types/agentOps';

const SESSION_KEYS = ['ledgerflow_agent_sessions_v1', 'ledgerflow-agent-session-queue-v1'];
const SESSION_EVENTS_KEY = 'ledgerflow_agent_session_events_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const APPROVAL_LEGACY_KEY = 'ledgerflow-approval-gate-v1';
const APPROVAL_EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';
const REVIEW_MODE_KEY = 'ledgerflow_review_mode_v1';
const PREFILL_KEY = 'ledgerflow_review_desk_prefill_v1';
const LAST_APPROVED_KEY = 'ledgerflow_approval_review_desk_last_prefill_v1';

const APPROVAL_PHRASE = 'APPROVE AI GITHUB PUSH';

type AgentSessionRecord = {
  id: string;
  title: string;
  kind?: string;
  status: SessionStatus | string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  goal?: string;
  request?: string;
  createdAt?: string;
  currentStepId?: string;
  steps?: { id: string; title: string; owner: string; tool: string; status: StepStatus | string; note: string }[];
};

type TimelineEvent = {
  id: string;
  at: string;
  requestId?: string;
  sessionId?: string;
  action: string;
  detail: string;
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function readFirstArray<T>(keys: string[]): T[] {
  for (const key of keys) {
    const value = readLocal<T[]>(key, []);
    if (value.length) return value;
  }
  return [];
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function appendEvent(events: TimelineEvent[], action: string, detail: string, ids: Partial<TimelineEvent>) {
  return [{ id: `agentops-event-${Date.now()}-${Math.random().toString(16).slice(2)}`, at: new Date().toLocaleString('vi-VN'), action, detail, ...ids }, ...events].slice(0, 160);
}

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function isFastMode() {
  const mode = readLocal<{ mode?: string }>(REVIEW_MODE_KEY, { mode: 'Strict' });
  return mode.mode === 'Fast' || mode.mode === 'fast_secure';
}

function approvalStepIsWaiting(session: AgentSessionRecord) {
  return (session.steps ?? []).some((step) => step.tool === 'Approval Gate' && step.status === 'Waiting Approval');
}

function isExpired(request: ApprovalRequest) {
  if (request.expiresAt === 'Mặc định') return false;
  const time = new Date(request.expiresAt).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function safeBranchName(title: string) {
  return `ai/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'approved-change'}`;
}

function syncSessionsToApprovals() {
  const sessions = readFirstArray<AgentSessionRecord>(SESSION_KEYS);
  if (!sessions.length) return;

  const fastMode = isFastMode();
  let approvals = readFirstArray<ApprovalRequest>([APPROVAL_KEY, APPROVAL_LEGACY_KEY]);
  let approvalEvents = readLocal<TimelineEvent[]>(APPROVAL_EVENTS_KEY, []);
  let sessionEvents = readLocal<TimelineEvent[]>(SESSION_EVENTS_KEY, []);
  let changedApprovals = false;
  let changedSessions = false;
  let changedApprovalEvents = false;
  let changedSessionEvents = false;

  const approvalsBySession = new Map<string, ApprovalRequest>();
  approvals.forEach((approval) => {
    if (approval.sourceSessionId) approvalsBySession.set(approval.sourceSessionId, approval);
  });

  if (!fastMode) {
    for (const session of sessions) {
      if ((session.risk === 'MEDIUM' || session.risk === 'HIGH') && approvalStepIsWaiting(session) && !approvalsBySession.has(session.id)) {
        const request: ApprovalRequest = {
          id: `approval-session-${session.id}-${Date.now()}`,
          title: `Duyệt phiên AI: ${session.title}`,
          source: `Agent Session · ${session.id}`,
          sourceSessionId: session.id,
          risk: session.risk,
          action: session.kind === 'Code' || session.kind === 'Integration' || session.kind === 'CI Fix' ? 'Cho phép đưa phiên sang Review Desk tạo Draft PR' : 'Cho phép AI tiếp tục xử lý phiên',
          details: `${session.goal ?? session.request ?? ''}\n\nGuardrail: chỉ làm trong sandbox/Review Desk, không merge thẳng main, không ghi secret, không vượt phạm vi session.`,
          createdAt: new Date().toISOString(),
          expiresAt: addHours(2),
          status: 'Pending'
        };
        approvals = [request, ...approvals];
        approvalsBySession.set(session.id, request);
        approvalEvents = appendEvent(approvalEvents, 'AUTO_CREATED_FROM_SESSION', `Tự tạo approval request từ session ${session.id}.`, { requestId: request.id });
        sessionEvents = appendEvent(sessionEvents, 'APPROVAL_REQUEST_CREATED', `Tự tạo yêu cầu duyệt ${request.id}.`, { sessionId: session.id });
        changedApprovals = true;
        changedApprovalEvents = true;
        changedSessionEvents = true;
      }
    }
  }

  const nextSessions = sessions.map((session) => {
    const approval = approvalsBySession.get(session.id);
    const approvalStep = (session.steps ?? []).find((step) => step.tool === 'Approval Gate');
    if (!approvalStep) return session;

    let nextStepStatus = approvalStep.status as StepStatus;
    let nextSessionStatus = session.status as SessionStatus;

    if (fastMode && !approval && approvalStep.status === 'Waiting Approval') {
      nextStepStatus = 'Done';
      nextSessionStatus = 'Running';
    } else if (approval?.status === 'Approved') {
      nextStepStatus = 'Done';
      nextSessionStatus = (session.steps ?? []).every((step) => step.tool === 'Approval Gate' || step.status === 'Done') ? 'Done' : 'Running';
    } else if (approval?.status === 'Rejected' || approval?.status === 'Expired') {
      nextStepStatus = 'Blocked';
      nextSessionStatus = 'Blocked';
    } else if (approval?.status === 'Pending') {
      nextStepStatus = fastMode ? 'Done' : 'Waiting Approval';
      nextSessionStatus = fastMode ? 'Running' : 'Waiting Approval';
    }

    if (approvalStep.status === nextStepStatus && session.status === nextSessionStatus) return session;

    changedSessions = true;
    changedSessionEvents = true;
    sessionEvents = appendEvent(sessionEvents, 'APPROVAL_STATUS_SYNCED', `Approval ${approval?.id ?? 'fast-mode'} cập nhật session thành ${nextSessionStatus}.`, { sessionId: session.id });
    const steps = (session.steps ?? []).map((step) => step.tool === 'Approval Gate' ? { ...step, status: nextStepStatus } : step);
    const current = steps.find((step) => step.status !== 'Done') ?? steps[steps.length - 1];
    return { ...session, status: nextSessionStatus, currentStepId: current?.id ?? session.currentStepId, steps };
  });

  if (changedApprovals) writeLocal(APPROVAL_KEY, approvals);
  if (changedApprovalEvents) writeLocal(APPROVAL_EVENTS_KEY, approvalEvents);
  if (changedSessions) writeLocal(SESSION_KEYS[0], nextSessions);
  if (changedSessionEvents) writeLocal(SESSION_EVENTS_KEY, sessionEvents);
  if (changedApprovals || changedSessions) window.dispatchEvent(new CustomEvent('ledgerflow-approval-session-sync'));
}

function syncApprovedToReviewDesk() {
  const requests = readFirstArray<ApprovalRequest>([APPROVAL_KEY, APPROVAL_LEGACY_KEY]);
  const currentPrefill = readLocal<{ sourceApprovalId?: string } | null>(PREFILL_KEY, null);
  const last = readLocal<{ approvalId?: string; decidedAt?: string } | null>(LAST_APPROVED_KEY, null);

  const approved = requests
    .filter((request) => request.status === 'Approved' as ApprovalStatus)
    .filter((request) => !isExpired(request))
    .sort((a, b) => new Date(b.decidedAt ?? b.createdAt).getTime() - new Date(a.decidedAt ?? a.createdAt).getTime())[0];

  if (!approved) return;
  if (last?.approvalId === approved.id && last?.decidedAt === approved.decidedAt) return;
  if (currentPrefill?.sourceApprovalId === approved.id) return;

  const prefill = {
    sourceApprovalId: approved.id,
    sourceSessionId: approved.sourceSessionId,
    title: approved.title,
    branchName: safeBranchName(approved.title),
    summary: [approved.details, '', `Approval ID: ${approved.id}`, `Approval source: ${approved.source}`, `Action: ${approved.action}`, `Risk: ${approved.risk}`].join('\n'),
    approvalPhrase: APPROVAL_PHRASE,
    filePath: 'docs/APPROVED_AI_CHANGE.md',
    fileContent: [`# ${approved.title}`, '', '## Approved action', '', approved.action, '', '## Details', '', approved.details].join('\n')
  };

  localStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
  localStorage.setItem(LAST_APPROVED_KEY, JSON.stringify({ approvalId: approved.id, decidedAt: approved.decidedAt }));
  const events = appendEvent(readLocal<TimelineEvent[]>(APPROVAL_EVENTS_KEY, []), 'AUTO_PREFILL_REVIEW_DESK', 'Tạo prefill Review Desk từ approval còn hạn.', { requestId: approved.id });
  writeLocal(APPROVAL_EVENTS_KEY, events);
  window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill', { detail: prefill }));
}

function syncApprovalGate() {
  syncSessionsToApprovals();
  syncApprovedToReviewDesk();
}

export function useApprovalGateSync() {
  useEffect(() => {
    syncApprovalGate();
    const sync = () => syncApprovalGate();
    const timer = window.setInterval(sync, 2500);
    window.addEventListener('ledgerflow-approval-gate-sync', sync);
    window.addEventListener('ledgerflow-approval-gate-changed', sync);
    window.addEventListener('ledgerflow-agent-session-sync', sync);
    window.addEventListener('ledgerflow-review-mode-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-approval-gate-sync', sync);
      window.removeEventListener('ledgerflow-approval-gate-changed', sync);
      window.removeEventListener('ledgerflow-agent-session-sync', sync);
      window.removeEventListener('ledgerflow-review-mode-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
}
