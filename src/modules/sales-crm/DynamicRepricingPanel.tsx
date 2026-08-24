import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface DynamicPricingTier {
  tierId: string;
  tierName: string;
  basePriceVnd: number;
  elasticityDiscountPercent: number;
  finalOfferedPriceVnd: number;
  targetIndustry: string;
  recommendedContractDurationMonths: number;
  marginRetentionScore: number;
  winProbabilityScore: number;
}

export default function DynamicRepricingPanel() {
  const [tiers, setTiers] = useState<DynamicPricingTier[]>([]);
  const [avgMargin, setAvgMargin] = useState(92);
  const [avgWin, setAvgWin] = useState(90);

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/dormant/pricing/tiers');
      const data = await res.json();
      if (data?.success) {
        setTiers(data.tiers || []);
        setAvgMargin(data.averageMarginRetention || 92);
        setAvgWin(data.overallWinProbability || 90);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">💰 Autonomous Competitive Dynamic Repricing &amp; Margin Optimizer</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Elasticity AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động tối ưu hóa giá thầu và tỷ lệ chiết khấu linh hoạt theo quy mô dự án, ngành hàng và thời hạn hợp đồng để đạt tỷ lệ thắng thầu cao nhất.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Biên Lợi Nhuận Giữ Lại (Margin Retention)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{avgMargin}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tối đa hóa dòng tiền dương trên mỗi hợp đồng</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Thắng Thầu Dự Phóng (Win Rate)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{avgWin}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dựa trên mô hình định giá co giãn theo ngành</div>
        </div>
      </div>

      {/* Tiers List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div key={t.tierId} className="p-5 rounded-xl bg-white/4 border border-white/8 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t.targetIndustry}
              </span>
              <h4 className="text-xs font-bold text-white leading-snug">{t.tierName}</h4>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Giá niêm yết:</span>
                <span className="line-through">{formatMoneyVN(t.basePriceVnd, ' đ')}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-emerald-400 font-mono">
                <span>Giá đề xuất tối ưu:</span>
                <span>{formatMoneyVN(t.finalOfferedPriceVnd, ' đ')}</span>
              </div>
              <div className="text-[10px] text-cyan-300 text-right">
                Chiết khấu linh hoạt: -{t.elasticityDiscountPercent}%
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Hợp đồng: <strong>{t.recommendedContractDurationMonths} tháng</strong></span>
              <span className="text-emerald-400 font-bold">Win Rate: {t.winProbabilityScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
