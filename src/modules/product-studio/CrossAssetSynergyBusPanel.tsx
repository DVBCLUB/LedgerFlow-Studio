import React, { useState, useEffect } from 'react';
import { Network, Zap, CheckCircle2, ArrowRight, Layers, FileCode, Video, Gamepad2 } from 'lucide-react';
import { SynergyTransformationTask } from '../../../server/services/crossAssetSynergyBusEngine';

export const CrossAssetSynergyBusPanel: React.FC = () => {
  const [tasks, setTasks] = useState<SynergyTransformationTask[]>([]);
  const [busStatus, setBusStatus] = useState<string>('');
  const [totalTransforms, setTotalTransforms] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [sourceW, setSourceW] = useState<'software_factory' | 'game_studio' | 'video_studio'>('game_studio');
  const [targetW, setTargetW] = useState<'software_factory' | 'game_studio' | 'video_studio'>('video_studio');
  const [outputFmt, setOutputFmt] = useState<'mp4_9x16' | 'gltf_3d' | 'react_landing_component' | 'audio_sfx_pack'>('mp4_9x16');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/cross-asset-synergy/overview');
      const data = await res.json();
      if (data.success) {
        setTasks(data.data.tasks);
        setBusStatus(data.data.activeBusStatus);
        setTotalTransforms(data.data.totalCrossTransformations);
      }
    } catch (err) {
      console.error('Failed to fetch cross asset synergy overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await fetch('/api/dormant/cross-asset-synergy/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWorkshop: sourceW,
          targetWorkshop: targetW,
          sourceAssetPath: 'pipeline/assets/active_bundle.raw',
          outputFormat: outputFmt
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to dispatch cross asset transformation', err);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối Xe Buýt Liên Thông Tài Sản Chéo (Cross-Asset Synergy Bus)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Network className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Xe Buýt Liên Thông Tài Sản Đa Chiều (Cross-Asset Synergy Bus)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Zero-Copy Bus
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Cầu nối tự động giữa 3 xưởng: Code SaaS ↔ Game 3D Assets ↔ Video 9:16 Marketing không qua khâu thủ công.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {busStatus || 'ACTIVE'}
            </span>
          </div>
        </div>
      </section>

      {/* Action Dispatch Cross-Transformation */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Nguồn:</span>
            <select
              value={sourceW}
              onChange={(e) => setSourceW(e.target.value as any)}
              className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="software_factory">Software Factory</option>
              <option value="game_studio">Game Studio 3D</option>
              <option value="video_studio">Video Studio</option>
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-teal-400 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Đích:</span>
            <select
              value={targetW}
              onChange={(e) => setTargetW(e.target.value as any)}
              className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="video_studio">Video Studio 9:16</option>
              <option value="software_factory">Software Factory</option>
              <option value="game_studio">Game Studio 3D</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Định Dạng:</span>
            <select
              value={outputFmt}
              onChange={(e) => setOutputFmt(e.target.value as any)}
              className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500"
            >
              <option value="mp4_9x16">MP4 9:16 (Shorts/TikTok)</option>
              <option value="gltf_3d">glTF 3D Binary</option>
              <option value="react_landing_component">React Landing Component</option>
              <option value="audio_sfx_pack">SFX Pack High-Res</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDispatch}
          disabled={dispatching}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{dispatching ? 'Đang Chuyển...' : '⚡ Kích Hoạt Synergy Ngay'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Chuyển Đổi Liên Xưởng</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {totalTransforms} Lượt
          </div>
          <p className="mt-1 text-[11px] font-medium text-teal-400/90 font-mono">Zero Loss &amp; Auto-Formatted</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chuỗi Pipelines Hỗ Trợ</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            6 Luồng Khép Kín
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400">Code ↔ Game ↔ Video</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tốc Độ Chuyển Đổi TB</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">
            &lt; 1.4s
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400 font-mono">Local Zero-Copy Pipeline</p>
        </div>
      </div>

      {/* Transformations History */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-black text-white">Lịch Sử Điều Phối Tài Sản Chéo (Cross-Asset Event Log)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Real-Time Event Stream</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {tasks.map((task) => (
            <div key={task.taskId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-lg uppercase">
                    {task.sourceWorkshop.replace('_', ' ')}
                  </span>
                  <span className="text-teal-400 font-bold text-xs">➔</span>
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-lg uppercase">
                    {task.targetWorkshop.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-mono rounded-lg">
                    {task.outputFormat}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{task.transformationSummary}</div>
                <div className="text-xs text-slate-400 font-mono">Asset Source: {task.sourceAssetPath}</div>
              </div>

              <div className="text-left md:text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {task.status}
                </span>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  {new Date(task.createdAt).toLocaleTimeString('vi-VN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrossAssetSynergyBusPanel;

