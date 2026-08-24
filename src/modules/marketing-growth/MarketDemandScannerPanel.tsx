import React, { useState, useEffect } from 'react';
import { MarketOpportunityReport, MarketSignal } from '../../../server/services/marketDemandScannerEngine';

export const MarketDemandScannerPanel: React.FC = () => {
  const [report, setReport] = useState<MarketOpportunityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/market-demand-scanner/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch market demand report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/dormant/market-demand-scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: filterKeyword })
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to trigger scan', err);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang kết nối vệ tinh quét tín hiệu nhu cầu thị trường toàn cầu...</p>
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
              PILLAR 101 — TIER 1 RADAR
            </span>
            <span className="text-xs text-slate-400 font-mono">Status: ACTIVE SCANNING</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Market Demand Scanner</h1>
          <p className="text-sm text-slate-400">
            Quét và phát hiện cơ hội sản phẩm Micro-SaaS, Game & Media theo thời gian thực từ Reddit, Google Trends & Product Hunt.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Lọc từ khóa hoặc ngách..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 w-full md:w-64"
          />
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {scanning ? 'Đang quét...' : '⚡ Quét Sâu Radar'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tín Hiệu Nhu Cầu Đang Mở</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.activeSignalsCount || 0}</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">100% Verified Demand</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tâm Lý Thị Trường</div>
          <div className="text-sm font-semibold text-teal-300 mt-2 truncate">{report?.overallMarketSentiment}</div>
          <div className="text-xs text-slate-400 mt-1">Hội tụ về Micro-SaaS & AI Tool</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Sprint Được Đề Xuất</div>
          <div className="text-sm font-bold text-amber-300 mt-2">{report?.recommendedNextSprint.productName}</div>
          <div className="text-xs text-slate-400 mt-1">MVP: {report?.recommendedNextSprint.estimatedTimeToMvpDays} ngày</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Dự Kiến Doanh Thu Tháng 1</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {((report?.recommendedNextSprint.projectedFirstMonthRevVnd || 0) / 1000000).toFixed(0)}M VNĐ
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">VietQR Subscription</div>
        </div>
      </div>

      {/* Top Signals Table */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Danh Sách Tín Hiệu Nhu Cầu & Tiềm Năng Doanh Thu
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">Nguồn</th>
                <th className="py-3 px-4">Chủ Đề & Nhu Cầu</th>
                <th className="py-3 px-4">Tăng Trưởng</th>
                <th className="py-3 px-4">Loại Sản Phẩm</th>
                <th className="py-3 px-4">Tiềm Năng MRR</th>
                <th className="py-3 px-4">Mức Cạnh Tranh</th>
                <th className="py-3 px-4">Điểm Khẩn Cấp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {report?.topOpportunities.map((sig: MarketSignal) => (
                <tr key={sig.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs font-mono rounded uppercase">
                      {sig.source}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{sig.topic}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{sig.painPointSummary}</div>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-mono font-semibold">
                    {sig.searchVolumeGrowth}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs rounded-full">
                      {sig.recommendedProductType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white">
                    {(sig.estimatedMrrPotentialVnd / 1000000).toFixed(0)}M VNĐ
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sig.competitionDensity === 'low' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {sig.competitionDensity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    {sig.urgencyScore}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketDemandScannerPanel;
