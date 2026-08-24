import React, { useState, useEffect } from 'react';
import { MultiFactorySchedulerOverview, FactoryGpuTask } from '../../../server/services/multiFactoryGpuSchedulerEngine';

export const MultiFactoryGpuSchedulerPanel: React.FC = () => {
  const [overview, setOverview] = useState<MultiFactorySchedulerOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [jobTitle, setJobTitle] = useState<string>('Nhiệm vụ sản sinh 3D Asset & Video Clip Hype');
  const [factory, setFactory] = useState<'Software Factory (AST & CI)' | 'Game Studio (WASM & 3D)' | 'Video Studio (AV1 & VMAF)' | 'AI Swarm Reasoning'>('Video Studio (AV1 & VMAF)');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/factory-scheduler/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch factory scheduler overview', err);
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
      const res = await fetch('/api/dormant/factory-scheduler/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryName: factory, jobTitle })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to dispatch factory workload', err);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang lập lịch tài nguyên GPU/Compute cho các phân xưởng AI...</p>
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
              PILLAR 120 — MULTI-FACTORY GPU SCHEDULER
            </span>
            <span className="text-xs text-slate-400 font-mono">GPU Utilization: {overview?.overallGpuUtilizationPercent}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Multi-Factory Production Scheduler &amp; GPU Resource Allocator</h1>
          <p className="text-sm text-slate-400">
            Điều phối tài nguyên GPU/CPU tính toán giữa 3 Xưởng sản xuất: Software Factory (AST/CI), Game Foundry (WASM/3D) và Video Studio (AV1/VMAF).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={factory}
            onChange={(e) => setFactory(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Video Studio (AV1 & VMAF)">Video Studio (AV1 &amp; VMAF)</option>
            <option value="Game Studio (WASM & 3D)">Game Studio (WASM &amp; 3D)</option>
            <option value="Software Factory (AST & CI)">Software Factory (AST &amp; CI)</option>
            <option value="AI Swarm Reasoning">AI Swarm Reasoning</option>
          </select>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {dispatching ? 'Đang điều phối...' : '⚡ Điều Phối GPU'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tỷ Lệ Tải GPU Trung Bình</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.overallGpuUtilizationPercent}%</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">CUDA / MPS Optimized</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Chi Phí Compute Dự Toán / Ngày</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">${overview?.estimatedDailyComputeCostUsd} USD</div>
          <div className="text-xs text-slate-400 mt-1">Local GPU ($0 Hardware Cost)</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tác Vụ Đang Thực Thi</div>
          <div className="text-2xl font-extrabold text-white mt-1">{overview?.totalActiveGpuTasksCount} Tác vụ</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Parallel Execution Pipelines</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Phân Xưởng Đang Hoạt Động</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{overview?.activeFactoryPipelinesCount} Xưởng</div>
          <div className="text-xs text-slate-400 mt-1">Software + Game + Video + Swarm</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {overview?.tasks.map((t: FactoryGpuTask) => (
          <div key={t.taskId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-mono rounded">{t.factoryName}</span>
                <span className="text-base font-bold text-white">{t.jobTitle}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Phần cứng: {t.assignedCompute} • Tải GPU: {t.gpuUtilizationPercent}% • Chi phí: ${t.costPerHourUsd}/h
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {t.status}
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Lên lịch: {new Date(t.queuedAt).toLocaleTimeString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiFactoryGpuSchedulerPanel;
