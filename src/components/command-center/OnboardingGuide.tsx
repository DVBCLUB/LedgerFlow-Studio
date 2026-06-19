import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function OnboardingGuide() {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem('lf_onboarding_steps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed;
        }
      }
    } catch (_) {}
    return [false, false, false, false, false];
  });

  const toggleStep = (index: number) => {
    const next = [...completedSteps];
    next[index] = !next[index];
    setCompletedSteps(next);
    localStorage.setItem('lf_onboarding_steps', JSON.stringify(next));
  };

  const percentComplete = Math.round((completedSteps.filter(Boolean).length / 5) * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-slate-950/40 p-6 backdrop-blur-xl shadow-xl">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-4">
        <div>
          <h2 className="vi-label text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-[11px] font-bold">5</span>
            Lộ trình Khởi sự Doanh nghiệp (Onboarding Guide)
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Các bước tinh gọn giúp bạn thiết lập từ ý tưởng sơ khởi đến sản phẩm hoàn thiện và kiểm soát tài chính.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono font-bold text-purple-400">{percentComplete}% Hoàn thành</span>
          <div className="w-32 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* STEP 1 */}
        <div className={`p-4 bg-slate-900/60 rounded-2xl border transition-all flex flex-col justify-between ${completedSteps[0] ? 'bg-purple-950/15 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="vi-label text-[10px] font-black uppercase text-purple-400 tracking-wider">Bước 1</span>
              <input 
                type="checkbox" 
                checked={completedSteps[0]} 
                onChange={() => toggleStep(0)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <h3 className="text-xs font-black text-white">Chiến lược &amp; Cố vấn</h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Hoạch định ý tưởng, xin ý kiến từ Hội đồng Cố vấn chuyên gia.
            </p>
          </div>
          <a 
            href="#/advisory" 
            className="mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Xem cố vấn</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* STEP 2 */}
        <div className={`p-4 bg-slate-900/60 rounded-2xl border transition-all flex flex-col justify-between ${completedSteps[1] ? 'bg-purple-950/15 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Bước 2</span>
              <input 
                type="checkbox" 
                checked={completedSteps[1]} 
                onChange={() => toggleStep(1)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <h3 className="text-xs font-black text-white">Thiết kế AI Stack</h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Thiết lập sơ đồ hạ tầng kỹ thuật, stack công nghệ và AI.
            </p>
          </div>
          <a 
            href="#/architecture" 
            className="mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Vẽ hạ tầng</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* STEP 3 */}
        <div className={`p-4 bg-slate-900/60 rounded-2xl border transition-all flex flex-col justify-between ${completedSteps[2] ? 'bg-purple-950/15 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Bước 3</span>
              <input 
                type="checkbox" 
                checked={completedSteps[2]} 
                onChange={() => toggleStep(2)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <h3 className="text-xs font-black text-white">Media &amp; Video</h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Thiết kế kịch bản video marketing (YT/TikTok) thu hút leads.
            </p>
          </div>
          <a 
            href="#/video_lab" 
            className="mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Vào Video Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* STEP 4 */}
        <div className={`p-4 bg-slate-900/60 rounded-2xl border transition-all flex flex-col justify-between ${completedSteps[3] ? 'bg-purple-950/15 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Bước 4</span>
              <input 
                type="checkbox" 
                checked={completedSteps[3]} 
                onChange={() => toggleStep(3)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <h3 className="text-xs font-black text-white">Growth &amp; Phễu</h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Xây dựng phễu chuyển đổi, setup chiến dịch tăng trưởng V2.
            </p>
          </div>
          <a 
            href="#/marketing_growth_v2" 
            className="mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Tăng trưởng</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* STEP 5 */}
        <div className={`p-4 bg-slate-900/60 rounded-2xl border transition-all flex flex-col justify-between ${completedSteps[4] ? 'bg-purple-950/15 border-purple-500/30 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Bước 5</span>
              <input 
                type="checkbox" 
                checked={completedSteps[4]} 
                onChange={() => toggleStep(4)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <h3 className="text-xs font-black text-white">Kế toán &amp; Dòng tiền</h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
              Vận hành kế toán thực chiến và quản lý sổ cái kinh doanh.
            </p>
          </div>
          <a 
            href="#/accounting_vn" 
            className="mt-3.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Vào Kế toán</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
