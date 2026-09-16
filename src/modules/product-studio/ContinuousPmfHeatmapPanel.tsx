import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, Sparkles, RefreshCw, BarChart3, ShieldCheck, Activity, Award } from 'lucide-react';
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
      <div className="p-12 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold">Đang tính toán chỉ số Sean Ellis PMF &amp; Retention Cohorts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Target className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Bản Đồ Phù Hợp Thị Trường (Continuous PMF)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sean Ellis &ge; 40%
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Đo lường mức độ không thể thiếu của sản phẩm theo chuẩn Sean Ellis, theo dõi Cohort Retention 30 ngày và phát hiện tín hiệu tăng trưởng hữu cơ.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecalibrate}
            disabled={recalibrating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalibrating ? 'animate-spin' : ''}`} />
            <span>{recalibrating ? 'Đang chuẩn hóa...' : 'Tái Chuẩn Hóa Khảo Sát PMF'}</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Điểm PMF Sean Ellis</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {overview?.overallSeanEllisPmfPercent}%
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Chuẩn Quốc Tế &ge; 40.0%</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng Thái PMF</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-teal-200">
            Strong Viral PMF
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Tăng trưởng Viral Organic</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mẫu Khảo Sát Người Dùng</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300 font-mono">
            {overview?.totalSurveyResponses.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Active Power Users</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 to-amber-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giữ Chân 30 Ngày (D30)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {overview?.averageCohort30DayRetentionPercent}%
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Độ gắn kết Enterprise cao</p>
        </div>
      </div>

      {/* Segments Grid */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Phân Khúc Khách Hàng & Sức Mạnh PMF Từng Nhóm</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{overview?.segments.length || 0} Phân khúc</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overview?.segments.map((seg: PmfCohortSegment, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Nhóm {idx + 1} ({seg.totalUsersSampled} users)</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{seg.segmentName}</h3>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-lg">
                  {seg.pmfStatus}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400 font-medium">Rất thất vọng nếu thiếu:</span>
                  <span className="font-bold font-mono text-emerald-300">{seg.veryDisappointedPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${seg.veryDisappointedPercent}%` }} />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Hơi thất vọng: <strong className="text-slate-300">{seg.somewhatDisappointedPercent}%</strong></span>
                  <span>Không thất vọng: <strong className="text-slate-300">{seg.notDisappointedPercent}%</strong></span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Tỷ lệ giữ chân D30:</span>
                <strong className="text-emerald-400 font-mono">{seg.day30RetentionPercent}%</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContinuousPmfHeatmapPanel;
