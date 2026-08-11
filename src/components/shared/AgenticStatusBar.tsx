import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Activity, WifiOff } from 'lucide-react';
import { fetchAgentRuntimeMetrics, type AgentRuntimeMetrics } from '../../utils/assistantApi';

// Polling interval: 15 giây để không làm nặng backend
const POLL_INTERVAL_MS = 15_000;

export default function AgenticStatusBar() {
  const [metrics, setMetrics] = useState<AgentRuntimeMetrics | null>(null);
  const [offline, setOffline] = useState(false);

  const poll = useCallback(async () => {
    try {
      const m = await fetchAgentRuntimeMetrics();
      setMetrics(m);
      setOffline(false);
    } catch {
      // Daemon chưa chạy hoặc lỗi mạng — hiển thị offline âm thầm
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  // Trạng thái dẫn xuất từ dữ liệu thực
  const activeRuns  = metrics?.activeRuns ?? 0;
  const waiting     = metrics?.waitingApproval ?? 0;
  const totalToday  = metrics?.totalRuns ?? 0;
  const emergStop   = metrics?.emergencyStop ?? false;
  const busy        = activeRuns > 0 || waiting > 0;
  const danger      = emergStop;

  // Màu sắc theo trạng thái
  const dotColor  = danger ? '#f87171' : busy ? '#818cf8' : '#34d399';
  const ringColor = danger ? '#ef4444' : busy ? '#6366f1' : '#10b981';
  const bgStyle   = danger
    ? 'rgba(239,68,68,0.08)'
    : busy
    ? 'rgba(99,102,241,0.08)'
    : 'rgba(255,255,255,0.04)';
  const borderStyle = danger
    ? '1px solid rgba(239,68,68,0.30)'
    : busy
    ? '1px solid rgba(99,102,241,0.25)'
    : '1px solid rgba(255,255,255,0.08)';

  // Tooltip đầy đủ
  const tooltipLines = metrics
    ? [
        `Agent Runtime — dữ liệu thực`,
        `Active runs: ${activeRuns}`,
        `Chờ phê duyệt: ${waiting}`,
        `Tổng hôm nay: ${totalToday}`,
        emergStop ? '⛔ EMERGENCY STOP đang bật' : '',
      ].filter(Boolean).join('\n')
    : offline
    ? 'Daemon chưa chạy — npm run dev'
    : 'Đang kết nối...';

  if (offline) {
    return (
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        title="Daemon chưa chạy — npm run dev"
      >
        <WifiOff className="h-3 w-3 text-slate-600" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">offline</span>
      </div>
    );
  }

  return (
    <div
      className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-default transition-all duration-500"
      style={{ background: bgStyle, border: borderStyle }}
      title={tooltipLines}
    >
      {/* Pulse dot — màu thực theo trạng thái */}
      <div className="relative flex h-2 w-2 shrink-0">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: dotColor }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: ringColor }}
        />
      </div>

      {/* Icon + metrics thực */}
      <div className="flex items-center gap-2">
        {danger ? (
          <Zap className="h-3 w-3 text-red-400" />
        ) : busy ? (
          <Zap className="h-3 w-3 text-indigo-400" />
        ) : (
          <Activity className="h-3 w-3 text-emerald-500/70" />
        )}

        <span
          className="text-[10px] font-semibold uppercase tracking-wider tabular-nums"
          style={{ color: danger ? '#fca5a5' : busy ? '#a5b4fc' : '#6b7280' }}
        >
          {metrics
            ? activeRuns > 0
              ? `${activeRuns} running`
              : waiting > 0
              ? `${waiting} pending`
              : `${totalToday} runs`
            : '—'}
        </span>

        {/* Badge chờ phê duyệt nổi bật */}
        {waiting > 0 && !danger && (
          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {waiting} cần duyệt
          </span>
        )}

        {danger && (
          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
            ⛔ STOP
          </span>
        )}
      </div>
    </div>
  );
}
