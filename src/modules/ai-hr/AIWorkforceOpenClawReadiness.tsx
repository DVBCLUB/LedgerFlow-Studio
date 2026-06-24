import { AlertTriangle, Bot, CheckCircle2, Gauge, GitBranch, Lock, MessageSquare, PackageCheck, ShieldAlert, Smartphone, Wrench, XCircle } from 'lucide-react';

type ReadinessStatus = 'complete' | 'partial' | 'missing';
type ReadinessItem = {
  id: string;
  title: string;
  status: ReadinessStatus;
  weight: number;
  evidence: string;
  next: string;
  icon: React.ReactNode;
};

const items: ReadinessItem[] = [
  {
    id: 'mission-control',
    title: 'Mission Control UX',
    status: 'complete',
    weight: 12,
    evidence: 'Founder can create missions, advance runs, stop runs, approve steps, inspect artifacts, search memory and trigger emergency stop.',
    next: 'Keep as the primary AI Workforce surface; avoid exposing raw labs first.',
    icon: <Gauge className="h-4 w-4" />,
  },
  {
    id: 'agent-runtime',
    title: 'Agent Runtime Loop',
    status: 'complete',
    weight: 12,
    evidence: 'Runtime has planning, steps, approval wait states, artifacts, audit, emergency stop and max runtime controls.',
    next: 'Continue improving trace quality and tool evidence.',
    icon: <Bot className="h-4 w-4" />,
  },
  {
    id: 'trace',
    title: 'Mission Trace',
    status: 'complete',
    weight: 10,
    evidence: 'AI Ops now has a readable Plan → Steps → Approvals → Artifacts timeline.',
    next: 'Add cost/latency and memory-write details when backend exposes them.',
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: 'approval-gate',
    title: 'Approval Gate',
    status: 'partial',
    weight: 10,
    evidence: 'Founder can approve fingerprinted steps and stop missions. Reject flow and audit summary are not yet surfaced.',
    next: 'Add explicit Reject Step and visible audit evidence after approval/rejection.',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: 'patch-sessions',
    title: 'Reviewed Patch Sessions',
    status: 'partial',
    weight: 10,
    evidence: 'Patch sessions are separated in AI Ops, but diff preview/apply/rollback are not wired yet.',
    next: 'Add diff preview, approve-to-apply, and rollback metadata.',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 'mobile-parity',
    title: 'Mobile / Telegram Parity',
    status: 'partial',
    weight: 10,
    evidence: 'Command spec and copyable Telegram/CLI commands exist. Backend handlers still need implementation.',
    next: 'Wire Telegram handlers for create/status/approvals/approve/stop/artifact.',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    id: 'tool-registry',
    title: 'Tool Registry + Policy',
    status: 'partial',
    weight: 10,
    evidence: 'Tool Catalog and shared tool IDs exist; daemon schema still needs full sync with shared IDs.',
    next: 'Patch daemon Zod schema to consume the shared AGENT_TOOL_IDS source.',
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    id: 'plugin-hardening',
    title: 'Plugin Hardening',
    status: 'partial',
    weight: 10,
    evidence: 'Plugin Security Guard exists in UI. Runtime enforcement for signature/sandbox/scopes is still pending.',
    next: 'Enforce signed manifest, sandbox execution, permission scopes and SAST/dependency preflight.',
    icon: <Lock className="h-4 w-4" />,
  },
  {
    id: 'messaging-first',
    title: 'Messaging-first Operations',
    status: 'partial',
    weight: 8,
    evidence: 'Mobile command vocabulary exists, but Telegram is not yet a full primary UI like OpenClaw.',
    next: 'Make Telegram status, approval and artifact retrieval work end-to-end.',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: 'local-autonomy',
    title: 'Local Autonomy Boundary',
    status: 'partial',
    weight: 8,
    evidence: 'Daemon and sandbox layers exist. Some actions remain simulated and plugin boundary needs stronger enforcement.',
    next: 'Finish safe local patch/apply workflows and block unsafe plugin execution by default.',
    icon: <Bot className="h-4 w-4" />,
  },
];

function statusClass(status: ReadinessStatus) {
  if (status === 'complete') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'partial') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'partial') return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function statusScore(item: ReadinessItem) {
  if (item.status === 'complete') return item.weight;
  if (item.status === 'partial') return item.weight * 0.55;
  return 0;
}

export default function AIWorkforceOpenClawReadiness() {
  const score = Math.round(items.reduce((total, item) => total + statusScore(item), 0));
  const complete = items.filter((item) => item.status === 'complete').length;
  const partial = items.filter((item) => item.status === 'partial').length;
  const missing = items.filter((item) => item.status === 'missing').length;
  const isBestAligned = score >= 92 && missing === 0 && partial <= 1;

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Gauge className="mr-2 inline h-4 w-4" />OpenClaw Readiness</p>
        <h3 className="mt-2 text-lg font-black text-white">How close is LedgerFlow AI Workforce to OpenClaw-style autonomy?</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Bảng này dùng để quyết định khi nào hệ đã “khớp OpenClaw nhất”. Mốc báo đạt: ≥92%, không còn missing, tối đa 1 partial.</p>
      </div>
      <div className={`rounded-[2rem] border px-5 py-4 text-center ${isBestAligned ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current score</p>
        <p className={`text-4xl font-black ${isBestAligned ? 'text-emerald-200' : 'text-amber-200'}`}>{score}%</p>
      </div>
    </div>

    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3"><p className="text-[10px] font-black uppercase text-emerald-200">Complete</p><p className="mt-1 text-2xl font-black text-white">{complete}</p></div>
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3"><p className="text-[10px] font-black uppercase text-amber-200">Partial</p><p className="mt-1 text-2xl font-black text-white">{partial}</p></div>
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3"><p className="text-[10px] font-black uppercase text-rose-200">Missing</p><p className="mt-1 text-2xl font-black text-white">{missing}</p></div>
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3"><p className="text-[10px] font-black uppercase text-cyan-200">Verdict</p><p className="mt-1 text-sm font-black text-white">{isBestAligned ? 'Ready to report match' : 'Not yet best match'}</p></div>
    </div>

    {!isBestAligned && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold leading-5 text-amber-100">
      Chưa báo “khớp OpenClaw nhất”. Cần hoàn thiện backend Telegram handlers, daemon schema sync, patch apply/rollback và plugin sandbox/signature enforcement.
    </p>}

    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((item) => <div key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-white"><span className="text-cyan-200">{item.icon}</span>{item.title}</div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(item.status)}`}><StatusIcon status={item.status} />{item.status}</span>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{item.evidence}</p>
        <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold leading-5 text-slate-500">Next: {item.next}</p>
      </div>)}
    </div>
  </section>;
}
