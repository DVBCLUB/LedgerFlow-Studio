import React, { useState, useEffect } from 'react';
import { EarphoneBriefingOverview, EarphoneAudioBriefing } from '../../../server/services/executiveEarphoneAudioBriefingEngine';

export const ExecutiveEarphoneAudioBriefingPanel: React.FC = () => {
  const [overview, setOverview] = useState<EarphoneBriefingOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>('Sức khỏe dòng tiền & Cảnh báo an ninh');
  const [activePlayId, setActivePlayId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/earphone-briefing/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch earphone briefing overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/dormant/earphone-briefing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'flash_revenue_alert', topic })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to generate instant briefing', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang đồng bộ luồng âm thanh tóm tắt thời gian thực cho CEO...</p>
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
              PILLAR 117 — EXECUTIVE EARPHONE MODE
            </span>
            <span className="text-xs text-slate-400 font-mono">Listening Time: {overview?.totalAudioListeningMinutes} mins</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Autonomous Executive Earphone &amp; Audio Whisper Briefing</h1>
          <p className="text-sm text-slate-400">
            Kênh âm thanh tóm tắt thời gian thực qua tai nghe CEO: Bản tin sáng, cảnh báo dòng tiền thực thu và thầm thì chỉ số quan trọng.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {generating ? 'Đang tạo audio...' : '🎧 Sinh Audio Tức Thì'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Trạng Thái Earphone Daemon</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">Active &amp; Streaming</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">Hands-Free CEO Companion</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Số Bản Tin Đã Phát</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{overview?.totalBriefingsCount} Briefings</div>
          <div className="text-xs text-slate-400 mt-1">Zero Interruption Lag</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Công Nghệ Giọng Đọc Neural</div>
          <div className="text-sm font-bold text-white mt-2">Executive Neural Voice (24kHz HD)</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Bilingual VN / EN Support</div>
        </div>
      </div>

      {/* Briefings List */}
      <div className="space-y-4">
        {overview?.briefings.map((b: EarphoneAudioBriefing) => (
          <div key={b.briefingId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded uppercase">{b.category.replace(/_/g, ' ')}</span>
                  <span className="text-base font-bold text-white">{b.title}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">Thời lượng: {b.audioDurationSec}s • Giọng đọc: {b.voiceProfile}</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActivePlayId(activePlayId === b.briefingId ? null : b.briefingId)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {activePlayId === b.briefingId ? '⏸️ Tạm dừng' : '▶️ Nghe bản tin'}
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(b.generatedAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
              "{b.transcriptText}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutiveEarphoneAudioBriefingPanel;
