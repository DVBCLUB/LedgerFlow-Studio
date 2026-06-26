import React from 'react';
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
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import {
  AI_WORKFORCE_CAPABILITIES,
  AI_WORKFORCE_GAP_MATRIX,
  AI_WORKFORCE_LANES,
  AI_WORKFORCE_METRICS,
  AI_WORKFORCE_RUNBOOK,
  AI_WORKFORCE_UPGRADE_BACKLOG,
} from '../../data/aiWorkforceCommandCenter';

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
    <section className={`rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20 ${className}`}>
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
  const backgroundCount = AI_WORKFORCE_CAPABILITIES.filter((capability) => capability.backgroundMode).length;
  const achievedCount = AI_WORKFORCE_GAP_MATRIX.filter((row) => row.status === 'achieved').length;
  const partialCount = AI_WORKFORCE_GAP_MATRIX.filter((row) => row.status === 'partial').length;
  const gapCount = AI_WORKFORCE_GAP_MATRIX.filter((row) => row.status === 'gap').length;

  return (
    <div className="space-y-6">
      <ShellCard className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-slate-950 to-cyan-950/30">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> AI Workforce Command Center
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Một đầu não cho Agent, Automation, Memory, MCP, Software Factory và Robot Lab.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              Module này gom các panel AI rời rạc thành một hệ điều hành tác vụ: nhận mission, chia work order,
              chạy nền có kiểm soát, ghi audit trace, review chất lượng và lưu quyết định vào memory dài hạn.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-black uppercase text-emerald-200">Background Mode</p>
              <p className="mt-2 text-2xl font-black text-white">{backgroundCount}/{AI_WORKFORCE_CAPABILITIES.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-100">capabilities chạy nền</p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-[10px] font-black uppercase text-cyan-200">Readiness</p>
              <p className="mt-2 text-2xl font-black text-white">{achievedCount}/{AI_WORKFORCE_GAP_MATRIX.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-cyan-100">đạt chuẩn nâng cấp</p>
            </div>
          </div>
        </div>
      </ShellCard>

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Gap Matrix — đánh giá phần chưa đạt</h2>
              <p className="text-xs font-semibold text-slate-400">
                Đạt: {achievedCount} • Một phần: {partialCount} • Còn thiếu lớn: {gapCount}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase text-violet-200">
            OpenClaw+ readiness
          </span>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {AI_WORKFORCE_GAP_MATRIX.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Target</p>
                  <h3 className="mt-1 text-sm font-black text-white">{row.target}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[row.status]}`}>
                    {row.status}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[10px] font-black text-white">
                    {row.score}/5
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">Hiện tại: {row.current}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-rose-300">Chưa đạt</p>
                  <TinyList items={row.missing} />
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="text-[10px] font-black uppercase text-cyan-300">Nâng cấp tiếp</p>
                  <p className="mt-2 text-xs font-bold leading-6 text-cyan-100">{row.upgrade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ShellCard>

      <ShellCard className="border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-200">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Upgrade Backlog</h2>
            <p className="text-xs font-semibold text-slate-400">Các nâng cấp còn thiếu được xếp ưu tiên theo rủi ro và tác động hệ thống.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {AI_WORKFORCE_UPGRADE_BACKLOG.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black text-violet-200">{item.priority}</span>
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[10px] font-black uppercase text-slate-300">{item.mode}</span>
              </div>
              <h3 className="mt-3 text-sm font-black text-white">{item.title}</h3>
              <div className="mt-3">
                <TinyList items={item.acceptance} />
              </div>
            </div>
          ))}
        </div>
      </ShellCard>

      <section className="grid gap-4 xl:grid-cols-3">
        {AI_WORKFORCE_LANES.map((lane) => (
          <ShellCard key={lane.id} className="border-cyan-500/15">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">{lane.title}</h2>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{lane.mission}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <p className="text-[10px] font-black uppercase text-cyan-300">Signal</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{lane.signal}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-[10px] font-black uppercase text-amber-300">Guardrail</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-amber-100">{lane.guardrail}</p>
              </div>
            </div>
          </ShellCard>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {AI_WORKFORCE_CAPABILITIES.map((capability) => {
          const Icon = capabilityIcon[capability.id] || Zap;
          return (
            <ShellCard key={capability.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 text-violet-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{capability.title}</h3>
                    <p className="mt-1 text-[11px] font-bold uppercase text-slate-500">Owner: {capability.owner}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${statusStyles[capability.status]}`}>
                    {capability.status}
                  </span>
                  {capability.backgroundMode && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-200">
                      background
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold leading-6 text-slate-300">{capability.summary}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-cyan-300">Inputs</p>
                  <TinyList items={capability.inputs} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Outputs</p>
                  <TinyList items={capability.outputs} />
                </div>
              </div>
            </ShellCard>
          );
        })}
      </section>

      <ShellCard>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Mission Runbook</h2>
            <p className="text-xs font-semibold text-slate-400">Chuẩn vận hành cố định cho mọi tác vụ AI có rủi ro hoặc output quan trọng.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {AI_WORKFORCE_RUNBOOK.map((step) => (
            <div key={step.step} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[10px] font-black uppercase text-violet-300">{step.step}</p>
              <p className="mt-2 text-xs font-black text-white">{step.owner}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{step.action}</p>
              <p className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2 text-[11px] font-bold leading-5 text-cyan-100">
                Evidence: {step.evidence}
              </p>
            </div>
          ))}
        </div>
      </ShellCard>

      <ShellCard className="border-emerald-500/20">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
            <div>
              <h3 className="text-sm font-black text-white">Safety-first execution</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Tác vụ có quyền ghi, xóa, gửi email, merge code hoặc điều khiển thiết bị đều phải có review/checkpoint.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="mt-1 h-5 w-5 text-cyan-300" />
            <div>
              <h3 className="text-sm font-black text-white">Grounded memory</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Output quan trọng phải đi kèm nguồn, trace, quyết định liên quan và trạng thái confidence.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-violet-300" />
            <div>
              <h3 className="text-sm font-black text-white">Ship-ready handoff</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Kết quả cuối được đóng gói thành PR, report, automation rule hoặc artifact có thể kiểm tra lại.</p>
            </div>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}
