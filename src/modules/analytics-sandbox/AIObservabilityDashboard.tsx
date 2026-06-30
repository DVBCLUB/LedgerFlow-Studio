import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Bot, Clock, Coins, RefreshCw, TrendingUp, Zap } from 'lucide-react';

// ─── Types (mirrors aiObservabilityService.ts) ────────────────────────────────

interface AIMetricsSummary {
  window: 'hour' | 'day' | 'week' | 'month';
  from: string; to: string;
  totalCalls: number; successCalls: number; errorCalls: number; successRate: number;
  avgLatencyMs: number; p95LatencyMs: number;
  totalTokens: number; totalCostUsd: number; totalCostVnd: number;
  costByProvider: Record<string, number>;
  callsByProvider: Record<string, number>;
  callsByAgentRole: Record<string, number>;
  latencyByProvider: Record<string, number>;
  errorsByProvider: Record<string, number>;
  topModels: Array<{ model: string; calls: number; avgLatencyMs: number; totalCostVnd: number }>;
}

interface CostTrendPoint { date: string; totalCostVnd: number; totalCalls: number; }

type WindowType = 'hour' | 'day' | 'week' | 'month';

// ─── Bar Chart (simple CSS) ───────────────────────────────────────────────────

function MiniBarChart({ data, valueKey, labelKey, color = 'cyan' }: {
  data: Array<Record<string, unknown>>;
  valueKey: string; labelKey: string; color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500', emerald: 'bg-emerald-500',
    fuchsia: 'bg-fuchsia-500', amber: 'bg-amber-500',
  };
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = Math.round((Number(item[valueKey]) / max) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-28 text-xs text-slate-400 font-semibold truncate shrink-0">{String(item[labelKey])}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${colorMap[color] || 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 text-right text-xs font-black text-white shrink-0">{Number(item[valueKey]).toLocaleString('vi-VN')}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Cost Trend Chart ─────────────────────────────────────────────────────────

function CostTrendChart({ trend }: { trend: CostTrendPoint[] }) {
  const max = Math.max(...trend.map((d) => d.totalCostVnd), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {trend.map((point) => {
        const height = Math.max(4, Math.round((point.totalCostVnd / max) * 100));
        return (
          <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full relative">
              <div
                className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all duration-500 cursor-pointer group-hover:from-cyan-500 group-hover:to-cyan-300"
                style={{ height: `${height}%` }}
                title={`${point.date}: ${point.totalCostVnd.toLocaleString('vi-VN')} ₫`}
              />
            </div>
            <span className="text-[8px] text-slate-600 font-bold rotate-45 origin-left transform translate-x-1">
              {point.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sublabel, icon: Icon, accent = 'cyan' }: {
  label: string; value: string | number; sublabel?: string; icon: React.ElementType; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-400', emerald: 'text-emerald-400',
    amber: 'text-amber-400', fuchsia: 'text-fuchsia-400', rose: 'text-rose-400',
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${accentMap[accent]}`} />
      </div>
      <div className={`text-2xl font-black ${accentMap[accent]}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs font-semibold text-slate-500">{sublabel}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIObservabilityDashboard() {
  const [summary, setSummary] = useState<AIMetricsSummary | null>(null);
  const [trend, setTrend] = useState<CostTrendPoint[]>([]);
  const [window, setWindow] = useState<WindowType>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (w: WindowType) => {
    setLoading(true);
    try {
      const [summaryRes, trendRes] = await Promise.all([
        fetch(`/api/ai-observability/summary?window=${w}`),
        fetch('/api/ai-observability/cost-trend?days=7'),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json() as AIMetricsSummary);
      if (trendRes.ok) setTrend(await trendRes.json() as CostTrendPoint[]);
      setError(null);
    } catch {
      setError('Không thể tải AI observability data. Kiểm tra kết nối server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(window); }, [window, fetchData]);

  const windows: Array<{ id: WindowType; label: string }> = [
    { id: 'hour', label: '1 giờ' }, { id: 'day', label: '24 giờ' },
    { id: 'week', label: '7 ngày' }, { id: 'month', label: '30 ngày' },
  ];

  const providerData = summary
    ? Object.entries(summary.callsByProvider).map(([provider, calls]) => ({ provider, calls })).sort((a, b) => b.calls - a.calls)
    : [];

  const roleData = summary
    ? Object.entries(summary.callsByAgentRole).map(([role, calls]) => ({ role, calls })).sort((a, b) => b.calls - a.calls).slice(0, 8)
    : [];

  const latencyData = summary
    ? Object.entries(summary.latencyByProvider).map(([provider, latency]) => ({ provider, latency })).sort((a, b) => b.latency - a.latency)
    : [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-fuchsia-950/20 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-fuchsia-300">
              <BarChart3 className="h-3.5 w-3.5" /> AI Observability
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Usage Dashboard</h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">Theo dõi latency, token usage, cost và error rate theo real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            {windows.map(({ id, label }) => (
              <button key={id} onClick={() => setWindow(id)}
                className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${window === id ? 'bg-fuchsia-400 text-slate-950' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}>
                {label}
              </button>
            ))}
            <button onClick={() => void fetchData(window)} className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-300 hover:text-white transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          <span className="text-xs">
            (Hệ thống sẽ tự động ghi metrics khi có AI call. Bắt đầu bằng cách chạy một agent hoặc pipeline.)
          </span>
        </div>
      )}

      {/* ── Core Metrics ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tổng AI Calls" value={loading ? '…' : (summary?.totalCalls ?? 0)} sublabel={`${summary?.successCalls ?? 0} thành công`} icon={Bot} accent="cyan" />
        <MetricCard label="Tỷ lệ thành công" value={loading ? '…' : `${summary?.successRate ?? 100}%`} sublabel={`${summary?.errorCalls ?? 0} lỗi`} icon={Activity} accent="emerald" />
        <MetricCard label="Avg Latency" value={loading ? '…' : `${summary?.avgLatencyMs ?? 0}ms`} sublabel={`P95: ${summary?.p95LatencyMs ?? 0}ms`} icon={Clock} accent="amber" />
        <MetricCard label="Chi phí ước tính" value={loading ? '…' : `${(summary?.totalCostVnd ?? 0).toLocaleString('vi-VN')} ₫`} sublabel={`$${(summary?.totalCostUsd ?? 0).toFixed(4)} USD`} icon={Coins} accent="fuchsia" />
      </div>

      {/* ── Cost Trend Chart ───────────────────────────────────────────────────── */}
      {trend.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <TrendingUp className="h-4 w-4 text-cyan-400" /> Chi phí 7 ngày gần nhất (VND)
          </h2>
          <CostTrendChart trend={trend} />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng 7 ngày: {trend.reduce((s, d) => s + d.totalCostVnd, 0).toLocaleString('vi-VN')} ₫</span>
            <span>Tổng calls: {trend.reduce((s, d) => s + d.totalCalls, 0)}</span>
          </div>
        </section>
      )}

      {/* ── Charts Row ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Zap className="h-4 w-4 text-emerald-400" /> Calls theo Provider
          </h2>
          {loading ? (
            <div className="animate-pulse text-center py-6 text-slate-600">Đang tải…</div>
          ) : providerData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Chưa có data. Chạy agent để bắt đầu tracking.</p>
          ) : (
            <MiniBarChart data={providerData} valueKey="calls" labelKey="provider" color="emerald" />
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Clock className="h-4 w-4 text-amber-400" /> Avg Latency theo Provider (ms)
          </h2>
          {loading ? (
            <div className="animate-pulse text-center py-6 text-slate-600">Đang tải…</div>
          ) : latencyData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Chưa có data latency.</p>
          ) : (
            <MiniBarChart data={latencyData} valueKey="latency" labelKey="provider" color="amber" />
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Bot className="h-4 w-4 text-fuchsia-400" /> Top AI Roles by Usage
          </h2>
          {loading ? (
            <div className="animate-pulse text-center py-6 text-slate-600">Đang tải…</div>
          ) : roleData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Chưa có data theo role.</p>
          ) : (
            <MiniBarChart data={roleData} valueKey="calls" labelKey="role" color="fuchsia" />
          )}
        </section>
      </div>

      {/* ── Top Models Table ───────────────────────────────────────────────────── */}
      {summary && summary.topModels.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Top Models — Chi tiết
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="py-2 pr-4 font-black text-slate-500 uppercase tracking-widest">Model</th>
                  <th className="py-2 pr-4 font-black text-slate-500 uppercase tracking-widest text-right">Calls</th>
                  <th className="py-2 pr-4 font-black text-slate-500 uppercase tracking-widest text-right">Avg Latency</th>
                  <th className="py-2 font-black text-slate-500 uppercase tracking-widest text-right">Chi phí (₫)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {summary.topModels.map((model) => (
                  <tr key={model.model} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-4 font-black text-white">{model.model}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-cyan-400">{model.calls}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-amber-400">{model.avgLatencyMs}ms</td>
                    <td className="py-2.5 text-right font-bold text-fuchsia-400">{model.totalCostVnd.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Token usage ────────────────────────────────────────────────────────── */}
      {summary && summary.totalTokens > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-white">Tổng Token đã dùng</h2>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black text-white">{summary.totalTokens.toLocaleString('vi-VN')}</div>
            <div className="text-sm text-slate-400">tokens trong {summary.window === 'hour' ? '1 giờ' : summary.window === 'day' ? '24 giờ' : summary.window === 'week' ? '7 ngày' : '30 ngày'}</div>
          </div>
        </section>
      )}
    </div>
  );
}
