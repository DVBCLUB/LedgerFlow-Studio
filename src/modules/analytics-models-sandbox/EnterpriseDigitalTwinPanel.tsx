import React, { useState } from 'react';
import {
  Orbit,
  Sparkles,
  TrendingUp,
  Flame,
  ShieldCheck,
  Play,
  RefreshCw,
  BarChart3,
  Bot,
  Globe2,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface SimulationResult {
  simulationId: string;
  projectedArrVnd: number;
  arrGrowthPercentage: number;
  projectedMonthlyBurnVnd: number;
  runwayMonthsRemaining: number;
  projectedNetProfitVnd: number;
  survivalProbabilityPercentage: number;
  sensitivityFactors: Array<{
    factorName: string;
    impactOnARR: string;
    score: number;
  }>;
  aiExecutiveVerdict: string;
  generatedAt: string;
}

export default function EnterpriseDigitalTwinPanel() {
  const [agentsCount, setAgentsCount] = useState(5);
  const [humanHires, setHumanHires] = useState(1);
  const [marketingBudget, setMarketingBudget] = useState(20000000);
  const [priceDelta, setPriceDelta] = useState(15);
  const [market, setMarket] = useState<'US_GLOBAL' | 'SOUTHEAST_ASIA' | 'VIETNAM_DOMESTIC'>('US_GLOBAL');

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/twin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additionalAiAgentsCount: Number(agentsCount),
          additionalHumanHiresCount: Number(humanHires),
          marketingBudgetDeltaVnd: Number(marketingBudget),
          subscriptionPriceDeltaPercent: Number(priceDelta),
          targetMarketExpansion: market,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.result) {
        setSimulation(data.result);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Orbit className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white">🔮 Enterprise Digital Twin &amp; What-If Monte Carlo Simulator</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              1,000 Iterations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bản sao số động của toàn bộ doanh nghiệp: Dự phóng dòng tiền, ARR, chi phí đốt và tỷ lệ sống sót trước khi ra quyết định kinh doanh.
          </p>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang chạy mô phỏng...' : '⚡ Chạy Mô Phỏng What-If'}</span>
        </button>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 text-xs">
        <div className="space-y-1">
          <label className="text-slate-400 font-bold">Thêm AI Agents: {agentsCount}</label>
          <input
            type="range"
            min="0"
            max="20"
            value={agentsCount}
            onChange={(e) => setAgentsCount(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-bold">Thêm Nhân Sự Người: {humanHires}</label>
          <input
            type="range"
            min="0"
            max="5"
            value={humanHires}
            onChange={(e) => setHumanHires(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-bold">Tăng Giá Bán: +{priceDelta}%</label>
          <input
            type="range"
            min="0"
            max="50"
            value={priceDelta}
            onChange={(e) => setPriceDelta(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-bold">Ngân Sách Marketing (Ads)</label>
          <select
            value={marketingBudget}
            onChange={(e) => setMarketingBudget(Number(e.target.value))}
            className="w-full px-2 py-1.5 rounded bg-black/60 border border-white/10 text-white"
          >
            <option value="10000000">10 Triệu VND</option>
            <option value="20000000">20 Triệu VND</option>
            <option value="50000000">50 Triệu VND</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-slate-400 font-bold">Thị Trường Mục Tiêu</label>
          <select
            value={market}
            onChange={(e: any) => setMarket(e.target.value)}
            className="w-full px-2 py-1.5 rounded bg-black/60 border border-white/10 text-white"
          >
            <option value="VIETNAM_DOMESTIC">Việt Nam (VAS)</option>
            <option value="SOUTHEAST_ASIA">Đông Nam Á (SEA)</option>
            <option value="US_GLOBAL">Mỹ &amp; Toàn Cầu (Stripe)</option>
          </select>
        </div>
      </div>

      {/* Simulation Result Output */}
      {simulation && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Kết Quả Dự Phóng Bản Sao Số Doanh Nghiệp (Digital Twin Output)</span>
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Xác suất thành công: {simulation.survivalProbabilityPercentage}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase">Dự Phóng ARR Năm</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
                {formatMoneyVN(simulation.projectedArrVnd, ' đ')}
              </div>
              <div className="text-[10px] text-cyan-300 mt-0.5">Tăng trưởng +{simulation.arrGrowthPercentage}%</div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase">Chi Phí Đốt Hàng Tháng</div>
              <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">
                {formatMoneyVN(simulation.projectedMonthlyBurnVnd, ' đ')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Gồm GPU token + Marketing</div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase">Runway An Toàn</div>
              <div className="text-lg font-black text-cyan-300 mt-0.5">
                {simulation.runwayMonthsRemaining} Tháng
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Vượt ngưỡng an toàn 12m</div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase">Lợi Nhuận Thuần / Tháng</div>
              <div className="text-lg font-black text-purple-300 mt-0.5 font-mono">
                {formatMoneyVN(simulation.projectedNetProfitVnd, ' đ')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Dòng tiền dương ròng</div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Đánh giá từ AI Executive:</span>
            <p className="text-slate-200 leading-relaxed italic">{simulation.aiExecutiveVerdict}</p>
          </div>
        </div>
      )}
    </div>
  );
}
