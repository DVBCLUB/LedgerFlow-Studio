import { useMemo, useState } from 'react';

const TOOL_CARD_KEY = 'ledgerflow_tool_cards_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';
const APPROVAL_KEY = 'ledgerflow_aiops_approvals_v1';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ToolStatus = 'Draft' | 'Sandbox Ready' | 'Waiting Approval' | 'Approved' | 'Blocked' | 'Executed';

type ToolCard = {
  id: string;
  name: string;
  owner: string;
  connector: string;
  risk: RiskLevel;
  status: ToolStatus;
  intent: string;
  input: string;
  expectedOutput: string;
  sandboxRule: string;
  approvalRule: string;
  blockedActions: string[];
  createdAt: string;
};

type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

type ApprovalRequest = {
  id: string;
  title: string;
  source: string;
  sourceId?: string;
  risk: RiskLevel;
  action: string;
  details: string;
  conditions?: string;
  createdAt: string;
  expiresAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
};

const seedToolCards: ToolCard[] = [
  {
    id: 'tool-github-draft-pr',
    name: 'GitHub Draft PR Launcher',
    owner: 'AI Dev',
    connector: 'GitHub Connector',
    risk: 'HIGH',
    status: 'Waiting Approval',
    intent: 'Create branch, commit proposed file changes, and open a Draft PR after founder approval.',
    input: 'repo, base branch, file patch, commit message, approval phrase',
    expectedOutput: 'new branch, commit sha, draft PR url, audit event',
    sandboxRule: 'Dry-run must show file paths and patch summary before any GitHub write.',
    approvalRule: 'Founder approval phrase required before branch/commit/PR action.',
    blockedActions: ['Push directly to main', 'Commit secrets', 'Bypass CI', 'Merge PR automatically'],
    createdAt: 'seed'
  },
  {
    id: 'tool-code-plan',
    name: 'AI Code Plan',
    owner: 'AI Dev',
    connector: 'AI Gateway',
    risk: 'MEDIUM',
    status: 'Sandbox Ready',
    intent: 'Turn a WorkCard or Product Factory idea into a file-by-file code plan.',
    input: 'brief, target files, acceptance criteria, guardrails',
    expectedOutput: 'implementation plan, risk list, test checklist, no direct code write',
    sandboxRule: 'May run in sandbox and produce text plan only.',
    approvalRule: 'Founder approval required before executing code changes.',
    blockedActions: ['Edit files without approval', 'Invent new architecture without reason', 'Hardcode keys'],
    createdAt: 'seed'
  },
  {
    id: 'tool-connector-test',
    name: 'Connector Health Test',
    owner: 'AI Integration Agent',
    connector: 'Integration Hub',
    risk: 'LOW',
    status: 'Sandbox Ready',
    intent: 'Test connector health and record result for founder review.',
    input: 'connector id, test mode, timeout',
    expectedOutput: 'status, latency, error message if any, audit event',
    sandboxRule: 'Read-only test only; do not mutate external systems.',
    approvalRule: 'No approval needed for read-only test, but audit is required.',
    blockedActions: ['Write external data', 'Rotate keys automatically', 'Delete connector'],
    createdAt: 'seed'
  },
  {
    id: 'tool-release-audit',
    name: 'Release Readiness Audit',
    owner: 'AI Auditor',
    connector: 'Local Audit Log',
    risk: 'MEDIUM',
    status: 'Sandbox Ready',
    intent: 'Review whether a feature is safe to ship under learning/R&D/simulation positioning.',
    input: 'changed files, release note, known risks, manual test result',
    expectedOutput: 'ship/hold decision, risk controls, test checklist, disclaimer check',
    sandboxRule: 'May read local state and generate audit memo.',
    approvalRule: 'Founder decides final ship/hold.',
    blockedActions: ['Deploy automatically', 'Ignore legal/accounting disclaimer', 'Mark untested feature as ready'],
    createdAt: 'seed'
  }
];

const ownerOptions = ['AI Chief of Staff', 'AI Dev', 'AI Integration Agent', 'AI Auditor', 'AI QA', 'AI Data Analyst'];
const connectorOptions = ['AI Gateway', 'GitHub Connector', 'Integration Hub', 'Local Audit Log', 'Google Workspace', 'Knowledge Library'];

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

function defaultStatus(risk: RiskLevel): ToolStatus {
  if (risk === 'LOW') return 'Sandbox Ready';
  return 'Waiting Approval';
}

