import React, { useEffect, useState } from 'react';
import { BrainCircuit, BookMarked, Award, RotateCcw, Sparkles, CheckCircle2, Bot } from 'lucide-react';
import { getLearningDashboard, recordTaskLearning, LearningInsight } from '../../utils/knowledgeIntegrationsApi';

export default function ContinuousLearningPanel() {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [dash, setDash] = useState<{ totalInsights: number; promotedToKB: number; avgConfidence: string; totalOccurrences: number; topAgents: string[] } | null>(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    getLearningDashboard().then((d) => {
      if (d.dashboard) setDash(d.dashboard);
      if (d.insights?.length) setInsights(d.insights);
    }).catch(() => {});
  }, []);

  const handleRecord = () => {
    setRecording(true);
    recordTaskLearning({ agentRole: 'AI CFO', topic: 'Đối soát VietQR tự động', lessonSummary: 'Tự động matching theo ref code giảm 90% thao tác thủ công', source: 'agent_run', confidence: 0.93 })
      .then((d) => { if (d.insight) setInsights((prev) => [d.insight, ...prev]); })
      .catch(() => {})
      .finally(() => setRecording(false));
  };

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BrainCircuit className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Động Cơ Học Tập Liên Tục Cho AI Agents (Continuous Learning)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Self-Evolving AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Học liên tục từ mỗi phiên chạy agent · Tự động quảng bá insight thành tri thức chính thức · Tích lũy kinh nghiệm.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {dash?.totalInsights ?? insights.length} Bài Học Tích Lũy
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Số Insights Thu Thập</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {dash?.totalInsights ?? insights.length}
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Kinh nghiệm từ các ca xử lý</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã Quảng Bá Lên Kho Tri Thức</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {dash?.promotedToKB ?? 0}
          </div>
          <p className="mt-1 text-[11px] font-medium text-blue-400">Trở thành tri thức vĩnh viễn</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Tin Cậy Trung Bình</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            {dash?.avgConfidence ?? '93.0%'}
          </div>
          <p className="mt-1 text-[11px] font-medium text-purple-400 font-mono">Điểm chất lượng bài học</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lần Tái Xuất Hiện (Occurrences)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {dash?.totalOccurrences ?? 0} Lần
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Củng cố mô hình qua thời gian</p>
        </div>
      </div>

      {/* Action Record Insight Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Ghi Nhận Bài Học Từ Lần Chạy Agent (Record Task Learning)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Agent tự đóng góp insight và kinh nghiệm sau mỗi tác vụ để củng cố ngân hàng tri thức.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRecord}
          disabled={recording}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{recording ? 'Đang ghi nhận...' : '🚀 Ghi Nhận Insight Ngay'}</span>
        </button>
      </div>

      {/* Insights List Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Sổ Nhật Ký Bài Học &amp; Insights Đã Thu Thập
            </h2>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {insights.map((ins) => (
            <div key={ins.id} className="p-4 hover:bg-slate-800/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">{ins.topic}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {ins.agentRole}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{ins.lessonSummary}</p>
              </div>

              <div className="flex items-center gap-3 text-right self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  conf {(ins.confidence * 100).toFixed(0)}%
                </span>
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  &times;{ins.occurrences} lần
                </span>
              </div>
            </div>
          ))}
          {!insights.length && (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              Chưa có bài học nào được ghi nhận.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
