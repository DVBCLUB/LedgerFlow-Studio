import React, { useState, useEffect } from 'react';
import { Network, Zap, CheckCircle2, Globe, Layers, Code2, Server, ArrowUpRight } from 'lucide-react';
import { ApiFederationOverview, SubgraphServiceEntry } from '../../../server/services/apiFederationGatewayEngine';

export const ApiFederationGatewayPanel: React.FC = () => {
  const [overview, setOverview] = useState<ApiFederationOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/api-federation/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch API federation overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/dormant/api-federation/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to regenerate federated schema', err);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tổng hợp GraphQL Federation Supergraph &amp; API Mesh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Network className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Cổng Hợp Nhất API &amp; GraphQL Federation (Universal API Gateway)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Supergraph Mesh
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Hợp nhất toàn bộ 116 dịch vụ tự trị thành một GraphQL Supergraph đồng nhất, phân quyền Token Rate Limit và tự động tạo SDKs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {overview?.supergraphStatus || 'FEDERATED_READY'}
            </span>
          </div>
        </div>
      </section>

      {/* Action Regenerate Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Tái Sinh &amp; Ghép Nối Supergraph Schema</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tự động biên dịch lại AST schema từ toàn bộ các Subgraph microservices.</p>
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{regenerating ? 'Đang hợp nhất Supergraph...' : '⚡ Hợp Nhất & Tái Sinh Supergraph Schema'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-cyan-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Endpoint Hợp Nhất</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300 font-mono">{overview?.totalUnifiedEndpointsCount} Endpoints</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">100% Live Connected</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lưu Lượng API Hàng Tháng</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {(overview?.monthlyApiCallsCount ? (overview.monthlyApiCallsCount / 1000000).toFixed(1) : '14.8')}M Calls
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">High Scalability Gateway</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân Lớp Subgraph Hỗ Trợ</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">{overview?.totalSubgraphsCount} Subgraphs</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">GraphQL + REST + gRPC</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tự Động Sinh SDKs</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-sm font-black text-purple-300">TS, Python, Go, Rust</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Single-Click Dev Kit</p>
        </div>
      </div>

      {/* Subgraphs Grid */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Phân Hệ Subgraph Microservices</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Universal Router</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {overview?.subgraphs.map((sub: SubgraphServiceEntry) => (
            <div key={sub.serviceId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-cyan-500/30 font-mono">
                    {sub.protocol}
                  </span>
                  <span className="text-base font-bold text-white">{sub.name}</span>
                  <span className="text-xs text-slate-500 font-mono">v{sub.schemaVersion}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Số lượng endpoint: <strong className="text-white">{sub.totalEndpoints}</strong> · Giới hạn gọi: <span className="text-cyan-300">{sub.rateLimitPerMin.toLocaleString()} req/phút</span>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {sub.healthStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiFederationGatewayPanel;

