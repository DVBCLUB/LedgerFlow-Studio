import type { RiskLevel, SessionStatus, WorkCard, WorkKind, WorkStatus } from '../../../types/agentOps';
import { readLocalStorageArray, useLocalStorageVersion } from '../storage';

const WORK_CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_SESSION_KEY = 'ledgerflow-agent-session-queue-v1';

const watchedEvents = ['ledgerflow-agent-session-updated', 'ledgerflow-aiops-card-updated', 'storage'];

type LegacyAgentSession = Partial<WorkCard> & {
  goal?: string;
  prompt?: string;
  summary?: string;
  status?: SessionStatus | WorkStatus | string;
};

const statusMap: Record<string, WorkStatus> = {
  Draft: 'Inbox',
  Queued: 'Planning',
  Running: 'Planning',
  'Waiting Approval': 'Waiting Approval',
  Blocked: 'Waiting Approval',
  Ready: 'Ready',
  Done: 'Done',
  Inbox: 'Inbox',
  Planning: 'Planning'
};

function normalizeRisk(risk: unknown): RiskLevel {
  return risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW' ? risk : 'MEDIUM';
}

function normalizeKind(kind: unknown): WorkKind {
  return kind === 'Q&A' || kind === 'Code' || kind === 'Design' || kind === 'Data' || kind === 'Marketing' || kind === 'Integration' || kind === 'CI Fix' || kind === 'Audit' || kind === 'Product' || kind === 'Ops' ? kind : 'Ops';
}

function normalizeStatus(status: unknown): WorkStatus {
  return typeof status === 'string' && statusMap[status] ? statusMap[status] : 'Inbox';
}

function sessionToWorkCard(session: LegacyAgentSession, index: number): WorkCard {
  const id = session.id || `legacy-session-${index}`;
  return {
    id,
    title: session.title || session.goal || 'Legacy agent session',
    kind: normalizeKind(session.kind),
    owner: session.owner || 'AI Agent Runtime',
    status: normalizeStatus(session.status),
    risk: normalizeRisk(session.risk),
    request: session.request || session.prompt || session.goal || session.summary || 'Imported from legacy AgentSessionQueue storage.',
    plan: Array.isArray(session.plan) ? session.plan : ['Review legacy session steps', 'Continue from AgentOpsHub runtime tab'],
    tools: Array.isArray(session.tools) ? session.tools : ['AgentOpsHub', 'Runtime queue'],
    approval: session.approval || 'Legacy session preserved from localStorage.',
    steps: session.steps,
    sourceSessionId: session.sourceSessionId || id
  };
}

function readCards(): WorkCard[] {
  const cards = readLocalStorageArray<WorkCard>([WORK_CARD_KEY]);
  const seen = new Set(cards.map((card) => card.id));
  const legacySessions = readLocalStorageArray<LegacyAgentSession>([LEGACY_SESSION_KEY])
    .map(sessionToWorkCard)
    .filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  return [...cards, ...legacySessions];
}

function visibleRuntimeCards(cards: WorkCard[]) {
  return cards.filter((card) => card.steps?.length || ['Planning', 'Waiting Approval', 'Ready'].includes(card.status));
}

export default function RunTab() {
  useLocalStorageVersion(watchedEvents);
  const cards = readCards();
  const runtimeCards = visibleRuntimeCards(cards);
  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Runtime view</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Runtime</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Runtime đọc cùng nguồn WorkCard và tự map session cũ thành work card có steps, không định nghĩa session type riêng.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['Planning', 'Waiting Approval', 'Ready'].map((status) => <div key={status} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{status}</p><p className="mt-2 text-2xl font-black text-cyan-100">{cards.filter((card) => card.status === status).length}</p></div>)}
      </div>
      <div className="mt-4 grid gap-3">
        {runtimeCards.map((card) => <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-white">{card.title}</p>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{card.owner} · {card.kind} · {card.status} · {card.risk}</p>
            </div>
            {card.sourceSessionId && <span className="rounded-full border border-fuchsia-400/30 px-2 py-1 text-[10px] font-black text-fuchsia-100">session</span>}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{card.request}</p>
          {card.steps?.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">
            {card.steps.map((step) => <div key={step.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
              <p className="text-[11px] font-black text-white">{step.title}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">{step.owner} · {step.tool} · {step.status}</p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{step.note}</p>
            </div>)}
          </div> : null}
        </article>)}
        {runtimeCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có runtime card hoặc session đang chạy.</p>}
      </div>
    </section>
  );
}
