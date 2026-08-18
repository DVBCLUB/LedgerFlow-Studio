import React, { useState } from 'react';
import { Wallet, BarChart2, DollarSign } from 'lucide-react';
import PricingOfferBuilder from './components/PricingOfferBuilder';
import PricingStrategyLab from './components/PricingStrategyLab';
import CustomerLTVDashboard from './components/CustomerLTVDashboard';

export default function PricingAndLTVLab() {
  const [activeTab, setActiveTab] = useState<'strategy' | 'offer' | 'ltv'>('strategy');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pricing &amp; Monetization
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Dynamic Pricing Active
              </span>
              <span className="text-xs font-bold text-slate-400">| Báo Giá &amp; Giá Trị Vòng Đời LTV</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Chiến Lược Báo Giá, Gói Đăng Ký &amp; LTV Dashboard
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Thiết lập chiến lược giá linh hoạt (Freemium, Tiered, Usage-based), xây dựng các gói báo giá SaaS chuyên nghiệp và theo dõi Customer LTV.
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
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'strategy' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pricing Strategy</span>
              </button>
              <button
                onClick={() => setActiveTab('offer')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'offer' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Offer Builder</span>
              </button>
              <button
                onClick={() => setActiveTab('ltv')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ltv' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-purple-400" />
                <span>LTV Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {activeTab === 'strategy' && <PricingStrategyLab />}
        {activeTab === 'offer' && <div className="p-6"><PricingOfferBuilder /></div>}
        {activeTab === 'ltv' && <CustomerLTVDashboard />}
      </div>
    </div>
  );
}
