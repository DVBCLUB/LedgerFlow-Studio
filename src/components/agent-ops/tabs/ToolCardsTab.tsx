import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, writeLocalStorageValue } from '../storage';

const TOOL_CARD_KEY = 'ledgerflow_tool_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type ToolCard = {
  id: string;
  name: string;
  owner: string;
  connector: string;
  risk: RiskLevel;
  intent: string;
  sandboxRule: string;
  approvalRule: string;
  blockedActions: string[];
  createdAt: string;
};

const seedCards: ToolCard[] = [
  { id: 'tool-github-draft-pr', name: 'GitHub Draft PR Launcher', owner: 'AI Dev', connector: 'GitHub Connector', risk: 'HIGH', intent: 'Create branch, commit file changes and open Draft PR only after founder approval.', sandboxRule: 'Dry-run patch summary first.', approvalRule: 'Founder approval phrase required.', blockedActions: ['Push directly to main', 'Commit secrets', 'Merge automatically'], createdAt: 'seed' },
  { id: 'tool-code-plan', name: 'AI Code Plan', owner: 'AI Dev', connector: 'AI Gateway', risk: 'MEDIUM', intent: 'Turn WorkCard into file-by-file code plan.', sandboxRule: 'Text plan only.', approvalRule: 'Founder approves before code edit.', blockedActions: ['Edit files without approval', 'Hardcode API keys'], createdAt: 'seed' },
  { id: 'tool-connector-test', name: 'Connector Health Test', owner: 'AI Integration Agent', connector: 'Integration Hub', risk: 'LOW', intent: 'Read-only connector health test.', sandboxRule: 'Read-only test allowed.', approvalRule: 'Audit required.', blockedActions: ['Write external data', 'Delete connector'], createdAt: 'seed' }
];

function approvalRiskFor(card: ToolCard): RiskLevel {
  return card.risk === 'LOW' ? 'MEDIUM' : card.risk;
}

function approvalExpiryIso(days = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export default function ToolCardsTab() {
  const [customCards, setCustomCards] = useState<ToolCard[]>(() => readLocalStorageValue(TOOL_CARD_KEY, []));
  const [filter, setFilter] = useState<'All' | RiskLevel>('All');
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', owner: 'AI Dev', connector: 'AI Gateway', risk: 'MEDIUM' as RiskLevel, intent: '', blockedActions: '' });

  const cards = useMemo(() => [...seedCards, ...customCards], [customCards]);
  const filtered = filter === 'All' ? cards : cards.filter((card) => card.risk === filter);

  const saveCards = (next: ToolCard[]) => {
    setCustomCards(next);
    writeLocalStorageValue(TOOL_CARD_KEY, next);
  };

  const addCard = () => {
    if (!draft.name.trim() || !draft.intent.trim()) return;
    const card: ToolCard = {
      id: `tool-${Date.now()}`,
      name: draft.name.trim(),
      owner: draft.owner,
      connector: draft.connector,
      risk: draft.risk,
      intent: draft.intent.trim(),
      sandboxRule: draft.risk === 'LOW' ? 'Read-only sandbox execution allowed.' : 'Dry-run only until founder approval.',
      approvalRule: draft.risk === 'LOW' ? 'Audit required.' : 'Founder Approval Gate required.',
      blockedActions: draft.blockedActions.split('\n').map((x) => x.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };
    saveCards([card, ...customCards]);
    appendAgentOpsAudit('TOOL_CARD_CREATED', card.id, `${card.name} (${card.risk}) created.`);
    setDraft({ ...draft, name: '', intent: '', blockedActions: '' });
  };

  const requestApproval = (card: ToolCard) => {
    const request: ApprovalRequest = {
      id: `appr-tool-${Date.now()}`,
      title: `Approve tool card: ${card.name}`,
      source: 'ToolCardsTab',
      sourceId: card.id,
      risk: approvalRiskFor(card),
      action: `Allow ${card.owner} to use ${card.connector}`,
      details: card.intent,
      conditions: `${card.approvalRule} Blocked: ${card.blockedActions.join('; ') || 'none listed'}.`,
      createdAt: new Date().toISOString(),
      expiresAt: approvalExpiryIso(),
      status: 'Pending'
    };
    appendLocalStorageArrayItem<ApprovalRequest>(APPROVAL_KEY, request, 120);
    appendAgentOpsAudit('TOOL_CARD_APPROVAL_REQUESTED', card.id, `Approval requested for ${card.name}.`);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyRunbook = async (card: ToolCard) => {
    const text = `# Tool Card\n\nTool: ${card.name}\nOwner: ${card.owner}\nConnector: ${card.connector}\nRisk: ${card.risk}\n\nIntent: ${card.intent}\nSandbox: ${card.sandboxRule}\nApproval: ${card.approvalRule}\nBlocked:\n${card.blockedActions.map((item) => `- ${item}`).join('\n') || '- None'}`;
    await navigator.clipboard.writeText(text);
    setCopied(card.id);
    appendAgentOpsAudit('TOOL_CARD_RUNBOOK_COPIED', card.id, `${card.name} runbook copied.`);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">tool cards · sandbox-first · approval-first</p>
          <h3 className="mt-1 text-xl font-black text-white">Tool Cards & Sandbox Policy</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Bản ổn định CI: quản lý thẻ công cụ, copy runbook và gửi Approval Gate.</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | RiskLevel)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
          {['All', 'LOW', 'MEDIUM', 'HIGH'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mb-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-sm font-black text-white">Tạo Tool Card custom</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Tên tool card" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <select value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as RiskLevel })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
          <input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <input value={draft.connector} onChange={(event) => setDraft({ ...draft, connector: event.target.value })} placeholder="Connector" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <textarea value={draft.intent} onChange={(event) => setDraft({ ...draft, intent: event.target.value })} placeholder="Intent" className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white md:col-span-2" />
          <textarea value={draft.blockedActions} onChange={(event) => setDraft({ ...draft, blockedActions: event.target.value })} placeholder="Blocked actions, mỗi dòng 1 mục" className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white md:col-span-2" />
          <button onClick={addCard} className="rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black text-slate-950 md:col-span-2">Lưu Tool Card</button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((card) => <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300">{card.owner} · {card.connector}</p><h4 className="mt-1 text-sm font-black text-white">{card.name}</h4><p className="mt-1 text-[10px] font-bold text-slate-500">{card.createdAt}</p></div><span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{card.risk}</span></div><p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{card.intent}</p><p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold leading-5 text-slate-400">Sandbox: {card.sandboxRule}<br />Approval: {card.approvalRule}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => copyRunbook(card)} className="rounded-xl border border-fuchsia-300/40 px-3 py-2 text-[11px] font-black text-fuchsia-100">{copied === card.id ? 'Đã copy' : 'Copy runbook'}</button><button onClick={() => requestApproval(card)} className="rounded-xl border border-amber-300/40 px-3 py-2 text-[11px] font-black text-amber-100">Gửi Approval Gate</button></div></article>)}
      </div>
    </section>
  );
}
