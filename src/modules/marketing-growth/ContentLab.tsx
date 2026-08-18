import React, { useState } from 'react';
import { Mail, Edit3, MessageCircle, FileText, Search, Sparkles, Presentation, Volume2 } from 'lucide-react';
import LandingPageCopyLab from './components/LandingPageCopyLab';
import EmailSequenceBuilder from './components/EmailSequenceBuilder';
import GoogleKeywordStrategy from './components/GoogleKeywordStrategy';
import ZaloMarketingHub from './components/ZaloMarketingHub';
import ZaloNotificationSimulator from './components/ZaloNotificationSimulator';
import EnterpriseControlCenterPanel from '../../components/enterprise/EnterpriseControlCenterPanel';

export default function ContentLab() {
  const [activeGroup, setActiveGroup] = useState<'copy_email' | 'seo_strategy' | 'zalo_hub' | 'supercharger'>('copy_email');
  const [subTab, setSubTab] = useState<'copy' | 'email' | 'seo' | 'zalo' | 'zalo_sim' | 'supercharger'>('copy');
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-full space-y-5 text-left select-none animate-fade-in">
      {/* Cockpit Header */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20 p-5 text-left shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Content Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                4/4 Content Daemons Online
              </span>
              <span className="text-xs font-bold text-slate-400">| Landing Page, Email, SEO, Slide &amp; NotebookLM</span>
            </div>
            <h1 className="mt-1.5 text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Nội Dung Đa Kênh, Gamma Slides &amp; NotebookLM AI
            </h1>
            {!isCompactMode && (
              <p className="mt-1.5 max-w-3xl text-xs font-semibold text-slate-300/90 leading-5">
                Sản xuất nội dung bán hàng Headline AIDA/PAS, chuỗi Email tự động, SEO Google, xuất slide Gamma 1-click và gói RAG NotebookLM Podcast 2 MC.
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
                onClick={() => { setActiveGroup('copy_email'); setSubTab('copy'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'copy_email'
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>📝 Copy &amp; Email</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('seo_strategy'); setSubTab('seo'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'seo_strategy'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>🔍 SEO</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('zalo_hub'); setSubTab('zalo'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'zalo_hub'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>💬 Zalo Hub</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveGroup('supercharger'); setSubTab('supercharger'); }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeGroup === 'supercharger'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>⚡ NotebookLM &amp; Gamma</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Toggles */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {activeGroup === 'copy_email' && (
            <>
              <button
                onClick={() => setSubTab('copy')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'copy' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Landing Page Copy Lab
              </button>
              <button
                onClick={() => setSubTab('email')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'email' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Email Sequence Builder
              </button>
            </>
          )}

          {activeGroup === 'seo_strategy' && (
            <button
              onClick={() => setSubTab('seo')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === 'seo' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Google Keyword Strategy (117KB SEO)
            </button>
          )}

          {activeGroup === 'zalo_hub' && (
            <>
              <button
                onClick={() => setSubTab('zalo')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'zalo' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Zalo OA Marketing Hub
              </button>
              <button
                onClick={() => setSubTab('zalo_sim')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  subTab === 'zalo_sim' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Zalo Notification Simulator
              </button>
            </>
          )}

          {activeGroup === 'supercharger' && (
            <div className="text-xs font-bold text-purple-300">
              ✓ Bộ công cụ siêu cấp kết nối NotebookLM, Gamma Slide, LanguageTool và AI Avatar
            </div>
          )}
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-auto rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {subTab === 'copy' && (
          <div className="p-6">
            <LandingPageCopyLab />
          </div>
        )}
        {subTab === 'email' && (
          <div className="p-6">
            <EmailSequenceBuilder />
          </div>
        )}
        {subTab === 'seo' && (
          <div className="p-6">
            <GoogleKeywordStrategy />
          </div>
        )}
        {subTab === 'zalo' && (
          <div className="p-6">
            <ZaloMarketingHub />
          </div>
        )}
        {subTab === 'zalo_sim' && (
          <div className="p-6">
            <ZaloNotificationSimulator />
          </div>
        )}
        {subTab === 'supercharger' && (
          <div className="p-6">
            <EnterpriseControlCenterPanel />
          </div>
        )}
      </div>
    </div>
  );
}
