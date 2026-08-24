import React, { useState, useEffect } from 'react';
import { LaunchDeployment } from '../../../server/services/autoLaunchPipelineEngine';

export const AutoLaunchPipelinePanel: React.FC = () => {
  const [launches, setLaunches] = useState<LaunchDeployment[]>([]);
  const [totalTraffic, setTotalTraffic] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [launching, setLaunching] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPrice, setNewPrice] = useState<number>(299000);

  const fetchLaunches = async () => {
    try {
      const res = await fetch('/api/dormant/auto-launch-pipeline/list');
      const data = await res.json();
      if (data.success) {
        setLaunches(data.data.launches);
        setTotalTraffic(data.data.totalTraffic);
      }
    } catch (err) {
      console.error('Failed to fetch auto launch list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunches();
  }, []);

  const handleDeploy = async () => {
    if (!newTitle.trim()) return;
    setLaunching(true);
    try {
      const res = await fetch('/api/dormant/auto-launch-pipeline/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, pricingVnd: newPrice })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        await fetchLaunches();
      }
    } catch (err) {
      console.error('Failed to deploy launch', err);
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tải trạm phóng Auto-Launch 1-Click...</p>
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
              PILLAR 103 — 1-CLICK LAUNCHPAD
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Deployments: {launches.length}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">1-Click Auto Launch Pipeline</h1>
          <p className="text-sm text-slate-400">
            Tự động xuất bản Landing Page + Tích hợp Paywall VietQR + Kích hoạt chiến dịch Social Swarm đa kênh tức thì.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Tên sản phẩm..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            placeholder="Giá VNĐ"
            value={newPrice}
            onChange={(e) => setNewPrice(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white w-28 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleDeploy}
            disabled={launching}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {launching ? 'Đang xuất bản...' : '🚀 1-Click Launch'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Sản Phẩm Đã Phóng</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{launches.length}</div>
          <div className="text-xs text-slate-400 mt-1">Active Landing Pages & Webhooks</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Lưu Lượng Truy Cập Toàn Kênh</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{totalTraffic.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">TikTok / Shorts / Reels / Telegram</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cổng Thanh Toán Tích Hợp</div>
          <div className="text-sm font-bold text-white mt-2">VietQR Dynamic + MB Bank API</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Instant Confirmation</div>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {launches.map((launch) => (
          <div key={launch.launchId} className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">{launch.title}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                    {launch.socialCampaignStatus.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  URL: <a href={launch.landingPageUrl} target="_blank" rel="noreferrer" className="text-emerald-400 underline">{launch.landingPageUrl}</a>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-amber-300">
                  {launch.pricingPlanVnd.toLocaleString()} VNĐ
                </div>
                <div className="text-xs text-slate-400">
                  {launch.totalVisitorsCount.toLocaleString()} lượt xem • CVR: {launch.conversionRatePercent}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400">Kênh Phân Phối Tự Động:</span>
              {launch.activeChannels.map((ch) => (
                <span key={ch} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded font-mono uppercase">
                  {ch}
                </span>
              ))}
              <span className="ml-auto text-slate-500 font-mono text-[11px]">
                {new Date(launch.deployedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoLaunchPipelinePanel;
