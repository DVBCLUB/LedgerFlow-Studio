import React, { useState } from 'react';
import { Globe2, ShieldAlert, CheckCircle2, TrendingUp, Landmark, FileText, Zap } from 'lucide-react';

export default function SovereignTransferPricingPanel() {
  const [calculated, setCalculated] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Globe2 className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Quản Trị Thuế Chuyển Giá Đa Quốc Gia (Transfer Pricing &amp; Tax Shield)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Global Tax Shield
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quản trị thuế chuyển giá NĐ 132/2020 &amp; Hiệp định DTAA quốc tế (VN, SG, US) · Tối ưu hóa 850M VND thuế.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              8.5% Biên Chuẩn Arm’s Length
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Xuyên Biên Giới</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            6.4 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Giao dịch liên kết hợp chuẩn</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thuế Tiết Kiệm Hợp Pháp</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            850M VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Tối ưu qua hiệp định DTAA</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Biên Độ Giá Giao Dịch Độc Lập</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            8.5% Tuân Thủ
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Nghị định 132/2020/NĐ-CP</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hiệp Định Thuế Áp Dụng</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            3 Quốc Gia
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Việt Nam, Singapore, Hoa Kỳ</p>
        </div>
      </div>

      {/* Action Calculate Pricing Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white">Tính Toán Giá Giao Dịch Liên Kết Chuẩn (Arm’s Length Calculation)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sinh hồ sơ quốc gia (Local File) chứng minh biên lợi nhuận hợp lý theo chuẩn OECD.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCalculated(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            calculated
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          {calculated ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Kiểm Định Arm’s Length (Biên 8.5%)</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>🚀 Tính Giá Chuyển Nhượng Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
