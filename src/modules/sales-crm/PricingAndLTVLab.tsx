import React, { useState } from 'react';
import { Wallet, FileText, BarChart2, DollarSign } from 'lucide-react';
import PricingOfferBuilder from './components/PricingOfferBuilder';
import PricingStrategyLab from './components/PricingStrategyLab';
import CustomerLTVDashboard from './components/CustomerLTVDashboard';

export default function PricingAndLTVLab() {
  const [activeTab, setActiveTab] = useState<'strategy' | 'offer' | 'ltv'>('strategy');

  return (
    <div className="flex flex-col h-full space-y-6">
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Pricing & LTV</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Báo giá & Giá trị Vòng đời</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Thiết lập chiến lược giá, xây dựng các gói báo giá và theo dõi Customer LTV.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('strategy')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'strategy' ? 'bg-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <BarChart2 className="w-4 h-4" /> Pricing Strategy
          </button>
          <button onClick={() => setActiveTab('offer')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'offer' ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <DollarSign className="w-4 h-4" /> Offer Builder
          </button>
          <button onClick={() => setActiveTab('ltv')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'ltv' ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Wallet className="w-4 h-4" /> LTV Dashboard
          </button>
        </div>
      </section>

      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'strategy' && <PricingStrategyLab />}
        {activeTab === 'offer' && <div className="p-6"><PricingOfferBuilder /></div>}
        {activeTab === 'ltv' && <CustomerLTVDashboard />}
      </div>
    </div>
  );
}
