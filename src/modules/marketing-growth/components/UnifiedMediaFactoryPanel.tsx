import React, { useEffect, useState } from 'react';
import { Film, Sparkles, Video, Play, Tag, CheckCircle2, Clock, Plus, Share2, Layers, Tv, Bot } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import PublisherConnectorPanel from './PublisherConnectorPanel';

export interface MediaJob {
  id: string;
  title: string;
  format: 'tiktok_shorts_reels' | 'ai_movie_series' | 'self_shot_vlog' | 'game_trailer';
  targetPlatforms: string[];
  generatedScript: string;
  affiliateTags: { productName: string; targetUrl: string; discountCode?: string }[];
  status: string;
  renderedVideoUrl?: string;
  createdAt: string;
}

export default function UnifiedMediaFactoryPanel() {
  const [activeFormat, setActiveFormat] = useState<string>('all');
  const [jobs, setJobs] = useState<MediaJob[]>([]);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'tiktok_shorts_reels' | 'ai_movie_series' | 'self_shot_vlog' | 'game_trailer'>('tiktok_shorts_reels');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const formatLabels: Record<string, string> = {
    tiktok_shorts_reels: '📱 TikTok / Shorts / Reels AI',
    ai_movie_series: '🎬 Phim AI & Series Phim',
    self_shot_vlog: '📹 Vlog Tự quay (Auto Edit)',
    game_trailer: '🎮 Trailer Game PC/Mobile',
  };

  const loadMediaJobs = async () => {
    try {
      const mockJobs: MediaJob[] = [
        {
          id: 'job_1',
          title: 'Review Micro Thu Âm Studio cho Reviewer TikTok',
          format: 'tiktok_shorts_reels',
          targetPlatforms: ['TikTok', 'YouTube Shorts', 'Facebook Reels'],
          generatedScript: 'Cảnh 1: Mở đầu hỏi đáp gây tò mò (3s). Cảnh 2: Test âm thanh micro chuyên nghiệp (15s). Cảnh 3: Chèn link Shopee tặng voucher 15%.',
          affiliateTags: [{ productName: 'Micro Reviewer Pro', targetUrl: 'https://lf.studio/aff/mic-creator', discountCode: 'LFSTUDIO10' }],
          status: 'ready_for_review',
          renderedVideoUrl: 'http://localhost:3000/api/video-maker/stream/job_1.mp4',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'job_2',
          title: 'Phim Ngắn AI: "Kỷ Nguyên Solo Founder 2026" - Tập 1',
          format: 'ai_movie_series',
          targetPlatforms: ['YouTube Long', 'TikTok Episode'],
          generatedScript: 'Tập 1: Giám đốc và dàn AI Nhân sự điều hành công ty triệu đô từ phòng làm việc riêng.',
          affiliateTags: [{ productName: 'VPS GPU Render Cloud', targetUrl: 'https://lf.studio/aff/vps-gpu', discountCode: 'AI50OFF' }],
          status: 'ready_for_review',
          renderedVideoUrl: 'http://localhost:3000/api/video-maker/stream/job_2.mp4',
          createdAt: new Date().toISOString(),
        },
      ];
      setJobs(mockJobs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void loadMediaJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    setIsGenerating(true);
    try {
      const newJob: MediaJob = {
        id: `job_${Date.now()}`,
        title,
        format,
        targetPlatforms: ['TikTok', 'Shorts', 'Reels'],
        generatedScript: `[Kịch bản AI] ${title}:\n1. Mở đầu giật gân (3s)\n2. Giới thiệu sản phẩm & Game\n3. Trích dẫn Link Affiliate bên dưới description.`,
        affiliateTags: [{ productName: 'Shopee Tech Product', targetUrl: 'https://lf.studio/aff/tech', discountCode: 'LF2026' }],
        status: 'ready_for_review',
        renderedVideoUrl: 'http://localhost:3000/api/video-maker/stream/demo.mp4',
        createdAt: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      setTitle('');
      setPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredJobs = activeFormat === 'all' ? jobs : jobs.filter((j) => j.format === activeFormat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 via-slate-900 to-slate-900 p-5 rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Xưởng Sản xuất Video & Phim AI Đa nền tảng
              <Badge variant="purple">Media Factory</Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Băng chuyền sản xuất TikTok/Reels, Phim AI, Video tự quay & Gắn mã Affiliate tự động.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-purple-950/40 text-purple-300 border-purple-500/30 text-xs">
            🤖 AI Voice + Motion Engine Ready
          </Badge>
        </div>
      </div>

      {/* Grid 2 Columns: Form Builder Left, Job List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create New Video Job */}
        <Card className="lg:col-span-5 p-5 bg-slate-900/90 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Tạo Video / Phim AI Mới
          </h3>

          <form onSubmit={handleCreateJob} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tiêu đề dự án Video</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Review Bàn Phím Ergonomic TikTok..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Định dạng Video</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="tiktok_shorts_reels">📱 TikTok / YouTube Shorts / FB Reels AI (15s-60s)</option>
                <option value="ai_movie_series">🎬 Phim ngắn & Phim truyện AI Series</option>
                <option value="self_shot_vlog">📹 Vlog Tự quay (Tự động cắt lặng + Phụ đề)</option>
                <option value="game_trailer">🎮 Trailer Quảng cáo Game PC/Mobile</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Ý tưởng Kịch bản & Sản phẩm Affiliate</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="VD: Viết kịch bản TikTok 30s review bàn phím cơ, nhấn mạnh tư thế ngồi cho lập trình viên, chèn link Shopee..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-purple-600/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Đang tạo kịch bản & ghép Affiliate...' : 'Sinh Video AI & Gắn Affiliate Tags'}
            </Button>
          </form>
        </Card>

        {/* Right Column: Media Jobs List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Format Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFormat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeFormat === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Tất cả Format ({jobs.length})
            </button>
            {Object.entries(formatLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveFormat(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFormat === key ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="p-4 bg-slate-900/90 border-slate-800 hover:border-purple-500/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                      {formatLabels[job.format]}
                    </span>
                    <h4 className="text-sm font-bold text-white">{job.title}</h4>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Sẵn sàng duyệt ✓
                  </Badge>
                </div>

                {/* Script Snippet */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 leading-relaxed">
                  {job.generatedScript}
                </div>

                {/* Affiliate Link Tags */}
                {job.affiliateTags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" /> Affiliate Tags:
                    </span>
                    {job.affiliateTags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                        {tag.productName} ({tag.discountCode || 'Active Link'})
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Publisher Connector Hub */}
      <PublisherConnectorPanel />
    </div>
  );
}
