import { useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const MEMORY_VERSIONS_KEY = 'ledgerflow_company_memory_versions_v1';
const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';
const SNAPSHOT_KEY = 'ledgerflow_daily_standup_v1';

type MemoryStatus = 'Draft' | 'Needs Review' | 'Approved' | 'Archived';

type MemoryVersion = {
  id: string;
  version: string;
  title: string;
  status: MemoryStatus;
  createdAt: string;
  owner: string;
  scope: string;
  summary: string;
  context: string;
  rollbackNote: string;
};

type KnowledgeSeed = { title?: string; body?: string; trust?: string };
type StandupSeed = { report?: string; at?: string };

function nextVersion(items: MemoryVersion[]) {
  return `v${items.length + 1}.${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
}

function statusTone(status: MemoryStatus) {
  if (status === 'Approved') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Needs Review') return 'border-amber-400/40 text-amber-200';
  if (status === 'Archived') return 'border-slate-600 text-slate-400';
  return 'border-cyan-400/40 text-cyan-200';
}

function buildSeedContext() {
  const knowledge = readLocalStorageValue<KnowledgeSeed[]>(KNOWLEDGE_KEY, []);
  const snapshots = readLocalStorageValue<StandupSeed[]>(SNAPSHOT_KEY, []);
  const approvedKnowledge = knowledge
    .filter((item) => item.trust === 'Approved')
    .slice(0, 8)
    .map((item) => `- ${item.title || 'Knowledge'}: ${item.body || ''}`)
    .join('\n');
  const latestStandup = snapshots[0]?.report || '';

  return [
    '# LedgerFlow Company Memory Seed',
    '',
    '## Approved Knowledge',
    approvedKnowledge || '- No approved knowledge note yet.',
    '',
    '## Latest Daily Standup Snapshot',
    latestStandup || '- No standup snapshot yet.'
  ].join('\n');
}

export default function MemoryVersionsTab() {
  useLocalStorageVersion();
  const [versions, setVersions] = useState(() => readLocalStorageValue<MemoryVersion[]>(MEMORY_VERSIONS_KEY, []));
  const [title, setTitle] = useState('Company Memory Snapshot');
  const [scope, setScope] = useState('Founder OS + AgentOps + Product Factory');
  const [summary, setSummary] = useState('Company, product, AI staff, workflow and key decisions snapshot.');
  const [context, setContext] = useState(buildSeedContext());
  const [rollbackNote, setRollbackNote] = useState('If this snapshot is wrong, archive it and use the previous Approved version.');

  const persist = (next: MemoryVersion[]) => {
    setVersions(next);
    writeLocalStorageValue(MEMORY_VERSIONS_KEY, next);
  };

  const createVersion = () => {
    const item: MemoryVersion = {
      id: `memory-version-${Date.now()}`,
      version: nextVersion(versions),
      title: title.trim() || 'Company Memory Snapshot',
      status: 'Needs Review',
      createdAt: new Date().toLocaleString('vi-VN'),
      owner: 'Founder',
      scope,
      summary,
      context,
      rollbackNote,
    };
    persist([item, ...versions].slice(0, 80));
    appendAgentOpsAudit('MEMORY_VERSION_CREATED', item.id, `${item.version} · ${item.title}`);
  };

  const updateStatus = (id: string, status: MemoryStatus) => {
    const next = versions.map((item) => item.id === id ? { ...item, status } : item);
    persist(next);
    appendAgentOpsAudit('MEMORY_VERSION_STATUS', id, `Set memory version to ${status}`);
  };

  const copyContext = async (item: MemoryVersion) => {
    await navigator.clipboard.writeText([
      `# ${item.title}`,
      `Version: ${item.version}`,
      `Status: ${item.status}`,
      `Scope: ${item.scope}`,
      '',
      '## Summary',
      item.summary,
      '',
      '## Context',
      item.context,
      '',
      '## Rollback',
      item.rollbackNote,
    ].join('\n'));
    appendAgentOpsAudit('MEMORY_VERSION_COPIED', item.id, `${item.version} copied for AI context`);
  };

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Versioned company memory</p>
          <h3 className="mt-1 text-xl font-black text-white">Memory Versions</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Create reviewed memory snapshots with rollback notes and AI context export.</p>
        </div>
        <span className="rounded-full border border-indigo-300/35 px-3 py-1 text-xs font-black text-indigo-100">{versions.length} versions</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Create snapshot</p>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none" />
          <input value={scope} onChange={(event) => setScope(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none" />
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold leading-6 text-white outline-none" />
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={8} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold leading-5 text-slate-100 outline-none" />
          <textarea value={rollbackNote} onChange={(event) => setRollbackNote(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold leading-5 text-amber-100 outline-none" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setContext(buildSeedContext())} className="rounded-xl border border-slate-600 px-3 py-2 text-[11px] font-black text-slate-200 hover:border-indigo-300">Refresh seed</button>
            <button onClick={createVersion} className="rounded-xl bg-indigo-300 px-3 py-2 text-[11px] font-black text-slate-950 hover:bg-indigo-200">Create version</button>
          </div>
        </div>

        <div className="grid gap-3">
          {versions.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">{item.version} · {item.title}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{item.createdAt} · {item.owner} · {item.scope}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(item.status)}`}>{item.status}</span>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{item.summary}</p>
              <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-2 text-[11px] font-semibold leading-5 text-amber-100">Rollback: {item.rollbackNote}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => copyContext(item)} className="rounded-xl border border-indigo-300/50 px-3 py-2 text-[11px] font-black text-indigo-100 hover:bg-indigo-400/10">Copy AI context</button>
                <button onClick={() => updateStatus(item.id, 'Approved')} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">Approve</button>
                <button onClick={() => updateStatus(item.id, 'Needs Review')} className="rounded-xl border border-amber-300/50 px-3 py-2 text-[11px] font-black text-amber-100 hover:bg-amber-400/10">Needs review</button>
                <button onClick={() => updateStatus(item.id, 'Archived')} className="rounded-xl border border-slate-600 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-rose-300">Archive</button>
              </div>
            </article>
          ))}
          {versions.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">No memory version yet. Create the first reviewed snapshot.</p>}
        </div>
      </div>
    </section>
  );
}
