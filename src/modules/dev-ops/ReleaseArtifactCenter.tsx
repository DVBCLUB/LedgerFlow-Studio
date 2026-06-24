import { useEffect, useMemo, useState } from 'react';

type ReleaseStatus = 'Draft' | 'Building' | 'Ready for QA' | 'Released' | 'Failed' | 'Rolled Back';
type ReleaseRisk = 'LOW' | 'MEDIUM' | 'HIGH';

type ReleaseArtifact = {
  id: string;
  version: string;
  title: string;
  repo: string;
  branch: string;
  commitSha: string;
  prNumber?: number | null;
  prUrl?: string | null;
  workflowRunUrl?: string | null;
  artifactName: string;
  artifactUrl?: string | null;
  status: ReleaseStatus;
  risk: ReleaseRisk;
  changelog: string;
  qaNotes: string;
  rollbackPlan: string;
  createdAt: string;
  updatedAt: string;
};

type ReleaseEvent = {
  id: string;
  at: string;
  releaseId: string;
  action: string;
  detail: string;
};

const defaultReleases: ReleaseArtifact[] = [
  {
    id: 'release-demo-001',
    version: '0.1.0-aiops',
    title: 'AI Ops safety foundation',
    repo: 'DVBCLUB/LedgerFlow-Studio',
    branch: 'main',
    commitSha: '',
    prNumber: null,
    prUrl: null,
    workflowRunUrl: null,
    artifactName: 'LedgerFlow-Hub-Windows-Download',
    artifactUrl: null,
    status: 'Draft',
    risk: 'MEDIUM',
    changelog: 'Khởi tạo khu quản lý release/artifact cho các bản build do AI hỗ trợ.',
    qaNotes: 'Chưa QA. Cần kiểm tra mở app, AI Ops Center, Review Desk, Build Monitor.',
    rollbackPlan: 'Nếu lỗi, tạo rollback record và PR revert theo commit/PR liên quan.',
    createdAt: 'Mặc định',
    updatedAt: 'Mặc định'
  }
];

const defaultEvents: ReleaseEvent[] = [
  { id: 'release-event-demo', at: 'Mặc định', releaseId: 'release-demo-001', action: 'RELEASE_CENTER_BOOTSTRAP', detail: 'Khởi tạo Release / Artifact Center.' }
];

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

function statusClass(status: ReleaseStatus) {
  if (status === 'Released') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'Ready for QA') return 'border-cyan-400/35 bg-cyan-400/10 text-cyan-200';
  if (status === 'Building') return 'border-blue-400/35 bg-blue-400/10 text-blue-200';
  if (status === 'Failed' || status === 'Rolled Back') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
}

function riskClass(risk: ReleaseRisk) {
  if (risk === 'HIGH') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
}

function readLatestReviewDesk(): Partial<ReleaseArtifact> | null {
  const raw = localStorage.getItem('ledgerflow_review_desk_last_result_v1');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { result?: { repo?: string; branch?: string; commitSha?: string; pullRequest?: { number?: number; htmlUrl?: string } } };
    const result = parsed.result;
    if (!result) return null;
    return {
      repo: result.repo,
      branch: result.branch,
      commitSha: result.commitSha,
      prNumber: result.pullRequest?.number ?? null,
      prUrl: result.pullRequest?.htmlUrl ?? null
    };
  } catch {
    return null;
  }
}

function readLatestBuildMonitor(): Partial<ReleaseArtifact> | null {
  const records = readLocal<Array<{ repo?: string; branch?: string; status?: string; runUrl?: string; artifactName?: string; artifactUrl?: string; note?: string }>>('ledgerflow_build_monitor_records_v1', []);
  const latest = records[0];
  if (!latest) return null;
  return {
    repo: latest.repo,
    branch: latest.branch,
    workflowRunUrl: latest.runUrl ?? null,
    artifactName: latest.artifactName ?? 'LedgerFlow-Hub-Windows-Download',
    artifactUrl: latest.artifactUrl ?? null,
    status: latest.status === 'Success' ? 'Ready for QA' : latest.status === 'Failed' ? 'Failed' : latest.status === 'Running' ? 'Building' : 'Draft',
    qaNotes: latest.note ?? ''
  };
}

