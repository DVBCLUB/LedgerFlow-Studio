import React, { useState } from 'react';
import { Share2, Heart, MessageSquare, Users } from 'lucide-react';
import AffiliateReferralHub from './components/AffiliateReferralHub';
import NPSReviewManager from './components/NPSReviewManager';

export default function ReferralAndNPSLab() {
  const [activeTab, setActiveTab] = useState<'affiliate' | 'nps'>('affiliate');

  return (
    <div className="flex flex-col h-full space-y-6">
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Referral & NPS</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Đại lý & NPS</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Quản lý chương trình giới thiệu đại lý và phân tích phản hồi NPS.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('affiliate')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'affiliate' ? 'bg-accent text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Share2 className="w-4 h-4" /> Affiliate Hub
          </button>
          <button onClick={() => setActiveTab('nps')} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'nps' ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'}`}>
            <Heart className="w-4 h-4" /> NPS & Reviews
          </button>
        </div>
      </section>

      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'affiliate' && <AffiliateReferralHub />}
        {activeTab === 'nps' && <NPSReviewManager />}
      </div>
    </div>
  );
}
