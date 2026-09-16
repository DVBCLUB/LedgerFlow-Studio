import React, { useState, useEffect } from 'react';
import { Rocket, Globe, DollarSign, Activity, CheckCircle2, QrCode, Sparkles, Send } from 'lucide-react';
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
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Rocket className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Trạm Phóng Sản Phẩm Tự Động 1 Chạm (1-Click Auto Launch)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Launchpad AI
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Xuất bản Landing Page + Tích hợp Paywall VietQR + Kích hoạt chiến dịch Social Swarm đa kênh tức thì.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {launches.length} Sản Phẩm Trực Tuyến
            </span>
          </div>
        </div>
      </section>

      {/* Action 1-Click Launch Input */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input
          type="text"
          placeholder="Nhập tên sản phẩm mới (VD: Khóa Học AI Kế Toán Doanh Nghiệp)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <div className="relative">
          <input
            type="number"
            placeholder="Giá VNĐ"
            value={newPrice}
            onChange={(e) => setNewPrice(Number(e.target.value))}
            className="w-36 pl-8 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        </div>
        <button
          type="button"
          onClick={handleDeploy}
          disabled={launching || !newTitle.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>{launching ? 'Đang Xuất Bản...' : '🚀 Phóng Sản Phẩm 1-Click'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Sản Phẩm Đã Phóng</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300 font-mono">
            {launches.length} Landing Pages
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400/90 font-mono">Paywall &amp; Webhook kết nối sẵn</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lưu Lượng Toàn Kênh</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {totalTraffic.toLocaleString()} Lượt Xem
          </div>
          <p className="mt-1 text-[11px] font-medium text-teal-400">TikTok, Shorts, Reels, Telegram</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cổng Thanh Toán Tích Hợp</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            VietQR Pro
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Khớp đối soát tự động tức thì</p>
        </div>
      </div>

      {/* Deployments List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Danh Sách Chiến Dịch Đã Phóng (Live Deployments)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Omnichannel Engine</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {launches.map((launch) => (
            <div key={launch.launchId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">{launch.title}</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {launch.socialCampaignStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    URL: <a href={launch.landingPageUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{launch.landingPageUrl}</a>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-sm font-black text-emerald-400 font-mono">
                    {launch.pricingPlanVnd.toLocaleString()} VNĐ
                  </div>
                  <div className="text-xs text-slate-400">
                    {launch.totalVisitorsCount.toLocaleString()} lượt xem · CVR: <strong className="text-emerald-300 font-mono">{launch.conversionRatePercent}%</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400 font-medium">Kênh Đang Phát:</span>
                {launch.activeChannels.map((ch) => (
                  <span key={ch} className="px-2.5 py-0.5 bg-slate-950/80 text-slate-300 border border-slate-800 rounded-lg font-mono uppercase text-[10px]">
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
    </div>
  );
};

export default AutoLaunchPipelinePanel;

