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
  Send,
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
  const backgroundCount = AI_WORKFORCE_CAPABILITIES.filter((capability) => capability.backgroundMode).length;
  const achievedCount = AI_WORKFORCE_GAP_MATRIX.filter((row) => row.status === 'achieved').length;
  const protectedActions = ['ghi/xóa file', 'gửi email', 'merge code', 'điều khiển robot'];

  return (
    <div className="space-y-6">
      <ShellCard className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-950 to-cyan-950/20">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> AI Operations
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Một nơi để ra lệnh cho AI staff, robot và tự động hóa.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              Founder chỉ cần mô tả việc cần làm. Hệ thống sẽ tự chia mission, lấy ngữ cảnh, chọn agent/tool,
              chạy nền khi an toàn và yêu cầu duyệt khi có rủi ro.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Lệnh nhanh</label>
            <textarea
              className="mt-3 min-h-28 w-full resize-none rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm font-semibold leading-6 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
              placeholder="Ví dụ: Tạo kế hoạch marketing 7 ngày cho sản phẩm kế toán dịch vụ, giao AI Marketer soạn nội dung và đưa kết quả vào CRM."
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {['Tư vấn', 'Tạo nhiệm vụ', 'Chạy nền', 'Cần duyệt'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-black text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100"
                >
                  {mode}
                </button>
              ))}
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-500/20"
              >
                <Send className="h-3.5 w-3.5" /> Gửi lệnh
              </button>
            </div>
          </div>
        </div>
      </ShellCard>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Năng lực chạy nền', value: `${backgroundCount}/${AI_WORKFORCE_CAPABILITIES.length}`, detail: 'AI, memory, tool catalog và code automation đi qua một policy.', icon: Activity },
          { label: 'Mức sẵn sàng', value: `${achievedCount}/${AI_WORKFORCE_GAP_MATRIX.length}`, detail: 'Các phần lõi đã có service contract, còn chi tiết kỹ thuật được ẩn.', icon: CheckCircle2 },
          { label: 'Hành động cần duyệt', value: protectedActions.length, detail: protectedActions.join(', '), icon: ShieldCheck },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <ShellCard key={metric.label}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-2xl font-black text-white">{metric.value}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{metric.detail}</p>
                </div>
              </div>
            </ShellCard>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {AI_WORKFORCE_LANES.map((lane) => (
          <ShellCard key={lane.id} className="border-cyan-500/15">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">{lane.title}</h2>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{lane.mission}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-semibold leading-5 text-amber-100">
              {lane.guardrail}
            </p>
          </ShellCard>
        ))}
      </section>

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
