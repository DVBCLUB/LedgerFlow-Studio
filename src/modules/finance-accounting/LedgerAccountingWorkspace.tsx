import React, { useState } from 'react';
import AccountingVietnam from './AccountingVietnam';
import AccountingVietnamDeepDivePanel from './AccountingVietnamDeepDivePanel';
import CustomDataWorkbench from '../analytics-models-sandbox/CustomDataWorkbench';
import { Beaker, BookOpen, Database } from 'lucide-react';

export default function LedgerAccountingWorkspace() {
  const [activeTab, setActiveTab] = useState<'lab' | 'deepdive' | 'workbench'>('lab');

  const tabs = [
    { id: 'lab' as const, label: 'Phòng Lab & Mô phỏng', icon: Beaker, desc: 'Mô phỏng tài chính, what-if và chấm điểm ý tưởng.' },
    { id: 'deepdive' as const, label: 'Kiến thức chuyên sâu VAS', icon: BookOpen, desc: 'Quy định Thông tư 200/133, thuế suất VAT và hàng tồn kho.' },
    { id: 'workbench' as const, label: 'Bàn làm việc dữ liệu', icon: Database, desc: 'Công cụ làm việc và phân tích dữ liệu tùy biến.' }
  ];

  return (
    <div className="space-y-6 select-none animate-fade-in text-text-primary">
      {/* Premium Tab Selector */}
      <div className="bg-bg-surface p-1.5 rounded-2xl border border-border-primary flex text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer border ${
                isActive 
                  ? 'bg-info/15 border-info/30 text-info shadow-md shadow-cyan-500/5' 
                  : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Renders */}
      <div className="transition-all duration-300">
        {activeTab === 'lab' && (
          <div className="animate-fade-in">
            <AccountingVietnam />
          </div>
        )}

        {activeTab === 'deepdive' && (
          <div className="animate-fade-in">
            <AccountingVietnamDeepDivePanel />
          </div>
        )}

        {activeTab === 'workbench' && (
          <div className="animate-fade-in">
            <CustomDataWorkbench />
          </div>
        )}
      </div>
    </div>
  );
}
