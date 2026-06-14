import { useMemo, useState } from 'react';
import type { ApprovalRequest, RiskLevel, WorkCard } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const PROJECTS_CORE_KEY = 'ledgerflow_projects_delivery_core_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type ProjectType = 'Client Delivery' | 'Internal Product' | 'Finance Ops' | 'Implementation' | 'Research' | 'Maintenance';
type ProjectStage = 'Discovery' | 'Planning' | 'In Progress' | 'Review' | 'Delivered' | 'Blocked';
type FinanceStatus = 'Unknown' | 'Budget Draft' | 'Budget Approved' | 'Over Budget' | 'On Track' | 'Closed';

type ProjectItem = {
  id: string;
  type: ProjectType;
  name: string;
  client: string;
  stage: ProjectStage;
  risk: RiskLevel;
  owner: string;
  deadline: string;
  budget: number;
  actual: number;
  financeStatus: FinanceStatus;
  scope: string;
  milestone: string;
  blocker: string;
  acceptance: string;
  createdAt: string;
  updatedAt: string;
};

const projectTypes: ProjectType[] = ['Client Delivery', 'Internal Product', 'Finance Ops', 'Implementation', 'Research', 'Maintenance'];
const stages: ProjectStage[] = ['Discovery', 'Planning', 'In Progress', 'Review', 'Delivered', 'Blocked'];
const risks: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const financeStatuses: FinanceStatus[] = ['Unknown', 'Budget Draft', 'Budget Approved', 'Over Budget', 'On Track', 'Closed'];

