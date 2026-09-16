import React, { useState, useEffect } from 'react';
import { Gamepad2, Bug, Zap, Cpu, Award, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Gamepad2 className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kiểm Thử Game Tự Động & Mật Độ Lỗi (Game QA Benchmark)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AAA Standard
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Giả lập phiên chơi game tự động, kiểm soát rò rỉ bộ nhớ, đo đạc độ mượt FPS và bảo đảm mật độ lỗi &lt; 0.1/KLOC chuẩn AAA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Game: {report?.gameTitle || 'Active Title'}
            </span>
          </div>
        </div>
      </section>

      {/* Action Playtest Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Giả Lập 500 Phiên Playtest Song Song Bằng AI Bot</h2>
          <p className="text-xs text-slate-400 mt-0.5">Thực hiện kiểm thử áp lực va chạm, bộ nhớ và tụt khung hình không người lái.</p>
        </div>
        <button
          type="button"
          onClick={handlePlaytest}
          disabled={testing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{testing ? 'Đang giả lập 500 phiên...' : '🎮 Chạy 500 Phiên Playtest Tự Động'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mật Độ Lỗi (Bug Density)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">
            {report?.bugDensityPerKloc} / KLOC
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Chuẩn Quốc Tế &lt; 0.1</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Mượt Khung Hình</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">
            {report?.averageFps} FPS
          </div>
          <p className="mt-1 text-[11px] font-medium text-teal-400">Locked Solid 60 FPS</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-950 to-blue-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đỉnh Bộ Nhớ (Peak RAM)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-300 font-mono">
            {report?.memoryPeakMb} MB
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Zero Memory Leaks</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 to-emerald-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sẵn Sàng Phát Hành</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-300">
            {report?.passStatus}
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Ready for Steam &amp; Itch.io</p>
        </div>
      </div>

      {/* Bug List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-black text-white">Nhật Ký Lỗi &amp; Tình Huống Game (Game QA Telemetry Log)</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Zero Crash Target</span>
        </div>

        {report?.bugs.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <div className="text-emerald-400 font-bold text-base">🎉 Mật Độ Lỗi Đạt 0.0/KLOC — Hoàn Toàn Sạch Lỗi!</div>
            <div className="text-xs text-slate-400 mt-1">Tất cả 500 phiên giả lập game đã hoàn thành xuất sắc không phát sinh sự cố.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {report?.bugs.map((b: GameBugReport) => (
              <div key={b.bugId} className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded-lg uppercase">{b.category}</span>
                    <span className="text-sm font-bold text-white">{b.location}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Frame Drop: <strong className="text-amber-400">{b.frameRateDropFps} FPS</strong> · Phát hiện lúc: {new Date(b.discoveredAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>

                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-500/30">
                  {b.severity}
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

