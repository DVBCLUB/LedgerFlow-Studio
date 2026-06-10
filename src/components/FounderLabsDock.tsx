import React, { Suspense, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';

const FinanceLabMini = React.lazy(() => import('./FinanceLabMini'));
const DistributionLeadBoard = React.lazy(() => import('./DistributionLeadBoard'));
const PersonaInterviewLab = React.lazy(() => import('./PersonaInterviewLab'));
const ExperimentDecisionLog = React.lazy(() => import('./ExperimentDecisionLog'));
const ExperimentDashboard = React.lazy(() => import('./ExperimentDashboard'));
const AIStaffAssignmentBoard = React.lazy(() => import('./AIStaffAssignmentBoard'));
const MonthlyFounderReview = React.lazy(() => import('./MonthlyFounderReview'));
const OnePageFounderReport = React.lazy(() => import('./OnePageFounderReport'));
const WeeklyActionPlanner = React.lazy(() => import('./WeeklyActionPlanner'));
const DailyFounderStandup = React.lazy(() => import('./DailyFounderStandup'));
const StrategicLabsMini = React.lazy(() => import('./StrategicLabsMini'));
const LabsBackupRestore = React.lazy(() => import('./LabsBackupRestore'));
const ToolBudgetLedger = React.lazy(() => import('./ToolBudgetLedger'));
const ToolCancelPlan = React.lazy(() => import('./ToolCancelPlan'));

type LabId = 'dashboard' | 'ai_staff' | 'monthly_review' | 'one_page_report' | 'weekly_actions' | 'daily_standup' | 'finance' | 'tool_budget' | 'tool_cancel' | 'leads' | 'persona' | 'decisions' | 'strategy' | 'backup';

const labs: Array<{ id: LabId; label: string; note: string }> = [
  { id: 'dashboard', label: 'Experiment Dashboard', note: 'Tổng hợp interview, lead và quyết định.' },
  { id: 'ai_staff', label: 'AI Staff Board', note: 'Giao việc cho ChatGPT, Claude, Gemini, Copilot/Codex.' },
  { id: 'monthly_review', label: 'Monthly Review', note: 'Chốt tháng này nên BUILD, HOLD hay KILL.' },
  { id: 'one_page_report', label: 'One-Page Report', note: 'Báo cáo một trang để in hoặc save PDF.' },
  { id: 'weekly_actions', label: 'Weekly Actions', note: 'Kế hoạch tuần: việc, owner, deadline, trạng thái.' },
  { id: 'daily_standup', label: 'Daily Standup', note: 'Nhật ký ngày: focus, blocker, AI help, next step.' },
  { id: 'finance', label: 'Finance Lab', note: 'Burn rate, runway, MRR và margin.' },
  { id: 'tool_budget', label: 'Tool Budget', note: 'Theo dõi tiền AI, hosting, marketing và dev tool.' },
  { id: 'tool_cancel', label: 'Tool Cancel Plan', note: 'Lập lịch hủy tool, checklist backup và tiền tiết kiệm.' },
  { id: 'leads', label: 'Lead Board', note: 'Nguồn khách, demo, paid signal, next action.' },
  { id: 'persona', label: 'Persona Interview', note: 'Pain, pay signal và evidence score.' },
  { id: 'decisions', label: 'Decision Log', note: 'BUILD / HOLD / KILL có bằng chứng.' },
  { id: 'strategy', label: 'Strategic Labs', note: 'Persona, payment, distribution và game lab.' },
  { id: 'backup', label: 'Backup / Restore', note: 'Xuất, nhập và reset dữ liệu Founder Labs.' }
];

function renderLab(active: LabId) {
  if (active === 'dashboard') return <ExperimentDashboard />;
  if (active === 'ai_staff') return <AIStaffAssignmentBoard />;
  if (active === 'monthly_review') return <MonthlyFounderReview />;
  if (active === 'one_page_report') return <OnePageFounderReport />;
  if (active === 'weekly_actions') return <WeeklyActionPlanner />;
  if (active === 'daily_standup') return <DailyFounderStandup />;
  if (active === 'finance') return <FinanceLabMini />;
  if (active === 'tool_budget') return <ToolBudgetLedger />;
  if (active === 'tool_cancel') return <ToolCancelPlan />;
  if (active === 'leads') return <DistributionLeadBoard />;
  if (active === 'persona') return <PersonaInterviewLab />;
  if (active === 'decisions') return <ExperimentDecisionLog />;
  if (active === 'backup') return <LabsBackupRestore />;
  return <StrategicLabsMini />;
}

export default function FounderLabsDock() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LabId>('dashboard');

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {open && (
        <div className="mb-3 flex max-h-[84vh] w-[min(92vw,72rem)] flex-col overflow-hidden rounded-3xl border border-emerald-500/25 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Founder Labs</p>
              <h2 className="mt-1 text-lg font-black text-white">Bảng lab thương mại hóa</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Mở nhanh các lab mới mà không cần sửa route chính.</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-white" aria-label="Đóng Founder Labs">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_1fr]">
            <div className="space-y-2 overflow-y-auto border-b border-slate-800 p-3 md:border-b-0 md:border-r">
              {labs.map((lab) => (
                <button
                  key={lab.id}
                  onClick={() => setActive(lab.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    active === lab.id ? 'border-emerald-400 bg-emerald-500/10 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  <p className="text-xs font-black">{lab.label}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-400">{lab.note}</p>
                </button>
              ))}
            </div>

            <div className="max-h-[64vh] overflow-y-auto p-4">
              <Suspense fallback={<div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm font-bold text-slate-400">Đang mở lab...</div>}>
                {renderLab(active)}
              </Suspense>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 shadow-2xl hover:bg-emerald-300">
        <FlaskConical className="h-4 w-4" /> Labs
      </button>
    </div>
  );
}
