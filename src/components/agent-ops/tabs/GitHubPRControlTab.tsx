import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel } from '../../../types/agentOps';
import { createApprovedGitHubChangeRequest } from '../../../utils/githubApprovedChangeApi';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const PR_PLANS_KEY = 'ledgerflow_github_pr_plans_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';
const APPROVAL_PHRASE = 'APPROVE AI GITHUB PUSH';

type PRStatus = 'Draft' | 'Needs Approval' | 'Approved Plan' | 'Ready for Agent' | 'Draft PR Created' | 'Archived';
type PRCIStatus = 'Unknown' | 'Running' | 'Passed' | 'Failed';

type PRPlan = {
  id: string;
  title: string;
  repo: string;
  baseBranch: string;
  branchName: string;
  risk: RiskLevel;
  status: PRStatus;
  ciStatus?: PRCIStatus;
  ciNote?: string;
  summary: string;
  files: string;
  filePath: string;
  fileContent: string;
  testPlan: string;
  rollback: string;
  approvalNote: string;
  prUrl?: string;
  createdAt: string;
  updatedAt: string;
};

const seedPlans: PRPlan[] = [
  {
    id: 'seed-pr-ci-first',
    title: 'CI fix before new feature work',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    baseBranch: 'main',
    branchName: 'ai/fix-ci-red-before-feature',
    risk: 'MEDIUM',
    status: 'Needs Approval',
    ciStatus: 'Unknown',
    ciNote: 'Attach CI result after draft PR is created.',
    summary: 'Fix failing type-check/build before continuing feature work.',
    files: 'docs/ci-triage-note.md',
    filePath: 'docs/ci-triage-note.md',
    fileContent: '# CI triage note\n\nRecord CI failure, fix scope, test evidence and rollback note here.\n',
    testPlan: 'Run npm run lint and npm run build. Confirm LedgerFlow Studio CI is green.',
    rollback: 'Close the draft PR or revert the generated branch if it breaks runtime UI.',
    approvalNote: 'Founder approval phrase required before external GitHub write.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const statuses: PRStatus[] = ['Draft', 'Needs Approval', 'Approved Plan', 'Ready for Agent', 'Draft PR Created', 'Archived'];
const ciStatuses: PRCIStatus[] = ['Unknown', 'Running', 'Passed', 'Failed'];
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
  if (status === 'Draft PR Created') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Ready for Agent') return 'border-cyan-400/40 text-cyan-200';
  if (status === 'Needs Approval') return 'border-amber-400/40 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function ciTone(status: PRCIStatus = 'Unknown') {
  if (status === 'Passed') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (status === 'Failed') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (status === 'Running') return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100';
  return 'border-slate-700 bg-slate-950/60 text-slate-300';
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
    `- CI: ${plan.ciStatus || 'Unknown'}`,
    plan.ciNote ? `- CI note: ${plan.ciNote}` : '',
    plan.prUrl ? `- PR: ${plan.prUrl}` : '',
    '',
    '## Summary',
    plan.summary,
    '',
    '## Files / scope',
    plan.files,
    '',
    '## First approved file payload',
    `- Path: ${plan.filePath || 'not set'}`,
    `- Content chars: ${plan.fileContent?.length || 0}`,
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
  ].filter(Boolean).join('\n');
}

function normalizeBranchName(input: string) {
  const value = input.trim() || `ai/company-os-${Date.now()}`;
  return value.startsWith('ai/') ? value : `ai/${value.replace(/^\/+/, '')}`;
}

