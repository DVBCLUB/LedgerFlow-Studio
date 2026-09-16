import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, BarChart3, Briefcase, ChevronDown, ChevronRight,
  DollarSign, ShieldAlert, ShieldOff, Zap, Activity, WifiOff,
} from 'lucide-react';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { fetchAgentRuntimeMetrics, setAgentRuntimeEmergencyStop, type AgentRuntimeMetrics } from '../../utils/assistantApi';

/* ─── Types ─────────────────────────────────────────────── */
type SystemStatus = 'normal' | 'warning' | 'critical' | 'error';

/* ─── Mini Status Dot ───────────────────────────────────── */
function StatusIndicator({ status, label }: { status: SystemStatus; label: string }) {
  const dotColor: Record<SystemStatus, string> = {
    normal: 'bg-emerald-500 shadow-emerald-500/50',
    warning: 'bg-amber-500 shadow-amber-500/50',
    critical: 'bg-rose-500 shadow-rose-500/50',
    error: 'bg-red-600 shadow-red-600/50',
  };
  return (
    <div className="flex items-center gap-2" title={label}>
      <span className={`relative flex h-2.5 w-2.5 ${status === 'normal' ? '' : 'animate-pulse'}`}>
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor[status]}`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor[status]}`} />
      </span>
      <span className="text-[10px] font-semibold uppercase text-slate-400">{label}</span>
    </div>
  );
}

/* ─── Emergency Kill-Switch Panel ───────────────────────── */
function EmergencyKillSwitchPanel({ active, onClose }: { active: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleToggle = async () => {
    setLoading(true);
    try {
      await setAgentRuntimeEmergencyStop(!active, reason || undefined);
      onClose();
    } catch (err) { console.error('Failed:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-slate-900 to-red-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${active ? 'bg-red-500/30 border-red-500/50 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
            {active ? <ShieldOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase flex items-center gap-1.5">
              Emergency Kill-Switch
              {active && <span className="px-1 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[7px] border border-red-500/40 animate-pulse">ACTIVE</span>}
            </h3>
            <p className="text-[8px] text-slate-400">{active ? 'All AI agents stopped' : 'Stop all AI agents immediately'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {active ? (
            <button type="button" onClick={handleToggle} disabled={loading}
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black disabled:opacity-50 cursor-pointer">
              {loading ? '...' : 'Release'}
            </button>
          ) : (
            <button type="button" onClick={handleToggle} disabled={loading}
              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black disabled:opacity-50 cursor-pointer">
              {loading ? '...' : 'Stop All'}
            </button>
          )}
        </div>
      </div>
      {!active && (
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)..."
          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[9px] placeholder-slate-500 focus:outline-none focus:border-red-500/50" />
      )}
    </div>
  );
}

function BudgetGovernorPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const items = [
    { label: 'AI Agent Daily', current: 24.50, limit: 50.00, color: 'bg-emerald-500/60' },
    { label: 'API Credits', current: 1240, limit: 5000, color: 'bg-indigo-500/60' },
  ];
  if (collapsed) {
    return (
      <button type="button" onClick={() => setCollapsed(false)}
        className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 hover:border-emerald-500/30 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">Budget Governor</span>
          </div>
          <span className="text-[9px] text-slate-500 group-hover:text-slate-300">Show details</span>
        </div>
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-white">Budget Governor</span>
        </div>
        <button type="button" onClick={() => setCollapsed(true)}
          className="text-[9px] text-slate-500 hover:text-white cursor-pointer">Collapse</button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400">{item.label}</span>
              <span className="text-slate-300 font-semibold">${item.current.toFixed(2)} / ${item.limit.toFixed(2)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-0.5">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (item.current / item.limit) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ─── Main CEO Command Center ───────────────────────────── */
export default function CEOCommandCenter() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('normal');
  const [statusLabel, setStatusLabel] = useState('All systems nominal');
  const [showEmergency, setShowEmergency] = useState(false);
  const [budgetCollapsed, setBudgetCollapsed] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ overview: boolean; today: boolean }>({ overview: true, today: false });
  const [metrics, setMetrics] = useState<AgentRuntimeMetrics | null>(null);
  const { panelWidth, panelRef, handleRef, isResizing } = useResizablePanel({ minWidth: 280, maxWidth: 800, initialWidth: 420 });
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const m = await fetchAgentRuntimeMetrics();
        setMetrics(m);
        if (m?.emergencyStop) { setSystemStatus('critical'); setStatusLabel('EMERGENCY STOP ACTIVE'); setShowEmergency(true); }
        else if ((m?.activeRuns ?? 0) > 3) { setSystemStatus('warning'); setStatusLabel(m.activeRuns + ' active runs'); setShowEmergency(false); }
        else { setSystemStatus('normal'); setStatusLabel('All systems nominal'); setShowEmergency(false); }
      } catch { setSystemStatus('error'); setStatusLabel('Cannot connect to AI Daemon'); setShowEmergency(false); }
    };
    void checkHealth();
    const id = setInterval(checkHealth, 15000);
    return () => clearInterval(id);
  }, []);
  const activeRuns = metrics?.activeRuns ?? 0;
  const waiting = metrics?.waitingApproval ?? 0;
  const totalToday = metrics?.totalRuns ?? 0;
  const toggleSection = (key: 'overview' | 'today') => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  return (
    <div ref={panelRef} className={`relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-5 shadow-2xl backdrop-blur-xl transition-all ${isResizing ? 'select-none' : ''}`} style={{ width: panelWidth }}>
      <div ref={handleRef} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 rounded-r-3xl transition-colors" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">CEO Command Center</h2>
            <StatusIndicator status={systemStatus} label={statusLabel} />
          </div>
        </div>
        {metrics && (
          <div className="flex items-center gap-2">
            {waiting > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{waiting} pending</span>}
            {activeRuns > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{activeRuns} active</span>}
          </div>
        )}
      </div>
      <div className="space-y-3">
        <button type="button" onClick={() => toggleSection('overview')}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer">
          {expandedSections['overview'] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          System Overview
        </button>
        {expandedSections['overview'] && (
          <div className="space-y-3 animate-fade-in">
            {showEmergency && systemStatus === 'critical' && <EmergencyKillSwitchPanel active={true} onClose={() => setShowEmergency(false)} />}
            <BudgetGovernorPanel />
          </div>
        )}
        <button type="button" onClick={() => toggleSection('today')}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer">
          {expandedSections['today'] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Today's Priorities
        </button>
        {expandedSections['today'] && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-400">No urgent items &mdash; all systems nominal</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-center">
                <p className="text-lg font-black text-indigo-400 tabular-nums">{activeRuns}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active Runs</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-center">
                <p className="text-lg font-black text-emerald-400 tabular-nums">{totalToday}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Today Total</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


