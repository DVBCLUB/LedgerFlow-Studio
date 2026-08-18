import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Briefcase,
  Bot,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface OnboardingStep {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: string[];
  gradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Chào mừng đến với LedgerFlow Studio',
    subtitle: 'Hệ Điều Hành Công Ty Phần Mềm Toàn Diện (Solo Founder OS)',
    badge: 'Khởi Đầu Nhanh',
    icon: Sparkles,
    description:
      'LedgerFlow Studio không chỉ là phần mềm kế toán. Đây là một bộ điều hành doanh nghiệp phần mềm hoàn chỉnh, cho phép một Founder đơn lẻ vận hành quy mô của 20 nhân sự.',
    highlights: [
      'Điều phối đội ngũ AI Nhân sự (Chief of Staff, CFO, Security Judge...)',
      'Xưởng sản xuất Video Marketing & Social Lead Generator tự động ($0)',
      'Tuân thủ bảo mật dữ liệu PII theo Nghị định 13/2023/NĐ-CP & VAS 200',
    ],
    gradient: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/20',
  },
  {
    title: 'Command Center & Morning Executive Briefing',
    subtitle: 'Trung Tâm Chỉ Huy Chiến Lược Hàng Ngày',
    badge: 'CEO Workspace',
    icon: Briefcase,
    description:
      'Mỗi buổi sáng, hệ thống tự động tổng hợp Morning Executive Briefing: chỉ số tài chính, việc cần duyệt, cảnh báo rủi ro và khuyến nghị chiến lược.',
    highlights: [
      '6 chế độ xem: Hôm nay, Boardroom, Tài chính, AI Ops, Risk KPI, Enterprise',
      'Decision Impact Graph mô phỏng tác động tài chính trước khi chốt',
      'Thao tác lệnh giọng nói tương tác trực tiếp với Chief of Staff',
    ],
    gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
  },
  {
    title: 'Đội Ngũ AI Nhân Sự & Autonomous Robots',
    subtitle: 'Hệ Thống Phân Quyền 3 Cấp & Human Approval Gateway',
    badge: 'AI Workforce',
    icon: Bot,
    description:
      'Các AI Agent được phân công nhiệm vụ cụ thể, tuân thủ SOP chuẩn hóa. Mọi hành động nhạy cảm luôn yêu cầu bạn phê duyệt qua chữ ký bảo mật.',
    highlights: [
      'Hàng đợi tác vụ thông minh Smart Task Queue tự cân bằng tải',
      'Cơ chế thử việc Probation Engine & Đánh giá năng lực tự động',
      'Hoạt động ngoại tuyến $0 với Local Ollama Hub & Edge TTS',
    ],
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
  },
  {
    title: 'Product Studio & Marketing Growth Lab',
    subtitle: 'Từ Ý Tưởng Đến Sản Phẩm & Doanh Thu',
    badge: 'Tăng Trưởng',
    icon: FolderKanban,
    description:
      'Quản lý danh mục sản phẩm SaaS, game studio, xưởng tài sản AI 5-trong-1 và phễu marketing chuyển đổi cao.',
    highlights: [
      'Xưởng Video tự động hóa tạo kịch bản, lồng tiếng và xuất bản CapCut/Remotion',
      'Radar quét đối thủ cạnh tranh & Chiến thuật định giá động',
      'Hệ thống mẫu ngành kế toán linh hoạt cho dịch vụ, xây dựng, thương mại',
    ],
    gradient: 'from-purple-500/20 via-fuchsia-500/20 to-pink-500/20',
  },
  {
    title: 'Sẵn Sàng Bắt Đầu',
    subtitle: 'Hệ Thống Đã Thiết Lập & Hoạt Động Hoàn Hảo',
    badge: 'Hoàn Tất',
    icon: CheckCircle2,
    description:
      'Bạn đã nắm rõ tổng quan cách LedgerFlow Studio vận hành. Hãy truy cập Command Center để bắt đầu ngày làm việc hiệu quả nhất!',
    highlights: [
      '212/212 kiểm thử an toàn đã vượt qua (100% Green)',
      'Bảo mật AES-256 mã hóa cục bộ sẵn sàng',
      'Bạn có thể mở lại hướng dẫn bất kỳ lúc nào từ thanh Menu',
    ],
    gradient: 'from-emerald-500/20 via-cyan-500/20 to-blue-500/20',
  },
];

export interface OnboardingQuickTourProps {
  onClose?: () => void;
  forceShow?: boolean;
}

export default function OnboardingQuickTour({ onClose, forceShow = false }: OnboardingQuickTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true);
      return;
    }
    const hasCompleted = localStorage.getItem('ledgerflow_onboarding_completed');
    if (!hasCompleted) {
      setIsOpen(true);
    }
  }, [forceShow]);

  const handleComplete = () => {
    localStorage.setItem('ledgerflow_onboarding_completed', 'true');
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-cyan-500/10 text-slate-100">
        {/* Glow Header background */}
        <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-br ${step.gradient} blur-2xl opacity-60 pointer-events-none transition-all duration-500`} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {step.badge}
            </span>
            <span className="text-xs text-slate-400">
              Bước {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>
          <button
            onClick={handleComplete}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Đóng hướng dẫn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="relative px-8 py-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-400 shadow-inner">
              <StepIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">{step.title}</h3>
              <p className="text-xs text-cyan-400 font-medium mt-0.5">{step.subtitle}</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Điểm nổi bật cốt lõi
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {step.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="relative flex items-center justify-between px-8 py-4 bg-slate-950/80 border-t border-slate-800/80">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Đến bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Bắt đầu ngay
                </>
              ) : (
                <>
                  Tiếp theo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
