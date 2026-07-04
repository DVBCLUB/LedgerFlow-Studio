import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, Zap, Timer, Coins, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface Snapshot {
  totalCostUsd: number;
  byAgent: Record<string, { cost: number; calls: number; avgLatencyMs: number }>;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  byRoute: Record<string, { cost: number; calls: number }>;
  byDomain: Record<string, { cost: number; calls: number }>;
  recentRecords: Array<{
    id: string; agent: string; model: string; route: string;
    costUsd: number; latencyMs: number; success: boolean; taskSummary: string; recordedAt: string;
  }>;
  budgets: Array<{ agent: string; monthlyLimitUsd: number; currentUsd: number; resetDay: number; alerts: boolean }>;
}

interface DailyCost { date: string; cost: number; calls: number; }

const agentColors: Record<string, string> = { fabric: 'border-violet-500/30 bg-violet-950/20', 'agentic-loop': 'border-blue-500/30 bg-blue-950/20', 'multi-agent': 'border-cyan-500/30 bg-cyan-950/20', chat: 'border-amber-500/30 bg-amber-950/20' };
const routeColors: Record<string, string> = { api: 'text-amber-300', web: 'text-violet-300', local: 'text-emerald-300' };

function fmtUsd(n: number): string { return '$' + n.toFixed(4); }
function fmtMs(n: number): string { return n >= 1000 ? (n / 1000).toFixed(1) + 's' : n + 'ms'; }

