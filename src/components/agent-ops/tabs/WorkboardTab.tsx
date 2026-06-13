import { useEffect, useMemo, useState } from 'react';
import type { SessionStep, WorkCard, WorkKind, WorkStatus } from '../../../types/agentOps';
import { AGENT_OPS_AUDIT_KEY, appendAgentOpsAudit, readLocalStorageArray, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue, type AgentOpsAuditEntry } from '../storage';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const SESSION_KEYS = ['ledgerflow_agent_sessions_v1', 'ledgerflow-agent-session-queue-v1'];

const kindOptions: WorkKind[] = ['Q&A', 'Code', 'Design', 'Data', 'Marketing', 'Integration', 'CI Fix', 'Audit', 'Product', 'Ops'];
const columns: WorkStatus[] = ['Inbox', 'Planning', 'Waiting Approval', 'Ready', 'Done'];

const statusHelp: Record<WorkStatus, string> = {
  Inbox: 'Ý tưởng/yêu cầu mới, chưa chia nhỏ thành kế hoạch.',
  Planning: 'AI đang lập kế hoạch sandbox, chưa được phép tác động ngoài.',
  'Waiting Approval': 'Cần founder duyệt trước khi chạy tool rủi ro hoặc external action.',
  Ready: 'Đã đủ điều kiện chạy sandbox/approved action theo Gate.',
  Done: 'Đã hoàn tất và ghi lại audit trail.'
};

type StoredSession = { id: string; title: string; kind?: WorkKind; status?: string; risk?: WorkCard['risk']; goal?: string; steps?: SessionStep[] };
type ReviewDeskResultEvent = { sourceCardId?: string; at?: string; result?: { branchName?: string; pullRequestNumber?: number; pullRequestUrl?: string } };
type CiFixPackage = { id: string; sourceCardId?: string; branchName: string; pullRequestNumber: number; workflowName: string; status: string; conclusion: string | null; createdAt: string; prompt: string };

function riskFor(kind: WorkKind): WorkCard['risk'] {
  if (kind === 'Code' || kind === 'Integration' || kind === 'CI Fix') return 'HIGH';
  if (kind === 'Data' || kind === 'Design' || kind === 'Audit' || kind === 'Product') return 'MEDIUM';
  return 'LOW';
}

function ownerFor(kind: WorkKind) {
  if (kind === 'Code' || kind === 'CI Fix') return 'AI Dev';
  if (kind === 'Design') return 'AI Designer';
  if (kind === 'Product') return 'AI Chief of Staff';
  if (kind === 'Marketing') return 'AI Marketer';
  if (kind === 'Audit') return 'AI Auditor';
  if (kind === 'Data') return 'AI Data Analyst';
  if (kind === 'Integration') return 'AI Dev';
  return 'AI Chief of Staff';
}

function normalizeStatus(value?: string): WorkStatus {
  if (value === 'Done') return 'Done';
  if (value === 'Ready') return 'Ready';
  if (value === 'Waiting Approval' || value === 'Blocked') return 'Waiting Approval';
  if (value === 'Inbox') return 'Inbox';
  return 'Planning';
}

function sessionToCard(session: StoredSession): WorkCard {
  const kind = session.kind ?? 'Q&A';
  return {
    id: session.id,
    title: session.title,
    kind,
    owner: ownerFor(kind),
    status: normalizeStatus(session.status),
    risk: session.risk ?? riskFor(kind),
    request: session.goal ?? 'Imported session',
    plan: session.steps?.map((step) => step.title) ?? ['Imported session'],
    tools: session.steps?.map((step) => step.tool) ?? ['Session queue'],
    approval: 'Imported session chỉ được chạy external action sau khi qua Approval Gate.',
    steps: session.steps,
    sourceSessionId: session.id
  };
}

function nextStatus(card: WorkCard): WorkStatus | null {
  if (card.status === 'Inbox') return 'Planning';
  if (card.status === 'Planning') return card.risk === 'LOW' ? 'Ready' : 'Waiting Approval';
  if (card.status === 'Waiting Approval') return null;
  if (card.status === 'Ready') return 'Done';
  return null;
}

