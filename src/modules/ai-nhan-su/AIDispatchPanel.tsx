import { useCallback, useEffect, useState } from 'react';
import { Bot, Brain, Play, RefreshCw } from 'lucide-react';

type RoutingRow = {
  id: string;
  name: string;
  emoji: string;
  group: string;
  strength: string;
  accessMethod: string;
  primary: string;
  fallbacks: string[];
  costTier: string;
};

type RouteResult = {
  taskType: string;
  routedTo: { kind: string; employeeId: string; provider: string; model?: string; reason: string; cost: string } | null;
  tried: string[];
  result: { success: boolean; usedBinding: string; provider?: string; content?: string; error?: string };
};

type RouteResponse = { success: boolean; route: RouteResult };
type PolicyEntry = { kind: string; provider: string; model?: string; reason: string; cost: string };
type PolicyRow = { taskType: string; entries: PolicyEntry[] };

type Lesson = { id: string; domain: string; title: string; content: string; source: string; score: number };

type EvalSuite = { id: string; domain: string; name: string; roleId: string; cases: Array<{ id: string; prompt: string; checks: string[] }> };
type EvalCaseResult = { caseId: string; prompt: string; passed: boolean; score: number; matchedChecks: string[]; missingChecks: string[]; usedBinding?: string; provider?: string; error?: string };
type EvalRun = { id: string; suiteId: string; suiteName: string; roleId: string; total: number; passed: number; passRate: number; cases: EvalCaseResult[] };
type EvalStats = { totalRuns: number; totalCases: number; totalPassed: number; passRate: number; bySuite: Array<{ suiteId: string; suiteName: string; runs: number; passRate: number }> };

type CostGovernance = { config: { enabled: boolean; monthlyCapUsd: number; alertThresholdPct: number }; spentUsd: number; budgetPct: number; alert: boolean; gateOpen: boolean; byAgent: Record<string, { cost: number; calls: number }> };

type LoopJob = { id: string; goal?: string; domain?: string; status?: string; createdAt?: string; plan?: string[]; steps?: number; error?: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  return (await res.json().catch(() => ({}))) as T;
}

type DynamicRouterReport = {
  lastCalculatedAt: string;
  totalTelemetryCount: number;
  adaptiveRanks: Record<string, Array<{
    key: string;
    provider: string;
    model?: string;
    kind: string;
    sampleCount: number;
    avgLatencyMs: number;
    avgCostUsd: number;
    avgQualityScore: number;
    successRate: number;
    compositeScore: number;
    recommendedOrder: number;
    isColdStart: boolean;
  }>>;
  recentTelemetry: Array<{
    id: string;
    taskType: string;
    provider: string;
    model?: string;
    latencyMs: number;
    costUsd: number;
    qualityScore: number;
    success: boolean;
    timestamp: string;
    source: string;
  }>;
};

type LlmJudgeScore = {
  accuracy: number;
  completeness: number;
  format: number;
  safety: number;
  overallScore: number;
  verdict: string;
  reasoning: string;
  judgeProvider: string;
};

