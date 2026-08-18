import React, { useState } from 'react';
import {
  AlertOctagon,
  Bot,
  CheckCircle2,
  Coins,
  DollarSign,
  Lock,
  LockOpen,
  PieChart,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AgentTokenBudget {
  role: string;
  name: string;
  usedUsd: number;
  limitUsd: number;
  tokenCount: number;
  provider: string;
}

const INITIAL_BUDGETS: AgentTokenBudget[] = [
  {
    role: 'AI CMO Agent',
    name: 'Growth & Video Director',
    usedUsd: 14.2,
    limitUsd: 50.0,
    tokenCount: 1420000,
    provider: 'OpenAI GPT-4o / Groq',
  },
  {
    role: 'AI Developer',
    name: 'Autonomous SweAgent',
    usedUsd: 48.5,
    limitUsd: 120.0,
    tokenCount: 4850000,
    provider: 'Claude 3.5 Sonnet / OpenRouter',
  },
  {
    role: 'AI CFO Agent',
    name: 'VAS Accounting Auditor',
    usedUsd: 8.1,
    limitUsd: 30.0,
    tokenCount: 810000,
    provider: 'Gemini 2.0 Flash (Free Tier)',
  },
  {
    role: 'AI DOM Robot',
    name: 'OpenClaw Web Operator',
    usedUsd: 22.0,
    limitUsd: 60.0,
    tokenCount: 2200000,
    provider: 'DeepSeek R1 / Local Ollama',
  },
];

export default function AITokenBudgetController() {
  const [budgets, setBudgets] = useState<AgentTokenBudget[]>(INITIAL_BUDGETS);
  const [autoSafeguardEnabled, setAutoSafeguardEnabled] = useState(true);
  const [globalMaxBudgetUsd, setGlobalMaxBudgetUsd] = useState(300);

  const totalSpentUsd = budgets.reduce((acc, b) => acc + b.usedUsd, 0);
  const totalLimitUsd = budgets.reduce((acc, b) => acc + b.limitUsd, 0);
  const totalTokens = budgets.reduce((acc, b) => acc + b.tokenCount, 0);

  const updateLimit = (role: string, newLimit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.role === role ? { ...b, limitUsd: Math.max(10, newLimit) } : b)),
    );
  };

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl text-left space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <Coins className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">AI Token Budget & Unit Economics Controller</h3>
              <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-500/20">
                Scale AI Governance
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Kiểm soát hạn mức ngân sách gọi API của từng AI Staff, ngăn ngừa bùng nổ chi phí token ngoài ý muốn.
            </p>
          </div>
        </div>

        {/* Global Auto-Safeguard Toggle */}
        <button
          onClick={() => setAutoSafeguardEnabled(!autoSafeguardEnabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
            autoSafeguardEnabled
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {autoSafeguardEnabled ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          <span>Auto-Safeguard 90%: {autoSafeguardEnabled ? 'ĐÃ BẬT' : 'TẮT'}</span>
        </button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Tổng Chi Phí AI Tháng Này</span>
          <div className="text-xl font-black text-white font-mono mt-1">
            ${totalSpentUsd.toFixed(2)} <span className="text-xs text-slate-500 font-sans">/ ${totalLimitUsd.toFixed(0)}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalSpentUsd / totalLimitUsd) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Tổng Token Đã Sử Dụng</span>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">
            {(totalTokens / 1000000).toFixed(2)}M Tokens
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Tự động ưu tiên mô hình Free/Local khi khả thi.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[10px] font-black uppercase text-slate-400">Trạng Thái Khóa An Toàn</span>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-extrabold text-white">An Toàn Chi Phí (100%)</span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Tự động chuyển Ollama khi hết hạn mức API.</p>
        </div>
      </div>

      {/* Agent Budget Rows */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Hạn Mức Ngân Sách Theo AI Staff Role</h4>
        <div className="space-y-2">
          {budgets.map((b) => {
            const pct = Math.min(100, Math.round((b.usedUsd / b.limitUsd) * 100));
            return (
              <div
                key={b.role}
                className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition"
              >
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold text-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{b.role}</span>
                      <span className="text-[10px] font-semibold text-slate-500">({b.name})</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Provider: {b.provider}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px] flex-1">
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                      <span>${b.usedUsd.toFixed(2)} đã dùng</span>
                      <span>{pct}% hạn mức</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 80 ? 'bg-amber-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Hạn mức $</span>
                  <input
                    type="number"
                    value={b.limitUsd}
                    onChange={(e) => updateLimit(b.role, parseFloat(e.target.value) || 10)}
                    className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-black text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
