/**
 * AIWorkforceStatusBar.tsx
 * ═════════════════════════════════════════════════════════════════
 * Mini status bar cho module Đội ngũ AI.
 * Đọc data từ AIWorkforceContext (chạy ngầm) — không tự fetch.
 * Hiển thị: số agents đang chạy, active swarms, running loops, sync time.
 * ═════════════════════════════════════════════════════════════════
 */

import { Activity, Bot, CheckCircle2, Clock, RefreshCw, ShieldAlert, Wifi, WifiOff, Users, RotateCw } from 'lucide-react';
import { useAIWorkforce } from '../../context/AIWorkforceContext';

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'chưa đồng bộ';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'vừa xong';
  if (seconds < 60) return `${seconds}s trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}p trước`;
  return `${Math.floor(minutes / 60)}h trước`;
}

export default function AIWorkforceStatusBar() {
  const { snapshot, swarmPlans, agenticLoops, connected, loading, lastSync, error, refresh } = useAIWorkforce();

  // Đếm swarms đang chạy ngầm (executing hoặc planning)
  const activeSwarms = useMemo(() => {
    return swarmPlans.filter(plan => ['planning', 'executing'].includes(plan.status)).length;
  }, [swarmPlans]);

  // Đếm loops đang chạy ngầm
  const activeLoops = useMemo(() => {
    return agenticLoops.filter(loop => loop.status === 'running').length;
  }, [agenticLoops]);

  // Gradient và trạng thái kết nối
  const statusColor = connected
    ? 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/20'
    : error
    ? 'from-rose-500/10 to-rose-600/10 border-rose-500/20'
    : 'from-slate-900/60 to-slate-900/60 border-slate-800';

  const dotColor = connected
    ? 'bg-emerald-400'
    : error
    ? 'bg-rose-400'
    : 'bg-slate-600';

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border bg-gradient-to-r p-3 text-left transition-all ${statusColor}`}
    >
      {/* Left: connection indicator + metrics */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Connection dot */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${dotColor} ${connected ? 'animate-pulse' : ''}`}
          />
          {loading ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Đang kết nối...
            </span>
          ) : connected ? (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <Wifi className="h-3 w-3" />
              AI OS Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
              <WifiOff className="h-3 w-3" />
              AI OS Offline
            </span>
          )}
        </div>

        {/* Separator */}
        <span className="h-3.5 w-px bg-slate-700" />

        {/* Active runs */}
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-black text-white">
            {snapshot?.activeRuns ?? '—'}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">agents chạy</span>
        </div>

        {/* Active Swarms */}
        {activeSwarms > 0 && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
              <span className="text-[11px] font-black text-violet-300">
                {activeSwarms}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">swarm ngầm</span>
            </div>
          </>
        )}

        {/* Active Loops */}
        {activeLoops > 0 && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <RotateCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-[11px] font-black text-emerald-300">
                {activeLoops}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">loop tự trị</span>
            </div>
          </>
        )}

        {/* Pending approvals */}
        {(snapshot?.pendingApprovals ?? 0) > 0 && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
              <span className="text-[11px] font-black text-amber-300">
                {snapshot!.pendingApprovals}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">chờ duyệt</span>
            </div>
          </>
        )}

        {/* Blocked */}
        {(snapshot?.blockedCount ?? 0) > 0 && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-[11px] font-black text-rose-300">
                {snapshot!.blockedCount}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">bị block</span>
            </div>
          </>
        )}

        {/* Readiness grade */}
        {snapshot?.readinessGrade && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-300">
                Grade {snapshot.readinessGrade}
              </span>
            </div>
          </>
        )}

        {/* Error */}
        {error && !connected && (
          <>
            <span className="h-3.5 w-px bg-slate-700" />
            <span className="text-[10px] font-semibold text-rose-400">{error}</span>
          </>
        )}
      </div>

      {/* Right: last sync + refresh */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(lastSync)}
        </div>
        <button
          type="button"
          onClick={refresh}
          className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300"
          title="Làm mới trạng thái AI"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Helper hook cho useMemo
import { useMemo } from 'react';
