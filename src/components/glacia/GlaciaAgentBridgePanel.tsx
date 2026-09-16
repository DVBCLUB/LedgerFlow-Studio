import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Activity,
  CheckCircle2,
  Clock,
  Play,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { useAIWorkforce } from '../../context/AIWorkforceContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { glaciaModuleBridge } from './glaciaModuleBridge';

export default function GlaciaAgentBridgePanel() {
  const { subAgents, dispatchedTasks, dispatchGoalToSubAgents, setIsOpen } = useGlacia();
  const { snapshot, swarmPlans, runSwarm } = useAIWorkforce();
  const [quickGoal, setQuickGoal] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGoal.trim() || isDispatching) return;
    setIsDispatching(true);
    glaciaAudio.playCrystalChime(1046.5);

    try {
      // 1. Dispatch through Glacia sub-agent planner
      dispatchGoalToSubAgents(quickGoal);

      // 2. Also trigger backend swarm if connected
      if (runSwarm) {
        await runSwarm(quickGoal).catch(() => {});
      }
      setQuickGoal('');
    } catch {
      // Silently handle error
    } finally {
      setIsDispatching(false);
    }
  };

  const handleOpenAdmin = () => {
    glaciaModuleBridge.navigateTo('ai_nhan_su');
    setIsOpen(false);
  };

  // Status mapping
  const activeSwarmCount = swarmPlans.filter((p) => p.status === 'executing' || p.status === 'planning').length;
  const healthScore = snapshot?.readinessScore ?? 98;

  return (
    <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-3 shadow-lg">
      {/* Fleet Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>ĐỘI NGŨ 5 AI STAFF</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {healthScore}% Ready
          </span>
          <button
            type="button"
            onClick={handleOpenAdmin}
            className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Mở bảng điều khiển AI Nhân Sự chuyên sâu"
          >
            <span>Admin</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Agents Roster Strip / Compact Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {subAgents.map((agent) => {
          const isBusy = dispatchedTasks.some(
            (t) => t.agentName === agent.name && (t.status === 'running' || t.status === 'dispatched')
          );
          return (
            <div
              key={agent.id}
              className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                isBusy
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850'
              }`}
              title={`${agent.name} (${agent.role}): ${agent.specialty}`}
            >
              <span className="text-lg shrink-0">{agent.avatarEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-200 truncate">{agent.name}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isBusy ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <span className="text-[8px] text-slate-400 truncate block max-w-[70px]">
                  {isBusy ? '⚡ Đang xử lý' : agent.role}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Goal Dispatch Input */}
      <form onSubmit={handleQuickDispatch} className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={quickGoal}
            onChange={(e) => setQuickGoal(e.target.value)}
            placeholder="Giao việc cho Đội AI... (VD: Rà soát chi phí quý 3)"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 pr-8 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!quickGoal.trim() || isDispatching}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              quickGoal.trim() && !isDispatching
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-sm cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Giao việc ngay"
          >
            {isDispatching ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>

      {/* Recent Dispatched Activity / Active Swarms */}
      {dispatchedTasks.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Nhiệm vụ gần đây ({dispatchedTasks.length})
            </span>
            {activeSwarmCount > 0 && (
              <span className="text-cyan-300 font-mono animate-pulse">{activeSwarmCount} swarm active</span>
            )}
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {dispatchedTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[10px] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="font-bold text-cyan-300 shrink-0">{task.agentName}:</span>
                  <span className="text-slate-300 truncate">{task.title}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-mono shrink-0 font-bold ${
                    task.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                  }`}
                >
                  {task.status === 'completed' ? '✓ Xong' : 'Đang chạy'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

