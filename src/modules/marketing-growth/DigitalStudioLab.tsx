import React, { useState } from 'react';
import { Film, Sparkles, Share2, Wand2, Send } from 'lucide-react';
import AIContentVideoLab from './components/AIContentVideoLab';
import ContentRepurposeBoard from './components/ContentRepurposeBoard';
import VideoMakerPanel from '../video-maker/ui/index';
import AIVideoFactoryPanel from '../sales-crm/components/AIVideoFactoryPanel';
import AutonomousMediaFactoryPanel from './AutonomousMediaFactoryPanel';
import PublisherConnectorPanel from './components/PublisherConnectorPanel';

export default function DigitalStudioLab() {
  const [activeGroup, setActiveGroup] = useState<'ai_video' | 'maker' | 'repurpose_publish'>('ai_video');
  const [subTab, setSubTab] = useState<'ai_video' | 'auto_media' | 'content_lab' | 'maker' | 'repurpose' | 'publisher'>('ai_video');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-purple-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Digital Media Factory
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                4/4 Video/Publish Daemons Online
              </span>
              <span className="text-xs font-bold text-slate-400">| Sản Xuất Video AI TikTok/Reels &amp; Đăng Đa Kênh</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              Studio Kỹ Thuật Số &amp; Xưởng Video AI
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Nơi dựng Video ngắn đa kênh (TikTok, Shorts, Reels), ứng dụng AI sinh kịch bản tự động, tái sử dụng 1 bài viết sang 5 kênh và tự động xuất bản (Facebook, Zalo, LinkedIn).
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
                onClick={() => { setActiveGroup('ai_video'); setSubTab('ai_video'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'ai_video'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>🎬 Xưởng Video AI</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('maker'); setSubTab('maker'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'maker'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>✂️ Dựng Video Studio</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('repurpose_publish'); setSubTab('repurpose'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'repurpose_publish'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>🔄 Tái Sử Dụng &amp; Đăng Đa Kênh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Toggles */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {activeGroup === 'ai_video' && (
            <>
              <button
                onClick={() => setSubTab('ai_video')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'ai_video' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" /> AI Video Factory
              </button>
              <button
                onClick={() => setSubTab('auto_media')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'auto_media' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Autonomous Media Factory
              </button>
              <button
                onClick={() => setSubTab('content_lab')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'content_lab' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> AI Content Video Lab
              </button>
            </>
          )}

          {activeGroup === 'maker' && (
            <button
              onClick={() => setSubTab('maker')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === 'maker' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Direct Canvas Video Maker
            </button>
          )}

          {activeGroup === 'repurpose_publish' && (
            <>
              <button
                onClick={() => setSubTab('repurpose')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'repurpose' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" /> Content Repurpose Board
              </button>
              <button
                onClick={() => setSubTab('publisher')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'publisher' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Send className="w-3.5 h-3.5" /> Multi-Channel Publisher Connector
              </button>
            </>
          )}
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {subTab === 'ai_video' && (
          <div className="p-6">
            <AIVideoFactoryPanel />
          </div>
        )}
        {subTab === 'auto_media' && (
          <div className="p-6">
            <AutonomousMediaFactoryPanel />
          </div>
        )}
        {subTab === 'content_lab' && (
          <div className="p-6">
            <AIContentVideoLab />
          </div>
        )}
        {subTab === 'maker' && (
          <div className="h-full">
            <VideoMakerPanel />
          </div>
        )}
        {subTab === 'repurpose' && (
          <div className="p-6">
            <ContentRepurposeBoard />
          </div>
        )}
        {subTab === 'publisher' && (
          <div className="p-6">
            <PublisherConnectorPanel />
          </div>
        )}
      </div>
    </div>
  );
}
