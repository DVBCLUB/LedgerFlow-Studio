const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', 'src', 'components', 'command', 'CEOCommandCenter.tsx');

const p1 = `import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, BarChart3, Briefcase, ChevronDown, ChevronRight, DollarSign, ShieldAlert, Zap, Activity, WifiOff } from 'lucide-react';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import { fetchAgentRuntimeMetrics, setAgentRuntimeEmergencyStop } from '../../utils/assistantApi';

type SystemStatus = 'normal' | 'warning' | 'critical' | 'error';

function StatusDot({ status, pulse = false }: { status: SystemStatus; pulse?: boolean }) {
  const colors = {
    normal: 'bg-emerald-500 shadow-emerald-500/50',
    warning: 'bg-amber-500 shadow-amber-500/50',
    critical: 'bg-rose-500 shadow-rose-500/50',
    error: 'bg-red-600 shadow-red-600/50',
  };
  return (
    <span className={\x60relative flex h-2 w-2 \x24{pulse ? 'animate-pulse' : ''}\x60}>
      <span className={\x60absolute inline-flex h-full w-full rounded-full opacity-75 \x24{colors[status]}\x60} />
      <span className={\x60relative inline-flex rounded-full h-2 w-2 \x24{colors[status]}\x60} />
    </span>
  );
}

export default function CEOCommandCenter() {
  const [metrics, setMetrics] = useState(null);
  const [offline, setOffline] = useState(false);
  const [expanded, setExpanded] = useState({ overview: true });
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

  const systemStatus = offline ? 'error' : metrics?.emergencyStop ? 'critical' : (metrics?.activeRuns ?? 0) > 0 ? 'warning' : 'normal';
  const statusLabel = offline ? 'Daemon Offline' : metrics?.emergencyStop ? 'EMERGENCY STOP' : 'Hoạt động';
  const activeRuns = metrics?.activeRuns ?? 0;
  const waiting = metrics?.waitingApproval ?? 0;
  const totalToday = metrics?.totalRuns ?? 0;

  const toggleSection = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

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
`;
fs.writeFileSync(target, p1, 'utf-8');
console.log('p1 written, len=' + p1.length);
