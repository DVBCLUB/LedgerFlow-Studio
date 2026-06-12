import { useEffect, useMemo, useState } from 'react';
import type { SessionStep, WorkCard, WorkKind } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';
const SESSION_KEYS = ['ledgerflow_agent_sessions_v1', 'ledgerflow-agent-session-queue-v1'];

const kindOptions: WorkKind[] = ['Q&A', 'Code', 'Design', 'Data', 'Marketing', 'Integration', 'CI Fix', 'Audit', 'Product', 'Ops'];

type StoredSession = { id: string; title: string; kind?: WorkKind; status?: string; risk?: WorkCard['risk']; goal?: string; steps?: SessionStep[] };
type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };
type ReviewDeskResultEvent = { sourceCardId?: string; at?: string; result?: { branchName?: string; pullRequestNumber?: number; pullRequestUrl?: string } };
type CiFixPackage = { id: string; sourceCardId?: string; branchName: string; pullRequestNumber: number; workflowName: string; status: string; conclusion: string | null; createdAt: string; prompt: string };

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function riskFor(kind: WorkKind): WorkCard['risk'] {
  if (kind === 'Code' || kind === 'Integration' || kind === 'CI Fix') return 'HIGH';
  if (kind === 'Data' || kind === 'Design' || kind === 'Audit' || kind === 'Product') return 'MEDIUM';
  return 'LOW';
}

function ownerFor(kind: WorkKind) {
  if (kind === 'Code' || kind === 'CI Fix') return 'AI Code / Dev Agent';
  if (kind === 'Design' || kind === 'Product') return 'AI Thiết kế sản phẩm';
  if (kind === 'Marketing') return 'AI Marketing / Sales';
  if (kind === 'Data' || kind === 'Audit') return 'AI Dữ liệu / Tri thức';
  if (kind === 'Integration') return 'AI Integration Agent';
  return 'AI Điều phối trưởng';
}

function sessionToCard(session: StoredSession): WorkCard {
  return {
    id: session.id,
    title: session.title,
    kind: session.kind ?? 'Q&A',
    owner: 'AI Điều phối trưởng',
    status: session.status === 'Done' ? 'Done' : session.status === 'Waiting Approval' || session.status === 'Blocked' ? 'Waiting Approval' : 'Planning',
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
  const [cards, setCards] = useState<WorkCard[]>(() => readLocal(CARD_KEY, []));
  const [audit, setAudit] = useState<AuditEntry[]>(() => readLocal(AUDIT_KEY, []));
  const [sessions] = useState<StoredSession[]>(() => readLocalStorageArray<StoredSession>(SESSION_KEYS));
  const [draft, setDraft] = useState({ title: '', kind: 'Code' as WorkKind, request: '' });
  const allCards = useMemo(() => [...cards, ...sessions.map(sessionToCard)], [cards, sessions]);

  useEffect(() => writeLocal(CARD_KEY, cards), [cards]);
  useEffect(() => writeLocal(AUDIT_KEY, audit), [audit]);

  const pushAudit = (action: string, cardId: string, detail: string) => {
    setAudit((current) => [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId, detail }, ...current].slice(0, 120));
  };

  useEffect(() => {
    const handleReviewResult = (event: Event) => {
      const detail = (event as CustomEvent<ReviewDeskResultEvent>).detail;
      const cardId = detail?.sourceCardId;
      if (!cardId || !detail?.result) return;
      setCards((current) => current.map((card) => card.id === cardId ? { ...card, status: 'Done' } : card));
      setAudit((current) => [{
        id: `audit-${Date.now()}`,
        at: detail.at || new Date().toLocaleString('vi-VN'),
        action: 'DRAFT_PR_CREATED',
        cardId,
        detail: `Draft PR #${detail.result?.pullRequestNumber || '?'} created on ${detail.result?.branchName || 'ai/*'}: ${detail.result?.pullRequestUrl || 'no url'}`
      }, ...current].slice(0, 120));
    };

    const handleCiFixPackage = (event: Event) => {
      const pack = (event as CustomEvent<CiFixPackage>).detail;
      if (!pack?.id) return;
      const cardId = `wb-ci-${Date.now()}`;
      const card: WorkCard = {
        id: cardId,
        title: `Fix CI failure for PR #${pack.pullRequestNumber}`,
        kind: 'CI Fix',
        owner: 'AI Code / Dev Agent',
        status: 'Waiting Approval',
        risk: 'HIGH',
        request: pack.prompt,
        plan: ['Open CI context', 'Identify failing check', 'Prepare small patch', 'Send through Review Desk'],
        tools: ['CI Doctor', 'GitHub Actions', 'Review Desk'],
        approval: 'Founder review required before risky patch execution.'
      };
      setCards((current) => [card, ...current]);
      setAudit((current) => [{
        id: `audit-${Date.now()}`,
        at: pack.createdAt || new Date().toLocaleString('vi-VN'),
        action: 'CI_FIX_CARD_CREATED',
        cardId,
        detail: `Created from failed workflow ${pack.workflowName} (${pack.conclusion || pack.status}) on ${pack.branchName}.`
      }, ...current].slice(0, 120));
    };

    window.addEventListener('ledgerflow-review-desk-result', handleReviewResult);
    window.addEventListener('ledgerflow-ci-fix-package', handleCiFixPackage);
    return () => {
      window.removeEventListener('ledgerflow-review-desk-result', handleReviewResult);
      window.removeEventListener('ledgerflow-ci-fix-package', handleCiFixPackage);
    };
  }, []);

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
      plan: ['Read context', 'Make a small plan', 'Keep risky actions behind approval'],
      tools: draft.kind === 'Code' || draft.kind === 'CI Fix' ? ['Knowledge Library', 'Review Desk', 'CI Doctor'] : draft.kind === 'Integration' ? ['Connector Registry', 'Policy Gate', 'Review Desk'] : ['Knowledge Library', 'Sandbox'],
      approval: risk === 'LOW' ? 'Can stay in sandbox.' : 'Founder review required before execution outside sandbox.'
    };
    setCards((current) => [card, ...current]);
    pushAudit('CARD_CREATED', card.id, `Created ${card.kind} work card with ${card.risk} risk.`);
    setDraft({ title: '', kind: draft.kind, request: '' });
  };

  return (
    <section className="rounded-3xl border border-violet-400/35 bg-violet-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Single source workboard</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Ops Workboard</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">WorkCard là nguồn dữ liệu chính; session cũ được hiển thị như card có step.</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-200">{allCards.length} cards · {audit.length} audit events</span>
      </div>

      <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-sm font-black text-white">Tạo việc cho AI agent</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px]">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên việc" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as WorkKind })}>
            {kindOptions.map((kind) => <option key={kind}>{kind}</option>)}
          </select>
          <textarea className="min-h-[90px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white md:col-span-2" placeholder="Mô tả yêu cầu cho AI..." value={draft.request} onChange={(event) => setDraft({ ...draft, request: event.target.value })} />
          <button onClick={addCard} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 md:col-span-2">Đưa vào Workboard</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {allCards.map((card) => (
          <article key={`${card.sourceSessionId ?? 'card'}-${card.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
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
