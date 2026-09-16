import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function BudgetGovernorPanel() {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-tight text-white uppercase">💰 Budget Governor</h2>
            <p className="text-[10px] text-slate-400">Token cost & runtime spending — real-time</p>
          </div>
        </div>
        <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">TRACKING</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tuần này</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400"><TrendingUp className="h-3 w-3" /> +2.3%</span>
          </div>
          <p className="text-lg font-black text-white mt-1">$12.80</p>
          <p className="text-[10px] text-slate-500">/ $100.00 budget</p>
          <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-[12.8%] rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tháng này</span>
            <span className="flex items-center gap-1 text-[10px] text-rose-400"><TrendingDown className="h-3 w-3" /> -5.1%</span>
          </div>
          <p className="text-lg font-black text-white mt-1">$48.25</p>
          <p className="text-[10px] text-slate-500">/ $400.00 budget</p>
          <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-[12%] rounded-full bg-amber-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">AI Agent Runs</span>
          </div>
          <p className="text-lg font-black text-white mt-1">7</p>
          <p className="text-[10px] text-slate-500">Hôm nay · 2 đang chạy</p>
          <div className="mt-2 flex gap-1">
            <span className="h-1 flex-1 rounded-full bg-emerald-500" />
            <span className="h-1 flex-1 rounded-full bg-emerald-500" />
            <span className="h-1 flex-1 rounded-full bg-emerald-500" />
            <span className="h-1 flex-1 rounded-full bg-amber-500" />
            <span className="h-1 flex-1 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
