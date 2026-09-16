import React, { useEffect, useState } from 'react';
import { ShieldAlert, Zap, RotateCcw, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { getCircuitBreakers, resetCircuit, CircuitMetrics } from '../../utils/devopsApi';

const MOCK: CircuitMetrics[] = [
  { targetKey: 'llm-gateway', state: 'CLOSED', totalCalls: 18420, errorCount: 3, errorRate: 0.016, averageLatencyMs: 42, p95LatencyMs: 118, cooldownMs: 5000, consecutiveSuccesses: 812 },
  { targetKey: 'vietqr-webhook', state: 'HALF_OPEN', totalCalls: 8240, errorCount: 7, errorRate: 0.085, averageLatencyMs: 31, p95LatencyMs: 96, cooldownMs: 8000, consecutiveSuccesses: 4 },
  { targetKey: 'sqlite-cache', state: 'CLOSED', totalCalls: 51230, errorCount: 1, errorRate: 0.002, averageLatencyMs: 2, p95LatencyMs: 9, cooldownMs: 1000, consecutiveSuccesses: 51230 },
];

export default function AgentCircuitBreakerPanel() {
  const [circuits, setCircuits] = useState<CircuitMetrics[]>(MOCK);

  useEffect(() => {
    getCircuitBreakers().then((d) => {
      if (d.circuits?.length) setCircuits(d.circuits);
    }).catch(() => {});
  }, []);

  const handleReset = (key: string) => {
    resetCircuit(key).then((d) => {
      if (d.metrics) setCircuits((prev) => prev.map((c) => (c.targetKey === key ? d.metrics : c)));
    }).catch(() => {});
  };

  const activeCount = circuits.length;
  const openCount = circuits.filter((c) => c.state === 'OPEN').length;
  const halfOpenCount = circuits.filter((c) => c.state === 'HALF_OPEN').length;
  const closedCount = circuits.filter((c) => c.state === 'CLOSED').length;

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Ngắt Mạch Tự Động &amp; Cô Lập Lỗi (Agent Circuit Breaker)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fault Isolation
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Ngắt mạch tự động khi tỷ lệ lỗi vượt ngưỡng · HALF-OPEN probing · Chống hiệu ứng thác đổ lỗi giữa các service.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {closedCount}/{activeCount} Dịch Vụ Ổn Định (CLOSED)
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Dịch Vụ Giám Sát</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {activeCount} Mạch
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">LLM, Webhook, Cache</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mạch Đang Ngắt (OPEN)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">
            {openCount} Mạch
          </div>
          <p className="mt-1 text-[11px] font-medium text-rose-400">Cách ly hoàn toàn lỗi</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang Thử Nghiệm (HALF_OPEN)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {halfOpenCount} Mạch
          </div>
          <p className="mt-1 text-[11px] font-medium text-amber-400 font-mono">Probing thăm dò tự phục hồi</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mạch Thông Suốt (CLOSED)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {closedCount} Mạch
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Vận hành lưu thông 100%</p>
        </div>
      </div>

      {/* Circuit State Monitor Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Trạng Thái Mạch Dịch Vụ (Circuit State Monitor)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Auto-Healing Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Dịch Vụ Mục Tiêu</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5">Tỷ Lệ Lỗi</th>
                <th className="p-3.5">Độ Trễ TB / p95</th>
                <th className="p-3.5 text-right pr-5">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {circuits.map((c) => (
                <tr key={c.targetKey} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 pl-5 font-mono font-bold text-white">
                    <code>{c.targetKey}</code>
                    <div className="text-[10px] text-slate-500 font-normal font-sans">
                      {c.totalCalls.toLocaleString()} lượt gọi · {c.consecutiveSuccesses} thành công liên tiếp
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.state === 'CLOSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : c.state === 'OPEN'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.state === 'CLOSED' ? 'bg-emerald-400' : c.state === 'OPEN' ? 'bg-rose-400 animate-ping' : 'bg-amber-400 animate-pulse'
                        }`}
                      />
                      {c.state}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-300">
                    {(c.errorRate * 100).toFixed(2)}% ({c.errorCount} lỗi)
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">
                    {c.averageLatencyMs}ms / {c.p95LatencyMs}ms
                  </td>
                  <td className="p-3.5 text-right pr-5">
                    <button
                      type="button"
                      onClick={() => handleReset(c.targetKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Mạch</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
