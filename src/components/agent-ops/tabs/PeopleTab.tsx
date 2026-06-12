import type { WorkCard } from '../../../types/agentOps';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';

function readCards(): WorkCard[] {
  try {
    const raw = localStorage.getItem(CARD_KEY);
    return raw ? JSON.parse(raw) as WorkCard[] : [];
  } catch {
    return [];
  }
}

export default function PeopleTab() {
  const staffCards = readCards().filter((card) => card.aiStaff || card.acceptanceCriteria || card.founderReview);
  return (
    <section className="rounded-3xl border border-sky-400/35 bg-sky-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">AI Staff</p>
      <h3 className="mt-1 text-xl font-black text-white">AI Staff Assignment</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">StaffTask đã được gộp vào WorkCard qua các field optional: aiStaff, acceptanceCriteria, founderReview, deadline.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {staffCards.map((card) => <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{card.title}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{card.aiStaff ?? card.owner} · {card.status}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{card.acceptanceCriteria ?? card.request}</p></article>)}
        {staffCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có WorkCard gắn AI staff.</p>}
      </div>
    </section>
  );
}
