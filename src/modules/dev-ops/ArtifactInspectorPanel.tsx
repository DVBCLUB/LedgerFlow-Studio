import { useState } from 'react';

type ArtifactSummary = {
  id: number;
  name: string;
  sizeInBytes: number;
  expired: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  archiveDownloadUrl: string;
};

type ArtifactResult = {
  repo: string;
  runId: number;
  artifacts: ArtifactSummary[];
  totalCount: number;
  hasArtifacts: boolean;
  lastCheckedAt: string;
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
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

function parseRunIdFromUrl(url: string) {
  const match = url.match(/\/actions\/runs\/(\d+)/);
  return match ? match[1] : '';
}

export default function ArtifactInspectorPanel() {
  const latestBuild = readLocal<Array<{ repo?: string; branch?: string; runUrl?: string; artifactName?: string }>>('ledgerflow_build_monitor_records_v1', [])[0];
  const [repo, setRepo] = useState(latestBuild?.repo || 'DVBCLUB/LedgerFlow-Studio');
  const [runId, setRunId] = useState(latestBuild?.runUrl ? parseRunIdFromUrl(latestBuild.runUrl) : '');
  const [result, setResult] = useState<ArtifactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inspectArtifacts = async () => {
    if (!runId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/integrations/github/runs/${encodeURIComponent(runId.trim())}/artifacts?repo=${encodeURIComponent(repo.trim())}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Không đọc được artifacts.');
      setResult(data.result as ArtifactResult);
      localStorage.setItem('ledgerflow_latest_artifact_inspection_v1', JSON.stringify(data.result));
      window.dispatchEvent(new CustomEvent('ledgerflow-artifact-inspected', { detail: data.result }));
    } catch (err: any) {
      setError(err?.message || 'Không đọc được artifact metadata.');
    } finally {
      setLoading(false);
    }
  };

  const sendToReleaseCenter = (artifact: ArtifactSummary) => {
    const releases = readLocal<any[]>('ledgerflow_release_artifacts_v1', []);
    const now = new Date().toLocaleString('vi-VN');
    const release = {
      id: `release-artifact-${artifact.id}-${Date.now()}`,
      version: `artifact-${artifact.id}`,
      title: artifact.name,
      repo,
      branch: latestBuild?.branch || 'ai/unknown',
      commitSha: '',
      prNumber: null,
      prUrl: null,
      workflowRunUrl: runId ? `https://github.com/${repo}/actions/runs/${runId}` : null,
      artifactName: artifact.name,
      artifactUrl: artifact.archiveDownloadUrl,
      status: artifact.expired ? 'Failed' : 'Ready for QA',
      risk: 'MEDIUM',
      changelog: `Artifact ${artifact.name} được đọc từ workflow run ${runId}.`,
      qaNotes: 'Cần tải artifact từ GitHub Actions và kiểm tra mở app / luồng AI Ops / Review Desk.',
      rollbackPlan: 'Nếu artifact lỗi, dùng Rollback Center tạo PR rollback hoặc revert theo PR/commit liên quan.',
      createdAt: now,
      updatedAt: now
    };
    localStorage.setItem('ledgerflow_release_artifacts_v1', JSON.stringify([release, ...releases]));
    const events = readLocal<any[]>('ledgerflow_release_artifact_events_v1', []);
    localStorage.setItem('ledgerflow_release_artifact_events_v1', JSON.stringify([{ id: `release-event-${Date.now()}`, at: now, releaseId: release.id, action: 'ARTIFACT_IMPORTED', detail: `Import artifact ${artifact.name} từ run ${runId}.` }, ...events]));
    window.dispatchEvent(new CustomEvent('ledgerflow-release-artifact-imported', { detail: release }));
  };

  return (
    <section className="rounded-3xl border border-lime-400/35 bg-lime-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-200">Artifact inspector</p>
          <h3 className="mt-1 text-xl font-black text-white">Đọc artifact GitHub Actions</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Chỉ đọc metadata/link artifact để đưa vào Release Center. Không auto deploy, không auto publish.</p>
        </div>
        {result && <button onClick={() => exportJson('ledgerflow-artifact-inspection.json', result)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-lime-300">Xuất JSON</button>}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_0.45fr_auto]">
        <input value={repo} onChange={(event) => setRepo(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="owner/repo" />
        <input value={runId} onChange={(event) => setRunId(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="workflow run id" />
        <button onClick={inspectArtifacts} disabled={loading} className="rounded-2xl bg-lime-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50">{loading ? 'Đang đọc...' : 'Inspect artifacts'}</button>
      </div>
      {error && <p className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm font-bold text-rose-200">{error}</p>}

      <div className="mt-4 grid gap-3">
        {result?.artifacts.map((artifact) => <div key={artifact.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-black text-white">{artifact.name}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">#{artifact.id} · {(artifact.sizeInBytes / 1024 / 1024).toFixed(2)} MB · {artifact.expired ? 'Expired' : 'Available'}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Created: {artifact.createdAt} · Expires: {artifact.expiresAt || 'unknown'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {artifact.archiveDownloadUrl && <a href={artifact.archiveDownloadUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-lime-300">Mở link API</a>}
              <button onClick={() => sendToReleaseCenter(artifact)} className="rounded-2xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Đưa sang Release</button>
            </div>
          </div>
        </div>)}
        {result && result.artifacts.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm font-semibold text-slate-400">Run này chưa có artifact hoặc artifact đã bị xóa/hết hạn.</p>}
      </div>
    </section>
  );
}
