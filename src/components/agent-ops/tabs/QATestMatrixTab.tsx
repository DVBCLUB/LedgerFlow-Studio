import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../storage';

const QA_TEST_MATRIX_KEY = 'ledgerflow_qa_test_matrix_v1';

type TestArea = 'Approval' | 'Workboard' | 'Connectors' | 'Memory' | 'CI' | 'Release' | 'Security';
type TestStatus = 'Not Run' | 'Pass' | 'Fail' | 'Blocked';

type QATestCase = {
  id: string;
  area: TestArea;
  title: string;
  expected: string;
  status: TestStatus;
  evidence: string;
  owner: string;
  updatedAt: string;
};

const areas: TestArea[] = ['Approval', 'Workboard', 'Connectors', 'Memory', 'CI', 'Release', 'Security'];
const statuses: TestStatus[] = ['Not Run', 'Pass', 'Fail', 'Blocked'];

const seedCases: QATestCase[] = [
  {
    id: 'qa-approval-medium-risk',
    area: 'Approval',
    title: 'Medium/High risk action must enter Approval Gate',
    expected: 'Task or tool action with MEDIUM/HIGH risk creates a pending approval and cannot be treated as executed automatically.',
    status: 'Not Run',
    evidence: 'Open Task Queue, Product Factory, Tool Cards and verify approval request appears.',
    owner: 'AI QA',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qa-workboard-legacy-card',
    area: 'Workboard',
    title: 'Legacy WorkCard payload does not crash Workboard',
    expected: 'Old localStorage cards missing tools/plan/kind are normalized and still render.',
    status: 'Not Run',
    evidence: 'Seed localStorage with old card payload and reload Workboard.',
    owner: 'AI QA',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qa-connector-fallback',
    area: 'Connectors',
    title: 'Connector registry falls back safely when backend is offline',
    expected: 'Connectors tab still opens with local policy cards if /api/integrations is unavailable.',
    status: 'Not Run',
    evidence: 'Run frontend only and open Connectors tab.',
    owner: 'AI Dev',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qa-memory-approved-only',
    area: 'Memory',
    title: 'Only approved knowledge enters AI context',
    expected: 'Knowledge/RAG context excludes Draft and Needs Review notes.',
    status: 'Not Run',
    evidence: 'Create 3 notes with different review status, then copy RAG context.',
    owner: 'AI Auditor',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qa-ci-green-before-feature',
    area: 'CI',
    title: 'CI must be green before next feature batch',
    expected: 'LedgerFlow Studio CI passes type-check/build before feature expansion continues.',
    status: 'Not Run',
    evidence: 'GitHub Actions shows green for latest main commit.',
    owner: 'AI Dev',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qa-secret-no-value',
    area: 'Security',
    title: 'Secrets Vault never stores real secret values',
    expected: 'Vault stores only metadata, owner, scope, storage location and rotation note.',
    status: 'Not Run',
    evidence: 'Inspect Secrets Vault form and localStorage payload.',
    owner: 'AI Auditor',
    updatedAt: new Date().toISOString(),
  },
];

function statusTone(status: TestStatus) {
  if (status === 'Pass') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (status === 'Fail') return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  if (status === 'Blocked') return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  return 'border-slate-700 bg-slate-900/60 text-slate-300';
}

function reportFor(cases: QATestCase[]) {
  const total = cases.length;
  const pass = cases.filter((item) => item.status === 'Pass').length;
  const fail = cases.filter((item) => item.status === 'Fail').length;
  const blocked = cases.filter((item) => item.status === 'Blocked').length;
  return [
    '# LedgerFlow QA Test Matrix',
    '',
    `- Total: ${total}`,
    `- Pass: ${pass}`,
    `- Fail: ${fail}`,
    `- Blocked: ${blocked}`,
    '',
    ...cases.map((item) => [`## ${item.area} · ${item.title}`, `- Status: ${item.status}`, `- Expected: ${item.expected}`, `- Evidence: ${item.evidence}`, `- Owner: ${item.owner}`].join('\n')),
  ].join('\n\n');
}