export default function ReleaseArtifactCenter() {
  const [releases, setReleases] = useState<ReleaseArtifact[]>(() => readLocal('ledgerflow_release_artifacts_v1', defaultReleases));
  const [events, setEvents] = useState<ReleaseEvent[]>(() => readLocal('ledgerflow_release_artifact_events_v1', defaultEvents));
  const [selectedId, setSelectedId] = useState(() => releases[0]?.id ?? defaultReleases[0].id);
  const [draft, setDraft] = useState({ version: '', title: '', changelog: '' });

  useEffect(() => {
    localStorage.setItem('ledgerflow_release_artifacts_v1', JSON.stringify(releases));
  }, [releases]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_release_artifact_events_v1', JSON.stringify(events));
  }, [events]);

  const selected = useMemo(() => releases.find((release) => release.id === selectedId) ?? releases[0], [releases, selectedId]);
  const selectedEvents = useMemo(() => events.filter((event) => event.releaseId === selected?.id), [events, selected?.id]);

  const pushEvent = (releaseId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `release-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), releaseId, action, detail }, ...current].slice(0, 150));
  };

  const createRelease = () => {
    if (!draft.version.trim() || !draft.title.trim()) return;
    const latestPr = readLatestReviewDesk();
    const latestBuild = readLatestBuildMonitor();
    const now = new Date().toLocaleString('vi-VN');
    const release: ReleaseArtifact = {
      id: `release-${Date.now()}`,
      version: draft.version.trim(),
      title: draft.title.trim(),
      repo: latestPr?.repo ?? latestBuild?.repo ?? 'DVBCLUB/LedgerFlow-Studio',
      branch: latestPr?.branch ?? latestBuild?.branch ?? 'main',
      commitSha: latestPr?.commitSha ?? '',
      prNumber: latestPr?.prNumber ?? null,
      prUrl: latestPr?.prUrl ?? null,
      workflowRunUrl: latestBuild?.workflowRunUrl ?? null,
      artifactName: latestBuild?.artifactName ?? 'LedgerFlow-Hub-Windows-Download',
      artifactUrl: latestBuild?.artifactUrl ?? null,
      status: latestBuild?.status ?? 'Draft',
      risk: 'MEDIUM',
      changelog: draft.changelog.trim() || 'Chưa có changelog.',
      qaNotes: latestBuild?.qaNotes ?? 'Chưa QA.',
      rollbackPlan: 'Nếu bản này lỗi, tạo rollback record từ release này và đưa qua Founder Review trước khi PR rollback.',
      createdAt: now,
      updatedAt: now
    };
    setReleases((current) => [release, ...current]);
    setSelectedId(release.id);
    pushEvent(release.id, 'RELEASE_CREATED', `Tạo release ${release.version}.`);
    setDraft({ version: '', title: '', changelog: '' });
  };

  const updateSelected = (patch: Partial<ReleaseArtifact>, action: string, detail: string) => {
    if (!selected) return;
    const updatedAt = new Date().toLocaleString('vi-VN');
    setReleases((current) => current.map((release) => release.id === selected.id ? { ...release, ...patch, updatedAt } : release));
    pushEvent(selected.id, action, detail);
  };

  const importLatestBuild = () => {
    const latestPr = readLatestReviewDesk();
    const latestBuild = readLatestBuildMonitor();
    if (!selected || (!latestPr && !latestBuild)) return;
    updateSelected({
      repo: latestPr?.repo ?? latestBuild?.repo ?? selected.repo,
      branch: latestPr?.branch ?? latestBuild?.branch ?? selected.branch,
      commitSha: latestPr?.commitSha ?? selected.commitSha,
      prNumber: latestPr?.prNumber ?? selected.prNumber,
      prUrl: latestPr?.prUrl ?? selected.prUrl,
      workflowRunUrl: latestBuild?.workflowRunUrl ?? selected.workflowRunUrl,
      artifactName: latestBuild?.artifactName ?? selected.artifactName,
      artifactUrl: latestBuild?.artifactUrl ?? selected.artifactUrl,
      status: latestBuild?.status ?? selected.status
    }, 'IMPORT_LATEST_BUILD', 'Đồng bộ release với Review Desk / Build Monitor mới nhất.');
  };

  const sendToRollback = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_rollback_prefill_v1', JSON.stringify({
      sourceReleaseId: selected.id,
      title: `Rollback ${selected.version} - ${selected.title}`,
      repo: selected.repo,
      sourcePrNumber: selected.prNumber,
      sourceBranch: selected.branch,
      sourceCommitSha: selected.commitSha,
      reason: `Rollback release ${selected.version}: ${selected.title}`,
      affectedFiles: '',
      rollbackPlan: selected.rollbackPlan,
      testPlan: selected.qaNotes
    }));
    pushEvent(selected.id, 'SEND_TO_ROLLBACK', 'Đưa release sang Rollback Center.');
    window.dispatchEvent(new CustomEvent('ledgerflow-rollback-prefill'));
  };

  const sendToFounderReview = () => {
    if (!selected) return;
    localStorage.setItem('ledgerflow_founder_review_prefill_v1', JSON.stringify({
      sourceReleaseId: selected.id,
      title: `Release review: ${selected.version} - ${selected.title}`,
      objective: selected.changelog,
      files: `Repo: ${selected.repo}\nBranch: ${selected.branch}\nCommit: ${selected.commitSha}\nArtifact: ${selected.artifactName}`,
      rollbackPlan: selected.rollbackPlan,
      testPlan: selected.qaNotes
    }));
    pushEvent(selected.id, 'SEND_TO_FOUNDER_REVIEW', 'Đưa release sang Founder Review Checklist.');
    window.dispatchEvent(new CustomEvent('ledgerflow-founder-review-prefill'));
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Release / Artifact Center</p>
          <h3 className="mt-1 text-xl font-black text-white">Quản lý bản build và artifact</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Theo dõi version, PR, commit, artifact, QA, rollback plan cho các bản do AI hỗ trợ.</p>
        </div>
        <button onClick={() => exportJson('ledgerflow-release-artifacts.json', { releases, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất release log</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo release record</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Version, ví dụ 0.1.1" value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên release" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <textarea className="min-h-[100px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Changelog" value={draft.changelog} onChange={(event) => setDraft({ ...draft, changelog: event.target.value })} />
            <button onClick={createRelease} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Tạo release</button>
          </div>

          <div className="mt-4 space-y-2">
            {releases.map((release) => <button key={release.id} onClick={() => setSelectedId(release.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === release.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-emerald-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{release.version} · {release.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(release.status)}`}>{release.status}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{release.repo} · {release.branch}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected release</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.version} · {selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.repo} · {selected.branch} · {selected.updatedAt}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>Risk {selected.risk}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-black text-slate-400">Status
              <select className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as ReleaseStatus }, 'RELEASE_STATUS_CHANGED', `Đổi status sang ${event.target.value}.`)}>
                {(['Draft', 'Building', 'Ready for QA', 'Released', 'Failed', 'Rolled Back'] as ReleaseStatus[]).map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-xs font-black text-slate-400">Risk
              <select className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={selected.risk} onChange={(event) => updateSelected({ risk: event.target.value as ReleaseRisk }, 'RELEASE_RISK_CHANGED', `Đổi risk sang ${event.target.value}.`)}>
                {(['LOW', 'MEDIUM', 'HIGH'] as ReleaseRisk[]).map((risk) => <option key={risk}>{risk}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">PR / commit</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">PR: {selected.prNumber ?? 'chưa có'}</p>
              <p className="text-xs font-semibold leading-6 text-slate-300">Commit: {selected.commitSha || 'chưa có'}</p>
              {selected.prUrl && <a href={selected.prUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-xl border border-emerald-400/40 px-3 py-1.5 text-[11px] font-black text-emerald-200">Mở PR</a>}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Artifact</p>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{selected.artifactName}</p>
              {selected.workflowRunUrl && <a href={selected.workflowRunUrl} target="_blank" rel="noreferrer" className="mt-2 mr-2 inline-flex rounded-xl border border-cyan-400/40 px-3 py-1.5 text-[11px] font-black text-cyan-200">Workflow</a>}
              {selected.artifactUrl && <a href={selected.artifactUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-xl border border-emerald-400/40 px-3 py-1.5 text-[11px] font-black text-emerald-200">Tải artifact</a>}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-xs font-black text-slate-400">Changelog
              <textarea className="mt-1 min-h-[92px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.changelog} onChange={(event) => updateSelected({ changelog: event.target.value }, 'CHANGELOG_UPDATED', 'Cập nhật changelog.')} />
            </label>
            <label className="text-xs font-black text-slate-400">QA notes
              <textarea className="mt-1 min-h-[92px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.qaNotes} onChange={(event) => updateSelected({ qaNotes: event.target.value }, 'QA_NOTES_UPDATED', 'Cập nhật QA notes.')} />
            </label>
            <label className="text-xs font-black text-slate-400">Rollback plan
              <textarea className="mt-1 min-h-[92px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.rollbackPlan} onChange={(event) => updateSelected({ rollbackPlan: event.target.value }, 'ROLLBACK_PLAN_UPDATED', 'Cập nhật rollback plan.')} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={importLatestBuild} className="rounded-2xl border border-cyan-400/40 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-400/10">Đồng bộ Build/PR mới nhất</button>
            <button onClick={sendToFounderReview} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Founder Review</button>
            <button onClick={sendToRollback} className="rounded-2xl border border-rose-400/40 px-4 py-2 text-xs font-black text-rose-200 hover:bg-rose-400/10">Tạo rollback plan</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Release events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-emerald-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
