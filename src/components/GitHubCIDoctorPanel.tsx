import React, { useState } from 'react';
import { AlertTriangle, Bot, Clipboard, ExternalLink, GitBranch, Loader2, RefreshCw, Wrench } from 'lucide-react';
import {
  analyzeGitHubCIFailureWithAI,
  fetchGitHubCIFailureContext,
  type GitHubCIFailureContext,
} from '../utils/integrationHubApi';

interface GitHubCIDoctorPanelProps {
  repoUrl?: string;
}

function repoFromUrl(repoUrl?: string): string {
  if (!repoUrl) return 'DVBCLUB/LedgerFlow-Studio';
  return repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
}

export default function GitHubCIDoctorPanel({ repoUrl }: GitHubCIDoctorPanelProps) {
  const [repo, setRepo] = useState(repoFromUrl(repoUrl));
  const [context, setContext] = useState<GitHubCIFailureContext | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [handoffPrompt, setHandoffPrompt] = useState('');
  const [modelUsed, setModelUsed] = useState<string | undefined>();
  const [busy, setBusy] = useState<'load' | 'analyze' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFailureContext() {
    setBusy('load');
    setMessage(null);
    try {
      const data = await fetchGitHubCIFailureContext(repo);
      setContext(data);
      setAnalysis('');
      setHandoffPrompt('');
      setMessage(data.selectedRun ? `Đã tải run: ${data.selectedRun.name} (${data.selectedRun.conclusion || data.selectedRun.status}).` : 'Không thấy workflow run nào.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không tải được CI context.');
    } finally {
      setBusy(null);
    }
  }

  async function analyzeWithAI() {
    if (!context) return;
    setBusy('analyze');
    setMessage(null);
    try {
      const result = await analyzeGitHubCIFailureWithAI(context);
      setAnalysis(result.analysis);
      setHandoffPrompt(result.handoffPrompt);
      setModelUsed(result.modelUsed);
      setMessage('AI Gateway đã phân tích lỗi CI và tạo prompt handoff.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'AI phân tích CI thất bại.');
    } finally {
      setBusy(null);
    }
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`Đã copy ${label}.`);
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/85 p-5 shadow-xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
            <Wrench className="h-3.5 w-3.5" /> GitHub CI Doctor
          </div>
          <h2 className="mt-3 text-xl font-black text-white">Đọc lỗi Actions → AI phân tích → prompt sửa lỗi</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-400">
            Dùng cho quy trình thực tế: GitHub báo đỏ, LedgerFlow đọc run/job/step lỗi, AI Gateway phân tích, rồi tạo prompt để đưa qua VS Code/Cursor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {context?.actionsUrl && (
            <button
              type="button"
              onClick={() => window.open(context.actionsUrl, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Mở run
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={repo}
          onChange={(event) => setRepo(event.target.value)}
          placeholder="DVBCLUB/LedgerFlow-Studio"
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
        />
        <button
          type="button"
          onClick={() => void loadFailureContext()}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-900/30 disabled:opacity-60"
        >
          {busy === 'load' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tải lỗi CI
        </button>
        <button
          type="button"
          onClick={() => void analyzeWithAI()}
          disabled={!context || busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-900/30 disabled:opacity-60"
        >
          {busy === 'analyze' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} AI phân tích
        </button>
      </div>

      {message && <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-3 text-xs font-bold text-slate-200">{message}</div>}

      {context && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <GitBranch className="h-4 w-4 text-cyan-300" /> Run được chọn
            </div>
            <div className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-300">
              <p><span className="text-slate-500">Repo:</span> {context.repo}</p>
              <p><span className="text-slate-500">Run:</span> {context.selectedRun?.name || 'Không có'}</p>
              <p><span className="text-slate-500">Status:</span> {context.selectedRun?.status} / {context.selectedRun?.conclusion || 'n/a'}</p>
              <p><span className="text-slate-500">Branch:</span> {context.selectedRun?.branch || 'n/a'}</p>
              <p><span className="text-slate-500">Checked:</span> {new Date(context.lastCheckedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" /> Jobs/steps cần xem
            </div>
            <div className="max-h-64 space-y-3 overflow-auto pr-1">
              {context.failedJobs.length === 0 ? (
                <p className="text-xs font-semibold text-slate-500">Không có job lỗi cụ thể.</p>
              ) : (
                context.failedJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-white">
                      <span>{job.name}</span>
                      <span className="rounded-full border border-rose-500/30 bg-rose-950/20 px-2 py-0.5 text-[10px] text-rose-100">{job.conclusion || job.status}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-400">
                      {job.failedSteps.length === 0 ? <p>Không thấy failed step trong API summary.</p> : job.failedSteps.map((step) => <p key={`${job.id}-${step.number}`}>{step.number}. {step.name} — {step.conclusion}</p>)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black text-emerald-100">Phân tích AI {modelUsed ? `(${modelUsed})` : ''}</div>
              <button type="button" onClick={() => void copyText(analysis, 'phân tích')} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 px-2 py-1 text-[11px] font-black text-emerald-100">
                <Clipboard className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <pre className="max-h-96 whitespace-pre-wrap overflow-auto text-xs font-semibold leading-6 text-slate-200">{analysis}</pre>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black text-cyan-100">Prompt đưa qua VS Code/Cursor</div>
              <button type="button" onClick={() => void copyText(handoffPrompt, 'prompt handoff')} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-2 py-1 text-[11px] font-black text-cyan-100">
                <Clipboard className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <pre className="max-h-96 whitespace-pre-wrap overflow-auto text-xs font-semibold leading-6 text-slate-200">{handoffPrompt}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
