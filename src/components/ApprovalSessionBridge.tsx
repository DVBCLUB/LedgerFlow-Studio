import { useEffect } from 'react';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type StepStatus = 'Todo' | 'Running' | 'Waiting Approval' | 'Done' | 'Blocked';
type SessionStatus = 'Draft' | 'Queued' | 'Running' | 'Waiting Approval' | 'Blocked' | 'Done';

type AgentSession = {
  id: string;
  title: string;
  kind: string;
  status: SessionStatus;
  risk: ApprovalRisk;
  goal: string;
  createdAt: string;
  currentStepId: string;
  steps: { id: string; title: string; owner: string; tool: string; status: StepStatus; note: string }[];
};

type SessionEvent = {
  id: string;
  at: string;
  sessionId: string;
  action: string;
  detail: string;
};

type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  risk: ApprovalRisk;
  action: string;
  details: string;
  createdAt: string;
  expiresAt: string;
  status: ApprovalStatus;
  approvedBy?: string;
  decidedAt?: string;
  sourceSessionId?: string;
};

type ApprovalEvent = {
  id: string;
  at: string;
  requestId: string;
  action: string;
  detail: string;
};

const SESSIONS_KEY = 'ledgerflow_agent_sessions_v1';
const SESSION_EVENTS_KEY = 'ledgerflow_agent_session_events_v1';
const APPROVALS_KEY = 'ledgerflow_approval_gate_requests_v1';
const APPROVAL_EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';
const REVIEW_MODE_KEY = 'ledgerflow_review_mode_v1';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isFastSecureMode() {
  const mode = readLocal<{ mode?: string }>(REVIEW_MODE_KEY, { mode: 'fast_secure' });
  return mode.mode !== 'strict_review';
}

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function appendSessionEvent(events: SessionEvent[], sessionId: string, action: string, detail: string) {
  return [{ id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`, at: new Date().toLocaleString('vi-VN'), sessionId, action, detail }, ...events].slice(0, 160);
}

function appendApprovalEvent(events: ApprovalEvent[], requestId: string, action: string, detail: string) {
  return [{ id: `approval-event-${Date.now()}-${Math.random().toString(16).slice(2)}`, at: new Date().toLocaleString('vi-VN'), requestId, action, detail }, ...events].slice(0, 160);
}

function approvalStepIsWaiting(session: AgentSession) {
  return session.steps.some((step) => step.tool === 'Approval Gate' && step.status === 'Waiting Approval');
}

function hasFastModeEvent(events: SessionEvent[], sessionId: string) {
  return events.some((event) => event.sessionId === sessionId && event.action === 'FAST_SECURE_REVIEW_DESK_APPROVAL_ONLY');
}

function syncApprovalSessions() {
  const sessions = readLocal<AgentSession[]>(SESSIONS_KEY, []);
  if (!sessions.length) return;

  const fastSecure = isFastSecureMode();
  let approvals = readLocal<ApprovalRequest[]>(APPROVALS_KEY, []);
  let approvalEvents = readLocal<ApprovalEvent[]>(APPROVAL_EVENTS_KEY, []);
  let sessionEvents = readLocal<SessionEvent[]>(SESSION_EVENTS_KEY, []);
  let changedApprovals = false;
  let changedSessions = false;
  let changedApprovalEvents = false;
  let changedSessionEvents = false;

  const approvalsBySession = new Map<string, ApprovalRequest>();
  for (const approval of approvals) {
    if (approval.sourceSessionId) approvalsBySession.set(approval.sourceSessionId, approval);
  }

  if (!fastSecure) {
    for (const session of sessions) {
      if ((session.risk === 'MEDIUM' || session.risk === 'HIGH') && approvalStepIsWaiting(session) && !approvalsBySession.has(session.id)) {
        const request: ApprovalRequest = {
          id: `approval-session-${session.id}-${Date.now()}`,
          title: `Duyệt phiên AI: ${session.title}`,
          source: `Agent Session · ${session.id}`,
          sourceSessionId: session.id,
          risk: session.risk,
          action: session.kind === 'Code' || session.kind === 'Integration' || session.kind === 'CI Fix' ? 'Cho phép đưa phiên sang Review Desk tạo Draft PR' : 'Cho phép AI tiếp tục xử lý phiên',
          details: `${session.goal}\n\nGuardrail: chỉ làm trong sandbox/Review Desk, không merge thẳng main, không ghi secret, không vượt phạm vi session.`,
          createdAt: new Date().toISOString(),
          expiresAt: addHours(2),
          status: 'Pending'
        };
        approvals = [request, ...approvals];
        approvalsBySession.set(session.id, request);
        approvalEvents = appendApprovalEvent(approvalEvents, request.id, 'AUTO_CREATED_FROM_SESSION', `Tự tạo approval request từ session ${session.id}.`);
        sessionEvents = appendSessionEvent(sessionEvents, session.id, 'APPROVAL_REQUEST_CREATED', `Tự tạo yêu cầu duyệt ${request.id}.`);
        changedApprovals = true;
        changedApprovalEvents = true;
        changedSessionEvents = true;
      }
    }
  }

  const nextSessions = sessions.map((session) => {
    const approval = approvalsBySession.get(session.id);
    const approvalStep = session.steps.find((step) => step.tool === 'Approval Gate');
    if (!approvalStep) return session;

    if (fastSecure && !approval && approvalStep.status === 'Waiting Approval') {
      changedSessions = true;
      if (!hasFastModeEvent(sessionEvents, session.id)) {
        changedSessionEvents = true;
        sessionEvents = appendSessionEvent(sessionEvents, session.id, 'FAST_SECURE_REVIEW_DESK_APPROVAL_ONLY', 'Fast Secure: bỏ approval phụ của session; Review Desk là lớp approve chính trước khi tạo Draft PR.');
      }
      const steps = session.steps.map((step) => step.tool === 'Approval Gate' ? { ...step, status: 'Done' as StepStatus } : step);
      const current = steps.find((step) => step.status !== 'Done') ?? steps[steps.length - 1];
      return { ...session, status: 'Running' as SessionStatus, currentStepId: current.id, steps };
    }

    if (!approval) return session;

    let nextStepStatus: StepStatus = approvalStep.status;
    let nextSessionStatus: SessionStatus = session.status;
    if (approval.status === 'Approved') {
      nextStepStatus = 'Done';
      nextSessionStatus = session.steps.every((step) => step.tool === 'Approval Gate' ? true : step.status === 'Done') ? 'Done' : 'Running';
    }
    if (approval.status === 'Rejected' || approval.status === 'Expired') {
      nextStepStatus = 'Blocked';
      nextSessionStatus = 'Blocked';
    }
    if (approval.status === 'Pending') {
      nextStepStatus = fastSecure ? 'Done' : 'Waiting Approval';
      nextSessionStatus = fastSecure ? 'Running' : 'Waiting Approval';
    }

    if (approvalStep.status === nextStepStatus && session.status === nextSessionStatus) return session;

    changedSessions = true;
    changedSessionEvents = true;
    sessionEvents = appendSessionEvent(sessionEvents, session.id, 'APPROVAL_STATUS_SYNCED', `Approval ${approval.id} đang là ${approval.status}, cập nhật session thành ${nextSessionStatus}.`);

    const steps = session.steps.map((step) => step.tool === 'Approval Gate' ? { ...step, status: nextStepStatus } : step);
    const current = steps.find((step) => step.status !== 'Done') ?? steps[steps.length - 1];
    return { ...session, status: nextSessionStatus, currentStepId: current.id, steps };
  });

  if (changedApprovals) writeLocal(APPROVALS_KEY, approvals);
  if (changedApprovalEvents) writeLocal(APPROVAL_EVENTS_KEY, approvalEvents);
  if (changedSessions) writeLocal(SESSIONS_KEY, nextSessions);
  if (changedSessionEvents) writeLocal(SESSION_EVENTS_KEY, sessionEvents);

  if (changedApprovals || changedSessions) {
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-session-sync'));
  }
}

export default function ApprovalSessionBridge() {
  useEffect(() => {
    syncApprovalSessions();
    const onSync = () => syncApprovalSessions();
    const timer = window.setInterval(syncApprovalSessions, 1200);
    window.addEventListener('ledgerflow-approval-gate-sync', onSync);
    window.addEventListener('ledgerflow-agent-session-sync', onSync);
    window.addEventListener('ledgerflow-review-mode-changed', onSync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('ledgerflow-approval-gate-sync', onSync);
      window.removeEventListener('ledgerflow-agent-session-sync', onSync);
      window.removeEventListener('ledgerflow-review-mode-changed', onSync);
    };
  }, []);

  return null;
}
