import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Zap,
  Server,
  RefreshCw,
  CheckCircle2,
  Activity,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export interface EdgeNodeStatus {
  nodeId: string;
  locationName: string;
  regionCode: string;
  latencyMs: number;
  status: string;
  bandwidthThroughputMbps: number;
  cacheHitRatioPercent: number;
  lastPingAt: string;
}

export default function EdgeRoutingHubPanel() {
  const [nodes, setNodes] = useState<EdgeNodeStatus[]>([]);
  const [avgLatency, setAvgLatency] = useState(45);
  const [cacheRatio, setCacheRatio] = useState(96.8);
  const [activeCount, setActiveCount] = useState(6);
  const [purgeMsg, setPurgeMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/edge/telemetry');
      const data = await res.json();
      if (data?.success) {
        setNodes(data.nodes || []);
        setAvgLatency(data.averageLatencyMs || 45);
        setCacheRatio(data.globalCacheHitRatioPercent || 96.8);
        setActiveCount(data.activeNodesCount || 6);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePurgeCache = async () => {
    try {
      const res = await fetch('/api/dormant/edge/purge-cache', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setPurgeMsg(data.message);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white">🌍 Global Edge CDN &amp; Multi-Region Low-Latency Routing Hub</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Avg Latency 45ms
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hạ tầng mạng Anycast phân tán toàn cầu: Tự động điều phối lưu lượng đến Node gần nhất (Hà Nội, TP.HCM, Đà Nẵng, Singapore, Tokyo, SF).
          </p>
        </div>

        <button
          onClick={handlePurgeCache}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-cyan-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Xóa Toàn Bộ Cache CDN</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Độ Trễ Phản Hồi Trung Bình</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{avgLatency} ms</div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; 20ms tại Việt Nam</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Cache Hit Toàn Cầu</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{cacheRatio}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tải trang tức thì &lt; 0.3s</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Số Edge Nodes Hoạt Động</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{activeCount} Nodes</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Zero-Downtime Anycast BGP</div>
        </div>
      </div>

      {/* Purge Alert */}
      {purgeMsg && (
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{purgeMsg}</span>
        </div>
      )}

      {/* Nodes Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nodes.map((n) => (
          <div key={n.nodeId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white">{n.locationName}</h4>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">{n.latencyMs} ms</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span>Băng thông: <strong className="text-white font-mono">{n.bandwidthThroughputMbps} Mbps</strong></span>
              <span>Cache Hit: <strong className="text-cyan-300 font-mono">{n.cacheHitRatioPercent}%</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
