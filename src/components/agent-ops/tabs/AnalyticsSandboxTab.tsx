import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel, WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const SANDBOX_KEY = 'ledgerflow_analytics_sandbox_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type SandboxStatus = 'Draft' | 'Testing' | 'Reviewed' | 'Approved' | 'Archived';
type SandboxArea = 'Finance' | 'Growth' | 'Product' | 'Ops' | 'Risk' | 'Delivery';

type SandboxItem = {
  id: string;
  title: string;
  area: SandboxArea;
  status: SandboxStatus;
  risk: RiskLevel;
  baseline: number;
  target: number;
  metric: string;
  hypothesis: string;
  decisionRule: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const seedItems: SandboxItem[] = [
  {
    id: 'seed-sandbox-ci-cost',
    title: 'Giảm thời gian CI đỏ trước khi thêm feature',
    area: 'Ops',
    status: 'Testing',
    risk: 'LOW',
    baseline: 4,
    target: 1,
    metric: 'Số lỗi CI còn mở',
    hypothesis: 'Nếu sửa schema/type trước mỗi feature thì số lỗi CI còn mở sẽ giảm mạnh.',
    decisionRule: 'Chỉ thêm module mới khi lỗi type/build đã được xử lý hoặc có bằng chứng Actions xanh.',
    notes: 'Theo dõi sau mỗi commit AgentOps.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-sandbox-growth-offer',
    title: 'Kiểm tra offer Founder OS cho solo founder dùng AI',
    area: 'Growth',
    status: 'Draft',
    risk: 'MEDIUM',
    baseline: 0,
    target: 5,
    metric: 'Số lead phản hồi tích cực/tuần',
    hypothesis: 'Thông điệp Company OS + AI Workforce dễ hiểu hơn thông điệp ERP tổng quát.',
    decisionRule: 'Nếu có ít nhất 5 phản hồi tích cực thì đưa offer vào Growth Studio để test landing page.',
    notes: 'Không publish claim quá đà nếu chưa có evidence.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const statuses: SandboxStatus[] = ['Draft', 'Testing', 'Reviewed', 'Approved', 'Archived'];
const areas: SandboxArea[] = ['Finance', 'Growth', 'Product', 'Ops', 'Risk', 'Delivery'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

function deltaFor(item: SandboxItem) {
  return item.target - item.baseline;
}

function changePercent(item: SandboxItem) {
  if (item.baseline === 0) return item.target === 0 ? 0 : 100;
  return Math.round(((item.target - item.baseline) / Math.abs(item.baseline)) * 100);
}

function riskTone(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function statusTone(status: SandboxStatus) {
  if (status === 'Approved') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Testing') return 'border-cyan-400/40 text-cyan-200';
  if (status === 'Archived') return 'border-slate-700 text-slate-400';
  return 'border-amber-400/40 text-amber-200';
}

function expiryIso(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function markdownFor(item: SandboxItem) {
  return [
    `# Analytics Sandbox: ${item.title}`,
    '',
    `- Area: ${item.area}`,
    `- Metric: ${item.metric}`,
    `- Baseline: ${item.baseline}`,
    `- Target: ${item.target}`,
    `- Delta: ${deltaFor(item)} (${changePercent(item)}%)`,
    `- Risk: ${item.risk}`,
    `- Status: ${item.status}`,
    '',
    '## Hypothesis',
    item.hypothesis,
    '',
    '## Decision rule',
    item.decisionRule,
    '',
    '## Notes',
    item.notes,
  ].join('\n');
}

function makeWorkCard(item: SandboxItem): WorkCard {
  return {
    id: `analytics-${item.id}`,
    title: item.title,
    kind: 'Data',
    owner: 'AI Data Analyst',
    status: item.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
    risk: item.risk,
    request: item.hypothesis,
    plan: ['Validate data source', 'Run sandbox calculation', 'Summarize decision and evidence'],
    tools: ['Analytics Sandbox', 'Workboard', item.risk === 'LOW' ? 'Local report' : 'Approval Gate'],
    approval: item.risk === 'LOW' ? 'Sandbox only, no external action.' : 'Founder approval required before acting on this decision.',
    expectedOutput: markdownFor(item),
  };
}

function makeApproval(item: SandboxItem): ApprovalRequest {
  return {
    id: `approval-analytics-${item.id}-${Date.now()}`,
    title: `Approve analytics decision: ${item.title}`,
    source: 'Analytics Sandbox',
    sourceId: item.id,
    risk: item.risk === 'LOW' ? 'MEDIUM' : item.risk,
    action: 'Approve decision based on sandbox result',
    details: markdownFor(item),
    createdAt: new Date().toISOString(),
    expiresAt: expiryIso(),
    status: 'Pending',
  };
}

export default function AnalyticsSandboxTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<SandboxArea>('Finance');
  const [risk, setRisk] = useState<RiskLevel>('LOW');
  const [metric, setMetric] = useState('');
  const [baseline, setBaseline] = useState('0');
  const [target, setTarget] = useState('0');
  const [hypothesis, setHypothesis] = useState('');
  const [decisionRule, setDecisionRule] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'ALL' | SandboxArea>('ALL');

  const items = readLocalStorageValue<SandboxItem[]>(SANDBOX_KEY, seedItems);
  const visibleItems = useMemo(() => filter === 'ALL' ? items : items.filter((item) => item.area === filter), [filter, items]);
  const activeCount = items.filter((item) => item.status !== 'Archived').length;
  const highRiskCount = items.filter((item) => item.risk === 'HIGH').length;
  const averageTarget = items.length ? Math.round(items.reduce((sum, item) => sum + item.target, 0) / items.length) : 0;

  const saveItems = (next: SandboxItem[]) => writeLocalStorageValue(SANDBOX_KEY, next);

  const addItem = () => {
    if (!title.trim() || !metric.trim() || !hypothesis.trim()) return;
    const now = new Date().toISOString();
    const item: SandboxItem = {
      id: `sandbox-${Date.now()}`,
      title: title.trim(),
      area,
      status: 'Draft',
      risk,
      baseline: Number(baseline) || 0,
      target: Number(target) || 0,
      metric: metric.trim(),
      hypothesis: hypothesis.trim(),
      decisionRule: decisionRule.trim() || 'Founder reviews evidence before action.',
      notes: notes.trim() || 'No notes yet.',
      createdAt: now,
      updatedAt: now,
    };
    saveItems([item, ...items].slice(0, 200));
    appendAgentOpsAudit('ANALYTICS_SANDBOX_CREATED', item.id, `${item.area} · ${item.risk} · ${item.title}`);
    setTitle('');
    setMetric('');
    setBaseline('0');
    setTarget('0');
    setHypothesis('');
    setDecisionRule('');
    setNotes('');
  };

  const setStatus = (item: SandboxItem, status: SandboxStatus) => {
    const next = items.map((entry) => entry.id === item.id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry);
    saveItems(next);
    appendAgentOpsAudit('ANALYTICS_SANDBOX_STATUS_CHANGED', item.id, `${item.title} → ${status}`);
  };

  const copyBrief = async (item: SandboxItem) => {
    await navigator.clipboard.writeText(markdownFor(item));
    appendAgentOpsAudit('ANALYTICS_SANDBOX_COPIED', item.id, item.title);
  };

  const pushToWorkboard = (item: SandboxItem) => {
    appendLocalStorageArrayItem(WORKBOARD_KEY, makeWorkCard(item), 200);
    appendAgentOpsAudit('ANALYTICS_SANDBOX_TO_WORKBOARD', item.id, item.title);
  };

  const requestApproval = (item: SandboxItem) => {
    appendLocalStorageArrayItem(APPROVAL_KEY, makeApproval(item), 200);
    appendAgentOpsAudit('ANALYTICS_SANDBOX_APPROVAL_REQUESTED', item.id, item.title);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  return (
    <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Analytics & Sandbox</p>
          <h3 className="mt-1 text-xl font-black text-white">Decision sandbox trước khi hành động thật</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Thử KPI, giả lập giả thuyết, tạo evidence rồi mới đẩy sang Workboard hoặc Approval Gate.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-violet-300/40 px-3 py-1 text-violet-100">{items.length} tests</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{activeCount} active</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{highRiskCount} high risk</span>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-slate-300">avg target {averageTarget}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên sandbox / giả thuyết" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <input value={metric} onChange={(event) => setMetric(event.target.value)} placeholder="Metric cần đo" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <select value={area} onChange={(event) => setArea(event.target.value as SandboxArea)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">
          {areas.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-violet-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={baseline} onChange={(event) => setBaseline(event.target.value)} placeholder="Baseline" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Target" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
        <textarea value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="Giả thuyết cần kiểm tra" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300 md:col-span-2" />
        <textarea value={decisionRule} onChange={(event) => setDecisionRule(event.target.value)} placeholder="Quy tắc ra quyết định" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300 md:col-span-2" />
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ghi chú/evidence" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300 md:col-span-2" />
        <button onClick={addItem} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10 md:col-span-2">Thêm sandbox</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-violet-300 text-violet-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {areas.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-violet-300 text-violet-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{item.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{item.area} · {item.metric}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(item.status)}`}>{item.status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(item.risk)}`}>{item.risk}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs font-black text-slate-300 sm:grid-cols-3">
              <span className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">Baseline: {item.baseline}</span>
              <span className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">Target: {item.target}</span>
              <span className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">Delta: {deltaFor(item)} / {changePercent(item)}%</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{item.hypothesis}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Rule: {item.decisionRule}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => setStatus(item, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-violet-300 hover:text-violet-100">{status}</button>)}
              <button onClick={() => copyBrief(item)} className="rounded-xl border border-violet-300/50 px-3 py-2 text-[11px] font-black text-violet-100 hover:bg-violet-400/10">Copy brief</button>
              <button onClick={() => pushToWorkboard(item)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">To Workboard</button>
              <button onClick={() => requestApproval(item)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
