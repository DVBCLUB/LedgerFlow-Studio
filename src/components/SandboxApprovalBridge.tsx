import { useEffect } from 'react';

type SandboxPatch = {
  id: string;
  title: string;
  repo: string;
  branchName: string;
  summary: string;
  filePath: string;
  fileContent: string;
  status: 'Draft' | 'Ready for Review Desk' | 'Blocked' | 'Sent';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  createdAt: string;
  source?: string;
  findings: string[];
};

type SandboxEvent = {
  id: string;
  at: string;
  patchId: string;
  action: string;
  detail: string;
};

type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
  details?: string;
  createdAt: string;
  expiresAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  sourceSandboxPatchId?: string;
};

type ApprovalEvent = {
  id: string;
  at: string;
  requestId: string;
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

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function normalizeBranch(branchName: string) {
  const cleaned = branchName.trim() || `sandbox-${Date.now()}`;
  return cleaned.startsWith('ai/') ? cleaned : `ai/${cleaned}`;
}

function createReviewDeskPrefill(patch: SandboxPatch) {
  localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify({
    sourceSandboxPatchId: patch.id,
    title: patch.title,
    repo: patch.repo,
    branchName: normalizeBranch(patch.branchName),
    summary: `${patch.summary}\n\nSandbox Patch: ${patch.id}\nRisk: ${patch.risk}\nFindings: ${patch.findings.length ? patch.findings.join('; ') : 'No blocking findings'}\nRouting: SandboxApprovalBridge`,
    filePath: patch.filePath,
    fileContent: patch.fileContent
  }));
  window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
}

function appendSandboxEvent(patchId: string, action: string, detail: string) {
  const events = readLocal<SandboxEvent[]>('ledgerflow_sandbox_patch_events_v1', []);
  writeLocal('ledgerflow_sandbox_patch_events_v1', [
    { id: `sandbox-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), patchId, action, detail },
    ...events
  ].slice(0, 160));
}

function appendApprovalEvent(requestId: string, action: string, detail: string) {
  const events = readLocal<ApprovalEvent[]>('ledgerflow_approval_gate_events_v1', []);
  writeLocal('ledgerflow_approval_gate_events_v1', [
    { id: `approval-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), requestId, action, detail },
    ...events
  ].slice(0, 160));
}

function syncSandboxRouting() {
  const patches = readLocal<SandboxPatch[]>('ledgerflow_sandbox_patches_v1', []);
  if (!patches.length) return;

  let patchesChanged = false;
  const approvals = readLocal<ApprovalRequest[]>('ledgerflow_approval_gate_requests_v1', []);
  let approvalsChanged = false;
  const routedPatchIds = readLocal<string[]>('ledgerflow_sandbox_routed_patch_ids_v1', []);
  const routed = new Set(routedPatchIds);

  const nextPatches = patches.map((patch) => {
    if (patch.status !== 'Ready for Review Desk' || patch.risk === 'BLOCKED' || routed.has(patch.id)) return patch;

    if (patch.risk === 'LOW') {
      createReviewDeskPrefill(patch);
      routed.add(patch.id);
      patchesChanged = true;
      appendSandboxEvent(patch.id, 'AUTO_SENT_TO_REVIEW_DESK', 'LOW risk patch was routed to Review Desk prefill by SandboxApprovalBridge.');
      return { ...patch, status: 'Sent' as SandboxPatch['status'] };
    }

    const exists = approvals.some((approval) => approval.sourceSandboxPatchId === patch.id || (approval.details ?? '').includes(`Sandbox Patch: ${patch.id}`));
    if (!exists) {
      const request: ApprovalRequest = {
        id: `approval-sandbox-${Date.now()}`,
        title: `Duyệt sandbox patch: ${patch.title}`,
        source: 'Sandbox Patch Workspace',
        risk: patch.risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
        action: 'Send sandbox patch to Review Desk as Draft PR prefill',
        details: `${patch.summary || 'Không có summary.'}\n\nSandbox Patch: ${patch.id}\nRepo: ${patch.repo}\nBranch: ${normalizeBranch(patch.branchName)}\nFile: ${patch.filePath}\nRisk: ${patch.risk}\nFindings: ${patch.findings.length ? patch.findings.join('; ') : 'No blocking findings'}\n\nGuardrails: only ai/* branch, Draft PR only, no direct main push, no sensitive file paths.`,
        createdAt: new Date().toISOString(),
        expiresAt: addHours(2),
        status: 'Pending',
        sourceSandboxPatchId: patch.id
      };
      approvals.unshift(request);
      approvalsChanged = true;
      routed.add(patch.id);
      appendApprovalEvent(request.id, 'REQUEST_CREATED_FROM_SANDBOX', `Created approval request from sandbox patch ${patch.id}.`);
      appendSandboxEvent(patch.id, 'APPROVAL_REQUIRED', 'MEDIUM/HIGH risk patch was sent to Approval Gate before Review Desk.');
    }

    return patch;
  });

  if (patchesChanged) writeLocal('ledgerflow_sandbox_patches_v1', nextPatches);
  if (approvalsChanged) {
    writeLocal('ledgerflow_approval_gate_requests_v1', approvals);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  }
  if (routed.size !== routedPatchIds.length) writeLocal('ledgerflow_sandbox_routed_patch_ids_v1', Array.from(routed));
}

export default function SandboxApprovalBridge() {
  useEffect(() => {
    syncSandboxRouting();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || ['ledgerflow_sandbox_patches_v1', 'ledgerflow_approval_gate_requests_v1'].includes(event.key)) syncSandboxRouting();
    };
    const onSandboxChanged = () => syncSandboxRouting();
    window.addEventListener('storage', onStorage);
    window.addEventListener('ledgerflow-sandbox-patches-changed', onSandboxChanged);
    window.addEventListener('ledgerflow-approval-gate-changed', onSandboxChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ledgerflow-sandbox-patches-changed', onSandboxChanged);
      window.removeEventListener('ledgerflow-approval-gate-changed', onSandboxChanged);
    };
  }, []);

  return null;
}
