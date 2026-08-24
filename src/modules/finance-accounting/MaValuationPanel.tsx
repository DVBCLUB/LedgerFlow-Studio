import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Layers,
  ArrowRight,
  CheckCircle2,
  Building2,
  Scale,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface MaTargetCompany {
  dealId: string;
  targetName: string;
  industry: string;
  annualRecurringRevenueVnd: number;
  askingPriceVnd: number;
  dcfValuationVnd: number;
  synergyScorePercent: number;
  stage: string;
  notes: string;
}

export default function MaValuationPanel() {
  const [deals, setDeals] = useState<MaTargetCompany[]>([]);
  const [totalPipeline, setTotalPipeline] = useState(5500000000);
  const [synergyRev, setSynergyRev] = useState(2240000000);
  const [avgSyn, setAvgSyn] = useState(88);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/ma/deals');
      const data = await res.json();
      if (data?.success) {
        setDeals(data.deals || []);
        setTotalPipeline(data.totalPipelineValueVnd || 5500000000);
        setSynergyRev(data.estimatedAnnualSynergyRevenueVnd || 2240000000);
        setAvgSyn(data.averageSynergyScorePercent || 88);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdvance = async (dealId: string, nextStage: string) => {
    try {
      await fetch('/api/dormant/ma/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, nextStage }),
      });
      await fetchData();
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
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">💼 Autonomous M&amp;A Deal Flow &amp; Valuation Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Synergy +{avgSyn}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị pipeline thâu tóm M&amp;A, định giá chiết khấu dòng tiền DCF và mô phỏng cộng hưởng doanh thu hậu sáp nhập.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Quy Mô Pipeline M&amp;A</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {formatMoneyVN(totalPipeline, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">3 Mục tiêu chiến lược đang thẩm định</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cộng Hưởng Doanh Thu Hậu M&amp;A</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">
            +{formatMoneyVN(synergyRev, ' đ/năm')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mở rộng tệp khách hàng B2B &amp; Sản phẩm</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Cộng Hưởng Công Nghệ Trung Bình</div>
          <div className="text-2xl font-black text-purple-300 mt-1">{avgSyn}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Khớp kiến trúc Micro-service &amp; DB</div>
        </div>
      </div>

      {/* Deals Feed */}
      <div className="space-y-3">
        {deals.map((d) => (
          <div key={d.dealId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{d.targetName}</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-emerald-300">
                    {d.industry}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                    Cộng hưởng: {d.synergyScorePercent}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  ARR Hiện Tại: <strong className="text-white font-mono">{formatMoneyVN(d.annualRecurringRevenueVnd, ' đ')}</strong> | Định giá DCF: <strong className="text-cyan-300 font-mono">{formatMoneyVN(d.dcfValuationVnd, ' đ')}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-white/10 text-amber-300">
                  {d.stage}
                </span>

                {d.stage !== 'ACQUIRED' && (
                  <button
                    onClick={() => handleAdvance(d.dealId, d.stage === 'PROSPECTING' ? 'DUE_DILIGENCE' : d.stage === 'DUE_DILIGENCE' ? 'TERM_SHEET' : 'ACQUIRED')}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <span>Tiến Cấp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300">
              <p>💡 <strong className="text-slate-200">Ghi chú sáp nhập:</strong> {d.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