export default function WorkboardTab() {
  useLocalStorageVersion(['ledgerflow-aiops-card-updated', 'ledgerflow-review-desk-result', 'ledgerflow-ci-fix-package']);
  const [cards, setCards] = useState<WorkCard[]>(() => readLocalStorageValue(CARD_KEY, []));
  const [sessions] = useState<StoredSession[]>(() => readLocalStorageArray<StoredSession>(SESSION_KEYS));
  const [draft, setDraft] = useState({ title: '', kind: 'Code' as WorkKind, request: '' });
  const audit = readLocalStorageValue<AgentOpsAuditEntry[]>(AGENT_OPS_AUDIT_KEY, []);
  const sessionCards = useMemo(() => sessions.map(sessionToCard), [sessions]);
  const allCards = useMemo(() => [...cards, ...sessionCards], [cards, sessionCards]);

  useEffect(() => writeLocalStorageValue(CARD_KEY, cards), [cards]);

  const pushAudit = (action: string, cardId: string, detail: string) => appendAgentOpsAudit(action, cardId, detail);

  useEffect(() => {
    const handleReviewResult = (event: Event) => {
      const detail = (event as CustomEvent<ReviewDeskResultEvent>).detail;
      const cardId = detail?.sourceCardId;
      if (!cardId || !detail?.result) return;
      setCards((current) => current.map((card) => card.id === cardId ? { ...card, status: 'Done' } : card));
      pushAudit('DRAFT_PR_CREATED', cardId, `Draft PR #${detail.result?.pullRequestNumber || '?'} created on ${detail.result?.branchName || 'ai/*'}: ${detail.result?.pullRequestUrl || 'no url'}`);
    };

    const handleCiFixPackage = (event: Event) => {
      const pack = (event as CustomEvent<CiFixPackage>).detail;
      if (!pack?.id) return;
      const cardId = `wb-ci-${Date.now()}`;
      const card: WorkCard = {
        id: cardId,
        title: `Fix CI failure for PR #${pack.pullRequestNumber}`,
        kind: 'CI Fix',
        owner: 'AI Dev',
        status: 'Waiting Approval',
        risk: 'HIGH',
        request: pack.prompt,
        plan: ['Open CI context', 'Identify failing check', 'Prepare small patch', 'Send through Review Desk'],
        tools: ['CI Doctor', 'GitHub Actions', 'Review Desk'],
        approval: 'Founder review required before risky patch execution.'
      };
      setCards((current) => [card, ...current]);
      pushAudit('CI_FIX_CARD_CREATED', cardId, `Created from failed workflow ${pack.workflowName} (${pack.conclusion || pack.status}) on ${pack.branchName}.`);
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
      status: 'Inbox',
      risk,
      request: draft.request.trim(),
      plan: ['Read context', 'Create sandbox plan', risk === 'LOW' ? 'Run in sandbox' : 'Request founder approval'],
      tools: draft.kind === 'Code' || draft.kind === 'CI Fix' ? ['Knowledge Library', 'Review Desk', 'CI Doctor'] : draft.kind === 'Integration' ? ['Connector Registry', 'Policy Gate', 'Review Desk'] : ['Knowledge Library', 'Sandbox'],
      approval: risk === 'LOW' ? 'Low risk: sandbox-first, still audited.' : 'Founder review required before execution outside sandbox.'
    };
    setCards((current) => [card, ...current]);
    pushAudit('CARD_CREATED', card.id, `Created ${card.kind} work card with ${card.risk} risk in Inbox.`);
    setDraft({ title: '', kind: draft.kind, request: '' });
  };

  const moveCard = (card: WorkCard, status: WorkStatus) => {
    setCards((current) => current.map((item) => item.id === card.id ? { ...item, status } : item));
    pushAudit('CARD_STATUS_CHANGED', card.id, `${card.status} → ${status}`);
  };

  const cardsByStatus = (status: WorkStatus) => allCards.filter((card) => card.status === status);

  return (
    <section className="rounded-3xl border border-violet-400/35 bg-violet-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Inbox → Planning → Waiting Approval → Ready → Done</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Ops Workboard</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">WorkCard là nguồn điều phối AI nhân sự. Rủi ro MEDIUM/HIGH không được tự chạy ngoài sandbox nếu chưa qua Gate.</p>
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
          <button onClick={addCard} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950 md:col-span-2">Đưa vào Inbox</button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-5">
        {columns.map((status) => (
          <div key={status} className="rounded-3xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-3">
              <p className="text-sm font-black text-white">{status}</p>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{statusHelp[status]}</p>
            </div>
            <div className="space-y-3">
              {cardsByStatus(status).map((card) => {
                const next = nextStatus(card);
                const imported = Boolean(card.sourceSessionId) && !cards.some((item) => item.id === card.id);
                return (
                  <article key={`${card.sourceSessionId ?? 'card'}-${card.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-white">{card.title}</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-400">{card.kind} · {card.owner}</p>
                      </div>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{card.risk}</span>
                    </div>
                    <p className="mt-3 line-clamp-4 text-xs font-semibold leading-5 text-slate-300">{card.request}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {card.tools.slice(0, 3).map((tool) => <span key={tool} className="rounded-full border border-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">{tool}</span>)}
                    </div>
                    {card.steps && <p className="mt-2 text-[11px] font-bold text-cyan-200">{card.steps.length} session steps</p>}
                    {!imported && next && <button onClick={() => moveCard(card, next)} className="mt-3 w-full rounded-xl border border-violet-300/40 px-3 py-2 text-[11px] font-black text-violet-100">Chuyển sang {next}</button>}
                    {card.status === 'Waiting Approval' && <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-2 text-[11px] font-bold leading-5 text-amber-100">Mở tab Approval Gate để duyệt trước khi chạy external action.</p>}
                    {imported && <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Imported session · read only</p>}
                  </article>
                );
              })}
              {cardsByStatus(status).length === 0 && <p className="rounded-2xl border border-dashed border-slate-800 p-3 text-xs font-semibold leading-5 text-slate-600">Chưa có card ở trạng thái này.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
