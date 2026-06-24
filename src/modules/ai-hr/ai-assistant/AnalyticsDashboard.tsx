import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface AnalyticsData {
  agentPerformance: Array<{
    agent: string; totalCalls: number; successRate: number; avgLatencyMs: number;
    totalCostUsd: number; costPerCall: number; trend: string;
  }>;
  modelComparison: Array<{
    model: string; calls: number; successRate: number; costPer1KCalls: number; bestFor: string[];
  }>;
  routeAnalysis: Array<{
    route: string; calls: number; successRate: number; costSaving: number;
  }>;
  failurePatterns: Array<{
    pattern: string; agent: string; occurrences: number; recommendedFix: string;
  }>;
  usageTrend: Array<{ date: string; calls: number; cost: number; successRate: number }>;
  recommendations: string[];
  period: { days: number };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${DAEMON}/api/analytics/report?days=${days}`).then(r => r.json()).catch(() => null);
      if (r?.ok) setData(r.report);
    } catch { }
    setLoading(false);
  }, [days]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-emerald-400" /> Agent Analytics
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Phân tích hiệu suất, xu hướng, và dự báo</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-200 outline-none">
            <option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option>
          </select>
          <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:border-emerald-500">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-6 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin inline mr-1" />Loading...</div>}

      {data && data.agentPerformance.length === 0 && !loading && (
        <div className="text-center py-6 text-xs text-slate-500">Chưa có dữ liệu analytics. Hãy chạy AI Fabric vài lần để tích lũy.</div>
      )}

      {data && data.agentPerformance.length > 0 && (
        <>
          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-black uppercase text-amber-400">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="text-[10px] text-slate-300 flex gap-1.5">
                    <span className="text-amber-400 shrink-0">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent Performance */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">Agent Performance</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="text-left px-3 py-1.5">Agent</th>
                    <th className="text-right px-2 py-1.5">Calls</th>
                    <th className="text-right px-2 py-1.5">Success</th>
                    <th className="text-right px-2 py-1.5">Latency</th>
                    <th className="text-right px-2 py-1.5">Cost</th>
                    <th className="text-right px-2 py-1.5">$/call</th>
                    <th className="text-center px-2 py-1.5">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentPerformance.map(ap => (
                    <tr key={ap.agent} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                      <td className="px-3 py-1.5 font-bold text-slate-300">{ap.agent}</td>
                      <td className="text-right px-2 py-1.5 text-slate-400">{ap.totalCalls}</td>
                      <td className="text-right px-2 py-1.5">
                        <span className={ap.successRate >= 90 ? 'text-emerald-400' : ap.successRate >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                          {ap.successRate}%
                        </span>
                      </td>
                      <td className="text-right px-2 py-1.5 text-slate-400">{ap.avgLatencyMs}ms</td>
                      <td className="text-right px-2 py-1.5 text-amber-300">${ap.totalCostUsd.toFixed(4)}</td>
                      <td className="text-right px-2 py-1.5 text-slate-500">${ap.costPerCall.toFixed(6)}</td>
                      <td className="text-center px-2 py-1.5">
                        {ap.trend === 'improving' ? <TrendingUp className="h-3 w-3 text-emerald-400 inline" /> :
                         ap.trend === 'declining' ? <TrendingDown className="h-3 w-3 text-rose-400 inline" /> :
                         <Minus className="h-3 w-3 text-slate-500 inline" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Comparison */}
          {data.modelComparison.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">Model Comparison</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="text-left px-3 py-1.5">Model</th>
                      <th className="text-right px-2 py-1.5">Calls</th>
                      <th className="text-right px-2 py-1.5">Success</th>
                      <th className="text-right px-2 py-1.5">$/1K calls</th>
                      <th className="text-left px-2 py-1.5">Best for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.modelComparison.map(m => (
                      <tr key={m.model} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                        <td className="px-3 py-1.5 font-bold text-slate-300">{m.model}</td>
                        <td className="text-right px-2 py-1.5 text-slate-400">{m.calls}</td>
                        <td className="text-right px-2 py-1.5">
                          <span className={m.successRate >= 90 ? 'text-emerald-400' : m.successRate >= 70 ? 'text-amber-400' : 'text-rose-400'}>{m.successRate}%</span>
                        </td>
                        <td className="text-right px-2 py-1.5 text-amber-300">${m.costPer1KCalls.toFixed(4)}</td>
                        <td className="text-left px-2 py-1.5 text-slate-500">{m.bestFor.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Failure Patterns */}
          {data.failurePatterns.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] font-black uppercase text-rose-400">Failure Patterns</div>
              <div className="p-3 space-y-2">
                {data.failurePatterns.map((fp, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <XCircle className="h-3 w-3 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-slate-300 font-bold">{fp.pattern}</div>
                      <div className="text-slate-500">{fp.agent} · {fp.domain} · {fp.occurrences} lần</div>
                      <div className="text-amber-400 mt-0.5">Fix: {fp.recommendedFix}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