const seedProjects: ProjectItem[] = [
  {
    id: 'project-seed-company-os-rollout',
    type: 'Internal Product',
    name: 'Company OS rollout',
    client: 'Internal',
    stage: 'In Progress',
    risk: 'MEDIUM',
    owner: 'Founder / Chief of Staff',
    deadline: 'This month',
    budget: 0,
    actual: 0,
    financeStatus: 'Budget Draft',
    scope: 'Stabilize AgentOps, Finance Core, Projects Core, GitHub connector and RAG workflow.',
    milestone: 'CI green, release gate active, core lanes mapped.',
    blocker: 'Avoid adding new modules before hardening core workflow.',
    acceptance: 'Founder can see what to build, approve, release and rollback from one operating system.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'project-seed-client-delivery-template',
    type: 'Client Delivery',
    name: 'Client delivery template',
    client: 'Template',
    stage: 'Planning',
    risk: 'LOW',
    owner: 'AI Project Manager',
    deadline: 'Next sprint',
    budget: 0,
    actual: 0,
    financeStatus: 'Unknown',
    scope: 'Create a reusable delivery flow for requirements, milestones, evidence, sign-off and billing handoff.',
    milestone: 'Delivery checklist and approval points drafted.',
    blocker: 'Need founder decision on client vertical.',
    acceptance: 'Every project has scope, milestone, blocker, acceptance and approval path.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function approvalExpiryIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

function variance(project: ProjectItem) {
  return (project.actual || 0) - (project.budget || 0);
}

function normalizeProject(project: ProjectItem): ProjectItem {
  return {
    ...project,
    budget: Number(project.budget || 0),
    actual: Number(project.actual || 0),
    financeStatus: project.financeStatus || 'Unknown',
  };
}

function projectMarkdown(project: ProjectItem) {
  return [
    `# Project: ${project.name}`,
    '',
    `- Type: ${project.type}`,
    `- Client: ${project.client}`,
    `- Stage: ${project.stage}`,
    `- Risk: ${project.risk}`,
    `- Owner: ${project.owner}`,
    `- Deadline: ${project.deadline}`,
    `- Budget: ${formatMoney(project.budget)}`,
    `- Actual: ${formatMoney(project.actual)}`,
    `- Variance: ${formatMoney(variance(project))}`,
    `- Finance status: ${project.financeStatus}`,
    '',
    '## Scope',
    project.scope,
    '',
    '## Current milestone',
    project.milestone,
    '',
    '## Blocker',
    project.blocker || 'None recorded.',
    '',
    '## Acceptance criteria',
    project.acceptance,
  ].join('\n');
}

function workCardFor(project: ProjectItem): WorkCard {
  return {
    id: `project-work-${project.id}`,
    title: `${project.name}: ${project.milestone}`,
    kind: 'Ops',
    owner: project.owner || 'AI Project Manager',
    status: project.risk === 'LOW' ? 'Planning' : 'Waiting Approval',
    risk: project.risk,
    request: projectMarkdown(project),
    plan: [
      'Confirm scope and acceptance criteria',
      'Review budget, actual and variance with Finance Core',
      'Break milestone into next actions',
      'Collect evidence and update founder review note',
    ],
    tools: ['Projects Core', 'Finance Core', 'Workboard', 'Approval Gate'],
    approval: project.risk === 'LOW' ? 'Planning allowed. External commitment needs founder approval.' : 'Founder approval required before delivery commitment, scope change or client-facing promise.',
  };
}

function approvalFor(project: ProjectItem): ApprovalRequest {
  return {
    id: `project-approval-${project.id}-${Date.now()}`,
    title: `Approve project action: ${project.name}`,
    source: 'Projects & Delivery Core',
    sourceId: project.id,
    risk: project.risk === 'LOW' ? 'MEDIUM' : project.risk,
    action: project.milestone,
    details: projectMarkdown(project),
    createdAt: new Date().toISOString(),
    expiresAt: approvalExpiryIso(),
    status: 'Pending',
  };
}

export default function ProjectsDeliveryCoreTab() {
  useLocalStorageVersion();
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('Client Delivery');
  const [risk, setRisk] = useState<RiskLevel>('LOW');
  const [client, setClient] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [actual, setActual] = useState('');
  const [financeStatus, setFinanceStatus] = useState<FinanceStatus>('Unknown');
  const [scope, setScope] = useState('');
  const [milestone, setMilestone] = useState('');
  const [acceptance, setAcceptance] = useState('');
  const [filter, setFilter] = useState<'ALL' | ProjectType>('ALL');

  const projects = readLocalStorageValue<ProjectItem[]>(PROJECTS_CORE_KEY, seedProjects).map(normalizeProject);
  const visibleProjects = useMemo(() => filter === 'ALL' ? projects : projects.filter((project) => project.type === filter), [filter, projects]);
  const activeCount = projects.filter((project) => project.stage !== 'Delivered').length;
  const blockedCount = projects.filter((project) => project.stage === 'Blocked').length;
  const highRiskCount = projects.filter((project) => project.risk === 'HIGH').length;
  const overBudgetCount = projects.filter((project) => project.financeStatus === 'Over Budget' || variance(project) > 0).length;

  const saveProjects = (next: ProjectItem[]) => writeLocalStorageValue(PROJECTS_CORE_KEY, next.map(normalizeProject));

  const addProject = () => {
    if (!name.trim() || !scope.trim() || !milestone.trim()) return;
    const now = new Date().toISOString();
    const project: ProjectItem = {
      id: `project-${Date.now()}`,
      type,
      name: name.trim(),
      client: client.trim() || 'Internal / TBD',
      stage: risk === 'LOW' ? 'Discovery' : 'Review',
      risk,
      owner: 'AI Project Manager',
      deadline: deadline.trim() || 'TBD',
      budget: Number(budget || 0),
      actual: Number(actual || 0),
      financeStatus,
      scope: scope.trim(),
      milestone: milestone.trim(),
      blocker: 'No blocker recorded.',
      acceptance: acceptance.trim() || 'Founder reviews scope, milestone evidence and next action.',
      createdAt: now,
      updatedAt: now,
    };
    saveProjects([project, ...projects].slice(0, 200));
    appendAgentOpsAudit('PROJECT_CREATED', project.id, `${project.type} · ${project.risk} · ${project.name}`);
    setName('');
    setClient('');
    setDeadline('');
    setBudget('');
    setActual('');
    setFinanceStatus('Unknown');
    setScope('');
    setMilestone('');
    setAcceptance('');
  };

  const updateStage = (project: ProjectItem, stage: ProjectStage) => {
    saveProjects(projects.map((entry) => entry.id === project.id ? { ...entry, stage, updatedAt: new Date().toISOString() } : entry));
    appendAgentOpsAudit('PROJECT_STAGE_UPDATED', project.id, `${project.name} → ${stage}`);
  };

  const updateFinanceStatus = (project: ProjectItem, nextStatus: FinanceStatus) => {
    saveProjects(projects.map((entry) => entry.id === project.id ? { ...entry, financeStatus: nextStatus, updatedAt: new Date().toISOString() } : entry));
    appendAgentOpsAudit('PROJECT_FINANCE_STATUS_UPDATED', project.id, `${project.name} → ${nextStatus}`);
  };

  const pushToWorkboard = (project: ProjectItem) => {
    appendLocalStorageArrayItem(WORKBOARD_KEY, workCardFor(project), 200);
    appendAgentOpsAudit('PROJECT_TO_WORKBOARD', project.id, project.name);
  };

  const requestApproval = (project: ProjectItem) => {
    appendLocalStorageArrayItem(APPROVAL_KEY, approvalFor(project), 200);
    appendAgentOpsAudit('PROJECT_APPROVAL_REQUESTED', project.id, project.name);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyBrief = async (project: ProjectItem) => {
    await navigator.clipboard.writeText(projectMarkdown(project));
    appendAgentOpsAudit('PROJECT_BRIEF_COPIED', project.id, project.name);
  };

  return (
    <section className="rounded-3xl border border-sky-400/30 bg-sky-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Projects & Delivery Core</p>
          <h3 className="mt-1 text-xl font-black text-white">Projects Delivery Core</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Core vận hành dự án: scope, milestone, blocker, acceptance, budget, actual và approval path.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-sky-300/40 px-3 py-1 text-sky-100">{projects.length} projects</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{activeCount} active</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{blockedCount} blocked</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{highRiskCount} high</span>
          <span className="rounded-full border border-fuchsia-300/40 px-3 py-1 text-fuchsia-100">{overBudgetCount} budget watch</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <select value={type} onChange={(event) => setType(event.target.value as ProjectType)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-sky-300">{projectTypes.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-sky-300">{risks.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={financeStatus} onChange={(event) => setFinanceStatus(event.target.value as FinanceStatus)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-sky-300">{financeStatuses.map((item) => <option key={item}>{item}</option>)}</select>
        <input value={client} onChange={(event) => setClient(event.target.value)} placeholder="Client / internal owner" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <input value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="Deadline" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Budget" type="number" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <input value={actual} onChange={(event) => setActual(event.target.value)} placeholder="Actual" type="number" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <textarea value={scope} onChange={(event) => setScope(event.target.value)} placeholder="Scope" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300 md:col-span-2" />
        <textarea value={milestone} onChange={(event) => setMilestone(event.target.value)} placeholder="Current milestone / next deliverable" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300 md:col-span-2" />
        <input value={acceptance} onChange={(event) => setAcceptance(event.target.value)} placeholder="Acceptance criteria" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300 md:col-span-2" />
        <button onClick={addProject} className="rounded-xl border border-sky-300/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-400/10 md:col-span-2">Add project</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-sky-300 text-sky-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {projectTypes.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-sky-300 text-sky-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleProjects.map((project) => (
          <article key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{project.name}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{project.type} · {project.client} · {project.deadline}</p>
              </div>
              <span className="rounded-full border border-sky-300/40 px-2 py-0.5 text-[10px] font-black text-sky-100">{project.stage} · {project.risk}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{project.scope}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Milestone: {project.milestone}</p>
            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">
              Finance: {project.financeStatus} · Budget {formatMoney(project.budget)} · Actual {formatMoney(project.actual)} · Variance {formatMoney(variance(project))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {stages.map((stage) => <button key={stage} onClick={() => updateStage(project, stage)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-sky-300 hover:text-sky-100">{stage}</button>)}
              {financeStatuses.map((status) => <button key={status} onClick={() => updateFinanceStatus(project, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-fuchsia-300 hover:text-fuchsia-100">{status}</button>)}
              <button onClick={() => pushToWorkboard(project)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">To Workboard</button>
              <button onClick={() => requestApproval(project)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
              <button onClick={() => copyBrief(project)} className="rounded-xl border border-sky-300/50 px-3 py-2 text-[11px] font-black text-sky-100 hover:bg-sky-400/10">Copy brief</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
