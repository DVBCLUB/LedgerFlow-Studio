import React, { useState } from 'react';
import { Scroll, Award, FileText, CheckCircle2, Download, Sparkles, ShieldCheck } from 'lucide-react';

export default function PatentAutoDraftingPanel() {
  const [drafted, setDrafted] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Scroll className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tự Động Soạn Thảo Hồ Sơ Sáng Chế &amp; Sở Hữu Trí Tuệ (IP / Patent)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Chuẩn WIPO &amp; Cục SHTT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Tự động sinh hồ sơ sáng chế nộp Cục SHTT Việt Nam &amp; WIPO — Định giá danh mục tài sản trí tuệ 18.5 Tỷ VND.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Định Giá 18.5 Tỷ VND
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-slate-950 to-orange-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ Sơ Sáng Chế</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Scroll className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-orange-300 font-mono">
            3 Sáng Chế
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">AI Swarm &amp; Zero-Knowledge</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Định Giá Tài Sản Trí Tuệ</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            18.5 Tỷ <span className="text-xs text-slate-400 font-normal">VND</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Tài sản vô hình doanh nghiệp</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Số Lượng Điểm Yêu Cầu</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            18 Claims
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Độ bao phủ bảo hộ tối đa</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sẵn Sàng Nộp Đơn</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            98.5% Ready
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chuẩn thể thức WIPO</p>
        </div>
      </div>

      {/* Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Sinh Bản Mô Tả Sáng Chế Kỹ Thuật Số (Generate Claims Spec)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Tự động xuất tài liệu PDF chuẩn thể thức nộp Cục Sở Hữu Trí Tuệ bảo hộ công nghệ AI Autonomous Swarm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDrafted(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            drafted
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/20'
          }`}
        >
          {drafted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{drafted ? '✓ Đã Xuất File PDF Sáng Chế' : '🚀 Sinh Bản Mô Tả Sáng Chế'}</span>
        </button>
      </div>
    </div>
  );
}
