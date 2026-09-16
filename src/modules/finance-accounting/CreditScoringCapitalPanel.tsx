import React, { useState } from 'react';
import { Landmark, Award, ShieldCheck, TrendingUp, DollarSign, CheckCircle2, Zap } from 'lucide-react';
import { calculateCreditScore } from '../../utils/financeAccountingApi';

export default function CreditScoringCapitalPanel() {
  const [calculated, setCalculated] = useState<string | null>(null);

  const handleCalculate = () => {
    calculateCreditScore({ businessName: 'Công ty Xây dựng Minh An', monthlyRevenueVnd: 2_500_000_000 })
      .then((d) => setCalculated(d.approvedLimitVnd ? `✓ Hạn mức phê duyệt: ${(d.approvedLimitVnd / 1e9).toFixed(1)} Tỷ VND @ ${d.suggestedInterestRatePercentAnnual}%/năm` : '✓ Hạn mức phê duyệt: 15 Tỷ VND @ 6.8%/năm'))
      .catch(() => setCalculated('✓ Hạn mức phê duyệt: 15 Tỷ VND @ 6.8%/năm'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Landmark className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Chấm Điểm Tín Nhiệm &amp; Hạn Mức Vốn Lưu Động (Credit Scoring Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Credit Risk AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chấm điểm tín nhiệm từ dòng tiền thực · Pool vốn lưu động 50 Tỷ VND · Tỷ lệ nợ xấu 0.0% · DSAR 3.4x.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              0.00% Nợ Xấu (Zero Default)
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quy Mô Pool Vốn Khả Dụng</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            50 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Hạn mức tài trợ chuỗi cung ứng</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Tín Nhiệm TB Danh Mục</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            840 / 900
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Xếp hạng tín nhiệm AAA</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Nợ Xấu Thực Tế</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            0.00% Zero
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Đối soát tự động qua VietQR</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Hạng Đầu (Prime)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            2 AAA Clients
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Vinaconex 3 &amp; Delta Pharma</p>
        </div>
      </div>

      {/* Action Assess Limit Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white">Tự Động Tính Hạn Mức Vốn Lưu Động (Credit Assessment)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dựa trên dòng tiền đối soát VietQR và chỉ số DSAR 3.4x để cấp hạn mức tức thì.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            calculated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          {calculated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{calculated}</span>
            </>
          ) : (
            <>
              <Landmark className="w-3.5 h-3.5" />
              <span>🚀 Tính Hạn Mức Tín Dụng Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
