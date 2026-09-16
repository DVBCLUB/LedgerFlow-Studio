import React, { useState } from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, Award, DollarSign, Zap, Lock } from 'lucide-react';

export default function ZeroKnowledgeAuditPanel() {
  const [proved, setProved] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kiểm Toán Dữ Liệu Bảo Mật Doanh Nghiệp (Zero-Knowledge Audit)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ZK-Audit AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Kiểm toán độc lập 15.36 Tỷ VND doanh thu và số dư tài chính mà không làm lộ thông tin bí mật khách hàng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Khớp Minh Bạch
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Đã Kiểm Toán</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            15.36 Tỷ VND
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Xác thực chứng từ điện tử</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuẩn Mực An Toàn Bảo Mật</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            Bank-Grade
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Không lộ danh tính khách hàng</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ Sơ Đã Xác Thực Hợp Lệ</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            24 Báo Cáo
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Kỳ kiểm toán năm 2026</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Xác Thực Chứng Thư</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            Tức Thì (Real-time)
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Bằng chứng toán học ZK-SNARK</p>
        </div>
      </div>

      {/* Action Export Audit Proof Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-black text-white">Xuất Chứng Thư Kiểm Toán Tự Động (Generate Audit Proof)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chứng minh tính minh bạch và chuẩn mực 100% của Sổ cái phục vụ kiểm toán và nhà đầu tư.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setProved(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            proved
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
          }`}
        >
          {proved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Xác Thực Minh Bạch &amp; Hợp Lệ 100%</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>🚀 Xuất Báo Cáo Xác Thực Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
