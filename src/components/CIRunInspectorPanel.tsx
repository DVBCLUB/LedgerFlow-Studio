import { useEffect, useMemo, useState } from 'react';

type WorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  event: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
};

type SummaryPayload = {
  repo: string;
  latestRuns: WorkflowRun[];
  actionsUrl: string;
  lastCheckedAt: string;
};

type FixPackage = {
  id: string;
  repo: string;
  branchName: string;
  workflowRunUrl: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  prompt: string;
};

const defaultRepo = 'DVBCLUB/LedgerFlow-Studio';

function runState(run: WorkflowRun) {
  if (run.status !== 'completed') return 'Running';
  return String(run.conclusion || '').toLowerCase() === 'success' ? 'Success' : 'Failed';
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CIRunInspectorPanel() {
  const [repo, setRepo] = useState(defaultRepo);
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runs = summary?.latestRuns || [];
  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0];
  const grouped = useMemo(() => ({
    failed: runs.filter((run) => runState(run) === 'Failed'),
    running: runs.filter((run) => runState(run) === 'Running'),
    success: runs.filter((run) => runState(run) === 'Success')
  }), [runs]);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ repo });
      const response = await fetch(`/api/integrations/github/summary?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) throw new Error(data?.error || `Cannot load CI summary: ${response.status}`);
      const payload = data.summary as SummaryPayload;
      setSummary(payload);
      setSelectedRunId(payload.latestRuns?.[0]?.id ?? null);
      localStorage.setItem('ledgerflow_ci_run_inspector_v1', JSON.stringify({ repo, summary: payload, at: new Date().toLocaleString('vi-VN') }));
      window.dispatchEvent(new CustomEvent('ledgerflow-ci-run-inspector-sync', { detail: payload }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot load CI runs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createFixPackage = () => {
    if (!selectedRun) return;
    const pack: FixPackage = {
      id: `ci-inspector-fix-${Date.now()}`,
      repo: summary?.repo || repo,
      branchName: selectedRun.branch,
      workflowRunUrl: selectedRun.htmlUrl,
      workflowName: selectedRun.name,
      status: selectedRun.status,
      conclusion: selectedRun.conclusion,
      createdAt: new Date().toLocaleString('vi-VN'),
      prompt: [
        'Analyze this GitHub Actions workflow from LedgerFlow.',
        `Repository: ${summary?.repo || repo}`,
        `Branch: ${selectedRun.branch}`,
        `Workflow: ${selectedRun.name}`,
        `Run URL: ${selectedRun.htmlUrl}`,
        `Status: ${selectedRun.status}`,
        `Conclusion: ${selectedRun.conclusion || 'none'}`,
        'Return a minimal fix plan, likely files to inspect, and a manual verification checklist.'
      ].join('\n')
    };
    localStorage.setItem('ledgerflow_ci_fix_package_v1', JSON.stringify(pack));
    window.dispatchEvent(new CustomEvent('ledgerflow-ci-fix-package', { detail: pack }));
  };

  return (
    <section className="rounded-3xl border border-orange-400/35 bg-orange-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">CI run inspector</p>
          <h3 className="mt-1 text-xl font-black text-white">Đọc trạng thái GitHub Actions</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Fast Secure: đọc runs hiện có, phân loại lỗi, tạo gói CI fix; không thêm cửa approve mới.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadSummary} disabled={loading} className="rounded-2xl bg-orange-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50">{loading ? 'Đang đọc...' : 'Refresh CI'}</button>
          <button onClick={() => exportJson('ledgerflow-ci-run-inspector.json', { repo, summary })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-orange-300">Xuất JSON</button>
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={repo} onChange={(event) => setRepo(event.target.value)} />
        <a href={summary?.actionsUrl || `https://github.com/${repo}/actions`} target="_blank" rel="noreferrer" className="rounded-2xl border border-orange-400/40 px-4 py-2 text-xs font-black text-orange-200 hover:bg-orange-400/10">Mở Actions</a>
      </div>

      {error && <p className="mb-4 rounded-2xl border border-rose-400/35 bg-rose-400/10 p-3 text-xs font-bold text-rose-200">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-2 text-rose-200">Fail {grouped.failed.length}</div>
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-200">Run {grouped.running.length}</div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-200">OK {grouped.success.length}</div>
          </div>
          <div className="space-y-2">
            {runs.map((run) => <button key={run.id} onClick={() => setSelectedRunId(run.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selectedRun?.id === run.id ? 'border-orange-300 bg-orange-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-orange-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{run.name}</p>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{runState(run)}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">{run.branch || 'branch?'} · {run.status} · {run.conclusion || 'none'}</p>
            </button>)}
            {runs.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-semibold text-slate-400">Chưa có workflow run trong summary.</p>}
          </div>
        </div>

        {selectedRun && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected run</p>
          <h4 className="mt-1 text-lg font-black text-white">{selectedRun.name}</h4>
          <p className="mt-1 text-xs font-bold text-slate-400">{selectedRun.branch} · {selectedRun.event} · {selectedRun.updatedAt}</p>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-semibold leading-6 text-slate-300">
            <p>Status: {selectedRun.status}</p>
            <p>Conclusion: {selectedRun.conclusion || 'none'}</p>
            <p>Created: {selectedRun.createdAt}</p>
            <p>Updated: {selectedRun.updatedAt}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={selectedRun.htmlUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10">Mở run</a>
            <button onClick={createFixPackage} className="rounded-2xl border border-orange-400/40 px-4 py-2 text-xs font-black text-orange-200 hover:bg-orange-400/10">Tạo CI fix package</button>
            <button onClick={() => { createFixPackage(); window.location.hash = '#/ci_doctor'; }} className="rounded-2xl border border-violet-400/40 px-4 py-2 text-xs font-black text-violet-200 hover:bg-violet-400/10">Mở CI Doctor</button>
          </div>
        </div>}
      </div>
    </section>
  );
}
