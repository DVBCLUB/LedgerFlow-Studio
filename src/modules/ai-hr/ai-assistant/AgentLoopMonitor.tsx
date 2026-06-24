import React, { useEffect, useState, useCallback } from 'react';
import {
  PlayCircle, Square, Loader2, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, ArrowRight, BrainCircuit, Clock,
} from 'lucide-react';

interface LoopStep {
  id: string;
  index: number;
  phase: string;
  goal: string;
  plan: string;
  observation: { success: boolean; summary: string; error?: string; evidence?: any };
  repairAttempts: number;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}

interface LoopRun {
  id: string;
  goal: string;
  domain: string;
  status: string;
  plan: string[];
  steps: LoopStep[];
  currentLoop: number;
  maxLoops: number;
  maxRepairAttempts: number;
  autoRepair: boolean;
  createdAt: string;
  completedAt?: string;
  totalDurationMs: number;
  summary?: string;
}

interface MemoryStats {
  session: { count: number };
  shortTerm: { count: number; oldestAt?: string };
  longTerm: { count: number; lastCuratedAt?: string };
  totalRecords: number;
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso.slice(11, 19); }
}

export default function AgentLoopMonitor() {
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('coding');
  const [autoRepair, setAutoRepair] = useState(true);
  const [maxLoops, setMaxLoops] = useState(5);
  const [runs, setRuns] = useState<LoopRun[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const DAEMON = 'http://127.0.0.1:3001';

  const refresh = useCallback(async () => {
    try {
      const [runsRes, memRes] = await Promise.all([
        fetch(`${DAEMON}/api/agentic-loop/runs`).then(r => r.json()).catch(() => null),
        fetch(`${DAEMON}/api/memory/stats`).then(r => r.json()).catch(() => null),
      ]);
      if (runsRes?.ok) {
        setRuns(runsRes.runs || []);
        setMetrics(runsRes.metrics || null);
      }
      if (memRes?.ok) setMemoryStats(memRes.stats);
    } catch { /* daemon offline is ok */ }
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);

  const handleRun = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${DAEMON}/api/agentic-loop/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, domain, autoRepair, maxLoops }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Loop completed: ${data.run.status} (${data.run.steps.length} steps)`);
        refresh();
      } else {
        setError(data.error || 'Loop failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (runId: string) => {
    setBusyId(runId);
    try {
      await fetch(`${DAEMON}/api/agentic-loop/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, reason: 'User stopped' }),
      });
      refresh();
    } catch { }
    setBusyId(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <BrainCircuit className="h-4 w-4 text-blue-400" /> Agentic Loop Monitor
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Agent tự lập kế hoạch, thực thi, quan sát &amp; sửa lỗi</p>
        </div>
        <div className="flex items-center gap-2">
          {memoryStats && (
            <span className="text-[9px] text-slate-500 bg-slate-950 border border-slate-800 rounded-full px-2 py-0.5">
              Memory: {memoryStats.totalRecords} records
            </span>
          )}
          <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:border-blue-500">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {metrics && (
        <div className="flex flex-wrap gap-2 text-[9px] font-bold">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300">Running: {metrics.running}</span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1 text-emerald-300">Done: {metrics.completed}</span>
          <span className="rounded-full border border-rose-500/30 bg-rose-950/20 px-2.5 py-1 text-rose-300">Failed: {metrics.failed}</span>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-400">Avg steps: {metrics.averageSteps}</span>
        </div>
      )}

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-[10px] font-bold text-rose-200 flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-[10px] font-bold text-emerald-200 flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{message}</div>}

      {/* Run form */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="VD: Sửa lỗi type trong AIAssistantPanel.tsx và chạy npm run lint"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-blue-500/60"
            onKeyDown={e => e.key === 'Enter' && handleRun()}
          />
          <button
            onClick={handleRun}
            disabled={loading || !goal.trim()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Run Agentic Loop
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={domain} onChange={e => setDomain(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-200 outline-none">
            <option value="coding">Coding</option><option value="finance">Finance</option><option value="general">General</option>
          </select>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer">
            <input type="checkbox" checked={autoRepair} onChange={e => setAutoRepair(e.target.checked)} className="accent-blue-500" />
            Auto-repair
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            Max loops:
            <select value={maxLoops} onChange={e => setMaxLoops(Number(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-[10px] text-slate-200 outline-none">
              {[3,5,7,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Runs list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {runs.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-slate-500">Chưa có agentic loop run nào. Nhập goal và bấm Run.</div>
        )}
        {runs.map(run => {
          const isExpanded = expandedId === run.id;
          const successSteps = run.steps.filter(s => s.observation?.success).length;
          return (
            <div key={run.id} className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : run.id)} className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={run.status === 'completed' ? 'text-emerald-400' : run.status === 'failed' ? 'text-rose-400' : run.status === 'stopped' ? 'text-amber-400' : 'text-blue-400'}>
                    {run.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : run.status === 'failed' ? <XCircle className="h-4 w-4" /> : run.status === 'stopped' ? <Square className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-blue-300">{run.domain}</span>
                      {run.autoRepair && <span className="text-[9px] text-amber-400">auto-repair ON</span>}
                    </div>
                    <div className="text-xs text-slate-200 truncate max-w-[400px]">{run.goal}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-slate-500">{formatTime(run.createdAt)}</span>
                      <span className="text-[9px] text-slate-600">· {(run.totalDurationMs/1000).toFixed(1)}s</span>
                      <span className="text-[9px] text-slate-600">· {successSteps}/{run.steps.length} steps</span>
                      <span className="text-[9px] text-slate-600">· plan: {run.plan.length} items</span>
                    </div>
                  </div>
                </div>
                {run.status === 'executing' && (
                  <button onClick={e => { e.stopPropagation(); handleStop(run.id); }} disabled={busyId === run.id} className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white text-[9px] font-black rounded-lg flex items-center gap-1 shrink-0">
                    <Square className="h-3 w-3" /> Stop
                  </button>
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 p-3 space-y-2 bg-slate-950/40">
                  <div className="text-[10px] font-bold text-slate-400">Plan: {run.plan.map((p,i) => <span key={i} className="text-slate-300 ml-1">{i+1}. {p}{i < run.plan.length-1 ? ' →' : ''}</span>)}</div>
                  {run.steps.map((step, i) => (
                    <div key={step.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className={step.observation?.success ? 'text-emerald-400' : 'text-rose-400'}>
                            {step.observation?.success ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5" /> : <XCircle className="h-3.5 w-3.5 mt-0.5" />}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-300">Step {i+1}: {step.goal.slice(0, 100)}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">{step.observation?.summary?.slice(0, 200)}</div>
                            {step.repairAttempts > 0 && <div className="text-[9px] text-amber-400 mt-0.5">🔄 Repaired {step.repairAttempts}x</div>}
                            {step.observation?.error && <div className="text-[9px] text-rose-400 mt-0.5">{step.observation.error.slice(0, 200)}</div>}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-600 shrink-0">{step.durationMs}ms</span>
                      </div>
                    </div>
                  ))}
                  {run.summary && <div className="text-[10px] font-bold text-slate-400 mt-2 border-t border-slate-800 pt-2">{run.summary}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
