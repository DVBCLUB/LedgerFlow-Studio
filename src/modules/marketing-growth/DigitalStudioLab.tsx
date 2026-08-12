import React, { useState } from 'react';
import { Film, Sparkles, Share2, Wand2 } from 'lucide-react';
import AIContentVideoLab from './components/AIContentVideoLab';
import ContentRepurposeBoard from './components/ContentRepurposeBoard';
import VideoMakerPanel from '../video-maker/ui/index';
import AIVideoFactoryPanel from '../sales-crm/components/AIVideoFactoryPanel';
import AutonomousMediaFactoryPanel from './AutonomousMediaFactoryPanel';

export default function DigitalStudioLab() {
  const [activeTab, setActiveTab] = useState<'video' | 'ai_video' | 'autonomous_media' | 'repurpose'>('video');

  return (
    <div className="flex flex-col h-full space-y-6 text-left select-none animate-fade-in">
      {/* Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-purple-950/20 p-6 text-left shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Digital Studio & AI Video Production</p>
        <h1 className="mt-2 text-2xl font-black text-white">Studio Kỹ thuật số & Sản xuất Video AI</h1>
        <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
          Nơi dựng video đa kênh (TikTok, Reels, Shorts), áp dụng AI (ElevenLabs, Runway, Luma, HeyGen) tạo kịch bản tự động và tái sử dụng nội dung tiếp thị.
        </p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'video' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" /> Video Maker
          </button>
          <button
            onClick={() => setActiveTab('ai_video')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ai_video' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> AI Video Factory
          </button>
          <button
            onClick={() => setActiveTab('autonomous_media')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'autonomous_media' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Media Factory
          </button>
          <button
            onClick={() => setActiveTab('repurpose')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              activeTab === 'repurpose' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Content Repurpose
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {activeTab === 'video' && (
          <div className="h-full">
            <VideoMakerPanel />
          </div>
        )}
        {activeTab === 'ai_video' && (
          <div className="p-6">
            <AIVideoFactoryPanel />
          </div>
        )}
        {activeTab === 'autonomous_media' && (
          <div className="p-6">
            <AutonomousMediaFactoryPanel />
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
