import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  Activity,
  Play,
  RefreshCw,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react';
import {
  fetchShiftStatus,
  triggerNightShiftRun,
  type GlaciaShiftOverview,
  type ShiftExecutionLog,
} from '../../utils/glaciaShiftApi';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';

export default function GlaciaSwarmShiftPanel() {
  const { triggerReaction, speak } = useGlacia();

  const [shiftData, setShiftData] = useState<GlaciaShiftOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRunningNightCycle, setIsRunningNightCycle] = useState(false);
  const [lastCycleResult, setLastCycleResult] = useState<ShiftExecutionLog | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchShiftStatus();
      setShiftData(data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    const interval = setInterval(() => {
      void loadStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRunNightCycle = async () => {
    setIsRunningNightCycle(true);
    triggerReaction('thinking');
    try {
      const log = await triggerNightShiftRun();
      setLastCycleResult(log);
      glaciaAudio.playLevelUpFanfare();
      triggerReaction('sparkle');
      speak('Glacia đã hoàn thành xuất sắc chu trình ca đêm tự trị và gửi báo cáo về Telegram của Giám đốc!', 'celebrating');
      void loadStatus();
    } catch (err: any) {
      triggerReaction('sad');
    } finally {
      setIsRunningNightCycle(false);
    }
  };

  const isDay = shiftData?.currentShift === 'day_interactive';

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Shift Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              isDay
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/20'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-indigo-500/20'
            }`}
          >
            {isDay ? <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '20s' }} /> : <Moon className="w-6 h-6 animate-pulse" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                {shiftData?.shiftLabel || 'Chu Kỳ Vận Hành Tự Trị 24/7'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                ● LIVE RUNNING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Đổi ca tiếp theo: <span className="text-cyan-300 font-mono font-bold">{shiftData?.nextShiftChange}</span> · Sức khỏe Bầy đàn:{' '}
              <span className="text-emerald-400 font-bold">{shiftData?.swarmHealthPct || 99.4}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunNightCycle}
            disabled={isRunningNightCycle}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunningNightCycle ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isRunningNightCycle ? 'Đang Chạy Ca Đêm...' : '⚡ Kích Hoạt Ca Đêm Tự Trị (1-Click)'}</span>
          </button>
        </div>
      </div>

      {/* 5 AI Staff Satellites Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-cyan-400" /> Đội Ngũ 5 AI Staff Vệ Tinh (Dưới Quyền Chỉ Huy Glacia)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Đồng bộ thời gian thực qua Agent Event Bus</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(shiftData?.agents || []).map((agent) => (
            <div
              key={agent.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    {agent.id.replace('ai-', '').toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{agent.name}</h4>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">{agent.role}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-300">
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 break-words [overflow-wrap:anywhere]">
                <span className="text-[9px] text-cyan-400 font-bold uppercase block mb-0.5">Nhiệm vụ hiện tại:</span>
                {agent.currentTask}
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-900">
                <span>Ca: {agent.shift === 'day_interactive' ? '☀️ Ngày' : '🌙 Đêm'}</span>
                <span className="text-emerald-400">✓ Hoạt động liên tục 24/7</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Log & Telegram Confirmation */}
      {lastCycleResult && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Kết Quả Chu Trình Ca Đêm Tự Trị
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {lastCycleResult.telegramPushed ? '📲 Đã Bắn Báo Cáo Telegram' : 'Local Logged'}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-bold bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/20">
            {lastCycleResult.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {lastCycleResult.executedTasks.map((t, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">{t.taskName}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ {t.durationMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
