import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  GitBranch,
  Network,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface StrategicDecision {
  id: string;
  title: string;
  category: string;
  revenueImpact: string;
  churnImpact: string;
  aiWorkloadImpact: string;
  confidenceScore: number;
  rippleNodes: string[];
}

const DECISIONS: StrategicDecision[] = [
  {
    id: 'dec-1',
    title: 'Tăng giá Gói SaaS Enterprise Pro (+20%)',
    category: 'Giá & LTV',
    revenueImpact: '+18.5% (+$42,000/tháng)',
    churnImpact: '-2.1% (Khách nhạy cảm giá)',
    aiWorkloadImpact: 'Tự động kích hoạt AI CSKH giữ chân',
    confidenceScore: 94,
    rippleNodes: ['Sales CRM Phễu LTV', 'Kế toán VAS Dòng tiền', 'AI CSKH Staff'],
  },
  {
    id: 'dec-2',
    title: 'Kích hoạt 10 Robot DOM Vision Cạo Lead Tự Động',
    category: 'Tăng trưởng AI',
    revenueImpact: '+35.0% Số Lead mới/tuần',
    churnImpact: '0% (Không ảnh hưởng)',
    aiWorkloadImpact: '+12,000 Token API/ngày',
    confidenceScore: 89,
    rippleNodes: ['OpenClaw Web Robot', 'Marketing Phễu AI', 'AI Token Budget'],
  },
  {
    id: 'dec-3',
    title: 'Tự động hóa 100% Khớp nối VietQR Ngân hàng',
    category: 'Vận hành Tài chính',
    revenueImpact: 'Giảm 95% thời gian chờ đối soát',
    churnImpact: '+5% Điểm NPS hài lòng',
    aiWorkloadImpact: 'Tự chạy ngầm 24/7 (0.01s latency)',
    confidenceScore: 98,
    rippleNodes: ['VietQR Bank Bridge', 'Sổ cái VAS 200/133', 'CEO Overview'],
  },
];

export default function DecisionImpactGraph() {
  const [selectedDecisionId, setSelectedDecisionId] = useState(DECISIONS[0].id);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedSuccess, setExecutedSuccess] = useState(false);

  const currentDecision = DECISIONS.find((d) => d.id === selectedDecisionId) || DECISIONS[0];

  const handleExecute = () => {
    setIsExecuting(true);
    setExecutedSuccess(false);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutedSuccess(true);
      setTimeout(() => setExecutedSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl text-left space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Network className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Enterprise Decision & Ontology Graph</h3>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/20">
                Palantir-Engine
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Mô phỏng đồ thị tác động đa chiều (Doanh thu, Churn, Tải AI) trước khi CEO thực thi quyết định chiến lược.
            </p>
          </div>
        </div>

        {/* Decision Select Selector */}
        <div className="flex items-center gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDecisionId(d.id);
                setExecutedSuccess(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDecisionId === d.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {d.category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Decision Graph Simulation View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Card: Core Decision Node */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nút Quyết định Cốt lõi</span>
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Brain className="h-3 w-3" /> {currentDecision.confidenceScore}% Độ tin cậy AI
            </span>
          </div>

          <h4 className="text-sm font-black text-white">{currentDecision.title}</h4>

          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400">Các mắt xích bị tác động (Ripple Nodes):</span>
            <div className="flex flex-wrap gap-1.5">
              {currentDecision.rippleNodes.map((node) => (
                <span
                  key={node}
                  className="rounded-lg bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 text-[10px] font-bold text-indigo-300 flex items-center gap-1"
                >
                  <GitBranch className="h-3 w-3 text-indigo-400" /> {node}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg ${
              executedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            {isExecuting ? (
              <span className="animate-pulse">Đang mô phỏng & thực thi đồ thị...</span>
            ) : executedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Đã thực thi & đồng bộ toàn hệ thống!
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" /> Bấm Thực Thi Quyết Định Trên Đồ Thị
              </>
            )}
          </button>
        </div>

        {/* Middle & Right: Impact Matrix Cards */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          {/* Card 1: Revenue */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-black uppercase">Tác động Doanh thu</span>
            </div>
            <div className="text-base font-black text-white">{currentDecision.revenueImpact}</div>
            <p className="text-[11px] font-medium text-slate-400">Dự báo tự động khớp nối vào Sổ cái Tài chính VAS.</p>
          </div>

          {/* Card 2: Churn */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs font-black uppercase">Rủi ro Rời bỏ (Churn)</span>
            </div>
            <div className="text-base font-black text-white">{currentDecision.churnImpact}</div>
            <p className="text-[11px] font-medium text-slate-400">AI tự phân tích và kích hoạt kịch bản giảm thiểu rủi ro.</p>
          </div>

          {/* Card 3: AI Workload */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-violet-400">
              <Bot className="h-4 w-4" />
              <span className="text-xs font-black uppercase">Tải Đội Ngũ AI</span>
            </div>
            <div className="text-base font-black text-white">{currentDecision.aiWorkloadImpact}</div>
            <p className="text-[11px] font-medium text-slate-400">Tự động cân bằng token và điều phối Swarm Agent.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
