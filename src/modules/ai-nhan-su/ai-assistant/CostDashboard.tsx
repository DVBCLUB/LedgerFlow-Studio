import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DollarSign, Zap, Timer, Coins, TrendingUp, RefreshCw, Loader2, BarChart3, PieChart, Layers, Cpu, Database, Cpu as CpuIcon, Bell, Wifi, WifiOff, AlertTriangle, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { fetchCostSnapshot, fetchDailyCosts, fetchTwoTierMetrics, fetchAiUnitEconomics, type CostSnapshot, type DailyCost, type TwoTierMetrics, type AiUnitEconomicsSummary } from '../../../utils/costDashboardApi';
import { useCostWebSocket, type CostUpdateMessage, type BudgetAlertMessage } from '../../../utils/useCostWebSocket';
import toast, { Toaster } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  Cell, PieChart as RechartsPie, Pie, Legend,
} from 'recharts';

const agentColors: Record<string, string> = { fabric: 'border-violet-500/30 bg-violet-950/20', 'agentic-loop': 'border-blue-500/30 bg-blue-950/20', 'multi-agent': 'border-cyan-500/30 bg-cyan-950/20', chat: 'border-amber-500/30 bg-amber-950/20' };
const routeColors: Record<string, string> = { api: 'text-amber-300', web: 'text-violet-300', local: 'text-emerald-300' };

const MODEL_CHART_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

function fmtUsd(n: number): string { return '$' + n.toFixed(4); }
function fmtUsdShort(n: number): string { return n >= 1 ? '$' + n.toFixed(2) : n >= 0.001 ? '$' + n.toFixed(4) : '$' + n.toExponential(2); }
function fmtMs(n: number): string { return n >= 1000 ? (n / 1000).toFixed(1) + 's' : n + 'ms'; }
function fmtTokens(n: number): string { return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n); }

