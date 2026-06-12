import { useEffect, useState } from 'react';

type DigestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patchPreview: string | null;
};

type PrDigest = {
  repo: string;
  pullRequest: {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    branch: string;
    base: string;
    draft: boolean;
    mergeable: boolean | null;
    mergeableState: string | null;
    changedFiles: number;
    additions: number;
    deletions: number;
    commits: number;
    headSha: string;
  };
  files: DigestFile[];
  safety: {
    touchesBlockedPath: boolean;
    largeChange: boolean;
    hasDeletes: boolean;
    reviewNotes: string[];
  };
  lastCheckedAt: string;
};

function readLastPr() {
  try {
    const raw = localStorage.getItem('ledgerflow_review_desk_last_result_v1');
    if (!raw) return { repo: 'DVBCLUB/LedgerFlow-Studio', pullNumber: '' };
    const parsed = JSON.parse(raw);
    return {
      repo: parsed.repo || parsed.result?.repo || 'DVBCLUB/LedgerFlow-Studio',
      pullNumber: String(parsed.pullNumber || parsed.result?.pullRequest?.number || '')
    };
  } catch {
    return { repo: 'DVBCLUB/LedgerFlow-Studio', pullNumber: '' };
  }
}

function statusClass(value: string | boolean | null) {
  const text = String(value).toLowerCase();
  if (text.includes('clean') || text.includes('true') || text.includes('open')) return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (text.includes('blocked') || text.includes('dirty') || text.includes('false')) return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-slate-700 bg-slate-950 text-slate-300';
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

export default function PRControlCenter() {
  const initial = readLastPr();
  const [repo, setRepo] = useState(initial.repo);
  const [pullNumber, setPullNumber] = useState(initial.pullNumber);
  const [digest, setDigest] = useState<PrDigest | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = digest?.files.find((file) => file.filename === selectedFile) ?? digest?.files[0];

  useEffect(() => {
    if (digest?.files[0] && !selectedFile) setSelectedFile(digest.files[0].filename);
  }, [digest, selectedFile]);

  const loadDigest = async () => {
    const number = Number(pullNumber);
    if (!repo.trim() || !Number.isFinite(number) || number <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/integrations/github/prs/${number}/digest?repo=${encodeURIComponent(repo.trim())}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Không đọc được PR digest.');
      setDigest(payload.result as PrDigest);
      setSelectedFile(payload.result.files?.[0]?.filename ?? null);
      localStorage.setItem('ledgerflow_pr_control_digest_v1', JSON.stringify(payload.result));
      window.dispatchEvent(new CustomEvent('ledgerflow-pr-control-digest'));
    } catch (err: any) {
      setError(err?.message || 'Không đọc được PR digest.');
    } finally {
      setLoading(false);
    }
  };

  const createFounderReview = () => {
    if (!digest) return;
    localStorage.setItem('ledgerflow_founder_review_prefill_v1', JSON.stringify({
      source: 'PR Control Center',
      title: `Review PR #${digest.pullRequest.number}: ${digest.pullRequest.title}`,
      summary: [
        `Repo: ${digest.repo}`,
        `Branch: ${digest.pullRequest.branch} -> ${digest.pullRequest.base}`,
        `Files: ${digest.pullRequest.changedFiles}`,
        `Additions: ${digest.pullRequest.additions}`,
        `Deletions: ${digest.pullRequest.deletions}`,
        '',
        'Review notes:',
        ...digest.safety.reviewNotes.map((note) => `- ${note}`)
      ].join('\n'),
      files: digest.files.map((file) => file.filename),
      risk: digest.safety.touchesBlockedPath || digest.safety.largeChange || digest.safety.hasDeletes ? 'HIGH' : 'MEDIUM'
    }));
    window.dispatchEvent(new CustomEvent('ledgerflow-founder-review-prefill'));
  };

  const createRollbackRecord = () => {
    if (!digest) return;
    localStorage.setItem('ledgerflow_rollback_prefill_v1', JSON.stringify({
      source: 'PR Control Center',
      repo: digest.repo,
      prNumber: digest.pullRequest.number,
      branch: digest.pullRequest.branch,
      commitSha: digest.pullRequest.headSha,
      reason: `Rollback plan for PR #${digest.pullRequest.number}`,
      affectedFiles: digest.files.map((file) => file.filename),
      rollbackPlan: 'Nếu PR gây lỗi, tạo revert PR từ head SHA hoặc khôi phục các file trong danh sách affectedFiles.',
      testPlan: 'Chạy CI, kiểm tra build artifact, mở app smoke test trước release.'
    }));
    window.dispatchEvent(new CustomEvent('ledgerflow-rollback-prefill'));
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">PR control center</p>
          <h3 className="mt-1 text-xl font-black text-white">Kiểm PR sau khi AI push</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc PR, danh sách file, diff preview và review notes. Không merge/deploy, chỉ giúp bạn kiểm nhanh trước khi quyết định.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadDigest} disabled={loading} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60">{loading ? 'Đang đọc...' : 'Load PR'}</button>
          <button onClick={() => digest && exportJson('ledgerflow-pr-digest.json', digest)} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất digest</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_0.4fr]">
        <input value={repo} onChange={(event) => setRepo(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="DVBCLUB/LedgerFlow-Studio" />
        <input value={pullNumber} onChange={(event) => setPullNumber(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="PR number" />
      </div>
      {error && <p className="mt-3 rounded-2xl border border-rose-400/35 bg-rose-400/10 p-3 text-sm font-bold text-rose-200">{error}</p>}

      {digest && <div className="mt-4 grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Pull request</p>
              <h4 className="mt-1 text-lg font-black text-white">#{digest.pullRequest.number} · {digest.pullRequest.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{digest.pullRequest.branch} → {digest.pullRequest.base}</p>
            </div>
            <a href={digest.pullRequest.htmlUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Mở PR</a>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <span className={`rounded-2xl border p-3 text-xs font-black ${statusClass(digest.pullRequest.state)}`}>State: {digest.pullRequest.state}</span>
            <span className={`rounded-2xl border p-3 text-xs font-black ${statusClass(digest.pullRequest.draft)}`}>Draft: {String(digest.pullRequest.draft)}</span>
            <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-black text-slate-300">Files: {digest.pullRequest.changedFiles}</span>
            <span className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-black text-slate-300">+{digest.pullRequest.additions} / -{digest.pullRequest.deletions}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Review notes</p>
            <div className="mt-2 space-y-2">
              {digest.safety.reviewNotes.map((note, index) => <p key={index} className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-xs font-semibold leading-5 text-slate-300">{note}</p>)}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={createFounderReview} className="rounded-2xl border border-blue-400/40 px-4 py-2 text-xs font-black text-blue-200 hover:bg-blue-400/10">Gửi Founder Review</button>
            <button onClick={createRollbackRecord} className="rounded-2xl border border-amber-400/40 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Tạo Rollback Plan</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-black text-white">Changed files</p>
          <div className="mt-3 grid gap-2 md:grid-cols-[0.75fr_1.25fr]">
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {digest.files.map((file) => <button key={file.filename} onClick={() => setSelectedFile(file.filename)} className={`w-full rounded-2xl border p-3 text-left ${selected?.filename === file.filename ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-800 bg-slate-950 hover:border-emerald-400/40'}`}>
                <p className="text-xs font-black text-white">{file.filename}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">{file.status} · +{file.additions} / -{file.deletions} · {file.changes} changes</p>
              </button>)}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Diff preview</p>
              {selected ? <pre className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{selected.patchPreview || 'Không có patch preview cho file này.'}</pre> : <p className="mt-2 text-sm font-semibold text-slate-500">Chọn file để xem diff.</p>}
            </div>
          </div>
        </div>
      </div>}
    </section>
  );
}
