/**
 * GlaciaProactiveSentinel.tsx
 * ═══════════════════════════════════════════════════════════════
 * Glacia Proactive Autonomous Intelligence & System Sentinel
 * ─────────────────────────────────────────────────────────────
 * Tự động rà soát chỉ số vận hành nền, phát hiện các điểm nghẽn
 * hoặc thành tựu mới (leads CRM, báo cáo tài chính, video viral,
 * mã nguồn) và hiển thị thông báo đề xuất hành động 1-Click.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Code2,
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { fetchOmniSalesMetrics } from '../../utils/glaciaSovereignApi';
import { fetchOrchestrationMetrics } from '../../utils/glaciaOrchestrationApi';
import { fetchSkillMetrics } from '../../utils/glaciaSkillsApi';
import { fetchNightshiftAutopilotStatus } from '../../utils/glaciaBackendSilentApi';

export interface ProactiveAlert {
  id: string;
  category: 'growth' | 'finance' | 'dev' | 'sales' | 'security';
  icon: React.ElementType;
  color: string;
  badge: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'open_cockpit' | 'open_live_call' | 'dispatch_goal' | 'start_tour';
  payload?: any;
}

async function generateAlertsFromRealtimeData(): Promise<ProactiveAlert[]> {
  const alerts: ProactiveAlert[] = [];

  try {
    const salesMetrics = await fetchOmniSalesMetrics();
    if (salesMetrics.totalWonDeals > 0) {
      alerts.push({
        id: `alert-sales-${Date.now()}`,
        category: 'sales',
        icon: TrendingUp,
        color: '#ec4899',
        badge: 'Sales AI',
        title: `${salesMetrics.totalWonDeals} giao dịch mới thắng — Pipeline ${(salesMetrics.totalPipelineValueVnd / 1_000_000).toFixed(0)}M`,
        description: `Tỉ lệ chuyển đổi ${(salesMetrics.conversionRatePercent * 100).toFixed(1)}%. Doanh số đóng ${(salesMetrics.closedRevenueVnd / 1_000_000).toFixed(0)}M VND.`,
        actionLabel: 'Mở Cockpit Doanh Số',
        actionType: 'open_cockpit',
      });
    }
  } catch { /* fallback */ }

  try {
    const orchMetrics = await fetchOrchestrationMetrics();
    if (orchMetrics.successRate < 0.8 && orchMetrics.totalTasksExecuted > 0) {
      const failedCount = Math.round(orchMetrics.totalTasksExecuted * (1 - orchMetrics.successRate));
      alerts.push({
        id: `alert-orch-${Date.now()}`,
        category: 'security',
        icon: AlertTriangle,
        color: '#f43f5e',
        badge: 'Orchestrator AI',
        title: `Tỉ lệ thành công giảm — ${Math.round(orchMetrics.successRate * 100)}%`,
        description: `Có ${failedCount} tác vụ thất bại trong số ${orchMetrics.totalTasksExecuted} tác vụ gần đây. Cần kiểm tra hàng đợi.`,
        actionLabel: 'Xem Chi Tiết',
        actionType: 'open_cockpit',
      });
    } else if (orchMetrics.totalTasksExecuted > 0) {
      alerts.push({
        id: `alert-orch-ok-${Date.now()}`,
        category: 'dev',
        icon: CheckCircle2,
        color: '#10b981',
        badge: 'Orchestrator AI',
        title: `${orchMetrics.totalTasksExecuted} tác vụ hoàn thành — ${Math.round(orchMetrics.successRate * 100)}% thành công`,
        description: `Thời gian xử lý trung bình ${(orchMetrics.avgLatencyMs / 1000).toFixed(1)}s. Không có lỗi nghiêm trọng.`,
        actionLabel: 'Xem Chi Tiết',
        actionType: 'open_cockpit',
      });
    }
  } catch { /* fallback */ }

  try {
    const skillMetrics = await fetchSkillMetrics();
    if (skillMetrics.totalTokensSaved > 10000) {
      alerts.push({
        id: `alert-skill-${Date.now()}`,
        category: 'finance',
        icon: DollarSign,
        color: '#10b981',
        badge: 'Skill Compiler AI',
        title: `Tiết kiệm ${(skillMetrics.totalTokensSaved / 1000).toFixed(0)}K token — $${(skillMetrics.totalTokensSaved * 0.000002).toFixed(2)} phí API`,
        description: `Tự động hóa cục bộ giúp giảm chi phí Cloud. Cấp độ tự trị đạt ${Math.round(skillMetrics.autonomyLevelPct)}%.`,
        actionLabel: 'Xem Báo Cáo',
        actionType: 'open_cockpit',
      });
    }
  } catch { /* fallback */ }

  try {
    const nightshift = await fetchNightshiftAutopilotStatus();
    const recentSession = nightshift.history?.[0];
    if (recentSession && recentSession.tasksCompleted > 0) {
      alerts.push({
        id: `alert-night-${Date.now()}`,
        category: 'dev',
        icon: Code2,
        color: '#6366f1',
        badge: 'NightShift SWE AI',
        title: `Ca đêm hoàn tất: ${recentSession.tasksCompleted} tác vụ — Sức khỏe ${recentSession.systemHealthScore}%`,
        description: recentSession.morningHandoffBriefing?.slice(0, 100) || 'Bàn giao buổi sáng đã sẵn sàng.',
        actionLabel: 'Xem Bàn Giao',
        actionType: 'open_cockpit',
      });
    }
  } catch { /* fallback */ }

  return alerts;
}

