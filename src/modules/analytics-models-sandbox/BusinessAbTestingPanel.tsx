import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle2,
  Trophy,
  ArrowRight,
  FlaskConical,
  BarChart3,
  Bot,
  Zap,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface ExperimentVariant {
  variantId: string;
  name: string;
  description: string;
  trafficPercentage: number;
  visitorsCount: number;
  conversionsCount: number;
  revenueGeneratedVnd: number;
  conversionRate: number;
}

export interface BusinessExperiment {
  experimentId: string;
  title: string;
  category: string;
  hypothesis: string;
  status: 'RUNNING' | 'WINNER_DECLARED' | 'CONCLUDED';
  variants: ExperimentVariant[];
  winningVariantId?: string;
  statisticalConfidence: number;
  startedAt: string;
  concludedAt?: string;
  autoApplyWinner: boolean;
}

export default function BusinessAbTestingPanel() {
  const [experiments, setExperiments] = useState<BusinessExperiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<BusinessExperiment | null>(null);

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/dormant/ab-testing/experiments');
      const data = await res.json();
      if (data?.success && data?.experiments) {
        setExperiments(data.experiments);
        if (!selectedExp && data.experiments.length > 0) {
          setSelectedExp(data.experiments[0]);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleApplyWinner = async (experimentId: string) => {
    try {
      await fetch('/api/dormant/ab-testing/apply-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      });
      await fetchExperiments();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-black text-white">🧪 Autonomous Business A/B Testing &amp; Offer Optimizer</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Auto-Graduation (p &lt; 0.05)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động chia tách lưu lượng truy cập (50/50), đo lường doanh thu trên mỗi khách truy cập (RPV) và áp dụng biến thể chiến thắng.
          </p>
        </div>
      </div>

      {/* Experiment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {experiments.map((exp) => (
          <div
            key={exp.experimentId}
            onClick={() => setSelectedExp(exp)}
            className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
              selectedExp?.experimentId === exp.experimentId
                ? 'bg-teal-500/15 border-teal-400/50 shadow-lg shadow-teal-500/10'
                : 'bg-white/4 hover:bg-white/6 border-white/8'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-300">
                  {exp.category}
                </span>
                <h4 className="text-xs font-bold text-white mt-1">{exp.title}</h4>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  exp.status === 'CONCLUDED'
                    ? 'bg-slate-700 text-slate-300'
                    : exp.status === 'WINNER_DECLARED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}
              >
                {exp.status === 'CONCLUDED' ? 'ĐÃ ÁP DỤNG' : exp.status === 'WINNER_DECLARED' ? 'CÓ KẾT QUẢ' : 'ĐANG CHẠY'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 italic">{exp.hypothesis}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="text-slate-400">Độ tin cậy thống kê:</span>
              <strong className="text-emerald-400 font-bold">{exp.statisticalConfidence}%</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Experiment Deep Dive */}
      {selectedExp && (
        <div className="p-5 rounded-xl bg-black/40 border border-white/8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/8">
            <div>
              <h3 className="text-sm font-bold text-white">{selectedExp.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Giả thuyết: {selectedExp.hypothesis}</p>
            </div>

            {selectedExp.status !== 'CONCLUDED' && selectedExp.winningVariantId && (
              <button
                onClick={() => handleApplyWinner(selectedExp.experimentId)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Áp Dụng Biến Thể Chiến Thắng (1-Click)</span>
              </button>
            )}
          </div>

          {/* Variants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedExp.variants.map((variant) => {
              const isWinner = selectedExp.winningVariantId === variant.variantId;
              return (
                <div
                  key={variant.variantId}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isWinner
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                      : 'bg-white/4 border-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWinner && <Trophy className="w-4 h-4 text-emerald-400" />}
                      <span className="text-xs font-bold text-white">{variant.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Traffic: {variant.trafficPercentage}%</span>
                  </div>

                  <p className="text-[11px] text-slate-300">{variant.description}</p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-400 uppercase">Lượt xem</div>
                      <div className="text-xs font-bold text-white mt-0.5">{variant.visitorsCount.toLocaleString()}</div>
                    </div>
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-400 uppercase">Tỷ lệ Chuyển Đổi</div>
                      <div className="text-xs font-bold text-cyan-300 mt-0.5">{variant.conversionRate}%</div>
                    </div>
                    <div className="p-2 rounded bg-black/40">
                      <div className="text-[9px] text-slate-400 uppercase">Doanh thu</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5 font-mono">
                        {formatMoneyVN(variant.revenueGeneratedVnd, ' đ')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
