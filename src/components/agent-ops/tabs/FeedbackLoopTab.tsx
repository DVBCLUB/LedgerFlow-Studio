import { useEffect, useMemo, useState } from 'react';

const FEEDBACK_KEY = 'ledgerflow_customer_feedback_v1';
const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';

type FeedbackType = 'Idea' | 'Bug' | 'Risk' | 'Question';
type FeedbackSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

type FeedbackItem = {
  id: string;
  at: string;
  source: string;
  persona: string;
  message: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  status: 'New' | 'Triaged' | 'Converted' | 'Archived';
  suggestedAction: string;
};

type WorkCard = {
  id: string;
  title: string;
  kind: 'Product' | 'Audit' | 'CI Fix' | 'Q&A';
  owner: string;
  status: 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
  risk: FeedbackSeverity;
  request: string;
  plan: string[];
  tools: string[];
  approval: string;
};

type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

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

function classify(text: string): Pick<FeedbackItem, 'type' | 'severity' | 'suggestedAction'> {
  const lower = text.toLowerCase();
  if (['lỗi', 'bug', 'crash', 'trắng màn', 'không chạy', 'sai'].some((x) => lower.includes(x))) {
    return { type: 'Bug', severity: lower.includes('crash') || lower.includes('trắng màn') ? 'HIGH' : 'MEDIUM', suggestedAction: 'Giao AI QA tái hiện lỗi, tạo test case và đưa AI Dev sửa patch nhỏ.' };
  }
  if (['rủi ro', 'pháp lý', 'thuế', 'sai luật', 'bảo mật', 'secret', 'api key'].some((x) => lower.includes(x))) {
    return { type: 'Risk', severity: 'HIGH', suggestedAction: 'Giao AI Auditor rà soát wording/guardrail, không release nếu gây hiểu nhầm tư vấn chính thức.' };
  }
  if (['ước gì', 'nên có', 'thêm', 'muốn', 'tính năng'].some((x) => lower.includes(x))) {
    return { type: 'Idea', severity: 'MEDIUM', suggestedAction: 'Đưa vào Idea Portfolio/Product Factory, chấm GO/HOLD/NO-GO trước khi code.' };
  }
  return { type: 'Question', severity: 'LOW', suggestedAction: 'Giao AI Chief of Staff trả lời, nếu lặp lại nhiều lần thì biến thành FAQ/SOP.' };
}

function ownerFor(type: FeedbackType) {
  if (type === 'Bug') return 'AI QA';
  if (type === 'Risk') return 'AI Auditor';
  if (type === 'Idea') return 'AI Product Manager';
  return 'AI Chief of Staff';
}

function kindFor(type: FeedbackType): WorkCard['kind'] {
  if (type === 'Bug') return 'CI Fix';
  if (type === 'Risk') return 'Audit';
  if (type === 'Idea') return 'Product';
  return 'Q&A';
}

