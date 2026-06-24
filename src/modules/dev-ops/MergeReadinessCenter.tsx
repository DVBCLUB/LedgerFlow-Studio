import { useEffect, useMemo, useState } from 'react';

type CheckState = 'Pass' | 'Warn' | 'Fail' | 'Unknown';

type ReadinessCheck = {
  id: string;
  title: string;
  state: CheckState;
  detail: string;
};

type ReadinessSnapshot = {
  id: string;
  at: string;
  repo?: string;
  prNumber?: number | null;
  branch?: string;
  verdict: 'Ready for manual merge' | 'Needs review' | 'Blocked';
  checks: ReadinessCheck[];
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
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

function badge(state: CheckState) {
  if (state === 'Pass') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (state === 'Warn') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  if (state === 'Fail') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
}

export default function MergeReadinessCenter() {
  const [tick, setTick] = useState(0);
  const [snapshots, setSnapshots] = useState<ReadinessSnapshot[]>(() => readLocal('ledgerflow_merge_readiness_snapshots_v1', []));

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 2500);
    const onSync = () => setTick((value) => value + 1);
    window.addEventListener('ledgerflow-review-desk-result', onSync);
    window.addEventListener('ledgerflow-pr-digest-synced', onSync);
    window.addEventListener('ledgerflow-build-monitor-sync', onSync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('ledgerflow-review-desk-result', onSync);
      window.removeEventListener('ledgerflow-pr-digest-synced', onSync);
      window.removeEventListener('ledgerflow-build-monitor-sync', onSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ledgerflow_merge_readiness_snapshots_v1', JSON.stringify(snapshots));
  }, [snapshots]);

  const context = useMemo(() => {
    const prDigest = readLocal<any>('ledgerflow_pr_digest_last_v1', null);
    const reviewResult = readLocal<any>('ledgerflow_review_desk_last_result_v1', null);
    const secretReport = readLocal<any>('ledgerflow_secret_exposure_report_v1', null);
    const buildRecords = asArray<any>(readLocal('ledgerflow_build_monitor_v1', []));
    const releases = asArray<any>(readLocal('ledgerflow_release_artifacts_v1', []));
    const founderReviews = asArray<any>(readLocal('ledgerflow_founder_review_items_v1', []));
    const digest = prDigest?.digest ?? prDigest;
    const prNumber = digest?.pullRequest?.number ?? digest?.prNumber ?? reviewResult?.pullRequest?.number ?? reviewResult?.prNumber ?? null;
    const branch = digest?.pullRequest?.headRef ?? digest?.branch ?? reviewResult?.branch ?? reviewResult?.branchName ?? '';
    const repo = digest?.repo ?? reviewResult?.repo ?? 'DVBCLUB/LedgerFlow-Studio';
    const relatedBuild = buildRecords.find((item) => item.branch === branch || item.prNumber === prNumber) ?? buildRecords[0];
    const relatedRelease = releases.find((item) => item.branch === branch || item.prNumber === prNumber) ?? releases[0];
    const relatedFounderReview = founderReviews.find((item) => item.prNumber === prNumber || item.branch === branch) ?? founderReviews[0];
    return { prDigest, digest, reviewResult, secretReport, relatedBuild, relatedRelease, relatedFounderReview, repo, prNumber, branch, tick };
  }, [tick]);

  const checks = useMemo<ReadinessCheck[]>(() => {
    const fileCount = context.digest?.files?.length ?? context.digest?.changedFiles ?? 0;
    const isDraft = Boolean(context.digest?.pullRequest?.draft ?? context.digest?.draft ?? true);
    const secretStatus = context.secretReport?.status ?? context.secretReport?.verdict ?? 'Unknown';
    const buildStatus = context.relatedBuild?.status ?? 'Unknown';
    const releaseStatus = context.relatedRelease?.status ?? 'Unknown';
    const hasRollback = Boolean(context.relatedRelease?.rollbackPlan || context.relatedFounderReview?.rollbackPlan || context.reviewResult?.rollbackPlan);
    return [
      {
        id: 'pr',
        title: 'PR digest',
        state: context.prNumber ? 'Pass' : 'Unknown',
        detail: context.prNumber ? `PR #${context.prNumber} · ${context.branch || 'unknown branch'} · ${fileCount || '?'} file(s)` : 'Chưa có PR digest gần nhất.'
      },
      {
        id: 'draft',
        title: 'Draft PR safety',
        state: isDraft ? 'Pass' : 'Warn',
        detail: isDraft ? 'PR đang ở draft/review-safe mode.' : 'PR có thể đã ready for review; kiểm tra trước khi merge.'
      },
      {
        id: 'secret',
        title: 'Secret exposure guard',
        state: String(secretStatus).toLowerCase().includes('block') ? 'Fail' : String(secretStatus).toLowerCase().includes('warn') ? 'Warn' : secretStatus === 'Unknown' ? 'Unknown' : 'Pass',
        detail: secretStatus === 'Unknown' ? 'Chưa có secret report gần nhất.' : `Secret report: ${secretStatus}`
      },
      {
        id: 'build',
        title: 'Build / CI status',
        state: String(buildStatus).toLowerCase().includes('success') || String(buildStatus).toLowerCase().includes('ready') ? 'Pass' : String(buildStatus).toLowerCase().includes('fail') ? 'Fail' : 'Warn',
        detail: `Build Monitor: ${buildStatus}`
      },
      {
        id: 'release',
        title: 'Release draft',
        state: releaseStatus === 'Ready for QA' || releaseStatus === 'Released' ? 'Pass' : releaseStatus === 'Failed' || releaseStatus === 'Rolled Back' ? 'Fail' : 'Warn',
        detail: `Release Center: ${releaseStatus}`
      },
      {
        id: 'rollback',
        title: 'Rollback plan',
        state: hasRollback ? 'Pass' : 'Warn',
        detail: hasRollback ? 'Có rollback plan/draft.' : 'Chưa thấy rollback plan rõ ràng.'
      }
    ];
  }, [context]);

  const verdict = useMemo<ReadinessSnapshot['verdict']>(() => {
    if (checks.some((check) => check.state === 'Fail')) return 'Blocked';
    if (checks.some((check) => check.state === 'Warn' || check.state === 'Unknown')) return 'Needs review';
    return 'Ready for manual merge';
  }, [checks]);

  const saveSnapshot = () => {
    const snapshot: ReadinessSnapshot = {
      id: `ready-${Date.now()}`,
      at: new Date().toLocaleString('vi-VN'),
      repo: context.repo,
      prNumber: context.prNumber,
      branch: context.branch,
      verdict,
      checks
    };
    setSnapshots((current) => [snapshot, ...current].slice(0, 50));
    window.dispatchEvent(new CustomEvent('ledgerflow-merge-readiness-saved', { detail: snapshot }));
  };

  const sendToFounderReview = () => {
    localStorage.setItem('ledgerflow_founder_review_prefill_v1', JSON.stringify({
      source: 'MergeReadinessCenter',
      repo: context.repo,
      prNumber: context.prNumber,
      branch: context.branch,
      summary: `Merge readiness verdict: ${verdict}`,
      checks,
      createdAt: new Date().toISOString()
    }));
    window.location.hash = '#/ai_ops';
    window.dispatchEvent(new CustomEvent('ledgerflow-founder-review-prefill'));
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Merge readiness</p>
          <h3 className="mt-1 text-xl font-black text-white">Manual Merge Readiness Center</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Gom PR digest, CI, secret report, release draft và rollback plan. Không auto merge/deploy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveSnapshot} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Lưu snapshot</button>
          <button onClick={sendToFounderReview} className="rounded-2xl border border-blue-400/40 px-4 py-2 text-xs font-black text-blue-200 hover:bg-blue-400/10">Founder Review</button>
          <button onClick={() => exportJson('ledgerflow-merge-readiness.json', { context, checks, verdict, snapshots })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất JSON</button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/65 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current PR</p>
            <h4 className="mt-1 text-lg font-black text-white">PR #{context.prNumber ?? '?'} · {context.branch || 'unknown branch'}</h4>
            <p className="mt-1 text-xs font-bold text-slate-400">{context.repo}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${verdict === 'Blocked' ? 'border-rose-400/35 bg-rose-400/10 text-rose-200' : verdict === 'Needs review' ? 'border-amber-400/35 bg-amber-400/10 text-amber-200' : 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200'}`}>{verdict}</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => <div key={check.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-white">{check.title}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${badge(check.state)}`}>{check.state}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{check.detail}</p>
          </div>)}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-white">Readiness snapshots</p>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-400">{snapshots.length} saved</span>
        </div>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
          {snapshots.map((snapshot) => <div key={snapshot.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black text-white">PR #{snapshot.prNumber ?? '?'} · {snapshot.branch ?? 'unknown branch'}</p>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{snapshot.verdict}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{snapshot.at}</p>
          </div>)}
          {snapshots.length === 0 && <p className="text-sm font-semibold text-slate-500">Chưa lưu snapshot readiness nào.</p>}
        </div>
      </div>
    </section>
  );
}