function pushAudit(action: string, cardId: string, detail: string) {
  const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
  writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId, detail }, ...current].slice(0, 120));
}

export default function ToolCardsTab() {
  const [customCards, setCustomCards] = useState<ToolCard[]>(() => readLocal(TOOL_CARD_KEY, []));
  const [draft, setDraft] = useState({
    name: '',
    owner: ownerOptions[1],
    connector: connectorOptions[0],
    risk: 'MEDIUM' as RiskLevel,
    intent: '',
    input: '',
    expectedOutput: '',
    blockedActions: ''
  });
  const [filter, setFilter] = useState<'All' | RiskLevel>('All');
  const [copied, setCopied] = useState<string | null>(null);

  const cards = useMemo(() => [...seedToolCards, ...customCards], [customCards]);
  const filteredCards = filter === 'All' ? cards : cards.filter((card) => card.risk === filter);

  const saveCustomCards = (next: ToolCard[]) => {
    setCustomCards(next);
    writeLocal(TOOL_CARD_KEY, next);
  };

  const addCard = () => {
    if (!draft.name.trim() || !draft.intent.trim()) return;
    const card: ToolCard = {
      id: `tool-${Date.now()}`,
      name: draft.name.trim(),
      owner: draft.owner,
      connector: draft.connector,
      risk: draft.risk,
      status: defaultStatus(draft.risk),
      intent: draft.intent.trim(),
      input: draft.input.trim() || 'TBD by founder',
      expectedOutput: draft.expectedOutput.trim() || 'TBD by founder',
      sandboxRule: draft.risk === 'LOW' ? 'Read-only/sandbox execution allowed with audit.' : 'Dry-run only until founder approves.',
      approvalRule: draft.risk === 'LOW' ? 'No external mutation; audit required.' : 'Founder Approval Gate required before external action.',
      blockedActions: draft.blockedActions.split('\n').map((x) => x.trim()).filter(Boolean),
      createdAt: new Date().toLocaleString('vi-VN')
    };
    saveCustomCards([card, ...customCards]);
    pushAudit('TOOL_CARD_CREATED', card.id, `${card.name} (${card.risk}) created.`);
    setDraft({ ...draft, name: '', intent: '', input: '', expectedOutput: '', blockedActions: '' });
  };

  const requestApproval = (card: ToolCard) => {
    const current = readLocal<ApprovalRequest[]>(APPROVAL_KEY, []);
    const approval: ApprovalRequest = {
      id: `appr-tool-${Date.now()}`,
      title: `Approve tool card: ${card.name}`,
      source: 'ToolCardsTab',
      sourceId: card.id,
      risk: card.risk === 'LOW' ? 'MEDIUM' : card.risk,
      action: `Allow ${card.owner} to use ${card.connector} for: ${card.intent}`,
      details: `Input: ${card.input}. Expected output: ${card.expectedOutput}. Sandbox rule: ${card.sandboxRule}.`,
      conditions: `${card.approvalRule} Blocked: ${card.blockedActions.join('; ') || 'none listed'}.`,
      createdAt: new Date().toLocaleString('vi-VN'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('vi-VN'),
      status: 'Pending'
    };
    writeLocal(APPROVAL_KEY, [approval, ...current]);
    pushAudit('TOOL_CARD_APPROVAL_REQUESTED', card.id, `Approval request created for ${card.name}.`);
  };

  const copyRunbook = async (card: ToolCard) => {
    const text = `# Tool Card Runbook\n\nTool: ${card.name}\nOwner: ${card.owner}\nConnector: ${card.connector}\nRisk: ${card.risk}\nStatus: ${card.status}\n\nIntent:\n${card.intent}\n\nInput:\n${card.input}\n\nExpected output:\n${card.expectedOutput}\n\nSandbox rule:\n${card.sandboxRule}\n\nApproval rule:\n${card.approvalRule}\n\nBlocked actions:\n${card.blockedActions.map((x) => `- ${x}`).join('\n') || '- None listed'}\n\nGuardrails:\n- Founder is final approver.\n- Medium/high risk external action must go through Approval Gate.\n- Always write audit trail.\n- Never hardcode or expose secrets.\n- Keep LedgerFlow positioned as learning/R&D/simulation + Company OS, not ERP replacement.`;
    await navigator.clipboard.writeText(text);
    pushAudit('TOOL_CARD_RUNBOOK_COPIED', card.id, `${card.name} runbook copied.`);
    setCopied(card.id);
    setTimeout(() => setCopied(null), 1200);
  };

  const markExecuted = (card: ToolCard) => {
    if (card.createdAt === 'seed') {
      pushAudit('TOOL_CARD_SEED_EXECUTION_NOTE', card.id, 'Seed card execution noted; seed cards are immutable templates.');
      return;
    }
    const next = customCards.map((item) => item.id === card.id ? { ...item, status: 'Executed' as ToolStatus } : item);
    saveCustomCards(next);
    pushAudit('TOOL_CARD_EXECUTED', card.id, `${card.name} marked executed by founder.`);
  };

  return (
    <section className="rounded-3xl border border-fuchsia-400/35 bg-fuchsia-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-200">OpenClaw-style tool cards · sandbox-first · approval-first</p>
          <h3 className="mt-1 text-xl font-black text-white">Tool Cards & Sandbox Policy</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chuẩn hóa mọi hành động AI thành card có owner, connector, risk, sandbox rule, approval rule và blocked actions.</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | RiskLevel)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white">
          {['All', 'LOW', 'MEDIUM', 'HIGH'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Tạo Tool Card custom</p>
          <div className="mt-3 grid gap-2">
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Tên tool card" className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <div className="grid gap-2 md:grid-cols-3">
              <select value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{ownerOptions.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={draft.connector} onChange={(event) => setDraft({ ...draft, connector: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{connectorOptions.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as RiskLevel })} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{['LOW', 'MEDIUM', 'HIGH'].map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <textarea value={draft.intent} onChange={(event) => setDraft({ ...draft, intent: event.target.value })} placeholder="Tool dùng để làm gì?" className="min-h-[86px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <textarea value={draft.input} onChange={(event) => setDraft({ ...draft, input: event.target.value })} placeholder="Input cần có" className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <textarea value={draft.expectedOutput} onChange={(event) => setDraft({ ...draft, expectedOutput: event.target.value })} placeholder="Output mong muốn" className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <textarea value={draft.blockedActions} onChange={(event) => setDraft({ ...draft, blockedActions: event.target.value })} placeholder="Blocked actions, mỗi dòng 1 hành động cấm" className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <button onClick={addCard} className="rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black text-slate-950">Lưu Tool Card</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Policy vocabulary</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[
              'LOW: read-only/sandbox + audit, không external write.',
              'MEDIUM: dry-run trước, founder duyệt trước external action.',
              'HIGH: approval phrase, branch/PR, CI, release audit bắt buộc.',
              'BLOCKED: không merge main, không commit secret, không tự deploy.',
              'Every tool run must create audit evidence.',
              'Founder remains final approver for risky decisions.'
            ].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-300">• {item}</p>)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredCards.map((card) => (
          <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-300">{card.owner} · {card.connector}</p>
                <h4 className="mt-1 text-sm font-black text-white">{card.name}</h4>
                <p className="mt-1 text-[10px] font-bold text-slate-500">{card.status} · {card.createdAt}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{card.risk}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{card.intent}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Info title="Input" body={card.input} />
              <Info title="Expected output" body={card.expectedOutput} />
              <Info title="Sandbox rule" body={card.sandboxRule} />
              <Info title="Approval rule" body={card.approvalRule} />
            </div>
            <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3">
              <p className="text-[10px] font-black uppercase text-rose-200">Blocked actions</p>
              {card.blockedActions.map((item) => <p key={item} className="mt-1 text-xs font-semibold leading-5 text-rose-50">• {item}</p>)}
              {card.blockedActions.length === 0 && <p className="mt-1 text-xs font-semibold text-rose-50">• Không có blocked action được khai báo.</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copyRunbook(card)} className="rounded-xl border border-fuchsia-300/40 px-3 py-2 text-[11px] font-black text-fuchsia-100">{copied === card.id ? 'Đã copy' : 'Copy runbook'}</button>
              <button onClick={() => requestApproval(card)} className="rounded-xl border border-amber-300/40 px-3 py-2 text-[11px] font-black text-amber-100">Gửi Approval Gate</button>
              <button onClick={() => markExecuted(card)} className="rounded-xl border border-emerald-300/40 px-3 py-2 text-[11px] font-black text-emerald-100">Mark executed</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-[10px] font-black uppercase text-slate-500">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{body}</p></div>;
}
