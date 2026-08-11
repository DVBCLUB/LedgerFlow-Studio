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
    <header
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />

      {/* Title row */}
      {title && (
        <div className="px-5 pt-4 pb-3">
          {eyebrow && (
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400 mb-1">{eyebrow}</p>
          )}
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
      )}

      {/* Tab bar — responsive flex wrap with horizontal overflow safety */}
      <div
        className="flex flex-wrap items-center gap-1 p-1.5 max-w-full overflow-x-auto"
        style={{
          borderTop: title ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hub = INTEGRATED_HUB_LABELS[String(tab.id)];
          const displayLabel = hub?.label ?? tab.label;
          const displayBadge = tab.badge ?? hub?.badge;
          const displayBadgeColor = tab.badgeColor ?? (hub ? 'text-cyan-300 bg-cyan-500/10' : undefined);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              title={hub ? `${displayLabel} — ${tab.label}` : tab.label}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer transition-all rounded-xl select-none group ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
              }`}
            >
              {Icon && (
                <Icon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: isActive ? '#818cf8' : 'inherit' }}
                />
              )}
              <span>{displayLabel}</span>
              {displayBadge && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${displayBadgeColor || 'bg-indigo-500/10 text-indigo-400'}`}>
                  {displayBadge}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
