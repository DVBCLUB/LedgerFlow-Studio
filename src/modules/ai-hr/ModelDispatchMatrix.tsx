import React, { useState } from 'react';
import { Network, Search, Zap, Code2, PenTool, Database, Compass, Lock, Activity } from 'lucide-react';

const MODELS = [
  { id: 'gpt4o', name: 'OpenAI GPT-4o', role: 'Phân tích & Suy luận Logic', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'claude35', name: 'Claude 3.5 Sonnet', role: 'Viết lách & Sáng tạo nội dung', icon: PenTool, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'gemini15', name: 'Google Gemini 1.5 Pro', role: 'Xử lý Data lớn & Tài liệu', icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'cursor', name: 'Cursor IDE / Windsurf', role: 'Lập trình & Kỹ thuật', icon: Code2, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'perplexity', name: 'Perplexity', role: 'Nghiên cứu & Duyệt Web', icon: Compass, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

export default function ModelDispatchMatrix() {
  const [activeModel, setActiveModel] = useState<string | null>(null);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="h-6 w-6 text-indigo-400" /> Ma trận Định tuyến Đa Mô hình (Dispatch Router)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Điều phối công việc tới các AI Engine xuất sắc nhất trên thị trường.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Activity className="w-4 h-4" /> Bật Router Tự động
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Danh sách Nền tảng Tích hợp</h3>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Tìm mô hình..." className="bg-slate-900 border border-slate-800 rounded-md py-1 pl-8 pr-3 text-xs text-white outline-none w-48 focus:border-indigo-500/50 transition-colors" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {MODELS.map(model => {
              const Icon = model.icon;
              const isActive = activeModel === model.id;
              
              return (
                <div 
                  key={model.id}
                  onClick={() => setActiveModel(model.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isActive ? `bg-slate-900 ${model.border} shadow-[0_0_20px_rgba(0,0,0,0.2)]` : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${model.bg}`}>
                      <Icon className={`w-5 h-5 ${model.color}`} />
                    </div>
                    {isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{model.name}</h4>
                  <p className="text-xs text-slate-400 mb-3">{model.role}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">Tình trạng</span>
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Connected
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Khung cấu hình rule */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 h-fit sticky top-24">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-400" /> Quy tắc Điều hướng (Rules)
          </h3>
          
          <div className="space-y-4">
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Nếu prompt chứa keyword:</div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"viết bài"</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"sáng tạo"</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"email"</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ArrowRightIcon className="w-3 h-3 text-slate-500" />
                <span className="text-amber-400 font-semibold">Chuyển cho Claude 3.5 Sonnet</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Nếu prompt chứa keyword:</div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"code"</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"fix bug"</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">"repo"</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ArrowRightIcon className="w-3 h-3 text-slate-500" />
                <span className="text-indigo-400 font-semibold">Chuyển cho Cursor IDE</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 rounded-xl opacity-60">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-slate-400">Các task còn lại (Default)</div>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ArrowRightIcon className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400 font-semibold">Giao cho OpenAI GPT-4o</span>
              </div>
            </div>
            
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors mt-2">
              + Thêm Quy tắc mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
