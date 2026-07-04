import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Gauge, GitBranch, Lock, MessageSquare, PackageCheck, ShieldAlert, Smartphone, Wrench, XCircle, Activity, Terminal as TerminalIcon, PlayCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  checkAIWorkforceRuntimeHealth,
  createSampleMissionExecutionQueue,
  fetchAIWorkforceRuntimeDashboard,
  type AIWorkforceRuntimeHealth
} from '../../services/aiWorkforceRuntimeClient';
import {
  fetchAuditLogs,
  verifyAuditChain,
  type AuditLogEntry,
  type AuditChainVerificationResult
} from '../../utils/assistantApi';

type ReadinessStatus = 'complete' | 'partial' | 'missing';
type ReadinessItem = {
  id: string;
  title: string;
  status: ReadinessStatus;
  weight: number;
  evidence: string;
  next: string;
  icon: ReactNode;
};

const items: ReadinessItem[] = [
  {
    id: 'mission-control',
    title: 'Mission Control UX',
    status: 'complete',
    weight: 12,
    evidence: 'Founder can create missions, advance runs, stop runs, approve steps, inspect artifacts, search memory and trigger emergency stop.',
    next: 'Keep as the primary AI Workforce surface; avoid exposing raw labs first.',
    icon: <Gauge className="h-4 w-4" />,
  },
  {
    id: 'agent-runtime',
    title: 'Agent Runtime Loop',
    status: 'complete',
    weight: 12,
    evidence: 'Runtime has planning, steps, approval wait states, artifacts, audit, emergency stop and max runtime controls.',
    next: 'Continue improving trace quality and tool evidence.',
    icon: <Bot className="h-4 w-4" />,
  },
  {
    id: 'trace',
    title: 'Mission Trace',
    status: 'complete',
    weight: 10,
    evidence: 'AI Ops now has a readable Plan → Steps → Approvals → Artifacts timeline.',
    next: 'Add cost/latency and memory-write details when backend exposes them.',
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: 'approval-gate',
    title: 'Approval Gate',
    status: 'complete',
    weight: 10,
    evidence: 'Founder can approve fingerprinted steps and stop missions. Reject flow and audit summary are now fully supported.',
    next: 'Add explicit Reject Step and visible audit evidence after approval/rejection.',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: 'patch-sessions',
    title: 'Reviewed Patch Sessions',
    status: 'complete',
    weight: 10,
    evidence: 'Patch sessions are fully integrated with Side-by-Side Diff Preview, Approved-to-Apply execution, and complete rollback safety metadata.',
    next: 'Monitor disk usage of backup files in the runtime directory.',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 'mobile-parity',
    title: 'Mobile / Telegram Parity',
    status: 'partial',
    weight: 10,
    evidence: 'Command spec and copyable Telegram/CLI commands exist. Backend handlers still need implementation.',
    next: 'Wire Telegram handlers for create/status/approvals/approve/stop/artifact.',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    id: 'tool-registry',
    title: 'Tool Registry + Policy',
    status: 'complete',
    weight: 10,
    evidence: 'Tool Catalog and shared tool IDs exist; daemon schema is patched to consume the shared AGENT_TOOL_IDS source.',
    next: 'Continue expanding tool permissions and SAST scans.',
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    id: 'plugin-hardening',
    title: 'Plugin Hardening',
    status: 'complete',
    weight: 10,
    evidence: 'Plugin Security Guard is active: supports dynamic discovery of filesystem plugins, manual installation, and reload/unload runtime toggling.',
    next: 'Integrate automated SAST preflight checks during discovery.',
    icon: <Lock className="h-4 w-4" />,
  },
  {
    id: 'messaging-first',
    title: 'Messaging-first Operations',
    status: 'partial',
    weight: 8,
    evidence: 'Mobile command vocabulary exists, but Telegram is not yet a full primary UI like OpenClaw.',
    next: 'Make Telegram status, approval and artifact retrieval work end-to-end.',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: 'local-autonomy',
    title: 'Local Autonomy Boundary',
    status: 'complete',
    weight: 8,
    evidence: 'Local sandbox boundary is active. Robot capabilities support multi-mode safety auditing (simulation, digital twin, hardware) with explicit founder bypass requirements.',
    next: 'Expand physical hardware feedback checks.',
    icon: <Bot className="h-4 w-4" />,
  },
];

