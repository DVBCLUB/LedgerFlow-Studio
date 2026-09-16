import React, { useState } from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, Lock, Zap, Award } from 'lucide-react';

export default function SmartContractEscrowPanel() {
  const [released, setReleased] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Quỹ Ký Quỹ &amp; Giải Ngân Đảm Bảo Tự Động (Escrow Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Smart Escrow
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Bảo chứng ngân quỹ 4.5 Tỷ VND · Tự động giải ngân theo tiến độ bàn giao hợp đồng và biên bản nghiệm thu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Bảo Chứng Hợp Đồng
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Quỹ Ký Quỹ Đang Giữ</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            4.5 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Bảo chứng đối tác &amp; thầu phụ</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Giải Ngân Thành Công</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            100.0%
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Không có tranh chấp pháp lý</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tốc Độ Giải Ngân</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            Tức Thì
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Tự động sau khi ký nghiệm thu</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiêu Chuẩn Bảo Chứng</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            Hợp Đồng Đảm Bảo
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Khóa quỹ ngân hàng đối tác</p>
        </div>
      </div>

      {/* Action Approve & Release Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white">Phê Duyệt &amp; Giải Ngân Hợp Đồng Đối Tác (Release Escrow Funds)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Giải ngân 2.5 Tỷ VND cho đối tác ngay khi hoàn tất giai đoạn nghiệm thu dự án.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReleased(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            released
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20'
          }`}
        >
          {released ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Phê Duyệt Giải Ngân 2.5 Tỷ VND</span>
            </>
          ) : (
            <>
              <FileCheck className="w-3.5 h-3.5" />
              <span>🚀 Phê Duyệt Giải Ngân Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
