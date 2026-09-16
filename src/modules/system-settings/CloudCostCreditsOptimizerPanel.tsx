import React, { useEffect, useState } from 'react';
import { DollarSign, ShieldCheck, AlertTriangle, XCircle, TrendingDown, Cpu, Sparkles } from 'lucide-react';
import { getCloudCostOptimizer, ProviderCreditStatus } from '../../utils/enterpriseApi';

const MOCK: ProviderCreditStatus[] = [
  { id: 'prov_001', providerName: 'OpenAI', monthlyBudgetUsd: 120, usedUsd: 84, remainingUsd: 36, usageRatio: 0.7, alertStatus: 'HEALTHY' },
  { id: 'prov_002', providerName: 'Anthropic', monthlyBudgetUsd: 80, usedUsd: 62, remainingUsd: 18, usageRatio: 0.78, alertStatus: 'HEALTHY' },
  { id: 'prov_003', providerName: 'Groq', monthlyBudgetUsd: 40, usedUsd: 40, remainingUsd: 0, usageRatio: 1.0, alertStatus: 'EXHAUSTED' },
];

export default function CloudCostCreditsOptimizerPanel() {
  const [providers, setProviders] = useState<ProviderCreditStatus[]>(MOCK);

  useEffect(() => {
    getCloudCostOptimizer().then((d) => {
      if (d.providers?.length) setProviders(d.providers);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <DollarSign className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Tối Ưu Hóa Chi Phí &amp; Tín Dụng AI Cloud (Cost Optimizer)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Smart Routing
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Giám sát ngân sách tín dụng các nhà cung cấp AI — Cảnh báo ngưỡng 80% và tự động định tuyến thông minh để tiết kiệm chi phí.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {providers.length} Nhà Cung Cấp
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nhà Cung Cấp AI</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {providers.length}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">OpenAI, Anthropic, Groq</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ngân Sách Tốt (Healthy)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {providers.filter((p) => p.alertStatus === 'HEALTHY').length}
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Hoạt động bình thường</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cảnh Báo &ge; 80%</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {providers.filter((p) => p.alertStatus === 'WARNING_80').length}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Sắp chạm ngưỡng ngân sách</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 to-rose-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hết Ngân Sách (Exhausted)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300 font-mono">
            {providers.filter((p) => p.alertStatus === 'EXHAUSTED').length}
          </div>
          <p className="mt-1 text-[11px] font-medium text-rose-400">Tự động chuyển tiếp fallback</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Chi Tiết Sử Dụng Ngân Sách Các Nhà Cung Cấp
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Nhà Cung Cấp</th>
                <th className="px-5 py-3.5">Hạn Mức Tháng</th>
                <th className="px-5 py-3.5">Đã Chi Tiêu</th>
                <th className="px-5 py-3.5">Còn Lại</th>
                <th className="px-5 py-3.5 w-1/4">Tỷ Lệ Tiêu Dùng</th>
                <th className="px-5 py-3.5 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {providers.map((p) => {
                const isHealthy = p.alertStatus === 'HEALTHY';
                const isWarning = p.alertStatus === 'WARNING_80';
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      {p.providerName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      ${p.monthlyBudgetUsd}
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-mono font-bold">
                      ${p.usedUsd}
                    </td>
                    <td className="px-5 py-3.5 text-emerald-400 font-mono font-bold">
                      ${p.remainingUsd}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>{Math.round(p.usageRatio * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHealthy
                                ? 'bg-emerald-500'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round(p.usageRatio * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isHealthy
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'}`} />
                        {p.alertStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
