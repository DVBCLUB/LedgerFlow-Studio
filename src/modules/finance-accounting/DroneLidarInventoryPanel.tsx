import React, { useState } from 'react';
import { Plane, Box, CheckCircle2, Layers, Cpu, Compass, Scan } from 'lucide-react';

export default function DroneLidarInventoryPanel() {
  const [processed, setProcessed] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Plane className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kiểm Kê Kho Bãi Bằng Drone LiDAR 3D (Drone LiDAR Volumetric Audit)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LiDAR 3D AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Xử lý đám mây điểm 48.5M points từ Drone · Tính thể tích bãi cát &amp; kho thép chính xác 99.4% · Khớp TK 152.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.4% Độ Chính Xác Thể Tích
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Công Trường / Bãi Đã Quét</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            6 Sites
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Kho trung tâm &amp; bãi tập kết</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đám Mây Điểm 3D (Points)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            48.5M Điểm
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Độ phân giải millimeter</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Chính Xác Thể Tích</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            99.4%
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Sai số đối soát &lt; 0.6%</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lệch Tồn Kho So Với Sổ</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            &lt; 0.4% Đạt
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Đủ điều kiện đóng kỳ kế toán</p>
        </div>
      </div>

      {/* Action Process Cloud Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Xử Lý Dữ Liệu LiDAR Bay Kiểm Kê (Process Drone Point Cloud)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tính toán thể tích 4,250 m³ cát vàng và tự động đối soát khớp với Sổ kho TK 152.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setProcessed(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            processed
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {processed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Đã Đối Soát 6,375 Tấn Khớp TK 152</span>
            </>
          ) : (
            <>
              <Scan className="w-3.5 h-3.5" />
              <span>🚀 Xử Lý Dữ Liệu LiDAR Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