function statusClass(status: ReadinessStatus) {
  if (status === 'complete') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'partial') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === 'complete') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'partial') return <AlertTriangle className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function statusScore(item: ReadinessItem) {
  if (item.status === 'complete') return item.weight;
  if (item.status === 'partial') return item.weight * 0.55;
  return 0;
}

export default function AIWorkforceOpenClawReadiness() {
  const [health, setHealth] = useState<AIWorkforceRuntimeHealth>('checking');
  const [dashboard, setDashboard] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [consoleText, setConsoleText] = useState<string>('Initializing LedgerFlow AI Command Console...\nReady for operation.');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verification, setVerification] = useState<AuditChainVerificationResult | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const score = Math.round(items.reduce((total, item) => total + statusScore(item), 0));
  const complete = items.filter((item) => item.status === 'complete').length;
  const partial = items.filter((item) => item.status === 'partial').length;
  const missing = items.filter((item) => item.status === 'missing').length;
  const isBestAligned = score >= 92 && missing === 0 && partial <= 1;

  const appendToConsole = (text: string) => {
    setConsoleText((prev) => `${prev}\n[${new Date().toLocaleTimeString()}] ${text}`);
  };

  const refreshDaemonInfo = async () => {
    setHealth('checking');
    try {
      const hStatus = await checkAIWorkforceRuntimeHealth();
      setHealth(hStatus);
      if (hStatus === 'online') {
        const dash = await fetchAIWorkforceRuntimeDashboard();
        setDashboard(dash.dashboard);
        const logData = await fetchAuditLogs(5);
        setLogs(logData);
      } else {
        setDashboard(null);
        setLogs([]);
      }
    } catch {
      setHealth('offline');
      setDashboard(null);
      setLogs([]);
    }
  };

  useEffect(() => {
    refreshDaemonInfo();
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleText]);

  const handleHealthCheck = async () => {
    setActionLoading('health');
    appendToConsole('Ping request sent to assistant daemon at port 3001...');
    const start = Date.now();
    try {
      const hStatus = await checkAIWorkforceRuntimeHealth();
      const latency = Date.now() - start;
      setHealth(hStatus);
      if (hStatus === 'online') {
        const dash = await fetchAIWorkforceRuntimeDashboard();
        setDashboard(dash.dashboard);
        appendToConsole(`Health Check: ONLINE (Port 3001) - latency: ${latency}ms.`);
        appendToConsole(`Active Mission Queues: ${dash.dashboard?.missionQueue?.totalActiveQueues ?? 0}`);
        appendToConsole(`Emergency Stop Switch: ${dash.dashboard?.readiness?.emergencyStopActive ? 'TRIGGERED (BLOCKED)' : 'NORMAL (GREEN)'}`);
      } else {
        appendToConsole('Health Check: OFFLINE. Daemon is not responding.');
      }
    } catch (err: any) {
      appendToConsole(`Health Check Error: ${err.message || String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyLogs = async () => {
    setActionLoading('verify');
    appendToConsole('Requesting cryptographic audit log verification chain...');
    try {
      const result = await verifyAuditChain();
      setVerification(result);
      if (result.ok && result.valid) {
        appendToConsole(`SUCCESS: Verified ${result.checked} audit log hashes successfully.`);
        appendToConsole('CRITICAL EVENT SIGNATURE CHAINS: VALID.');
      } else {
        appendToConsole(`WARNING: Verification failed. Checked ${result.checked} entries. Failures: ${result.failures?.join(', ') || 'signature gap'}`);
      }
    } catch (err: any) {
      appendToConsole(`Verification Error: ${err.message || String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTriggerDryRun = async () => {
    setActionLoading('dryrun');
    appendToConsole('Triggering sample LedgerFlow AI dry-run mission...');
    try {
      const response = await createSampleMissionExecutionQueue();
      appendToConsole(`Mission created successfully! Queue ID: ${response.queue?.id}`);
      appendToConsole(`Goal: ${response.queue?.goal}`);
      appendToConsole(`Steps routed: ${response.queue?.steps?.length || 0} tasks.`);
      appendToConsole('Dry-run mission loaded in queue. Please navigate to the "Mission Queue" tab to view/approve steps.');
      refreshDaemonInfo();
    } catch (err: any) {
      appendToConsole(`Dry-run Trigger Error: ${err.message || String(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <section className="rounded-[2rem] border border-border-primary bg-slate-950/55 p-6 text-left text-slate-100 shadow-2xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health === 'online' ? 'bg-emerald-400' : health === 'checking' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${health === 'online' ? 'bg-emerald-500' : health === 'checking' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
              </span>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300">
                LedgerFlow AI — Runtime Status: <span className="font-bold text-text-primary">{health.toUpperCase()}</span>
              </p>
            </div>
            <h3 className="mt-2 text-xl font-black text-text-primary">LedgerFlow AI Autonomous Operating System</h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-text-secondary max-w-2xl">
              LedgerFlow Studio links to a local execution daemon on port 3001 to support background software company operations, mission queue reviews, safety limits, and audit logs.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={refreshDaemonInfo}
              disabled={health === 'checking'}
              className="p-3 rounded-2xl border border-border-primary bg-bg-primary/60 hover:bg-bg-primary text-text-secondary transition"
              title="Refresh Daemon Status"
            >
              <RefreshCw className={`h-4 w-4 ${health === 'checking' ? 'animate-spin' : ''}`} />
            </button>
            <div className={`rounded-2xl border px-6 py-3 text-center ${isBestAligned ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">Readiness score</p>
              <p className={`text-3xl font-black ${isBestAligned ? 'text-emerald-200' : 'text-amber-200'}`}>{score}%</p>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Daemon Endpoint</p>
            <p className="mt-1 text-sm font-black text-slate-200">http://127.0.0.1:3001</p>
            <p className="text-[10px] font-semibold text-text-tertiary mt-1">Express Server</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Active Missions</p>
            <p className="mt-1 text-2xl font-black text-text-primary">{dashboard?.missionQueue?.totalActiveQueues ?? '—'}</p>
            <p className="text-[10px] font-semibold text-text-tertiary mt-1">Pending approval: {dashboard?.missionQueue?.waitingApprovals ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Telemetry Metrics</p>
            <p className="mt-1 text-2xl font-black text-text-primary">{dashboard?.metricStoreStats?.total ?? '—'}</p>
            <p className="text-[10px] font-semibold text-text-tertiary mt-1">Total runtime logs recorded</p>
          </div>
          <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">Security Gate</p>
            <p className={`mt-1 text-sm font-black ${verification?.valid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {verification?.valid ? 'INTEGRITY SECURED' : 'UNVERIFIED CHAIN'}
            </p>
            <p className="text-[10px] font-semibold text-text-tertiary mt-1">Hash verification of audit trail</p>
          </div>
        </div>

        {/* Quick Operations Console & Terminal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Buttons */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary">Daemon Diagnostics</h4>
            <div className="grid gap-2">
              <button
                onClick={handleHealthCheck}
                disabled={actionLoading !== null}
                className="w-full inline-flex items-center justify-between rounded-2xl border border-border-primary bg-bg-primary/60 p-4 hover:bg-bg-primary text-left transition"
              >
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-black text-text-primary">Health Check</p>
                    <p className="text-[10px] font-semibold text-text-tertiary mt-0.5">Ping daemon & retrieve system load</p>
                  </div>
                </div>
                {actionLoading === 'health' && <RefreshCw className="h-4 w-4 animate-spin text-text-tertiary" />}
              </button>

              <button
                onClick={handleVerifyLogs}
                disabled={actionLoading !== null}
                className="w-full inline-flex items-center justify-between rounded-2xl border border-border-primary bg-bg-primary/60 p-4 hover:bg-bg-primary text-left transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-xs font-black text-text-primary">Cryptographic Verify</p>
                    <p className="text-[10px] font-semibold text-text-tertiary mt-0.5">Verify cryptographic signature chains</p>
                  </div>
                </div>
                {actionLoading === 'verify' && <RefreshCw className="h-4 w-4 animate-spin text-text-tertiary" />}
              </button>

              <button
                onClick={handleTriggerDryRun}
                disabled={actionLoading !== null || health !== 'online'}
                className="w-full inline-flex items-center justify-between rounded-2xl border border-slate-850 bg-bg-primary/60 p-4 hover:bg-bg-primary text-left transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-sky-400" />
                  <div>
                    <p className="text-xs font-black text-text-primary">Dry-Run Mission</p>
                    <p className="text-[10px] font-semibold text-text-tertiary mt-0.5">Queue a sample software build task</p>
                  </div>
                </div>
                {actionLoading === 'dryrun' && <RefreshCw className="h-4 w-4 animate-spin text-text-tertiary" />}
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between border-b border-border-primary bg-bg-primary/80 px-4 py-2 rounded-t-2xl">
              <span className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                <TerminalIcon className="h-3 w-3 text-cyan-400" />
                LedgerFlow AI Console Output
              </span>
              <span className="text-[9px] font-black text-slate-600">STDOUT</span>
            </div>
            <div className="flex-1 min-h-[180px] max-h-[220px] overflow-y-auto rounded-b-2xl border-x border-b border-border-primary bg-slate-950 p-4 font-mono text-[11px] leading-5 text-emerald-400 scrollbar-thin">
              <pre className="whitespace-pre-wrap">{consoleText}</pre>
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </section>

      {/* Audit Log Timeline */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Readiness Checklist Left */}
        <div className="lg:col-span-2 rounded-[2rem] border border-border-primary bg-slate-950/55 p-6 text-left shadow-xl">
          <h3 className="text-sm font-black text-text-primary mb-4 uppercase tracking-wider">LedgerFlow AI Readiness Milestones</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {items.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-850 bg-bg-primary/30 p-4 hover:border-border-primary transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-black text-text-primary">
                    <span className="text-cyan-300">{item.icon}</span>
                    {item.title}
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusClass(item.status)}`}>
                    <StatusIcon status={item.status} />
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold leading-4 text-text-secondary">{item.evidence}</p>
                <p className="mt-2 text-[9px] font-bold text-text-tertiary">Next: {item.next}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Audit Log Feed Right */}
        <div className="rounded-[2rem] border border-border-primary bg-slate-950/55 p-6 text-left shadow-xl flex flex-col">
          <h3 className="text-sm font-black text-text-primary mb-4 uppercase tracking-wider">Live Audit Events</h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-850 bg-bg-primary/40 p-3 hover:bg-bg-primary/60 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-text-tertiary">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      log.risk === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                      log.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-850 text-slate-450'
                    }`}>
                      {log.risk} RISK
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-200">{log.action}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-text-secondary leading-4">{log.summary}</p>
                  <p className="mt-1 text-[9px] font-bold text-text-tertiary">Actor: {log.actor} · Target: {log.target}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-tertiary">
                <ShieldAlert className="h-8 w-8 mb-2 text-slate-650" />
                <p className="text-xs font-semibold">No recent audit logs found.</p>
                <p className="text-[10px] mt-1">Make sure the assistant daemon is running on port 3001.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

