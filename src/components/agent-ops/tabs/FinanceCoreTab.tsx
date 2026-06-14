import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel, WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const FINANCE_CORE_KEY = 'ledgerflow_finance_core_v1';
const PROJECTS_CORE_KEY = 'ledgerflow_projects_delivery_core_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type FinanceType = 'Cashflow' | 'Budget' | 'Invoice' | 'Payment' | 'Tax' | 'Payroll' | 'Procurement' | 'Report';
type FinanceStatus = 'Draft' | 'Review' | 'Approved' | 'Posted' | 'Blocked';
type ProjectFinanceStatus = 'Unknown' | 'Budget Draft' | 'Budget Approved' | 'Over Budget' | 'On Track' | 'Closed';

type FinanceItem = {
  id: string;
  type: FinanceType;
  title: string;
  status: FinanceStatus;
  risk: RiskLevel;
  amount: number;
  counterparty: string;
  projectName: string;
  period: string;
  owner: string;
  summary: string;
  nextAction: string;
  evidence: string;
  createdAt: string;
  updatedAt: string;
};

type ProjectItem = {
  id: string;
  name: string;
  stage: string;
  risk: RiskLevel;
  client: string;
  budget: number;
  actual: number;
  financeStatus: ProjectFinanceStatus;
};

const types: FinanceType[] = ['Cashflow', 'Budget', 'Invoice', 'Payment', 'Tax', 'Payroll', 'Procurement', 'Report'];
const statuses: FinanceStatus[] = ['Draft', 'Review', 'Approved', 'Posted', 'Blocked'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedItems: FinanceItem[] = [
  {
    id: 'finance-seed-cashflow-runway',
    type: 'Cashflow',
    title: 'Weekly cash runway check',
    status: 'Draft',
    risk: 'MEDIUM',
    amount: 0,
    counterparty: 'Internal',
    projectName: 'Company OS rollout',
    period: 'This week',
    owner: 'Founder / AI Accountant',
    summary: 'Review cash-in, cash-out, payable pressure and runway before committing new spend.',
    nextAction: 'Prepare a one-page cashflow brief for founder approval.',
    evidence: 'Use bank balance, expected collections, payables and payroll notes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'finance-seed-budget-control',
    type: 'Budget',
    title: 'Budget variance guardrail',
    status: 'Review',
    risk: 'LOW',
    amount: 0,
    counterparty: 'Internal',
    projectName: 'Client delivery template',
    period: 'Monthly',
    owner: 'AI Accountant',
    summary: 'Compare planned vs actual cost before approving new project commitments.',
    nextAction: 'Flag lines over budget and send only exceptions to Approval Gate.',
    evidence: 'Budget sheet, actual expenses and pending commitments.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function money(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

function norm(value: string) {
  return value.trim().toLowerCase();
}

function varianceFor(project: ProjectItem) {
  return Number(project.actual || 0) - Number(project.budget || 0);
}

function approvalExpiryIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function itemMarkdown(item: FinanceItem) {
  return [
    `# Finance item: ${item.title}`,
    '',
    `- Type: ${item.type}`,
    `- Status: ${item.status}`,
    `- Risk: ${item.risk}`,
    `- Amount: ${money(item.amount)}`,
    `- Counterparty: ${item.counterparty}`,
    `- Linked project: ${item.projectName || 'Unassigned'}`,
    `- Period: ${item.period}`,
    `- Owner: ${item.owner}`,
    '',
    '## Summary',
    item.summary,
    '',
    '## Evidence',
    item.evidence,
    '',
    '## Next action',
    item.nextAction,
  ].join('\n');
}

function workCardFor(item: FinanceItem): WorkCard {
  return {
    id: `finance-work-${item.id}`,
    title: item.nextAction || item.title,
    kind: 'Ops',
    owner: item.owner || 'AI Accountant',
    status: item.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
    risk: item.risk,
    request: itemMarkdown(item),
    plan: [
      'Verify source evidence and accounting treatment',
      `Check linked project impact: ${item.projectName || 'Unassigned'}`,
      'Prepare founder decision brief',
      'Return control note and rollback/adjustment path',
    ],
    tools: ['Finance Core', 'Projects Core', 'Workboard', 'Approval Gate'],
    approval: item.risk === 'LOW' ? 'Sandbox analysis allowed. Payment/posting still needs approval.' : 'Founder approval required before payment, posting or commitment.',
  };
}

function approvalFor(item: FinanceItem): ApprovalRequest {
  return {
    id: `finance-approval-${item.id}-${Date.now()}`,
    title: `Approve finance action: ${item.title}`,
    source: 'Finance Core',
    sourceId: item.id,
    risk: item.risk === 'LOW' ? 'MEDIUM' : item.risk,
    action: item.nextAction || `Review ${item.type}`,
    details: itemMarkdown(item),
    createdAt: new Date().toISOString(),
    expiresAt: approvalExpiryIso(),
    status: 'Pending',
  };
}

export default function FinanceCoreTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FinanceType>('Cashflow');
  const [risk, setRisk] = useState<RiskLevel>('LOW');
  const [amount, setAmount] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [projectName, setProjectName] = useState('');
  const [period, setPeriod] = useState('');
  const [summary, setSummary] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [filter, setFilter] = useState<'ALL' | FinanceType>('ALL');

  const items = readLocalStorageValue<FinanceItem[]>(FINANCE_CORE_KEY, seedItems);
  const projects = readLocalStorageValue<ProjectItem[]>(PROJECTS_CORE_KEY, []);
  const visibleItems = useMemo(() => filter === 'ALL' ? items : items.filter((item) => item.type === filter), [filter, items]);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const highRiskCount = items.filter((item) => item.risk === 'HIGH').length;
  const reviewCount = items.filter((item) => item.status === 'Review' || item.status === 'Blocked').length;
  const linkedProjectCount = items.filter((item) => Boolean(item.projectName?.trim()) && item.projectName !== 'Unassigned').length;
  const projectNames = new Set(projects.map((project) => norm(project.name)));
  const financeProjectNames = new Set(items.filter((item) => item.projectName && item.projectName !== 'Unassigned').map((item) => norm(item.projectName)));
  const unmatchedFinance = items.filter((item) => item.projectName && item.projectName !== 'Unassigned' && !projectNames.has(norm(item.projectName)));
  const projectsWithoutFinance = projects.filter((project) => !financeProjectNames.has(norm(project.name)));
  const overBudgetProjects = projects.filter((project) => varianceFor(project) > 0 || project.financeStatus === 'Over Budget');

  const saveItems = (next: FinanceItem[]) => writeLocalStorageValue(FINANCE_CORE_KEY, next);

  const addItem = () => {
    if (!title.trim() || !summary.trim()) return;
    const now = new Date().toISOString();
    const item: FinanceItem = {
      id: `finance-${Date.now()}`,
      type,
      title: title.trim(),
      status: risk === 'LOW' ? 'Draft' : 'Review',
      risk,
      amount: Number(amount || 0),
      counterparty: counterparty.trim() || 'Internal / TBD',
      projectName: projectName.trim() || 'Unassigned',
      period: period.trim() || 'Current period',
      owner: 'AI Accountant',
      summary: summary.trim(),
      nextAction: nextAction.trim() || 'Prepare finance decision brief.',
      evidence: 'Attach source documents before posting/payment.',
      createdAt: now,
      updatedAt: now,
    };
    saveItems([item, ...items].slice(0, 200));
    appendAgentOpsAudit('FINANCE_ITEM_CREATED', item.id, `${item.type} · ${item.risk} · ${item.title} · project ${item.projectName}`);
    setTitle('');
    setAmount('');
    setCounterparty('');
    setProjectName('');
    setPeriod('');
    setSummary('');
    setNextAction('');
  };

  const updateStatus = (item: FinanceItem, status: FinanceStatus) => {
    saveItems(items.map((entry) => entry.id === item.id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry));
    appendAgentOpsAudit('FINANCE_STATUS_UPDATED', item.id, `${item.title} → ${status}`);
  };

  const pushToWorkboard = (item: FinanceItem) => {
    appendLocalStorageArrayItem(WORKBOARD_KEY, workCardFor(item), 200);
    appendAgentOpsAudit('FINANCE_TO_WORKBOARD', item.id, item.title);
  };

  const requestApproval = (item: FinanceItem) => {
    appendLocalStorageArrayItem(APPROVAL_KEY, approvalFor(item), 200);
    appendAgentOpsAudit('FINANCE_APPROVAL_REQUESTED', item.id, item.title);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyBrief = async (item: FinanceItem) => {
    await navigator.clipboard.writeText(itemMarkdown(item));
    appendAgentOpsAudit('FINANCE_BRIEF_COPIED', item.id, item.title);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Finance & Accounting Core</p>
          <h3 className="mt-1 text-xl font-black text-white">Finance Core</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Core tài chính/kế toán cho Company OS: cashflow, budget, invoice, payment, tax và report. Mỗi dòng có thể gắn project để nối tiền với delivery.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{items.length} items</span>
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{money(totalAmount)}</span>
          <span className="rounded-full border border-sky-300/40 px-3 py-1 text-sky-100">{linkedProjectCount} linked</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{reviewCount} review</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{highRiskCount} high</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-3">
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Unmatched finance</p>
          <p className="mt-1 text-2xl font-black text-white">{unmatchedFinance.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-300">Finance item có project name nhưng chưa có project tương ứng.</p>
        </div>
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Projects without finance</p>
          <p className="mt-1 text-2xl font-black text-white">{projectsWithoutFinance.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-300">Project chưa có dòng finance liên kết.</p>
        </div>
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">Over budget projects</p>
          <p className="mt-1 text-2xl font-black text-white">{overBudgetProjects.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-300">Project có actual vượt budget hoặc finance status Over Budget.</p>
        </div>
      </div>

      {(unmatchedFinance.length > 0 || projectsWithoutFinance.length > 0 || overBudgetProjects.length > 0) && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Finance / Project reconciliation</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
              <span className="font-black text-sky-200">Unmatched finance</span><br />
              {unmatchedFinance.slice(0, 5).map((item) => <span key={item.id}>• {item.title} → {item.projectName}<br /></span>)}
              {unmatchedFinance.length === 0 && 'None'}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
              <span className="font-black text-amber-200">Projects without finance</span><br />
              {projectsWithoutFinance.slice(0, 5).map((project) => <span key={project.id}>• {project.name}<br /></span>)}
              {projectsWithoutFinance.length === 0 && 'None'}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
              <span className="font-black text-rose-200">Over budget</span><br />
              {overBudgetProjects.slice(0, 5).map((project) => <span key={project.id}>• {project.name}: {money(varianceFor(project))}<br /></span>)}
              {overBudgetProjects.length === 0 && 'None'}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Finance item title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <select value={type} onChange={(event) => setType(event.target.value as FinanceType)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300">{types.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300">{risks.map((item) => <option key={item}>{item}</option>)}</select>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <input value={counterparty} onChange={(event) => setCounterparty(event.target.value)} placeholder="Counterparty" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Linked project / delivery" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Period" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300 md:col-span-2" />
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary / accounting control" className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300 md:col-span-2" />
        <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Next action" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300 md:col-span-2" />
        <button onClick={addItem} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10 md:col-span-2">Add finance item</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-emerald-300 text-emerald-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {types.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-emerald-300 text-emerald-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{item.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{item.type} · {item.counterparty} · {item.period}</p>
              </div>
              <span className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] font-black text-emerald-100">{item.status} · {item.risk}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{item.summary}</p>
            <p className="mt-2 rounded-xl border border-sky-400/20 bg-sky-400/10 p-2 text-[11px] font-black text-sky-100">Linked project: {item.projectName || 'Unassigned'}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Next: {item.nextAction}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateStatus(item, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-100">{status}</button>)}
              <button onClick={() => pushToWorkboard(item)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">To Workboard</button>
              <button onClick={() => requestApproval(item)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
              <button onClick={() => copyBrief(item)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">Copy brief</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
