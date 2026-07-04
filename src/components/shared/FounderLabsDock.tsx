import React, { Suspense, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';

const StartHereLab = React.lazy(() => import('../../modules/analytics-models-sandbox/StartHereLab'));
const CompanyOS = React.lazy(() => import('../../modules/command-center/CEOOverviewPanel'));
const FinanceLabMini = React.lazy(() => import('../../modules/finance-accounting/FinanceLabMini'));
const DistributionLeadBoard = React.lazy(() => import('../../modules/sales-crm/components/DistributionLeadBoard'));
const PersonaInterviewLab = React.lazy(() => import('../../modules/sales-crm/components/PersonaInterviewLab'));
const ExperimentDecisionLog = React.lazy(() => import('../../modules/analytics-models-sandbox/ExperimentDecisionLog'));
const ExperimentDashboard = React.lazy(() => import('../../modules/analytics-models-sandbox/ExperimentDashboard'));
const AIStaffAssignmentBoard = React.lazy(() => import('../../modules/ai-nhan-su/PeopleTab'));
const AIOutputQualityReview = React.lazy(() => import('../../modules/ai-nhan-su/AIOutputQualityReview'));
const ContentRepurposeBoard = React.lazy(() => import('../../modules/marketing-growth/components/ContentRepurposeBoard'));
const SyntheticSurveyBuilder = React.lazy(() => import('../../modules/marketing-growth/components/SyntheticSurveyBuilder'));
const ABSimulationLab = React.lazy(() => import('../../modules/analytics-models-sandbox/ABSimulationLab'));
const MoRReadinessChecklist = React.lazy(() => import('../../modules/analytics-models-sandbox/MoRReadinessChecklist'));
const PricingOfferBuilder = React.lazy(() => import('../../modules/sales-crm/components/PricingOfferBuilder'));
const ProductLaunchChecklist = React.lazy(() => import('../../modules/marketing-growth/components/ProductLaunchChecklist'));
const LearningPathBuilder = React.lazy(() => import('../../modules/product-studio/GameAndMLWorkbench'));
const N8nAutomationBlueprint = React.lazy(() => import('../../modules/analytics-models-sandbox/N8nAutomationBlueprint'));
const MoatDefensibilityTracker = React.lazy(() => import('../../modules/analytics-models-sandbox/MoatDefensibilityTracker'));
const MultiIndustryCaseBank = React.lazy(() => import('../../modules/analytics-models-sandbox/MultiIndustryCaseBank'));
const AuditRedFlagGame = React.lazy(() => import('../../modules/product-studio/AuditRedFlagGame'));
const CashRunwayGame = React.lazy(() => import('../../modules/product-studio/CashRunwayGame'));
const PMFDecisionGame = React.lazy(() => import('../../modules/product-studio/PMFDecisionGame'));
const DocumentMatchingGame = React.lazy(() => import('../../modules/product-studio/DocumentMatchingGame'));
const CostFlowGame = React.lazy(() => import('../../modules/product-studio/CostFlowGame'));
const GameLibrary = React.lazy(() => import('../../modules/product-studio/GameLibrary'));
const GameProgressDashboard = React.lazy(() => import('../../modules/product-studio/GameProgressDashboard'));
const GameSessionHistory = React.lazy(() => import('../../modules/product-studio/GameSessionHistory'));
const MonthlyFounderReview = React.lazy(() => import('../../modules/finance-accounting/MonthlyFounderReview'));
const OnePageFounderReport = React.lazy(() => import('../../modules/finance-accounting/OnePageFounderReport'));
const WeeklyActionPlanner = React.lazy(() => import('../../modules/finance-accounting/WeeklyActionPlanner'));
const DailyFounderStandup = React.lazy(() => import('../../modules/finance-accounting/DailyFounderStandup'));
const StrategicLabsMini = React.lazy(() => import('../../modules/analytics-models-sandbox/StrategicLabsMini'));
const LabsBackupRestore = React.lazy(() => import('../LabsBackupRestore'));
const ToolBudgetLedger = React.lazy(() => import('../../modules/finance-accounting/ToolBudgetLedger'));
const ToolCancelPlan = React.lazy(() => import('../../modules/finance-accounting/ToolCancelPlan'));

type LabId = 'start_here' | 'company_os' | 'dashboard' | 'ai_staff' | 'ai_quality' | 'content' | 'synthetic_survey' | 'ab_simulation' | 'mor_readiness' | 'pricing_offer' | 'product_launch' | 'learning_path' | 'automation' | 'moat' | 'case_bank' | 'audit_game' | 'cash_runway_game' | 'pmf_game' | 'document_matching_game' | 'cost_flow_game' | 'game_library' | 'game_progress' | 'game_history' | 'monthly_review' | 'one_page_report' | 'weekly_actions' | 'daily_standup' | 'finance' | 'tool_budget' | 'tool_cancel' | 'leads' | 'persona' | 'decisions' | 'strategy' | 'backup';
type LabLane = 'Command' | 'Product' | 'Growth' | 'AI Ops' | 'Finance' | 'Learning' | 'Sandbox' | 'Control';

const labLanes: Array<{ id: LabLane; label: string }> = [
  { id: 'Command', label: 'Trung tâm Điều hành' },
  { id: 'Product', label: 'Xưởng Sản phẩm' },
  { id: 'Growth', label: 'Tăng trưởng & Khách hàng' },
  { id: 'AI Ops', label: 'Đội ngũ AI' },
  { id: 'Finance', label: 'Tài chính & Công cụ' },
  { id: 'Learning', label: 'Sản phẩm học tập' },
  { id: 'Sandbox', label: 'Phân tích & Tri thức' },
  { id: 'Control', label: 'Kiểm soát & Bàn giao' }
];

const labs: Array<{ id: LabId; label: string; note: string; lane: LabLane }> = [
  { id: 'start_here', label: 'Bắt đầu', note: 'Chọn đúng luồng dùng app, game, tài chính, sao lưu hoặc phát hành.', lane: 'Command' },
  { id: 'company_os', label: 'LedgerFlow OS', note: 'Toàn cảnh vận hành, đội ngũ AI, lộ trình, doanh thu và tăng trưởng.', lane: 'Command' },
  { id: 'dashboard', label: 'Bảng thử nghiệm', note: 'Tổng hợp phỏng vấn, lead và quyết định.', lane: 'Command' },
  { id: 'monthly_review', label: 'Rà soát tháng', note: 'Chốt tháng này nên xây tiếp, giữ lại hay dừng.', lane: 'Command' },
  { id: 'one_page_report', label: 'Báo cáo một trang', note: 'Báo cáo một trang để in hoặc lưu PDF.', lane: 'Command' },
  { id: 'weekly_actions', label: 'Kế hoạch tuần', note: 'Kế hoạch tuần: việc, phụ trách, hạn chót, trạng thái.', lane: 'Command' },
  { id: 'daily_standup', label: 'Nhật ký ngày', note: 'Nhật ký ngày: trọng tâm, điểm nghẽn, AI hỗ trợ, bước tiếp theo.', lane: 'Command' },
  { id: 'decisions', label: 'Sổ quyết định', note: 'Quyết định xây tiếp, giữ lại hoặc dừng đều có bằng chứng.', lane: 'Command' },
  { id: 'pricing_offer', label: 'Gói giá', note: 'Thiết kế gói bán, giá, cam kết, hoàn tiền và thử nghiệm trả phí.', lane: 'Product' },
  { id: 'product_launch', label: 'Ra mắt sản phẩm', note: 'Danh sách kiểm tra thử nghiệm trả phí, điểm sẵn sàng và điểm nghẽn.', lane: 'Product' },
  { id: 'moat', label: 'Lợi thế cạnh tranh', note: 'Theo dõi lợi thế dữ liệu, quy trình, phân phối và niềm tin.', lane: 'Product' },
  { id: 'strategy', label: 'Phòng chiến lược', note: 'Chân dung khách hàng, thanh toán, phân phối và game lab.', lane: 'Product' },
  { id: 'leads', label: 'Nguồn khách', note: 'Nguồn khách, demo, tín hiệu trả phí và hành động tiếp theo.', lane: 'Growth' },
  { id: 'persona', label: 'Phỏng vấn khách hàng', note: 'Nỗi đau, tín hiệu chi trả và điểm bằng chứng.', lane: 'Growth' },
  { id: 'content', label: 'Tái sử dụng nội dung', note: 'Biến case, lead, phỏng vấn thành bài viết, demo, email.', lane: 'Growth' },
  { id: 'synthetic_survey', label: 'Khảo sát giả lập', note: 'Khảo sát giả lập, cảnh báo thiên lệch và kế hoạch kiểm chứng.', lane: 'Growth' },
  { id: 'ab_simulation', label: 'Thử nghiệm A/B', note: 'So sánh giá, trang giới thiệu, onboarding và kịch bản demo.', lane: 'Growth' },
  { id: 'ai_staff', label: 'Bảng nhân sự AI', note: 'Giao việc cho ChatGPT, Claude, Gemini, Copilot/Codex.', lane: 'AI Ops' },
  { id: 'ai_quality', label: 'Duyệt kết quả AI', note: 'Kiểm tra kết quả AI trước khi dùng vào code, nội dung, tài liệu.', lane: 'AI Ops' },
  { id: 'automation', label: 'Kế hoạch tự động hóa', note: 'Luồng n8n, phê duyệt của người dùng và chống spam.', lane: 'AI Ops' },
  { id: 'finance', label: 'Phòng tài chính', note: 'Burn rate, runway, MRR và biên lợi nhuận.', lane: 'Finance' },
  { id: 'tool_budget', label: 'Ngân sách công cụ', note: 'Theo dõi tiền AI, hosting, marketing và công cụ phát triển.', lane: 'Finance' },
  { id: 'tool_cancel', label: 'Kế hoạch hủy công cụ', note: 'Lập lịch hủy công cụ, sao lưu và tiền tiết kiệm.', lane: 'Finance' },
  { id: 'case_bank', label: 'Kho tình huống', note: 'Tình huống kế toán/kiểm toán đa ngành và cảnh báo rủi ro.', lane: 'Learning' },
  { id: 'learning_path', label: 'Lộ trình học', note: 'Lộ trình học theo vai trò, ngành, bài tập và bằng chứng.', lane: 'Learning' },
  { id: 'audit_game', label: 'Game kiểm toán', note: 'Game chọn cảnh báo rủi ro và chứng từ cần kiểm tra.', lane: 'Learning' },
  { id: 'document_matching_game', label: 'Ghép chứng từ', note: 'Game ghép chứng từ với nghiệp vụ và rủi ro kiểm toán.', lane: 'Learning' },
  { id: 'cost_flow_game', label: 'Luồng chi phí', note: 'Game sắp xếp luồng chi phí theo ngành và chứng từ.', lane: 'Learning' },
  { id: 'cash_runway_game', label: 'Dòng tiền sống còn', note: 'Game runway, burn, MRR, churn và quyết định sống còn.', lane: 'Sandbox' },
  { id: 'pmf_game', label: 'Quyết định PMF', note: 'Game quyết định xây tiếp, giữ lại hoặc dừng theo tín hiệu thị trường.', lane: 'Sandbox' },
  { id: 'game_library', label: 'Thư viện game', note: 'Thư viện mini-game học kế toán, kiểm toán và tài chính founder.', lane: 'Sandbox' },
  { id: 'game_progress', label: 'Tiến độ chơi', note: 'Tổng hợp điểm, lượt thử và game nên chơi tiếp.', lane: 'Sandbox' },
  { id: 'game_history', label: 'Lịch sử chơi', note: 'Lịch sử từng lượt chơi, điểm, kết luận và ngày chơi.', lane: 'Sandbox' },
  { id: 'mor_readiness', label: 'Sẵn sàng bán hàng', note: 'Hoàn tiền, điều khoản, riêng tư, thuế và đường thanh toán.', lane: 'Control' },
  { id: 'backup', label: 'Sao lưu / Khôi phục', note: 'Xuất, nhập và đặt lại dữ liệu Founder Labs.', lane: 'Control' }
];

function renderLab(active: LabId) {
  if (active === 'start_here') return <StartHereLab />;
  if (active === 'company_os') return <CompanyOS />;
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
  if (active === 'cost_flow_game') return <CostFlowGame />;
  if (active === 'game_library') return <GameLibrary />;
  if (active === 'game_progress') return <GameProgressDashboard />;
  if (active === 'game_history') return <GameSessionHistory />;
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
  if (active === 'strategy') return <StrategicLabsMini />;
  if (active === 'backup') return <LabsBackupRestore />;
  return <StartHereLab />;
}

interface FounderLabsDockProps {
  embedded?: boolean;
}

export default function FounderLabsDock({ embedded = false }: FounderLabsDockProps) {
  const [open, setOpen] = useState(embedded);
  const [active, setActive] = useState<LabId>('start_here');

  return (
    <div className={embedded ? 'print:hidden' : 'fixed bottom-4 left-4 z-50 print:hidden'}>
      {(open || embedded) && (
        <div className={embedded ? 'flex min-h-[680px] w-full flex-col overflow-hidden rounded-lg border border-border-primary bg-bg-surface text-text-primary' : 'mb-3 flex max-h-[84vh] w-[min(92vw,72rem)] flex-col overflow-hidden rounded-3xl border border-success/25 bg-bg-surface/95 text-text-primary shadow-2xl backdrop-blur'}>
          <div className="flex items-start justify-between gap-4 border-b border-border-primary p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-success">Phòng thử nghiệm</p>
              <h2 className="mt-1 text-lg font-black text-white">Bảng thử nghiệm thương mại hóa</h2>
              <p className="mt-1 text-xs font-semibold text-text-secondary">Mở nhanh các khu thử nghiệm mà không cần sửa điều hướng chính.</p>
            </div>
            {!embedded && (
              <button onClick={() => setOpen(false)} className="rounded-xl border border-border-primary p-2 text-text-secondary hover:text-white" aria-label="Đóng Founder Labs">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_1fr]">
            <div className="space-y-4 overflow-y-auto border-b border-border-primary p-3 md:border-b-0 md:border-r">
              {labLanes.map((lane) => {
                const laneLabs = labs.filter((lab) => lab.lane === lane.id);
                if (laneLabs.length === 0) return null;

                return (
                  <div key={lane.id} className="space-y-2">
                    <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-success">{lane.label}</p>
                    {laneLabs.map((lab) => (
                      <button
                        key={lab.id}
                        onClick={() => setActive(lab.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          active === lab.id ? 'border-success bg-success/10 text-text-primary' : 'border-border-primary bg-bg-primary/60 text-text-secondary hover:border-success/50'
                        }`}
                      >
                        <p className="text-xs font-black">{lab.label}</p>
                        <p className="mt-1 text-[11px] font-semibold leading-5 text-text-secondary">{lab.note}</p>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="max-h-[64vh] overflow-y-auto p-4">
              <Suspense fallback={<div className="rounded-2xl border border-border-primary bg-bg-primary/70 p-6 text-sm font-bold text-text-secondary">Đang mở lab...</div>}>
                {renderLab(active)}
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {!embedded && (
        <button onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success px-4 py-3 text-xs font-black text-black shadow-2xl hover:bg-success/80">
          <FlaskConical className="h-4 w-4" /> Labs
        </button>
      )}
    </div>
  );
}
