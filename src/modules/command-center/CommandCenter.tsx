import React, { useState } from 'react';
import CommandCenterV2DailyBriefPanel from './CommandCenterV2DailyBriefPanel';
import AiAgentControlCenter from './components/AiAgentControlCenter';
import OnboardingGuide from './components/OnboardingGuide';
import CEOOverviewPanel from './CEOOverviewPanel';
import ERPCommandCenter from './ERPCommandCenter';
import type { TabType } from '../../app/companyNavigation';
import { Building2, Bot, Gauge, HelpCircle, Activity } from 'lucide-react';

interface CommandCenterProps {
  onNavigate: (tab: TabType, subTab?: string) => void;
}

export default function CommandCenter({ onNavigate }: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<'business' | 'ai_ops' | 'daily_brief' | 'onboarding'>('business');

  const tabsConfig = [
    { id: 'business' as const, label: 'Doanh nghiệp & Chỉ huy', icon: Building2, desc: 'Doanh thu, kế hoạch dự án và sức khỏe dòng tiền.' },
    { id: 'daily_brief' as const, label: 'Báo cáo Vận hành V2', icon: Gauge, desc: 'Báo cáo ngày, chỉ số vận hành và hành động tiếp theo.' },
    { id: 'ai_ops' as const, label: 'Kiểm soát Robot AI', icon: Bot, desc: 'Định cấu hình, theo dõi hoạt động và logs của các Agent.' },
    { id: 'onboarding' as const, label: 'Hướng dẫn Nhập môn', icon: HelpCircle, desc: 'Lộ trình phát triển sản phẩm và cẩm nang founder.' }
  ];

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in select-none">
      {/* Premium Navigation Row */}
      <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] text-left p-3.5 rounded-xl transition-all cursor-pointer border ${
                isActive 
                  ? 'bg-purple-650/15 border-purple-500/30 text-purple-300 shadow-lg shadow-purple-950/20' 
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-950/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className="text-xs font-black tracking-tight">{tab.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed line-clamp-1">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {activeTab === 'business' && (
          <div className="space-y-6 animate-fade-in">
            <ERPCommandCenter onNavigate={onNavigate} />
            <CEOOverviewPanel />
          </div>
        )}

        {activeTab === 'daily_brief' && (
          <div className="animate-fade-in">
            <CommandCenterV2DailyBriefPanel />
          </div>
        )}

        {activeTab === 'ai_ops' && (
          <div className="animate-fade-in">
            <AiAgentControlCenter />
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="animate-fade-in">
            <OnboardingGuide />
          </div>
        )}
      </div>
    </div>
  );
}
