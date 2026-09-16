import React, { useState } from 'react';
import { Lock, FileCheck, CheckCircle2, ShieldCheck, Users, HardDrive, Key } from 'lucide-react';

export default function VirtualDataRoomPanel() {
  const [granted, setGranted] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Phòng Dữ Liệu Ảo M&amp;A &amp; Gọi Vốn (Virtual Data Room - VDR)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Secure VDR
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Phòng dữ liệu ảo Due Diligence Series A · Watermark động chống rò rỉ · 105 tài liệu kiểm toán minh bạch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Nhật Ký Mã Hóa
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ Sơ Đã Kiểm Định</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            105 Files
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Tài chính, pháp lý &amp; mã nguồn</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhà Đầu Tư Đang Truy Cập</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            6 Funds
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Quỹ đầu tư Series A</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dung Lượng Phòng Dữ Liệu</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            384 MB
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Mã hóa AES-256 GCM</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhật Ký Truy Cập (Audit Trail)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            100% Bất Biến
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Chữ ký số từng phiên xem</p>
        </div>
      </div>

      {/* Action Grant Access Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Cấp Quyền Truy Cập VDR Cho Quỹ Đầu Tư (Grant Investor Access)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kèm thỏa thuận bảo mật NDA tự động và watermark số hiển thị email nhà đầu tư trên từng trang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setGranted(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            granted
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {granted ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Cấp Quyền &amp; Watermark An Toàn</span>
            </>
          ) : (
            <>
              <Key className="w-3.5 h-3.5" />
              <span>🚀 Cấp Token Truy Cập VDR</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
