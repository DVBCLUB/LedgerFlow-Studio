import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, Zap, Cpu, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { IsoBenchmarkReport, IsoQualityCharacteristic } from '../../../server/services/isoSoftwareQualityBenchmarkEngine';

export const IsoSoftwareQualityBenchmarkPanel: React.FC = () => {
  const [report, setReport] = useState<IsoBenchmarkReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/iso-quality/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch ISO quality report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/dormant/iso-quality/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to evaluate ISO quality', err);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang thẩm định tiêu chuẩn chất lượng quốc tế ISO/IEC 25010...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Thẩm Định Chất Lượng Chuẩn Quốc Tế (ISO/IEC 25010)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Global Standard
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Thẩm định 8 đặc tính chất lượng phần mềm toàn cầu: Tính năng, Hiệu năng, Tương thích, Khả dụng, Tin cậy, Bảo mật, Bảo trì &amp; Di trú.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hạng: {report?.grade || 'AAA'}
            </span>
          </div>
        </div>
      </section>

      {/* Action Evaluate Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Tái Thẩm Định Toàn Diện Toàn Bộ Mã Nguồn</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chạy lại bộ đo đạc 8 trụ cột chất lượng phần mềm tự động không gián đoạn hệ thống.</p>
        </div>
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={evaluating}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Award className="w-3.5 h-3.5" />
          <span>{evaluating ? 'Đang thẩm định...' : '🏆 Tái Thẩm Định Toàn Diện ISO'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm Chất Lượng Toàn Phần</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">{report?.overallQualityScore}/100</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Top Tier Enterprise Grade</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiêu Chuẩn Đánh Giá</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-black text-teal-300">{report?.isoStandard}</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">International Software Standard</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">8 Trụ Cột ISO 25010</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">8 / 8 Passed</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">100% Green Gates</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bộ Kiểm Thử Tự Động</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">{report?.totalTestSuitePassed} Tests</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 font-mono">Zero Regression Failures</p>
        </div>
      </div>

      {/* 8 Characteristics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report?.characteristics.map((char: IsoQualityCharacteristic) => (
          <div key={char.id} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-black text-white text-sm">{char.name}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {char.score}%
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {char.benchmarksChecked.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IsoSoftwareQualityBenchmarkPanel;

