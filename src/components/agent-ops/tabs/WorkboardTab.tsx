import { useMemo, useState } from 'react';
import type { SessionStep, WorkCard, WorkKind } from '../../../types/agentOps';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const SESSION_KEY = 'ledgerflow_agent_sessions_v1';

type StoredSession = { id: string; title: string; kind?: WorkKind; status?: string; risk?: WorkCard['risk']; goal?: string; steps?: SessionStep[] };

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sessionToCard(session: StoredSession): WorkCard {
  return {
    id: session.id,
    title: session.title,
    kind: session.kind ?? 'Q&A',
    owner: 'AI Điều phối trưởng',
    status: session.status === 'Done' ? 'Done' : session.status === 'Waiting Approval' ? 'Waiting Approval' : 'Planning',
    risk: session.risk ?? 'MEDIUM',
    request: session.goal ?? 'Imported session',
    plan: session.steps?.map((step) => step.title) ?? ['Imported session'],
    tools: session.steps?.map((step) => step.tool) ?? ['Session queue'],
    approval: 'Use shared WorkCard review note.',
    steps: session.steps,
    sourceSessionId: session.id
  };
}

export default function WorkboardTab() {
  const [cards] = useState<WorkCard[]>(() => readLocal(CARD_KEY, []));
  const [sessions] = useState<StoredSession[]>(() => readLocal(SESSION_KEY, []));
  const allCards = useMemo(() => [...cards, ...sessions.map(sessionToCard)], [cards, sessions]);

  return (
    <section className="rounded-3xl border border-violet-400/35 bg-violet-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Single source workboard</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Ops Workboard</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">WorkCard là nguồn dữ liệu chính; session cũ được hiển thị như card có step.</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-200">{allCards.length} cards</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {allCards.map((card) => (
          <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{card.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{card.kind} · {card.owner}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{card.status}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{card.request}</p>
            {card.steps && <p className="mt-2 text-[11px] font-bold text-cyan-200">{card.steps.length} session steps</p>}
          </article>
        ))}
        {allCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có WorkCard hoặc session cũ trong localStorage.</p>}
      </div>
    </section>
  );
}
