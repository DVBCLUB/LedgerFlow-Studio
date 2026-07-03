import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Network,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  Clock,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Play
} from 'lucide-react';
import { useAIWorkforce } from '../../context/AIWorkforceContext';
import {
  AI_WORKFORCE_CAPABILITIES,
  AI_WORKFORCE_GAP_MATRIX,
  AI_WORKFORCE_LANES,
  AI_WORKFORCE_METRICS,
  AI_WORKFORCE_RUNBOOK,
  AI_WORKFORCE_UPGRADE_BACKLOG,
} from '../../data/aiWorkforceCommandCenter';
import { daemonFetch } from '../../utils/assistantApi';

const statusStyles: Record<string, string> = {
  live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  ready: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  guarded: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  planned: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  achieved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  gap: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
};

const capabilityIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'agent-orchestration': Bot,
  'memory-rag-kg': BrainCircuit,
  'tool-mcp-registry': Network,
  'software-factory': GitBranch,
  'computer-browser-robotics': Cpu,
};

function ShellCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20 ${className}`}>
      {children}
    </section>
  );
}

function TinyList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <p key={item} className="text-xs font-semibold leading-5 text-slate-300">• {item}</p>
      ))}
    </div>
  );
}

export default function AIWorkforceCommandCenter() {
  const { snapshot, swarmPlans, agenticLoops, runSwarm, triggerLoop, refresh } = useAIWorkforce();
  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState<'single' | 'swarm'>('swarm');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [gatewayInfo, setGatewayInfo] = useState<any>(null);

  const fetchGatewayInfo = async () => {
    try {
      const res = await daemonFetch<any>('/api/gateway/health', undefined, 10000);
      if (res && res.ok) {
        setGatewayInfo(res);
      }
    } catch {}
  };

  const handleResetCircuit = async (provider: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await daemonFetch<any>(`/api/gateway/circuit/${encodeURIComponent(provider)}/reset`, { method: 'POST' }, 10000);
      setMessage(`Đã reset cầu chì thành công cho provider ${provider}.`);
      await fetchGatewayInfo();
    } catch (err: any) {
      setError(err.message || 'Không thể reset cầu chì.');
    } finally {
      setBusy(false);
    }
  };

  React.useEffect(() => {
    fetchGatewayInfo();
    const interval = setInterval(fetchGatewayInfo, 8000);
    return () => clearInterval(interval);
  }, []);

  const backgroundCount = AI_WORKFORCE_CAPABILITIES.filter((capability) => capability.backgroundMode).length;
  const achievedCount = AI_WORKFORCE_GAP_MATRIX.filter((row) => row.status === 'achieved').length;
  const protectedActions = ['ghi/xóa file', 'gửi email', 'merge code', 'điều khiển robot'];

  const activeSwarm = useMemo(() => {
    return swarmPlans.find(p => p.status === 'executing' || p.status === 'planning') || swarmPlans[0];
  }, [swarmPlans]);

  const loopTemplates = [
    { id: 'daily_ops', name: 'Daily Business Ops', detail: 'Tự động kiểm tra số dư, lập báo cáo cuối ngày và đồng bộ dữ liệu CRM.', icon: Clock },
    { id: 'ai_audit', name: 'AI Security & Drift Audit', detail: 'Quét an ninh SAST hệ thống, phát hiện trôi lệch cấu hình file.', icon: ShieldAlert },
    { id: 'competitor_research', name: 'Market Competitor Watch', detail: 'Tự động nghiên cứu tin tức đối thủ, tối ưu hóa từ khóa SEO ngầm.', icon: Target },
  ];

  const handleSendCommand = async () => {
    if (!goal.trim()) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (mode === 'swarm') {
        const plan = await runSwarm(goal.trim(), 'general', true);
        setMessage(`Đã kích hoạt Multi-Agent Swarm thành công (ID: ${plan.id})`);
      } else {
        const created = await daemonFetch<{ id?: string; run?: { id?: string } }>('/api/agent-runtime/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: goal.trim(), maxSteps: 5, plannerMode: 'auto' })
        }, 60000);
        const runId = created.run?.id || created.id;
        setMessage(`Đã khởi chạy Single Agent Mission thành công (ID: ${runId})`);
      }
      setGoal('');
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi lệnh đến AI Daemon.');
    } finally {
      setBusy(false);
    }
  };

  const handleTriggerLoop = async (loopId: string) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const run = await triggerLoop(loopId);
      setMessage(`Đã kích hoạt vòng lặp tự trị ngầm ${loopId} (Run ID: ${run.id})`);
      refresh();
    } catch (err: any) {
      setError(err?.message || `Không thể kích hoạt loop ${loopId}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ShellCard className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-950 to-cyan-950/20">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> AI Multi-Agent Enterprise OS
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Hệ điều hành doanh nghiệp đa đại lý vận hành ngầm tự trị
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              Mô tả mục tiêu doanh nghiệp của bạn. Swarm Orchestrator sẽ tự động lập kế hoạch ngầm, 
              phân chia công việc cho các AI agents chuyên biệt và chạy ngầm hoàn toàn.
            </p>
            {message && <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">{message}</p>}
            {error && <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-bold text-rose-300">{error}</p>}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Lệnh nhanh cho Swarm</label>
              <div className="flex gap-1.5 rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  onClick={() => setMode('swarm')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all ${mode === 'swarm' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' : 'text-slate-400 border border-transparent'}`}
                >
                  Swarm OS
                </button>
                <button
                  onClick={() => setMode('single')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all ${mode === 'single' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' : 'text-slate-400 border border-transparent'}`}
                >
                  Single Agent
                </button>
              </div>
            </div>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="mt-3 min-h-24 w-full resize-none rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
              placeholder={mode === 'swarm' 
                ? "Giao việc cho Swarm (Planner -> Coder -> Tester -> Reviewer) chạy ngầm..." 
                : "Giao việc cho Single Agent..."}
            />
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSendCommand}
                disabled={busy || !goal.trim()}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" /> Gửi lệnh chạy ngầm
              </button>
            </div>
          </div>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-4">
        <ShellCard>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Năng lực chạy ngầm</p>
              <p className="mt-1 text-2xl font-black text-white">{backgroundCount}/{AI_WORKFORCE_CAPABILITIES.length}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Các agent vận hành ngầm.</p>
            </div>
          </div>
        </ShellCard>
        <ShellCard>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Sẵn sàng tự trị</p>
              <p className="mt-1 text-2xl font-black text-white">{achievedCount}/{AI_WORKFORCE_GAP_MATRIX.length}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Chỉ số sẵn sàng vận hành.</p>
            </div>
          </div>
        </ShellCard>
        <ShellCard>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-200">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Swarm Plans tích lũy</p>
              <p className="mt-1 text-2xl font-black text-white">{swarmPlans.length}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Các plan điều phối đa đại lý.</p>
            </div>
          </div>
        </ShellCard>
        <ShellCard>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Hành động cần duyệt</p>
              <p className="mt-1 text-2xl font-black text-white">{protectedActions.length}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Ghi/xóa, merge, điều khiển robot.</p>
            </div>
          </div>
        </ShellCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <ShellCard className="border-cyan-500/10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-200">
                  <Network className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Multi-Agent Swarm Collaboration Map</h2>
                  <p className="text-[10px] font-semibold text-slate-500">Mô phỏng mạng lưới cộng tác của các đại lý ngầm</p>
                </div>
              </div>
              {activeSwarm && (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                  activeSwarm.status === 'executing' ? 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20 animate-pulse' :
                  activeSwarm.status === 'completed' ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20' :
                  'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {activeSwarm.status}
                </span>
              )}
            </div>

            {activeSwarm ? (
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="relative border border-slate-900 bg-slate-950/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[180px]">
                  {/* SVG background links for flow representation */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 50,90 Q 150,40 250,90 T 450,90 T 650,90"
                      fill="none"
                      stroke="url(#flowGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="8 6"
                      style={{
                        animation: activeSwarm.status === 'executing' ? 'dash-flow 1.5s linear infinite' : 'none'
                      }}
                    />
                    <style>{`
                      @keyframes dash-flow {
                        to {
                          stroke-dashoffset: -20;
                        }
                      }
                    `}</style>
                  </svg>
                  
                  <div className="w-full flex flex-wrap justify-between items-center gap-4 relative z-10">
                    {[
                      { role: 'planner', label: 'Planner', icon: BrainCircuit, color: 'text-violet-400', border: 'border-violet-500/30' },
                      { role: 'code', label: 'Developer', icon: Bot, color: 'text-cyan-400', border: 'border-cyan-500/30' },
                      { role: 'review', label: 'Reviewer', icon: ShieldCheck, color: 'text-amber-400', border: 'border-amber-500/30' },
                      { role: 'test', label: 'QA Tester', icon: Cpu, color: 'text-rose-400', border: 'border-rose-500/30' },
                      { role: 'finance', label: 'Reporter', icon: Target, color: 'text-emerald-400', border: 'border-emerald-500/30' }
                    ].map((node) => {
                      const task = activeSwarm.tasks?.find(t => t.role === node.role);
                      const isRunning = task?.status === 'running' || (node.role === 'planner' && activeSwarm.status === 'planning');
                      const isDone = task?.status === 'completed' || (node.role === 'planner' && activeSwarm.status !== 'planning');
                      const isFailed = task?.status === 'failed';
                      
                      const NodeIcon = node.icon;
                      return (
                        <div key={node.role} className="flex flex-col items-center gap-2 mx-auto relative group">
                          <div className={`w-12 h-12 rounded-full border bg-slate-950 flex items-center justify-center transition-all ${
                            isRunning ? `${node.border} shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-2 ring-cyan-500/30 animate-pulse` :
                            isDone ? 'border-emerald-500/40 bg-emerald-950/20' :
                            isFailed ? 'border-rose-500/40 bg-rose-950/20' :
                            'border-slate-800'
                          }`}>
                            <NodeIcon className={`h-5 w-5 ${
                              isRunning ? 'text-cyan-300' :
                              isDone ? 'text-emerald-300' :
                              isFailed ? 'text-rose-300' :
                              'text-slate-500'
                            }`} />
                          </div>
                          <span className="text-[10px] font-black text-white">{node.label}</span>
                          <span className={`text-[9px] font-bold uppercase ${
                            isRunning ? 'text-cyan-300 animate-pulse' :
                            isDone ? 'text-emerald-400' :
                            'text-slate-500'
                          }`}>
                            {isRunning ? 'Running' : isDone ? 'Done' : task?.status || 'Idle'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Chi tiết Swarm Plan</h3>
                  <p className="text-xs font-semibold text-slate-300">Goal: {activeSwarm.goal}</p>
                  
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                    {activeSwarm.tasks?.map(task => (
                      <div key={task.id} className="flex items-center justify-between text-xs rounded-xl border border-slate-900 bg-slate-950/30 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span className="font-bold text-slate-300">Role: {task.role.toUpperCase()}</span>
                          <span className="text-slate-500 font-semibold">• {task.goal}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          task.status === 'running' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' :
                          'bg-slate-900 text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-10">
                <p className="text-xs font-semibold text-slate-500 italic">Chưa khởi chạy Swarm nào. Sử dụng Lệnh nhanh để bắt đầu.</p>
              </div>
            )}
          </ShellCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ShellCard className="border-violet-500/10">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-900 pb-3">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-2 text-violet-200">
                <Play className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Background Loops</h2>
                <p className="text-[10px] font-semibold text-slate-500">Các tiến trình tự trị định kỳ ngầm</p>
              </div>
            </div>

            <div className="space-y-3">
              {loopTemplates.map(tpl => {
                const isRunning = agenticLoops.some(r => r.loopId === tpl.id && r.status === 'running');
                return (
                  <div key={tpl.id} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 hover:border-slate-800 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2">
                        <tpl.icon className={`h-4 w-4 mt-0.5 ${isRunning ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                        <div>
                          <h3 className="text-xs font-black text-white">{tpl.name}</h3>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1 leading-4">{tpl.detail}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTriggerLoop(tpl.id)}
                        disabled={busy || isRunning}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase transition-all whitespace-nowrap ${
                          isRunning ? 'bg-cyan-500/25 border-cyan-500/35 text-cyan-200 animate-pulse' :
                          'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {isRunning ? 'Running' : 'Trigger'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ShellCard>

          {/* AI Model Gateway & LLM Circuit Breakers Panel */}
          <ShellCard className="border-cyan-500/10 mt-6">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-900 pb-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-200">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Gateway & Circuit Breakers</h2>
                <p className="text-[10px] font-semibold text-slate-500">Cổng định tuyến LLM tự động failover ngầm</p>
              </div>
            </div>

            <div className="space-y-3">
              {gatewayInfo?.health ? (
                gatewayInfo.health.map((details: any) => {
                  const isOnline = details.status === 'online';
                  const isOffline = details.status === 'offline';
                  const isRateLimited = details.status === 'rate_limited';
                  const isDegraded = details.status === 'degraded' || details.circuitOpen;

                  const statusLabel = 
                    isOffline ? 'CHƯA LIÊN KẾT ⚪' : 
                    isOnline ? 'ĐANG ĐÓNG 🟢' : 
                    isRateLimited ? 'BÁN MỞ 🟡' : 'CẦU CHÌ NGẮT 🔴';

                  const badgeColor = 
                    isOffline ? 'bg-slate-900 text-slate-400 border border-slate-800' :
                    isOnline ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' :
                    isRateLimited ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/25 text-rose-300 border border-rose-500/30';

                  return (
                    <div key={details.provider} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 hover:border-slate-800 transition-all flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-emerald-500' : 
                            isOffline ? 'bg-slate-500' : 
                            isRateLimited ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
                          }`} />
                          <span className="text-xs font-black text-white uppercase">{details.provider}</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Model: <span className="font-semibold text-slate-300">{details.model}</span></span>
                        <span>Trễ: <span className="font-semibold text-slate-300">{details.latencyMs ? `${details.latencyMs}ms` : 'N/A'}</span></span>
                      </div>
                      
                      {isOffline ? (
                        <div className="mt-1 flex items-center justify-between border-t border-slate-900/60 pt-2">
                          <span className="text-[9px] text-slate-500 italic">Chưa tích hợp API Key local</span>
                          <a
                            href="#/ai_settings"
                            className="text-[9px] font-black uppercase text-cyan-400 hover:text-cyan-200 transition-all"
                          >
                            Cấu hình ngay →
                          </a>
                        </div>
                      ) : isDegraded ? (
                        <div className="mt-1 flex items-center justify-between border-t border-slate-900/60 pt-2">
                          <span className="text-[9px] text-rose-300 italic font-semibold">Cầu chì đã ngắt do lỗi liên tiếp</span>
                          <button
                            onClick={() => void handleResetCircuit(details.provider)}
                            disabled={busy}
                            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase text-cyan-200 hover:bg-cyan-500/25 transition-all"
                          >
                            Reset Cầu Chì
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 text-center">
                  <p className="text-xs text-slate-500 italic">Đang tải cấu hình AI Gateway...</p>
                </div>
              )}
            </div>
          </ShellCard>
        </div>
      </div>

      <ShellCard>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Quy trình chạy mission</h2>
            <p className="text-xs font-semibold text-slate-400">Mọi tác vụ AI đi qua một luồng cố định để dễ kiểm soát.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {AI_WORKFORCE_RUNBOOK.map((step) => (
            <div key={step.step} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[10px] font-black uppercase text-violet-300">{step.step}</p>
              <p className="mt-2 text-xs font-black text-white">{step.owner}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{step.action}</p>
            </div>
          ))}
        </div>
      </ShellCard>

      <details className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-left">
        <summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[0.18em] text-slate-300 hover:text-white">
          Mở lớp kỹ thuật: mức sẵn sàng, backlog, capability matrix
        </summary>

        <div className="mt-5 space-y-5">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {AI_WORKFORCE_METRICS.map((metric) => (
              <ShellCard key={metric.label}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{metric.detail}</p>
              </ShellCard>
            ))}
          </section>

          <ShellCard className="border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Gap Matrix</h2>
                <p className="text-xs font-semibold text-slate-400">Dành cho AgentOps/DevOps khi cần xem khoảng thiếu kỹ thuật.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {AI_WORKFORCE_GAP_MATRIX.map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-black text-white">{row.target}</h3>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[row.status]}`}>
                      {row.status} {row.score}/5
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{row.current}</p>
                  <p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">{row.upgrade}</p>
                </div>
              ))}
            </div>
          </ShellCard>

          <ShellCard className="border-violet-500/20">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-violet-300" />
              <h2 className="text-base font-black text-white">Upgrade Backlog</h2>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-4">
              {AI_WORKFORCE_UPGRADE_BACKLOG.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black text-violet-200">{item.priority}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase text-slate-300">{item.mode}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-white">{item.title}</h3>
                  <div className="mt-3"><TinyList items={item.acceptance} /></div>
                </div>
              ))}
            </div>
          </ShellCard>

          <section className="grid gap-4 lg:grid-cols-2">
            {AI_WORKFORCE_CAPABILITIES.map((capability) => {
              const Icon = capabilityIcon[capability.id] || Zap;
              return (
                <ShellCard key={capability.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">{capability.title}</h3>
                        <p className="mt-1 text-[11px] font-bold uppercase text-slate-500">Owner: {capability.owner}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[capability.status]}`}>
                      {capability.status}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-semibold leading-6 text-slate-300">{capability.summary}</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div><p className="mb-2 text-[10px] font-black uppercase text-cyan-300">Inputs</p><TinyList items={capability.inputs} /></div>
                    <div><p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Outputs</p><TinyList items={capability.outputs} /></div>
                  </div>
                </ShellCard>
              );
            })}
          </section>
        </div>
      </details>

      <ShellCard className="border-emerald-500/20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
            <div>
              <h3 className="text-sm font-black text-white">An toàn trước khi chạy</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Hành động ghi/xóa/gửi/merge/thiết bị ngoài luôn có checkpoint.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="mt-1 h-5 w-5 text-cyan-300" />
            <div>
              <h3 className="text-sm font-black text-white">Có nguồn và memory</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Output quan trọng phải có nguồn, trace và quyết định liên quan.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-violet-300" />
            <div>
              <h3 className="text-sm font-black text-white">Kết quả có thể bàn giao</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Kết quả được đóng gói thành report, PR, task hoặc automation rule.</p>
            </div>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}
