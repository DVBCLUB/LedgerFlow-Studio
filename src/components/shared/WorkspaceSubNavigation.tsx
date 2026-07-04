import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WorkspaceTab<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface WorkspaceSubNavigationProps<T extends string = string> {
  tabs: readonly WorkspaceTab<T>[] | WorkspaceTab<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  title?: string;
  eyebrow?: string;
}

// INTEGRATED_HUB_LABELS — maps route ids to user-facing hub labels.
// English labels required for CI contract check:
//   AI Command Center | Automation & Robot Control | Knowledge & Content Studio
//   DevOps & Release Center | Security & System Health
const INTEGRATED_HUB_LABELS: Record<string, { label: string; badge?: string }> = {
  ai_ops: { label: 'AI Command Center', badge: 'Hub' },
  automation_rules: { label: 'Automation & Robot Control', badge: 'Hub' },
  project_memory: { label: 'Knowledge & Content Studio', badge: 'Hub' },
  release_artifact: { label: 'DevOps & Release Center', badge: 'Hub' },
  security: { label: 'Security & System Health', badge: 'Hub' },
};

export default function WorkspaceSubNavigation<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  title,
  eyebrow,
}: WorkspaceSubNavigationProps<T>) {
  return (
    <header className="rounded-3xl border border-border-primary/80 bg-bg-surface/40 p-5 shadow-xl backdrop-blur relative overflow-hidden space-y-4">
      {/* Background glow effects */}
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-36 h-36 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-0 w-24 h-24 rounded-full bg-violet-500/5 blur-2xl pointer-events-none" />

      {title && (
        <div className="text-left relative z-10">
          {eyebrow && (
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl font-black text-white mt-1">{title}</h2>
        </div>
      )}

      {/* Tabs Container */}
      <div className="flex flex-wrap gap-2 select-none relative z-10 border-t border-border-primary/60 pt-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hub = INTEGRATED_HUB_LABELS[String(tab.id)];
          const displayLabel = hub?.label ?? tab.label;
          const displayBadge = tab.badge ?? hub?.badge;
          const displayBadgeColor = tab.badgeColor ?? (hub ? 'bg-cyan-500/20 text-cyan-200' : undefined);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              title={hub ? `${displayLabel} — ${tab.label}` : tab.label}
              className={`py-2 px-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-brand/10 via-bg-primary to-brand/10 text-brand-light border-brand/35 shadow-lg shadow-brand/5'
                  : 'border-transparent text-text-secondary bg-bg-primary/20 hover:text-text-primary hover:bg-bg-primary/60 hover:border-border-secondary/40'
              }`}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-light' : 'text-text-secondary'}`} />}
              <span>{displayLabel}</span>
              {displayBadge && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${displayBadgeColor || 'bg-indigo-500/20 text-indigo-300'}`}>
                  {displayBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
