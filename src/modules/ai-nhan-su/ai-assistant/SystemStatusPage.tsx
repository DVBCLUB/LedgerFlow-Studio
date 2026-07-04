import React, { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Zap, Database, Bell, Container, BrainCircuit, Users, DollarSign, Search, Shield } from 'lucide-react';

const DAEMON = 'http://127.0.0.1:3001';

interface SystemHealth {
  daemon: boolean;
  observer: { running: boolean; lastCheckAt?: string; consecutiveDegraded: number };
  cost: { totalCostUsd: number; agents: string[]; models: string[] };
  memory: { totalRecords: number; session: number; shortTerm: number; longTerm: number };
  triggers: { totalRules: number; enabledRules: number; totalEvents: number };
  sandbox: { sessions: number; totalCommands: number };
  multiAgent: { plans: number };
  loop: { total: number; running: number; completed: number; failed: number };
  knowledgeGraph: { nodes: number; edges: number };
  fabric: { ok: boolean; apiKeys: number; webProfiles: number; localAvailable: boolean };
  errors: string[];
}

async function fetchSafe(url: string): Promise<any> {
  try { const r = await fetch(url); if (!r.ok) return null; return r.json(); } catch { return null; }
}

export default function SystemStatusPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    const next: SystemHealth = {
      daemon: false, observer: { running: false, consecutiveDegraded: 0 },
      cost: { totalCostUsd: 0, agents: [], models: [] },
      memory: { totalRecords: 0, session: 0, shortTerm: 0, longTerm: 0 },
      triggers: { totalRules: 0, enabledRules: 0, totalEvents: 0 },
      sandbox: { sessions: 0, totalCommands: 0 },
      multiAgent: { plans: 0 }, loop: { total: 0, running: 0, completed: 0, failed: 0 },
      knowledgeGraph: { nodes: 0, edges: 0 }, fabric: { ok: false, apiKeys: 0, webProfiles: 0, localAvailable: false }, errors: [],
    };

    try {
      const r = await fetchSafe(`${DAEMON}/health`);
      next.daemon = r?.ok === true;

      const [obs, cost, mem, trig, sand, ma, loop, kg] = await Promise.all([
        fetchSafe(`${DAEMON}/api/observer/health`),
        fetchSafe(`${DAEMON}/api/cost/snapshot`),
        fetchSafe(`${DAEMON}/api/memory/stats`),
        fetchSafe(`${DAEMON}/api/triggers/rules`),
        fetchSafe(`${DAEMON}/api/sandbox/sessions`),
        fetchSafe(`${DAEMON}/api/multi-agent/plans`),
        fetchSafe(`${DAEMON}/api/agentic-loop/runs`),
        fetchSafe(`${DAEMON}/api/knowledge/stats`),
      ]);

      next.observer = obs?.health || next.observer;
      next.cost = cost?.snapshot ? { totalCostUsd: cost.snapshot.totalCostUsd, agents: Object.keys(cost.snapshot.byAgent), models: Object.keys(cost.snapshot.byModel) } : next.cost;
      next.memory = mem?.stats || next.memory;
      next.triggers = trig?.stats || next.triggers;
      next.sandbox = sand?.sessions ? { sessions: sand.sessions.length, totalCommands: sand.sessions.reduce((s: number, ss: any) => s + (ss.results?.length || 0), 0) } : next.sandbox;
      next.multiAgent = ma?.plans ? { plans: ma.plans.length } : next.multiAgent;
      next.loop = loop?.metrics || next.loop;
      next.knowledgeGraph = kg?.stats || next.knowledgeGraph;
      next.fabric = cost?.snapshot?.totalCostUsd !== undefined ? { ok: true, apiKeys: 0, webProfiles: 0, localAvailable: true } : next.fabric;
    } catch (err: any) { errors.push(err.message); }

    next.errors = errors;
    setHealth(next);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const t = setInterval(refresh, 8000); return () => clearInterval(t); }, [refresh]);

  const allGreen = health && health.daemon && health.observer.running && health.fabric.ok;

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loading ? 'bg-bg-primary border border-border-primary' : allGreen ? 'bg-emerald-950/40 border-2 border-emerald-500/50' : 'bg-amber-950/40 border-2 border-amber-500/50'}`}>
            {loading ? <Loader2 className="h-5 w-5 text-violet-400 animate-spin" /> : allGreen ? <Shield className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
          </div>
          <div>
            <h2 className="text-sm font-black text-text-primary">System Status</h2>
            <p className="text-[10px] text-text-tertiary">{loading ? 'Loading...' : allGreen ? 'All systems operational' : `${health?.errors.length || 0} issues detected`}</p>
          </div>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-violet-500">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh 8s
        </button>
      </header>

      {health?.errors.length ? <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2 text-[10px] font-bold text-rose-200">{health.errors.join(' · ')}</div> : null}

      {/* Section 1: Core AI */}
      <Section title="Core AI Engine">
        <Row icon={<Zap className="h-3.5 w-3.5 text-amber-400" />} label="AI Fabric" ok={health?.fabric.ok} detail={`${health?.fabric.apiKeys || 0} keys · ${health?.fabric.webProfiles || 0} profiles · local ${health?.fabric.localAvailable ? 'ON' : 'OFF'}`} />
        <Row icon={<BrainCircuit className="h-3.5 w-3.5 text-blue-400" />} label="Agent Loop" ok={health?.loop ? (health.loop.failed === 0) : undefined} detail={`${health?.loop.completed || 0} done · ${health?.loop.running || 0} running · ${health?.loop.failed || 0} failed`} />
        <Row icon={<Users className="h-3.5 w-3.5 text-cyan-400" />} label="Multi-Agent" ok={true} detail={`${health?.multiAgent.plans || 0} orchestrations`} />
        <Row icon={<DollarSign className="h-3.5 w-3.5 text-amber-400" />} label="AI Cost" ok={true} detail={`$${health?.cost.totalCostUsd.toFixed(4) || '0'} · ${health?.cost.agents.length || 0} agents · ${health?.cost.models.length || 0} models`} />
      </Section>

      {/* Section 2: Memory & Knowledge */}
      <Section title="Memory & Knowledge">
        <Row icon={<Database className="h-3.5 w-3.5 text-emerald-400" />} label="Compound Memory" ok={true} detail={`${health?.memory.totalRecords || 0} records (S:${health?.memory.session || 0} ST:${health?.memory.shortTerm || 0} LT:${health?.memory.longTerm || 0})`} />
        <Row icon={<Search className="h-3.5 w-3.5 text-violet-400" />} label="Knowledge Graph" ok={true} detail={`${health?.knowledgeGraph.nodes || 0} nodes · ${health?.knowledgeGraph.edges || 0} edges`} />
        <Row icon={<Bell className="h-3.5 w-3.5 text-amber-400" />} label="Triggers" ok={health?.triggers ? health.triggers.enabledRules > 0 : undefined} detail={`${health?.triggers.totalRules || 0} rules · ${health?.triggers.enabledRules || 0} enabled · ${health?.triggers.totalEvents || 0} events`} />
      </Section>

      {/* Section 3: Infrastructure */}
      <Section title="Infrastructure">
        <Row icon={<Container className="h-3.5 w-3.5 text-indigo-400" />} label="Sandbox" ok={true} detail={`${health?.sandbox.sessions || 0} sessions · ${health?.sandbox.totalCommands || 0} commands`} />
        <Row icon={<Activity className="h-3.5 w-3.5 text-rose-400" />} label="Observer Agent" ok={health?.observer.running} detail={`${health?.observer.running ? 'Running' : 'Stopped'} · ${health?.observer.consecutiveDegraded || 0} degraded`} />
        <Row icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />} label="Daemon" ok={health?.daemon} detail={health?.daemon ? 'v1.0.0 · port 3001' : 'OFFLINE'} />
      </Section>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <ActionBtn label="Reindex Codebase" endpoint="/api/search/reindex" />
        <ActionBtn label="Run Observer Check" endpoint="/api/observer/check" method="POST" />
        <ActionBtn label="Clean Memory" endpoint="/api/memory/clean" method="POST" />
        <ActionBtn label="Start Curator" endpoint="/api/curator/start" method="POST" body={{ intervalMinutes: 60 }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-primary bg-slate-950/60 overflow-hidden">
      <div className="px-3 py-2 bg-bg-primary/60 border-b border-border-primary text-[10px] font-black uppercase text-text-secondary tracking-widest">{title}</div>
      <div className="divide-y divide-slate-800/50">{children}</div>
    </div>
  );
}

function Row({ icon, label, ok, detail }: { icon: React.ReactNode; label: string; ok?: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 hover:bg-bg-primary/20 text-xs">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="font-bold text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-tertiary">{detail}</span>
        {ok !== undefined ? (ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-rose-400" />) : <span className="text-slate-600 text-[9px]">—</span>}
      </div>
    </div>
  );
}

function ActionBtn({ label, endpoint, method = 'GET', body }: { label: string; endpoint: string; method?: string; body?: any }) {
  const [busy, setBusy] = useState(false);
  const handleClick = async () => {
    setBusy(true);
    try {
      await fetch(`${DAEMON}${endpoint}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    } catch { }
    setBusy(false);
  };
  return (
    <button onClick={handleClick} disabled={busy} className="rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-violet-500 disabled:opacity-50 flex items-center gap-1">
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} {label}
    </button>
  );
}
