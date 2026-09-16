import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, ShieldAlert, Sparkles, Activity, Target, ArrowUpRight, ArrowDownRight, Sliders } from 'lucide-react';
import { getPredictiveRevenue, type PredictiveRevenueData } from '../../utils/businessInsightsApi';

const FORECAST = [
  { month: 'Tháng 9, 2026', p10: 30.5, p50: 31.8, p90: 33.2, growth: '+5.2%' },
  { month: 'Tháng 10, 2026', p50: 33.0, p10: 31.4, p90: 34.7, growth: '+3.8%' },
  { month: 'Tháng 11, 2026', p50: 34.2, p10: 32.3, p90: 36.2, growth: '+3.6%' },
];

const DRIVERS = [
  { d: 'Tỷ lệ Chuyển đổi PLG Upsell +34.7%', impact: 'positive', mag: '+₫3.2B ARR' },
  { d: 'Tỷ lệ Hoàn thành Onboarding 94.2%', impact: 'positive', mag: '+₫2.1B ARR' },
  { d: 'Doanh nghiệp Delta Corp thanh toán quá hạn', impact: 'negative', mag: '-₫360M ARR' },
  { d: 'Khách hàng mới gói Doanh Nghiệp Tier 3', impact: 'positive', mag: '+₫1.8B ARR' },
];

export default function PredictiveRevenuePanel() {
  const [churnDelta, setChurnDelta] = useState(5);
  const [scenarioRun, setScenarioRun] = useState(false);
  const [data, setData] = useState<PredictiveRevenueData | null>(null);

  useEffect(() => {
    getPredictiveRevenue().then(setData).catch(() => {});
  }, []);

  const impact = -(29760 * churnDelta / 100 * 0.42);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <TrendingUp className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Dự Báo Doanh Thu 90 Ngày & Mô Phỏng ARR</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Monte Carlo AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Dự báo doanh thu định kỳ 90 ngày tới với dải tin cậy xác suất P10 / P50 / P90 và công cụ thử nghiệm kịch bản rủi ro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Độ tin cậy: {data ? data.confidencePercent + '%' : '87.3%'}
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ARR Hiện Tại</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {data ? '₫' + (data.currentArrVnd / 1e9).toFixed(2) + 'B' : '₫29.76B'}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Doanh thu định kỳ năm</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dự Báo ARR (90 Ngày)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {data ? '₫' + (data.forecastedArrVnd90d / 1e9).toFixed(2) + 'B' : '₫34.20B'}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.9% Tăng trưởng dự kiến</span>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Tin Cậy Mô Hình</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            {data ? data.confidencePercent + '%' : '87.3%'}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">10,000 vòng Monte Carlo</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rủi Ro Rời Bỏ (Churn)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {data ? data.churnRiskPercent + '%' : '4.2%'}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Mức an toàn (&lt; 5.0%)</p>
        </div>
      </div>

      {/* 90-Day Forecast Bands */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Dải Dự Báo 3 Tháng Tới (P10 / P50 / P90)</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Đơn vị: Tỷ VNĐ (Billion VND)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FORECAST.map((f) => (
            <div key={f.month} className="rounded-2xl bg-slate-950/90 border border-slate-800/80 p-4 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300">{f.month}</span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {f.growth}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kịch bản Thận trọng (P10):</span>
                  <strong className="font-mono text-slate-300">₫{f.p10}B</strong>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-white bg-slate-900/80 p-2 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-300">Kịch bản Mục tiêu (P50):</span>
                  <strong className="font-mono text-emerald-400 text-sm">₫{f.p50}B</strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kịch bản Bứt phá (P90):</span>
                  <strong className="font-mono text-slate-300">₫{f.p90}B</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drivers & What-If Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Drivers */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Động Lực Tăng Trưởng & Rủi Ro Chính</h2>
          </div>
          <div className="space-y-2.5">
            {(data ? data.keyDrivers.map((d) => ({ d: d.driver, impact: d.impact, mag: d.magnitude })) : DRIVERS).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  {d.impact === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-slate-300 font-medium">{d.d}</span>
                </div>
                <span className={`font-mono font-bold whitespace-nowrap ml-3 ${d.impact === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {d.mag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What-If Simulator */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Mô Phỏng Kịch Bản Rủi Ro (What-If)</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Tỷ lệ Churn khách hàng tăng thêm:</span>
                <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  +{churnDelta}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={churnDelta}
                onChange={(e) => {
                  setChurnDelta(+e.target.value);
                  setScenarioRun(false);
                }}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1% (Thấp)</span>
                <span>10% (Trung bình)</span>
                <span>20% (Khủng hoảng)</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setScenarioRun(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              🚀 Chạy Mô Phỏng Kịch Bản
            </button>

            {scenarioRun && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 animate-fade-in">
                <div className="text-xs font-bold text-rose-300 flex items-center justify-between">
                  <span>Tác động Doanh thu ARR:</span>
                  <span className="font-mono text-sm">{impact.toFixed(0)} Triệu đ ({- (churnDelta * 0.42).toFixed(1)}%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Đề xuất AI: Tự động kích hoạt Loyalty Gamification & Chiến dịch CSKH chủ động để bảo vệ Retention.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
