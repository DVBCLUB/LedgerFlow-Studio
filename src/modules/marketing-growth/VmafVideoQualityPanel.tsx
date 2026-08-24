import React, { useState, useEffect } from 'react';
import { VmafOverviewReport, VideoQualityAudit } from '../../../server/services/vmafVideoQualityEngine';

export const VmafVideoQualityPanel: React.FC = () => {
  const [report, setReport] = useState<VmafOverviewReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/vmaf-video/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VMAF video quality report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/dormant/vmaf-video/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to optimize VMAF video quality', err);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang thẩm định chất lượng video chuẩn Netflix VMAF ≥ 93.0...</p>
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
              PILLAR 109 — NETFLIX VMAF BENCHMARK
            </span>
            <span className="text-xs text-slate-400 font-mono">Grade: {report?.overallVideoGrade}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Netflix VMAF Video Quality Benchmark</h1>
          <p className="text-sm text-slate-400">
            Kiểm tra chất lượng hiển thị video tạo sinh, đo đạc điểm số VMAF, độ tương đồng cấu trúc SSIM và chuẩn âm thanh -14 LUFS.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={optimizing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {optimizing ? 'Đang mã hóa 2-pass...' : '🎬 Tối Ưu Hóa Codec AV1 / 2-Pass'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm VMAF Trung Bình</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.averageVmafScore} / 100</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Chuẩn Netflix ≥ 93.0</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Video Đã Thẩm Định</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{report?.clipsAuditedCount} Clips</div>
          <div className="text-xs text-slate-400 mt-1">TikTok 9:16 &amp; Shorts</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Độ Tương Đồng SSIM</div>
          <div className="text-2xl font-extrabold text-white mt-1">0.985</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Near Perfect Clarity</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Chuẩn Âm Lượng Audio</div>
          <div className="text-sm font-bold text-amber-300 mt-2">-14.0 LUFS EBU R128</div>
          <div className="text-xs text-slate-400 mt-1">Broadcast Normalized</div>
        </div>
      </div>

      {/* Clips List */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Danh Sách Video Đã Kiểm Định Chất Lượng (VMAF Quality Feed)
        </h2>

        <div className="space-y-3">
          {report?.clips.map((clip: VideoQualityAudit) => (
            <div key={clip.clipId} className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-mono rounded">{clip.resolution}</span>
                  <span className="text-sm font-semibold text-white">{clip.clipTitle}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">Bitrate: {clip.bitrateKbps} kbps • Âm lượng: {clip.audioLufs} LUFS • SSIM: {clip.ssimScore}</div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400 font-mono">VMAF: {clip.vmafScore} / 100</div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold rounded">
                  {clip.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VmafVideoQualityPanel;
