import React, { useState, useEffect } from 'react';
import { VcMatcherOverview, VcInvestorTarget } from '../../../server/services/vcInvestorMatcherEngine';

export const VcInvestorMatcherPanel: React.FC = () => {
  const [overview, setOverview] = useState<VcMatcherOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [firmName, setFirmName] = useState<string>('Andreessen Horowitz (a16z)');
  const [stage, setStage] = useState<'Pre-Seed' | 'Seed' | 'Series A' | 'Growth'>('Seed');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/vc-matcher/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch VC matcher overview', err);
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
      const res = await fetch('/api/dormant/vc-matcher/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcFirmName: firmName, focusStage: stage })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to dispatch pitch to VC', err);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang đối soát cơ sở dữ liệu các quỹ đầu tư mạo hiểm VC &amp; Angel...</p>
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
              PILLAR 122 — VC &amp; INVESTOR MATCHING AI
            </span>
            <span className="text-xs text-slate-400 font-mono">Scanned VCs: {overview?.totalVcFirmsScannedCount} Firms</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous AI Pitch Deck &amp; VC Investor Matcher</h1>
          <p className="text-sm text-slate-400">
            Tự động khớp chỉ số tăng trưởng ARR/MRR thực thu với khẩu vị đầu tư của các quỹ hàng đầu và gửi Pitch Deck có Watermark VDR.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Pre-Seed">Pre-Seed</option>
            <option value="Seed">Seed</option>
            <option value="Series A">Series A</option>
            <option value="Growth">Growth</option>
          </select>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {dispatching ? 'Đang gửi...' : '🚀 Gửi Pitch Deck VDR'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">ARR Thực Thu Đã Thẩm Định</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">${overview?.verifiedArrMetricUsd.toLocaleString()} USD</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">VietQR + IFRS 15 Recon</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Điểm Phù Hợp Khẩu Vị VC</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{overview?.averageMatchScorePercent}%</div>
          <div className="text-xs text-slate-400 mt-1">High Investor Fit</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Hội Thoại Đang Tiếp Xúc</div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {overview?.activeInvestorConversationsCount} Quỹ VC
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Active Deal Flow</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Bảo Mật Virtual Data Room</div>
          <div className="text-sm font-bold text-amber-300 mt-2">Dynamic Watermark + NDA</div>
          <div className="text-xs text-slate-400 mt-1">Zero Leak Risk</div>
        </div>
      </div>

      {/* Targets List */}
      <div className="space-y-4">
        {overview?.targets.map((t: VcInvestorTarget) => (
          <div key={t.targetId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono rounded">{t.focusStage}</span>
                <span className="text-base font-bold text-white">{t.vcFirmName}</span>
                <span className="text-xs text-emerald-400 font-mono">({t.matchConfidencePercent}% Match)</span>
              </div>
              <div className="text-xs text-slate-300">{t.thesisFitReason}</div>
              <div className="text-xs text-slate-400 font-mono">Cheque Size: {t.sweetSpotChequeSizeUsd}</div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                {t.pitchDeckStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VcInvestorMatcherPanel;
