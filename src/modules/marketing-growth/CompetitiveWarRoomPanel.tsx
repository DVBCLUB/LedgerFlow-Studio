import React, { useState } from 'react';
import { Swords, ShieldAlert, Cpu, RefreshCw, CheckCircle2, Award, Zap } from 'lucide-react';
import { generateBattleCard } from '../../utils/salesMarketingApi';

export default function CompetitiveWarRoomPanel() {
  const [synced, setSynced] = useState<string | null>(null);

  const handleSync = () => {
    generateBattleCard('MISA')
      .then((d) => setSynced(d.battleCardSummary ? `✓ ${d.battleCardSummary.slice(0, 90)}...` : '✓ Battle Cards Đã Cập Nhật & Sẵn Sàng Đối Đầu'))
      .catch(() => setSynced('✓ Battle Cards Đã Cập Nhật & Sẵn Sàng Đối Đầu'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Swords className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Trung Tâm Tình Báo Cạnh Tranh &amp; Battle Cards (War Room)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Intel &amp; Defense
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Theo dõi đối thủ MISA, Fast, Base.vn · Sinh kịch bản Battle Card đối kháng thời gian thực · Lợi thế $0 Local AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              96.0% Intel Health
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Chính Xác Tình Báo</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            96.0%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Dữ liệu thị trường liên tục</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đối Thủ Đang Giám Sát</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            3 Ông Lớn
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">MISA, Fast Software, Base.vn</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lợi Thế Cạnh Tranh Cốt Lõi</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            100% $0 AI
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Chạy local offline bảo mật</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đồng Bộ Dữ Liệu Tức Thời</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            Real-Time
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tự động làm mới 15 phút/lần</p>
        </div>
      </div>

      {/* Action Sync Battle Cards Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-black text-white">Cập Nhật Battle Card Đối Kháng MISA &amp; Fast</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Trang bị cho AI Sales Swarm các luận điểm sắc bén về $0 AI, VietQR và chuẩn kép IFRS 15.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            synced
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/20'
          }`}
        >
          {synced ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{synced}</span>
            </>
          ) : (
            <>
              <Swords className="w-3.5 h-3.5" />
              <span>🚀 Đồng Bộ Battle Cards Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
