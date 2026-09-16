import React, { useState } from 'react';
import { DollarSign, TrendingUp, Percent, Clock, CheckCircle2, Zap } from 'lucide-react';

export default function OvernightYieldSweepPanel() {
  const [swept, setSwept] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Quét Lợi Suất Tiền Mặt Nhàn Rỗi Qua Đêm (Overnight Yield Sweep)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Treasury Sweep
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quét số dư tiền mặt nhàn rỗi 28.4 Tỷ VND · Tối ưu hóa lợi suất qua đêm 5.5%/năm (+4.28M VND/ngày).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              +4.28M VND/ngày
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pool Tiền Mặt Nhàn Rỗi</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            28.4 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Số dư thanh khoản sẵn có</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Suất Thu Được Mỗi Ngày</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            +4.28M VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Tự động cộng dồn hàng ngày</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Suất Năm Dự Phóng</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            1.56 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Lợi nhuận tài chính thuần</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lãi Suất Quét Qua Đêm (MMF)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            5.5% / năm
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Hoàn trả thanh khoản 08:00 sáng</p>
        </div>
      </div>

      {/* Action Execute Sweep Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Thực Hiện Quét Tự Động Số Dư Nhàn Rỗi (Execute Overnight Sweep)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chuyển tiền vào quỹ thị trường tiền tệ MMF và tự động hoàn trả thanh khoản vào 08:00 sáng mai.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSwept(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            swept
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {swept ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Quét 28.4 Tỷ VND (+4.28M/ngày)</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>🚀 Kích Hoạt Quét Lợi Suất Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
