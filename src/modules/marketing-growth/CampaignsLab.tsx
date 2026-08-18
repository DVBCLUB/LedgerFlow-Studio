import React, { useState } from 'react';
import { Target, TrendingUp, Crosshair, Search, HelpCircle, Rocket, BarChart3, ShieldCheck } from 'lucide-react';
import MarketingFunnelLab from './components/MarketingFunnelLab';
import AdCampaignSimulator from './components/AdCampaignSimulator';
import ProductLaunchChecklist from './components/ProductLaunchChecklist';
import GuerrillaLaunchPlaybook from './components/GuerrillaLaunchPlaybook';
import SyntheticSurveyBuilder from './components/SyntheticSurveyBuilder';
import SyntheticMarketSimulatorPanel from './SyntheticMarketSimulatorPanel';

export default function CampaignsLab() {
  const [activeGroup, setActiveGroup] = useState<'funnel_ads' | 'launch_playbook' | 'survey_sim'>('funnel_ads');
  const [subTab, setSubTab] = useState<'funnel' | 'ad' | 'launch' | 'guerrilla' | 'survey' | 'market'>('funnel');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-rose-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                CMO Growth Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                4/4 Daemons Ngầm Online
              </span>
              <span className="text-xs font-bold text-slate-400">| Phễu Chuyển Đổi &amp; Quảng Cáo AI</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-rose-400" />
              Chiến Dịch &amp; Phễu Chuyển Đổi Tối Ưu
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Nơi thiết kế phễu marketing đa tầng (TOFU/MOFU/BOFU), mô phỏng ngân sách chạy Ads ROI, theo dõi Launch Checklist 25 bước và chạy khảo sát AI.
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
                onClick={() => { setActiveGroup('funnel_ads'); setSubTab('funnel'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'funnel_ads'
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>🎯 Phễu &amp; Ads</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('launch_playbook'); setSubTab('launch'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'launch_playbook'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>📋 Launch Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('survey_sim'); setSubTab('survey'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'survey_sim'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                <span>📊 Mô Phỏng AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Toggles */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {activeGroup === 'funnel_ads' && (
            <>
              <button
                onClick={() => setSubTab('funnel')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'funnel' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Phễu Funnel Lab
              </button>
              <button
                onClick={() => setSubTab('ad')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'ad' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Dự Toán Ads ROI
              </button>
            </>
          )}

          {activeGroup === 'launch_playbook' && (
            <>
              <button
                onClick={() => setSubTab('launch')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'launch' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> 25 Bước Launch Checklist
              </button>
              <button
                onClick={() => setSubTab('guerrilla')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'guerrilla' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> Guerrilla Playbook
              </button>
            </>
          )}

          {activeGroup === 'survey_sim' && (
            <>
              <button
                onClick={() => setSubTab('survey')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'survey' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Synthetic Survey Builder
              </button>
              <button
                onClick={() => setSubTab('market')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'market' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Synthetic Market Simulator
              </button>
            </>
          )}
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {subTab === 'funnel' && <MarketingFunnelLab />}
        {subTab === 'ad' && <AdCampaignSimulator />}
        {subTab === 'launch' && (
          <div className="p-6">
            <ProductLaunchChecklist />
          </div>
        )}
        {subTab === 'guerrilla' && (
          <div className="p-6">
            <GuerrillaLaunchPlaybook />
          </div>
        )}
        {subTab === 'survey' && (
          <div className="p-6">
            <SyntheticSurveyBuilder />
          </div>
        )}
        {subTab === 'market' && (
          <div className="p-6">
            <SyntheticMarketSimulatorPanel />
          </div>
        )}
      </div>
    </div>
  );
}
