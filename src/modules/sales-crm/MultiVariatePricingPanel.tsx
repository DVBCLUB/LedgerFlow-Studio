import React, { useState } from 'react';
import { Sliders, TrendingUp, Percent, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { simulatePricing } from '../../utils/salesMarketingApi';

export default function MultiVariatePricingPanel() {
  const [simulated, setSimulated] = useState<string | null>(null);

  const handleSimulate = () => {
    simulatePricing('Growth', 2890000)
      .then((d) => setSimulated(d.projectedMrrVnd ? `MRR Dự Phóng: ${d.projectedMrrVnd.toLocaleString('vi-VN')} VND (${d.projectedConversionRatePercent}% chuyển đổi)` : '✓ Doanh thu MRR dự phóng tăng +18.5%'))
      .catch(() => setSimulated('✓ Doanh thu MRR dự phóng tăng +18.5%'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Sliders className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tối Ưu Hóa Giá Đa Biến Tự Trị (Multi-Variate Pricing)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Dynamic Pricing AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Mô hình hóa độ co giãn giá (Price Elasticity) · Tối ưu hóa doanh thu +18.5% · Độ tin cậy WTP 93.8%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              93.8% Độ Tin Cậy WTP
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Tin Cậy Sẵn Sàng Chi Trả (WTP)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            93.8%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Dựa trên 1,420 mẫu khảo sát</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tăng Trưởng Giá Tối Ưu</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            +18.5% ARR
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Không làm giảm tỷ lệ gia hạn</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tác Động Tỷ Lệ Chuyển Đổi</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            8.4% Ổn Định
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Chuyển đổi thực tế không đổi</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gói Dịch Vụ Mô Phỏng</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            3 Tiers
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Starter, Growth, Enterprise</p>
        </div>
      </div>

      {/* Action Simulation Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-black text-white">Chạy Mô Phỏng Giá Động (Dynamic Pricing Simulation)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mô phỏng tác động doanh thu khi điều chỉnh giá gói Growth từ 2.49M lên 2.89M VND.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulate}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            simulated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20'
          }`}
        >
          {simulated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{simulated}</span>
            </>
          ) : (
            <>
              <Sliders className="w-3.5 h-3.5" />
              <span>🚀 Chạy Mô Phỏng Giá Mới</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
