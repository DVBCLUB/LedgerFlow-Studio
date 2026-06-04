import React, { useState } from 'react';
import { ENGINEERED_PROMPTS } from '../data/prompts';
import { EngineeredPrompt } from '../data/prompts';
import { Terminal, Award, Copy, CheckSquare, Sparkles, MessageCircle, HelpCircle, ArrowRight } from 'lucide-react';

export default function PromptPlayground() {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(ENGINEERED_PROMPTS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const activePrompt = ENGINEERED_PROMPTS.find(p => p.id === selectedPromptId) || ENGINEERED_PROMPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activePrompt.promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* SELECTION BOX (left) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Chọn mẫu tác vụ</span>
          
          <div className="flex flex-col gap-2">
            {ENGINEERED_PROMPTS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPromptId(p.id)}
                className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all border block ${
                  selectedPromptId === p.id 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                    : 'bg-slate-950 border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{p.name.split(' (')[0]}</span>
                </div>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Informative advice on prompting */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Mẹo Prompting Kế Toán:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            AI rất dễ nhầm lẫn khi làm phép cộng dồn hoặc tính bậc thang phức tạp. 
            <br /><br />
            Do đó, luôn dặn dò AI sử dụng kiểu dữ liệu <strong className="text-slate-300">Decimal</strong> hoặc <strong className="text-slate-300">Integer (đồng VNĐ)</strong>, ép làm tròn cuối kì và cung cấp method đối so khớp thử lại.
          </p>
        </div>
      </div>

      {/* PROMPT LAYOUT PREVIEW (right/center area) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Vai trò đề xuất của mô hình</span>
              <p className="text-sm font-bold text-purple-400 mt-0.5">{activePrompt.role}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Khuyến nghị Model</span>
              <p className="text-xs font-semibold text-slate-300 mt-1">{activePrompt.model}</p>
            </div>
          </div>

          {/* Vietnam authoritative advice rules */}
          {activePrompt.authoritativeRule && (
            <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2.5">
              <span className="w-5 h-5 rounded bg-rose-500/10 shrink-0 flex items-center justify-center font-bold text-[10px]">Rule</span>
              <div className="mt-0.5 leading-relaxed font-semibold">
                <span className="text-slate-200 block mb-0.5">Quy định pháp lý liên kết:</span>
                {activePrompt.authoritativeRule}
              </div>
            </div>
          )}

          {/* Dynamic Generated Prompt display */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
                Mẫu Prompt Được Tinh Chỉnh Chuyên Nghiệp:
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-300 hover:text-white hover:border-purple-500/40 transition-all text-xs font-semibold shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Đã sao chép thành công!' : 'Sao chép Prompt'}
              </button>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border border-slate-850 bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-850 text-[10px] text-slate-500 font-bold font-mono">
                <span>SYSTEM & USER PROMPT FOR LARGE LANGUAGE MODEL</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Ready to copy
                </span>
              </div>
              <pre className="p-4 overflow-x-auto text-[11.5px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto font-semibold scrollbar-thin scrollbar-thumb-slate-800">
                {activePrompt.promptText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
