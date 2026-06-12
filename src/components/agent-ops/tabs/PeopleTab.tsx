import type { WorkCard } from '../../../types/agentOps';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function PeopleTab() {
  const cards = readLocal<WorkCard[]>('ledgerflow_aiops_cards_v1', []);
  return (
    <section className="rounded-3xl border border-blue-400/35 bg-blue-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200">AI Staff</p>
      <h3 className="mt-1 text-xl font-black text-white">AI Staff Work</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Hiển thị WorkCard theo owner / aiStaff.</p>
      <div className="mt-4 grid gap-2">
        {cards.map((card) => <div key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{card.title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{card.aiStaff || card.owner} · {card.status} · {card.risk}</p></div>)}
        {cards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-400">Chưa có card lưu trong Workboard.</p>}
      </div>
    </section>
  );
}
