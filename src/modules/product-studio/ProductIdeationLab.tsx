import React, { useState } from 'react';
import { Lightbulb, Target, TestTubeDiagonal, Code } from 'lucide-react';
import IdeasTab from './components/IdeasTab';
import StrategyTab from './components/StrategyTab';
import ICPHypothesisCanvas from './components/ICPHypothesisCanvas';
import Simulator from './components/Simulator';

export default function ProductIdeationLab() {
  const [activeTab, setActiveTab] = useState<'ideas' | 'strategy' | 'icp' | 'simulator'>('ideas');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">Phòng thí nghiệm Ý tưởng</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Product Ideation Lab</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Nơi khởi tạo, đánh giá và mô phỏng các ý tưởng sản phẩm ngách siêu nhỏ.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'ideas' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Lightbulb className="w-4 h-4" /> Bể ý tưởng
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'strategy' ? 'bg-violet-500 text-text-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Target className="w-4 h-4" /> Chiến lược ngách
          </button>
          <button
            onClick={() => setActiveTab('icp')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'icp' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Code className="w-4 h-4" /> ICP Canvas
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'simulator' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <TestTubeDiagonal className="w-4 h-4" /> Mô phỏng giá
          </button>
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
      </div>
    </div>
  );
}
