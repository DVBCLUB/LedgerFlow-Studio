/**
 * GlaciaStrategySimulationHUD.tsx
 * ============================================================
 * GLACIA MONTE CARLO STRATEGY & BUSINESS SIMULATION HUD
 * ------------------------------------------------------------
 * Interactive executive simulation cockpit:
 *  - 4 Business Model Presets
 *  - Real-time Parameter Sliders
 *  - Stochastic Distribution (P10, P50, P90)
 *  - Spoken Voice Executive Synthesis
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Sliders, Play, Sparkles, Volume2, ShieldCheck,
  ShieldAlert, RefreshCw, BarChart3, DollarSign, Activity,
  CheckCircle2, AlertTriangle, ArrowRight, Zap, Target,
} from 'lucide-react';
import {
  fetchSimulationPresets,
  runStrategySimulation,
  type SimulationParams,
  type SimulationResult,
  type SimulationPreset,
} from '../../utils/glaciaSimulationApi';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';

export default function GlaciaStrategySimulationHUD() {
  const { speak, triggerReaction } = useGlacia();
  const [presets, setPresets] = useState<SimulationPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ai_swarm_dominance');
  const [params, setParams] = useState<SimulationParams>({
    monthlyRevenueBase: 18000,
    monthlyGrowthRatePct: 14,
    monthlyOperatingExpense: 6000,
    cacUsd: 180,
    arpuMonthlyUsd: 119,
    monthlyChurnRatePct: 2.0,
    currentCashReserveUsd: 120000,
    aiStaffEfficiencyMultiplier: 4.0,
    simulationHorizonMonths: 24,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const loadedPresets = await fetchSimulationPresets();
        setPresets(loadedPresets);
        const defaultPreset = loadedPresets.find((p) => p.id === 'ai_swarm_dominance') || loadedPresets[0];
        if (defaultPreset) {
          setParams(defaultPreset.params);
          setSelectedPresetId(defaultPreset.id);
          const simRes = await runStrategySimulation(defaultPreset.params);
          setResult(simRes);
        }
      } catch (err) {
        console.error('Failed to init simulation:', err);
      }
    }
    init();
  }, []);

  const handleSelectPreset = (preset: SimulationPreset) => {
    setSelectedPresetId(preset.id);
    setParams(preset.params);
    glaciaAudio.playCrystalChime(1046.5);
  };

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRunning) return;

    setIsRunning(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();

    try {
      const res = await runStrategySimulation(params);
      setResult(res);

      if (res.summary.riskLevel === 'critical' || res.summary.riskLevel === 'high') {
        triggerReaction('alert');
      } else {
        triggerReaction('sparkle');
      }
    } catch (err: any) {
      console.error('Simulation run failed:', err);
      triggerReaction('sad');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePlaySpokenAdvice = () => {
    if (!result) return;
    setIsPlayingAudio(true);
    glaciaAudio.playCrystalChime(1318.5);
    speak(result.glaciaStrategicAdvice.spokenSummary, 'celebrating');
    setTimeout(() => setIsPlayingAudio(false), 7000);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <TrendingUp className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Mô Phỏng Chiến Lược Kinh Doanh (Monte Carlo)
              </h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                1,000 Iterations
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Mô phỏng ngẫu nhiên đa biến để dự phóng Dòng tiền, Runway và ARR 24 tháng dưới đòn bẩy AI Satellites
            </p>
          </div>
        </div>

        {result && (
          <button
            type="button"
            onClick={handlePlaySpokenAdvice}
            disabled={isPlayingAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-amber-400' : ''}`} />
            <span>{isPlayingAudio ? 'Đang đọc...' : 'Nghe Glacia Khuyên'}</span>
          </button>
        )}
      </div>

      {/* Preset Archetypes */}
      <div className="space-y-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          Chọn Kịch Bản Mẫu Của Doanh Nghiệp (Presets):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedPresetId === p.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <h4 className="text-xs font-black text-white truncate">{p.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders & Run Button */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-white uppercase">Điều Chỉnh Biến Số Chiến Lược</span>
          </div>
          <button
            type="button"
            onClick={() => handleRunSimulation()}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Đang chạy 1,000 mô phỏng...' : 'Chạy Mô Phỏng Lại'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Revenue Base */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Doanh thu tháng gốc (MRR)</span>
              <span className="text-cyan-300 font-mono font-bold">${params.monthlyRevenueBase.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="100000"
              step="1000"
              value={params.monthlyRevenueBase}
              onChange={(e) => setParams({ ...params, monthlyRevenueBase: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Growth Rate */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Tăng trưởng hàng tháng (%)</span>
              <span className="text-emerald-300 font-mono font-bold">+{params.monthlyGrowthRatePct}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={params.monthlyGrowthRatePct}
              onChange={(e) => setParams({ ...params, monthlyGrowthRatePct: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Monthly OPEX */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Chi phí vận hành (OPEX)</span>
              <span className="text-amber-300 font-mono font-bold">${params.monthlyOperatingExpense.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={params.monthlyOperatingExpense}
              onChange={(e) => setParams({ ...params, monthlyOperatingExpense: Number(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* CAC */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Chi phí mua khách hàng (CAC)</span>
              <span className="text-rose-300 font-mono font-bold">${params.cacUsd}</span>
            </div>
            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={params.cacUsd}
              onChange={(e) => setParams({ ...params, cacUsd: Number(e.target.value) })}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* ARPU */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Giá trị trung bình/tháng (ARPU)</span>
              <span className="text-purple-300 font-mono font-bold">${params.arpuMonthlyUsd}/khách</span>
            </div>
            <input
              type="range"
              min="19"
              max="500"
              step="10"
              value={params.arpuMonthlyUsd}
              onChange={(e) => setParams({ ...params, arpuMonthlyUsd: Number(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* AI Staff Multiplier */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Đòn bẩy AI Staff ($0 Labor)</span>
              <span className="text-cyan-300 font-mono font-bold">x{params.aiStaffEfficiencyMultiplier} Hiệu quả</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={params.aiStaffEfficiencyMultiplier}
              onChange={(e) => setParams({ ...params, aiStaffEfficiencyMultiplier: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Simulation Result Dashboard */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Xác Suất Sống Sót 24M</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-black text-emerald-400 font-mono">{result.summary.survivalProbability24M}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Dự Phóng ARR 24 Tháng</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-lg font-black text-cyan-400 font-mono">
                  ${result.summary.projectedArr24M.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ LTV / CAC</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-lg font-black text-purple-400 font-mono">{result.summary.ltvCacRatio}x</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Mức Độ Rủi Ro</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-lg font-black text-amber-400 font-mono uppercase">{result.summary.riskLevel}</span>
              </div>
            </div>
          </div>

          {/* Glacia Strategic Synthesis */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 border border-indigo-500/30 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-black">
              <Sparkles className="w-4 h-4" />
              <span>Nhận Định Chiến Lược Từ Glacia:</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">{result.glaciaStrategicAdvice.verdict}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">🌟 Điểm Mạnh Nổi Bật:</span>
                {result.glaciaStrategicAdvice.strengths.map((s, i) => (
                  <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400">✓</span> {s}
                  </p>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase">🎯 3 Hành Động Tối Ưu:</span>
                {result.glaciaStrategicAdvice.top3Actions.map((a, i) => (
                  <p key={i} className="text-[11px] text-slate-300 font-mono leading-relaxed">
                    {a}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
