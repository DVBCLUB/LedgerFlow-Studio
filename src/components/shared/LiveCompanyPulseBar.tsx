import React, { useEffect, useState } from 'react';
import { Activity, Radio, Zap, ShieldCheck, TrendingUp, Bot, AlertCircle, RefreshCw } from 'lucide-react';

interface DepartmentPulse {
  deptKey: string;
  label: string;
  healthScore: number;
  status: 'optimal' | 'attention_needed' | 'critical';
  activeTask: string;
}

interface PulseData {
  overallHealthScore: number;
  activeAgentsCount: number;
  activeWorkflowsCount: number;
  tokenVelocityPerMinute: number;
  departments: DepartmentPulse[];
  recentUrgentEvents: Array<{
    id: string;
    title: string;
    department: string;
    urgency: string;
    timestamp: string;
  }>;
}

export default function LiveCompanyPulseBar() {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentPulse | null>(null);

  useEffect(() => {
    // 1. Initial snapshot fetch
    fetch('/api/dormant/pulse/realtime-snapshot')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.pulse) {
          setPulse(data.pulse);
          setConnected(true);
        }
      })
      .catch(() => setConnected(false));

    // 2. Setup SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/company-pulse');
      eventSource.onopen = () => setConnected(true);
      eventSource.addEventListener('pulse_update', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setPulse(parsed);
          setConnected(true);
        } catch {
          // ignore parsing error
        }
      });
      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch {
      setConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  if (!pulse) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0c0d14] border border-white/8 rounded-xl text-xs text-slate-400 animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span>Đang kết nối luồng xung nhịp thời gian thực (SSE Pulse Stream)...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-[#0d0e18] via-[#111322] to-[#0d0e18] border border-white/10 rounded-2xl shadow-xl">
        {/* Left: Overall Pulse & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <Radio className={`w-4 h-4 ${connected ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            {connected && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0d14] animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase">Real-Time Pulse</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'}`}>
                {connected ? 'LIVE SSE' : 'RECONNECTING'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sức khỏe tổng thể: <strong className="text-cyan-300 font-bold">{pulse.overallHealthScore}/100</strong> • {pulse.activeAgentsCount} Agents trực tuyến
            </p>
          </div>
        </div>

        {/* Center: Department Health Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {pulse.departments.map((dept) => {
            const isSelected = selectedDept?.deptKey === dept.deptKey;
            return (
              <button
                key={dept.deptKey}
                onClick={() => setSelectedDept(isSelected ? null : dept)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                    : 'bg-white/4 hover:bg-white/8 border-white/8 text-slate-300'
                }`}
                title={dept.activeTask}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{dept.label.split(' ')[0]}</span>
                <span className="text-[10px] text-cyan-300 font-bold">{dept.healthScore}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Real-time Velocity Metrics */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1 bg-white/4 px-2.5 py-1 rounded-lg border border-white/6">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{pulse.tokenVelocityPerMinute.toLocaleString()} tk/min</span>
          </div>
          <div className="flex items-center gap-1 bg-white/4 px-2.5 py-1 rounded-lg border border-white/6">
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span>{pulse.activeWorkflowsCount} Auto-Pipelines</span>
          </div>
        </div>
      </div>

      {/* Expanded Active Task Drawer when department is clicked */}
      {selectedDept && (
        <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs text-cyan-200 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>
              <strong>{selectedDept.label}:</strong> {selectedDept.activeTask}
            </span>
          </div>
          <button
            onClick={() => setSelectedDept(null)}
            className="text-[10px] text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-cyan-500/15"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
