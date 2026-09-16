import React, { useState } from 'react';
import { Radio, Truck, Activity, Cpu, CheckCircle2, Zap } from 'lucide-react';

export default function IotEdgeScaleSyncPanel() {
  const [synced, setSynced] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Đồng Bộ Cân Điện Tử &amp; RFID IoT Biên (IoT Edge Hardware Sync)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Industrial IoT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Kết nối Cân xe tải 80 Tấn, Cổng RFID kho &amp; Cảm biến đo dầu vào Sổ cái Kế toán TK 152 thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              &lt; 20ms Độ Trễ Edge
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thiết Bị Phần Cứng Đã Nối</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            8 Hardware Units
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Cân 80T, RFID kho, Level Sensor</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sự Kiện Nhập/Xuất (24h)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            1,240 GRN/GDN
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Tự động sinh phiếu kho</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tình Trạng Phần Cứng</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            100% Online
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Hoạt động ổn định liên tục</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Trễ Phản Hồi Biên</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            &lt; 20ms Edge
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Xử lý ngay tại trạm cân</p>
        </div>
      </div>

      {/* Action Simulate Scale Event Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-black text-white">Diễn Tập Nhận Tín Hiệu Cân Điện Tử Xe Tải (Simulate Scale Event)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quét tải trọng 25.4 Tấn Cát vàng và tự động sinh phiếu nhập kho GRN vào Sổ cái TK 152.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSynced(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            synced
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20'
          }`}
        >
          {synced ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Phiếu GRN Đã Tạo &amp; Khớp Sổ TK 152</span>
            </>
          ) : (
            <>
              <Truck className="w-3.5 h-3.5" />
              <span>🚀 Giả Lập Tín Hiệu Cân Xe Tải</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
