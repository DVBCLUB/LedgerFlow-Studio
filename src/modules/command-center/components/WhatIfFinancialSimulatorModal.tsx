import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Bot,
  Cpu,
  Zap,
  ShieldCheck,
  Coins,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  LineChart as LineChartIcon,
  Sliders,
  DollarSign,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';

interface WhatIfFinancialSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const USD_VND = 25400;

function fmtVnd(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + ' tỷ đ';
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + ' tr đ';
  }
  return num.toLocaleString('vi-VN') + ' đ';
}

function fmtUsd(num: number): string {
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function WhatIfFinancialSimulatorModal({ isOpen, onClose }: WhatIfFinancialSimulatorModalProps) {
  // Scenario Tuners
  const [initialCashVnd, setInitialCashVnd] = useState<number>(250_000_000); // 250 triệu đ khởi điểm
  const [baseMrrVnd, setBaseMrrVnd] = useState<number>(87_900_000); // 87.9 tr đ MRR hiện tại
  const [mrrGrowthRatePct, setMrrGrowthRatePct] = useState<number>(12); // +12%/tháng
  const [aiRobotCount, setAiRobotCount] = useState<number>(8); // 8 AI Agents / Swarm Robots
  const [platformConnectorsCostUsd, setPlatformConnectorsCostUsd] = useState<number>(85); // $85/tháng (Cloud, APIs, Webhooks)
  const [modelTieringOffloadPct, setModelTieringOffloadPct] = useState<number>(75); // 75% chạy Flash/Groq/Ollama
  const [simulationMonths, setSimulationMonths] = useState<number>(12); // 12 tháng

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculations
  const simulationResults = useMemo(() => {
    // Chi phí 1 AI Agent chạy 24/7: ~$40/tháng nếu 100% Flagship, giảm xuống ~$12/tháng khi dùng Tiering 75%
    const baseAgentCostUsd = 45;
    const effectiveAgentCostUsd = baseAgentCostUsd * (1 - (modelTieringOffloadPct / 100) * 0.75);
    const totalMonthlyAiCostUsd = aiRobotCount * effectiveAgentCostUsd;
    const totalMonthlyOpExUsd = totalMonthlyAiCostUsd + platformConnectorsCostUsd;
    const totalMonthlyOpExVnd = Math.round(totalMonthlyOpExUsd * USD_VND);

    // Đòn bẩy quy đổi sang nhân sự truyền thống: Mỗi AI Agent đảm nhận ~2.5 FTE
    const equivalentHumanStaff = +(aiRobotCount * 2.5).toFixed(1);
    const avgHumanSalaryMonthlyVnd = 20_000_000; // 20tr/người/tháng
    const equivalentHumanLaborCostVnd = Math.round(equivalentHumanStaff * avgHumanSalaryMonthlyVnd);
    const monthlyNetSavingsVsHumanVnd = Math.max(0, equivalentHumanLaborCostVnd - totalMonthlyOpExVnd);
    const leverageMultiplier = totalMonthlyOpExVnd > 0 ? +(equivalentHumanLaborCostVnd / totalMonthlyOpExVnd).toFixed(1) : 40;

    // Simulation Path Generation (P10, P50, P90)
    let curCashP10 = initialCashVnd;
    let curCashP50 = initialCashVnd;
    let curCashP90 = initialCashVnd;

    let curMrrP10 = baseMrrVnd;
    let curMrrP50 = baseMrrVnd;
    let curMrrP90 = baseMrrVnd;

    const chartData = [];
    let cashCrunchMonth: number | null = null;

    for (let m = 1; m <= simulationMonths; m++) {
      // Monthly Growth Rates
      const growthP50 = mrrGrowthRatePct / 100;
      const growthP10 = (mrrGrowthRatePct * 0.4) / 100; // Bear case
      const growthP90 = (mrrGrowthRatePct * 1.6) / 100; // Bull case

      curMrrP10 = Math.round(curMrrP10 * (1 + growthP10));
      curMrrP50 = Math.round(curMrrP50 * (1 + growthP50));
      curMrrP90 = Math.round(curMrrP90 * (1 + growthP90));

      const netCashP10 = curMrrP10 - totalMonthlyOpExVnd;
      const netCashP50 = curMrrP50 - totalMonthlyOpExVnd;
      const netCashP90 = curMrrP90 - totalMonthlyOpExVnd;

      curCashP10 += netCashP10;
      curCashP50 += netCashP50;
      curCashP90 += netCashP90;

      if (curCashP10 < 0 && cashCrunchMonth === null) {
        cashCrunchMonth = m;
      }

      chartData.push({
        month: `T+${m}`,
        p10: Math.round(curCashP10 / 1_000_000), // Triệu VNĐ
        p50: Math.round(curCashP50 / 1_000_000),
        p90: Math.round(curCashP90 / 1_000_000),
        mrr: Math.round(curMrrP50 / 1_000_000),
        opEx: Math.round(totalMonthlyOpExVnd / 1_000_000),
      });
    }

    const isCashFlowPositive = baseMrrVnd >= totalMonthlyOpExVnd;
    const runwayMonths = isCashFlowPositive
      ? 'Vô cực (Dòng tiền dương)'
      : totalMonthlyOpExVnd > baseMrrVnd
      ? `${(initialCashVnd / (totalMonthlyOpExVnd - baseMrrVnd)).toFixed(1)} tháng`
      : 'Vô hạn';

    return {
      totalMonthlyAiCostUsd: +totalMonthlyAiCostUsd.toFixed(1),
      totalMonthlyOpExUsd: +totalMonthlyOpExUsd.toFixed(1),
      totalMonthlyOpExVnd,
      equivalentHumanStaff,
      equivalentHumanLaborCostVnd,
      monthlyNetSavingsVsHumanVnd,
      leverageMultiplier,
      runwayMonths,
      cashCrunchMonth,
      isCashFlowPositive,
      chartData,
      finalP50CashVnd: curCashP50,
      finalP90CashVnd: curCashP90,
      finalP50MrrVnd: curMrrP50,
    };
  }, [initialCashVnd, baseMrrVnd, mrrGrowthRatePct, aiRobotCount, platformConnectorsCostUsd, modelTieringOffloadPct, simulationMonths]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-slate-950 p-5 sm:p-7 shadow-2xl text-left space-y-6 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  🔮 What-If Financial Runway &amp; AI Monte Carlo Simulator
                </h3>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black text-cyan-300 border border-cyan-500/30">
                  100% AI Autonomous Studio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mô phỏng sức chịu tải tài chính, điểm rơi dòng tiền và đòn bẩy vận hành khi mở rộng AI Swarm Robots &amp; Nền tảng liên kết.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Core Simulated KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Runway Dự phóng</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {simulationResults.runwayMonths}
            </span>
            <span className="text-[9px] text-slate-500 block">
              {simulationResults.isCashFlowPositive ? '✓ Tự sinh lợi nhuận' : 'Cần kiểm soát burn rate'}
            </span>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Đòn bẩy Nhân sự AI</span>
            <span className="text-base font-black text-cyan-300 font-mono">
              ⚡ ~{simulationResults.equivalentHumanStaff} Chuyên viên
            </span>
            <span className="text-[9px] text-slate-500 block">
              Tiết kiệm: +{fmtVnd(simulationResults.monthlyNetSavingsVsHumanVnd)}/tháng
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/15 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Chi phí Vận hành (OpEx)</span>
            <span className="text-base font-black text-indigo-300 font-mono">
              ${simulationResults.totalMonthlyOpExUsd} <span className="text-[10px] text-slate-400">({fmtVnd(simulationResults.totalMonthlyOpExVnd)}/th)</span>
            </span>
            <span className="text-[9px] text-slate-500 block">
              Gồm {aiRobotCount} Robots + Nền tảng SaaS
            </span>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Số dư quỹ sau {simulationMonths} tháng</span>
            <span className="text-base font-black text-purple-300 font-mono">
              {fmtVnd(simulationResults.finalP50CashVnd)}
            </span>
            <span className="text-[9px] text-slate-500 block">
              (Kịch bản Bull P90: {fmtVnd(simulationResults.finalP90CashVnd)})
            </span>
          </div>
        </div>

        {/* 2 Columns: Sliders Tuner (Left) & Monte Carlo Chart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Scenario Sliders (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-cyan-400" /> Bảng Điều Khiển Kịch Bản
              </span>
              <button
                type="button"
                onClick={() => {
                  setMrrGrowthRatePct(12);
                  setAiRobotCount(8);
                  setPlatformConnectorsCostUsd(85);
                  setModelTieringOffloadPct(75);
                  setSimulationMonths(12);
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Slider 1: Tăng trưởng MRR */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Tăng trưởng MRR hàng tháng:</span>
                <span className="text-cyan-300 font-mono">+{mrrGrowthRatePct}% / tháng</span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                step="1"
                value={mrrGrowthRatePct}
                onChange={(e) => setMrrGrowthRatePct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>-10% (Suy giảm)</span>
                <span>+12% (Kỳ vọng)</span>
                <span>+50% (Viral)</span>
              </div>
            </div>

            {/* Slider 2: Quy mô AI Swarm Agents */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Quy mô AI Robots chạy 24/7:</span>
                <span className="text-emerald-300 font-mono">🤖 {aiRobotCount} Agents</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={aiRobotCount}
                onChange={(e) => setAiRobotCount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>2 (Tối giản)</span>
                <span>8 (Tiêu chuẩn)</span>
                <span>50 (Swarm)</span>
              </div>
            </div>

            {/* Slider 3: Tỷ lệ Model Tiering / Local LLM */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Tỷ lệ Model Giá Rẻ / Local Ollama:</span>
                <span className="text-violet-300 font-mono">⚡ {modelTieringOffloadPct}% Offload</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={modelTieringOffloadPct}
                onChange={(e) => setModelTieringOffloadPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>10% (Chủ yếu Sonnet/o3)</span>
                <span>75% (Cân bằng)</span>
                <span>95% (Siêu tiết kiệm)</span>
              </div>
            </div>

            {/* Slider 4: Chi phí Nền tảng Liên kết Connectors */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Chi phí Nền tảng &amp; Connectors:</span>
                <span className="text-amber-300 font-mono">${platformConnectorsCostUsd} / tháng</span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="10"
                value={platformConnectorsCostUsd}
                onChange={(e) => setPlatformConnectorsCostUsd(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>$20 (Cơ bản)</span>
                <span>$85 (Đầy đủ GitHub/VietQR)</span>
                <span>$500 (Enterprise)</span>
              </div>
            </div>

            {/* Simulation Months Tabs */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">Khung thời gian:</span>
              <div className="flex items-center gap-1.5">
                {[6, 12, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSimulationMonths(m)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      simulationMonths === m
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m} Tháng
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Monte Carlo Line / Area Chart (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-white uppercase flex items-center gap-1.5">
                  <LineChartIcon className="h-4 w-4 text-emerald-400" /> Quỹ đạo Dòng tiền Ngân quỹ (Triệu VNĐ)
                </span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> P50 Kỳ vọng
                  </span>
                  <span className="flex items-center gap-1 text-purple-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-purple-400" /> P90 Bull
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-slate-500" /> P10 Bear
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simulationResults.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`${Number(val || 0).toLocaleString('vi-VN')} tr đ`, '']}
                    />
                    <Area type="monotone" dataKey="p90" fill="#a855f7" fillOpacity={0.1} stroke="#a855f7" strokeWidth={1.5} strokeDasharray="3 3" name="P90 Bứt phá" />
                    <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="P50 Kỳ vọng" />
                    <Line type="monotone" dataKey="p10" stroke="#64748b" strokeWidth={1.5} strokeDasharray="2 2" name="P10 Thận trọng" />
                    <Line type="monotone" dataKey="mrr" stroke="#06b6d4" strokeWidth={1.5} name="Doanh thu MRR" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Prescriptive Strategic Recommendations */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase text-[10px]">
                <Bot className="h-3.5 w-3.5 text-cyan-400" /> Khuyến nghị từ AI Virtual CFO:
              </div>
              <p className="text-slate-300">
                {simulationResults.isCashFlowPositive
                  ? `🚀 Mô hình tự sinh lời với biên lợi nhuận ròng > 92%. Bạn có thể an tâm tăng quy mô AI Robots lên 15-20 agents để mở rộng thêm sản phẩm mà không lo rủi ro cạn tiền.`
                  : `⚠️ Chi phí vận hành đang vượt MRR ban đầu. Khuyến nghị duy trì tỷ lệ Model Tiering trên 75% để giữ Runway an toàn trên ${simulationResults.runwayMonths}.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
