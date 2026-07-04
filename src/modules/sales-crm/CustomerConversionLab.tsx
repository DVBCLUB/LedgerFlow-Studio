import React, { useState } from 'react';
import { Target, Users, PhoneCall, Workflow, BrainCircuit, Mic } from 'lucide-react';
import LeadScoringEngine from './components/LeadScoringEngine';
import PersonaInterviewLab from './components/PersonaInterviewLab';
import SalesFunnelLab from './components/SalesFunnelLab';
import PLGConversionHub from './components/PLGConversionHub';
import OutboundSalesHub from './components/OutboundSalesHub';
import DistributionLeadBoard from './components/DistributionLeadBoard';
import SalesRoleplayLab from './components/SalesRoleplayLab';

export default function CustomerConversionLab() {
  const [activeTab, setActiveTab] = useState<'leads' | 'scoring' | 'persona' | 'outbound' | 'plg' | 'funnel' | 'roleplay'>('leads');

  return (
    <div className="flex flex-col h-full space-y-6">
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Customer Conversion</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Khách hàng & Chuyển đổi</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Hệ thống chấm điểm Lead, luồng Outbound, phân tích Persona và giả lập Roleplay chốt sale.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('leads')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'leads' ? 'bg-accent text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Users className="w-4 h-4" /> Lead Board
          </button>
          <button onClick={() => setActiveTab('scoring')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'scoring' ? 'bg-accent text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Target className="w-4 h-4" /> Lead Scoring
          </button>
          <button onClick={() => setActiveTab('persona')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'persona' ? 'bg-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <BrainCircuit className="w-4 h-4" /> Persona
          </button>
          <button onClick={() => setActiveTab('outbound')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'outbound' ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <PhoneCall className="w-4 h-4" /> Outbound
          </button>
          <button onClick={() => setActiveTab('plg')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'plg' ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Workflow className="w-4 h-4" /> PLG Hub
          </button>
          <button onClick={() => setActiveTab('funnel')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'funnel' ? 'bg-accent text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Target className="w-4 h-4" /> Funnel Map
          </button>
          <button onClick={() => setActiveTab('roleplay')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'roleplay' ? 'bg-accent text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Mic className="w-4 h-4" /> AI Roleplay
          </button>
        </div>
      </section>

      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'leads' && <div className="p-6"><DistributionLeadBoard /></div>}
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