export default function AIDispatchPanel() {
  const [table, setTable] = useState<RoutingRow[]>([]);
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('general');
  const [useCli, setUseCli] = useState(false);
  const [localFirst, setLocalFirst] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [policy, setPolicy] = useState<Array<PolicyRow & { adaptiveSummary?: string }>>([]);
  const [dynamicReport, setDynamicReport] = useState<DynamicRouterReport | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [localPlan, setLocalPlan] = useState<{
    recommendations: Array<{ model: string; ramEstimate: string; useCase: string }>;
    ollamaConfig: { note?: string; keepAlive?: string };
    status: { running: boolean; models: string[]; error?: string };
  } | null>(null);
  const [evalSuites, setEvalSuites] = useState<EvalSuite[]>([]);
  const [evalStats, setEvalStats] = useState<EvalStats | null>(null);
  const [evalRun, setEvalRun] = useState<any | null>(null);
  const [evalSuiteId, setEvalSuiteId] = useState('');
  const [evalBusy, setEvalBusy] = useState(false);
  const [preferLocalJudge, setPreferLocalJudge] = useState(false);
  const [costGov, setCostGov] = useState<CostGovernance | null>(null);
  const [costCapInput, setCostCapInput] = useState('');
  const [loopGoal, setLoopGoal] = useState('');
  const [loopDomain, setLoopDomain] = useState('coding');
  const [loopMaxLoops, setLoopMaxLoops] = useState(3);
  const [loopJob, setLoopJob] = useState<LoopJob | null>(null);
  const [loopJobs, setLoopJobs] = useState<LoopJob[]>([]);
  const [loopBusy, setLoopBusy] = useState(false);

  const loadTable = useCallback(async () => {
    try {
      const data = await api<{ table: RoutingRow[] }>('/api/agent/routing-table');
      setTable(data.table || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const loadLocalPlan = useCallback(async () => {
    try {
      setLocalPlan(await api('/api/agent/local/plan'));
    } catch {
      // Ollama không bắt buộc; bỏ qua khi không chạy.
    }
  }, []);

  const loadPolicy = useCallback(async () => {
    try {
      const [polData, dynData] = await Promise.all([
        api<{ policy: Array<PolicyRow & { adaptiveSummary?: string }> }>('/api/agent/routing-policy'),
        api<{ report: DynamicRouterReport }>('/api/agent/routing-policy/dynamic'),
      ]);
      setPolicy(polData.policy || []);
      setDynamicReport(dynData.report || null);
    } catch {
      // bảng policy không bắt buộc
    }
  }, []);

  const loadEval = useCallback(async () => {
    try {
      const [suites, stats] = await Promise.all([
        api<{ suites: EvalSuite[] }>('/api/agent/eval/suites'),
        api<{ stats: EvalStats }>('/api/agent/eval/stats'),
      ]);
      setEvalSuites(suites.suites || []);
      setEvalStats(stats.stats || null);
      setEvalSuiteId((prev) => prev || (suites.suites && suites.suites[0]?.id) || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const loadCostGov = useCallback(async () => {
    try {
      const data = await api<{ governance: CostGovernance }>('/api/cost/governance');
      setCostGov(data.governance || null);
      if (data.governance) setCostCapInput(String(data.governance.config.monthlyCapUsd));
    } catch {
      // không bắt buộc
    }
  }, []);

  const loadLoopJobs = useCallback(async () => {
    try {
      const data = await api<{ jobs: LoopJob[] }>('/api/agent/loop/jobs?limit=5');
      setLoopJobs(data.jobs || []);
    } catch {
      // không bắt buộc
    }
  }, []);

  useEffect(() => {
    void loadTable();
    void loadLocalPlan();
    void loadPolicy();
    void loadEval();
    void loadCostGov();
    void loadLoopJobs();
  }, [loadTable, loadLocalPlan, loadPolicy, loadEval, loadCostGov, loadLoopJobs]);

  const dispatch = async () => {
    if (!goal.trim()) return;
    setBusy(true);
    setError('');
    try {
      const data = await api<RouteResponse>('/api/agent/route', {
        method: 'POST',
        body: JSON.stringify({ goal, domain, useCli }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const searchLessons = async () => {
    try {
      const data = await api<{ lessons: Lesson[] }>(`/api/agent/learning?q=${encodeURIComponent(query)}&limit=6`);
      setLessons(data.lessons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const runEval = async () => {
    if (!evalSuiteId || evalBusy) return;
    setEvalBusy(true);
    setError('');
    try {
      const data = await api<{ run: EvalRun }>('/api/agent/eval/run', {
        method: 'POST',
        body: JSON.stringify({ suiteId: evalSuiteId }),
      });
      setEvalRun(data.run);
      await loadEval();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEvalBusy(false);
    }
  };

  const runLlmJudge = async () => {
    if (!evalSuiteId || evalBusy) return;
    setEvalBusy(true);
    setError('');
    try {
      const data = await api<{ run: any }>('/api/agent/eval/run-llm-judge', {
        method: 'POST',
        body: JSON.stringify({
          suiteId: evalSuiteId,
          preferLocalJudge,
        }),
      });
      setEvalRun(data.run);
      await Promise.all([loadEval(), loadPolicy()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setEvalBusy(false);
    }
  };

  const saveCostGov = async (patch: { enabled?: boolean; monthlyCapUsd?: number }) => {
    try {
      await api('/api/cost/governance', { method: 'POST', body: JSON.stringify(patch) });
      await loadCostGov();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const runLoop = async () => {
    if (!loopGoal.trim() || loopBusy) return;
    setLoopBusy(true);
    setError('');
    try {
      const data = await api<{ jobId: string }>('/api/agent/loop/enqueue', {
        method: 'POST',
        body: JSON.stringify({ goal: loopGoal, domain: loopDomain, maxLoops: loopMaxLoops, autoRepair: true }),
      });
      setLoopJob({ id: data.jobId, goal: loopGoal, domain: loopDomain, status: 'queued' });
      setTimeout(() => { void pollLoop(data.jobId); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoopBusy(false);
    }
  };

  const pollLoop = async (jobId: string) => {
    try {
      const data = await api<{ job: LoopJob }>(`/api/agent/loop/job/${jobId}`);
      setLoopJob(data.job || null);
      await loadLoopJobs();
    } catch {
      // job có thể chưa sẵn sàng
    }
  };

  return (
    <section className="rounded-2xl border border-border-primary bg-slate-950/70 p-4 text-left">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-300" />
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">Trung tâm Điều phối AI Hạng Nhất</h2>
        </div>
        {dynamicReport && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-300">
            ⚡ Dynamic Router: {dynamicReport.totalTelemetryCount} telemetries recorded
          </span>
        )}
      </div>

      {/* Dispatch form */}
      <div className="mb-4 rounded-xl border border-border-primary bg-slate-900/60 p-3">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Giao việc cho đội ngũ AI (Dynamic AI Router sẽ tự động phân công model rẻ + giỏi nhất)..."
          className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary"
          rows={2}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-bold text-text-primary">
            <option value="general">General</option>
            <option value="coding">Coding / Backend</option>
            <option value="frontend">Frontend UI</option>
            <option value="finance">Finance</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="media">Video & Media</option>
            <option value="design">Game & Art Design</option>
            <option value="research">Research</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <input type="checkbox" checked={useCli} onChange={(e) => setUseCli(e.target.checked)} />
            Dùng CLI agent
          </label>
          <label className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <input type="checkbox" checked={localFirst} onChange={(e) => setLocalFirst(e.target.checked)} />
            Local first (Ollama)
          </label>
          <button onClick={dispatch} disabled={busy || !goal.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50 hover:bg-violet-600 cursor-pointer">
            <Play className="h-3.5 w-3.5" /> Dispatch Tự Động
          </button>
        </div>
        {result && (
          <div className="mt-2 rounded-xl border border-border-primary bg-slate-950/60 p-2 text-xs">
            <p className="font-black text-text-primary">
              [{result.route.taskType}] → {result.route.routedTo ? `${result.route.routedTo.kind}:${result.route.routedTo.provider}` : 'không có AI phù hợp'} · {result.route.routedTo?.reason || ''}
            </p>
            <p className={`mt-1 font-bold ${result.route.result.success ? 'text-emerald-300' : 'text-amber-300'}`}>
              {result.route.result.usedBinding}{result.route.result.provider ? `:${result.route.result.provider}` : ''}
              {result.route.result.error ? ` — ${result.route.result.error.slice(0, 120)}` : ''}
            </p>
            {result.route.result.content && <p className="mt-1 whitespace-pre-wrap text-text-secondary">{result.route.result.content.slice(0, 500)}</p>}
          </div>
        )}
      </div>

      {/* Dynamic Adaptive AI Router Panel */}
      <div className="mb-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-300" />
            <h3 className="text-xs font-black uppercase text-text-primary">Dynamic Adaptive AI Router (Học từ thực tế)</h3>
          </div>
          <span className="text-[10px] text-text-tertiary">
            Công thức: Score = 50% Quality + 30% Cost-Opt + 20% Latency
          </span>
        </div>

        {dynamicReport?.adaptiveRanks && Object.keys(dynamicReport.adaptiveRanks).length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(dynamicReport.adaptiveRanks).map(([taskType, candidates]) => {
              const top = candidates[0];
              if (!top) return null;
              return (
                <div key={taskType} className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase text-violet-300">[{taskType}]</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${top.isColdStart ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                      {top.isColdStart ? 'Cold Start' : `Top #1: ${top.compositeScore} pts`}
                    </span>
                  </div>
                  <p className="mt-1 font-bold text-text-primary">
                    {top.provider} {top.model ? `(${top.model})` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-text-tertiary">
                    <span>⚡ {top.avgLatencyMs}ms</span>
                    <span>💰 ${top.avgCostUsd.toFixed(4)}</span>
                    <span>⭐ {top.avgQualityScore}/100</span>
                    <span>📊 {top.sampleCount} runs</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-text-tertiary">Chưa có đủ telemetry lịch sử. Hệ thống đang tự động thu thập qua mỗi lần dispatch và eval.</p>
        )}
      </div>

      {/* Eval Harness with LLM Judge */}
      <div className="mt-4 rounded-xl border border-border-primary bg-slate-900/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-rose-300" />
            <span className="text-xs font-black uppercase text-text-primary">Eval Harness &amp; LLM-as-a-Judge</span>
            {evalStats && (
              <span className="rounded-full border border-border-secondary px-2 py-0.5 text-[9px] font-bold text-text-secondary">
                {evalStats.totalCases} case · pass {evalStats.passRate}%
              </span>
            )}
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
            <input type="checkbox" checked={preferLocalJudge} onChange={(e) => setPreferLocalJudge(e.target.checked)} />
            Judge bằng Ollama local ($0)
          </label>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={evalSuiteId} onChange={(e) => setEvalSuiteId(e.target.value)} className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-bold text-text-primary">
            {evalSuites.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.roleId})</option>)}
          </select>
          <button onClick={runEval} disabled={evalBusy || !evalSuiteId} className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-800 px-3 py-1.5 text-xs font-bold text-text-primary disabled:opacity-50 hover:bg-slate-700 cursor-pointer">
            <Play className="h-3.5 w-3.5" /> Heuristic Eval
          </button>
          <button onClick={runLlmJudge} disabled={evalBusy || !evalSuiteId} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-3 py-1.5 text-xs font-black text-white disabled:opacity-50 hover:brightness-110 cursor-pointer shadow-md">
            <Brain className="h-3.5 w-3.5" /> {evalBusy ? 'Đang chấm...' : 'Chạy LLM-Judge Eval'}
          </button>
        </div>

        {evalRun && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-primary">
              <span>{evalRun.suiteName} → pass {evalRun.passed}/{evalRun.total} ({evalRun.passRate}%)</span>
              {evalRun.judgeModel && <span className="text-[10px] text-rose-300">Judge Model: {evalRun.judgeModel}</span>}
            </div>
            {evalRun.cases.map((c: any) => (
              <div key={c.caseId} className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black ${c.passed ? 'text-emerald-300' : 'text-rose-300'}`}>{c.passed ? '✓' : '✗'}</span>
                    <span className="font-bold text-text-primary">{c.caseId}</span>
                    <span className="text-text-tertiary">· {c.score}%</span>
                  </div>
                  {c.judgeScores && (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${c.judgeScores.verdict === 'EXCELLENT' ? 'bg-emerald-500/20 text-emerald-300' : c.judgeScores.verdict === 'PASS' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {c.judgeScores.verdict}
                    </span>
                  )}
                </div>
                {c.judgeScores && (
                  <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px] text-text-secondary bg-slate-900/60 p-1.5 rounded-lg">
                    <span>Độ chính xác: <strong className="text-cyan-300">{c.judgeScores.accuracy}</strong></span>
                    <span>Đầy đủ: <strong className="text-cyan-300">{c.judgeScores.completeness}</strong></span>
                    <span>Định dạng: <strong className="text-cyan-300">{c.judgeScores.format}</strong></span>
                    <span>An toàn: <strong className="text-cyan-300">{c.judgeScores.safety}</strong></span>
                  </div>
                )}
                {c.judgeScores?.reasoning && (
                  <p className="mt-1 text-[10px] italic text-text-tertiary">💡 Judge: {c.judgeScores.reasoning}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learning search */}
      <div className="mt-4 mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-emerald-300" />
        <span className="text-xs font-black uppercase text-text-primary">Kho kinh nghiệm (AI học lẫn nhau)</span>
        <div className="ml-auto flex items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bài học…" className="w-40 rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs text-text-primary" />
          <button onClick={searchLessons} className="inline-flex items-center gap-1 rounded-xl border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">
            <RefreshCw className="h-3 w-3" /> Tìm
          </button>
        </div>
      </div>
      {lessons.length > 0 && (
        <div className="space-y-1.5">
          {lessons.map((l) => (
            <div key={l.id} className="rounded-lg border border-border-primary bg-slate-900/50 px-3 py-2 text-[11px]">
              <span className="font-black text-emerald-300">[{l.domain}]</span> <span className="font-bold text-text-primary">{l.title}</span>
              <span className="ml-1 text-text-tertiary">· {l.source}</span>
              <p className="mt-0.5 text-text-secondary">{l.content.slice(0, 160)}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mt-3 rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">{error}</div>}

      {/* Routing table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-text-tertiary">
              <th className="pb-2 pr-3 font-black uppercase">Nhân viên</th>
              <th className="pb-2 pr-3 font-black uppercase">Thế mạnh</th>
              <th className="pb-2 pr-3 font-black uppercase">Primary</th>
              <th className="pb-2 font-black uppercase">Fallback</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.id} className="border-t border-border-primary">
                <td className="py-1.5 pr-3 font-bold text-text-primary">{r.emoji} {r.name}</td>
                <td className="py-1.5 pr-3 text-text-secondary">{r.strength}</td>
                <td className="py-1.5 pr-3 text-cyan-300">{r.primary}</td>
                <td className="py-1.5 text-text-tertiary">{r.fallbacks.join(' | ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chính sách điều phối theo loại việc */}
      <div className="mt-4 rounded-xl border border-border-primary bg-slate-900/50 p-3">
        <h3 className="text-xs font-black uppercase text-text-primary">Chính sách điều phối thích ứng (Adaptive AI Routing)</h3>
        <div className="mt-2 space-y-1.5">
          {policy.map((p) => (
            <div key={p.taskType} className="text-[11px] text-text-secondary border-b border-border-primary/50 pb-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-violet-300">{p.taskType}</span>
                {p.adaptiveSummary && <span className="text-[9px] text-text-tertiary italic">{p.adaptiveSummary}</span>}
              </div>
              <p className="mt-0.5 text-text-tertiary">{p.entries.map((e) => `${e.kind}:${e.provider}${e.model ? ':' + e.model : ''}(${e.cost})`).join(' → ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Local AI (nhẹ RAM) */}
      <div className="mt-4 rounded-xl border border-border-primary bg-slate-900/50 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-text-primary">
          <Bot className="h-4 w-4 text-amber-300" /> AI Local (Ollama)
          <span className={`rounded-full border px-2 py-0.5 text-[9px] ${localPlan?.status?.running ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-300'}`}>
            {localPlan?.status?.running ? `Đang chạy: ${(localPlan.status.models || []).length} model` : 'Chưa chạy'}
          </span>
        </div>
        {localPlan && (
          <div className="mt-2 space-y-1">
            {localPlan.recommendations.map((r) => (
              <p key={r.model} className="text-[11px] text-text-secondary">
                <span className="font-black text-amber-200">{r.model}</span> · {r.ramEstimate} · {r.useCase}
              </p>
            ))}
            {localPlan.ollamaConfig?.note && <p className="mt-1 text-[10px] text-text-tertiary">⚙️ {localPlan.ollamaConfig.note}</p>}
          </div>
        )}
      </div>

      {/* Cost Governance — ngân sách & chi tiêu */}
      <div className="mt-4 rounded-xl border border-border-primary bg-slate-900/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-300" />
          <span className="text-xs font-black uppercase text-text-primary">Cost Governance — Ngân sách AI</span>
          {costGov && (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${costGov.gateOpen ? 'border-emerald-500/40 text-emerald-300' : 'border-rose-500/40 text-rose-300'}`}>
              {costGov.gateOpen ? 'Mở' : 'Đã chặn ngân sách'}
            </span>
          )}
        </div>
        {costGov && (
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-text-secondary">
                Đã tiêu: <strong className="text-text-primary">${costGov.spentUsd.toFixed(4)}</strong> / ${costGov.config.monthlyCapUsd} ({costGov.budgetPct}%)
              </span>
              {costGov.alert && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">⚠️ Vượt ngưỡng cảnh báo</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={costCapInput}
                onChange={(e) => setCostCapInput(e.target.value)}
                placeholder="Hạn mức $/tháng"
                className="w-32 rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1 text-xs text-text-primary"
              />
              <button
                onClick={() => void saveCostGov({ monthlyCapUsd: Number(costCapInput) || 50 })}
                className="rounded-xl border border-border-secondary bg-slate-800 px-2.5 py-1 text-xs font-bold text-text-primary hover:bg-slate-700 cursor-pointer"
              >
                Cập nhật hạn mức
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vòng lặp tự chủ Plan → Do → Review */}
      <div className="mt-4 rounded-xl border border-border-primary bg-slate-900/50 p-3">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-black uppercase text-text-primary">Vòng lặp tự chủ (Plan → Do → Review)</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={loopGoal} onChange={(e) => setLoopGoal(e.target.value)} placeholder="Mục tiêu (VD: cải thiện landing page)…" className="flex-1 min-w-40 rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs text-text-primary" />
          <select value={loopDomain} onChange={(e) => setLoopDomain(e.target.value)} className="rounded-xl border border-border-secondary bg-slate-950 px-3 py-1.5 text-xs font-bold text-text-primary">
            <option value="coding">Coding</option>
            <option value="finance">Finance</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="analytics">Analytics</option>
            <option value="general">General</option>
          </select>
          <input type="number" min="1" max="10" value={loopMaxLoops} onChange={(e) => setLoopMaxLoops(Number(e.target.value) || 3)} className="w-16 rounded-xl border border-border-secondary bg-slate-950 px-2 py-1.5 text-xs text-text-primary" />
          <button onClick={runLoop} disabled={loopBusy || !loopGoal.trim()} className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 disabled:opacity-50 hover:bg-emerald-400 cursor-pointer">Chạy</button>
          <button onClick={() => { if (loopJob?.id) void pollLoop(loopJob.id); }} disabled={!loopJob?.id} className="rounded-xl border border-border-secondary bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">Cập nhật</button>
        </div>
        {loopJob && (
          <div className="mt-2 rounded-lg border border-border-primary bg-slate-950/60 px-3 py-1.5 text-[11px]">
            <span className="font-black text-emerald-300">{loopJob.status}</span>
            <span className="ml-1 text-text-secondary">· {loopJob.goal?.slice(0, 60)}</span>
            {loopJob.plan && Array.isArray(loopJob.plan) && (
              <p className="mt-0.5 text-text-tertiary">Plan: {loopJob.plan.length} bước</p>
            )}
            {loopJob.error && <p className="mt-0.5 text-rose-300">{String(loopJob.error).slice(0, 120)}</p>}
          </div>
        )}
        {loopJobs.length > 0 && (
          <div className="mt-2 space-y-1">
            {loopJobs.map((j) => (
              <p key={j.id} className="text-[10px] text-text-tertiary">
                <span className="font-bold text-text-secondary">{j.status}</span> · {j.goal?.slice(0, 50) || j.id}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
