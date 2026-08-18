import React, { useState } from 'react';
import { Share2, Heart, Users } from 'lucide-react';
import AffiliateReferralHub from './components/AffiliateReferralHub';
import NPSReviewManager from './components/NPSReviewManager';

export default function ReferralAndNPSLab() {
  const [activeTab, setActiveTab] = useState<'affiliate' | 'nps'>('affiliate');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-pink-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Partner Growth &amp; Loyalty
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Affiliate Payout Active
              </span>
              <span className="text-xs font-bold text-slate-400">| Đại Lý, Mạng Lưới Referral &amp; NPS</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Mạng Lưới Đại Lý Affiliate &amp; Đánh Giá Khách Hàng NPS
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Quản lý chương trình hoa hồng đại lý giới thiệu (Affiliate Referral Hub) và thu thập, phân tích phản hồi đo lường độ hài lòng khách hàng NPS.
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
                onClick={() => setActiveTab('affiliate')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'affiliate' ? 'bg-pink-500/20 text-pink-200 border border-pink-500/40 shadow-sm shadow-pink-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Affiliate Hub</span>
              </button>
              <button
                onClick={() => setActiveTab('nps')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'nps' ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-purple-400" />
                <span>NPS &amp; Reviews</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {activeTab === 'affiliate' && <AffiliateReferralHub />}
        {activeTab === 'nps' && <NPSReviewManager />}
      </div>
    </div>
  );
}
