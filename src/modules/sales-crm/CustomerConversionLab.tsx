import React, { useState } from 'react';
import { Target, Users, PhoneCall, Workflow, BrainCircuit, Mic, Film } from 'lucide-react';
import LeadScoringEngine from './components/LeadScoringEngine';
import PersonaInterviewLab from './components/PersonaInterviewLab';
import SalesFunnelLab from './components/SalesFunnelLab';
import PLGConversionHub from './components/PLGConversionHub';
import OutboundSalesHub from './components/OutboundSalesHub';
import DistributionLeadBoard from './components/DistributionLeadBoard';
import SalesRoleplayLab from './components/SalesRoleplayLab';
import VideoAffiliateGrowthHub from './components/VideoAffiliateGrowthHub';

import DigitalMonetizationRadarPanel from './components/DigitalMonetizationRadarPanel';
import { CircleDollarSign } from 'lucide-react';

export default function CustomerConversionLab() {
  const [activeTab, setActiveTab] = useState<'monetization_radar' | 'leads' | 'video_affiliate' | 'scoring' | 'persona' | 'outbound' | 'plg' | 'funnel' | 'roleplay'>('monetization_radar');

  return (
    <div className="flex flex-col h-full space-y-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-purple-950/20 p-6 text-left shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Customer Conversion & Multi-Channel Growth</p>
        <h1 className="mt-2 text-2xl font-black text-white">Khách hàng & Chuyển đổi Đa kênh</h1>
        <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
          Radar doanh thu đa nguồn (Affiliate, Ads, Game/App In-app Sales), Video Marketing TikTok/Reels và giả lập Roleplay chốt sale.
        </p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('monetization_radar')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'monetization_radar' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <CircleDollarSign className="w-3.5 h-3.5" /> 💰 Monetization Radar
          </button>
          <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'leads' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Users className="w-3.5 h-3.5" /> Lead Board
          </button>
          <button onClick={() => setActiveTab('video_affiliate')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'video_affiliate' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Film className="w-3.5 h-3.5" /> Video & Affiliate
          </button>
          <button onClick={() => setActiveTab('scoring')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'scoring' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Target className="w-3.5 h-3.5" /> Lead Scoring
          </button>
          <button onClick={() => setActiveTab('persona')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'persona' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <BrainCircuit className="w-3.5 h-3.5" /> Persona
          </button>
          <button onClick={() => setActiveTab('outbound')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'outbound' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <PhoneCall className="w-3.5 h-3.5" /> Outbound
          </button>
          <button onClick={() => setActiveTab('plg')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'plg' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Workflow className="w-3.5 h-3.5" /> PLG Hub
          </button>
          <button onClick={() => setActiveTab('funnel')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'funnel' ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Target className="w-3.5 h-3.5" /> Funnel Map
          </button>
          <button onClick={() => setActiveTab('roleplay')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${activeTab === 'roleplay' ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'}`}>
            <Mic className="w-3.5 h-3.5" /> AI Roleplay
          </button>
        </div>
      </section>

      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {activeTab === 'monetization_radar' && <div className="p-6"><DigitalMonetizationRadarPanel /></div>}
        {activeTab === 'leads' && <div className="p-6"><DistributionLeadBoard /></div>}
        {activeTab === 'video_affiliate' && <div className="p-6"><VideoAffiliateGrowthHub /></div>}
        {activeTab === 'scoring' && <LeadScoringEngine />}
        {activeTab === 'persona' && <div className="p-6"><PersonaInterviewLab /></div>}
        {activeTab === 'outbound' && <OutboundSalesHub />}
        {activeTab === 'plg' && <PLGConversionHub />}
        {activeTab === 'funnel' && <div className="p-6"><SalesFunnelLab /></div>}
        {activeTab === 'roleplay' && <div className="p-6"><SalesRoleplayLab /></div>}
      </div>
    </div>
  );
}
