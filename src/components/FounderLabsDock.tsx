import React, { Suspense, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';

const FinanceLabMini = React.lazy(() => import('./FinanceLabMini'));
const DistributionLeadBoard = React.lazy(() => import('./DistributionLeadBoard'));
const PersonaInterviewLab = React.lazy(() => import('./PersonaInterviewLab'));
const ExperimentDecisionLog = React.lazy(() => import('./ExperimentDecisionLog'));
const ExperimentDashboard = React.lazy(() => import('./ExperimentDashboard'));
const AIStaffAssignmentBoard = React.lazy(() => import('./AIStaffAssignmentBoard'));
const AIOutputQualityReview = React.lazy(() => import('./AIOutputQualityReview'));
const ContentRepurposeBoard = React.lazy(() => import('./ContentRepurposeBoard'));
const SyntheticSurveyBuilder = React.lazy(() => import('./SyntheticSurveyBuilder'));
const ABSimulationLab = React.lazy(() => import('./ABSimulationLab'));
const MoRReadinessChecklist = React.lazy(() => import('./MoRReadinessChecklist'));
const PricingOfferBuilder = React.lazy(() => import('./PricingOfferBuilder'));
const ProductLaunchChecklist = React.lazy(() => import('./ProductLaunchChecklist'));
const LearningPathBuilder = React.lazy(() => import('./LearningPathBuilder'));
const N8nAutomationBlueprint = React.lazy(() => import('./N8nAutomationBlueprint'));
const MoatDefensibilityTracker = React.lazy(() => import('./MoatDefensibilityTracker'));
const MultiIndustryCaseBank = React.lazy(() => import('./MultiIndustryCaseBank'));
const AuditRedFlagGame = React.lazy(() => import('./AuditRedFlagGame'));
const CashRunwayGame = React.lazy(() => import('./CashRunwayGame'));
const PMFDecisionGame = React.lazy(() => import('./PMFDecisionGame'));
const DocumentMatchingGame = React.lazy(() => import('./DocumentMatchingGame'));
const GameLibrary = React.lazy(() => import('./GameLibrary'));
const MonthlyFounderReview = React.lazy(() => import('./MonthlyFounderReview'));
const OnePageFounderReport = React.lazy(() => import('./OnePageFounderReport'));
const WeeklyActionPlanner = React.lazy(() => import('./WeeklyActionPlanner'));
const DailyFounderStandup = React.lazy(() => import('./DailyFounderStandup'));
const StrategicLabsMini = React.lazy(() => import('./StrategicLabsMini'));
const LabsBackupRestore = React.lazy(() => import('./LabsBackupRestore'));
const ToolBudgetLedger = React.lazy(() => import('./ToolBudgetLedger'));
const ToolCancelPlan = React.lazy(() => import('./ToolCancelPlan'));

type LabId = 'dashboard' | 'ai_staff' | 'ai_quality' | 'content' | 'synthetic_survey' | 'ab_simulation' | 'mor_readiness' | 'pricing_offer' | 'product_launch' | 'learning_path' | 'automation' | 'moat' | 'case_bank' | 'audit_game' | 'cash_runway_game' | 'pmf_game' | 'document_matching_game' | 'game_library' | 'monthly_review' | 'one_page_report' | 'weekly_actions' | 'daily_standup' | 'finance' | 'tool_budget' | 'tool_cancel' | 'leads' | 'persona' | 'decisions' | 'strategy' | 'backup';

const labs: Array<{ id: LabId; label: string; note: string }> = [
  { id: 'dashboard', label: 'Experiment Dashboard', note: 'Tổng hợp interview, lead và quyết định.' },
  { id: 'ai_staff', label: 'AI Staff Board', note: 'Giao việc cho ChatGPT, Claude, Gemini, Copilot/Codex.' },
  { id: 'ai_quality', label: 'AI Quality Review', note: 'Kiểm tra output AI trước khi dùng vào code, content, tài liệu.' },
  { id: 'content', label: 'Content Repurpose', note: 'Biến case, lead, interview thành post, demo, email.' },
  { id: 'synthetic_survey', label: 'Synthetic Survey', note: 'Khảo sát giả lập, bias warning và validation plan.' },
  { id: 'ab_simulation', label: 'A/B Simulation', note: 'So sánh pricing, landing, onboarding, demo script.' },
  { id: 'mor_readiness', label: 'MoR Readiness', note: 'Refund, terms, privacy, tax note và payment path.' },
  { id: 'pricing_offer', label: 'Pricing Offer', note: 'Thiết kế gói bán, giá, promise, refund và pilot.' },
  { id: 'product_launch', label: 'Product Launch', note: 'Checklist paid pilot, launch score và blocker.' },
  { id: 'learning_path', label: 'Learning Path', note: 'Lộ trình học theo vai trò, ngành, bài tập và evidence.' },
  { id: 'automation', label: 'Automation Blueprint', note: 'n8n workflow, human approval và anti-spam guard.' },
  { id: 'moat', label: 'Moat Tracker', note: 'Theo dõi lợi thế dữ liệu, workflow, phân phối và trust.' },
  { id: 'case_bank', label: 'Case Bank', note: 'Case kế toán/kiểm toán đa ngành và red flags.' },
  { id: 'audit_game', label: 'Audit Game', note: 'Game chọn red flags và chứng từ cần kiểm tra.' },
  { id: 'cash_runway_game', label: 'Cash Runway Game', note: 'Game runway, burn, MRR, churn và quyết định sống còn.' },
  { id: 'pmf_game', label: 'PMF Decision Game', note: 'Game quyết định BUILD/HOLD/KILL theo tín hiệu thị trường.' },
  { id: 'document_matching_game', label: 'Document Matching Game', note: 'Game ghép chứng từ với nghiệp vụ và rủi ro kiểm toán.' },
  { id: 'game_library', label: 'Game Library', note: 'Thư viện mini-game học kế toán, kiểm toán và founder finance.' },
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
  if (active === 'ai_quality') return <AIOutputQualityReview />;
  if (active === 'content') return <ContentRepurposeBoard />;
  if (active === 'synthetic_survey') return <SyntheticSurveyBuilder />;
  if (active === 'ab_simulation') return <ABSimulationLab />;
  if (active === 'mor_readiness') return <MoRReadinessChecklist />;
  if (active === 'pricing_offer') return <PricingOfferBuilder />;
  if (active === 'product_launch') return <ProductLaunchChecklist />;
  if (active === 'learning_path') return <LearningPathBuilder />;
  if (active === 'automation') return <N8nAutomationBlueprint />;
  if (active === 'moat') return <MoatDefensibilityTracker />;
  if (active === 'case_bank') return <MultiIndustryCaseBank />;
  if (active === 'audit_game') return <AuditRedFlagGame />;
  if (active === 'cash_runway_game') return <CashRunwayGame />;
  if (active === 'pmf_game') return <PMFDecisionGame />;
  if (active === 'document_matching_game') return <DocumentMatchingGame />;
  if (active === 'game_library') return <GameLibrary />;
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
