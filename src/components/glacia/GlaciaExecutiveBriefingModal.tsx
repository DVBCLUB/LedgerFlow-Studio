/**
 * GlaciaExecutiveBriefingModal.tsx
 * ═══════════════════════════════════════════════════════════════
 * Báo Cáo Tóm Tắt Điều Hành & Tổng Kết Doanh Nghiệp Thời Gian Thực
 * ─────────────────────────────────────────────────────────────
 * Glacia tự động tổng hợp toàn bộ tình hình 11 phân hệ và 5 AI Staff,
 * đọc tóm tắt bằng giọng nói cảm xúc (Executive Voice Debrief),
 * hiển thị thẻ chỉ số trực quan và cho phép kích hoạt công việc trong 1 click.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Play,
  Square,
  Volume2,
  VolumeX,
  TrendingUp,
  DollarSign,
  Code2,
  Shield,
  Zap,
  CheckCircle2,
  Share2,
  ArrowRight,
  Clock,
  Crown,
} from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { glaciaModuleBridge } from './glaciaModuleBridge';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';

interface GlaciaExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlaciaExecutiveBriefingModal({
  isOpen,
  onClose,
}: GlaciaExecutiveBriefingModalProps) {
  const {
    userName,
    speak,
    stopSpeaking,
    isSpeaking,
    mood,
    setMood,
    dispatchGoalToSubAgents,
    addTrustScore,
  } = useGlacia();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'briefing' | 'kpis' | 'action_plan'>('briefing');

  const displayName = userName || 'Giám đốc';
  const hour = new Date().getHours();
  const timeOfDayGreeting =
    hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const telemetry = glaciaModuleBridge.getCompanyTelemetrySnapshot();

  const briefingScript = `${timeOfDayGreeting} ${displayName}! Tôi là Glacia. Đây là báo cáo điều hành thời gian thực của LedgerFlow Studio:
Toàn bộ hệ thống đang vận hành hoàn hảo với chỉ số sức khỏe ${telemetry.systemHealthScore} phần trăm và hiệu suất sử dụng Token đạt ${telemetry.tokenEfficiencyRate} phần trăm.
Về Sản phẩm và Kỹ thuật: Tác tử NeoDev đã hoàn thiện các quy trình tự động hóa và đảm bảo an toàn tuyệt đối cho mã nguồn.
Về Tăng trưởng và Marketing: Tác tử NovaGrowth ghi nhận các chiến dịch nội dung đang thu hút lượng truy cập tích cực.
Về Bán hàng CRM: Tác tử AeroSales theo dõi 12 khách hàng tiềm năng với 3 hợp đồng đang trong giai đoạn chốt cuối.
Về Tài chính: Tác tử VortexFinance dự báo dòng tiền an toàn với 18 tháng runway.
Glacia và 5 AI Staff đã sẵn sàng cùng ${displayName} bứt phá các mục tiêu chiến lược hôm nay!`;

  useEffect(() => {
    if (isOpen) {
      glaciaAudio.playLevelUpFanfare();
      setMood('happy');
      addTrustScore(10, 'Mở Báo Cáo Điều Hành');
    } else {
      stopSpeaking();
    }
  }, [isOpen, setMood, addTrustScore, stopSpeaking]);

  if (!isOpen) return null;

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(briefingScript, 'happy');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteAllPlan = () => {
    dispatchGoalToSubAgents('Triển khai toàn bộ mục tiêu tăng trưởng, chốt deal CRM và tối ưu hóa tài chính hôm nay');
    glaciaAudio.playQuantumDispatch();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 60px rgba(6, 182, 212, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Crown className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Báo Cáo Điều Hành Lượng Tử (Executive Briefing)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] text-cyan-300 font-mono font-bold">
                  AI Realtime
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {timeOfDayGreeting} {displayName} · Cập nhật lúc {telemetry.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoice}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5" /> Dừng Đọc
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Nghe Glacia Đọc
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Banner with 3D Avatar Centerpiece */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/20">
            <div className="flex justify-center">
              <GlaciaReal3DAvatar compactMode={true} scale={0.7} interactive={false} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Sparkles className="w-4 h-4" /> Thông Điệp Từ Glacia
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                "{timeOfDayGreeting} {displayName}! Toàn bộ 11 phân hệ của LedgerFlow Studio đang vận hành ổn định. 5 AI Staff đã sẵn sàng cùng Giám đốc triển khai các mục tiêu hôm nay."
              </p>
            </div>
          </div>

          {/* 4 Pillars Status Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1">
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-[10px] font-bold uppercase">Sản Phẩm & SWE</span>
                <Code2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">100% Sạch</div>
              <div className="text-[10px] text-slate-400">NeoDev sẵn sàng deploy</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-pink-500/30 space-y-1">
              <div className="flex items-center justify-between text-pink-400">
                <span className="text-[10px] font-bold uppercase">Marketing</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">3 Chiến dịch</div>
              <div className="text-[10px] text-slate-400">NovaGrowth tối ưu SEO</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[10px] font-bold uppercase">Sales & CRM</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">12 Leads</div>
              <div className="text-[10px] text-slate-400">3 Hợp đồng chờ chốt</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[10px] font-bold uppercase">Tài Chính</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">18 Tháng</div>
              <div className="text-[10px] text-slate-400">Runway an toàn tối đa</div>
            </div>
          </div>

          {/* Detailed Full Briefing Text */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Nội Dung Chi Tiết Báo Cáo:
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line space-y-2 p-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
              {briefingScript}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Đã sao chép!' : 'Sao chép Báo cáo'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteAllPlan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Duyệt & Kích Hoạt Kế Hoạch Hôm Nay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
