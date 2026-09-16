/**
 * GlaciaEmbodiedGuide.tsx
 * ═══════════════════════════════════════════════════════════════
 * Embodied AI Agent — Spatial Guidance & System Action Pointer
 * Cho phép Glacia xuất hiện trực tiếp trên giao diện, chỉ trỏ
 * các thành phần UI, giải thích chức năng và thực thi hành động
 * trực tiếp trên LedgerFlow Studio.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, X, CheckCircle2, Zap, Compass, Play } from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { glaciaVoice } from './glaciaVoiceEngine';

export interface EmbodiedStep {
  id: string;
  title: string;
  description: string;
  workspacePath?: string;
  targetSelector?: string;
  highlightText?: string;
  suggestedActionLabel?: string;
  actionHandler?: () => void;
}

export const EMBODIED_PRESET_TOURS: Record<string, EmbodiedStep[]> = {
  quick_onboarding: [
    {
      id: 'step-product-studio',
      title: '1. Product Studio (Xưởng Sản Phẩm)',
      description: 'Nơi khởi tạo và quản lý toàn bộ sản phẩm phần mềm, template kế toán, AI bots và game tương tác.',
      workspacePath: 'product_studio',
      highlightText: 'Product Studio',
      suggestedActionLabel: 'Khám phá Product Studio',
    },
    {
      id: 'step-growth',
      title: '2. Marketing & Growth',
      description: 'Lập chiến dịch định vị, tạo nội dung viral, kịch bản video TikTok và khảo sát khách hàng tự động.',
      workspacePath: 'marketing_growth',
      highlightText: 'Marketing & Growth',
      suggestedActionLabel: 'Xem Kế hoạch Tăng trưởng',
    },
    {
      id: 'step-sales',
      title: '3. Sales & CRM Pipeline',
      description: 'Quản lý Lead, tự động gửi báo giá, demo sản phẩm và bám đuổi chuyển đổi deal khách hàng.',
      workspacePath: 'sales_crm',
      highlightText: 'Sales & CRM',
      suggestedActionLabel: 'Mở Pipeline Bán hàng',
    },
    {
      id: 'step-ai-staff',
      title: '4. AI Nhân Sự (5 AI Staff Chuyên Trách)',
      description: 'NeoDev (Tech), NovaGrowth (Marketing), AeroSales (Sales), VortexFinance (Tài chính), AegisAudit (Kiểm toán).',
      workspacePath: 'ai_factory',
      highlightText: 'AI Nhân sự',
      suggestedActionLabel: 'Xem Đội ngũ AI',
    },
    {
      id: 'step-finance',
      title: '5. Finance & Accounting',
      description: 'Hóa đơn, báo cáo tài chính chuẩn mực, kiểm toán chi phí token AI và dự phóng dòng tiền realtime.',
      workspacePath: 'finance_accounting',
      highlightText: 'Tài chính - Kế toán',
      suggestedActionLabel: 'Xem Báo cáo Tài chính',
    },
  ],
};

export default function GlaciaEmbodiedGuide() {
  const {
    activeGuideTour,
    setActiveGuideTour,
    guideStepIndex,
    setGuideStepIndex,
    setMood,
    setSpeechBubble,
  } = useGlacia();

  const [tourSteps, setTourSteps] = useState<EmbodiedStep[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (activeGuideTour && EMBODIED_PRESET_TOURS[activeGuideTour]) {
      setTourSteps(EMBODIED_PRESET_TOURS[activeGuideTour]);
    } else {
      setTourSteps([]);
    }
  }, [activeGuideTour]);

  const currentStep = tourSteps[guideStepIndex];

  // Voice narration when step changes
  useEffect(() => {
    if (currentStep) {
      glaciaAudio.playHologramScan();
      setMood('dispatching');
      const speech = `Glacia đang hướng dẫn bước ${guideStepIndex + 1}: ${currentStep.title}. ${currentStep.description}`;
      setSpeechBubble(speech);
      glaciaVoice.speak(speech);
    }
  }, [guideStepIndex, currentStep, setMood, setSpeechBubble]);

  if (!activeGuideTour || !currentStep) return null;

  const handleNextStep = () => {
    glaciaAudio.playCrystalChime(1046.5);
    if (guideStepIndex + 1 < tourSteps.length) {
      setGuideStepIndex(guideStepIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevStep = () => {
    if (guideStepIndex > 0) {
      setGuideStepIndex(guideStepIndex - 1);
    }
  };

  const handleClose = () => {
    setActiveGuideTour(null);
    setGuideStepIndex(0);
    setMood('happy');
    const endMsg = 'Glacia đã hoàn thành hướng dẫn không gian! Bạn có thể gọi tôi bất cứ lúc nào.';
    setSpeechBubble(endMsg);
    glaciaVoice.speak(endMsg);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center pb-24 sm:pb-16 px-4">
      {/* Holographic Guide Spotlight Card */}
      <div className="pointer-events-auto max-w-lg w-full bg-slate-950/95 border-2 border-cyan-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl animate-fade-in text-white relative">
        {/* Floating Mini Glacia Head Avatar */}
        <div className="absolute -top-7 left-6 flex items-center gap-2 bg-slate-900 border border-cyan-400/80 px-3 py-1 rounded-full shadow-lg">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-cyan-300">
            <img src="/glacia-avatar.png" alt="Glacia" className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] font-black text-cyan-300 tracking-wide uppercase">
            Glacia Embodied Guide
          </span>
          <span className="text-[10px] text-slate-400">
            ({guideStepIndex + 1}/{tourSteps.length})
          </span>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-3.5 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="mt-2 space-y-2">
          <h3 className="text-base font-bold text-cyan-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mt-4 pt-3 border-t border-cyan-500/30 flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={guideStepIndex === 0}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              guideStepIndex === 0
                ? 'opacity-40 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Quay lại
          </button>

          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === guideStepIndex ? 'w-5 bg-cyan-400 shadow-sm' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 hover:from-cyan-400 hover:to-indigo-400 transition-all shadow-md shadow-cyan-500/25"
          >
            <span>{guideStepIndex + 1 === tourSteps.length ? 'Hoàn thành' : 'Tiếp tục'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
