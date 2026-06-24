import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  FlaskConical,
  Layers,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

// ─── Types (mirrors backend) ──────────────────────────────────────────────────

interface AgentRunSummary {
  id: string;
  goal: string;
  status: 'planned' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'stopped';
  planner: 'ai' | 'deterministic';
  createdAt: string;
  steps: Array<{ status: string; toolId: string }>;
}

interface RuntimeMetrics {
  emergencyStop: boolean;
  totalRuns: number;
  activeRuns: number;
  waitingApproval: number;
  completedRuns: number;
  failedRuns: number;
  artifactCount: number;
  averageStepLatencyMs: number;
  aiPlannedRuns: number;
  fallbackPlannedRuns: number;
}

interface AgentRole {
  id: string;
  emoji: string;
  group: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stepCount: number;
}

interface AIInventory {
  readiness: {
    score: number;
    maturity: string;
    summary: string;
  };
  stats: {
    prompts: { totalTemplates: number; totalRuns: number; avgSuccessRate: number };
    knowledge: { total: number; totalViews: number; topCategory: string };
    skills: { total: number; published: number };
    controlPlane: { storage: string; tasks: number; events: number; toolRuns: number };
    workflowTemplates: number;
  };
  highlights: {
    skills: Array<{ id: string; name: string; category: string; tags: string[] }>;
    promptTemplates: Array<{ id: string; name: string; category: string; tags: string[] }>;
    readinessChecks: Array<{ id: string; label: string; status: string; message: string; nextAction?: string }>;
  };
}

type ActiveTab = 'overview' | 'runs' | 'roles' | 'workflows';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  running: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20',
  planned: 'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  waiting_approval: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  failed: 'bg-rose-500/15 text-rose-300 border border-rose-500/20',
  stopped: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Hoàn thành', running: 'Đang chạy', planned: 'Đã lên kế hoạch',
  waiting_approval: 'Chờ duyệt', failed: 'Thất bại', stopped: 'Đã dừng',
};

