import React from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle2, Database, Gauge, GitBranch, Loader2, PlayCircle, ShieldCheck, WifiOff } from 'lucide-react';
import {
  buildGitHubPRControlReport,
  buildSamplePRControlReport,
  createSampleGroundedContextPack,
  createSampleMissionPlan,
  fetchAIWorkforceRuntimeDashboard,
  previewSampleAutomationSafety,
  scoreSamplePRReadiness,
} from '../../services/aiWorkforceRuntimeClient';

const cardClass = 'rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass = 'w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500/60';

type RuntimeAction = 'dashboard' | 'context' | 'mission-plan' | 'safety' | 'readiness' | 'pr-control' | 'github-pr-control';

function MiniMetric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {detail && <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-[11px] font-semibold leading-5 text-slate-300">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function normalizeRepo(value: string) {
  return value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/$/, '');
}

export default function AIWorkforceRuntimePanel() {
  const [loading, setLoading] = React.useState<RuntimeAction | null>('dashboard');
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [lastResult, setLastResult] = React.useState<any>(null);
  const [githubRepo, setGithubRepo] = React.useState('DVBCLUB/LedgerFlow-Studio');
  const [githubPrNumber, setGithubPrNumber] = React.useState('42');
  const [githubApiBaseUrl, setGithubApiBaseUrl] = React.useState('');

  const refreshDashboard = React.useCallback(async () => {
    setLoading('dashboard');
    setError(null);
    try {
      const response = await fetchAIWorkforceRuntimeDashboard();
      setDashboard(response.dashboard);
      setLastResult({ type: 'runtime-dashboard', response });
    } catch (err: any) {
      setError(err?.message || 'Cannot reach AI Workforce Runtime Hub.');
    } finally {
      setLoading(null);
    }
  }, []);

  React.useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  async function runAction(action: RuntimeAction) {
    setLoading(action);
    setError(null);
    try {
      const response = action === 'context'
        ? await createSampleGroundedContextPack()
        : action === 'mission-plan'
          ? await createSampleMissionPlan()
          : action === 'safety'
            ? await previewSampleAutomationSafety()
            : action === 'readiness'
              ? await scoreSamplePRReadiness()
              : action === 'pr-control'
                ? await buildSamplePRControlReport()
                : action === 'github-pr-control'
                  ? await runGitHubPRControl()
                  : await fetchAIWorkforceRuntimeDashboard();
      setLastResult({ type: action, response });
      const refreshed = await fetchAIWorkforceRuntimeDashboard();
      setDashboard(refreshed.dashboard);
    } catch (err: any) {
      setError(err?.message || `AI Workforce runtime action failed: ${action}`);
    } finally {
      setLoading(null);
    }
  }

  async function runGitHubPRControl() {
    const repoFullName = normalizeRepo(githubRepo);
    const prNumber = Number.parseInt(githubPrNumber, 10);
    if (!/^[-_.A-Za-z0-9]+\/[-_.A-Za-z0-9]+$/.test(repoFullName)) {
      throw new Error('GitHub PR Control cần repo dạng owner/name, ví dụ DVBCLUB/LedgerFlow-Studio.');
    }
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error('GitHub PR Control cần PR number hợp lệ.');
    }
    return buildGitHubPRControlReport({ repoFullName, prNumber, apiBaseUrl: githubApiBaseUrl });
  }

  const readiness = dashboard?.readiness;
  const observability = dashboard?.observability;
  const metricStoreStats = dashboard?.metricStoreStats;
  const tooling = dashboard?.tooling;
  const ledger = dashboard?.ledger;
  const recentRecords = dashboard?.recentRecords || [];
  const offline = Boolean(error && !dashboard);
  const lastMissionPlan = lastResult?.type === 'mission-plan' ? lastResult?.response?.plan : null;
  const lastGitHubReport = lastResult?.type === 'github-pr-control' ? lastResult?.response?.report : null;
  const lastGitHubAdapter = lastResult?.type === 'github-pr-control' ? lastResult?.response?.adapter : null;

  return (
    <section className={`${cardClass} border-cyan-500/20`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
            {offline ? <WifiOff className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-black text-white">Live Runtime Hub</h2>
            <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-300">
              Giao diện live cho AI Workforce Runtime Hub: đọc dashboard, tạo grounded context pack, lập Mission Plan, preview safety envelope, chấm PR readiness, chạy PR Control thật từ GitHub, xem MCP tool health, persistent metric store và audit/trend ledger.
            </p>
          </div>
        </div>
        <button className={buttonClass} onClick={() => runAction('dashboard')} disabled={Boolean(loading)}>
          {loading === 'dashboard' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
          Refresh runtime
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold leading-6 text-amber-100">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4" /> <span>{error}</span></div>
          <p className="mt-2 text-[11px] text-amber-200/80">Runtime Hub sẽ hoạt động khi assistant daemon đang chạy, patch script đã được chạy, và GitHub adapter có token trong daemon env khi repo cần quyền private.</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MiniMetric label="Readiness" value={readiness ? `${readiness.grade} · ${readiness.overallScore}/5` : '—'} detail="Điểm runtime readiness động" />
        <MiniMetric label="Runs" value={observability?.runs ?? '—'} detail={`Persisted ${metricStoreStats?.total ?? '—'} metrics`} />
        <MiniMetric label="Blocked rate" value={observability ? `${Math.round((observability.blockedRate || 0) * 100)}%` : '—'} detail="Tác vụ bị safety chặn" />
        <MiniMetric label="Tool health" value={tooling ? `${tooling.summary.healthy}/${tooling.summary.total}` : '—'} detail="MCP manifests healthy/total" />
        <MiniMetric label="Audit events" value={ledger?.auditStats?.totalEvents ?? '—'} detail="Operational ledger audit trail" />
        <MiniMetric label="Graph nodes" value={ledger?.graphStats?.totalNodes ?? '—'} detail="Knowledge graph persisted" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        <button className={buttonClass} onClick={() => runAction('context')} disabled={Boolean(loading)}>
          {loading === 'context' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Build context pack
        </button>
        <button className={buttonClass} onClick={() => runAction('mission-plan')} disabled={Boolean(loading)}>
          {loading === 'mission-plan' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          Plan mission
        </button>
        <button className={buttonClass} onClick={() => runAction('safety')} disabled={Boolean(loading)}>
          {loading === 'safety' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Preview safety
        </button>
        <button className={buttonClass} onClick={() => runAction('readiness')} disabled={Boolean(loading)}>
          {loading === 'readiness' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Score PR readiness
        </button>
        <button className={buttonClass} onClick={() => runAction('pr-control')} disabled={Boolean(loading)}>
          {loading === 'pr-control' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
          Sample PR Control
        </button>
      </div>

      {lastMissionPlan && (
        <div className="mt-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MiniMetric label="Mission risk" value={lastMissionPlan.riskTier || '—'} detail={lastMissionPlan.approvalRequired ? 'Approval checkpoints required' : 'No checkpoint required'} />
            <MiniMetric label="Steps" value={lastMissionPlan.summary?.totalSteps ?? '—'} detail={`${lastMissionPlan.summary?.highRiskSteps ?? 0} high-risk steps`} />
            <MiniMetric label="Approvals" value={lastMissionPlan.summary?.humanApprovals ?? '—'} detail="Human checkpoints" />
            <MiniMetric label="Context" value={lastMissionPlan.summary?.contextConfidence ?? '—'} detail={`${lastMissionPlan.summary?.contradictions ?? 0} contradictions`} />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {lastMissionPlan.steps?.slice(0, 6).map((step: any) => (
              <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">
                <p className="text-xs font-black text-white">{step.title}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{step.agentRole} · {step.toolId} · {step.riskTier}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">GitHub repo</label>
            <input className={inputClass} value={githubRepo} onChange={(event) => setGithubRepo(event.target.value)} placeholder="owner/name" />
          </div>
          <div className="w-full lg:w-32">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">PR #</label>
            <input className={inputClass} value={githubPrNumber} onChange={(event) => setGithubPrNumber(event.target.value.replace(/[^0-9]/g, ''))} placeholder="42" inputMode="numeric" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">GitHub API base</label>
            <input className={inputClass} value={githubApiBaseUrl} onChange={(event) => setGithubApiBaseUrl(event.target.value)} placeholder="Optional, default https://api.github.com" />
          </div>
          <button className={buttonClass} onClick={() => runAction('github-pr-control')} disabled={Boolean(loading)}>
            {loading === 'github-pr-control' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
            Run GitHub PR Control
          </button>
        </div>
        <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-400">
          Token không nhập ở UI. Với repo private, đặt `GITHUB_TOKEN` trong môi trường daemon để adapter đọc changed files, reviews, check-runs và commit statuses an toàn.
        </p>
        {lastGitHubReport && (
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <MiniMetric label="GitHub gate" value={lastGitHubReport.mergeGate?.mode || '—'} detail={lastGitHubReport.mergeGate?.allowed ? 'Allowed by PR Control' : 'Blocked/review required'} />
            <MiniMetric label="Score" value={lastGitHubReport.readiness?.score ?? '—'} detail={lastGitHubReport.readiness?.verdict || 'readiness verdict'} />
            <MiniMetric label="Files" value={lastGitHubReport.evidence?.filesChanged ?? '—'} detail={`${lastGitHubReport.evidence?.additions ?? 0}+ / ${lastGitHubReport.evidence?.deletions ?? 0}-`} />
            <MiniMetric label="Approvals" value={lastGitHubAdapter?.approvals?.approvedBy?.length ?? '—'} detail={`changes requested ${lastGitHubAdapter?.approvals?.changesRequestedBy?.length ?? 0}`} />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-cyan-300">
            <Bot className="h-4 w-4" /> Recent runtime records
          </div>
          <div className="space-y-2">
            {recentRecords.length ? recentRecords.slice(0, 5).map((record: any) => (
              <div key={record.id} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <p className="text-xs font-black text-white">{record.type}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{record.id}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt}</p>
              </div>
            )) : (
              <p className="text-xs font-semibold text-slate-500">Chưa có runtime record hoặc daemon chưa online.</p>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Persistent metric store</p>
            <p className="mt-1 text-xs font-bold text-slate-200">
              {metricStoreStats ? `${metricStoreStats.total} runs · ${metricStoreStats.lanes?.length || 0} lanes` : 'Waiting for daemon metrics'}
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
              latest: {metricStoreStats?.latestMetric?.id || '—'}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> MCP tool health
          </div>
          <div className="space-y-2">
            {tooling?.health?.length ? tooling.health.slice(0, 6).map((row: any) => (
              <div key={row.toolId} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-white">{row.toolId}</p>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black uppercase text-slate-300">{row.health}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">score {row.score}/100 · failures {row.failures}</p>
              </div>
            )) : (
              <p className="text-xs font-semibold text-slate-500">Chưa có MCP tool telemetry.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-amber-300">
            <Activity className="h-4 w-4" /> Audit + trend
          </div>
          <div className="space-y-2">
            <p className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300">
              Trend snapshots: {ledger?.trendStats?.totalSnapshots ?? '—'} · readiness Δ {ledger?.trendStats?.readinessDelta ?? '—'}
            </p>
            <p className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300">
              Blocked-rate Δ {ledger?.trendStats?.blockedRateDelta ?? '—'} · critical events {ledger?.auditStats?.criticalEvents ?? '—'}
            </p>
            {ledger?.auditStats?.latestEvents?.slice(0, 3).map((event: any) => (
              <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                <p className="text-xs font-black text-white">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.severity} · {event.summary}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-violet-300">
            <PlayCircle className="h-4 w-4" /> Last action result
          </div>
          <JsonPreview value={lastResult || { status: offline ? 'offline' : 'waiting_for_runtime_action' }} />
        </div>
      </div>
    </section>
  );
}
