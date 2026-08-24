import React, { useState, useEffect } from 'react';
import { EdgeRoutingOverview, EdgeNodeLocation } from '../../../server/services/edgeComputeRoutingEngine';

export const EdgeComputeRoutingPanel: React.FC = () => {
  const [overview, setOverview] = useState<EdgeRoutingOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/edge-compute/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch edge compute routing overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/dormant/edge-compute/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to optimize edge compute routing', err);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang đo đạc độ trễ các trạm Edge Compute toàn cầu...</p>
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
              PILLAR 113 — EDGE COMPUTE &amp; ANYCAST MESH
            </span>
            <span className="text-xs text-slate-400 font-mono">Global Avg Latency: {overview?.globalAverageLatencyMs}ms</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Dynamic Load Balancer &amp; Edge Compute</h1>
          <p className="text-sm text-slate-400">
            Định tuyến thông minh theo vị trí địa lý, tự động cân bằng tải trên các điểm Edge toàn cầu và tối ưu độ trễ dưới 25ms.
          </p>
        </div>

        <button
          onClick={handleOptimize}
          disabled={optimizing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {optimizing ? 'Đang tối ưu...' : '🌐 Tối Ưu Hóa Tuyến Anycast & Edge Cache'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Độ Trễ Trung Bình Toàn Cầu</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.globalAverageLatencyMs} ms</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">&lt; 15ms tại Việt Nam</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Lưu Lượng Edge Xử Lý</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {overview?.totalEdgeThroughputRps.toLocaleString()} RPS
          </div>
          <div className="text-xs text-slate-400 mt-1">Requests Per Second</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tỷ Lệ Cache Hit Toàn Cầu</div>
          <div className="text-2xl font-extrabold text-white mt-1">{overview?.globalCacheHitRatioPercent}%</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Ultra Fast Edge Serving</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Trạm Edge Hoạt Động</div>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{overview?.totalActiveEdgeNodes} Nodes</div>
          <div className="text-xs text-slate-400 mt-1">100% Healthy Mesh</div>
        </div>
      </div>

      {/* Nodes List */}
      <div className="space-y-4">
        {overview?.nodes.map((n: EdgeNodeLocation) => (
          <div key={n.nodeId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded">{n.region}</span>
                <span className="text-base font-bold text-white">{n.city}</span>
                <span className="text-xs text-slate-400 font-mono">({n.nodeId})</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Lưu lượng: {n.requestsPerSec.toLocaleString()} RPS • Cache Hit: {n.cacheHitRatioPercent}% • Workers: {n.activeWorkers} luồng
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-extrabold text-emerald-400 font-mono">{n.latencyMs} ms</div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded uppercase">
                {n.healthStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EdgeComputeRoutingPanel;