export default function GitHubPRControlTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('DVBCLUB/LedgerFlow-Studio');
  const [baseBranch, setBaseBranch] = useState('main');
  const [branchName, setBranchName] = useState('ai/feature-company-os-next');
  const [risk, setRisk] = useState<RiskLevel>('MEDIUM');
  const [summary, setSummary] = useState('');
  const [files, setFiles] = useState('');
  const [filePath, setFilePath] = useState('docs/approved-ai-change.md');
  const [fileContent, setFileContent] = useState('# Approved AI change\n\nDescribe the approved change here.\n');
  const [testPlan, setTestPlan] = useState('npm run lint\nnpm run build');
  const [rollback, setRollback] = useState('Close the draft PR or revert the generated branch if CI/runtime breaks.');
  const [approvalPhrase, setApprovalPhrase] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState('');
  const [filter, setFilter] = useState<'ALL' | PRStatus>('ALL');

  const plans = readLocalStorageValue<PRPlan[]>(PR_PLANS_KEY, seedPlans);
  const visiblePlans = useMemo(() => filter === 'ALL' ? plans : plans.filter((plan) => plan.status === filter), [filter, plans]);
  const openCount = plans.filter((plan) => plan.status !== 'Archived').length;
  const approvalCount = plans.filter((plan) => plan.status === 'Needs Approval').length;
  const ciFailedCount = plans.filter((plan) => plan.ciStatus === 'Failed').length;
  const ciPendingCount = plans.filter((plan) => plan.status === 'Draft PR Created' && (plan.ciStatus || 'Unknown') !== 'Passed').length;

  const savePlans = (next: PRPlan[]) => writeLocalStorageValue(PR_PLANS_KEY, next);

  const addPlan = () => {
    if (!title.trim() || !summary.trim()) return;
    const now = new Date().toISOString();
    const path = filePath.trim() || 'docs/approved-ai-change.md';
    const plan: PRPlan = {
      id: `pr-plan-${Date.now()}`,
      title: title.trim(),
      repo: repo.trim() || 'DVBCLUB/LedgerFlow-Studio',
      baseBranch: baseBranch.trim() || 'main',
      branchName: normalizeBranchName(branchName),
      risk,
      status: risk === 'LOW' ? 'Draft' : 'Needs Approval',
      ciStatus: 'Unknown',
      ciNote: 'CI not checked yet.',
      summary: summary.trim(),
      files: files.trim() || path,
      filePath: path,
      fileContent: fileContent.trim() || '# Approved AI change\n\nNo content provided yet.\n',
      testPlan: testPlan.trim() || 'Run lint/build and attach CI result.',
      rollback: rollback.trim() || 'Close draft PR if needed.',
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

  const patchPlan = (plan: PRPlan, patch: Partial<PRPlan>) => {
    const next = plans.map((item) => item.id === plan.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
    savePlans(next);
  };

  const updateStatus = (plan: PRPlan, status: PRStatus) => {
    patchPlan(plan, { status });
    appendAgentOpsAudit('GITHUB_PR_PLAN_STATUS', plan.id, `${plan.title} → ${status}`);
  };

  const updateCiStatus = (plan: PRPlan, ciStatus: PRCIStatus) => {
    const note = ciStatus === 'Passed'
      ? 'CI passed. Attach URL/evidence before release.'
      : ciStatus === 'Failed'
        ? 'CI failed. Fix before release or archive this PR plan.'
        : ciStatus === 'Running'
          ? 'CI is running. Wait for result before release.'
          : 'CI result is not attached yet.';
    patchPlan(plan, { ciStatus, ciNote: note });
    appendAgentOpsAudit('GITHUB_PR_CI_STATUS', plan.id, `${plan.title} → ${ciStatus}`);
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

  const createDraftPr = async (plan: PRPlan) => {
    if (approvalPhrase !== APPROVAL_PHRASE) {
      setLastResult('Nhập đúng APPROVE AI GITHUB PUSH trước khi tạo draft PR thật.');
      return;
    }
    if (!plan.filePath.trim() || !plan.fileContent.trim()) {
      setLastResult('Thiếu file path hoặc file content cho approved change request.');
      return;
    }
    setSubmittingId(plan.id);
    setLastResult('Đang gửi approved change request tới backend...');
    try {
      const result = await createApprovedGitHubChangeRequest({
        repo: plan.repo,
        title: plan.title,
        summary: `${plan.summary}\n\nTest plan:\n${plan.testPlan}\n\nRollback:\n${plan.rollback}`,
        approvalPhrase: APPROVAL_PHRASE,
        baseBranch: plan.baseBranch,
        branchName: normalizeBranchName(plan.branchName),
        draft: true,
        files: [{ path: plan.filePath.trim(), content: plan.fileContent }],
      });
      const prUrl = result.pullRequest.htmlUrl || result.pullRequest.url || '';
      const commitCount = result.commitMessages.length;
      patchPlan(plan, {
        status: 'Draft PR Created',
        ciStatus: 'Running',
        ciNote: 'Draft PR created. Check GitHub Actions and update CI status here.',
        prUrl,
        repo: result.repo,
        baseBranch: result.base,
        branchName: result.branch,
      });
      appendAgentOpsAudit('GITHUB_DRAFT_PR_CREATED', plan.id, `${result.repo} · ${result.base} → ${result.branch} · ${commitCount} commit(s) · #${result.pullRequest.number}`);
      setLastResult(`Draft PR created: ${result.repo} #${result.pullRequest.number} · ${result.base} → ${result.branch} · ${commitCount} commit(s) ${prUrl}`);
      setApprovalPhrase('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown GitHub approved change error';
      appendAgentOpsAudit('GITHUB_DRAFT_PR_FAILED', plan.id, message);
      setLastResult(`GitHub request failed: ${message}`);
    } finally {
      setSubmittingId(null);
    }
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
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Lập kế hoạch branch/commit/PR theo approval-first. Draft PR thật chỉ chạy khi nhập đúng founder phrase.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{plans.length} plans</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{approvalCount} approvals</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{ciFailedCount} CI failed</span>
          <span className="rounded-full border border-slate-600 px-3 py-1 text-slate-300">{openCount} open · {ciPendingCount} pending CI</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="PR title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={baseBranch} onChange={(event) => setBaseBranch(event.target.value)} placeholder="base branch" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="ai/branch-name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={files} onChange={(event) => setFiles(event.target.value)} placeholder="Files/scope" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <input value={filePath} onChange={(event) => setFilePath(event.target.value)} placeholder="Approved file path" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300 md:col-span-2" />
        <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300 md:col-span-2" />
        <textarea value={fileContent} onChange={(event) => setFileContent(event.target.value)} placeholder="Approved file content" className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-cyan-300 md:col-span-2" />
        <textarea value={testPlan} onChange={(event) => setTestPlan(event.target.value)} placeholder="Test plan" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <textarea value={rollback} onChange={(event) => setRollback(event.target.value)} placeholder="Rollback" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <button onClick={addPlan} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10 md:col-span-2">Thêm PR plan</button>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Founder phrase required for real GitHub write</p>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
          <input value={approvalPhrase} onChange={(event) => setApprovalPhrase(event.target.value)} placeholder="APPROVE AI GITHUB PUSH" className="rounded-xl border border-amber-300/40 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-200" />
          <span className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300">{approvalPhrase === APPROVAL_PHRASE ? 'Phrase OK' : 'Locked'}</span>
        </div>
        {lastResult && <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-xs font-semibold text-slate-300">{lastResult}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {statuses.map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === status ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>{status}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visiblePlans.map((plan) => {
          const ciStatus = plan.ciStatus || 'Unknown';
          return (
            <article key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{plan.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{plan.repo} · {plan.baseBranch} → {plan.branchName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(plan.status)}`}>{plan.status}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(plan.risk)}`}>{plan.risk}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${ciTone(ciStatus)}`}>CI {ciStatus}</span>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{plan.summary}</p>
              <div className="mt-3 grid gap-2 text-[11px] font-semibold leading-5 text-slate-300">
                <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Files: {plan.files}</p>
                <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Payload: {plan.filePath || 'not set'} · {(plan.fileContent || '').length} chars</p>
                <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Test: {plan.testPlan}</p>
                <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">Rollback: {plan.rollback}</p>
                <p className={`rounded-xl border p-2 ${ciTone(ciStatus)}`}>CI follow-up: {ciStatus} · {plan.ciNote || 'No CI note yet.'}</p>
                {plan.prUrl && <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-100">Draft PR: {plan.prUrl}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {statuses.map((status) => <button key={status} onClick={() => updateStatus(plan, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-100">{status}</button>)}
                {ciStatuses.map((status) => <button key={status} onClick={() => updateCiStatus(plan, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-100">CI {status}</button>)}
                <button onClick={() => requestApproval(plan)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
                <button onClick={() => copyPlan(plan)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy plan</button>
                <button disabled={submittingId === plan.id} onClick={() => createDraftPr(plan)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50">{submittingId === plan.id ? 'Creating...' : 'Create draft PR'}</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
