import React from 'react';
import { Sparkles, LayoutGrid, Radio, Film, Gamepad2, Bot, CircleDollarSign } from 'lucide-react';
import { type TabType } from '../app/companyNavigation';

interface SoloFounderNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isSoloMode: boolean;
  onToggleSoloMode: (enabled: boolean) => void;
}

export const SOLO_FOUNDER_PILLARS = [
  {
    tab: 'ceo_command' as TabType,
    label: 'CEO & Cash Radar',
    subtitle: 'Doanh thu 24h & Quyết định',
    icon: CircleDollarSign,
    badge: '1-Click',
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
  },
  {
    tab: 'marketing_growth' as TabType,
    label: 'Media & Video Factory',
    subtitle: 'TikTok, Shorts, Phim AI & Affiliate',
    icon: Film,
    badge: 'AI Studio',
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/30',
  },
  {
    tab: 'product_studio' as TabType,
    label: 'Game & App Studio',
    subtitle: 'Build PC/Mobile & Feedback AI',
    icon: Gamepad2,
    badge: 'PC & Mobile',
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/30',
  },
  {
    tab: 'ai_factory' as TabType,
    label: 'AI Workforce Command',
    subtitle: 'Đội ngũ AI & Robot Tự vận hành',
    icon: Bot,
    badge: 'AI Staff',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/30',
  },
];

export default function SoloFounderNavigation({
  activeTab,
  onSelectTab,
  isSoloMode,
  onToggleSoloMode,
}: SoloFounderNavigationProps) {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Toggle Mode Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSoloMode(!isSoloMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isSoloMode
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSoloMode ? 'Solo Founder Mode' : 'Switch to Solo Mode'}</span>
          </button>
          <span className="text-[11px] text-slate-400 font-medium hidden lg:inline">
            {isSoloMode
              ? '⚡ Giao diện tối giản: 1 Giám đốc + Đội ngũ AI Staff'
              : '🏢 Chế độ Doanh nghiệp Toàn diện'}
          </span>
        </div>

        {/* 4 Core Pillars Navigation */}
        {isSoloMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
            {SOLO_FOUNDER_PILLARS.map((p) => {
              const Icon = p.icon;
              const isActive = activeTab === p.tab;
              return (
                <button
                  key={p.tab}
                  onClick={() => onSelectTab(p.tab)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all border ${
                    isActive
                      ? `bg-slate-800/90 text-white ${p.borderColor} ring-1 ring-indigo-500/50 shadow-lg`
                      : 'bg-slate-950/40 text-slate-400 border-slate-800/50 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${p.color} shrink-0 shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{p.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{p.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
