import { useMemo, useState } from 'react';
import type { ApprovalRequest } from '../../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const TASK_QUEUE_KEY = 'ledgerflow_ai_task_queue_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';
const APPROVAL_KEY = 'ledgerflow_approval_gate_requests_v1';

type TaskRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type TaskStatus = 'Inbox' | 'Planning' | 'Waiting Approval' | 'Running' | 'Blocked' | 'Done';
type AgentRole = 'Chief of Staff' | 'AI Dev' | 'AI Designer' | 'AI Accountant' | 'AI Auditor' | 'AI Data Analyst' | 'AI QA' | 'AI Marketer';

type AITask = {
  id: string;
  title: string;
  agent: AgentRole;
  status: TaskStatus;
  risk: TaskRisk;
  expectedOutput: string;
  context: string;
  founderDecision: string;
  createdAt: string;
  updatedAt: string;
};

type WorkCard = {
  id: string;
  title: string;
  status: 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
  owner: string;
  risk: TaskRisk;
  source: string;
  expectedOutput: string;
  context: string;
  createdAt: string;
  updatedAt: string;
};

const agents: AgentRole[] = ['Chief of Staff', 'AI Dev', 'AI Designer', 'AI Accountant', 'AI Auditor', 'AI Data Analyst', 'AI QA', 'AI Marketer'];
const statuses: TaskStatus[] = ['Inbox', 'Planning', 'Waiting Approval', 'Running', 'Blocked', 'Done'];
const risks: TaskRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedTasks: AITask[] = [
  {
    id: 'seed-task-daily-founder-brief',
    title: 'Tổng hợp Founder Daily Brief',
    agent: 'Chief of Staff',
    status: 'Inbox',
    risk: 'LOW',
    expectedOutput: 'Markdown brief gồm: việc cần duyệt, blocker, việc nên làm hôm nay, rủi ro cao.',
    context: 'Dùng Daily Standup, Workboard, Approval Gate, Feedback, Knowledge Base. Không tự chạy external action.',
    founderDecision: 'Founder review before sending outside the app.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-ci-red-fix',
    title: 'Fix CI đỏ trước khi thêm feature mới',
    agent: 'AI Dev',
    status: 'Planning',
    risk: 'MEDIUM',
    expectedOutput: 'Một commit nhỏ sửa đúng lỗi TypeScript/build, kèm ghi chú file đã sửa.',
    context: 'Luôn ưu tiên CI xanh. Không thêm feature nếu type-check/build đang đỏ.',
    founderDecision: 'Founder duyệt commit trước khi merge nếu động vào file lõi.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function taskTone(status: TaskStatus) {
  if (status === 'Done') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Blocked') return 'border-rose-400/40 text-rose-200';
  if (status === 'Waiting Approval') return 'border-amber-400/40 text-amber-200';
  return 'border-slate-700 text-slate-300';
}

function riskTone(risk: TaskRisk) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function workboardStatusFor(status: TaskStatus): WorkCard['status'] {
  if (status === 'Waiting Approval') return 'Waiting Approval';
  if (status === 'Done') return 'Done';
  if (status === 'Planning' || status === 'Running' || status === 'Blocked') return 'Planning';
  return 'Inbox';
}

function approvalRiskFor(risk: TaskRisk): ApprovalRequest['risk'] {
  return risk === 'LOW' ? 'MEDIUM' : risk;
}

function approvalExpiryIso(days = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function createMarkdown(task: AITask) {
  return [
    `# AI Task: ${task.title}`,
    '',
    `- Agent: ${task.agent}`,
    `- Status: ${task.status}`,
    `- Risk: ${task.risk}`,
    `- Expected output: ${task.expectedOutput}`,
    `- Founder decision: ${task.founderDecision}`,
    '',
    '## Context',
    task.context,
    '',
    '## Operating rules',
    '- Work in sandbox/dry-run first.',
    '- Ask for founder approval before external write action.',
    '- Return evidence, changed files, rollback note and audit summary.',
  ].join('\n');
}

export default function TaskQueueTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [agent, setAgent] = useState<AgentRole>('Chief of Staff');
  const [risk, setRisk] = useState<TaskRisk>('LOW');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [context, setContext] = useState('');
  const [filter, setFilter] = useState<'ALL' | AgentRole>('ALL');

  const tasks = readLocalStorageValue<AITask[]>(TASK_QUEUE_KEY, seedTasks);
  const visibleTasks = useMemo(() => filter === 'ALL' ? tasks : tasks.filter((task) => task.agent === filter), [filter, tasks]);
  const pendingCount = tasks.filter((task) => task.status !== 'Done').length;
  const highRiskCount = tasks.filter((task) => task.risk === 'HIGH').length;

  const saveTasks = (next: AITask[]) => writeLocalStorageValue(TASK_QUEUE_KEY, next);

  const addTask = () => {
    if (!title.trim() || !expectedOutput.trim()) return;
    const now = new Date().toISOString();
    const task: AITask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      agent,
      risk,
      status: risk === 'LOW' ? 'Inbox' : 'Waiting Approval',
      expectedOutput: expectedOutput.trim(),
      context: context.trim() || 'No extra context provided.',
      founderDecision: risk === 'LOW' ? 'Sandbox/dry-run allowed.' : 'Founder approval required before execution.',
      createdAt: now,
      updatedAt: now,
    };
    saveTasks([task, ...tasks].slice(0, 200));
    appendAgentOpsAudit('AI_TASK_CREATED', task.id, `${task.agent} · ${task.risk} · ${task.title}`);
    setTitle('');
    setExpectedOutput('');
    setContext('');
  };

  const updateStatus = (task: AITask, status: TaskStatus) => {
    const next = tasks.map((item) => item.id === task.id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
    saveTasks(next);
    appendAgentOpsAudit('AI_TASK_STATUS_CHANGED', task.id, `${task.title} → ${status}`);
  };

  const pushToWorkboard = (task: AITask) => {
    const card: WorkCard = {
      id: `workcard-${task.id}`,
      title: task.title,
      status: workboardStatusFor(task.status),
      owner: task.agent,
      risk: task.risk,
      source: 'AI Task Queue',
      expectedOutput: task.expectedOutput,
      context: task.context,
      createdAt: task.createdAt,
      updatedAt: new Date().toISOString(),
    };
    appendLocalStorageArrayItem(WORKBOARD_KEY, card, 200);
    appendAgentOpsAudit('AI_TASK_TO_WORKBOARD', task.id, `Pushed to Workboard · ${task.title}`);
  };

  const requestApproval = (task: AITask) => {
    const request: ApprovalRequest = {
      id: `approval-${task.id}-${Date.now()}`,
      title: `Approve AI task: ${task.title}`,
      source: 'AI Task Queue',
      sourceId: task.id,
      risk: approvalRiskFor(task.risk),
      status: 'Pending',
      action: `Allow ${task.agent} to execute task`,
      details: createMarkdown(task),
      createdAt: new Date().toISOString(),
      expiresAt: approvalExpiryIso(),
    };
    appendLocalStorageArrayItem(APPROVAL_KEY, request, 200);
    updateStatus(task, 'Waiting Approval');
    appendAgentOpsAudit('AI_TASK_APPROVAL_REQUESTED', task.id, `${task.title} sent to Approval Gate`);
    window.dispatchEvent(new CustomEvent('ledgerflow-approval-gate-changed'));
  };

  const copyTask = async (task: AITask) => {
    await navigator.clipboard.writeText(createMarkdown(task));
    appendAgentOpsAudit('AI_TASK_PROMPT_COPIED', task.id, task.title);
  };

  return (
    <section className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">AI workforce queue</p>
          <h3 className="mt-1 text-xl font-black text-white">Task Queue cho AI nhân viên</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Giao việc cho từng AI role, kiểm soát risk, output, approval và audit trước khi chạy việc thật.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{tasks.length} tasks</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{pendingCount} open</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{highRiskCount} high risk</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên việc cần giao cho AI" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <select value={agent} onChange={(event) => setAgent(event.target.value as AgentRole)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300">
          {agents.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={risk} onChange={(event) => setRisk(event.target.value as TaskRisk)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-cyan-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={expectedOutput} onChange={(event) => setExpectedOutput(event.target.value)} placeholder="Output mong muốn" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300" />
        <textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Context, dữ liệu, rule, link nội bộ cần AI dùng" className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-300 md:col-span-2" />
        <button onClick={addTask} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/10 md:col-span-2">Thêm task</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === 'ALL' ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {agents.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${filter === item ? 'border-cyan-300 text-cyan-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleTasks.map((task) => (
          <article key={task.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{task.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{task.agent} · {new Date(task.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${taskTone(task.status)}`}>{task.status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(task.risk)}`}>{task.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Output: {task.expectedOutput}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">{task.context}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateStatus(task, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-cyan-300 hover:text-cyan-100">{status}</button>)}
              <button onClick={() => pushToWorkboard(task)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">To Workboard</button>
              <button onClick={() => requestApproval(task)} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Approval</button>
              <button onClick={() => copyTask(task)} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy prompt</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
