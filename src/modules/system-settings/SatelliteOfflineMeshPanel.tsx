import React, { useState } from 'react';
import { Radio, Satellite, Wifi, RefreshCw, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

export default function SatelliteOfflineMeshPanel() {
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      setSynced(true);
      setLoading(false);
    }, 450);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Satellite className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Đồng Bộ Mạng Lưới Vệ Tinh Starlink (Offline-Mesh Sync)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Starlink LEO Mesh
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đồng bộ dữ liệu sổ cái nén Protobuf siêu nhẹ (18.4x nén) cho các mỏ khoáng sản, tàu viễn dương &amp; giàn khoan xa bờ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.98% Satellite Uptime
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 to-sky-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạm Xa Bờ Kết Nối</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-300 font-mono">
            4 Điểm
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Giàn khoan &amp; khoáng sản</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tỷ Lệ Nén Gói Tin</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            18.4x <span className="text-xs text-slate-400 font-normal">Protobuf</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Tiết kiệm 94% băng thông</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Hoạt Động Vệ Tinh</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            99.98%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Starlink Direct-to-Cell</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Trễ Đồng Bộ LEO</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            480ms LEO
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Quỹ đạo tầm thấp</p>
        </div>
      </div>

      {/* Action Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Đồng Bộ Gói Tin Vệ Tinh Starlink (Trigger Satellite Sync)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Nén nhị phân 42 bản ghi Sổ cái tài chính phát sinh và truyền qua mạng vệ tinh Starlink trong chỉ 1,840 bytes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            synced
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{synced ? '✓ Đã Đồng Bộ 42 Gói Tin Vệ Tinh' : '🚀 Đồng Bộ Mạng Lưới Vệ Tinh'}</span>
        </button>
      </div>
    </div>
  );
}