export default function QATestMatrixTab() {
  useLocalStorageVersion();
  const [area, setArea] = useState<'ALL' | TestArea>('ALL');
  const [title, setTitle] = useState('');
  const [expected, setExpected] = useState('');

  const cases = readLocalStorageValue<QATestCase[]>(QA_TEST_MATRIX_KEY, seedCases);
  const visibleCases = useMemo(() => area === 'ALL' ? cases : cases.filter((item) => item.area === area), [area, cases]);
  const passCount = cases.filter((item) => item.status === 'Pass').length;
  const failCount = cases.filter((item) => item.status === 'Fail').length;
  const blockedCount = cases.filter((item) => item.status === 'Blocked').length;

  const saveCases = (next: QATestCase[]) => writeLocalStorageValue(QA_TEST_MATRIX_KEY, next);

  const addCase = () => {
    if (!title.trim() || !expected.trim()) return;
    const selectedArea: TestArea = area === 'ALL' ? 'Release' : area;
    const testCase: QATestCase = {
      id: `qa-${Date.now()}`,
      area: selectedArea,
      title: title.trim(),
      expected: expected.trim(),
      status: 'Not Run',
      evidence: 'Pending evidence.',
      owner: 'AI QA',
      updatedAt: new Date().toISOString(),
    };
    saveCases([testCase, ...cases].slice(0, 200));
    appendAgentOpsAudit('QA_TEST_ADDED', testCase.id, testCase.title);
    setTitle('');
    setExpected('');
  };

  const updateCase = (testCase: QATestCase, status: TestStatus) => {
    const next = cases.map((item) => item.id === testCase.id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
    saveCases(next);
    appendAgentOpsAudit('QA_TEST_STATUS_CHANGED', testCase.id, `${testCase.title} → ${status}`);
  };

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportFor(cases));
    appendAgentOpsAudit('QA_TEST_REPORT_COPIED', 'qa-test-matrix', `${cases.length} test cases`);
  };

  const resetSeed = () => {
    saveCases(seedCases);
    appendAgentOpsAudit('QA_TEST_MATRIX_RESET', 'qa-test-matrix', 'Reset to seed QA matrix');
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">QA / Release readiness</p>
          <h3 className="mt-1 text-xl font-black text-white">QA Test Matrix</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Checklist test cho Approval Gate, Workboard, Connectors, Memory, CI và Security trước khi release.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">{cases.length} cases</span>
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{passCount} pass</span>
          <span className="rounded-full border border-rose-300/40 px-3 py-1 text-rose-100">{failCount} fail</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{blockedCount} blocked</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setArea('ALL')} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${area === 'ALL' ? 'border-emerald-300 text-emerald-100' : 'border-slate-700 text-slate-300'}`}>All</button>
        {areas.map((item) => <button key={item} onClick={() => setArea(item)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${area === item ? 'border-emerald-300 text-emerald-100' : 'border-slate-700 text-slate-300'}`}>{item}</button>)}
        <button onClick={copyReport} className="rounded-xl border border-cyan-300/50 px-3 py-2 text-[11px] font-black text-cyan-100 hover:bg-cyan-400/10">Copy report</button>
        <button onClick={resetSeed} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-amber-300 hover:text-amber-100">Reset seed</button>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 md:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên test case" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <input value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Expected result" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-emerald-300" />
        <button onClick={addCase} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10 md:col-span-2">Thêm test case</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleCases.map((testCase) => (
          <article key={testCase.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{testCase.title}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{testCase.area} · {testCase.owner} · {new Date(testCase.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(testCase.status)}`}>{testCase.status}</span>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">Expected: {testCase.expected}</p>
            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">Evidence: {testCase.evidence}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((status) => <button key={status} onClick={() => updateCase(testCase, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-100">{status}</button>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
