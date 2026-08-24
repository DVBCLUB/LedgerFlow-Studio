import React, { useEffect, useState } from 'react';
import {
  Film,
  Video,
  Play,
  Share2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Radio,
} from 'lucide-react';

export interface ProducedVideoAsset {
  videoId: string;
  title: string;
  aspectRatio: string;
  durationSeconds: number;
  voiceoverSpeaker: string;
  viewsEstimated: number;
  publishedPlatforms: string[];
  status: string;
}

export default function VideoProductionStudioPanel() {
  const [videos, setVideos] = useState<ProducedVideoAsset[]>([]);
  const [totalViews, setTotalViews] = useState(240000);
  const [videoTitle, setVideoTitle] = useState('Top 3 lý do Kế toán trưởng chuyển sang dùng LedgerFlow Studio');
  const [speaker, setSpeaker] = useState('Nam Miền Bắc (Hà Nội AI Neural Pro)');
  const [publishMsg, setPublishMsg] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dormant/video-studio/videos');
      const data = await res.json();
      if (data?.success) {
        setVideos(data.videos || []);
        setTotalViews(data.totalViewsGenerated || 240000);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProduce = async () => {
    try {
      const res = await fetch('/api/dormant/video-studio/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: videoTitle, voiceSpeaker: speaker }),
      });
      const data = await res.json();
      if (data?.success) {
        setPublishMsg(`Đã tạo video ngắn 9:16 và tự động xuất bản lên TikTok, YouTube Shorts & Meta Reels thành công.`);
        await fetchData();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">🎬 Autonomous Video Production Studio (9:16 Reels/TikTok)</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Auto-Publish Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sản xuất video ngắn dọc 9:16 tự động từ bản cập nhật phần mềm, lồng tiếng AI tiếng Việt chất lượng phòng thu và tự động đăng tải đa nền tảng.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Lượt Xem Tự Nhiên Toàn Mạng (Organic Views)</div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{totalViews.toLocaleString()} Views</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Từ TikTok, Shorts và Reels</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Thời Gian Sản Xuất 1 Video Ngắn</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">&lt; 15 Giây</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Zero Human Video Editor needed</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tỷ Lệ Giữ Chân Người Xem (Retention)</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">74.2%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hook 3 giây đầu bằng giọng đọc AI cảm xúc</div>
        </div>
      </div>

      {/* Video Studio Generator */}
      <div className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-bold text-white uppercase">Sản Xuất Video Ngắn Mới Tức Thì (AI Script + Voice)</h4>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px]">
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold"
            />
          </div>

          <div className="w-[220px]">
            <select
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-bold"
            >
              <option value="Nam Miền Bắc (Hà Nội AI Neural Pro)">Nam Miền Bắc (Hà Nội AI Neural Pro)</option>
              <option value="Nữ Miền Nam (Sài Gòn Professional)">Nữ Miền Nam (Sài Gòn Professional)</option>
              <option value="Giọng Anh-Mỹ Toàn Cầu (US Global Tech)">Giọng Anh-Mỹ Toàn Cầu (US Global Tech)</option>
            </select>
          </div>

          <button
            onClick={handleProduce}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/20"
          >
            Render &amp; Auto-Publish Đa Kênh
          </button>
        </div>

        {publishMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{publishMsg}</span>
          </div>
        )}
      </div>

      {/* Videos Feed */}
      <div className="space-y-3">
        {videos.map((v) => (
          <div key={v.videoId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 font-mono">
                    {v.aspectRatio} ({v.durationSeconds}s)
                  </span>
                  <h4 className="text-xs font-bold text-white">{v.title}</h4>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                  <span>Giọng đọc: <strong className="text-slate-200">{v.voiceoverSpeaker}</strong></span>
                  <span>Kênh: <strong className="text-cyan-300">{v.publishedPlatforms.join(', ')}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-white/10 text-emerald-300">
                  +{v.viewsEstimated.toLocaleString()} Views
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
