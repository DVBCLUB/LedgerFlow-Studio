import type { WorkCard } from '../../../types/agentOps';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function RunTab() {
  const cards = readLocal<WorkCard[]>('ledgerflow_aiops_cards_v1', []);
  const openCards = cards.filter((card) => card.status !== 'Done');
  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Run view</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent run queue</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc WorkCard chung để xem các việc đang mở.</p>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-[10px] font-black uppercase text-slate-500">Open cards</p>
        <p className="mt-2 text-3xl font-black text-white">{openCards.length}</p>
      </div>
    </section>
  );
}
