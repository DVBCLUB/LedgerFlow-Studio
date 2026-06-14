import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion } from '../storage';

const TASK_KEY = 'ledgerflow_ai_task_queue_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';
const FINANCE_CORE_KEY = 'ledgerflow_finance_core_v1';
const PROJECTS_CORE_KEY = 'ledgerflow_projects_delivery_core_v1';
const SOP_KEY = 'ledgerflow_founder_sop_library_v1';
const RISK_KEY = 'ledgerflow_founder_risk_register_v1';

type FounderView = 'dashboard' | 'orders' | 'ideas' | 'sops' | 'risk';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type ReviewStatus = 'Draft' | 'Needs Review' | 'Approved';

type LooseRecord = Record<string, unknown>;

type FounderSop = {
  id: string;
  title: string;
  owner: string;
  status: ReviewStatus;
  steps: string;
  createdAt: string;
};

type FounderRisk = {
  id: string;
  title: string;
  risk: RiskLevel;
  mitigation: string;
  releaseGate: string;
  createdAt: string;
};

const views: { id: FounderView; label: string }[] = [
  { id: 'dashboard', label: 'Founder Dashboard' },
  { id: 'orders', label: 'AI Work Orders' },
  { id: 'ideas', label: 'Idea Portfolio' },
  { id: 'sops', label: 'SOP Library' },
  { id: 'risk', label: 'Risk & Release' },
];

const seedSops: FounderSop[] = [
  {
    id: 'sop-ci-green-first',
    title: 'CI xanh trước khi thêm feature',
    owner: 'AI Dev',
    status: 'Approved',
    steps: '1) Đọc lỗi CI. 2) Sửa đúng file/dòng. 3) Commit nhỏ. 4) Chờ Actions xanh. 5) Mới thêm feature.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sop-approval-first',
    title: 'Approval-first cho external action',
    owner: 'Chief of Staff',
    status: 'Approved',
    steps: 'Mọi hành động ghi file, gửi email, gọi API thật hoặc tạo PR phải có approval request và audit log.',
    createdAt: new Date().toISOString(),
  },
];

const seedRisks: FounderRisk[] = [
  {
    id: 'risk-scope-creep',
    title: 'Phình scope thành ERP quá sớm',
    risk: 'HIGH',
    mitigation: 'Giữ app ở Company OS + simulation/R&D. Chỉ production hóa module khi đã có approval và checklist.',
    releaseGate: 'Không merge feature lớn nếu thiếu rollback note và test plan.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'risk-ci-red',
    title: 'CI đỏ kéo dài',
    risk: 'MEDIUM',
    mitigation: 'Dừng thêm tính năng, sửa type/build trước.',
    releaseGate: 'Type-check/build phải xanh trước release.',
    createdAt: new Date().toISOString(),
  },
];

