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
  pullRequest: { number: number; title: string; state: string; htmlUrl: string; branch: string; base: string; draft: boolean };
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

type ReviewFile = { id: string; path: string; content: string; action?: 'create' | 'update' | 'delete'; risk?: string };

type ReviewDeskPrefill = {
  title?: string;
  branchName?: string;
  summary?: string;
  filePath?: string;
  fileContent?: string;
  sourceCardId?: string;
  sourceSessionId?: string;
  sourceApprovalId?: string;
  sourceBundleId?: string;
};

type MultiFilePrefill = ReviewDeskPrefill & {
  files?: Array<Partial<ReviewFile> & { afterContent?: string; beforeContent?: string }>;
  bundleId?: string;
  sourceBundleId?: string;
  totalRisk?: string;
};

type CiFixPackage = {
  id: string;
  sourceCardId: string;
  repo: string;
  branchName: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  workflowRunUrl: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  prompt: string;
};

type BuildRecord = {
  id: string;
  at: string;
  repo: string;
  branch: string;
  source: 'Manual' | 'Review Desk' | 'AI Ops';
  status: 'Unknown' | 'Queued' | 'Running' | 'Success' | 'Failed';
  notes: string;
  runUrl?: string | null;
  artifactName?: string | null;
};

const approvalPhrase = ['APPROVE', 'AI', 'GITHUB', 'PUSH'].join(' ');
const buildMonitorKey = 'ledgerflow_build_monitor_v1';
const singlePrefillKey = 'ledgerflow_review_desk_prefill_v1';
const multiPrefillKey = 'ledgerflow_review_desk_multifile_prefill_v1';

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function makeReviewFile(input: Partial<ReviewFile> & { afterContent?: string; beforeContent?: string }, index: number): ReviewFile {
  const action = input.action || 'update';
  const content = action === 'delete' ? '' : String(input.content ?? input.afterContent ?? input.beforeContent ?? '');
  return {
    id: input.id || `file-${Date.now()}-${index}`,
    path: String(input.path || `docs/AI_REVIEWED_CHANGE_${index + 1}.md`),
    content,
    action,
    risk: input.risk || 'UNKNOWN'
  };
}

function readSinglePrefill(): ReviewDeskPrefill | null {
  return readJson<ReviewDeskPrefill>(singlePrefillKey);
}

function readMultiPrefill(): MultiFilePrefill | null {
  return readJson<MultiFilePrefill>(multiPrefillKey);
}

function readLastResult(): DraftPrResult | null {
  const payload = readJson<{ result?: DraftPrResult }>('ledgerflow_review_desk_last_result_v1');
  return payload?.result ?? null;
}

function readBuildRecords(): BuildRecord[] {
  return readJson<BuildRecord[]>(buildMonitorKey) ?? [];
}

function writeBuildRecord(record: BuildRecord) {
  const current = readBuildRecords();
  const next = [record, ...current.filter((old) => !(old.repo === record.repo && old.branch === record.branch))];
  localStorage.setItem(buildMonitorKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('ledgerflow-build-monitor-record', { detail: record }));
  window.dispatchEvent(new CustomEvent('ledgerflow-build-monitor-sync', { detail: record }));
}

