import React, { useState, useEffect } from 'react';
import { RevenueLoopExecution } from '../../../server/services/revenueOrchestrationEngine';

export const RevenueOrchestrationPanel: React.FC = () => {
  const [loops, setLoops] = useState<RevenueLoopExecution[]>([]);
  const [totalRev, setTotalRev] = useState<number>(0);
  const [recognizedRev, setRecognizedRev] = useState<number>(0);
  const [autonomyIndex, setAutonomyIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductType, setNewProductType] = useState<'micro_saas' | 'indie_game' | 'media_pack'>('micro_saas');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/revenue-orchestration/overview');
      const data = await res.json();
      if (data.success) {
        setLoops(data.data.activeLoops);
        setTotalRev(data.data.totalRevenueVnd);
        setRecognizedRev(data.data.recognizedRevenueVnd);
        setAutonomyIndex(data.data.systemAutonomyIndex);
      }
    } catch (err) {
      console.error('Failed to fetch revenue orchestration overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleCreateLoop = async () => {
    if (!newProductName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/dormant/revenue-orchestration/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: newProductName, productType: newProductType })
      });
      const data = await res.json();
      if (data.success) {
        setNewProductName('');
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to trigger revenue loop', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tải bảng điều phối Vòng Lặp Doanh Thu Tự Trị...</p>
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
              PILLAR 102 — ZERO-TOUCH REVENUE ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Autonomy Level: {autonomyIndex}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Zero-Touch Revenue Orchestrator</h1>
          <p className="text-sm text-slate-400">
            Tự động hóa khép kín: Tín hiệu thị trường ➔ Sinh code/Game ➔ Truyền thông 9:16 ➔ Thu tiền VietQR & Đối soát IFRS 15.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Tên sản phẩm mới..."
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={newProductType}
            onChange={(e) => setNewProductType(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="micro_saas">Micro-SaaS</option>
            <option value="indie_game">Indie Game</option>
            <option value="media_pack">Media Pack</option>
          </select>
          <button
            onClick={handleCreateLoop}
            disabled={creating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {creating ? 'Đang kích hoạt...' : '🚀 Khởi Chạy Vòng Lặp'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Tiền Thu Về Thực Tế</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {(totalRev / 1000000).toLocaleString()}M VNĐ
          </div>
          <div className="text-xs text-slate-400 mt-1">VietQR Webhook Ingestion</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Doanh Thu Ghi Nhận (IFRS 15)</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">
            {(recognizedRev / 1000000).toLocaleString()}M VNĐ
          </div>
          <div className="text-xs text-slate-400 mt-1">Khấu trừ nghĩa vụ thực hiện</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Vòng Lặp Đang Hoạt Động</div>
          <div className="text-2xl font-extrabold text-white mt-1">{loops.length}</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">100% Autonomous</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Chỉ Số Tự Trị Toàn Hệ Thống</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{autonomyIndex}%</div>
          <div className="text-xs text-slate-400 mt-1">Zero-touch manual labor</div>
        </div>
      </div>

      {/* Loops List */}
      <div className="space-y-4">
        {loops.map((loop) => (
          <div key={loop.loopId} className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">{loop.productName}</span>
                  <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs rounded-full uppercase">
                    {loop.productType}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                    {loop.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Mã vòng lặp: <span className="font-mono text-slate-300">{loop.loopId}</span> • Bắt đầu: {new Date(loop.startedAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-400">
                  Doanh Thu: {(loop.totalCollectedVnd / 1000000).toLocaleString()}M VNĐ ({loop.totalTransactionsCount} giao dịch)
                </div>
                <div className="text-xs text-slate-400">Độ tự trị: {loop.estimatedFullAutonomyPercentage}%</div>
              </div>
            </div>

            {/* Stages Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              {loop.stages.map((st, idx) => (
                <div
                  key={st.stageId}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    st.status === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : st.status === 'in_progress'
                      ? 'bg-blue-950/30 border-blue-700/50 text-blue-200 animate-pulse'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Giai đoạn {idx + 1}</span>
                    <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60">
                      {st.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200">{st.stageName}</div>
                  <div className="text-[11px] text-slate-400">Agent: {st.assignedAgent}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueOrchestrationPanel;
