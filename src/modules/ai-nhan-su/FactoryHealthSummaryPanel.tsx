import React from 'react';
import { Activity, Server, Zap, GitBranch, Cpu, Database } from 'lucide-react';

export function FactoryHealthSummaryPanel() {
  const metrics = [
    { label: 'Runtime Engine', value: 'Trực Chiến', status: 'optimal', icon: Server, detail: 'Node.js v24 & Vite Server' },
    { label: 'Hàng Đợi Nhiệm Vụ', value: '0 Tồn Đọng', status: 'optimal', icon: Zap, detail: 'Đã hoàn tất 100% ca trực' },
    { label: 'Môi Trường Git/Sandbox', value: 'Sạch Sẽ', status: 'optimal', icon: GitBranch, detail: 'Branch main đã đồng bộ' },
    { label: 'Bộ Nhớ Vector RAG', value: '2.4 MB', status: 'optimal', icon: Database, detail: 'Local SQLite-ready cache' },
  ];

  return (
    <div className="rounded-2xl border border-border-primary bg-slate-950/80 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between border-b border-border-secondary/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Tổng Quan Sức Khỏe Software Factory</h3>
            <p className="text-xs text-text-tertiary">Chỉ số vận hành hệ thống phần mềm và hạ tầng AI</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          100% Operational
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-border-secondary bg-slate-900/50 p-3.5 hover:border-border-primary transition-all">
              <div className="flex items-center justify-between text-text-tertiary">
                <span className="text-[11px] font-bold uppercase tracking-wider">{m.label}</span>
                <Icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-lg font-black text-text-primary">{m.value}</div>
              <div className="mt-1 text-[11px] text-text-tertiary">{m.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FactoryHealthSummaryPanel;