function valueText(item: LooseRecord, keys: string[], fallback = 'N/A') {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function riskOf(item: LooseRecord): RiskLevel {
  const raw = valueText(item, ['risk', 'severity'], 'LOW').toUpperCase();
  if (raw === 'HIGH') return 'HIGH';
  if (raw === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function isOpenStatus(item: LooseRecord, doneStatuses: string[]) {
  const status = valueText(item, ['status', 'stage'], '').toLowerCase();
  return !doneStatuses.map((value) => value.toLowerCase()).includes(status);
}

function riskTone(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function copyText(text: string, action: string, cardId: string) {
  navigator.clipboard.writeText(text);
  appendAgentOpsAudit(action, cardId, 'Founder OS context copied');
}

export default function FounderOSTab() {
  useLocalStorageVersion();
  const [view, setView] = useState<FounderView>('dashboard');
  const [sopTitle, setSopTitle] = useState('');
  const [sopSteps, setSopSteps] = useState('');
  const [riskTitle, setRiskTitle] = useState('');
  const [riskMitigation, setRiskMitigation] = useState('');

  const tasks = readLocalStorageValue<LooseRecord[]>(TASK_KEY, []);
  const workCards = readLocalStorageValue<LooseRecord[]>(WORKBOARD_KEY, []);
  const approvals = readLocalStorageValue<LooseRecord[]>(APPROVAL_KEY, []);
  const knowledge = readLocalStorageValue<LooseRecord[]>(KNOWLEDGE_KEY, []);
  const financeItems = readLocalStorageValue<LooseRecord[]>(FINANCE_CORE_KEY, []);
  const projectItems = readLocalStorageValue<LooseRecord[]>(PROJECTS_CORE_KEY, []);
  const sops = readLocalStorageValue<FounderSop[]>(SOP_KEY, seedSops);
  const risks = readLocalStorageValue<FounderRisk[]>(RISK_KEY, seedRisks);

  const pendingApprovals = approvals.filter((item) => valueText(item, ['status'], 'Pending') === 'Pending');
  const openTasks = tasks.filter((item) => valueText(item, ['status'], '') !== 'Done');
  const openCards = workCards.filter((item) => valueText(item, ['status'], '') !== 'Done');
  const openFinanceItems = financeItems.filter((item) => isOpenStatus(item, ['Posted', 'Approved']));
  const openProjectItems = projectItems.filter((item) => isOpenStatus(item, ['Delivered']));
  const highRisks = [...tasks, ...workCards, ...financeItems, ...projectItems, ...risks].filter((item) => riskOf(item) === 'HIGH');

  const dashboardMarkdown = useMemo(() => [
    '# Founder OS Daily Control',
    '',
    `- Open AI tasks: ${openTasks.length}`,
    `- Open work cards: ${openCards.length}`,
    `- Open finance items: ${openFinanceItems.length}`,
    `- Open projects: ${openProjectItems.length}`,
    `- Pending approvals: ${pendingApprovals.length}`,
    `- High risk items: ${highRisks.length}`,
    `- Knowledge notes: ${knowledge.length}`,
    '',
    '## Finance / Projects to inspect',
    openFinanceItems.slice(0, 3).map((item) => `- Finance: ${valueText(item, ['title'])} · ${valueText(item, ['status'])} · ${riskOf(item)}`).join('\n') || '- No open finance blocker.',
    openProjectItems.slice(0, 3).map((item) => `- Project: ${valueText(item, ['title'])} · ${valueText(item, ['stage', 'status'])} · ${riskOf(item)}`).join('\n') || '- No open project blocker.',
    '',
    '## Next actions',
    pendingApprovals.slice(0, 5).map((item) => `- Approve/reject: ${valueText(item, ['title', 'action'])}`).join('\n') || '- No approval blocker.',
  ].join('\n'), [openTasks.length, openCards.length, openFinanceItems, openProjectItems, pendingApprovals, highRisks.length, knowledge.length]);

  const addSop = () => {
    if (!sopTitle.trim() || !sopSteps.trim()) return;
    const sop: FounderSop = {
      id: `sop-${Date.now()}`,
      title: sopTitle.trim(),
      owner: 'Founder / AI Chief of Staff',
      status: 'Draft',
      steps: sopSteps.trim(),
      createdAt: new Date().toISOString(),
    };
    appendLocalStorageArrayItem(SOP_KEY, sop, 120);
    appendAgentOpsAudit('FOUNDER_SOP_CREATED', sop.id, sop.title);
    setSopTitle('');
    setSopSteps('');
  };

  const addRisk = () => {
    if (!riskTitle.trim() || !riskMitigation.trim()) return;
    const risk: FounderRisk = {
      id: `founder-risk-${Date.now()}`,
      title: riskTitle.trim(),
      risk: 'MEDIUM',
      mitigation: riskMitigation.trim(),
      releaseGate: 'Founder review before release.',
      createdAt: new Date().toISOString(),
    };
    appendLocalStorageArrayItem(RISK_KEY, risk, 120);
    appendAgentOpsAudit('FOUNDER_RISK_CREATED', risk.id, risk.title);
    setRiskTitle('');
    setRiskMitigation('');
  };

  return (
    <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Founder OS</p>
          <h3 className="mt-1 text-xl font-black text-white">Founder Company OS theo brief Claude</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">5 vùng điều hành: dashboard, work orders, ideas, SOP và risk/release. Local-only, audit-first.</p>
        </div>
        <button onClick={() => copyText(dashboardMarkdown, 'FOUNDER_DASHBOARD_COPIED', 'founder-dashboard')} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10">Copy daily context</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {views.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${view === item.id ? 'border-violet-300 text-violet-100' : 'border-slate-700 text-slate-300 hover:border-violet-300'}`}>{item.label}</button>)}
      </div>

      {view === 'dashboard' && (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {[
              ['AI Tasks', openTasks.length],
              ['Work Cards', openCards.length],
              ['Finance', openFinanceItems.length],
              ['Projects', openProjectItems.length],
              ['Approvals', pendingApprovals.length],
              ['High Risk', highRisks.length],
              ['Knowledge', knowledge.length],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>)}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-sm font-black text-white">Finance cần xem</p>
              <div className="mt-2 grid gap-2">
                {openFinanceItems.slice(0, 4).map((item, index) => <p key={valueText(item, ['id'], `finance-${index}`)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold text-slate-300">{valueText(item, ['title'])} · {valueText(item, ['status'])} · {riskOf(item)}</p>)}
                {openFinanceItems.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có finance blocker.</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="text-sm font-black text-white">Projects cần xem</p>
              <div className="mt-2 grid gap-2">
                {openProjectItems.slice(0, 4).map((item, index) => <p key={valueText(item, ['id'], `project-${index}`)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold text-slate-300">{valueText(item, ['title'])} · {valueText(item, ['stage', 'status'])} · {riskOf(item)}</p>)}
                {openProjectItems.length === 0 && <p className="text-xs font-semibold text-slate-500">Không có project blocker.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'orders' && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[...tasks, ...workCards, ...financeItems, ...projectItems].slice(0, 12).map((item, index) => {
            const id = valueText(item, ['id'], `order-${index}`);
            const title = valueText(item, ['title', 'request'], 'Untitled order');
            const status = valueText(item, ['status', 'stage'], 'Inbox');
            const risk = riskOf(item);
            return <article key={id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-black text-white">{title}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(risk)}`}>{risk}</span></div><p className="mt-2 text-xs font-semibold text-slate-400">Status: {status}</p></article>;
          })}
        </div>
      )}

      {view === 'ideas' && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {workCards.filter((item) => valueText(item, ['kind', 'source'], '').toLowerCase().includes('idea') || valueText(item, ['source'], '').toLowerCase().includes('factory')).slice(0, 10).map((item, index) => <article key={valueText(item, ['id'], `idea-${index}`)} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{valueText(item, ['title', 'request'], 'Idea')}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{valueText(item, ['plan', 'expectedOutput', 'context'], 'No plan yet')}</p></article>)}
          {workCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có idea/work card. Product Factory sẽ đẩy ý tưởng vào đây.</p>}
        </div>
      )}

      {view === 'sops' && (
        <div className="mt-4 grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><input value={sopTitle} onChange={(event) => setSopTitle(event.target.value)} placeholder="Tên SOP" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" /><textarea value={sopSteps} onChange={(event) => setSopSteps(event.target.value)} placeholder="Các bước thực hiện" className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" /><button onClick={addSop} className="mt-2 rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10">Thêm SOP</button></div>
          <div className="grid gap-3">{sops.slice(0, 8).map((sop) => <article key={sop.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{sop.title}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{sop.owner} · {sop.status}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{sop.steps}</p></article>)}</div>
        </div>
      )}

      {view === 'risk' && (
        <div className="mt-4 grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><input value={riskTitle} onChange={(event) => setRiskTitle(event.target.value)} placeholder="Rủi ro/release gate" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" /><textarea value={riskMitigation} onChange={(event) => setRiskMitigation(event.target.value)} placeholder="Mitigation / điều kiện release" className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" /><button onClick={addRisk} className="mt-2 rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10">Thêm risk gate</button></div>
          <div className="grid gap-3">{risks.slice(0, 8).map((risk) => <article key={risk.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-black text-white">{risk.title}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(risk.risk)}`}>{risk.risk}</span></div><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{risk.mitigation}</p><p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold text-slate-400">Gate: {risk.releaseGate}</p></article>)}</div>
        </div>
      )}
    </section>
  );
}
