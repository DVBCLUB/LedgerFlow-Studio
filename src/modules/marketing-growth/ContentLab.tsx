import React, { useState } from 'react';
import { Mail, Edit3, MessageCircle, FileText, Search } from 'lucide-react';
import LandingPageCopyLab from './components/LandingPageCopyLab';
import EmailSequenceBuilder from './components/EmailSequenceBuilder';
import GoogleKeywordStrategy from './components/GoogleKeywordStrategy';
import ZaloMarketingHub from './components/ZaloMarketingHub';
import ZaloNotificationSimulator from './components/ZaloNotificationSimulator';

import UnifiedMediaFactoryPanel from './components/UnifiedMediaFactoryPanel';
import { Film } from 'lucide-react';

export default function ContentLab() {
  const [activeTab, setActiveTab] = useState<'video_factory' | 'copy' | 'email' | 'seo' | 'zalo' | 'zalo_sim'>('video_factory');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Content & Media Lab</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Xưởng Video AI & Nội dung Đa kênh</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Sản xuất Video TikTok/Reels, Phim AI, Video tự quay, gắn link Affiliate và Landing Page.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('video_factory')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'video_factory' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Film className="w-4 h-4" /> 🎬 Media & Video AI Factory
          </button>
          <button
            onClick={() => setActiveTab('copy')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'copy' ? 'bg-accent text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Landing Page Copy
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'email' ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Mail className="w-4 h-4" /> Email Sequence
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'seo' ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Search className="w-4 h-4" /> SEO Keywords
          </button>
          <button
            onClick={() => setActiveTab('zalo')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'zalo' ? 'bg-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <MessageCircle className="w-4 h-4" /> Zalo Marketing
          </button>
          <button
            onClick={() => setActiveTab('zalo_sim')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'zalo_sim' ? 'bg-accent text-white shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <FileText className="w-4 h-4" /> Xem trước Zalo
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'video_factory' && (
          <div className="p-6">
            <UnifiedMediaFactoryPanel />
          </div>
        )}
        {activeTab === 'copy' && (
          <div className="p-6">
            <LandingPageCopyLab />
          </div>
        )}
        {activeTab === 'email' && (
          <div className="p-6">
            <EmailSequenceBuilder />
          </div>
        )}
        {activeTab === 'seo' && (
          <div className="p-6">
            <GoogleKeywordStrategy />
          </div>
        )}
        {activeTab === 'zalo' && (
          <div className="p-6">
            <ZaloMarketingHub />
          </div>
        )}
        {activeTab === 'zalo_sim' && (
          <div className="p-6">
            <ZaloNotificationSimulator />
          </div>
        )}
      </div>
    </div>
  );
}
