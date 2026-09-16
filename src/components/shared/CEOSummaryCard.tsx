import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export interface CEOSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  tone?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'indigo';
  actionLabel?: string;
  onAction?: () => void;
  statusBadge?: string;
  className?: string;
}

const TONE_STYLES = {
  emerald: {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    valueColor: 'text-emerald-300',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  cyan: {
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    valueColor: 'text-cyan-300',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  violet: {
    border: 'border-violet-500/20 hover:border-violet-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-violet-950/20',
    iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    valueColor: 'text-violet-300',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
  amber: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-amber-950/20',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    valueColor: 'text-amber-300',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  rose: {
    border: 'border-rose-500/20 hover:border-rose-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-rose-950/20',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    valueColor: 'text-rose-300',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  indigo: {
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    bg: 'bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/20',
    iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    valueColor: 'text-indigo-300',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
};

export const CEOSummaryCard: React.FC<CEOSummaryCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  tone = 'indigo',
  actionLabel,
  onAction,
  statusBadge,
  className = '',
}) => {
  const styles = TONE_STYLES[tone] || TONE_STYLES.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg backdrop-blur-xl transition-all duration-300 group ${styles.border} ${styles.bg} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
            {statusBadge && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles.badge}`}>
                {statusBadge}
              </span>
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${styles.valueColor}`}>
            {value}
          </div>
        </div>

        <div
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center border shadow-sm shrink-0 transition-transform group-hover:scale-105 ${styles.iconBg}`}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs">
          {typeof trend === 'number' && (
            <span
              className={`flex items-center gap-1 font-bold ${
                trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </span>
          )}
          {subtitle && <span className="text-slate-400 text-xs truncate max-w-[200px]">{subtitle}</span>}
          {trendLabel && !subtitle && <span className="text-slate-400 text-xs">{trendLabel}</span>}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CEOSummaryCard;
