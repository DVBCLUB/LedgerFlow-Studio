import React, { useState, useEffect } from 'react';
import { PmfHeatmapOverview, PmfCohortSegment } from '../../../server/services/continuousPmfHeatmapEngine';

export const ContinuousPmfHeatmapPanel: React.FC = () => {
  const [overview, setOverview] = useState<PmfHeatmapOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalibrating, setRecalibrating] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/continuous-pmf/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch PMF heatmap overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    try {
      const res = await fetch('/api/dormant/continuous-pmf/recalibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to recalibrate PMF cohorts', err);
    } finally {
      setRecalibrating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tính toán chỉ số Sean Ellis PMF &amp; Retention Cohorts...</p>
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
              PILLAR 115 — CONTINUOUS PMF HEATMAP
            </span>
            <span className="text-xs text-slate-400 font-mono">Sean Ellis Score: {overview?.overallSeanEllisPmfPercent}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Continuous Product-Market-Fit (PMF) Heatmap</h1>
          <p className="text-sm text-slate-400">
            Đo lường mức độ không thể thiếu của sản phẩm theo chuẩn Sean Ellis (&ge;40%), vẽ đường cong giữ chân 30 ngày (Cohort Retention) và phát hiện tín hiệu tăng trưởng hữu cơ.
          </p>
        </div>

        <button
          onClick={handleRecalibrate}
          disabled={recalibrating}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {recalibrating ? 'Đang chuẩn hóa...' : '📊 Tái Chuẩn Hóa Khảo Sát PMF'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm PMF Sean Ellis</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.overallSeanEllisPmfPercent}%</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Chuẩn Quốc Tế &ge; 40.0%</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Đánh Giá Trạng Thái PMF</div>
          <div className="text-sm font-bold text-teal-300 mt-2">Strong Viral PMF</div>
          <div className="text-xs text-slate-400 mt-1">Viral Organic Growth</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Mẫu Khảo Sát Người Dùng</div>
          <div className="text-2xl font-extrabold text-white mt-1">{overview?.totalSurveyResponses.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Active Power Users</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tỷ Lệ Giữ Chân 30 Ngày (D30)</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{overview?.averageCohort30DayRetentionPercent}%</div>
          <div className="text-xs text-slate-400 mt-1">Sticky Enterprise Adoption</div>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overview?.segments.map((seg: PmfCohortSegment, idx: number) => (
          <div key={idx} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-4">
            <div>
              <span className="text-xs font-mono text-slate-400">Phân khúc {idx + 1} ({seg.totalUsersSampled} users)</span>
              <h3 className="text-base font-bold text-white mt-1">{seg.segmentName}</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">Rất thất vọng nếu thiếu</span>
                <span className="font-bold text-emerald-400">{seg.veryDisappointedPercent}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${seg.veryDisappointedPercent}%` }}></div>
              </div>

              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Hơi thất vọng: {seg.somewhatDisappointedPercent}%</span>
                <span>Không thất vọng: {seg.notDisappointedPercent}%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Giữ chân D30: <strong className="text-white">{seg.day30RetentionPercent}%</strong></span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-semibold rounded">{seg.pmfStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinuousPmfHeatmapPanel;
