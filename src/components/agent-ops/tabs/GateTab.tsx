import type { ApprovalRequest } from '../../../types/agentOps';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function GateTab() {
  const items = readLocal<ApprovalRequest[]>('ledgerflow_approval_gate_requests_v1', []);
  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Gate</p>
      <h3 className="mt-1 text-xl font-black text-white">Review Gate</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc lại request cũ từ localStorage bằng type chung.</p>
      <div className="mt-4 grid gap-2">
        {items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{item.title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.source} · {item.risk} · {item.status}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{item.details}</p></div>)}
        {items.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-400">Chưa có request lưu trong localStorage.</p>}
      </div>
    </section>
  );
}
