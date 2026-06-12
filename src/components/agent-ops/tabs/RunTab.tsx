import type { RiskLevel, SessionStatus, WorkCard, WorkKind, WorkStatus } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const WORK_CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_SESSION_KEY = 'ledgerflow-agent-session-queue-v1';

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

function sessionToWorkCard(session: LegacyAgentSession): WorkCard {
  const id = session.id || `legacy-session-${Date.now()}`;
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

export default function RunTab() {
  const cards = readCards();
  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">Runtime view</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Runtime</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Runtime đọc cùng nguồn WorkCard và tự map session cũ thành work card có steps, không định nghĩa session type riêng.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['Planning', 'Waiting Approval', 'Ready'].map((status) => <div key={status} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-xs font-black text-white">{status}</p><p className="mt-2 text-2xl font-black text-cyan-100">{cards.filter((card) => card.status === status).length}</p></div>)}
      </div>
    </section>
  );
}
