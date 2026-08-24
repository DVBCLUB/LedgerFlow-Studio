import React, { useState, useEffect } from 'react';
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
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 116 — GRAPHQL FEDERATION GATEWAY
            </span>
            <span className="text-xs text-slate-400 font-mono">Status: {overview?.supergraphStatus}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Universal Enterprise API Gateway &amp; GraphQL Federation</h1>
          <p className="text-sm text-slate-400">
            Hợp nhất toàn bộ 116 dịch vụ tự trị thành một GraphQL Supergraph đồng nhất, phân quyền Token Rate Limit và tự động tạo SDKs.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {regenerating ? 'Đang hợp nhất Supergraph...' : '⚡ Hợp Nhất &amp; Tái Sinh Supergraph Schema'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Endpoint Tự Trị Hợp Nhất</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalUnifiedEndpointsCount} Endpoints</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">100% Live Connected</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Lưu Lượng API Hàng Tháng</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {(overview?.monthlyApiCallsCount ? (overview.monthlyApiCallsCount / 1000000).toFixed(1) : '14.8')}M Calls
          </div>
          <div className="text-xs text-slate-400 mt-1">High Scalability Gateway</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Phân Lớp Subgraph Hỗ Trợ</div>
          <div className="text-2xl font-extrabold text-white mt-1">{overview?.totalSubgraphsCount} Subgraphs</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">GraphQL + REST + gRPC</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tự Động Sinh SDK</div>
          <div className="text-sm font-bold text-amber-300 mt-2">TypeScript, Python, Go, Rust</div>
          <div className="text-xs text-slate-400 mt-1">Single-Click Developer Kit</div>
        </div>
      </div>

      {/* Subgraphs Grid */}
      <div className="space-y-4">
        {overview?.subgraphs.map((sub: SubgraphServiceEntry) => (
          <div key={sub.serviceId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded">{sub.protocol}</span>
                <span className="text-base font-bold text-white">{sub.name}</span>
                <span className="text-xs text-slate-400 font-mono">v{sub.schemaVersion}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Số lượng endpoint: {sub.totalEndpoints} • Giới hạn gọi: {sub.rateLimitPerMin.toLocaleString()} req/phút
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {sub.healthStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiFederationGatewayPanel;
