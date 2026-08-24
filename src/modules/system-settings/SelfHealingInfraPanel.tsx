import React, { useEffect, useState } from 'react';
import {
  Activity,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface InfraHealthIndicator {
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'HEALED';
  metricName: string;
  currentValue: string;
  threshold: string;
  lastHealedAt?: string;
  healingActionTaken?: string;
}

export interface SelfHealingStatus {
  overallSystemHealth: number;
  uptimeHours: number;
  totalAutoHealedEvents: number;
  indicators: InfraHealthIndicator[];
  recentHealingLogs: Array<{
    logId: string;
    timestamp: string;
    targetComponent: string;
    incident: string;
    actionExecuted: string;
    durationMs: number;
    result: 'SUCCESS' | 'RECOVERED';
  }>;
}

export default function SelfHealingInfraPanel() {
  const [status, setStatus] = useState<SelfHealingStatus | null>(null);
  const [healing, setHealing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/dormant/infra/self-healing/status');
      const data = await res.json();
      if (data?.success && data?.status) {
        setStatus(data.status);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerCycle = async () => {
    setHealing(true);
    try {
      await fetch('/api/dormant/infra/self-healing/trigger', { method: 'POST' });
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setHealing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">🩺 Autonomous Self-Healing Infrastructure &amp; Zero-Downtime Engine</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              99.98% Uptime
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động giám sát contention file khóa SQLite, rò rỉ bộ nhớ heap, và chuyển mạch Circuit Breaker khi API AI chạm rate-limit.
          </p>
        </div>

        <button
          onClick={handleTriggerCycle}
          disabled={healing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${healing ? 'animate-spin' : ''}`} />
          <span>{healing ? 'Đang tối ưu hạ tầng...' : '⚡ Kích Hoạt Tự Dọn Dẹp & Sửa Lỗi'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Sức Khỏe Toàn Diện</div>
            <div className="text-xl font-black text-emerald-400 mt-1">{status.overallSystemHealth}%</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Không có tiến trình bị treo</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Thời Gian Hoạt Động (Uptime)</div>
            <div className="text-xl font-black text-cyan-300 mt-1">{status.uptimeHours} Giờ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Zero-Downtime Hot Patching</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Sự Cố Đã Tự Khắc Phục</div>
            <div className="text-xl font-black text-purple-300 mt-1">{status.totalAutoHealedEvents} Tác vụ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Đã giải phóng bộ nhớ &amp; socket</div>
          </div>
        </div>
      )}

      {/* Indicators Grid */}
      {status && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Chỉ Số Giám Sát Chủ Động</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {status.indicators.map((ind, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-white/8 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{ind.component}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    {ind.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">{ind.metricName}:</span>
                  <span className="font-mono text-cyan-300">{ind.currentValue} (Ngưỡng: {ind.threshold})</span>
                </div>
                {ind.healingActionTaken && (
                  <div className="text-[11px] text-slate-400 italic">
                    Hành động gần nhất: {ind.healingActionTaken}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Healing Logs Feed */}
      {status && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Nhật Ký Tự Phục Hồi (Self-Healing Action Log)</h3>
          <div className="space-y-2">
            {status.recentHealingLogs.map((log) => (
              <div key={log.logId} className="p-3 rounded-xl bg-white/2 border border-white/6 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.targetComponent}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-slate-400">{log.actionExecuted}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                  {log.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
