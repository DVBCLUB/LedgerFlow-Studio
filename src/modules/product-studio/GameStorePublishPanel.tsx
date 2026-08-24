import React, { useState, useEffect } from 'react';
import { GameStoreOverview, GameStorePackage } from '../../../server/services/gameStorePublishEngine';

export const GameStorePublishPanel: React.FC = () => {
  const [overview, setOverview] = useState<GameStoreOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deploying, setDeploying] = useState<boolean>(false);
  const [gameTitle, setGameTitle] = useState<string>('Pixel Farm Accounting Roguelike');
  const [store, setStore] = useState<'Steam (Steamworks)' | 'Itch.io Direct' | 'Epic Games Store'>('Steam (Steamworks)');
  const [price, setPrice] = useState<number>(9.99);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/game-store/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch game store overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch('/api/dormant/game-store/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, targetStore: store, priceUsd: price })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to deploy game to store', err);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối cổng phân phối game Steamworks &amp; Itch.io...</p>
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
              PILLAR 111 — STEAM &amp; ITCH.IO DISTRIBUTION
            </span>
            <span className="text-xs text-slate-400 font-mono">Total Revenue: ${overview?.totalGameRevenueUsd.toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Game Store Distribution</h1>
          <p className="text-sm text-slate-400">
            Tự động đóng gói bản build Native (.exe) / WebGL (.wasm), sinh Steamworks Depot, tạo trang cửa hàng và đồng bộ doanh thu game toàn cầu.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={gameTitle}
            onChange={(e) => setGameTitle(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={store}
            onChange={(e) => setStore(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Steam (Steamworks)">Steam (Steamworks)</option>
            <option value="Itch.io Direct">Itch.io Direct</option>
            <option value="Epic Games Store">Epic Games Store</option>
          </select>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white w-20 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {deploying ? 'Đang đẩy...' : '🎮 Xuất Bản Store'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Gói Game Đã Xuất Bản</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalStorePackagesCount}</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Active on Global Stores</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Doanh Thu Game Toàn Cầu</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            ${overview?.totalGameRevenueUsd.toLocaleString()} USD
          </div>
          <div className="text-xs text-slate-400 mt-1">Direct to Corporate Treasury</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Định Dạng Binary Hỗ Trợ</div>
          <div className="text-sm font-bold text-white mt-2">Windows x64 (.exe) + HTML5 WebAssembly</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">100% Cross-Platform</div>
        </div>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        {overview?.packages.map((pkg: GameStorePackage) => (
          <div key={pkg.packageId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded">{pkg.targetStore}</span>
                <span className="text-base font-bold text-white">{pkg.gameTitle}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Định dạng: {pkg.buildFormat} {pkg.steamAppId ? `• AppID: ${pkg.steamAppId}` : ''} • Giá bán: ${pkg.priceUsd} USD
              </div>
              <div className="text-[11px] text-emerald-400">
                ⭐ {pkg.userRatingPercent}% Đánh giá tích cực • {pkg.totalDownloadsCount.toLocaleString()} người chơi
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {pkg.status}
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {new Date(pkg.submittedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameStorePublishPanel;