const GROUP_COLORS: Record<string, string> = {
  Executive: 'from-purple-600/30 to-purple-900/20 border-purple-500/20',
  Finance: 'from-emerald-600/30 to-emerald-900/20 border-emerald-500/20',
  Product: 'from-cyan-600/30 to-cyan-900/20 border-cyan-500/20',
  Growth: 'from-orange-600/30 to-orange-900/20 border-orange-500/20',
  Legal: 'from-yellow-600/30 to-yellow-900/20 border-yellow-500/20',
  Support: 'from-blue-600/30 to-blue-900/20 border-blue-500/20',
  Data: 'from-fuchsia-600/30 to-fuchsia-900/20 border-fuchsia-500/20',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sublabel, icon: Icon, accent = 'cyan' }: {
  label: string; value: number | string; sublabel?: string;
  icon: React.ElementType; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-400', emerald: 'text-emerald-400', amber: 'text-amber-400',
    rose: 'text-rose-400', fuchsia: 'text-fuchsia-400', blue: 'text-blue-400',
  };
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 ${accentMap[accent] || 'text-cyan-400'}`} />
      </div>
      <div className={`text-3xl font-black ${accentMap[accent] || 'text-cyan-400'}`}>{value}</div>
      {sublabel && <div className="text-xs text-slate-500 font-semibold">{sublabel}</div>}
    </div>
  );
}

function RunRow({ run }: { run: AgentRunSummary }) {
  const completedSteps = run.steps.filter((s) => s.status === 'completed').length;
  const progress = run.steps.length ? Math.round((completedSteps / run.steps.length) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_STYLES[run.status] || STATUS_STYLES.stopped}`}>
            {STATUS_LABELS[run.status] || run.status}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">{run.planner === 'ai' ? '🤖 AI Planned' : '📋 Deterministic'}</span>
        </div>
        <p className="text-sm font-bold text-white truncate">{run.goal}</p>
        <p className="text-xs text-slate-500 mt-1">{new Date(run.createdAt).toLocaleString('vi-VN')}</p>
      </div>
      <div className="text-right min-w-[80px]">
        <div className="text-xs text-slate-500 mb-1">{completedSteps}/{run.steps.length} steps</div>
        <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIOperationsCenter() {
  const [tab, setTab] = useState<ActiveTab>('overview');
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);
  const [runs, setRuns] = useState<AgentRunSummary[]>([]);
  const [roles, setRoles] = useState<AgentRole[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [inventory, setInventory] = useState<AIInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchGoal, setLaunchGoal] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<string | null>(null);
  const [emergencyStopActive, setEmergencyStopActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, runsRes, rolesRes, inventoryRes] = await Promise.all([
        fetch('/api/agent-runtime/metrics'),
        fetch('/api/agent-runtime/runs?limit=20'),
        fetch('/api/agent-roles'),
        fetch('/api/ai/inventory'),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json() as RuntimeMetrics | { success?: boolean; metrics?: RuntimeMetrics };
        const nextMetrics = 'metrics' in data ? data.metrics : data;
        if (nextMetrics) {
          setMetrics(nextMetrics);
          setEmergencyStopActive(nextMetrics.emergencyStop);
        }
      }
      if (runsRes.ok) {
        const data = await runsRes.json() as { runs?: AgentRunSummary[] };
        setRuns(data.runs || []);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json() as AgentRole[] | { roles?: AgentRole[] };
        setRoles(Array.isArray(data) ? data : (data.roles || []));
      }
      if (inventoryRes.ok) {
        const data = await inventoryRes.json() as { success?: boolean } & AIInventory;
        setInventory(data);
      }

      // Fetch workflow templates
      const wfRes = await fetch('/api/workflows/templates');
      if (wfRes.ok) {
        const data = await wfRes.json() as WorkflowTemplate[] | { templates?: WorkflowTemplate[] };
        setWorkflowTemplates(Array.isArray(data) ? data : (data.templates || []));
      }

      setError(null);
    } catch (err) {
      setError('Không thể tải dữ liệu AI Operations. Kiểm tra kết nối server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => { void fetchData(); }, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const handleLaunchRun = async () => {
    if (!launchGoal.trim()) return;
    setLaunching(true); setLaunchResult(null);
    try {
      const res = await fetch('/api/agent-runtime/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: launchGoal.trim(), maxSteps: 4 }),
      });
      const data = await res.json() as { id?: string; run?: { id: string }; goal?: string; error?: string };
      const createdRunId = data.id || data.run?.id;
      if (res.ok && createdRunId) {
        setLaunchResult(`Agent Run created: ${createdRunId.slice(0, 16)}...`);
        setLaunchGoal('');
        await fetchData();
      } else {
        setLaunchResult(`❌ Lỗi: ${data.error || 'Không thể tạo agent run'}`);
      }
    } catch {
      setLaunchResult('❌ Lỗi kết nối server.');
    } finally {
      setLaunching(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch('/api/agent-runtime/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !emergencyStopActive, reason: emergencyStopActive ? undefined : 'Founder emergency stop from AI Operations Center.' }),
      });
      await fetchData();
    } catch { /* ignore */ }
  };

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Tổng quan', icon: Activity },
    { id: 'runs', label: 'Agent Runs', icon: Bot },
    { id: 'roles', label: 'AI Staff', icon: Users },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
  ];

  const activeRuns = runs.filter((r) => ['planned', 'running', 'waiting_approval'].includes(r.status));
  const groupedRoles = roles.reduce<Record<string, AgentRole[]>>((acc, role) => {
    (acc[role.group] = acc[role.group] || []).push(role); return acc;
  }, {});

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/30 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300">
              <Brain className="h-3.5 w-3.5" /> AI Operations Center
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Trung tâm điều phối AI</h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Quản lý Agent Runs, multi-agent Workflows, AI Staff và automation từ một nơi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchData()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-black text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={() => void handleEmergencyStop()}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                emergencyStopActive
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {emergencyStopActive ? '🔴 DỪNG KHẨN CẤP — Click để reset' : 'Emergency Stop'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                tab === id ? 'bg-cyan-400 text-slate-950 shadow-md' : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Error ──────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Overview Tab ───────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tổng Agent Runs" value={loading ? '…' : (metrics?.totalRuns ?? 0)} sublabel="từ trước đến nay" icon={Bot} accent="cyan" />
            <MetricCard label="Đang chạy" value={loading ? '…' : (metrics?.activeRuns ?? 0)} sublabel={metrics?.waitingApproval ? `${metrics.waitingApproval} chờ duyệt` : 'không có'} icon={Activity} accent="emerald" />
            <MetricCard label="Hoàn thành" value={loading ? '…' : (metrics?.completedRuns ?? 0)} sublabel={`${metrics?.artifactCount ?? 0} artifacts`} icon={CheckCircle2} accent="blue" />
            <MetricCard label="Avg Latency" value={loading ? '…' : `${metrics?.averageStepLatencyMs ?? 0}ms`} sublabel="per agent step" icon={Clock} accent="fuchsia" />
          </div>

          {inventory && (
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">AI integration</span>
                </div>
                <div className="text-3xl font-black text-cyan-300">{inventory.readiness.score}/100</div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{inventory.readiness.summary}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Data sources</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-300">
                  <span>Prompts: {inventory.stats.prompts.totalTemplates}</span>
                  <span>Skills: {inventory.stats.skills.published}</span>
                  <span>Knowledge: {inventory.stats.knowledge.total}</span>
                  <span>Workflows: {inventory.stats.workflowTemplates}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Control plane</span>
                </div>
                <p className="text-xs font-bold leading-6 text-slate-300">
                  {inventory.stats.controlPlane.tasks} tasks, {inventory.stats.controlPlane.events} events, {inventory.stats.controlPlane.toolRuns} tool runs via {inventory.stats.controlPlane.storage}.
                </p>
              </div>
            </section>
          )}

          {/* Quick Launch */}
          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-cyan-200">
              <Zap className="h-4 w-4" /> Quick Launch — Agent Run
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={launchGoal}
                onChange={(e) => setLaunchGoal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleLaunchRun(); }}
                placeholder="Nhập mục tiêu cho AI agent (VD: 'Phân tích dữ liệu doanh thu Q2')"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={() => void handleLaunchRun()}
                disabled={!launchGoal.trim() || launching}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black text-slate-950 disabled:opacity-50 hover:bg-cyan-300 transition-colors"
              >
                <Play className="h-4 w-4" /> {launching ? 'Đang tạo…' : 'Chạy'}
              </button>
            </div>
            {launchResult && <p className="mt-3 text-sm font-bold text-slate-300">{launchResult}</p>}
          </section>

          {/* Active Runs */}
          {activeRuns.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
                <Activity className="h-4 w-4 text-cyan-400" /> Agent Runs đang chạy ({activeRuns.length})
              </h2>
              <div className="space-y-2">
                {activeRuns.map((run) => <RunRow key={run.id} run={run} />)}
              </div>
            </section>
          )}

          {/* Stats row */}
          {metrics && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-fuchsia-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">AI vs Deterministic</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-fuchsia-400">{metrics.aiPlannedRuns}</span>
                  <span className="text-sm text-slate-500 mb-1">AI planned</span>
                </div>
                <div className="mt-2 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-fuchsia-500"
                    style={{ width: metrics.totalRuns ? `${Math.round((metrics.aiPlannedRuns / metrics.totalRuns) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Tỷ lệ thành công</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {metrics.totalRuns ? Math.round((metrics.completedRuns / metrics.totalRuns) * 100) : 100}%
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Fallback Runs</span>
                </div>
                <div className="text-2xl font-black text-amber-400">{metrics.fallbackPlannedRuns}</div>
                <p className="mt-1 text-xs text-slate-500">AI → Deterministic fallback</p>
              </div>
            </div>
          )}

          {inventory && (
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">Connected skills</h2>
                <div className="space-y-2">
                  {inventory.highlights.skills.map((skill) => (
                    <div key={skill.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <p className="text-sm font-black text-white">{skill.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{skill.category} / {skill.tags.join(', ') || 'no tags'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">Readiness checks</h2>
                <div className="space-y-2">
                  {inventory.highlights.readinessChecks.slice(0, 5).map((check) => (
                    <div key={check.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-white">{check.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          check.status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' :
                          check.status === 'blocked' ? 'bg-rose-500/15 text-rose-300' :
                          'bg-amber-500/15 text-amber-300'
                        }`}>{check.status}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{check.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Runs Tab ───────────────────────────────────────────────────────────── */}
      {tab === 'runs' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Tất cả Agent Runs ({runs.length})
            </h2>
          </div>
          {loading ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">Đang tải…</div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Chưa có agent run nào. Tạo run từ tab Tổng quan.</div>
          ) : (
            runs.map((run) => <RunRow key={run.id} run={run} />)
          )}
        </section>
      )}

      {/* ── AI Staff Map Tab ───────────────────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white">AI Staff Map — {roles.length} vai trò</h2>
          </div>
          {Object.entries(groupedRoles).map(([group, groupRoles]) => (
            <section key={group}>
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">{group}</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {groupRoles.map((role) => (
                  <div
                    key={role.id}
                    className={`rounded-2xl border bg-gradient-to-br p-4 ${GROUP_COLORS[role.group] || 'from-slate-800/50 to-slate-900/50 border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{role.emoji}</span>
                      <div>
                        <h4 className="text-sm font-black text-white">{role.id}</h4>
                        <span className="text-xs text-slate-400 font-semibold">{role.group}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Sẵn sàng
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Workflows Tab ──────────────────────────────────────────────────────── */}
      {tab === 'workflows' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white">Multi-Agent Workflows</h2>
          </div>
          <p className="text-sm text-slate-400">
            Workflows chạy nhiều AI agents tuần tự hoặc song song với approval gates và conditional branching.
          </p>
          {workflowTemplates.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <FlaskConical className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Đang tải workflow templates…</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {workflowTemplates.map((template) => (
                <div key={template.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-black text-white">{template.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-5">{template.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-[10px] font-black px-2 py-0.5">
                      {template.stepCount} steps
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="font-bold">{template.id}</span>
                  </div>
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300 hover:bg-cyan-500/20 transition-colors w-full justify-center"
                    onClick={() => {/* future: open workflow launch modal */}}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Xem chi tiết
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
