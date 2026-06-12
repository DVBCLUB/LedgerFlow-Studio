import { useEffect, useMemo, useState } from 'react';

type DraftPrResult = {
  repo: string;
  branchName: string;
  commitSha?: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  changedFiles: string[];
};

type BackendApprovedChangeResult = {
  repo: string;
  branch: string;
  base: string;
  commitMessages: string[];
  pullRequest: {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    branch: string;
    base: string;
    draft: boolean;
  };
};

type GitHubWorkflowRunSummary = {
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

type GitHubStatusSnapshot = {
  checkedAt: string;
  latestRuns: GitHubWorkflowRunSummary[];
  openPullRequestUrl?: string;
  openPullRequestState?: string;
  error?: string;
};

type ReviewDeskPrefill = {
  title?: string;
  branchName?: string;
  summary?: string;
  filePath?: string;
  fileContent?: string;
  sourceCardId?: string;
};

const approvalPhrase = ['APPROVE', 'AI', 'GITHUB', 'PUSH'].join(' ');

function readPrefill(): ReviewDeskPrefill | null {
  try {
    const raw = localStorage.getItem('ledgerflow_review_desk_prefill_v1');
    return raw ? JSON.parse(raw) as ReviewDeskPrefill : null;
  } catch {
    return null;
  }
}

function readLastResult(): DraftPrResult | null {
  try {
    const raw = localStorage.getItem('ledgerflow_review_desk_last_result_v1');
    const payload = raw ? JSON.parse(raw) : null;
    return payload?.result ?? null;
  } catch {
    return null;
  }
}

function normalizeDraftResult(input: unknown, fallbackFiles: string[]): DraftPrResult {
  const value = input as Partial<DraftPrResult> & Partial<BackendApprovedChangeResult>;
  if (typeof value.pullRequestNumber === 'number') {
    return {
      repo: String(value.repo || 'DVBCLUB/LedgerFlow-Studio'),
      branchName: String(value.branchName || ''),
      commitSha: value.commitSha ? String(value.commitSha) : undefined,
      pullRequestNumber: value.pullRequestNumber,
      pullRequestUrl: String(value.pullRequestUrl || ''),
      changedFiles: Array.isArray(value.changedFiles) ? value.changedFiles.map(String) : fallbackFiles
    };
  }

  const backend = value as BackendApprovedChangeResult;
  return {
    repo: String(backend.repo || 'DVBCLUB/LedgerFlow-Studio'),
    branchName: String(backend.branch || backend.pullRequest?.branch || ''),
    commitSha: undefined,
    pullRequestNumber: Number(backend.pullRequest?.number || 0),
    pullRequestUrl: String(backend.pullRequest?.htmlUrl || ''),
    changedFiles: fallbackFiles
  };
}

function writeReviewResult(result: DraftPrResult, sourceCardId?: string) {
  const payload = {
    sourceCardId: sourceCardId || '',
    result,
    at: new Date().toLocaleString('vi-VN')
  };
  localStorage.setItem('ledgerflow_review_desk_last_result_v1', JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-result', { detail: payload }));
}

function runConclusionText(run: GitHubWorkflowRunSummary) {
  if (run.status !== 'completed') return run.status;
  return run.conclusion || 'completed';
}

export default function ApprovedPrPanel() {
  const prefill = readPrefill();
  const [sourceCardId, setSourceCardId] = useState(prefill?.sourceCardId || '');
  const [title, setTitle] = useState(prefill?.title || 'AI update: reviewed LedgerFlow change');
  const [branchName, setBranchName] = useState(prefill?.branchName || 'ai/reviewed-ledgerflow-change');
  const [summary, setSummary] = useState(prefill?.summary || 'Reviewed change prepared from LedgerFlow AI Operations Center.');
  const [filePath, setFilePath] = useState(prefill?.filePath || 'docs/AI_REVIEWED_CHANGE.md');
  const [fileContent, setFileContent] = useState(prefill?.fileContent || '# Reviewed change\n\nPrepared from LedgerFlow AI Operations Center after founder review.\n');
  const [approval, setApproval] = useState('');
  const [result, setResult] = useState<DraftPrResult | null>(() => readLastResult());
  const [statusSnapshot, setStatusSnapshot] = useState<GitHubStatusSnapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const applyPrefill = () => {
      const next = readPrefill();
      if (!next) return;
      if (next.sourceCardId) setSourceCardId(next.sourceCardId);
      if (next.title) setTitle(next.title);
      if (next.branchName) setBranchName(next.branchName);
      if (next.summary) setSummary(next.summary);
      if (next.filePath) setFilePath(next.filePath);
      if (next.fileContent) setFileContent(next.fileContent);
    };
    const onStorage = () => applyPrefill();
    const onFocus = () => applyPrefill();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    window.addEventListener('hashchange', applyPrefill);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('hashchange', applyPrefill);
    };
  }, []);

  const canSubmit = approval === approvalPhrase && title.trim() && filePath.trim() && fileContent.trim();
  const activeBranch = result?.branchName || branchName;
  const latestBranchRun = useMemo(() => statusSnapshot?.latestRuns.find((run) => run.branch === activeBranch), [statusSnapshot, activeBranch]);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setResult(null);
    setStatusSnapshot(null);
    try {
      const response = await fetch('/api/integrations/github/approved-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          branchName,
          approvalPhrase: approval,
          files: [{ path: filePath, content: fileContent }]
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || `Request failed: ${response.status}`);
      }
      const nextResult = normalizeDraftResult(data.result, [filePath]);
      setResult(nextResult);
      writeReviewResult(nextResult, sourceCardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot create draft PR.');
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    const target = result;
    if (!target) return;
    setChecking(true);
    setError('');
    try {
      const params = new URLSearchParams({ repo: target.repo });
      const response = await fetch(`/api/integrations/github/summary?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || `Status check failed: ${response.status}`);
      }
      const summary = data.summary;
      const runs = Array.isArray(summary?.latestRuns) ? summary.latestRuns as GitHubWorkflowRunSummary[] : [];
      const openPr = Array.isArray(summary?.openPullRequests)
        ? summary.openPullRequests.find((item: any) => Number(item.number) === target.pullRequestNumber)
        : null;
      const snapshot: GitHubStatusSnapshot = {
        checkedAt: new Date().toLocaleString('vi-VN'),
        latestRuns: runs.filter((run) => run.branch === target.branchName),
        openPullRequestUrl: openPr?.htmlUrl || target.pullRequestUrl,
        openPullRequestState: openPr?.state || 'unknown'
      };
      setStatusSnapshot(snapshot);
      localStorage.setItem('ledgerflow_review_desk_last_status_v1', JSON.stringify(snapshot));
    } catch (err) {
      const snapshot: GitHubStatusSnapshot = { checkedAt: new Date().toLocaleString('vi-VN'), latestRuns: [], error: err instanceof Error ? err.message : 'Cannot check PR status.' };
      setStatusSnapshot(snapshot);
      setError(snapshot.error || 'Cannot check PR status.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">AI tạo nhánh + Draft PR</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Tạo nhánh ai/*, commit file và mở Draft PR sau khi founder nhập câu phê duyệt. Token chỉ dùng ở backend.</p>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">Founder approval required</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          {sourceCardId && <p className="rounded-2xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200">Nguồn từ Workboard: {sourceCardId}</p>}
          <label className="text-xs font-black text-slate-400">PR title<input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">Branch<input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={branchName} onChange={(event) => setBranchName(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">Summary<textarea className="mt-1 min-h-[96px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={summary} onChange={(event) => setSummary(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">File path<input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={filePath} onChange={(event) => setFilePath(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">File content<textarea className="mt-1 min-h-[220px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" value={fileContent} onChange={(event) => setFileContent(event.target.value)} /></label>
        </div>
        <div>
          <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval phrase</p>
            <p className="mt-2 select-all font-mono text-xs font-black text-amber-200">{approvalPhrase}</p>
            <input className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={approval} onChange={(event) => setApproval(event.target.value)} placeholder="Paste approval phrase" />
          </div>
          <button disabled={!canSubmit || busy} onClick={submit} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Creating draft PR...' : 'Create branch + Draft PR'}</button>
          {error && <p className="mt-3 rounded-2xl border border-rose-400/35 bg-rose-400/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
          {result && <div className="mt-3 rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-3 text-xs font-semibold leading-5 text-slate-200">
            <p className="font-black text-emerald-200">Draft PR #{result.pullRequestNumber || '?'}</p>
            <p>{result.repo}</p>
            <p>{result.branchName}</p>
            {result.commitSha && <p>{result.commitSha.slice(0, 12)}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {result.pullRequestUrl && <a className="inline-block font-black text-cyan-200 underline" href={result.pullRequestUrl} target="_blank" rel="noreferrer">Open Pull Request</a>}
              <button onClick={checkStatus} disabled={checking} className="rounded-full border border-cyan-400/40 px-3 py-1 text-[11px] font-black text-cyan-200 disabled:opacity-50">{checking ? 'Checking...' : 'Check PR/CI'}</button>
            </div>
          </div>}
          {statusSnapshot && <div className="mt-3 rounded-2xl border border-cyan-400/35 bg-cyan-400/10 p-3 text-xs font-semibold leading-5 text-slate-200">
            <p className="font-black text-cyan-200">PR / CI status</p>
            <p>Checked: {statusSnapshot.checkedAt}</p>
            <p>PR state: {statusSnapshot.openPullRequestState || 'unknown'}</p>
            {latestBranchRun ? <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2">
              <p className="font-black text-white">{latestBranchRun.name}</p>
              <p>{runConclusionText(latestBranchRun)}</p>
              <a className="font-black text-cyan-200 underline" href={latestBranchRun.htmlUrl} target="_blank" rel="noreferrer">Open workflow run</a>
            </div> : <p className="mt-2 text-slate-400">Chưa thấy workflow run cho branch này trong latest runs. Đợi Actions vài phút rồi bấm lại.</p>}
          </div>}
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-black text-white">Kiểm soát</p>
            <ul className="mt-2 space-y-2 text-xs font-semibold text-slate-400">
              <li>✓ Chỉ nhánh ai/*</li>
              <li>✓ Không merge tự động</li>
              <li>✓ CI kiểm tra trước khi merge</li>
              <li>✓ Founder duyệt cuối cùng</li>
              <li>✓ Kết quả PR ghi ngược về audit local</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
