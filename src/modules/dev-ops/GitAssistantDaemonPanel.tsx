import { useEffect, useState } from 'react';
import { AlertTriangle, Clipboard, FileDiff, GitBranch, RefreshCw } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type GitStatus = { staged?: string[]; modified?: string[]; untracked?: string[]; deleted?: string[] } & Record<string, unknown>;
type GitDiff = { filesChanged?: number; summary?: string; diff?: string } & Record<string, unknown>;

function asStatus(value: unknown): GitStatus {
  if (value && typeof value === 'object' && (value as any).status) return (value as any).status as GitStatus;
  return (value || {}) as GitStatus;
}

function asDiff(value: unknown): GitDiff {
  if (value && typeof value === 'object' && (value as any).diff) return (value as any).diff as GitDiff;
  return (value || {}) as GitDiff;
}

function countList(value: unknown): number { return Array.isArray(value) ? value.length : 0; }

export default function GitAssistantDaemonPanel() {
  const [status, setStatus] = useState<GitStatus>({});
  const [diff, setDiff] = useState<GitDiff>({});
  const [commitMsg, setCommitMsg] = useState('');
  const [prDesc, setPrDesc] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const [s, d] = await Promise.all([
        daemonFetch<unknown>('/api/git/status', undefined, 10000),
        daemonFetch<unknown>('/api/git/diff', undefined, 10000),
      ]);
      setStatus(asStatus(s));
      setDiff(asDiff(d));
    } catch (err: any) { setError(err?.message || 'Cannot read Git status from daemon.'); }
    finally { setBusy(false); }
  };

  const generateCommit = async () => {
    setBusy(true); setError('');
    try {
      const data = await daemonFetch<any>('/api/git/commit-msg', undefined, 30000);
      setCommitMsg(String(data?.message || data?.commitMessage || ''));
      setMessage('Generated commit message.');
    } catch (err: any) { setError(err?.message || 'Cannot generate commit message.'); }
    finally { setBusy(false); }
  };

  const generatePr = async () => {
    setBusy(true); setError('');
    try {
      const data = await daemonFetch<any>('/api/git/pr-desc?base=main', undefined, 30000);
      setPrDesc(typeof data?.pr === 'string' ? data.pr : JSON.stringify(data?.pr || data, null, 2));
      setMessage('Generated PR description.');
    } catch (err: any) { setError(err?.message || 'Cannot generate PR description.'); }
    finally { setBusy(false); }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard.');
  };

  const changed = countList(status.staged) + countList(status.modified) + countList(status.untracked) + countList(status.deleted);

  useEffect(() => { void load(); }, []);

  return <section className="space-y-5 rounded-3xl border border-emerald-400/25 bg-emerald-400/5 p-5 text-slate-100">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200"><GitBranch className="mr-2 inline h-3.5 w-3.5" />Daemon Git Assistant</p><h3 className="mt-1 text-xl font-black text-white">Git status, diff and handoff text</h3><p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Read-only Git assistant powered by assistant daemon routes.</p></div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />{busy ? 'Loading...' : 'Refresh'}</button>
    </div>
    {error && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
    {message && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm font-bold text-cyan-100">{message}</div>}
    <div className="grid gap-3 md:grid-cols-4"><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Changed</p><p className="mt-2 text-2xl font-black text-emerald-300">{changed}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Modified</p><p className="mt-2 text-2xl font-black text-cyan-300">{countList(status.modified)}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Untracked</p><p className="mt-2 text-2xl font-black text-amber-300">{countList(status.untracked)}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Deleted</p><p className="mt-2 text-2xl font-black text-rose-300">{countList(status.deleted)}</p></div></div>
    <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm font-black text-white"><FileDiff className="mr-2 inline h-4 w-4 text-cyan-300" />Changed files</p><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-400">{JSON.stringify(status, null, 2)}</pre></div><div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-sm font-black text-white">Diff summary</p><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-400">{JSON.stringify(diff, null, 2)}</pre></div></div>
    <div className="flex flex-wrap gap-2"><button onClick={() => void generateCommit()} disabled={busy} className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black text-cyan-100">Generate commit message</button><button onClick={() => void generatePr()} disabled={busy} className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100">Generate PR description</button></div>
    {commitMsg && <div className="rounded-3xl border border-cyan-500/20 bg-cyan-950/10 p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-black text-cyan-100">Commit message</p><button onClick={() => void copy(commitMsg)} className="text-xs font-black text-cyan-200"><Clipboard className="mr-1 inline h-3.5 w-3.5" />Copy</button></div><pre className="whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-200">{commitMsg}</pre></div>}
    {prDesc && <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-black text-emerald-100">PR description</p><button onClick={() => void copy(prDesc)} className="text-xs font-black text-emerald-200"><Clipboard className="mr-1 inline h-3.5 w-3.5" />Copy</button></div><pre className="whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-200">{prDesc}</pre></div>}
  </section>;
}
