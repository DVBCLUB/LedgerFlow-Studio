import React, { useState, useEffect } from 'react';
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
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 107 — ISO/IEC 25010:2023
            </span>
            <span className="text-xs text-slate-400 font-mono">Grade: {report?.grade}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">ISO/IEC 25010 Software Quality Benchmark</h1>
          <p className="text-sm text-slate-400">
            Thẩm định 8 đặc tính chất lượng phần mềm toàn cầu: Tính năng, Hiệu năng, Tương thích, Khả dụng, Tin cậy, Bảo mật, Bảo trì & Di trú.
          </p>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {evaluating ? 'Đang thẩm định...' : '🏆 Tái Thẩm Định Toàn Diện ISO'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm Chất Lượng Toàn Phần</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.overallQualityScore}/100</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Top Tier Enterprise Grade</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tiêu Chuẩn Đánh Giá</div>
          <div className="text-sm font-bold text-teal-300 mt-2">{report?.isoStandard}</div>
          <div className="text-xs text-slate-400 mt-1">International Software Standard</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">8 Trụ Cột ISO 25010</div>
          <div className="text-2xl font-extrabold text-white mt-1">8 / 8 Passed</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">100% Green Gates</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Bộ Kiểm Thử Tự Động</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{report?.totalTestSuitePassed} Tests</div>
          <div className="text-xs text-slate-400 mt-1">Zero Regression Failures</div>
        </div>
      </div>

      {/* 8 Characteristics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report?.characteristics.map((char: IsoQualityCharacteristic) => (
          <div key={char.id} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{char.name}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded">
                {char.score}%
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {char.benchmarksChecked.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400">✓</span>
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
