import React, { useState } from 'react';
import { Film, Sparkles, Share2 } from 'lucide-react';
import AIContentVideoLab from './components/AIContentVideoLab';
import ContentRepurposeBoard from './components/ContentRepurposeBoard';
import VideoMakerPanel from '../video-maker/ui/index';

export default function DigitalStudioLab() {
  const [activeTab, setActiveTab] = useState<'video' | 'ai_video' | 'repurpose'>('video');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-border-primary bg-bg-surface/70 p-6 text-left shadow-xl shadow-black/20">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Digital Studio</p>
        <h1 className="mt-2 text-2xl font-black text-text-primary">Studio Kỹ thuật số</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-text-secondary">Nơi dựng video, áp dụng AI tạo kịch bản và tái sử dụng nội dung đa kênh.</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'video' ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Film className="w-4 h-4" /> Video Maker
          </button>
          <button
            onClick={() => setActiveTab('ai_video')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'ai_video' ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Video Lab
          </button>
          <button
            onClick={() => setActiveTab('repurpose')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === 'repurpose' ? 'bg-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-bg-primary text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <Share2 className="w-4 h-4" /> Content Repurpose
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-3xl border border-border-primary bg-bg-surface/30 shadow-2xl">
        {activeTab === 'video' && (
          <div className="h-full">
            <VideoMakerPanel />
          </div>
        )}
        {activeTab === 'ai_video' && (
          <div className="p-6">
            <AIContentVideoLab />
          </div>
        )}
        {activeTab === 'repurpose' && (
          <div className="p-6">
            <ContentRepurposeBoard />
          </div>
        )}
      </div>
    </div>
  );
}