export default function GlaciaProactiveSentinel() {
  const {
    toggleCockpit,
    openLiveVoiceCall,
    startEmbodiedTour,
    dispatchGoalToSubAgents,
    setMood,
    setSpeechBubble,
  } = useGlacia();

  const [activeAlert, setActiveAlert] = useState<ProactiveAlert | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Fetch real-time data and generate proactive alerts periodically
  useEffect(() => {
    let mounted = true;
    let lastAlertId = '';

    const tick = async () => {
      try {
        const candidates = await generateAlertsFromRealtimeData();
        if (!mounted || candidates.length === 0) return;

        // Pick an alert we haven't dismissed yet
        const fresh = candidates.filter((a) => !dismissedIds.includes(a.id));
        if (fresh.length === 0) return;

        const chosen = fresh[Math.floor(Math.random() * fresh.length)];
        if (chosen.id !== lastAlertId) {
          lastAlertId = chosen.id;
          setActiveAlert(chosen);
          glaciaAudio.playCrystalChime(1046.5);
        }
      } catch {
        // Silent fallback — no alert this cycle
      }
    };

    // Initial fetch after a short delay
    const initialTimer = setTimeout(() => void tick(), 8000);
    const interval = setInterval(tick, 60000);

    return () => {
      mounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissedIds]);

  if (!activeAlert) return null;

  const IconComp = activeAlert.icon;

  const handleActionClick = () => {
    glaciaAudio.playQuantumDispatch();
    const alert = activeAlert;
    setActiveAlert(null);
    setDismissedIds((prev) => [...prev, alert.id]);

    if (alert.actionType === 'open_cockpit') {
      toggleCockpit();
    } else if (alert.actionType === 'open_live_call') {
      openLiveVoiceCall();
    } else if (alert.actionType === 'start_tour') {
      startEmbodiedTour();
    }
  };

  const handleDismiss = () => {
    if (activeAlert) {
      setDismissedIds((prev) => [...prev, activeAlert.id]);
    }
    setActiveAlert(null);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-sm w-full p-4 rounded-3xl bg-slate-950/95 border border-cyan-400/50 backdrop-blur-2xl shadow-[0_10px_40px_rgba(6,182,212,0.3)] animate-fade-in transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-md shrink-0"
            style={{
              backgroundColor: `${activeAlert.color}22`,
              borderColor: activeAlert.color,
              color: activeAlert.color,
            }}
          >
            <IconComp className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase" style={{ color: activeAlert.color }}>
                {activeAlert.badge}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                AI PROACTIVE
              </span>
            </div>
            <h4 className="text-xs font-bold text-white line-clamp-1">{activeAlert.title}</h4>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{activeAlert.description}</p>

      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Glacia Co-Pilot Alert
        </span>

        <button
          onClick={handleActionClick}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md hover:scale-105"
          style={{
            backgroundColor: activeAlert.color,
            color: '#050b14',
            boxShadow: `0 0 15px ${activeAlert.color}66`,
          }}
        >
          <span>{activeAlert.actionLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
