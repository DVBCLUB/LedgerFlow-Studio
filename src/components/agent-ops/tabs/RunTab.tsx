import type { WorkCard } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const CARD_KEYS = ['ledgerflow_aiops_cards_v1', 'ledgerflow-agent-session-queue-v1'];

function readCards(): WorkCard[] {
  return readLocalStorageArray<WorkCard>(CARD_KEYS);
}

export default function RunTab() {
  const cards = readCards();
  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Runtime view</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Runtime</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Runtime đọc cùng nguồn WorkCard và key session cũ thay vì tự định nghĩa session type riêng.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['Planning', 'Waiting Approval', 'Ready'].map((status) => <div key={status} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{status}</p><p className="mt-2 text-2xl font-black text-cyan-100">{cards.filter((card) => card.status === status).length}</p></div>)}
      </div>
    </section>
  );
}
