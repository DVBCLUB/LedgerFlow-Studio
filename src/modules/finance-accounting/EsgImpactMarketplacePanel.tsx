import React, { useState } from 'react';
import { Leaf, Award, Globe, CheckCircle2, ShoppingCart, Target, ShieldCheck } from 'lucide-react';

export default function EsgImpactMarketplacePanel() {
  const [purchased, setPurchased] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Leaf className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Sàn Giao Dịch Tín Chỉ Carbon &amp; Tác Động ESG (ESG Marketplace)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Green FinTech
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đo lường Scope 1/2/3 · Sàn giao dịch tín chỉ Carbon VCS Verra · Lộ trình Net Zero 2028 · Minh bạch chuỗi cung ứng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AAA Xếp Hạng Net-Zero
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Phát Thải Đo Lường</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            142.5 Tấn CO₂
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Scope 1, 2 &amp; Scope 3</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Bù Đắp (Offset)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            100% 142.5 Tấn
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Đã bù đắp toàn diện</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Xếp Hạng Tiêu Chuẩn ESG</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            AAA Net-Zero
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Đạt chuẩn báo cáo ESG quốc tế</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mục Tiêu Net-Zero Toàn Diện</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            Năm 2028
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Cam kết trước lộ trình quốc gia</p>
        </div>
      </div>

      {/* Action Purchase Carbon Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Mua Tín Chỉ Carbon Bù Đắp Phát Thải (Carbon Offset Purchase)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chứng chỉ VCS Verra từ Dự án Trồng rừng Ngập mặn Cà Mau với chứng thư số blockchain.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPurchased(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            purchased
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {purchased ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Cấp Chứng Chỉ: CARBON-CERT-VCS</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>🚀 Mua Tín Chỉ Carbon Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