export default function FeedbackLoopTab() {
  const [items, setItems] = useState<FeedbackItem[]>(() => readLocal(FEEDBACK_KEY, []));
  const [source, setSource] = useState('Manual demo');
  const [persona, setPersona] = useState('Kế toán/solo founder dùng thử');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'All' | FeedbackType>('All');

  useEffect(() => writeLocal(FEEDBACK_KEY, items), [items]);

  const filtered = filter === 'All' ? items : items.filter((item) => item.type === filter);
  const counts = useMemo(() => ({
    total: items.length,
    ideas: items.filter((item) => item.type === 'Idea').length,
    bugs: items.filter((item) => item.type === 'Bug').length,
    risks: items.filter((item) => item.type === 'Risk').length,
    converted: items.filter((item) => item.status === 'Converted').length
  }), [items]);

  const pushAudit = (action: string, cardId: string, detail: string) => {
    const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId, detail }, ...current].slice(0, 120));
  };

  const addFeedback = () => {
    if (!message.trim()) return;
    const result = classify(message);
    const item: FeedbackItem = {
      id: `fb-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      source,
      persona,
      message: message.trim(),
      type: result.type,
      severity: result.severity,
      status: 'New',
      suggestedAction: result.suggestedAction
    };
    setItems((current) => [item, ...current]);
    pushAudit('FEEDBACK_CAPTURED', item.id, `${item.type}/${item.severity}: ${item.message.slice(0, 90)}`);
    setMessage('');
  };

  const convertToWorkCard = (item: FeedbackItem) => {
    const current = readLocal<WorkCard[]>(CARD_KEY, []);
    const card: WorkCard = {
      id: `fb-card-${Date.now()}`,
      title: `${item.type}: ${item.message.slice(0, 64)}`,
      kind: kindFor(item.type),
      owner: ownerFor(item.type),
      status: item.severity === 'LOW' ? 'Inbox' : 'Waiting Approval',
      risk: item.severity,
      request: `Feedback từ ${item.source} / ${item.persona}: ${item.message}`,
      plan: ['Triage feedback', 'Find evidence', 'Propose small action', item.severity === 'LOW' ? 'Run sandbox response' : 'Request founder approval'],
      tools: item.type === 'Bug' ? ['Workboard', 'CI Doctor', 'Review Desk'] : item.type === 'Risk' ? ['Risk Register', 'Approval Gate', 'Release Audit'] : ['Idea Portfolio', 'Product Factory', 'Prompt Pack'],
      approval: item.severity === 'LOW' ? 'Low risk, sandbox response allowed.' : 'Founder review required before external/product change.'
    };
    writeLocal(CARD_KEY, [card, ...current]);
    setItems((currentItems) => currentItems.map((fb) => fb.id === item.id ? { ...fb, status: 'Converted' } : fb));
    pushAudit('FEEDBACK_CONVERTED_TO_WORKCARD', item.id, `Created ${card.kind} WorkCard for ${item.type}.`);
  };

  const copyReport = async () => {
    const report = `# Feedback Loop Report\n\nGenerated: ${new Date().toLocaleString('vi-VN')}\n\nTotal: ${counts.total}\nIdeas: ${counts.ideas}\nBugs: ${counts.bugs}\nRisks: ${counts.risks}\nConverted: ${counts.converted}\n\n${items.map((item) => `## ${item.type} / ${item.severity} / ${item.status}\nSource: ${item.source}\nPersona: ${item.persona}\nFeedback: ${item.message}\nSuggested action: ${item.suggestedAction}`).join('\n\n')}`;
    await navigator.clipboard.writeText(report);
    pushAudit('FEEDBACK_REPORT_COPIED', 'feedback-loop', `Copied ${items.length} feedback items.`);
  };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Feedback → Idea/Bug/Risk → WorkCard</p>
          <h3 className="mt-1 text-xl font-black text-white">Customer Feedback Loop</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Thu phản hồi dùng thử, phân loại cục bộ và đẩy thành việc cho AI nhân sự. MVP dùng localStorage, có audit trail.</p>
        </div>
        <button onClick={copyReport} className="rounded-2xl border border-amber-300/40 px-4 py-2 text-xs font-black text-amber-100">Copy feedback report</button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <Metric label="Total" value={counts.total} />
        <Metric label="Ideas" value={counts.ideas} />
        <Metric label="Bugs" value={counts.bugs} />
        <Metric label="Risks" value={counts.risks} />
        <Metric label="Converted" value={counts.converted} />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Nhập feedback mới</p>
          <div className="mt-3 space-y-2">
            <input value={source} onChange={(event) => setSource(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Nguồn: demo, group, Google Form..." />
            <input value={persona} onChange={(event) => setPersona(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Persona" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Nội dung feedback người dùng..." />
            <button onClick={addFeedback} className="w-full rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Phân loại & lưu feedback</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Rule phân loại MVP</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <Rule title="Idea" body="Có từ khóa thêm, nên có, muốn, tính năng → Product Factory." />
            <Rule title="Bug" body="Có lỗi, bug, crash, trắng màn, sai → AI QA / CI Fix." />
            <Rule title="Risk" body="Có thuế, pháp lý, bảo mật, API key → AI Auditor / Gate." />
            <Rule title="Question" body="Câu hỏi chung → AI Chief of Staff / FAQ/SOP." />
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Lọc</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | FeedbackType)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {['All', 'Idea', 'Bug', 'Risk', 'Question'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">{item.type} · {item.severity} · {item.status}</p>
                <h4 className="mt-1 text-sm font-black text-white">{item.persona}</h4>
                <p className="mt-1 text-[10px] font-bold text-slate-500">{item.source} · {item.at}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{ownerFor(item.type)}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{item.message}</p>
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-50">{item.suggestedAction}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => convertToWorkCard(item)} className="rounded-xl border border-amber-300/40 px-3 py-2 text-[11px] font-black text-amber-100">Đẩy sang Workboard</button>
              <button onClick={() => setItems((current) => current.map((fb) => fb.id === item.id ? { ...fb, status: 'Archived' } : fb))} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300">Archive</button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm font-semibold text-slate-500">Chưa có feedback phù hợp bộ lọc.</p>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}

function Rule({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs font-black text-white">{title}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">{body}</p></div>;
}