export default function CostDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [daily, setDaily] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [snap, dly] = await Promise.all([
        fetch(`${DAEMON}/api/cost/snapshot`).then(r => r.json()).catch(() => null),
        fetch(`${DAEMON}/api/cost/daily?days=7`).then(r => r.json()).catch(() => null),
      ]);
      if (snap?.ok) setSnapshot(snap.snapshot);
      if (dly?.ok) setDaily(dly.daily);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);

  const maxDailyCost = Math.max(...daily.map(d => d.cost), 0.0001);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-amber-400" /> AI Cost Dashboard
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Theo dõi chi phí, token usage, và hiệu suất từng agent/model</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:border-amber-500">
          <RefreshCw className="h-3 w-3" /> Refresh 10s
        </button>
      </div>

      {loading && !snapshot && <div className="text-center py-6 text-xs text-text-tertiary"><Loader2 className="h-4 w-4 animate-spin inline mr-1" />Đang tải...</div>}

      {snapshot && (
        <>
          {/* Top cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-amber-800/30 bg-amber-950/15 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><DollarSign className="h-3.5 w-3.5 text-amber-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Tổng chi phí</span></div>
              <div className="text-lg font-black text-amber-300">{fmtUsd(snapshot.totalCostUsd)}</div>
              <div className="text-[9px] text-text-tertiary">30 ngày qua</div>
            </div>
            <div className="rounded-xl border border-border-primary bg-slate-950/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Zap className="h-3.5 w-3.5 text-violet-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Tổng calls</span></div>
              <div className="text-lg font-black text-text-primary">{Object.values(snapshot.byAgent).reduce((s:number,a:any)=>s+a.calls,0)}</div>
              <div className="text-[9px] text-text-tertiary">{Object.keys(snapshot.byAgent).length} agents</div>
            </div>
            <div className="rounded-xl border border-border-primary bg-slate-950/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Timer className="h-3.5 w-3.5 text-emerald-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Avg latency</span></div>
              <div className="text-lg font-black text-text-primary">{fmtMs(Object.entries(snapshot.byAgent).reduce((s, [,v])=>s+(v as any).avgLatencyMs, 0) / Math.max(1, Object.keys(snapshot.byAgent).length))}</div>
              <div className="text-[9px] text-text-tertiary">TB các agent</div>
            </div>
            <div className="rounded-xl border border-border-primary bg-slate-950/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Coins className="h-3.5 w-3.5 text-blue-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Models</span></div>
              <div className="text-lg font-black text-text-primary">{Object.keys(snapshot.byModel).length}</div>
              <div className="text-[9px] text-text-tertiary">providers active</div>
            </div>
          </div>

          {/* Daily chart (CSS bar) */}
          <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
            <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Daily Cost (7 days)</div>
            <div className="flex items-end gap-1.5 h-28">
              {daily.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[8px] text-text-tertiary">{d.cost > 0 ? fmtUsd(d.cost) : ''}</span>
                  <div className="w-full bg-amber-500/60 rounded-t" style={{ height: `${(d.cost / maxDailyCost) * 80}px`, minHeight: d.cost > 0 ? '4px' : '0' }} />
                  <span className="text-[7px] text-slate-600">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Agent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2">By Agent</div>
              {Object.entries(snapshot.byAgent).map(([agent, data]: [string, any]) => (
                <div key={agent} className="flex items-center justify-between py-1 text-[10px] border-b border-border-primary/50 last:border-0">
                  <span className="font-bold text-text-secondary">{agent}</span>
                  <span className="text-amber-300">{fmtUsd(data.cost)}</span>
                  <span className="text-text-tertiary">{data.calls} calls</span>
                  <span className="text-slate-600">{fmtMs(data.avgLatencyMs)}</span>
                </div>
              ))}
              {Object.keys(snapshot.byAgent).length === 0 && <div className="text-[10px] text-slate-600 py-2">Chưa có dữ liệu.</div>}
            </div>

            {/* By Model */}
            <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2">By Model</div>
              {Object.entries(snapshot.byModel).map(([model, data]: [string, any]) => (
                <div key={model} className="flex items-center justify-between py-1 text-[10px] border-b border-border-primary/50 last:border-0">
                  <span className="font-bold text-text-secondary">{model}</span>
                  <span className="text-amber-300">{fmtUsd(data.cost)}</span>
                  <span className="text-text-tertiary">{data.calls} calls</span>
                  <span className="text-slate-600">{(data.tokens/1000).toFixed(1)}K tok</span>
                </div>
              ))}
              {Object.keys(snapshot.byModel).length === 0 && <div className="text-[10px] text-slate-600 py-2">Chưa có dữ liệu.</div>}
            </div>
          </div>

          {/* By Route */}
          <div className="flex flex-wrap gap-2 text-[9px] font-bold">
            {Object.entries(snapshot.byRoute).map(([route, data]: [string, any]) => (
              <span key={route} className="rounded-full border border-border-secondary bg-bg-primary px-2.5 py-1 flex items-center gap-1.5">
                <span className={routeColors[route] || 'text-text-secondary'}>{route}</span>
                <span className="text-text-tertiary">{fmtUsd(data.cost)} · {data.calls} calls</span>
              </span>
            ))}
          </div>

          {/* Budgets */}
          {snapshot.budgets.length > 0 && (
            <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Agent Budgets</div>
              {snapshot.budgets.map(b => {
                const pct = Math.min(100, (b.currentUsd / b.monthlyLimitUsd) * 100);
                return (
                  <div key={b.agent} className="mb-2 last:mb-0">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="font-bold text-text-secondary">{b.agent}</span>
                      <span className={pct > 80 ? 'text-rose-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400'}>
                        {fmtUsd(b.currentUsd)} / {fmtUsd(b.monthlyLimitUsd)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent records */}
          <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3 max-h-64 overflow-y-auto">
            <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Recent Calls</div>
            {snapshot.recentRecords.slice(0, 10).map(r => (
              <div key={r.id} className="flex items-center justify-between py-1 text-[9px] border-b border-border-primary/50 last:border-0">
                <span className="text-text-tertiary w-16 shrink-0">{r.recordedAt?.slice(11, 19) || '—'}</span>
                <span className="font-bold text-text-secondary w-16">{r.agent}</span>
                <span className="text-text-tertiary w-16">{r.model}</span>
                <span className={r.success ? 'text-emerald-400 w-12' : 'text-rose-400 w-12'}>{r.success ? fmtUsd(r.costUsd) : 'FAIL'}</span>
                <span className="text-slate-600 w-12">{fmtMs(r.latencyMs)}</span>
                <span className="text-text-tertiary truncate max-w-[120px]">{r.taskSummary}</span>
              </div>
            ))}
            {snapshot.recentRecords.length === 0 && <div className="text-[10px] text-slate-600 py-2">Chưa có cuộc gọi AI nào được ghi nhận. Hãy chạy AI Fabric để bắt đầu theo dõi.</div>}
          </div>
        </>
      )}
    </div>
  );
}
