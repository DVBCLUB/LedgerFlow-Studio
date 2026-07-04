import React, { useState } from 'react';
import { Target, TrendingUp, Search, Crosshair, HelpCircle } from 'lucide-react';
import MarketingFunnelLab from './components/MarketingFunnelLab';
import AdCampaignSimulator from './components/AdCampaignSimulator';
import ProductLaunchChecklist from './components/ProductLaunchChecklist';
import GuerrillaLaunchPlaybook from './components/GuerrillaLaunchPlaybook';
import SyntheticSurveyBuilder from './components/SyntheticSurveyBuilder';

export default function CampaignsLab() {
  const [activeTab, setActiveTab] = useState<'funnel' | 'ad' | 'launch' | 'guerrilla' | 'survey'>('funnel');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Campaigns Lab</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Phòng thí nghiệm Chiến dịch</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Nơi lập kế hoạch phễu chuyển đổi, giả lập quảng cáo, và chuẩn bị checklist Launch.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('funnel')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'funnel' ? 'bg-accent text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Target className="w-4 h-4" /> Funnel Lab
          </button>
          <button
            onClick={() => setActiveTab('ad')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'ad' ? 'bg-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Ads Simulator
          </button>
          <button
            onClick={() => setActiveTab('launch')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'launch' ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Crosshair className="w-4 h-4" /> Launch Checklist
          </button>
          <button
            onClick={() => setActiveTab('guerrilla')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'guerrilla' ? 'bg-accent text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Search className="w-4 h-4" /> Guerrilla Playbook
          </button>
          <button
            onClick={() => setActiveTab('survey')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'survey' ? 'bg-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Synthetic Survey
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'funnel' && <MarketingFunnelLab />}
        {activeTab === 'ad' && <AdCampaignSimulator />}
        {activeTab === 'launch' && (
          <div className="p-6">
            <ProductLaunchChecklist />
          </div>
        )}
        {activeTab === 'guerrilla' && (
          <div className="p-6">
            <GuerrillaLaunchPlaybook />
          </div>
        )}
        {activeTab === 'survey' && (
          <div className="p-6">
            <SyntheticSurveyBuilder />
          </div>
        )}
      </div>
    </div>
  );
}
