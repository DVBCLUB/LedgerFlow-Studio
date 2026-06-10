import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import {
  CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS,
  CT1_MODEL_HEALTH_CHECKS,
  CT1_RELEASE_AUDIT_CHECKLIST
} from '../data/ct1ProtectionRules';

const tabLabelAliases: Record<string, string[]> = {
  dashboard: ['Founder Dashboard'],
  score: ['Score lab'],
  simulator: ['Simulator', 'What-if Simulator', 'Founder what-if simulator'],
  portfolio: ['Idea Portfolio'],
  decisions: ['Decision Log'],
  workorders: ['AI Work Orders']
};

const clickAccountingTab = (tab: string) => {
  const aliases = tabLabelAliases[tab] ?? [];
  const buttons = Array.from(document.querySelectorAll('button'));
  const target = buttons.find((button) => aliases.some((label) => button.textContent?.trim().includes(label)));
  target?.click();
};

export default function CT1GlobalSimulationGuard() {
  const [open, setOpen] = useState(false);

  const goAccounting = (tab?: string) => {
    window.location.hash = '/accounting_vn';
    window.setTimeout(() => {
      if (tab) clickAccountingTab(tab);
      document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] text-slate-100 print:hidden">
      {open && (
        <div className="mb-3 max-h-[80vh] w-[22rem] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">CT1 Simulation Guard</p>
              <h3 className="mt-1 text-sm font-black text-white">Bảo vệ mô hình mô phỏng</h3>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-800 p-1 text-slate-400 hover:text-white" aria-label="Đóng CT1 guard">
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">
            Các mô hình, biểu đồ, simulator và giả lập là tài sản lõi của CT1. Không được xóa, ẩn hoặc đổi công thức nếu chưa có version note và founder approval.
          </p>

          <div className="mt-3 grid gap-2">
            {CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS.map((item) => (
              <button key={item.tab} onClick={() => goAccounting(item.tab)} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left hover:border-cyan-500/50">
                <p className="text-xs font-black text-white">Mở nhanh: {item.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">{item.reason}</p>
              </button>
            ))}
          </div>

          <button onClick={() => goAccounting('simulator')} className="mt-3 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-500/20">
            Kiểm tra ngay mô hình Simulator
          </button>

          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className="text-[10px] font-black uppercase text-cyan-300">Model health check</p>
            <div className="mt-3 space-y-2">
              {CT1_MODEL_HEALTH_CHECKS.map((item) => (
                <div key={item.model} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-white">{item.model}</p>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[9px] font-black uppercase text-emerald-300">
                      {item.visibility}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-400">Phải chạy: {item.mustWork.join(' • ')}</p>
                  <p className="mt-2 text-[10px] font-bold leading-5 text-amber-200">Dấu hiệu lỗi: {item.failSignal}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-[10px] font-black uppercase text-amber-300">Release guard</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-100">{CT1_RELEASE_AUDIT_CHECKLIST[0]}</p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-100">{CT1_RELEASE_AUDIT_CHECKLIST[8]}</p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-100">{CT1_RELEASE_AUDIT_CHECKLIST[9]}</p>
          </div>
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-400 px-4 py-3 text-xs font-black text-slate-950 shadow-2xl hover:bg-cyan-300">
        <ShieldCheck className="h-4 w-4" /> CT1 Guard
      </button>
    </div>
  );
}