function statusFromRun(run?: GitHubWorkflowRunSummary | null): BuildRecord['status'] {
  if (!run) return 'Queued';
  if (run.status === 'queued') return 'Queued';
  if (run.status !== 'completed') return 'Running';
  return String(run.conclusion || '').toLowerCase() === 'success' ? 'Success' : 'Failed';
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

function writeReviewResult(result: DraftPrResult, sourceCardId?: string, sourceSessionId?: string) {
  const payload = { sourceCardId: sourceCardId || '', sourceSessionId: sourceSessionId || '', result, at: new Date().toLocaleString('vi-VN') };
  localStorage.setItem('ledgerflow_review_desk_last_result_v1', JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('ledgerflow-review-desk-result', { detail: payload }));
}

function runConclusionText(run: GitHubWorkflowRunSummary) {
  if (run.status !== 'completed') return run.status;
  return run.conclusion || 'completed';
}

function isFailedRun(run?: GitHubWorkflowRunSummary | null) {
  if (!run) return false;
  return run.status === 'completed' && !['success', 'skipped', 'neutral'].includes(String(run.conclusion || '').toLowerCase());
}

function writeCiFixPackage(input: { sourceCardId: string; result: DraftPrResult; run: GitHubWorkflowRunSummary }) {
  const pack: CiFixPackage = {
    id: `ci-fix-${Date.now()}`,
    sourceCardId: input.sourceCardId || '',
    repo: input.result.repo,
    branchName: input.result.branchName,
    pullRequestNumber: input.result.pullRequestNumber,
    pullRequestUrl: input.result.pullRequestUrl,
    workflowRunUrl: input.run.htmlUrl,
    workflowName: input.run.name,
    status: input.run.status,
    conclusion: input.run.conclusion,
    createdAt: new Date().toLocaleString('vi-VN'),
    prompt: [
      'Analyze this failed GitHub Actions run for LedgerFlow.',
      `Repository: ${input.result.repo}`,
      `Branch: ${input.result.branchName}`,
      `Pull Request: #${input.result.pullRequestNumber}`,
      `PR URL: ${input.result.pullRequestUrl}`,
      `Workflow: ${input.run.name}`,
      `Run URL: ${input.run.htmlUrl}`,
      `Conclusion: ${input.run.conclusion}`,
      'Return: root cause, likely files to inspect, minimal fix plan, and manual verification checklist.'
    ].join('\n')
  };
  localStorage.setItem('ledgerflow_ci_fix_package_v1', JSON.stringify(pack));
  window.dispatchEvent(new CustomEvent('ledgerflow-ci-fix-package', { detail: pack }));
}

export default function ApprovedPrPanel() {
  const initialSingle = readSinglePrefill();
  const initialMulti = readMultiPrefill();
  const initialFiles = initialMulti?.files?.length
    ? initialMulti.files.map(makeReviewFile)
    : [makeReviewFile({ path: initialSingle?.filePath || 'docs/AI_REVIEWED_CHANGE.md', content: initialSingle?.fileContent || '# Reviewed change\n\nPrepared from LedgerFlow AI Operations Center after founder review.\n' }, 0)];
  const initialMeta = initialMulti || initialSingle || {};

  const [sourceCardId, setSourceCardId] = useState(initialMeta.sourceCardId || '');
  const [sourceSessionId, setSourceSessionId] = useState(initialMeta.sourceSessionId || '');
  const [sourceBundleId, setSourceBundleId] = useState(initialMulti?.sourceBundleId || initialMulti?.bundleId || initialMeta.sourceBundleId || '');
  const [title, setTitle] = useState(initialMeta.title || 'AI update: reviewed LedgerFlow change');
  const [branchName, setBranchName] = useState(initialMeta.branchName || 'ai/reviewed-ledgerflow-change');
  const [summary, setSummary] = useState(initialMeta.summary || 'Reviewed change prepared from LedgerFlow AI Operations Center.');
  const [files, setFiles] = useState<ReviewFile[]>(initialFiles);
  const [selectedFileId, setSelectedFileId] = useState(initialFiles[0]?.id || '');
  const [approval, setApproval] = useState('');
  const [result, setResult] = useState<DraftPrResult | null>(() => readLastResult());
  const [statusSnapshot, setStatusSnapshot] = useState<GitHubStatusSnapshot | null>(null);
  const [ciFixReady, setCiFixReady] = useState(false);
  const [buildSynced, setBuildSynced] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const selectedFile = files.find((file) => file.id === selectedFileId) || files[0];
  const activeBranch = result?.branchName || branchName;
  const latestBranchRun = useMemo(() => statusSnapshot?.latestRuns.find((run) => run.branch === activeBranch), [statusSnapshot, activeBranch]);
  const failedRun = isFailedRun(latestBranchRun);
  const validFiles = files.filter((file) => file.path.trim() && (file.action === 'delete' || file.content.trim()));
  const canSubmit = approval === approvalPhrase && title.trim() && branchName.trim() && validFiles.length > 0;
  const isMultiFile = validFiles.length > 1 || Boolean(sourceBundleId);

  useEffect(() => {
    const applyPrefill = () => {
      const nextMulti = readMultiPrefill();
      const nextSingle = readSinglePrefill();
      const next = nextMulti || nextSingle;
      if (!next) return;
      if (next.sourceCardId) setSourceCardId(next.sourceCardId);
      if (next.sourceSessionId) setSourceSessionId(next.sourceSessionId);
      if (next.title) setTitle(next.title);
      if (next.branchName) setBranchName(next.branchName);
      if (next.summary) setSummary(next.summary);
      if ((next as MultiFilePrefill).sourceBundleId || (next as MultiFilePrefill).bundleId) setSourceBundleId((next as MultiFilePrefill).sourceBundleId || (next as MultiFilePrefill).bundleId || '');
      if (nextMulti?.files?.length) {
        const nextFiles = nextMulti.files.map(makeReviewFile);
        setFiles(nextFiles);
        setSelectedFileId(nextFiles[0]?.id || '');
      } else if (nextSingle?.filePath || nextSingle?.fileContent) {
        const singleFile = makeReviewFile({ path: nextSingle.filePath || 'docs/AI_REVIEWED_CHANGE.md', content: nextSingle.fileContent || '' }, 0);
        setFiles([singleFile]);
        setSelectedFileId(singleFile.id);
      }
    };
    window.addEventListener('storage', applyPrefill);
    window.addEventListener('focus', applyPrefill);
    window.addEventListener('hashchange', applyPrefill);
    window.addEventListener('ledgerflow-review-desk-prefill', applyPrefill as EventListener);
    return () => {
      window.removeEventListener('storage', applyPrefill);
      window.removeEventListener('focus', applyPrefill);
      window.removeEventListener('hashchange', applyPrefill);
      window.removeEventListener('ledgerflow-review-desk-prefill', applyPrefill as EventListener);
    };
  }, []);

  function updateFile(id: string, patch: Partial<ReviewFile>) {
    setFiles((current) => current.map((file) => file.id === id ? { ...file, ...patch } : file));
  }

  function addFile() {
    const next = makeReviewFile({ path: 'docs/AI_REVIEWED_CHANGE.md', content: '# Reviewed change\n' }, files.length);
    setFiles((current) => [...current, next]);
    setSelectedFileId(next.id);
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const next = current.length > 1 ? current.filter((file) => file.id !== id) : current;
      if (selectedFileId === id) setSelectedFileId(next[0]?.id || '');
      return next;
    });
  }

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setResult(null);
    setStatusSnapshot(null);
    setCiFixReady(false);
    setBuildSynced(false);
    try {
      const changedFiles = validFiles.map((file) => file.path);
      const enrichedSummary = [
        summary,
        isMultiFile ? `\nMulti-file bundle: ${sourceBundleId || 'manual'}\nFiles:\n${validFiles.map((file) => `- ${file.action || 'update'} ${file.path}`).join('\n')}` : ''
      ].filter(Boolean).join('\n');
      const response = await fetch('/api/integrations/github/approved-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: enrichedSummary,
          branchName,
          approvalPhrase: approval,
          files: validFiles.map((file) => ({ path: file.path, content: file.action === 'delete' ? '' : file.content }))
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) throw new Error(data?.error || `Request failed: ${response.status}`);
      const nextResult = normalizeDraftResult(data.result, changedFiles);
      setResult(nextResult);
      writeReviewResult(nextResult, sourceCardId, sourceSessionId);
      localStorage.setItem('ledgerflow_review_desk_last_multifile_v1', JSON.stringify({ sourceBundleId, files: validFiles, result: nextResult, at: new Date().toLocaleString('vi-VN') }));
      writeBuildRecord({
        id: `build-${Date.now()}`,
        at: new Date().toLocaleString('vi-VN'),
        repo: nextResult.repo,
        branch: nextResult.branchName,
        source: 'Review Desk',
        status: 'Queued',
        notes: `Draft PR #${nextResult.pullRequestNumber} created from Review Desk with ${changedFiles.length} file(s). Waiting for GitHub Actions.`,
        runUrl: null,
        artifactName: 'LedgerFlow-Hub-Windows-Download'
      });
      setBuildSynced(true);
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
    setCiFixReady(false);
    try {
      const params = new URLSearchParams({ repo: target.repo });
      const response = await fetch(`/api/integrations/github/summary?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) throw new Error(data?.error || `Status check failed: ${response.status}`);
      const summaryPayload = data.summary;
      const runs = Array.isArray(summaryPayload?.latestRuns) ? summaryPayload.latestRuns as GitHubWorkflowRunSummary[] : [];
      const openPr = Array.isArray(summaryPayload?.openPullRequests) ? summaryPayload.openPullRequests.find((item: any) => Number(item.number) === target.pullRequestNumber) : null;
      const branchRuns = runs.filter((run) => run.branch === target.branchName);
      const snapshot: GitHubStatusSnapshot = { checkedAt: new Date().toLocaleString('vi-VN'), latestRuns: branchRuns, openPullRequestUrl: openPr?.htmlUrl || target.pullRequestUrl, openPullRequestState: openPr?.state || 'unknown' };
      setStatusSnapshot(snapshot);
      localStorage.setItem('ledgerflow_review_desk_last_status_v1', JSON.stringify(snapshot));
      const latest = branchRuns[0];
      writeBuildRecord({
        id: `build-${Date.now()}`,
        at: new Date().toLocaleString('vi-VN'),
        repo: target.repo,
        branch: target.branchName,
        source: 'Review Desk',
        status: statusFromRun(latest),
        notes: latest ? `Workflow ${latest.name}: ${runConclusionText(latest)}. PR #${target.pullRequestNumber}.` : `No workflow run found yet for PR #${target.pullRequestNumber}. Check again later.`,
        runUrl: latest?.htmlUrl || null,
        artifactName: 'LedgerFlow-Hub-Windows-Download'
      });
      setBuildSynced(true);
      if (isFailedRun(latest)) {
        writeCiFixPackage({ sourceCardId, result: target, run: latest });
        setCiFixReady(true);
      }
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
          <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Tạo nhánh ai/*, commit một hoặc nhiều file và mở Draft PR sau khi founder nhập câu phê duyệt. Token chỉ dùng ở backend.</p>
        </div>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">Founder approval required</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          {(sourceCardId || sourceSessionId || sourceBundleId) && <p className="rounded-2xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200">Nguồn: {sourceBundleId || sourceSessionId || sourceCardId}</p>}
          <label className="text-xs font-black text-slate-400">PR title<input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">Branch<input className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={branchName} onChange={(event) => setBranchName(event.target.value)} /></label>
          <label className="text-xs font-black text-slate-400">Summary<textarea className="mt-1 min-h-[96px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={summary} onChange={(event) => setSummary(event.target.value)} /></label>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-white">Files for PR</p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">{validFiles.length} valid file(s) · {isMultiFile ? 'multi-file mode' : 'single-file mode'}</p>
              </div>
              <button onClick={addFile} className="rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] font-black text-emerald-200 hover:bg-emerald-400/10">Thêm file</button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file) => <button key={file.id} onClick={() => setSelectedFileId(file.id)} className={`rounded-full border px-3 py-1 text-[11px] font-black ${selectedFile?.id === file.id ? 'border-emerald-300 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-300 hover:border-emerald-300'}`}>{file.path || 'untitled'}</button>)}
            </div>
            {selectedFile && <div className="grid gap-2">
              <div className="grid gap-2 md:grid-cols-[1fr_130px]">
                <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={selectedFile.path} onChange={(event) => updateFile(selectedFile.id, { path: event.target.value })} placeholder="src/example.tsx" />
                <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={selectedFile.action || 'update'} onChange={(event) => updateFile(selectedFile.id, { action: event.target.value as ReviewFile['action'] })}>
                  <option value="create">create</option>
                  <option value="update">update</option>
                  <option value="delete">delete</option>
                </select>
              </div>
              <textarea className="min-h-[220px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-white" value={selectedFile.content} onChange={(event) => updateFile(selectedFile.id, { content: event.target.value })} placeholder="File content" disabled={selectedFile.action === 'delete'} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-500">Risk: {selectedFile.risk || 'UNKNOWN'}</p>
                <button onClick={() => removeFile(selectedFile.id)} className="rounded-full border border-rose-400/40 px-3 py-1 text-[11px] font-black text-rose-200 hover:bg-rose-400/10">Xóa file</button>
              </div>
            </div>}
          </div>
        </div>
        <div>
          <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval phrase</p>
            <p className="mt-2 select-all font-mono text-xs font-black text-amber-200">{approvalPhrase}</p>
            <input className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white" value={approval} onChange={(event) => setApproval(event.target.value)} placeholder="Paste approval phrase" />
          </div>
          <button disabled={!canSubmit || busy} onClick={submit} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Creating draft PR...' : `Create branch + Draft PR (${validFiles.length} file${validFiles.length === 1 ? '' : 's'})`}</button>
          {error && <p className="mt-3 rounded-2xl border border-rose-400/35 bg-rose-400/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
          {buildSynced && <p className="mt-3 rounded-2xl border border-cyan-400/35 bg-cyan-400/10 p-3 text-xs font-bold text-cyan-200">Đã đồng bộ sang Build Monitor.</p>}
          {result && <div className="mt-3 rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-3 text-xs font-semibold leading-5 text-slate-200">
            <p className="font-black text-emerald-200">Draft PR #{result.pullRequestNumber || '?'}</p>
            <p>{result.repo}</p><p>{result.branchName}</p>
            {result.commitSha && <p>{result.commitSha.slice(0, 12)}</p>}
            <p className="mt-2 text-slate-300">Changed files: {result.changedFiles.join(', ')}</p>
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
              {failedRun && <p className="mt-2 rounded-xl border border-orange-400/35 bg-orange-400/10 p-2 text-orange-200">Workflow failed. CI fix package đã được tạo để AI Ops/CI Doctor xử lý tiếp.</p>}
            </div> : <p className="mt-2 text-slate-400">Chưa thấy workflow run cho branch này trong latest runs. Đợi Actions vài phút rồi bấm lại.</p>}
            {ciFixReady && <button onClick={() => { window.location.hash = '#/ci_doctor'; }} className="mt-3 rounded-full border border-orange-400/40 px-3 py-1 text-[11px] font-black text-orange-200 hover:bg-orange-400/10">Open CI Doctor</button>}
          </div>}
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-black text-white">Kiểm soát</p>
            <ul className="mt-2 space-y-2 text-xs font-semibold text-slate-400">
              <li>✓ Chỉ nhánh ai/*</li><li>✓ Không merge tự động</li><li>✓ CI kiểm tra trước khi merge</li><li>✓ Founder duyệt cuối cùng</li><li>✓ Hỗ trợ multi-file từ Diff Review</li><li>✓ Nếu CI đỏ, tạo gói lỗi cho CI Doctor</li><li>✓ Build Monitor tự nhận trạng thái PR/CI</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
