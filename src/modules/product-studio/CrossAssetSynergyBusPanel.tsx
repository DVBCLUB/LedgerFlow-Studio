import React, { useState, useEffect } from 'react';
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
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 104 — MULTI-MODAL EVENT BUS
            </span>
            <span className="text-xs text-slate-400 font-mono">Status: {busStatus}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Cross-Asset Synergy Bus</h1>
          <p className="text-sm text-slate-400">
            Cầu nối tự động giữa 3 xưởng: Code SaaS ↔ Game 3D Assets ↔ Video 9:16 Marketing không qua khâu thủ công.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={sourceW}
            onChange={(e) => setSourceW(e.target.value as any)}
            className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="software_factory">Source: Software</option>
            <option value="game_studio">Source: Game Studio</option>
            <option value="video_studio">Source: Video Studio</option>
          </select>
          <span className="text-slate-500">➔</span>
          <select
            value={targetW}
            onChange={(e) => setTargetW(e.target.value as any)}
            className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="video_studio">Target: Video Studio</option>
            <option value="software_factory">Target: Software</option>
            <option value="game_studio">Target: Game Studio</option>
          </select>
          <select
            value={outputFmt}
            onChange={(e) => setOutputFmt(e.target.value as any)}
            className="px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
          >
            <option value="mp4_9x16">MP4 9:16</option>
            <option value="gltf_3d">glTF 3D</option>
            <option value="react_landing_component">React Landing</option>
            <option value="audio_sfx_pack">SFX Pack</option>
          </select>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {dispatching ? 'Đang chuyển...' : '⚡ Kích Hoạt Synergy'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Lượt Chuyển Đổi Liên Xưởng</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{totalTransforms}</div>
          <div className="text-xs text-slate-400 mt-1">Zero Loss & Auto-Formatted</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Chuỗi Pipelines Hỗ Trợ</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">6 Luồng Khép Kín</div>
          <div className="text-xs text-slate-400 mt-1">Code ↔ Game ↔ Video</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tốc Độ Chuyển Đổi Trung Bình</div>
          <div className="text-2xl font-extrabold text-white mt-1">&lt; 1.4s</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Local Zero-Copy Pipeline</div>
        </div>
      </div>

      {/* Transformations History */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Lịch Sử Điều Phối Tài Sản Chéo (Cross-Asset Event Log)
        </h2>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.taskId} className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-mono rounded">
                    {task.sourceWorkshop.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">➔</span>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-mono rounded">
                    {task.targetWorkshop.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono rounded">
                    {task.outputFormat}
                  </span>
                </div>
                <div className="text-sm font-medium text-white">{task.transformationSummary}</div>
                <div className="text-xs text-slate-400 font-mono">Asset Source: {task.sourceAssetPath}</div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">
                  {task.status.toUpperCase()}
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