// Custom tooltip for Recharts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-primary bg-slate-950/95 p-2.5 shadow-lg text-[10px]">
      <p className="font-bold text-text-secondary mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === 'number' ? entry.name?.includes('Cost') || entry.name?.includes('cost') ? fmtUsdShort(entry.value) : entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function CostDashboard() {
  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);
  const [daily, setDaily] = useState<DailyCost[]>([]);
  const [twoTierMetrics, setTwoTierMetrics] = useState<TwoTierMetrics | null>(null);
  const [unitEconomics, setUnitEconomics] = useState<AiUnitEconomicsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [alerts, setAlerts] = useState<BudgetAlertMessage[]>([]);
  const [showModelEfficiency, setShowModelEfficiency] = useState(false);

  // WebSocket for real-time updates
  const handleCostUpdate = useCallback((data: CostUpdateMessage) => {
    setWsConnected(true);
    // Silently update snapshot data from WebSocket
    setSnapshot(prev => prev ? {
      ...prev,
      totalCostUsd: data.totalCostUsd,
      byAgent: data.byAgent,
      byModel: data.byModel,
    } : prev);
  }, []);

  const handleBudgetAlert = useCallback((data: BudgetAlertMessage) => {
    setAlerts(prev => [data, ...prev].slice(0, 10));
  }, []);

  const ws = useCostWebSocket({
    onCostUpdate: handleCostUpdate,
    onBudgetAlert: handleBudgetAlert,
    enabled: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [snap, dly, tt, ue] = await Promise.all([
        fetchCostSnapshot(),
        fetchDailyCosts(7),
        fetchTwoTierMetrics(),
        fetchAiUnitEconomics(30),
      ]);
      if (snap) setSnapshot(snap);
      if (dly) setDaily(dly);
      if (tt) setTwoTierMetrics(tt);
      if (ue) setUnitEconomics(ue);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = wsConnected ? 30000 : 15000;
    const t = setInterval(refresh, interval);
    return () => clearInterval(t);
  }, [refresh, wsConnected]);

  const maxDailyCost = Math.max(...daily.map(d => d.cost), 0.0001);

  // Compute model-level token efficiency
  const modelEfficiencyData = React.useMemo(() => {
    if (!snapshot) return [];
    return Object.entries(snapshot.byModel).map(([model, data]) => ({
      name: model,
      cost: data.cost,
      calls: data.calls,
      tokens: data.tokens,
      costPerCall: data.calls > 0 ? data.cost / data.calls : 0,
      tokensPerCall: data.calls > 0 ? Math.round(data.tokens / data.calls) : 0,
      costPer1kTokens: data.tokens > 0 ? (data.cost / data.tokens) * 1000 : 0,
    })).sort((a, b) => b.cost - a.cost);
  }, [snapshot]);

  return (
    <div className="p-4 space-y-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            borderRadius: '10px',
            background: '#0f172a',
            color: '#e2e8f0',
            fontSize: '12px',
            border: '1px solid #334155',
          },
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-amber-400" /> Quản Trị Chi Phí &amp; Hiệu Suất AI
          </h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Theo dõi ngân sách, số lượng xử lý và hiệu quả kinh tế từng trợ lý AI</p>
        </div>
        <div className="flex items-center gap-2">
          {/* WebSocket status */}
          <span className={`flex items-center gap-1 text-[9px] ${wsConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
            {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {wsConnected ? 'Trực tiếp' : 'Tự động cập nhật'}
          </span>
          {/* Budget alerts indicator */}
          {alerts.length > 0 && (
            <button
              onClick={() => setAlerts([])}
              className="flex items-center gap-1 text-[9px] text-amber-400 hover:text-amber-300"
              title="Xóa thông báo"
            >
              <Bell className="h-3 w-3" />
              {alerts.length}
            </button>
          )}
          <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-primary px-2.5 py-1.5 text-[10px] font-bold text-text-secondary hover:border-amber-500">
            <RefreshCw className="h-3 w-3" /> Làm mới
          </button>
        </div>
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
              <div className="flex items-center gap-1.5 mb-1.5"><Zap className="h-3.5 w-3.5 text-violet-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Tổng lượt xử lý</span></div>
              <div className="text-lg font-black text-text-primary">{Object.values(snapshot.byAgent).reduce((s:number,a:any)=>s+a.calls,0)}</div>
              <div className="text-[9px] text-text-tertiary">{Object.keys(snapshot.byAgent).length} trợ lý AI</div>
            </div>
            <div className="rounded-xl border border-border-primary bg-slate-950/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Timer className="h-3.5 w-3.5 text-emerald-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Tốc độ phản hồi</span></div>
              <div className="text-lg font-black text-text-primary">{fmtMs(Object.entries(snapshot.byAgent).reduce((s, [,v])=>s+(v as any).avgLatencyMs, 0) / Math.max(1, Object.keys(snapshot.byAgent).length))}</div>
              <div className="text-[9px] text-text-tertiary">Trung bình các tác vụ</div>
            </div>
            <div className="rounded-xl border border-border-primary bg-slate-950/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Coins className="h-3.5 w-3.5 text-blue-400" /><span className="text-[10px] font-black uppercase text-text-secondary">Mô hình AI</span></div>
              <div className="text-lg font-black text-text-primary">{Object.keys(snapshot.byModel).length}</div>
              <div className="text-[9px] text-text-tertiary">Mô hình đang hoạt động</div>
            </div>
          </div>

          {/* CEO AI Unit Economics & ROI Matrix */}
          {unitEconomics && (
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white tracking-wide uppercase">
                      👑 CEO AI Unit Economics &amp; ROI Matrix
                    </h4>
                    <span className="text-[10px] text-slate-400">Đo lường hiệu quả vốn token vs. năng suất nhân sự thực tế</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                    ROI: x{unitEconomics.roiMultiplier}
                  </span>
                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    {unitEconomics.humanHoursSaved}h công thay thế
                  </span>
                </div>
              </div>

              {/* 4 Core Value KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3.5">
                <div className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Giá trị tạo ra quy đổi</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {unitEconomics.estimatedHumanCostVnd.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[8px] text-slate-500 block">Định mức ~{unitEconomics.avgHourlyRateVnd.toLocaleString('vi-VN')} đ/h</span>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Chi phí API thực tế</span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    ${unitEconomics.totalAiCostUsd} <span className="text-[9px] text-slate-400">({unitEconomics.totalAiCostVnd.toLocaleString('vi-VN')} đ)</span>
                  </span>
                  <span className="text-[8px] text-slate-500 block">{unitEconomics.totalCalls} lượt thực thi AI</span>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Lãi ròng kinh tế</span>
                  <span className="text-sm font-black text-cyan-400 font-mono">
                    +{(unitEconomics.netSavingsVnd).toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[8px] text-slate-500 block">Biên lợi nhuận &gt; 98%</span>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/60 p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Tiết kiệm nhờ Tiering</span>
                  <span className="text-sm font-black text-violet-300 font-mono">
                    +${unitEconomics.tierSavingsUsd} <span className="text-[9px] text-slate-400">({unitEconomics.tierSavingsVnd.toLocaleString('vi-VN')} đ)</span>
                  </span>
                  <span className="text-[8px] text-slate-500 block">Điều hướng Flash / Groq</span>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Phân tích theo vị trí AI Staff:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unitEconomics.byRole.map((role) => (
                    <div key={role.roleId} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px]">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3 text-cyan-400" />
                          {role.roleName}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {role.department} · {role.calls} tác vụ ({role.humanHoursSaved}h)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-300">
                          +{role.valueGeneratedVnd.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[9px] text-slate-500">
                          API: ${role.costUsd} (x{role.roiMultiplier})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Daily Cost Bar Chart (Recharts) */}
          <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-cyan-400" /> Daily Cost &amp; Calls (7 days)
              </span>
            </div>
            {daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => fmtUsdShort(v)} axisLine={false} tickLine={false} width={48} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="right" dataKey="calls" name="Calls" fill="#a78bfa" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] text-slate-600 py-4 text-center">Chưa có dữ liệu chi phí hàng ngày. Hãy chạy AI Fabric để bắt đầu theo dõi.</div>
            )}
          </div>

          {/* Daily Cost Trend Line Chart (Recharts) */}
          <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Cost Trend
              </span>
            </div>
            {daily.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => fmtUsdShort(v)} axisLine={false} tickLine={false} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[10px] text-slate-600 py-4 text-center">Cần ít nhất 2 ngày dữ liệu để hiển thị xu hướng.</div>
            )}
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

          {/* Cost Breakdown by Agent (Horizontal Bar Chart) */}
          {Object.keys(snapshot.byAgent).length > 0 && (
            <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                Cost Breakdown by Agent
              </div>
              <div className="space-y-2">
                {(() => {
                  const agents = Object.entries(snapshot.byAgent);
                  const maxCost = Math.max(...agents.map(([, d]: [string, any]) => d.cost), 0.0001);
                  return agents.map(([agent, data]: [string, any]) => {
                    const pct = (data.cost / maxCost) * 100;
                    return (
                      <div key={agent}>
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="font-bold text-text-secondary">{agent}</span>
                          <span className="text-text-tertiary">{fmtUsd(data.cost)} · {data.calls} calls · {fmtMs(data.avgLatencyMs)}</span>
                        </div>
                        <div className="w-full h-3 bg-bg-surface rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500/70 to-indigo-500/50 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Cost by Model & Token Efficiency */}
          {Object.keys(snapshot.byModel).length > 0 && (
            <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-teal-400" /> Cost by Model &amp; Token Efficiency
                </span>
              </div>
              {(() => {
                const models = Object.entries(snapshot.byModel);
                return (
                  <div className="space-y-3">
                    {/* Recharts horizontal bar for models */}
                    {models.length > 0 && (
                      <ResponsiveContainer width="100%" height={Math.max(models.length * 32, 60)}>
                        <BarChart data={models.map(([k, v]) => ({ name: k, cost: v.cost, calls: v.calls, tokens: v.tokens }))} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => fmtUsdShort(v)} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="cost" name="Cost" radius={[0, 3, 3, 0]} maxBarSize={20}>
                            {models.map((_, i) => (
                              <Cell key={i} fill={MODEL_CHART_COLORS[i % MODEL_CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {/* Token efficiency metrics table */}
                    {models.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[9px]">
                          <thead>
                            <tr className="text-text-tertiary border-b border-border-primary/50">
                              <th className="text-left py-1 pr-2">Model</th>
                              <th className="text-right px-1">Cost</th>
                              <th className="text-right px-1">Calls</th>
                              <th className="text-right px-1">Tokens</th>
                              <th className="text-right px-1">Cost/Call</th>
                              <th className="text-right px-1">Tokens/Call</th>
                              <th className="text-right pl-1">Cost/1K Tokens</th>
                            </tr>
                          </thead>
                          <tbody>
                            {models.map(([model, data]) => {
                              const costPerCall = data.calls > 0 ? data.cost / data.calls : 0;
                              const tokensPerCall = data.calls > 0 ? data.tokens / data.calls : 0;
                              const costPer1KTokens = data.tokens > 0 ? (data.cost / data.tokens) * 1000 : 0;
                              return (
                                <tr key={model} className="border-b border-border-primary/20 hover:bg-slate-900/40">
                                  <td className="py-1 pr-2 font-bold text-text-secondary truncate max-w-[80px]">{model}</td>
                                  <td className="text-right px-1 text-cyan-300">{fmtUsdShort(data.cost)}</td>
                                  <td className="text-right px-1 text-slate-400">{data.calls}</td>
                                  <td className="text-right px-1 text-slate-400">{fmtTokens(data.tokens)}</td>
                                  <td className="text-right px-1 text-violet-300">{fmtUsdShort(costPerCall)}</td>
                                  <td className="text-right px-1 text-amber-300">{Math.round(tokensPerCall).toLocaleString()}</td>
                                  <td className="text-right pl-1 text-emerald-300">{fmtUsdShort(costPer1KTokens)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 2-Tier Cost Savings Projection */}
          {twoTierMetrics && twoTierMetrics.totalRequests > 0 && (
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/15 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Cost Savings Projection
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-slate-900/50 text-center">
                  <div className="text-sm font-black text-emerald-300">{fmtUsd(twoTierMetrics.estimatedCostSavedUsd)}</div>
                  <div className="text-[9px] text-text-tertiary">Saved To Date</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 text-center">
                  <div className="text-sm font-black text-emerald-300">
                    {fmtUsd(twoTierMetrics.totalRequests > 0
                      ? (twoTierMetrics.estimatedCostSavedUsd / twoTierMetrics.totalRequests) * 100
                      : 0)}
                  </div>
                  <div className="text-[9px] text-text-tertiary">Per 100 Requests</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 text-center">
                  <div className="text-sm font-black text-amber-300">{twoTierMetrics.cheapTierRatioPct}%</div>
                  <div className="text-[9px] text-text-tertiary">Efficiency Rate</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50 text-center">
                  <div className="text-sm font-black text-violet-300">
                    {twoTierMetrics.estimatedCostSavedUsd > 0
                      ? `~${Math.round((twoTierMetrics.estimatedCostSavedUsd / (snapshot.totalCostUsd + twoTierMetrics.estimatedCostSavedUsd)) * 100)}%`
                      : '0%'}
                  </div>
                  <div className="text-[9px] text-text-tertiary">Savings vs Full Price</div>
                </div>
              </div>
              <div className="mt-2 text-[9px] text-text-tertiary">
                Cheap tier routing + caching saved an estimated {fmtUsd(twoTierMetrics.estimatedCostSavedUsd)}.
                At current rate, projected monthly savings: <span className="text-emerald-300 font-bold">
                  {fmtUsd(twoTierMetrics.estimatedCostSavedUsd * 2)}
                </span> (30d extrapolation).
              </div>
            </div>
          )}

          {/* Budget Alerts */}
          {snapshot.budgets.length > 0 && (() => {
            const alerted = snapshot.budgets.filter(b => {
              const pct = (b.currentUsd / b.monthlyLimitUsd) * 100;
              return pct > 50 && b.alerts;
            });
            if (alerted.length === 0) return null;
            return (
              <div className="rounded-xl border border-rose-800/30 bg-rose-950/15 p-3">
                <div className="text-[10px] font-black text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-rose-400" />
                  Budget Alerts
                </div>
                {alerted.map(b => {
                  const pct = Math.min(100, (b.currentUsd / b.monthlyLimitUsd) * 100);
                  const isCritical = pct > 80;
                  return (
                    <div key={b.agent} className="flex items-center gap-2 py-1.5 border-b border-rose-800/20 last:border-0">
                      <span className={`text-[9px] font-bold ${isCritical ? 'text-rose-300' : 'text-amber-300'}`}>
                        {isCritical ? '🔴' : '🟡'} {b.agent}
                      </span>
                      <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[9px] font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                        {pct.toFixed(0)}%
                      </span>
                      <span className="text-[9px] text-text-tertiary">{fmtUsd(b.currentUsd)} / {fmtUsd(b.monthlyLimitUsd)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

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

          {/* 2-Tier Metrics */}
          {twoTierMetrics && (
            <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/15 p-3">
              <div className="text-[10px] font-black text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                2-Tier AI Routing Metrics
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-base font-black text-emerald-300">{twoTierMetrics.totalRequests}</div>
                  <div className="text-[9px] text-text-tertiary">Total Requests</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-base font-black text-amber-300">{twoTierMetrics.cheapTierRatioPct}%</div>
                  <div className="text-[9px] text-text-tertiary">Cheap Tier Ratio</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-base font-black text-cyan-300">{twoTierMetrics.cacheHitRatioPct}%</div>
                  <div className="text-[9px] text-text-tertiary">Cache Hit Ratio</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-base font-black text-green-300">{fmtUsd(twoTierMetrics.estimatedCostSavedUsd)}</div>
                  <div className="text-[9px] text-text-tertiary">Cost Saved</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-sm font-black text-violet-300">{twoTierMetrics.cacheHitCount}</div>
                  <div className="text-[9px] text-text-tertiary">Cache Hits</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-900/50">
                  <div className="text-sm font-black text-rose-300">{twoTierMetrics.downgradeCount}</div>
                  <div className="text-[9px] text-text-tertiary">Downgrades</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[9px]">
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300">Cheap: {twoTierMetrics.tierCheapCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300">Balanced: {twoTierMetrics.tierBalancedCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-900/30 text-violet-300">Flagship: {twoTierMetrics.tierFlagshipCount}</span>
              </div>
            </div>
          )}

          {/* Model-Level Token Efficiency */}
          <div className="rounded-xl border border-border-primary bg-slate-950/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black text-text-secondary uppercase flex items-center gap-1.5">
                <CpuIcon className="h-3.5 w-3.5 text-cyan-400" />
                Model Token Efficiency
              </div>
              <button
                onClick={() => setShowModelEfficiency(!showModelEfficiency)}
                className="text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {showModelEfficiency ? 'Hide' : 'Show'} Breakdown
              </button>
            </div>
            {showModelEfficiency && modelEfficiencyData.length > 0 && (
              <div className="space-y-2">
                <ResponsiveContainer width="100%" height={Math.max(100, modelEfficiencyData.length * 40)}>
                  <BarChart data={modelEfficiencyData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} width={75} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="costPer1kTokens" name="Cost/1K Tokens" fill="#06b6d4" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                  {modelEfficiencyData.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/40 text-[9px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_CHART_COLORS[i % MODEL_CHART_COLORS.length] }} />
                        <span className="font-bold text-text-secondary">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-text-tertiary">
                        <span title="Total calls">{m.calls} calls</span>
                        <span title="Tokens per call">{fmtTokens(m.tokensPerCall)}/call</span>
                        <span title="Cost per 1K tokens" className="text-cyan-300">${m.costPer1kTokens.toFixed(4)}/1K</span>
                        <span title="Total cost" className="text-amber-300">{fmtUsdShort(m.cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!showModelEfficiency && (
              <div className="flex gap-2 text-[9px] text-text-tertiary">
                <span>{modelEfficiencyData.length} models tracked</span>
                <span className="text-cyan-300">
                  Best value: {modelEfficiencyData.filter(m => m.costPer1kTokens > 0).sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)[0]?.name || 'N/A'}
                </span>
              </div>
            )}
          </div>

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
