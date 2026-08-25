import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, Gauge, TrendingUp, Bot, Factory } from 'lucide-react';
import { getWeeklyExecutiveReport, type WeeklyExecutiveReport } from '../../utils/businessInsightsApi';

function fmtVND(n: number) { return '₫' + (n / 1_000_000).toFixed(1) + 'M'; }

export default function WeeklyExecutiveReportPanel() {
  const [report, setReport] = useState<WeeklyExecutiveReport | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    getWeeklyExecutiveReport().then(setReport).catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return <p className="text-xs text-rose-300 text-left">{error}</p>;
  }
  if (!report) {
    return <p className="text-xs text-slate-500 text-left">Đang tạo báo cáo tuần...</p>;
  }

  const healthTone = report.overallHealthScore >= 80 ? 'text-emerald-300' : report.overallHealthScore >= 60 ? 'text-amber-300' : 'text-rose-300';

  return (
    <div className="space-y-4 text-left text-white">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> {report.reportingPeriod}</h3>
        <button onClick={load} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
      </div>

      <p className="text-xs text-slate-400 italic">{report.executiveSummary}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Gauge className="w-3 h-3" /> Sức khỏe</p>
          <p className={`text-lg font-black mt-1 ${healthTone}`}>{report.overallHealthScore}/100</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Doanh thu</p>
          <p className="text-sm font-black mt-1 text-cyan-300">{fmtVND(report.financialMetrics.totalRevenueAttributedVnd)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Bot className="w-3 h-3" /> AI ROI</p>
          <p className="text-sm font-black mt-1 text-violet-300">{(report.aiWorkforceROI.blendedROI * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tài chính</p>
          {[
            ['Expansion ARR', fmtVND(report.financialMetrics.expansionArrVnd)],
            ['NRR', report.financialMetrics.nrrRatePercent + '%'],
            ['Giao dịch đối soát', String(report.financialMetrics.reconciledTransactionsCount)],
            ['Chênh lệch', String(report.financialMetrics.discrepanciesCount)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">{k}</span><span className="font-bold text-slate-200">{v}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">AI Workforce</p>
          {[
            ['Chi phí AI', fmtVND(report.aiWorkforceROI.totalAiCostVnd)],
            ['Giá trị tạo ra', fmtVND(report.aiWorkforceROI.totalValueGeneratedVnd)],
            ['Giờ người tiết kiệm', String(report.aiWorkforceROI.humanHoursSaved)],
            ['FTE tương đương', report.aiWorkforceROI.fteEquivalence.toFixed(1)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-400">{k}</span><span className="font-bold text-slate-200">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {report.factoryPerformance.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1"><Factory className="w-3 h-3" /> Factory Performance</p>
          {report.factoryPerformance.map((f) => (
            <div key={f.factoryName} className="flex justify-between text-xs py-1 border-b border-slate-800/60">
              <span className="text-slate-300">{f.factoryName}</span>
              <span className="text-slate-400">{f.outputCount} output · {fmtVND(f.attributedRevenueVnd)} · ROI {(f.roi * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {report.departmentHealth.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sức khỏe phòng ban</p>
          <div className="flex flex-wrap gap-2">
            {report.departmentHealth.map((d) => (
              <span key={d.name} className={`text-[11px] px-2 py-1 rounded-full ${d.status === 'healthy' || d.status === 'good' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                {d.name}: {d.score}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
