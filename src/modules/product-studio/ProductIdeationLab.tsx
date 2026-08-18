import React, { useState } from 'react';
import { Lightbulb, Target, TestTubeDiagonal, Code } from 'lucide-react';
import IdeasTab from './components/IdeasTab';
import StrategyTab from './components/StrategyTab';
import ICPHypothesisCanvas from './components/ICPHypothesisCanvas';
import Simulator from './components/Simulator';

import GamePipelineStudioPanel from './components/GamePipelineStudioPanel';
import { Gamepad2 } from 'lucide-react';

export default function ProductIdeationLab() {
  const [activeTab, setActiveTab] = useState<'ideas' | 'strategy' | 'icp' | 'simulator' | 'game_studio'>('ideas');

  return (
    <div className="flex flex-col h-full space-y-6 text-left select-none">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Studio Ý tưởng & Thẩm định AI</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI CPO &amp; CTO Grounding
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Nghiên cứu ý tưởng sản phẩm SaaS Kế toán, AI Tools &amp; Game. Đấu nối trực tiếp AI Gateway để thẩm định tính khả thi kỹ thuật &amp; kế hoạch Sprint.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ideas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>💡 Bể Ý tưởng &amp; AI Feasibility</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'strategy'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>🎯 Chiến lược Ngách</span>
            </button>
            <button
              onClick={() => setActiveTab('icp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'icp'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>🧩 ICP Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <TestTubeDiagonal className="w-3.5 h-3.5" />
              <span>📊 Dự toán Vận hành</span>
            </button>
            <button
              onClick={() => setActiveTab('game_studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'game_studio'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>🎮 Game Pipeline</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-base shadow-2xl">
        {activeTab === 'ideas' && <IdeasTab />}
        {activeTab === 'strategy' && <StrategyTab setActiveTab={() => {}} setSelectedAgentId={() => {}} setAgentUserInput={() => {}} setAgentOutput={() => {}} />}
        {activeTab === 'icp' && (
          <div className="p-6">
            <ICPHypothesisCanvas />
          </div>
        )}
        {activeTab === 'simulator' && (
          <div className="p-6">
            <Simulator />
          </div>
        )}
        {activeTab === 'game_studio' && (
          <div className="p-6">
            <GamePipelineStudioPanel />
          </div>
        )}
      </div>
    </div>
  );
}
