import { useEffect } from 'react';

type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired';
type ApprovalRisk = 'LOW' | 'MEDIUM' | 'HIGH';

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

const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const EVENTS_KEY = 'ledgerflow_approval_gate_events_v1';
const PREFILL_KEY = 'ledgerflow_review_desk_prefill_v1';
const LAST_APPROVED_KEY = 'ledgerflow_approval_review_desk_last_prefill_v1';
const REQUIRED_PHRASE = 'APPROVE AI GITHUB PUSH';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeEvent(requestId: string, action: string, detail: string) {
  const events = readLocal<ApprovalEvent[]>(EVENTS_KEY, []);
  const next: ApprovalEvent[] = [{ id: `approval-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), requestId, action, detail }, ...events].slice(0, 160);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
}

function isExpired(request: ApprovalRequest) {
  if (request.expiresAt === 'Mặc định') return false;
  const time = new Date(request.expiresAt).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function safeBranchName(title: string) {
  return `ai/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42) || 'approved-change'}`;
}

function createReviewPrefill(request: ApprovalRequest) {
  return {
    sourceApprovalId: request.id,
    sourceSessionId: request.sourceSessionId,
    title: request.title,
    branchName: safeBranchName(request.title),
    summary: [
      request.details,
      '',
      `Approval ID: ${request.id}`,
      `Approval source: ${request.source}`,
      `Approved by: ${request.approvedBy ?? 'Founder'}`,
      `Decided at: ${request.decidedAt ?? 'unknown'}`,
      `Expires at: ${request.expiresAt}`,
      `Action: ${request.action}`,
      `Risk: ${request.risk}`,
      '',
      'Guardrails:',
      '- Only branch ai/* and Draft PR are allowed.',
      '- No direct main merge.',
      '- No sensitive files or credentials.',
      '- Keep change minimal and auditable.'
    ].join('\n'),
    approvalPhrase: REQUIRED_PHRASE,
    filePath: 'docs/APPROVED_AI_CHANGE.md',
    fileContent: [
      `# ${request.title}`,
      '',
      '## Approved action',
      '',
      request.action,
      '',
      '## Details',
      '',
      request.details,
      '',
      '## Approval audit',
      '',
      `- ID: ${request.id}`,
      `- Source: ${request.source}`,
      `- Risk: ${request.risk}`,
      `- Status: ${request.status}`,
      `- Approved by: ${request.approvedBy ?? 'Founder'}`,
      `- Decided at: ${request.decidedAt ?? 'unknown'}`,
      `- Expires at: ${request.expiresAt}`,
      '',
      '## Guardrails',
      '',
      '- Draft PR only.',
      '- No direct push to protected branches.',
      '- No credentials, vault files, env files, build outputs, or dependency folders.'
    ].join('\n')
  };
}

export default function ApprovalReviewDeskBridge() {
  useEffect(() => {
    const syncApprovedToReviewDesk = () => {
      const requests = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
      const currentPrefill = readLocal<Record<string, unknown> | null>(PREFILL_KEY, null);
      const last = readLocal<{ approvalId?: string; decidedAt?: string } | null>(LAST_APPROVED_KEY, null);

      const approved = requests
        .filter((request) => request.status === 'Approved')
        .filter((request) => !isExpired(request))
        .sort((a, b) => new Date(b.decidedAt ?? b.createdAt).getTime() - new Date(a.decidedAt ?? a.createdAt).getTime())[0];

      if (!approved) return;
      if (last?.approvalId === approved.id && last?.decidedAt === approved.decidedAt) return;
      if (currentPrefill?.sourceApprovalId === approved.id) return;

      const prefill = createReviewPrefill(approved);
      localStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
      localStorage.setItem(LAST_APPROVED_KEY, JSON.stringify({ approvalId: approved.id, decidedAt: approved.decidedAt }));
      writeEvent(approved.id, 'AUTO_PREFILL_REVIEW_DESK', 'Bridge đã tạo prefill Review Desk từ approval còn hạn.');
      window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill', { detail: prefill }));
    };

    syncApprovedToReviewDesk();
    const onStorage = (event: StorageEvent) => {
      if (event.key === APPROVAL_KEY) syncApprovedToReviewDesk();
    };
    const onApprovalChanged = () => syncApprovedToReviewDesk();
    window.addEventListener('storage', onStorage);
    window.addEventListener('ledgerflow-approval-gate-changed', onApprovalChanged);
    const interval = window.setInterval(syncApprovedToReviewDesk, 5000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ledgerflow-approval-gate-changed', onApprovalChanged);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
