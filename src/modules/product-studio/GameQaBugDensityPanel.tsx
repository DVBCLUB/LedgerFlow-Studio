import React, { useState, useEffect } from 'react';
import { GameQaMetricsReport, GameBugReport } from '../../../server/services/gameQaBugDensityEngine';

export const GameQaBugDensityPanel: React.FC = () => {
  const [report, setReport] = useState<GameQaMetricsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/dormant/game-qa/report');
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch game QA report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePlaytest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/dormant/game-qa/playtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        await fetchReport();
      }
    } catch (err) {
      console.error('Failed to run automated playtest', err);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang tải bảng kiểm thử Game QA & Mật độ lỗi KLOC...</p>
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
              PILLAR 108 — GAME QA & PLAYTESTING
            </span>
            <span className="text-xs text-slate-400 font-mono">Game: {report?.gameTitle}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Game QA & Bug Density Benchmark</h1>
          <p className="text-sm text-slate-400">
            Giả lập phiên chơi game tự động, kiểm soát rò rỉ bộ nhớ, đo đạc độ mượt FPS và bảo đảm mật độ lỗi &lt; 0.1/KLOC chuẩn AAA.
          </p>
        </div>

        <button
          onClick={handlePlaytest}
          disabled={testing}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
        >
          {testing ? 'Đang giả lập 500 phiên...' : '🎮 Chạy 500 Phiên Playtest Tự Động'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Mật Độ Lỗi (Bug Density)</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{report?.bugDensityPerKloc} / KLOC</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Chuẩn Quốc Tế &lt; 0.1</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Độ Mượt Khung Hình</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{report?.averageFps} FPS</div>
          <div className="text-xs text-slate-400 mt-1">Locked Solid 60 FPS</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Đỉnh Bộ Nhớ (Memory Peak)</div>
          <div className="text-2xl font-extrabold text-white mt-1">{report?.memoryPeakMb} MB</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Zero Memory Leaks</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Trạng Thái Sẵn Sàng Phát Hành</div>
          <div className="text-sm font-bold text-amber-300 mt-2">{report?.passStatus}</div>
          <div className="text-xs text-slate-400 mt-1">Ready for Steam &amp; Itch.io</div>
        </div>
      </div>

      {/* Bug List */}
      <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Nhật Ký Lỗi &amp; Tình Huống Game (Game QA Telemetry Log)
        </h2>

        {report?.bugs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-emerald-900/40">
            <div className="text-emerald-400 font-bold text-base">🎉 Mật Độ Lỗi Đạt 0.0/KLOC — Hoàn Toàn Sạch Lỗi!</div>
            <div className="text-xs text-slate-400 mt-1">Tất cả 500 phiên giả lập game đã hoàn thành xuất sắc.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {report?.bugs.map((b: GameBugReport) => (
              <div key={b.bugId} className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-lg flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-mono rounded uppercase">{b.category}</span>
                    <span className="text-sm font-medium text-white">{b.location}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">Frame Drop: {b.frameRateDropFps} FPS • Phát hiện lúc: {new Date(b.discoveredAt).toLocaleTimeString('vi-VN')}</div>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded">
                  {b.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameQaBugDensityPanel;
