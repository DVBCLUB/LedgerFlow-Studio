import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const RELEASE_NOTES_KEY = 'ledgerflow_release_notes_v1';
const QA_KEY = 'ledgerflow_qa_test_matrix_v1';
const GITHUB_PR_KEY = 'ledgerflow_github_pr_plans_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';

type ReleaseStatus = 'Draft' | 'QA Review' | 'Ready' | 'Released' | 'Rolled Back';
type ReleaseRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type ReleaseNote = {
  id: string;
  title: string;
  version: string;
  status: ReleaseStatus;
  risk: ReleaseRisk;
  summary: string;
  changed: string;
  testPlan: string;
  rollback: string;
  evidence: string;
  createdAt: string;
  updatedAt: string;
};

type QAItem = { status?: string };
type PullPlan = { title?: string; risk?: string; status?: string };
type WorkCard = { status?: string; risk?: string };

const statuses: ReleaseStatus[] = ['Draft', 'QA Review', 'Ready', 'Released', 'Rolled Back'];
const risks: ReleaseRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

const seedNotes: ReleaseNote[] = [
  {
    id: 'release-company-os-agentops',
    title: 'Company OS AgentOps expansion',
    version: 'v0.2-company-os',
    status: 'QA Review',
    risk: 'MEDIUM',
    summary: 'AgentOps hub expanded with Founder OS, Workboard, Approval Gate, Knowledge, Growth, Sales, Documents, Analytics, QA and GitHub PR planning.',
    changed: 'Added local-first Company OS modules and shared audit/localStorage helpers.',
    testPlan: 'Run npm run build. Verify AgentOps tabs open. Create one item in Workboard, Approval Gate, Knowledge, QA Matrix and GitHub PR Control.',
    rollback: 'Revert the AgentOps tab commits or hide new tabs from AgentOpsHub while keeping storage helpers.',
    evidence: 'Pending CI and founder smoke test.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function riskTone(risk: ReleaseRisk) {
  if (risk === 'HIGH') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (risk === 'MEDIUM') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
}

function statusTone(status: ReleaseStatus) {
  if (status === 'Released') return 'border-emerald-400/40 text-emerald-200';
  if (status === 'Rolled Back') return 'border-rose-400/40 text-rose-200';
  if (status === 'Ready') return 'border-cyan-400/40 text-cyan-200';
  return 'border-slate-700 text-slate-300';
}

function releaseMarkdown(note: ReleaseNote, qaPass: number, qaFail: number, openWork: number) {
  return [
    `# Release Notes: ${note.title}`,
    '',
    `- Version: ${note.version}`,
    `- Status: ${note.status}`,
    `- Risk: ${note.risk}`,
    `- QA pass/fail: ${qaPass}/${qaFail}`,
    `- Open work cards: ${openWork}`,
    '',
    '## Summary',
    note.summary,
    '',
    '## Changes',
    note.changed,
    '',
    '## Test Plan',
    note.testPlan,
    '',
    '## Rollback',
    note.rollback,
    '',
    '## Evidence',
    note.evidence,
  ].join('\n');
}

export default function ReleaseNotesTab() {
  useLocalStorageVersion();
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [risk, setRisk] = useState<ReleaseRisk>('LOW');
  const [summary, setSummary] = useState('');
  const [changed, setChanged] = useState('');
  const [testPlan, setTestPlan] = useState('');
  const [rollback, setRollback] = useState('');
  const [evidence, setEvidence] = useState('');

  const notes = readLocalStorageValue<ReleaseNote[]>(RELEASE_NOTES_KEY, seedNotes);
  const qaItems = readLocalStorageValue<QAItem[]>(QA_KEY, []);
  const pullPlans = readLocalStorageValue<PullPlan[]>(GITHUB_PR_KEY, []);
  const workCards = readLocalStorageValue<WorkCard[]>(WORKBOARD_KEY, []);

  const qaPass = qaItems.filter((item) => item.status === 'Pass').length;
  const qaFail = qaItems.filter((item) => item.status === 'Fail' || item.status === 'Blocked').length;
  const openWork = workCards.filter((card) => card.status !== 'Done').length;
  const highRiskPlans = pullPlans.filter((plan) => plan.risk === 'HIGH').length;

  const stats = useMemo(() => ({
    draft: notes.filter((note) => note.status === 'Draft').length,
    ready: notes.filter((note) => note.status === 'Ready').length,
    released: notes.filter((note) => note.status === 'Released').length,
  }), [notes]);

  const saveNotes = (next: ReleaseNote[]) => writeLocalStorageValue(RELEASE_NOTES_KEY, next);

  const addNote = () => {
    if (!title.trim() || !version.trim() || !summary.trim()) return;
    const now = new Date().toISOString();
    const note: ReleaseNote = {
      id: `release-${Date.now()}`,
      title: title.trim(),
      version: version.trim(),
      status: risk === 'LOW' ? 'Draft' : 'QA Review',
      risk,
      summary: summary.trim(),
      changed: changed.trim() || 'Changes not documented yet.',
      testPlan: testPlan.trim() || 'Run build, smoke test core flows and record evidence.',
      rollback: rollback.trim() || 'Rollback plan not documented yet.',
      evidence: evidence.trim() || 'Evidence pending.',
      createdAt: now,
      updatedAt: now,
    };
    saveNotes([note, ...notes].slice(0, 120));
    appendAgentOpsAudit('RELEASE_NOTE_CREATED', note.id, `${note.version} · ${note.risk} · ${note.title}`);
    setTitle('');
    setVersion('');
    setSummary('');
    setChanged('');
    setTestPlan('');
    setRollback('');
    setEvidence('');
  };

  const updateStatus = (note: ReleaseNote, status: ReleaseStatus) => {
    const next = notes.map((item) => item.id === note.id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
    saveNotes(next);
    appendAgentOpsAudit('RELEASE_STATUS_CHANGED', note.id, `${note.version} → ${status}`);
  };

  const copyNote = async (note: ReleaseNote) => {
    await navigator.clipboard.writeText(releaseMarkdown(note, qaPass, qaFail, openWork));
    appendAgentOpsAudit('RELEASE_NOTE_COPIED', note.id, note.version);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Release control</p>
          <h3 className="mt-1 text-xl font-black text-white">Release Notes & Rollback</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Gom thay đổi, test plan, evidence và rollback trước khi release Company OS.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">{notes.length} notes</span>
          <span className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">{stats.ready} ready</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{stats.released} released</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{qaFail} QA issues</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Release title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="Version, ví dụ v0.3.0" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <select value={risk} onChange={(event) => setRisk(event.target.value as ReleaseRisk)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300">
          {risks.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summary" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <textarea value={changed} onChange={(event) => setChanged(event.target.value)} placeholder="What changed" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <textarea value={testPlan} onChange={(event) => setTestPlan(event.target.value)} placeholder="Test plan" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <textarea value={rollback} onChange={(event) => setRollback(event.target.value)} placeholder="Rollback plan" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Evidence / CI / smoke test" className="min-h-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <button onClick={addNote} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10 md:col-span-2">Thêm release note</button>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-4">
        <p className="text-xs font-black text-slate-300">QA pass: <span className="text-emerald-200">{qaPass}</span></p>
        <p className="text-xs font-black text-slate-300">QA fail/blocked: <span className="text-rose-200">{qaFail}</span></p>
        <p className="text-xs font-black text-slate-300">Open work: <span className="text-amber-200">{openWork}</span></p>
        <p className="text-xs font-black text-slate-300">High-risk PR plans: <span className="text-rose-200">{highRiskPlans}</span></p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {notes.map((note) => (
          <article key={note.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{note.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{note.version} · {new Date(note.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(note.status)}`}>{note.status}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskTone(note.risk)}`}>{note.risk}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{note.summary}</p>
            <div className="mt-3 grid gap-2 text-[11px] font-semibold leading-5 text-slate-300">
              <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-2"><span className="text-emerald-200">Changed:</span> {note.changed}</p>
              <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-2"><span className="text-cyan-200">Test:</span> {note.testPlan}</p>
              <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-2"><span className="text-amber-200">Rollback:</span> {note.rollback}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateStatus(note, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-100">{status}</button>)}
              <button onClick={() => copyNote(note)} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-[11px] font-black text-emerald-100 hover:bg-emerald-400/10">Copy notes</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
