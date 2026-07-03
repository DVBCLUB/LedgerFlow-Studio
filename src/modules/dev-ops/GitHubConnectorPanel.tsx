import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Github, GitPullRequest, Loader2, PlusCircle, RefreshCw, Workflow } from 'lucide-react';
import {
  createGitHubConnectorIssue,
  fetchGitHubConnectorSummary,
  type GitHubConnectorSummary,
  type GitHubIssueSummary,
  type GitHubWorkflowRunSummary,
  fetchGitLocalStatus,
  triggerGitPull,
  triggerGitPush,
} from '../../utils/integrationHubApi';

interface GitHubConnectorPanelProps {
  repoUrl?: string;
  onChanged?: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function getRunBadge(run: GitHubWorkflowRunSummary): string {
  if (run.status !== 'completed') return 'Đang chạy';
  if (run.conclusion === 'success') return 'Xanh';
  if (run.conclusion === 'failure') return 'Đỏ';
  return run.conclusion || 'Không rõ';
}

function defaultIssueBody(repo: string): string {
  return `## Mục tiêu\n\nMô tả yêu cầu cần phát triển cho ${repo}.\n\n## Phạm vi\n\n- [ ] Phân tích nghiệp vụ\n- [ ] Xác định file/module cần sửa\n- [ ] Tạo checklist test\n- [ ] Chạy npm run build\n\n## Ghi chú\n\nIssue được tạo từ LedgerFlow Integration Hub.`;
}

export default function GitHubConnectorPanel({ repoUrl, onChanged }: GitHubConnectorPanelProps) {
  const [summary, setSummary] = useState<GitHubConnectorSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [gitConsole, setGitConsole] = useState<string>('');
  const [gitBusy, setGitBusy] = useState(false);

  const repo = summary?.repo || repoUrl || 'DVBCLUB/LedgerFlow-Studio';

  async function loadGitStatus() {
    try {
      const data = await fetchGitLocalStatus();
      setGitStatus(data);
    } catch {}
  }

  async function handleGitPull() {
    setGitBusy(true);
    setGitConsole('Running: git pull --rebase...\n');
    try {
      const res = await triggerGitPull();
      setGitConsole(prev => prev + res.log + '\n' + (res.success ? '✅ Đồng bộ tải xuống thành công!' : '❌ Thao tác Pull thất bại.'));
      await loadGitStatus();
    } catch (err: any) {
      setGitConsole(prev => prev + '❌ Lỗi kết nối API: ' + err.message);
    } finally {
      setGitBusy(false);
    }
  }

  async function handleGitPush() {
    setGitBusy(true);
    setGitConsole('Running: git push origin HEAD...\n');
    try {
      const res = await triggerGitPush();
      setGitConsole(prev => prev + res.log + '\n' + (res.success ? '✅ Đồng bộ tải lên thành công!' : '❌ Thao tác Push thất bại.'));
      await loadGitStatus();
    } catch (err: any) {
      setGitConsole(prev => prev + '❌ Lỗi kết nối API: ' + err.message);
    } finally {
      setGitBusy(false);
    }
  }

  async function loadSummary() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubConnectorSummary(repoUrl);
      setSummary(data);
      if (!issueBody) setIssueBody(defaultIssueBody(data.repo));
      await loadGitStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được GitHub summary.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  const latestRun = summary?.latestRuns?.[0];
  const healthLabel = useMemo(() => {
    if (!latestRun) return 'Chưa có workflow run';
    return `${latestRun.name}: ${getRunBadge(latestRun)}`;
  }, [latestRun]);

  async function handleCreateIssue() {
    if (!issueTitle.trim()) {
      setError('Nhập tiêu đề issue trước.');
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const issue = await createGitHubConnectorIssue({
        repo,
        title: issueTitle.trim(),
        body: issueBody || defaultIssueBody(repo),
        labels: ['ledgerflow', 'integration-hub'],
      });
      setIssueTitle('');
      setIssueBody(defaultIssueBody(repo));
      window.open(issue.htmlUrl, '_blank', 'noopener,noreferrer');
      await loadSummary();
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được GitHub issue. Có thể máy chưa cấu hình GITHUB_TOKEN/GH_TOKEN.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
            <Github className="h-4 w-4" /> GitHub Connector v1
          </div>
          <h2 className="mt-3 text-xl font-black text-white">Điều phối repo, CI, issue và PR</h2>
          <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-400">
            LedgerFlow đọc trạng thái GitHub để bạn biết CI xanh/đỏ, issue/PR đang mở và tạo issue phát triển từ trong app.
            Tạo issue cần token local qua <code className="rounded bg-slate-900 px-1 text-cyan-200">GITHUB_TOKEN</code> hoặc <code className="rounded bg-slate-900 px-1 text-cyan-200">GH_TOKEN</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-900/30 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Tải GitHub
        </button>
      </div>

      {error && (
        <div className="mt-4 flex gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold leading-6 text-rose-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <MetricCard icon={Github} label="Repo" value={summary?.repository?.fullName || repo} sub={summary?.repository?.private ? 'Private' : 'Public / token optional'} />
        <MetricCard icon={Workflow} label="CI mới nhất" value={healthLabel} sub={latestRun ? formatDate(latestRun.updatedAt) : 'Chưa tải'} />
        <MetricCard icon={CheckCircle2} label="Issues mở" value={String(summary?.openIssues.length ?? '—')} sub={`Tổng GitHub: ${summary?.repository?.openIssuesCount ?? '—'}`} />
        <MetricCard icon={GitPullRequest} label="PR mở" value={String(summary?.openPullRequests.length ?? '—')} sub={summary?.tokenConfigured ? 'Token đã cấu hình' : 'Token chưa cấu hình'} />
      </div>

      {/* Git & GitHub Local Sync Center */}
      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 text-left">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-cyan-300" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Git Sync Hub — Tự động hóa đồng bộ mã nguồn</h3>
          </div>
          {gitStatus && (
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-200">
              Nhánh hiện tại: {gitStatus.branch}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-950 bg-slate-950/30 p-3">
            <p className="text-[10px] font-black uppercase text-slate-500">Uncommitted Changes</p>
            <p className="mt-1 text-base font-black text-white">{gitStatus?.uncommittedFiles ?? 0} file đã sửa</p>
          </div>
          <div className="rounded-2xl border border-slate-950 bg-slate-950/30 p-3">
            <p className="text-[10px] font-black uppercase text-slate-500 font-bold">Unpushed Commits</p>
            <p className="mt-1 text-base font-black text-white">{gitStatus?.ahead ?? 0} ahead (chờ push)</p>
          </div>
          <div className="rounded-2xl border border-slate-950 bg-slate-950/30 p-3">
            <p className="text-[10px] font-black uppercase text-slate-500 font-bold">Unpulled Commits</p>
            <p className="mt-1 text-base font-black text-white">{gitStatus?.behind ?? 0} behind (cần pull)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGitPull}
              disabled={gitBusy}
              className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase text-cyan-100 hover:bg-cyan-500/20 transition-all disabled:opacity-40"
            >
              Pull
            </button>
            <button
              onClick={handleGitPush}
              disabled={gitBusy}
              className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase text-emerald-100 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
            >
              Push
            </button>
          </div>
        </div>

        {gitConsole && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2">Terminal Git Output Log</p>
            <pre className="rounded-xl border border-slate-950 bg-slate-950/70 p-3 text-[10px] font-semibold font-mono text-cyan-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
              {gitConsole}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <ListBlock title="Workflow runs gần nhất" empty="Chưa có workflow run hoặc không đọc được Actions." items={summary?.latestRuns ?? []} renderItem={(run) => (
            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-black text-white">{run.name}</div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${run.conclusion === 'success' ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' : run.conclusion === 'failure' ? 'border-rose-500/40 bg-rose-950/30 text-rose-200' : 'border-amber-500/40 bg-amber-950/30 text-amber-200'}`}>
                  {getRunBadge(run)}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">{run.branch} · {run.event} · {formatDate(run.updatedAt)}</div>
              <a className="mt-2 inline-flex items-center gap-1 text-xs font-black text-cyan-300 hover:text-cyan-100" href={run.htmlUrl} target="_blank" rel="noreferrer">
                Mở workflow <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )} />

          <div className="grid gap-4 lg:grid-cols-2">
            <IssueList title="Issues mở" items={summary?.openIssues ?? []} />
            <IssueList title="Pull requests mở" items={summary?.openPullRequests ?? []} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <PlusCircle className="h-4 w-4 text-emerald-300" /> Tạo GitHub Issue
          </div>
          <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Tiêu đề</label>
          <input
            value={issueTitle}
            onChange={(event) => setIssueTitle(event.target.value)}
            placeholder="Ví dụ: Thêm Google Sheets Connector v1"
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
          />
          <label className="mt-4 block text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Nội dung</label>
          <textarea
            value={issueBody}
            onChange={(event) => setIssueBody(event.target.value)}
            rows={11}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-slate-200 outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={() => void handleCreateIssue()}
            disabled={isCreating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-xs font-black text-emerald-100 hover:bg-emerald-900/30 disabled:opacity-60"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Tạo issue trên GitHub
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <div className="line-clamp-2 text-sm font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-[11px] font-semibold text-slate-400">{sub}</div>
    </div>
  );
}

function ListBlock<T>({ title, empty, items, renderItem }: { title: string; empty: string; items: T[]; renderItem: (item: T) => React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 text-sm font-black text-white">{title}</div>
      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {items.length === 0 ? <p className="text-xs font-semibold text-slate-500">{empty}</p> : items.map(renderItem)}
      </div>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: GitHubIssueSummary[] }) {
  return (
    <ListBlock
      title={title}
      empty="Chưa có mục mở."
      items={items}
      renderItem={(item) => (
        <div key={`${title}-${item.number}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="text-xs font-black text-white">#{item.number} {item.title}</div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">Cập nhật: {formatDate(item.updatedAt)}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.labels.slice(0, 3).map((label) => (
              <span key={label} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-black text-slate-400">{label}</span>
            ))}
          </div>
          <a className="mt-2 inline-flex items-center gap-1 text-xs font-black text-cyan-300 hover:text-cyan-100" href={item.htmlUrl} target="_blank" rel="noreferrer">
            Mở trên GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    />
  );
}
