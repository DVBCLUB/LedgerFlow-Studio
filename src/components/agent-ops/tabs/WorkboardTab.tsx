import { useEffect, useMemo, useState } from 'react';
import type { RiskLevel, SessionStep, WorkCard, WorkKind, WorkStatus } from '../../../types/agentOps';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const SESSION_KEY = 'ledgerflow_agent_sessions_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';

const statuses: WorkStatus[] = ['Inbox', 'Planning', 'Waiting Approval', 'Ready', 'Done'];
const kinds: WorkKind[] = ['Q&A', 'Design', 'Data', 'Marketing', 'Integration', 'Code', 'CI Fix'];

type LegacySession = {
  id: string;
  title: string;
  kind: WorkKind;
  status: string;
  risk: RiskLevel;
  goal: string;
  steps?: SessionStep[];
};

type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

const starterCards: WorkCard[] = [
  {
    id: 'wb-001',
    title: 'AI Ops consolidation',
    kind: 'Design',
    owner: 'AI Điều phối trưởng',
    status: 'Planning',
    risk: 'MEDIUM',
    request: 'Gom các bảng agent ops vào một hub thống nhất.',
    plan: ['Giữ dữ liệu cũ', 'Gom session thành WorkCard', 'Giữ audit'],
    tools: ['Workboard', 'Session Queue'],
    approval: 'Founder review trước khi thực thi bước rủi ro.'
  }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function riskFor(kind: WorkKind): RiskLevel {
  if (kind === 'Integration' || kind === 'Code' || kind === 'CI Fix') return 'HIGH';
  if (kind === 'Design' || kind === 'Data') return 'MEDIUM';
  return 'LOW';
}

function ownerFor(kind: WorkKind) {
  if (kind === 'Design') return 'AI Thiết kế sản phẩm';
  if (kind === 'Data') return 'AI Dữ liệu';
  if (kind === 'Marketing') return 'AI Marketing';
  return 'AI Điều phối trưởng';
}

function mapStatus(value: string): WorkStatus {
  if (value === 'Done') return 'Done';
  if (value === 'Waiting Approval' || value === 'Blocked') return 'Waiting Approval';
  if (value === 'Running' || value === 'Queued') return 'Ready';
  return 'Planning';
}

function fromSession(session: LegacySession): WorkCard {
  const steps = session.steps ?? [];
  return {
    id: session.id,
    title: session.title,
    kind: session.kind === 'CI Fix' ? 'Code' : session.kind,
    owner: ownerFor(session.kind),
    status: mapStatus(session.status),
    risk: session.risk,
    request: session.goal,
    plan: steps.length ? steps.map((step) => step.title) : ['Session imported'],
    tools: steps.length ? Array.from(new Set(steps.map((step) => step.tool))) : ['Session Queue'],
    approval: session.risk === 'LOW' ? 'Low risk sandbox flow.' : 'Needs founder review.',
    steps,
    sourceSessionId: session.id
  };
}

function riskClass(risk: RiskLevel) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
}

export default function WorkboardTab() {
  const [cards, setCards] = useState<WorkCard[]>(() => readLocal(CARD_KEY, starterCards));
  const [sessions] = useState<LegacySession[]>(() => readLocal(SESSION_KEY, []));
  const [audit, setAudit] = useState<AuditEntry[]>(() => readLocal(AUDIT_KEY, []));
  const [draft, setDraft] = useState({ title: '', kind: 'Design' as WorkKind, request: '' });
  const [selectedId, setSelectedId] = useState(() => cards[0]?.id ?? starterCards[0].id);

  useEffect(() => localStorage.setItem(CARD_KEY, JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem(AUDIT_KEY, JSON.stringify(audit)), [audit]);

  const allCards = useMemo(() => [...cards, ...sessions.map(fromSession)], [cards, sessions]);
  const selected = useMemo(() => allCards.find((card) => card.id === selectedId) ?? allCards[0], [allCards, selectedId]);

  const addCard = () => {
    if (!draft.title.trim() || !draft.request.trim()) return;
    const risk = riskFor(draft.kind);
    const card: WorkCard = {
      id: `wb-${Date.now()}`,
      title: draft.title.trim(),
      kind: draft.kind,
      owner: ownerFor(draft.kind),
      status: risk === 'LOW' ? 'Inbox' : 'Waiting Approval',
      risk,
      request: draft.request.trim(),
      plan: ['Read context', 'Plan small step', 'Record result'],
      tools: ['Knowledge Library', 'Workboard'],
      approval: risk === 'LOW' ? 'Low risk sandbox flow.' : 'Needs founder review.'
    };
    setCards((current) => [card, ...current]);
    setAudit((current) => [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action: 'CARD_CREATED', cardId: card.id, detail: `Created ${card.kind} card.` }, ...current].slice(0, 100));
    setSelectedId(card.id);
    setDraft({ title: '', kind: draft.kind, request: '' });
  };

  const moveSelected = (status: WorkStatus) => {
    if (!selected || selected.sourceSessionId) return;
    setCards((current) => current.map((card) => card.id === selected.id ? { ...card, status } : card));
  };

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
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo WorkCard</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên việc" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as WorkKind })}>{kinds.map((kind) => <option key={kind}>{kind}</option>)}</select>
            <textarea className="min-h-[96px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Yêu cầu" value={draft.request} onChange={(event) => setDraft({ ...draft, request: event.target.value })} />
            <button onClick={addCard} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950">Đưa vào Workboard</button>
          </div>
          <div className="mt-4 space-y-2">{allCards.map((card) => <button key={card.id} onClick={() => setSelectedId(card.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === card.id ? 'border-violet-300 bg-violet-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-violet-400/40'}`}><div className="flex items-center justify-between gap-2"><p className="text-sm font-black text-white">{card.title}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(card.risk)}`}>{card.risk}</span></div><p className="mt-1 text-[11px] font-bold text-slate-400">{card.kind} · {card.owner} · {card.status}</p></button>)}</div>
        </div>
        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected work card</p><h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4><p className="mt-1 text-xs font-bold text-slate-400">{selected.owner} · {selected.kind}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span></div><p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.request}</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Plan</p><ul className="mt-2 space-y-2">{selected.plan.map((item) => <li key={item} className="text-xs font-semibold text-slate-300">✓ {item}</li>)}</ul></div><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tools</p><div className="mt-2 flex flex-wrap gap-2">{selected.tools.map((tool) => <span key={tool} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">{tool}</span>)}</div></div></div>{selected.steps && selected.steps.length > 0 && <div className="mt-4 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-3"><p className="text-xs font-black text-blue-200">Session steps</p><div className="mt-2 grid gap-2">{selected.steps.map((step) => <div key={step.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-2"><p className="text-xs font-black text-white">{step.title} · {step.status}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{step.owner} · {step.tool}</p></div>)}</div></div>}<div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3"><p className="text-xs font-black text-amber-200">Approval note</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{selected.approval}</p></div>{!selected.sourceSessionId && <div className="mt-4 flex flex-wrap gap-2">{statuses.map((status) => <button key={status} onClick={() => moveSelected(status)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-emerald-400'}`}>{status}</button>)}</div>}</div>}
      </div>
    </section>
  );
}
