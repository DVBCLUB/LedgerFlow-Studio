import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const PR_PLANS_KEY = 'ledgerflow_github_pr_plans_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type PRStatus = 'Draft' | 'Needs Approval' | 'Approved Plan' | 'Ready for Agent' | 'Archived';

type PRPlan = {
  id: string;
  title: string;
  repo: string;
  baseBranch: string;
  branchName: string;
  risk: RiskLevel;
  status: PRStatus;
  summary: string;
  files: string;
  testPlan: string;
  rollback: string;
  approvalNote: string;
  createdAt: string;
  updatedAt: string;
};

const seedPlans: PRPlan[] = [
  {
    id: 'seed-pr-ci-first',
    title: 'CI fix before new feature work',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    baseBranch: 'main',
    branchName: 'fix/ci-red-before-feature',
    risk: 'MEDIUM',
    status: 'Needs Approval',
    summary: 'Fix failing type-check/build before continuing feature work.',
    files: 'src/components/agent-ops/**\nsrc/types/agentOps.ts',
    testPlan: 'Run npm run lint and npm run build. Confirm LedgerFlow Studio CI is green.',
    rollback: 'Revert the CI fix commit if it breaks runtime UI.',
    approvalNote: 'Founder approval required before external GitHub write or PR creation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const statuses: PRStatus[] = ['Draft', 'Needs Approval', 'Approved Plan', 'Ready for Agent', 'Archived'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

function expiryIso() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
}

function riskTone(risk: RiskLevel) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function statusTone(status: PRStatus) {
  if (status === 'Ready for Agent') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Needs Approval') return 'border-amber-400/40 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function markdown(plan: PRPlan) {
  return [
    `# GitHub PR Plan: ${plan.title}`,
    '',
    `- Repo: ${plan.repo}`,
    `- Base: ${plan.baseBranch}`,
    `- Branch: ${plan.branchName}`,
    `- Risk: ${plan.risk}`,
    `- Status: ${plan.status}`,
    '',
    '## Summary',
    plan.summary,
    '',
    '## Files / scope',
    plan.files,
    '',
    '## Test plan',
    plan.testPlan,
    '',
    '## Rollback',
    plan.rollback,
    '',
    '## Guardrails',
    '- Do not write to GitHub until Founder approves.',
    '- Prefer small branch, small commit, small PR.',
    '- Attach CI result and rollback note before merge.',
  ].join('\n');
}

export default function GitHubPRControlTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('DVBCLUB/LedgerFlow-Studio');
  const [baseBranch, setBaseBranch] = useState('main');
  const [branchName, setBranchName] = useState('feature/company-os-next');
  const [risk, setRisk] = useState<RiskLevel>('MEDIUM');
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState('');
  const [testPlan, setTestPlan] = useState('npm run lint\nnpm run build');
  const [rollback, setRollback] = useState('Revert the commit or close the PR if CI/runtime breaks.');
  const [filter, setFilter] = useState<'ALL' | PRStatus>('ALL');

  const plans = readLocalStorageValue<PRPlan[]>(PR_PLANS_KEY, seedPlans);
  const visiblePlans = useMemo(() => filter === 'ALL' ? plans : plans.filter((plan) => plan.status === filter), [filter, plans]);
  const openCount = plans.filter((plan) => plan.status !== 'Archived').length;
  const approvalCount = plans.filter((plan) => plan.status === 'Needs Approval').length;

  const savePlans = (next: PRPlan[]) => writeLocalStorageValue(PR_PLANS_KEY, next);

  const addPlan = () => {
    if (!title.trim() || !summary.trim()) return;
    const now = new Date().toISOString();
    const plan: PRPlan = {
      id: `pr-plan-${Date.now()}`,
      title: title.trim(),
      repo: repo.trim() || 'DVBCLUB/LedgerFlow-Studio',
      baseBranch: baseBranch.trim() || 'main',
      branchName: branchName.trim() || `feature/company-os-${Date.now()}`,
      risk,
      status: risk === 'LOW' ? 'Draft' : 'Needs Approval',
      summary: summary.trim(),
      files: files.trim() || 'No file scope provided yet.',
      testPlan: testPlan.trim() || 'Run lint/build and attach CI result.',
      rollback: rollback.trim() || 'Revert commit if needed.',
      approvalNote: risk === 'LOW' ? 'Draft-only. No external GitHub write yet.' : 'Founder approval required before branch/commit/PR.',
      createdAt: now,
      updatedAt: now,
    };
    savePlans([plan, ...plans].slice(0, 120));
    appendAgentOpsAudit('GITHUB_PR_PLAN_CREATED', plan.id, `${plan.repo} · ${plan.branchName}`);
    setTitle('');
    setSummary('');
    setFiles('');
  };

  const updateStatus = (plan: PRPlan, status: PRStatus) => {
    const next = plans.map((item) => item.id === plan.id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
    savePlans(next);
    appendAgentOpsAudit('GITHUB_PR_PLAN_STATUS', plan.id, `${plan.title} → ${status}`);
  };

  const requestApproval = (plan: PRPlan) => {
    const request: ApprovalRequest = {
      id: `approval-github-pr-${plan.id}-${Date.now()}`,
      title: `Approve GitHub PR plan: ${plan.title}`,
      source: 'GitHub PR Control',
      sourceId: plan.id,
      risk: plan.risk === 'LOW' ? 'MEDIUM' : plan.risk,
      action: 'Allow AI/GitHub connector to prepare branch, commit, or PR after review.',
      details: markdown(plan),
      createdAt: new Date().toISOString(),
      expiresAt: expiryIso(),
      status: 'Pending',
    };
    appendLocalStorageArrayItem(APPROVAL_KEY, request, 200);
    updateStatus(plan, 'Needs Approval');
    appendAgentOpsAudit('GITHUB_PR_APPROVAL_REQUESTED', plan.id, plan.title);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyPlan = async (plan: PRPlan) => {
    await navigator.clipboard.writeText(markdown(plan));
    appendAgentOpsAudit('GITHUB_PR_PLAN_COPIED', plan.id, plan.title);
  };

  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-950 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">GitHub connector control</p>
          <h3 className="mt-1 text-xl font-black text-white">GitHub PR Control</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Lập kế hoạch branch/commit/PR theo approval-first. Không tự ghi GitHub nếu chưa được Founder duyệt.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{plans.length} plans</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{approvalCount} approvals</span>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-slate-300">{openCount} open</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="PR title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={baseBranch} onChange={(event) => setBaseBranch(event.target.value)} placeholder="base branch" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="branch name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={files} onChange={(event) => setFiles(event.target.value)} placeholder="Files/scope" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300 md:col-span-2" />
        <textarea value={testPlan} onChange={(event) => setTestPlan(event.target.value)} placeholder="Test plan" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <textarea value={rollback} onChange={(event) => setRollback(event.target.value)} placeholder="Rollback" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <button onClick={addPlan} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10 md:col-span-2">Thêm PR plan</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {statuses.map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === status ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>{status}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visiblePlans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{plan.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{plan.repo} · {plan.baseBranch} → {plan.branchName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(plan.status)}`}>{plan.status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(plan.risk)}`}>{plan.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{plan.summary}</p>
            <div className="mt-3 grid gap-2 text-[11px] font-semibold leading-5 text-slate-300">
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Files: {plan.files}</p>
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Test: {plan.testPlan}</p>
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Rollback: {plan.rollback}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateStatus(plan, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-100">{status}</button>)}
              <button onClick={() => requestApproval(plan)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
              <button onClick={() => copyPlan(plan)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy plan</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
