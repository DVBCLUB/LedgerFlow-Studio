import { useState } from 'react';

type DraftPrResult = {
  repo: string;
  branchName: string;
  commitSha: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  changedFiles: string[];
};

const approvalPhrase = ['APPROVE', 'AI', 'GITHUB', 'PUSH'].join(' ');

export default function ApprovedPrPanel() {
  const [title, setTitle] = useState('AI update: reviewed LedgerFlow change');
  const [branchName, setBranchName] = useState('ai/reviewed-ledgerflow-change');
  const [summary, setSummary] = useState('Reviewed change prepared from LedgerFlow AI Operations Center.');
  const [filePath, setFilePath] = useState('docs/AI_REVIEWED_CHANGE.md');
  const [fileContent, setFileContent] = useState('# Reviewed change\n\nPrepared from LedgerFlow AI Operations Center after founder review.\n');
  const [approval, setApproval] = useState('');
  const [result, setResult] = useState<DraftPrResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = approval === approvalPhrase && title.trim() && filePath.trim() && fileContent.trim();

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setResult(null);
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
      setResult(data.result as DraftPrResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot create draft PR.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <p className="text-sm font-black text-white">AI tạo branch + Draft PR</p>
      <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Tạo nhánh ai/*, commit file và mở Draft PR sau khi founder nhập câu phê duyệt.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="grid gap-3">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={branchName} onChange={(event) => setBranchName(event.target.value)} />
          <textarea className="min-h-[72px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={summary} onChange={(event) => setSummary(event.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={filePath} onChange={(event) => setFilePath(event.target.value)} />
          <textarea className="min-h-[190px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white" value={fileContent} onChange={(event) => setFileContent(event.target.value)} />
        </div>
        <div>
          <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval phrase</p>
            <p className="mt-2 select-all font-mono text-xs font-black text-amber-200">{approvalPhrase}</p>
            <input className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={approval} onChange={(event) => setApproval(event.target.value)} placeholder="Paste approval phrase" />
          </div>
          <button disabled={!canSubmit || busy} onClick={submit} className="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Creating draft PR...' : 'Create branch + Draft PR'}</button>
          {error && <p className="mt-3 rounded-2xl border border-rose-400/35 bg-rose-400/10 p-3 text-xs font-bold text-rose-200">{error}</p>}
          {result && <div className="mt-3 rounded-2xl border border-emerald-400/35 bg-emerald-400/10 p-3 text-xs font-semibold leading-5 text-slate-200"><p className="font-black text-emerald-200">Draft PR #{result.pullRequestNumber}</p><p>{result.repo}</p><p>{result.branchName}</p><p>{result.commitSha.slice(0, 12)}</p><a className="mt-2 inline-block font-black text-cyan-200 underline" href={result.pullRequestUrl} target="_blank" rel="noreferrer">Open Pull Request</a></div>}
        </div>
      </div>
    </section>
  );
}
