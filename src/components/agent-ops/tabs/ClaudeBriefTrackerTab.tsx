import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const BRIEF_TRACKER_KEY = 'ledgerflow_claude_brief_tracker_v1';

type BriefStatus = 'Done' | 'In Progress' | 'Next' | 'Later' | 'Blocked';
type BriefArea = 'Core OS' | 'AgentOps' | 'Founder OS' | 'Growth' | 'Data' | 'Integration' | 'Security' | 'QA' | 'Domain Cleanup';

type BriefItem = {
  id: string;
  title: string;
  area: BriefArea;
  status: BriefStatus;
  priority: 'P0' | 'P1' | 'P2';
  doneEvidence: string;
  nextStep: string;
  risk: string;
};

const seedItems: BriefItem[] = [
  {
    id: 'brief-agentops-hub',
    title: 'AgentOps Hub deepening',
    area: 'AgentOps',
    status: 'Done',
    priority: 'P0',
    doneEvidence: 'Gate, Workboard, Tool Cards, Prompt Pack, Daily Standup, AI Cost, Feedback, Task Queue.',
    nextStep: 'Keep CI green and reduce duplicated workflow logic.',
    risk: 'Hub has many tabs; needs grouping later.',
  },
  {
    id: 'brief-founder-os',
    title: 'Founder OS 5 core views',
    area: 'Founder OS',
    status: 'Done',
    priority: 'P0',
    doneEvidence: 'Founder OS tab with dashboard, work orders, idea portfolio, SOP, risk and release audit.',
    nextStep: 'Connect deeper with real KPI data when backend is ready.',
    risk: 'Still local-first; not a full backend source of truth.',
  },
  {
    id: 'brief-knowledge-memory',
    title: 'Knowledge/RAG and versioned memory',
    area: 'Data',
    status: 'In Progress',
    priority: 'P0',
    doneEvidence: 'Knowledge Base and Memory Versions tabs exist.',
    nextStep: 'Add import/export, citations and lightweight search quality checks.',
    risk: 'No vector index yet.',
  },
  {
    id: 'brief-connectors',
    title: 'Integration registry and connector control',
    area: 'Integration',
    status: 'In Progress',
    priority: 'P0',
    doneEvidence: 'ConnectorsTab reads integration API with fallback and test action.',
    nextStep: 'Wire GitHub PR flow after approval; keep secrets out of frontend.',
    risk: 'External actions must remain approval-first.',
  },
  {
    id: 'brief-github-pr',
    title: 'GitHub connector end-to-end',
    area: 'Integration',
    status: 'Next',
    priority: 'P0',
    doneEvidence: 'GitHub PR Control plan-first tab exists.',
    nextStep: 'Implement approved branch/commit/PR executor behind backend guard.',
    risk: 'Can break repo if approval and rollback are weak.',
  },
  {
    id: 'brief-navigation-ia',
    title: 'Navigation and IA cleanup',
    area: 'Core OS',
    status: 'In Progress',
    priority: 'P1',
    doneEvidence: 'Navigation Map and Industry Templates tabs exist.',
    nextStep: 'Refactor main app navigation into Company OS lanes.',
    risk: 'Large UI refactor can cause merge and route issues.',
  },
  {
    id: 'brief-domain-cleanup',
    title: 'Move construction-heavy domain into industry template',
    area: 'Domain Cleanup',
    status: 'In Progress',
    priority: 'P1',
    doneEvidence: 'Industry Templates separates core Company OS from Xay dung template.',
    nextStep: 'Audit visible labels across app and move hardcoded construction language.',
    risk: 'Old domain labels may remain in legacy screens.',
  },
  {
    id: 'brief-growth-sales',
    title: 'Growth and Sales CRM loops',
    area: 'Growth',
    status: 'Done',
    priority: 'P1',
    doneEvidence: 'Growth Studio and Sales CRM tabs exist.',
    nextStep: 'Add metrics review and customer evidence import later.',
    risk: 'Needs real CRM data later.',
  },
  {
    id: 'brief-docs-approval',
    title: 'Documents and approval workflow',
    area: 'Core OS',
    status: 'Done',
    priority: 'P1',
    doneEvidence: 'Documents & Approval tab exists.',
    nextStep: 'Connect to file uploads/storage later.',
    risk: 'Local-only documents are not durable enough for production.',
  },
  {
    id: 'brief-analytics-games',
    title: 'Analytics sandbox and learning games',
    area: 'Data',
    status: 'Done',
    priority: 'P2',
    doneEvidence: 'Analytics Sandbox and Learning Games tabs exist.',
    nextStep: 'Add templates and scoring rubrics.',
    risk: 'Simulation quality depends on seed scenarios.',
  },
  {
    id: 'brief-secrets',
    title: 'Secrets Vault policy',
    area: 'Security',
    status: 'Done',
    priority: 'P0',
    doneEvidence: 'Secrets Vault stores metadata only, not secret values.',
    nextStep: 'Connect to backend/provider secret store when ready.',
    risk: 'Never store raw keys in localStorage, repo, prompt or chat.',
  },
  {
    id: 'brief-qa-release',
    title: 'QA matrix and release notes',
    area: 'QA',
    status: 'In Progress',
    priority: 'P0',
    doneEvidence: 'QA Matrix and Release Notes tabs exist.',
    nextStep: 'Add real automated tests for approval, Workboard and storage helpers.',
    risk: 'Manual QA alone will miss TypeScript regressions.',
  },
];

