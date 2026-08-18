import React, { useState } from 'react';
import { Target, Users, PhoneCall, Workflow, BrainCircuit, Mic, Film, CircleDollarSign } from 'lucide-react';
import LeadScoringEngine from './components/LeadScoringEngine';
import PersonaInterviewLab from './components/PersonaInterviewLab';
import SalesFunnelLab from './components/SalesFunnelLab';
import PLGConversionHub from './components/PLGConversionHub';
import OutboundSalesHub from './components/OutboundSalesHub';
import DistributionLeadBoard from './components/DistributionLeadBoard';
import SalesRoleplayLab from './components/SalesRoleplayLab';
import VideoAffiliateGrowthHub from './components/VideoAffiliateGrowthHub';
import DigitalMonetizationRadarPanel from './components/DigitalMonetizationRadarPanel';

export default function CustomerConversionLab() {
  const [activeGroup, setActiveGroup] = useState<'persona_scoring' | 'outbound_roleplay' | 'plg_funnel'>('persona_scoring');
  const [subTab, setSubTab] = useState<'monetization_radar' | 'leads' | 'video_affiliate' | 'scoring' | 'persona' | 'outbound' | 'plg' | 'funnel' | 'roleplay'>('leads');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-orange-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Sales &amp; CRM Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                4/4 CRM Daemons Online
              </span>
              <span className="text-xs font-bold text-slate-400">| Phễu Bán Hàng &amp; Lead Scoring AI</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Khách Hàng, Lead Board &amp; Chuyển Đổi Bán Hàng
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Nơi phân tích Lead Persona, chấm điểm Lead Scoring tự động, quản lý kịch bản Outbound Sales, luyện tập AI Roleplay chốt sale và theo dõi phễu PLG.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCompactMode(!isCompactMode)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              {isCompactMode ? '⚡ Khoang lái CEO (Thu gọn)' : '📜 Chế độ Kỹ thuật (Đầy đủ)'}
            </button>

            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => { setActiveGroup('persona_scoring'); setSubTab('leads'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'persona_scoring'
                    ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40 shadow-sm shadow-orange-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>🎯 Lead Board &amp; Persona</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('outbound_roleplay'); setSubTab('outbound'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'outbound_roleplay'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                <span>📞 Outbound &amp; AI Roleplay</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('plg_funnel'); setSubTab('plg'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'plg_funnel'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-purple-400" />
                <span>📊 PLG &amp; Monetization Radar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Toggles */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {activeGroup === 'persona_scoring' && (
            <>
              <button
                onClick={() => setSubTab('leads')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'leads' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Distribution Lead Board
              </button>
              <button
                onClick={() => setSubTab('scoring')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'scoring' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Lead Scoring Engine
              </button>
              <button
                onClick={() => setSubTab('persona')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'persona' ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" /> Persona Interview Lab
              </button>
            </>
          )}

          {activeGroup === 'outbound_roleplay' && (
            <>
              <button
                onClick={() => setSubTab('outbound')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'outbound' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" /> Outbound Sales Hub &amp; BattleCards
              </button>
              <button
                onClick={() => setSubTab('roleplay')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'roleplay' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> AI Sales Roleplay Lab
              </button>
            </>
          )}

          {activeGroup === 'plg_funnel' && (
            <>
              <button
                onClick={() => setSubTab('plg')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'plg' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" /> PLG Conversion Hub
              </button>
              <button
                onClick={() => setSubTab('monetization_radar')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'monetization_radar' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <CircleDollarSign className="w-3.5 h-3.5" /> Monetization Radar
              </button>
              <button
                onClick={() => setSubTab('video_affiliate')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'video_affiliate' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Video Affiliate Growth
              </button>
            </>
          )}
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {subTab === 'monetization_radar' && <div className="p-6"><DigitalMonetizationRadarPanel /></div>}
        {subTab === 'leads' && <div className="p-6"><DistributionLeadBoard /></div>}
        {subTab === 'video_affiliate' && <div className="p-6"><VideoAffiliateGrowthHub /></div>}
        {subTab === 'scoring' && <LeadScoringEngine />}
        {subTab === 'persona' && <div className="p-6"><PersonaInterviewLab /></div>}
        {subTab === 'outbound' && <OutboundSalesHub />}
        {subTab === 'plg' && <PLGConversionHub />}
        {subTab === 'funnel' && <div className="p-6"><SalesFunnelLab /></div>}
        {subTab === 'roleplay' && <div className="p-6"><SalesRoleplayLab /></div>}
      </div>
    </div>
  );
}
