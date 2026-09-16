import React from 'react';
import { Bot, ExternalLink, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { glaciaModuleBridge } from './glaciaModuleBridge';
import { useGlacia } from './GlaciaContext';

export default function GlaciaAdminPortalButton() {
  const { setIsOpen } = useGlacia();

  const handleOpenAdminWorkspace = () => {
    glaciaModuleBridge.navigateTo('ai_nhan_su');
    setIsOpen(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Bảng Điều Khiển AI Nhân Sự Chuyên Sâu (Admin)</h4>
            <p className="text-[10px] text-slate-400">Xem log kỹ thuật, ma trận năng lực, cost governance và kiểm toán AI chi tiết.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdminWorkspace}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
        >
          <span>Mở Admin Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