const statuses: BriefStatus[] = ['Done', 'In Progress', 'Next', 'Later', 'Blocked'];
const areas: Array<'ALL' | BriefArea> = ['ALL', 'Core OS', 'AgentOps', 'Founder OS', 'Growth', 'Data', 'Integration', 'Security', 'QA', 'Domain Cleanup'];

function statusTone(status: BriefStatus) {
  if (status === 'Done') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (status === 'In Progress') return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100';
  if (status === 'Next') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  if (status === 'Blocked') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function reportFor(items: BriefItem[]) {
  const lines = ['# Claude Brief Tracker', '', `Generated: ${new Date().toLocaleString('vi-VN')}`, ''];
  statuses.forEach((status) => {
    const group = items.filter((item) => item.status === status);
    if (!group.length) return;
    lines.push(`## ${status}`);
    group.forEach((item) => {
      lines.push(`- [${item.priority}] ${item.title} (${item.area})`);
      lines.push(`  - Evidence: ${item.doneEvidence}`);
      lines.push(`  - Next: ${item.nextStep}`);
      lines.push(`  - Risk: ${item.risk}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

export default function ClaudeBriefTrackerTab() {
  useLocalStorageVersion();
  const [area, setArea] = useState<'ALL' | BriefArea>('ALL');
  const [query, setQuery] = useState('');
  const items = readLocalStorageValue<BriefItem[]>(BRIEF_TRACKER_KEY, seedItems);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const areaOk = area === 'ALL' || item.area === area;
      const queryOk = !q || `${item.title} ${item.doneEvidence} ${item.nextStep} ${item.risk}`.toLowerCase().includes(q);
      return areaOk && queryOk;
    });
  }, [area, items, query]);

  const stats = statuses.map((status) => ({ status, count: items.filter((item) => item.status === status).length }));

  const saveItems = (next: BriefItem[]) => writeLocalStorageValue(BRIEF_TRACKER_KEY, next);

  const updateStatus = (item: BriefItem, status: BriefStatus) => {
    saveItems(items.map((entry) => entry.id === item.id ? { ...entry, status } : entry));
    appendAgentOpsAudit('CLAUDE_BRIEF_STATUS_CHANGED', item.id, `${item.title} -> ${status}`);
  };

  const resetSeed = () => {
    saveItems(seedItems);
    appendAgentOpsAudit('CLAUDE_BRIEF_RESET', 'claude-brief', 'Reset tracker to current seed roadmap.');
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportFor(items));
    appendAgentOpsAudit('CLAUDE_BRIEF_REPORT_COPIED', 'claude-brief', 'Copied roadmap report.');
  };

  return (
    <section className="rounded-3xl border border-indigo-400/30 bg-indigo-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Claude build brief</p>
          <h3 className="mt-1 text-xl font-black text-white">Brief Tracker</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Checklist tiến độ theo brief Claude: đã làm, đang làm, còn nợ, rủi ro và bước tiếp theo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyReport} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-xs font-black text-indigo-100 hover:bg-indigo-400/10">Copy report</button>
          <button onClick={resetSeed} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-indigo-300 hover:text-indigo-100">Reset seed</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {stats.map((stat) => <div key={stat.status} className={`rounded-2xl border p-3 ${statusTone(stat.status)}`}><p className="text-2xl font-black">{stat.count}</p><p className="text-[11px] font-black uppercase tracking-[0.18em]">{stat.status}</p></div>)}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brief item, evidence, risk, next step" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-indigo-300" />
        <select value={area} onChange={(event) => setArea(event.target.value as 'ALL' | BriefArea)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-indigo-300">
          {areas.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{item.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{item.area} · {item.priority}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(item.status)}`}>{item.status}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Evidence: {item.doneEvidence}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-cyan-100">Next: {item.nextStep}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-amber-100">Risk: {item.risk}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateStatus(item, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-indigo-300 hover:text-indigo-100">{status}</button>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
