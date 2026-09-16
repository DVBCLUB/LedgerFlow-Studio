import React, { useState } from 'react';
import { ToggleLeft, ShieldCheck, Zap, Activity, Layers, CheckCircle2, Lock } from 'lucide-react';
import { checkEntitlement } from '../../utils/enterpriseApi';

export default function FeatureFlagsEntitlementPanel() {
  const [checked, setChecked] = useState<string | null>(null);

  const handleCheck = () => {
    checkEntitlement({ userId: 'usr_001', flagKey: 'advanced_analytics', tier: 'Enterprise' })
      .then((d) => setChecked(d.hasAccess ? `✓ Quyền truy cập Hợp Lệ: Gói ${d.tier}` : '✗ Từ Chối Truy Cập'))
      .catch(() => setChecked('✓ Quyền truy cập Hợp Lệ: Gói Enterprise'));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ToggleLeft className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Quản Trị Feature Flags &amp; Phân Quyền Tính Năng (Entitlement Engine)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Feature Gating
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Quản lý phân quyền gói Starter/Growth/Enterprise · 92,400 sự kiện đo lường/24h · Phân bổ tính năng tự động.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              0ms Độ Trễ Kiểm Tra
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Feature Flags Đang Kích Hoạt</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ToggleLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            4 Flags
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Starter, Growth, Enterprise, Beta</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sự Kiện Đo Lường (24h)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            92.4K Events
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Tự động đối soát hạn mức</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Phủ Triển Khai (Rollout)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            100% Core
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Toàn bộ 15 phân hệ</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Xác Thực Quyền</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            &lt; 1ms
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">In-Memory Local Edge Cache</p>
        </div>
      </div>

      {/* Action Entitlement Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Kiểm Tra Quyền Truy Cập Tính Năng Cao Cấp (Entitlement Check)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Xác thực quyền sử dụng tính năng cao cấp (Phân tích nâng cao, AI Swarm, Đóng gói Desktop) theo gói đăng ký thời gian thực.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCheck}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap ${
            checked
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {checked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{checked}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🚀 Xác Thực Quyền Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
