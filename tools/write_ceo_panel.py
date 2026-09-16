# Part 1 - write CEOCommandCenter.tsx (header + imports + types + statusDot)
import os

content = """import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, BarChart3, Briefcase, ChevronDown, ChevronRight, DollarSign, ShieldAlert, Zap, Activity, WifiOff } from 'lucide-react';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { fetchAgentRuntimeMetrics, setAgentRuntimeEmergencyStop } from '../../utils/assistantApi';

type SystemStatus = 'normal' | 'warning' | 'critical' | 'error';

function StatusDot({ status, pulse = false }: { status: SystemStatus; pulse?: boolean }) {
  const colors: Record<SystemStatus, string> = {
    normal: 'bg-emerald-500 shadow-emerald-500/50',
    warning: 'bg-amber-500 shadow-amber-500/50',
    critical: 'bg-rose-500 shadow-rose-500/50',
    error: 'bg-red-600 shadow-red-600/50',
  };
  return (
    <span className={""" + '`' + """relative flex h-2 w-2 ${pulse ? 'animate-pulse' : ''}""" + '`' + """}>
      <span className={""" + '`' + """absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}""" + '`' + """} />
      <span className={""" + '`' + """relative inline-flex rounded-full h-2 w-2 ${colors[status]}""" + '`' + """} />
    </span>
  );
}

export default function CEOCommandCenter() {
  const [metrics, setMetrics] = useState<{ activeRuns: number; waitingApproval: number; totalRuns: number; emergencyStop: boolean } | null>(null);
  const [offline, setOffline] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ overview: true });
  const [budgetCollapsed, setBudgetCollapsed] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [reason, setReason] = useState('');

  const { panelWidth, panelRef, handleRef, isResizing } = useResizablePanel({ minWidth: 240, maxWidth: 640, initialWidth: 380 });

  const poll = useCallback(async () => {
    try {
      const m = await fetchAgentRuntimeMetrics();
      setMetrics(m);
      setOffline(false);
      if (m?.emergencyStop) setShowEmergency(true);
      setEmergencyActive(m?.emergencyStop ?? false);
    } catch { setOffline(true); }
  }, []);

  useEffect(() => { void poll(); const id = setInterval(poll, 15000); return () => clearInterval(id); }, [poll]);

  const systemStatus: SystemStatus = offline ? 'error' : metrics?.emergencyStop ? 'critical' : (metrics?.activeRuns ?? 0) > 0 ? 'warning' : 'normal';
  const statusLabel = offline ? 'Daemon Offline' : metrics?.emergencyStop ? 'EMERGENCY STOP' : 'Ho\\u1ea1t \\u0111\\u1ed9ng';
  const activeRuns = metrics?.activeRuns ?? 0;
  const waiting = metrics?.waitingApproval ?? 0;
  const totalToday = metrics?.totalRuns ?? 0;

  const toggleSection = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleToggleEmergency = async () => {
    setEmergencyLoading(true);
    try {
      await setAgentRuntimeEmergencyStop(!emergencyActive, reason || undefined);
      setEmergencyActive(!emergencyActive);
      setShowEmergency(false);
      setReason('');
    } catch (err) { console.error('Failed to toggle emergency stop:', err); }
    finally { setEmergencyLoading(false); }
  };

  const SectionHeader = ({ id, label, icon: Icon }: { id: string; label: string; icon: React.ElementType }) => (
    <button type="button" onClick={() => toggleSection(id)}
      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer w-full text-left">
      {expanded[id] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
      <Icon className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={panelRef} className={""" + '`' + """relative rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/20 p-5 shadow-2xl backdrop-blur-xl transition-all ${isResizing ? 'select-none' : ''}""" + '`' + """} style={{ width: panelWidth }}>
      <div ref={handleRef} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 rounded-r-3xl transition-colors" />
"""

target = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'src', 'components', 'command', 'CEOCommandCenter.tsx'))
with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
print('Part 1 written')
