import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  Brain,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Bot,
  Layers,
} from 'lucide-react';

export interface HarvestedInsight {
  id: string;
  sourceTask: string;
  sourceAgent: string;
  category: string;
  title: string;
  distilledLesson: string;
  actionableRules: string[];
  confidenceScore: number;
  status: 'pending_review' | 'auto_approved' | 'rejected';
  harvestedAt: string;
  targetKnowledgeId?: string;
}

export default function AutoHarvestedInsightsPanel() {
  const [insights, setInsights] = useState<HarvestedInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/dormant/knowledge/harvested');
      const data = await res.json();
      if (data?.success && data?.insights) {
        setInsights(data.insights);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleTriggerBatch = async () => {
    setLoading(true);
    try {
      await fetch('/api/dormant/knowledge/harvest-batch', { method: 'POST' });
      await fetchInsights();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/dormant/knowledge/approve-harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchInsights();
    } catch {
      // ignore
    }
  };

  const autoApprovedCount = insights.filter((i) => i.status === 'auto_approved').length;
  const pendingCount = insights.filter((i) => i.status === 'pending_review').length;

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">🧠 Agentic Knowledge Auto-Harvesting (Self-Learning)</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              RAG Ingest 100% Tự Động
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            AI tự động trích xuất bài học kinh nghiệm và quy tắc vận hành mới sau mỗi mission hoàn thành, tự nạp vào Thư viện Tri thức.
          </p>
        </div>

        <button
          onClick={handleTriggerBatch}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang thu hoạch...' : '⚡ Kích hoạt Quét Tri Thức Tự Động'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[11px] text-slate-400">Tổng tri thức đã thu hoạch</div>
          <div className="text-lg font-black text-white mt-0.5">{insights.length} Bài học</div>
          <div className="text-[10px] text-indigo-400 mt-1">Được tổng hợp từ 5 khối AI Swarm</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[11px] text-emerald-300">Đã nạp thẳng vào RAG Corpus</div>
          <div className="text-lg font-black text-emerald-400 mt-0.5">{autoApprovedCount} Mục (Auto-Approved)</div>
          <div className="text-[10px] text-emerald-300/80 mt-1">Độ tin cậy ≥ 90%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="text-[11px] text-amber-300">Chờ Founder / Lead xem xét</div>
          <div className="text-lg font-black text-amber-400 mt-0.5">{pendingCount} Mục (HITL Queue)</div>
          <div className="text-[10px] text-amber-300/80 mt-1">Cần phê duyệt để đưa vào RAG</div>
        </div>
      </div>

      {/* Harvested Insights Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dòng Tri Thức Tự Học Gần Nhất</h3>

        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-xl bg-white/4 hover:bg-white/6 border border-white/8 transition space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{insight.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-slate-300">
                    {insight.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  <span>Agent nguồn: <strong className="text-slate-200">{insight.sourceAgent}</strong></span>
                  <span>•</span>
                  <span>Tác vụ: <em className="text-slate-300">{insight.sourceTask}</em></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Confidence: {Math.round(insight.confidenceScore * 100)}%
                </span>
                {insight.status === 'auto_approved' ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đã nạp RAG</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleApprove(insight.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white cursor-pointer"
                  >
                    <span>Duyệt nạp RAG</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Distilled Content */}
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
              <p className="text-slate-200 leading-relaxed">{insight.distilledLesson}</p>

              {insight.actionableRules && insight.actionableRules.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quy tắc thực thi chuẩn (SOP Rules):</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                    {insight.actionableRules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
