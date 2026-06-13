import { useEffect, useMemo, useState } from 'react';
import type { WorkCard, WorkKind } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, writeLocalStorageValue } from '../storage';

const FEEDBACK_KEY = 'ledgerflow_customer_feedback_v1';
const CARD_KEY = 'ledgerflow_aiops_cards_v1';

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
  status: 'New' | 'Converted' | 'Archived';
  suggestedAction: string;
};

function classify(text: string): Pick<FeedbackItem, 'type' | 'severity' | 'suggestedAction'> {
  const lower = text.toLowerCase();
  if (['lỗi', 'bug', 'crash', 'không chạy', 'sai'].some((x) => lower.includes(x))) return { type: 'Bug', severity: 'MEDIUM', suggestedAction: 'Tạo card cho AI QA và AI Dev kiểm tra.' };
  if (['rủi ro', 'pháp lý', 'thuế', 'bảo mật'].some((x) => lower.includes(x))) return { type: 'Risk', severity: 'HIGH', suggestedAction: 'Tạo card audit và yêu cầu founder review.' };
  if (['thêm', 'muốn', 'tính năng', 'nên có'].some((x) => lower.includes(x))) return { type: 'Idea', severity: 'MEDIUM', suggestedAction: 'Đưa vào Product Factory để chấm điểm.' };
  return { type: 'Question', severity: 'LOW', suggestedAction: 'Biến thành FAQ hoặc SOP nếu lặp lại.' };
}

function ownerFor(type: FeedbackType) {
  if (type === 'Bug') return 'AI QA';
  if (type === 'Risk') return 'AI Auditor';
  if (type === 'Idea') return 'AI Product Manager';
  return 'AI Chief of Staff';
}

function kindFor(type: FeedbackType): WorkKind {
  if (type === 'Bug') return 'CI Fix';
  if (type === 'Risk') return 'Audit';
  if (type === 'Idea') return 'Product';
  return 'Q&A';
}

function statusFor(severity: FeedbackSeverity): WorkCard['status'] {
  return severity === 'LOW' ? 'Inbox' : 'Waiting Approval';
}

export default function FeedbackLoopTab() {
  const [items, setItems] = useState<FeedbackItem[]>(() => readLocalStorageValue(FEEDBACK_KEY, []));
  const [source, setSource] = useState('Manual');
  const [persona, setPersona] = useState('User');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'All' | FeedbackType>('All');

  useEffect(() => writeLocalStorageValue(FEEDBACK_KEY, items), [items]);

  const filtered = filter === 'All' ? items : items.filter((item) => item.type === filter);
  const counts = useMemo(() => ({
    total: items.length,
    ideas: items.filter((item) => item.type === 'Idea').length,
    bugs: items.filter((item) => item.type === 'Bug').length,
    risks: items.filter((item) => item.type === 'Risk').length,
    converted: items.filter((item) => item.status === 'Converted').length
  }), [items]);

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
    appendAgentOpsAudit('FEEDBACK_CAPTURED', item.id, `${item.type}/${item.severity}`);
    setMessage('');
  };

  const convertToWorkCard = (item: FeedbackItem) => {
    const card: WorkCard = {
      id: `fb-card-${Date.now()}`,
      title: `${item.type}: ${item.message.slice(0, 64)}`,
      kind: kindFor(item.type),
      owner: ownerFor(item.type),
      status: statusFor(item.severity),
      risk: item.severity,
      request: `${item.source} / ${item.persona}: ${item.message}`,
      plan: ['Triage feedback', 'Find evidence', 'Propose action', item.severity === 'LOW' ? 'Sandbox response' : 'Founder review'],
      tools: item.type === 'Bug' ? ['Workboard', 'CI Doctor'] : item.type === 'Risk' ? ['Risk Register', 'Approval Gate'] : ['Product Factory', 'Prompt Pack'],
      approval: item.severity === 'LOW' ? 'Sandbox allowed.' : 'Founder review required.',
      sourceSessionId: item.id,
      expectedOutput: item.suggestedAction,
      founderReview: item.severity === 'LOW' ? 'Optional.' : 'Required.'
    };
    appendLocalStorageArrayItem<WorkCard>(CARD_KEY, card);
    setItems((current) => current.map((fb) => fb.id === item.id ? { ...fb, status: 'Converted' } : fb));
    appendAgentOpsAudit('FEEDBACK_CONVERTED_TO_WORKCARD', item.id, card.title);
  };

  const archiveFeedback = (item: FeedbackItem) => {
    setItems((current) => current.map((fb) => fb.id === item.id ? { ...fb, status: 'Archived' } : fb));
    appendAgentOpsAudit('FEEDBACK_ARCHIVED', item.id, item.type);
  };

  const copyReport = async () => {
    const report = `# Feedback Loop Report\n\nTotal: ${counts.total}\nIdeas: ${counts.ideas}\nBugs: ${counts.bugs}\nRisks: ${counts.risks}\nConverted: ${counts.converted}`;
    await navigator.clipboard.writeText(report);
    appendAgentOpsAudit('FEEDBACK_REPORT_COPIED', 'feedback-loop', `Copied ${items.length} items.`);
  };

  return (
    <section className="rounded-3xl border border-amber-400/35 bg-amber-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">Feedback loop</p>
          <h3 className="mt-1 text-xl font-black text-white">Customer Feedback Loop</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Thu phản hồi, phân loại và đẩy thành WorkCard đúng schema.</p>
        </div>
        <button onClick={copyReport} className="rounded-2xl border border-amber-300/40 px-4 py-2 text-xs font-black text-amber-100">Copy report</button>
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
            <input value={source} onChange={(event) => setSource(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Nguồn" />
            <input value={persona} onChange={(event) => setPersona(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Persona" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Nội dung feedback" />
            <button onClick={addFeedback} className="w-full rounded-2xl bg-amber-300 px-4 py-2 text-xs font-black text-slate-950">Phân loại & lưu</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Bộ lọc</p>
          <select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | FeedbackType)} className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            {['All', 'Idea', 'Bug', 'Risk', 'Question'].map((item) => <option key={item}>{item}</option>)}
          </select>
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
              <button onClick={() => archiveFeedback(item)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300">Archive</button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm font-semibold text-slate-500">Chưa có feedback phù hợp.</p>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center"><p className="text-[10px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}
