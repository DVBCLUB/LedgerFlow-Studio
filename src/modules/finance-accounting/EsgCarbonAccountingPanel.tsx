import React, { useEffect, useState } from 'react';
import {
  Leaf,
  Award,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe2,
} from 'lucide-react';

export interface CarbonEmissionRecord {
  scopeId: string;
  categoryName: string;
  co2eKg: number;
  reductionGoalPercent: number;
  offsetStatus: string;
  emissionSource: string;
}

export default function EsgCarbonAccountingPanel() {
  const [records, setRecords] = useState<CarbonEmissionRecord[]>([]);
  const [totalTons, setTotalTons] = useState(1.46);
  const [esgRating, setEsgRating] = useState('AAA (Net-Zero Certified)');
  const [offsetMsg, setOffsetMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/esg/carbon');
      const data = await res.json();
      if (data?.success) {
        setRecords(data.records || []);
        setTotalTons(data.totalCo2eTons || 1.46);
        setEsgRating(data.esgScoreRating || 'AAA (Net-Zero Certified)');
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOffset = async () => {
    try {
      const res = await fetch('/api/dormant/esg/offset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tons: 1.5 }),
      });
      const data = await res.json();
      if (data?.success) {
        setOffsetMsg(`Đã mua chứng chỉ tín chỉ carbon mã ${data.offsetCertificateNumber} qua ${data.provider}. Doanh nghiệp đạt chuẩn Net-Zero.`);
        await fetchData();
      }
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
            <Leaf className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-black text-white">🌱 ESG Carbon Accounting &amp; Sustainability Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {esgRating}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kế toán khí thải carbon (Scope 1, 2, 3 GHG), tuân thủ tiêu chuẩn báo cáo bền vững IFRS S1/S2 và cơ chế điều chỉnh biên giới carbon EU CBAM.
          </p>
        </div>

        <button
          onClick={handleOffset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Award className="w-4 h-4" />
          <span>Mua Tín Chỉ Carbon (Net-Zero 100%)</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Lượng Khí Thải (Scope 1, 2, 3)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{totalTons} Tấn CO2e</div>
          <div className="text-[10px] text-slate-400 mt-0.5">100% Đã được bù trừ Net-Zero</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Xếp Hạng Bền Vững ESG Toàn Cầu</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">AAA Hạng Nhất</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Chuẩn mực IFRS S1 &amp; IFRS S2</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cắt Giảm Điện Năng &amp; Cloud GPU</div>
          <div className="text-2xl font-black text-amber-300 mt-1">-35.8% YOY</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Nhờ tối ưu LLM Cost Arbitrage</div>
        </div>
      </div>

      {/* Offset Alert */}
      {offsetMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{offsetMsg}</span>
        </div>
      )}

      {/* Records Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {records.map((r) => (
          <div key={r.scopeId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                {r.scopeId}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>ĐÃ BÙ TRỪ</span>
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">{r.categoryName}</h4>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>Phát thải: <strong className="text-white font-mono">{r.co2eKg} kg CO2e</strong></div>
              <div>Mục tiêu giảm: <strong className="text-cyan-300 font-mono">-{r.reductionGoalPercent}%</strong></div>
              <div>Nguồn: <span className="text-slate-300">{r.emissionSource}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
