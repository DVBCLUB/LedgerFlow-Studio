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
  onToggleAdvanced?: () => void;
  showAdvanced?: boolean;
  advancedCount?: number;
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

const WorkspaceSubNavigation = React.memo(function WorkspaceSubNavigation<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  title,
  eyebrow,
  onToggleAdvanced,
  showAdvanced,
  advancedCount,
}: WorkspaceSubNavigationProps<T>) {
  return (
    <header
      className="rounded-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.65) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
      }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute -top-12 left-1/4 w-96 h-24 rounded-full pointer-events-none opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}
      />

      {/* Title row */}
      {title && (
        <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-400 mb-0.5">{eyebrow}</p>
            )}
            <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
          </div>
        </div>
      )}

      {/* Tab bar — responsive flex wrap with horizontal overflow safety */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 max-w-full overflow-x-auto">
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
              className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 rounded-xl select-none group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
              )}
              <span>{displayLabel}</span>
              {displayBadge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${displayBadgeColor || 'bg-indigo-500/15 text-indigo-300'}`}>
                  {displayBadge}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] ml-0.5 animate-pulse" />
              )}
            </button>
          );
        })}

        {Boolean(advancedCount && advancedCount > 0 && onToggleAdvanced) && (
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-slate-700/60 hover:border-indigo-500/30 transition-all duration-200 ml-auto cursor-pointer select-none"
          >
            <span>{showAdvanced ? '▴ Thu gọn' : `▾ +${advancedCount} Nâng cao`}</span>
          </button>
        )}
      </div>
    </header>
  );
});

export default WorkspaceSubNavigation;
