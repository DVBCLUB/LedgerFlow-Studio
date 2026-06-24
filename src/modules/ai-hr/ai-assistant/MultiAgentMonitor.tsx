import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, PlayCircle, CheckCircle2, XCircle, Loader2, Clock,
  RefreshCw, Zap, AlertTriangle, Code2, TestTube, FileSearch,
  Calculator, BrainCircuit,
} from 'lucide-react';

interface AgentTask {
  id: string; role: string; goal: string; priority: string;
  dependencies: string[]; status: string; startedAt?: string;
  completedAt?: string; result?: any; error?: string;
}

interface OrchestrationPlan {
  id: string; goal: string; domain: string; tasks: AgentTask[];
  executionOrder: string[]; status: string; createdAt: string;
  completedAt?: string; summary?: string; totalLatencyMs: number;
}

const roleLabels: Record<string, string> = {
  code: 'Developer', test: 'QA Test', review: 'Code Review',
  finance: 'Finance', planner: 'Orchestrator', general: 'General',
};

const roleIcons: Record<string, typeof Code2> = {
  code: Code2, test: TestTube, review: FileSearch,
  finance: Calculator, planner: BrainCircuit, general: Zap,
};

const roleColors: Record<string, string> = {
  code: 'border-cyan-500/30 bg-cyan-950/20', test: 'border-violet-500/30 bg-violet-950/20',
  review: 'border-emerald-500/30 bg-emerald-950/20', finance: 'border-amber-500/30 bg-amber-950/20',
  planner: 'border-blue-500/30 bg-blue-950/20', general: 'border-slate-500/30 bg-slate-950/20',
};

function formatTime(iso?: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); } catch { return iso; }
}

export default function MultiAgentMonitor() {
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('coding');
  const [parallel, setParallel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<OrchestrationPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const DAEMON = 'http://127.0.0.1:3001';

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${DAEMON}/api/multi-agent/plans`).then(r => r.json()).catch(() => null);
      if (res?.ok) setPlans(res.plans || []);
    } catch { }
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [refresh]);

  const handleRun = async () => {
    if (!goal.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${DAEMON}/api/multi-agent/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, domain, parallel, maxAgents: 6 }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Orchestration: ${data.plan.status} — ${data.plan.tasks?.length || 0} agents, ${data.plan.totalLatencyMs}ms`);
        refresh();
      } else { setError(data.error || 'Failed'); }
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <Users className="h-4 w-4 text-cyan-400" /> Multi-Agent Orchestrator
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Agent Manager phân task cho team Code + Test + Review + Finance</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:border-cyan-500">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-[10px] font-bold text-rose-200 flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-[10px] font-bold text-emerald-200 flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{message}</div>}

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
        <div className="flex gap-2">
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="VD: Viết hàm kiểm tra số nguyên tố, viết test, review code" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 outline-none focus:border-cyan-500/60" onKeyDown={e => e.key === 'Enter' && handleRun()} />
          <button onClick={handleRun} disabled={loading || !goal.trim()} className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />} Orchestrate
          </button>
        </div>
        <div className="flex items-center gap-3">
          <select value={domain} onChange={e => setDomain(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-200 outline-none">
            <option value="coding">Coding</option><option value="finance">Finance</option><option value="general">General</option>
          </select>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer">
            <input type="checkbox" checked={parallel} onChange={e => setParallel(e.target.checked)} className="accent-cyan-500" /> Parallel execution
          </label>
        </div>
      </div>

      {plans.length === 0 && !loading && <div className="text-center py-8 text-xs text-slate-500">Chưa có orchestration nào. Nhập goal và bấm Orchestrate.</div>}

      {plans.map(plan => {
        const isExpanded = expandedId === plan.id;
        const successTasks = plan.tasks.filter(t => t.status === 'completed').length;
        const failedTasks = plan.tasks.filter(t => t.status === 'failed').length;
        const blockedTasks = plan.tasks.filter(t => t.status === 'blocked').length;
        return (
          <div key={plan.id} className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button onClick={() => setExpandedId(isExpanded ? null : plan.id)} className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={plan.status === 'completed' ? 'text-emerald-400' : plan.status === 'failed' ? 'text-rose-400' : 'text-cyan-400'}>
                  {plan.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : plan.status === 'failed' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-cyan-300">{plan.domain}</span>
                  </div>
                  <div className="text-xs text-slate-200 truncate max-w-[400px]">{plan.goal}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-500">{formatTime(plan.createdAt)}</span>
                    <span className="text-[9px] text-slate-600">· {(plan.totalLatencyMs/1000).toFixed(1)}s</span>
                    <span className="text-[9px] text-slate-600">· {successTasks}/{plan.tasks.length} agents OK</span>
                    {failedTasks > 0 && <span className="text-[9px] text-rose-400">· {failedTasks} failed</span>}
                    {blockedTasks > 0 && <span className="text-[9px] text-amber-400">· {blockedTasks} blocked</span>}
                  </div>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-800 p-3 space-y-2 bg-slate-950/40">
                {/* Team visualization */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {plan.tasks.map(task => {
                    const Icon = roleIcons[task.role] || Zap;
                    return (
                      <div key={task.id} className={`rounded-lg border px-2.5 py-1.5 text-[10px] ${roleColors[task.role]} flex items-center gap-1.5`}>
                        <Icon className="h-3 w-3" />
                        <span className="font-bold">{roleLabels[task.role] || task.role}</span>
                        <span className={task.status === 'completed' ? 'text-emerald-300' : task.status === 'failed' ? 'text-rose-300' : task.status === 'blocked' ? 'text-amber-300' : 'text-slate-400'}>
                          {task.status === 'completed' ? '✓' : task.status === 'failed' ? '✗' : task.status === 'blocked' ? '⏸' : '○'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Task details */}
                {plan.tasks.map((task, i) => (
                  <div key={task.id} className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {React.createElement(roleIcons[task.role] || Zap, { className: `h-3.5 w-3.5 mt-0.5 ${task.status === 'completed' ? 'text-emerald-400' : task.status === 'failed' ? 'text-rose-400' : 'text-slate-500'}` })}
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-slate-300">
                            <span className="text-slate-500">{roleLabels[task.role] || task.role}</span> · Task {i+1}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{task.goal}</div>
                          {task.result?.content && (
                            <div className="mt-1.5 rounded bg-slate-950 border border-slate-800 p-1.5 text-[9px] text-slate-400 max-h-16 overflow-auto whitespace-pre-wrap">
                              {task.result.content.slice(0, 300)}
                            </div>
                          )}
                          {task.error && <div className="text-[9px] text-rose-400 mt-0.5">{task.error.slice(0, 200)}</div>}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-600 shrink-0">{task.result?.latencyMs || 0}ms</span>
                    </div>
                  </div>
                ))}
                {plan.summary && <div className="text-[10px] font-bold text-slate-400 border-t border-slate-800 pt-2">{plan.summary}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
