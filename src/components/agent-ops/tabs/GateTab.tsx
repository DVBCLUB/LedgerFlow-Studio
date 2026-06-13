import type { ApprovalRequest } from '../../../types/agentOps';
import { readLocalStorageArray, useLocalStorageVersion } from '../storage';
import { useApprovalGateSync } from '../useApprovalGateSync';

const APPROVAL_KEYS = ['ledgerflow_approval_gate_requests_v1', 'ledgerflow-approval-gate-v1'];

function readRequests(): ApprovalRequest[] {
  return readLocalStorageArray<ApprovalRequest>(APPROVAL_KEYS);
}

export default function GateTab() {
  useApprovalGateSync();
  useLocalStorageVersion(['ledgerflow-approval-session-sync', 'ledgerflow-approval-gate-changed', 'ledgerflow-review-desk-prefill']);
  const requests = readRequests();
  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Approval gate</p>
      <h3 className="mt-1 text-xl font-black text-white">Approvals</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">ApprovalReviewDeskBridge và ApprovalSessionBridge được thay bằng dữ liệu chung ApprovalRequest, đọc cả key approval cũ.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {requests.map((request) => <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-black text-white">{request.title || 'Legacy approval request'}</p><span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{request.status || 'Pending'}</span></div><p className="mt-1 text-[11px] font-bold text-slate-400">{request.source || 'Legacy source'} · {request.risk || 'MEDIUM'}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{request.details || request.action || 'Imported from legacy approval gate storage.'}</p></article>)}
        {requests.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có approval request trong localStorage.</p>}
      </div>
    </section>
  );
}
