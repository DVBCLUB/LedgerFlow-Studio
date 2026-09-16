import React, { useState } from 'react';
import { Dna, Zap, CheckCircle2, TrendingUp, Sparkles, Cpu, Award } from 'lucide-react';

export default function GeneticPromptMutationPanel() {
  const [evolved, setEvolved] = useState(false);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Dna className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Đột Biến &amp; Tiến Hóa Prompt Tác Tử (Genetic Prompt Mutation)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Genetic Algorithm
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đột biến &amp; tiến hóa system prompt cho 52+ Swarm Agents qua giải thuật di truyền · Tăng +34.8% độ chuẩn xác.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              142 Thế Hệ Tiến Hóa
            </span>
          </div>
        </div>
      </section>

      {/* Action Evolve Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">⚡ Đột Biến Tiến Hóa Thế Hệ Prompt Mới (Evolve Generation)</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tự động chắt lọc mẫu đối thoại thành công và tối ưu hóa câu lệnh cho CFO AI Agent.</p>
        </div>
        <button
          type="button"
          onClick={() => setEvolved(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{evolved ? '✓ Gen 15 Champion Evolved (Fitness 99.7%)' : '🚀 Evolve Agent Prompts'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Generations Evolved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Dna className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">142 Gens</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Stable Chromosome Pipeline</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fitness Gain</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">+34.8%</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Higher Task Resolution</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Optimized Agents</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">52 Swarms</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">100% Agent Fleet Coverage</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Fitness Score</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">99.7%</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 font-mono">Zero Hallucination Quorum</p>
        </div>
      </div>
    </div>
  );
}

