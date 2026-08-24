import React, { useState, useEffect } from 'react';
import { CrossChainLiquidityOverview, LiquidityPoolPosition } from '../../../server/services/crossChainLiquidityBridgeEngine';

export const CrossChainLiquidityBridgePanel: React.FC = () => {
  const [overview, setOverview] = useState<CrossChainLiquidityOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rebalancing, setRebalancing] = useState<boolean>(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/cross-chain-liquidity/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cross-chain liquidity overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRebalance = async () => {
    setRebalancing(true);
    try {
      const res = await fetch('/api/dormant/cross-chain-liquidity/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to execute cross-chain rebalance', err);
    } finally {
      setRebalancing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối cầu thanh khoản chuỗi chéo L2 &amp; RWA Treasury Vault...</p>
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
              PILLAR 124 — CROSS-CHAIN LIQUIDITY &amp; RWA YIELD
            </span>
            <span className="text-xs text-slate-400 font-mono">Portfolio APY: {overview?.averagePortfolioApyPercent}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Sovereign Cross-Chain Liquidity &amp; Stablecoin Bridge</h1>
          <p className="text-sm text-slate-400">
            Tối ưu hóa lợi suất dòng tiền nhàn rỗi (RWA T-Bills yield 5.45% trên Base/Arbitrum) và hỗ trợ off-ramp tự động về VietQR ngân hàng nội địa.
          </p>
        </div>

        <button
          onClick={handleRebalance}
          disabled={rebalancing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {rebalancing ? 'Đang tái cân bằng...' : '⚡ Tái Cân Bằng Lợi Suất L2'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Tiền Kho Bạc Sinh Lời</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">${overview?.totalTreasuryLiquidityUsd.toLocaleString()} USD</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">L2 Smart Contract Vaults</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Lợi Suất Thực RWA APY</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{overview?.averagePortfolioApyPercent}% APY</div>
          <div className="text-xs text-slate-400 mt-1">US Treasury Bills Backed</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tiền Lãi Tích Lũy / Ngày</div>
          <div className="text-2xl font-extrabold text-white mt-1">+${overview?.totalDailyAccruedInterestUsd} USD</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Passive Treasury Flow</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Cổng Rút Về Ngân Hàng</div>
          <div className="text-sm font-bold text-amber-300 mt-2">Instant VietQR Off-Ramp Ready</div>
          <div className="text-xs text-slate-400 mt-1">Zero Slippage Guarantee</div>
        </div>
      </div>

      {/* Pools List */}
      <div className="space-y-4">
        {overview?.positions.map((p: LiquidityPoolPosition) => (
          <div key={p.positionId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded">{p.chainName}</span>
                <span className="text-base font-bold text-white">{p.stablecoinType}</span>
                <span className="text-xs text-emerald-400 font-mono">({p.annualYieldApyPercent}% APY)</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Số dư: ${p.depositedAmountUsd.toLocaleString()} USD • Tiền lãi sinh ra: +${p.dailyYieldAccruedUsd}/ngày
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {p.securityAuditStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrossChainLiquidityBridgePanel;
