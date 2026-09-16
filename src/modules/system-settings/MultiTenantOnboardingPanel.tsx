import React, { useEffect, useState } from 'react';
import { Users, Rocket, CheckCircle2, Clock, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { getOnboardingPipeline, launchOnboarding } from '../../utils/strategicEnginesApi';

const PIPELINE = [
  { id: 'ten_001', name: 'ABC Logistics VN', plan: 'Enterprise', progress: 83, steps: ['Tạo workspace', 'Import Excel/MISA', 'Cấu hình RBAC', 'Demo AI Swarm', 'Welcome Call AI', 'Go-live'], completedSteps: 5, csm: 'AI-CSM-Minh' },
  { id: 'ten_002', name: 'XYZ Retail Group', plan: 'Growth', progress: 50, steps: ['Tạo workspace', 'Import Excel/MISA', 'Cấu hình RBAC', 'Demo AI Swarm', 'Welcome Call AI', 'Go-live'], completedSteps: 3, csm: 'AI-CSM-Lan' },
  { id: 'ten_003', name: 'Delta SaaS Co', plan: 'Growth', progress: 17, steps: ['Tạo workspace', 'Import Excel/MISA', 'Cấu hình RBAC', 'Demo AI Swarm', 'Welcome Call AI', 'Go-live'], completedSteps: 1, csm: 'AI-CSM-Tung' },
];

export default function MultiTenantOnboardingPanel() {
  const [launched, setLaunched] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState(PIPELINE);

  useEffect(() => {
    getOnboardingPipeline().then((d) => {
      if (d.pipeline?.length) {
        setPipeline(d.pipeline.map((t) => ({
          id: t.tenantId,
          name: t.tenantName,
          plan: t.plan,
          progress: t.progressPercent,
          steps: t.steps.map((s) => s.label),
          completedSteps: t.steps.filter((s) => s.status === 'done').length,
          csm: t.assignedCsmAgent
        })));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tự Động Hóa Onboarding Đa Khách Hàng (Multi-Tenant)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  AI CSM Swarm
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Thiết lập workspace · Nhập dữ liệu tự động · Cuộc gọi chào đón AI · Checklist Go-live trực tiếp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              94.2% Tỷ Lệ Hoàn Thành
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Onboarding TB</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            7.4 <span className="text-xs text-slate-400 font-normal">ngày</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Giảm 60% so với quy trình thủ công</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Hoàn Tất Đúng Hạn</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            94.2%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chất lượng dịch vụ chuẩn ISO</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Đang Triển Khai</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            {pipeline.length} Doanh Nghiệp
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tự động điều phối qua AI CSM</p>
        </div>
      </div>

      {/* Tenants Pipeline Cards */}
      <div className="space-y-4">
        {pipeline.map((t) => (
          <div key={t.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
                  {t.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">{t.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {t.plan}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">Phụ trách: {t.csm}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await launchOnboarding(t.id).catch(() => {});
                  setLaunched(t.id);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                  launched === t.id
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20'
                }`}
              >
                {launched === t.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã Kích Hoạt Sequence</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Launch Sequence</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Tiến Độ Triển Khai</span>
                <span className="text-sky-300 font-mono">{t.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    t.progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-blue-500'
                  }`}
                  style={{ width: `${t.progress}%` }}
                />
              </div>
            </div>

            {/* Step Badges */}
            <div className="flex flex-wrap gap-2">
              {t.steps.map((step, i) => {
                const isDone = i < t.completedSteps;
                const isCurrent = i === t.completedSteps;
                return (
                  <span
                    key={step}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      isDone
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : isCurrent
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse'
                        : 'bg-slate-950/40 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isDone ? '✓ ' : isCurrent ? '⏳ ' : ''}{step}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
