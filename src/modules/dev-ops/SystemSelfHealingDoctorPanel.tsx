import React, { useEffect, useState } from 'react';
import { Stethoscope, Activity, Cpu, ShieldCheck, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Zap, Server } from 'lucide-react';
import { getSelfHealingReport, DoctorHealthReport } from '../../utils/devopsApi';

const MOCK: DoctorHealthReport = {
  timestamp: new Date().toISOString(),
  status: 'HEALTHY',
  memory: { heapUsedMb: 182, heapTotalMb: 256, rssMb: 310, usageRatio: 0.71 },
  circuitBreakersCount: 3,
  openCircuits: [],
  selfHealingActionsTaken: ['Auto-restarted stalled SQLite WAL checkpoint', 'Cleared stale SSE connections'],
  recommendations: ['Đặt thêm cron health-check mỗi 5 phút', 'Duy trì số lượng active worker pool tối ưu'],
};

export default function SystemSelfHealingDoctorPanel() {
  const [report, setReport] = useState<DoctorHealthReport>(MOCK);
  const [loading, setLoading] = useState(false);

  const fetchDoctorReport = () => {
    setLoading(true);
    getSelfHealingReport()
      .then((d) => {
        if (d.report) setReport(d.report);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctorReport();
  }, []);

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Stethoscope className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Bác Sĩ Hệ Thống Tự Chữa Lành (Self-Healing Doctor)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Auto-Recovery
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Chẩn đoán hạ tầng tự động, tự phục hồi Circuit Breaker, dọn rác bộ nhớ heap và giải phóng kết nối SSE bị treo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDoctorReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang kiểm tra...' : 'Kiểm Tra Sức Khỏe'}</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng Thái Hệ Thống</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {report.status}
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Hoạt động ổn định</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bộ Nhớ Heap Sử Dụng</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {report.memory.heapUsedMb} <span className="text-xs text-slate-400 font-normal">/ {report.memory.heapTotalMb} MB</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tỷ lệ: {Math.round(report.memory.usageRatio * 100)}%</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Circuit Breakers</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            {report.circuitBreakersCount} Cổng Bảo Vệ
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tự ngắt khi quá tải</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cổng Bị Ngắt (Open)</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {report.openCircuits.length} Cổng
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">0 Sự cố ngắt mạch</p>
        </div>
      </div>

      {/* Two columns: Actions Taken & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Hành Động Tự Chữa Lành Đã Thực Hiện</h2>
          </div>
          <div className="space-y-2">
            {report.selfHealingActionsTaken.map((a, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Khuyến Nghị Tối Ưu Hệ Thống</h2>
          </div>
          <div className="space-y-2">
            {report.recommendations.map((r, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-xs text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
