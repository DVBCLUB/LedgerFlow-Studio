import React from 'react';
import CommandCenterV2DailyBriefPanel from './CommandCenterV2DailyBriefPanel';
import AiAgentControlCenter from './components/AiAgentControlCenter';
import OnboardingGuide from './components/OnboardingGuide';
import CEOOverviewPanel from './CEOOverviewPanel';
import ERPCommandCenter from './ERPCommandCenter';
import type { RoleType, TabType } from '../../app/companyNavigation';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  FolderKanban,
  Rocket,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

interface CommandCenterProps {
  activeRole?: RoleType;
  onNavigate: (tab: TabType, subTab?: string) => void;
}

const roleTitles: Record<RoleType, string> = {
  all: 'Toàn cảnh công ty',
  founder: 'Founder cockpit',
  admin: 'Admin cockpit',
  finance: 'Finance focus',
  operations: 'Product focus',
  agentops: 'AI Operations focus',
  devops: 'System focus',
  marketing: 'Growth focus',
  auditor: 'Control focus',
  viewer: 'Viewer summary',
};

export default function CommandCenter({ activeRole = 'all', onNavigate }: CommandCenterProps) {
  const focusTitle = roleTitles[activeRole] || roleTitles.all;

  const metrics = [
    { label: 'Dòng tiền', value: 'Ổn định', detail: 'Cần rà soát thu/chi tuần này', icon: CircleDollarSign, tone: 'text-emerald-200 border-emerald-500/20 bg-emerald-500/10' },
    { label: 'Sales pipeline', value: '3 việc', detail: 'Demo, báo giá, follow-up cần xử lý', icon: UsersRound, tone: 'text-amber-200 border-amber-500/20 bg-amber-500/10' },
    { label: 'Sản phẩm', value: '2 nhánh', detail: 'Accounting templates và AI tools', icon: FolderKanban, tone: 'text-cyan-200 border-cyan-500/20 bg-cyan-500/10' },
    { label: 'AI mission', value: 'Sẵn sàng', detail: 'Giao việc qua AI Operations', icon: Bot, tone: 'text-violet-200 border-violet-500/20 bg-violet-500/10' },
  ];

  const priorities = [
    { label: 'Chốt việc hôm nay', detail: 'Chọn 3 việc quan trọng nhất trước khi mở các lab phụ.', icon: CalendarCheck },
    { label: 'Kiểm tra tiền và pipeline', detail: 'Nhìn nhanh dòng tiền, khách hàng, demo và báo giá đang mở.', icon: BarChart3 },
    { label: 'Giao AI làm phần lặp lại', detail: 'Đưa research, content, kiểm tra dữ liệu hoặc report sang AI Operations.', icon: Bot },
  ];

  const quickActions: Array<{ label: string; tab: TabType; subTab?: string; icon: React.ComponentType<{ className?: string }> }> = [
    { label: 'Product roadmap', tab: 'product_studio', icon: FolderKanban },
    { label: 'Marketing plan', tab: 'marketing_growth', icon: Rocket },
    { label: 'Sales pipeline', tab: 'sales_crm', icon: UsersRound },
    { label: 'Finance control', tab: 'finance_accounting', icon: CircleDollarSign },
    { label: 'AI command', tab: 'ai_factory', subTab: 'command', icon: Bot },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> {focusTitle}
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">
              Hôm nay cần làm gì để công ty tiến lên?
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              Màn này chỉ giữ những tín hiệu cần quyết định: tiền, sales, sản phẩm, AI mission và cảnh báo cần duyệt.
              Các bảng kỹ thuật, hướng dẫn dài và robot logs được đặt ở lớp mở rộng.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100 lg:min-w-72">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-black uppercase tracking-[0.16em]">Cần chú ý</p>
            </div>
            <p className="mt-3 text-sm font-bold leading-6">
              Không mở toàn bộ module cùng lúc. Chọn một mục tiêu, giao AI phần lặp lại, rồi kiểm tra kết quả.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left">
              <div className={`inline-flex rounded-xl border p-3 ${metric.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
              <p className="mt-1 text-xl font-black text-white">{metric.value}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{metric.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <h2 className="text-base font-black text-white">Top priorities</h2>
          </div>
          <div className="mt-5 space-y-3">
            {priorities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-4 w-4 text-cyan-200" />
                    <div>
                      <h3 className="text-sm font-black text-white">{item.label}</h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-300" />
            <h2 className="text-base font-black text-white">Đi nhanh đến nơi làm việc</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => onNavigate(action.tab, action.subTab)}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left text-sm font-black text-slate-100 hover:border-cyan-500/40 hover:bg-slate-900"
                >
                  <Icon className="h-5 w-5 text-cyan-200" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:text-white">
          Mở dashboard chi tiết
        </summary>
        <div className="mt-5 space-y-6">
          <ERPCommandCenter onNavigate={onNavigate} />
          <CEOOverviewPanel />
          <CommandCenterV2DailyBriefPanel />
        </div>
      </details>

      <details className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left">
        <summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:text-white">
          Mở hướng dẫn và AI monitor nâng cao
        </summary>
        <div className="mt-5 space-y-6">
          <AiAgentControlCenter />
          <OnboardingGuide />
        </div>
      </details>
    </div>
  );
}
