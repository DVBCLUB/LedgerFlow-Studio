import type { ApprovalRequest, ApprovalRisk, ApprovalStatus } from '../../../types/agentOps';
import { AGENT_OPS_AUDIT_KEY, appendAgentOpsAudit, readLocalStorageArray, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue, type AgentOpsAuditEntry } from '../storage';
import { useApprovalGateSync } from '../useApprovalGateSync';

const APPROVAL_KEYS = ['ledgerflow_approval_gate_requests_v1', 'ledgerflow-approval-gate-v1'];
const PRIMARY_APPROVAL_KEY = APPROVAL_KEYS[0];

const riskPolicy: Record<ApprovalRisk, { label: string; rule: string; founderRequired: boolean; tone: string }> = {
  LOW: {
    label: 'Low risk',
    rule: 'Cho chạy sandbox/dry-run, vẫn ghi audit log; không được gọi API external thật.',
    founderRequired: false,
    tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  },
  MEDIUM: {
    label: 'Medium risk',
    rule: 'Founder phải duyệt trước khi ghi file, tạo issue, gửi email hoặc đổi trạng thái connector.',
    founderRequired: true,
    tone: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  },
  HIGH: {
    label: 'High risk',
    rule: 'Bắt buộc founder review rõ action + điều kiện rollback; mặc định giữ ở dry-run.',
    founderRequired: true,
    tone: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
  },
};

function readRequests(): ApprovalRequest[] {
  return readLocalStorageArray<ApprovalRequest>(APPROVAL_KEYS);
}

function writeRequests(requests: ApprovalRequest[]) {
  writeLocalStorageValue(PRIMARY_APPROVAL_KEY, requests);
  window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-prefill'));
}

function appendGateAudit(action: string, request: ApprovalRequest, detail: string) {
  appendAgentOpsAudit(action, request.sourceId || request.sourceSessionId || request.id, detail);
  window.dispatchEvent(new CustomEvent('ledgerflow-aiops-card-updated'));
}

function statusTone(status?: ApprovalStatus) {
  if (status === 'Approved') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Rejected' || status === 'Expired') return 'border-rose-400/40 text-rose-200';
  return 'border-slate-700 text-slate-300';
}

export default function GateTab() {
  useApprovalGateSync();
  useLocalStorageVersion(['ledgerflow-approval-session-sync', 'ledgerflow-approval-gate-changed', 'ledgerflow-review-desk-prefill']);
  const requests = readRequests();
  const pendingRequests = requests.filter((request) => !request.status || request.status === 'Pending');
  const audit = readLocalStorageValue<AgentOpsAuditEntry[]>(AGENT_OPS_AUDIT_KEY, []);

  const decide = (request: ApprovalRequest, status: ApprovalStatus, detail: string) => {
    const now = new Date().toISOString();
    const next = requests.map((item) => item.id === request.id ? {
      ...item,
      status,
      approvedBy: status === 'Approved' ? 'Founder / Quốc Bảo' : item.approvedBy,
      approvedAt: status === 'Approved' ? now : item.approvedAt,
      decidedAt: now,
      conditions: detail,
    } : item);
    writeRequests(next);
    appendGateAudit(`APPROVAL_${status.toUpperCase()}`, request, detail);
  };

  const approveSandbox = (request: ApprovalRequest) => decide(request, 'Approved', 'Approved for sandbox/dry-run only. External write actions remain blocked until a separate approval is created.');
  const approveExternal = (request: ApprovalRequest) => decide(request, 'Approved', 'Founder approved controlled external execution. Keep rollback note, audit log and result evidence.');
  const reject = (request: ApprovalRequest) => decide(request, 'Rejected', 'Founder rejected this action. AI must revise plan or keep work in simulation mode.');

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Approval gate</p>
          <h3 className="mt-1 text-xl font-black text-white">Founder Approval Gate</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Low risk chỉ chạy sandbox/dry-run. Medium và High phải có founder review trước mọi hành động external, đúng nguyên tắc approval-first/audit-first.</p>
        </div>
        <span className="rounded-full border border-emerald-300/35 px-3 py-1 text-xs font-black text-emerald-100">{pendingRequests.length} pending · {audit.length} audit</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {(Object.keys(riskPolicy) as ApprovalRisk[]).map((risk) => {
          const policy = riskPolicy[risk];
          return (
            <article key={risk} className={`rounded-2xl border p-3 ${policy.tone}`}>
              <p className="text-sm font-black">{policy.label}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{policy.rule}</p>
              <p className="mt-2 text-[11px] font-black">{policy.founderRequired ? 'Founder approval bắt buộc' : 'Sandbox auto-pass được phép'}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {requests.map((request) => {
          const risk = (request.risk || 'MEDIUM') as ApprovalRisk;
          const policy = riskPolicy[risk] || riskPolicy.MEDIUM;
          const pending = !request.status || request.status === 'Pending';
          return (
            <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{request.title || 'Legacy approval request'}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{request.source || 'Legacy source'} · {risk} · {request.createdAt || 'no date'}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(request.status)}`}>{request.status || 'Pending'}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{request.details || request.action || 'Imported from legacy approval gate storage.'}</p>
              {request.conditions && <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-[11px] font-semibold leading-5 text-amber-100">Decision note: {request.conditions}</p>}
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Policy: {policy.rule}</div>
              {pending && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => approveSandbox(request)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">Approve sandbox</button>
                  <button onClick={() => approveExternal(request)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approve external</button>
                  <button onClick={() => reject(request)} className="rounded-xl border border-rose-300/50 px-3 py-2 text-[11px] font-black text-rose-100 hover:bg-rose-400/10">Reject</button>
                </div>
              )}
            </article>
          );
        })}
        {requests.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có approval request trong localStorage. Workboard/Review Desk sẽ đẩy yêu cầu rủi ro vào đây trước khi chạy external action.</p>}
      </div>

      {audit.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Audit trail gần nhất</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {audit.slice(0, 6).map((entry) => <p key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300"><span className="text-emerald-200">{entry.action}</span> · {entry.at}<br />{entry.detail}</p>)}
          </div>
        </div>
      )}
    </section>
  );
}
