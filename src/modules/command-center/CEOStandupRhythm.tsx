import React, { useState } from 'react';
import DailyFounderStandup from '../finance-accounting/DailyFounderStandup';
import WeeklyActionPlanner from '../finance-accounting/WeeklyActionPlanner';
import MonthlyFounderReview from '../finance-accounting/MonthlyFounderReview';
import CEOOverviewPanel from './CEOOverviewPanel';
import FounderBurnoutMonitor from './components/FounderBurnoutMonitor';
import NorthStarMetricBuilder from './components/NorthStarMetricBuilder';
import { Clock, Calendar, BarChart3, ShieldCheck, Heart } from 'lucide-react';

export default function CEOStandupRhythm() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'survival_lab'>('daily');

  const tabs = [
    { id: 'daily' as const, label: 'Daily Standup', icon: Clock, desc: 'Rà soát rủi ro, ngoại lệ và việc cần làm trong ngày.' },
    { id: 'weekly' as const, label: 'Weekly Planner', icon: Calendar, desc: 'Lên kế hoạch tuần, phân vai việc và duyệt ngân sách.' },
    { id: 'monthly' as const, label: 'Monthly Review', icon: BarChart3, desc: 'Báo cáo tài chính tháng, đối chiếu và advisor note.' },
    { id: 'survival_lab' as const, label: 'Survival Lab 🌟', icon: Heart, desc: 'Giả lập sức khỏe sinh học và lập chỉ số North Star.' }
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-slate-100">
      {/* Overview stats panel */}
      <CEOOverviewPanel />

      {/* Tab Switcher */}
      <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 flex text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer border ${
                isActive 
                  ? 'bg-purple-650/15 border-purple-500/30 text-purple-300 shadow-md' 
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rhythm panel renders */}
      <div className="transition-all duration-300">
        {activeTab === 'daily' && (
          <div className="animate-fade-in">
            <DailyFounderStandup />
          </div>
        )}

        {activeTab === 'weekly' && (
          <div className="animate-fade-in">
            <WeeklyActionPlanner />
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="animate-fade-in">
            <MonthlyFounderReview />
          </div>
        )}

        {activeTab === 'survival_lab' && (
          <div className="animate-fade-in space-y-6">
            <FounderBurnoutMonitor />
            <NorthStarMetricBuilder />
          </div>
        )}
      </div>
    </div>
  );
}
