import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Video, Cpu, Image, Music, Film, CheckCircle2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';

interface Connector {
  id: string;
  label: string;
  type: string;
  status: string;
  latencyMs: number | null;
}

interface VideoWork {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  createdAt: string;
}

export default function VideoMakerPanel() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [gallery, setGallery] = useState<VideoWork[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoWork | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadConnectorsAndGallery = async () => {
    setIsLoading(true);
    try {
      const connRes = await fetch('/api/video-maker/connectors').then(r => r.json());
      if (connRes.success) setConnectors(connRes.connectors);

      const gallRes = await fetch('/api/video-maker/gallery').then(r => r.json());
      if (gallRes.success) {
        setGallery(gallRes.gallery);
        if (gallRes.gallery.length > 0 && !selectedVideo) {
          setSelectedVideo(gallRes.gallery[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không tải được cấu hình API Video Maker.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConnectorsAndGallery();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Nhập prompt ý tưởng kịch bản trước.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setMessage('');
    setGenSteps([]);

    const steps = [
      'Đội ngũ AI đang phân tích ý tưởng kịch bản...',
      'Gửi prompt vẽ phân cảnh lên Midjourney API...',
      'Sinh hình ảnh chuyển động 3D qua Runway Gen-3...',
      'Tạo giọng đọc lồng tiếng qua ElevenLabs Voice Engine...',
      'FFmpeg local đang trộn hình ảnh, audio và phụ đề...',
      'Đang nạp video thành phẩm lên hệ thống...'
    ];

    // Mô phỏng từng bước chạy Hybrid
    for (let i = 0; i < steps.length; i++) {
      setGenSteps(prev => [...prev, steps[i]]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const res = await fetch('/api/video-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, title })
      }).then(r => r.json());

      if (res.success) {
        setMessage(res.message);
        setPrompt('');
        setTitle('');
        setSelectedVideo(res.video);
        // Tải lại thư viện tác phẩm mới nhất
        const gallRes = await fetch('/api/video-maker/gallery').then(r => r.json());
        if (gallRes.success) setGallery(gallRes.gallery);
      } else {
        setError(res.error || 'Có lỗi xảy ra khi tạo video.');
      }
    } catch (err: any) {
      setError(err.message || 'Không kết nối được server.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-6 text-slate-100">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-300/20">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">
              Hybrid AI Cloud & FFmpeg local
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">AI Video Creator Studio</h1>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              Sản xuất video marketing, làm phim 3D, kịch bản truyện tranh dựa trên kết nối API Hybrid không quá tải máy chủ.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-100">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {message && (
        <div className="flex gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-100">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column - Creator Board */}
        <div className="space-y-6">
          {/* Cloud AI Connectors */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/30 p-5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-300" /> Cổng kết nối API Đám mây (Hybrid Connectors)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {isLoading ? (
                <div className="col-span-2 text-center py-4 text-xs text-slate-500 italic">Đang tải connectors...</div>
              ) : connectors.map(conn => {
                const isConnected = conn.status === 'connected';
                const isMaint = conn.status === 'maintenance';
                return (
                  <div key={conn.id} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : isMaint ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <div className="text-xs">
                        <p className="font-bold text-white">{conn.label}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{conn.type}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400">
                      {conn.latencyMs ? `${conn.latencyMs}ms` : conn.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-300" /> Sáng tác tác phẩm AI mới
            </h2>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Tiêu đề tác phẩm</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Giới thiệu sản phẩm LedgerFlow v1"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Prompt ý tưởng kịch bản (Ý tưởng cốt truyện/3D/Marketing)</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="Mô tả ý tưởng của bạn. Ví dụ: Hãy làm một video clip 3D viễn tưởng về hệ thống robot AI tự hành trong LedgerFlow đang làm việc chăm chỉ..."
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-black uppercase text-white hover:bg-violet-500 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
              Bắt đầu kết xuất Hybrid
            </button>
          </form>

          {/* Gen Steps Progress Simulator */}
          {isGenerating && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" /> Tiến trình kết xuất Hybrid
              </p>
              <div className="space-y-2">
                {genSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    {idx === genSteps.length - 1 ? (
                      <Loader2 className="h-3 w-3 animate-spin text-cyan-300 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Player & Gallery */}
        <div className="space-y-6">
          {/* HTML5 Video Player */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Film className="h-4 w-4 text-cyan-300" /> Trình phát tác phẩm AI
            </h2>

            {selectedVideo ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-900 aspect-video flex items-center justify-center">
                  <video
                    key={selectedVideo.id}
                    controls
                    autoPlay
                    src={selectedVideo.videoUrl}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-black text-white mt-2">{selectedVideo.title}</h3>
                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">{selectedVideo.prompt}</p>
                <div className="text-[10px] text-slate-500 font-bold">
                  Khởi tạo: {new Date(selectedVideo.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-900 bg-slate-950/40 py-16 text-center text-xs text-slate-500 italic">
                Chưa chọn video phát.
              </div>
            )}
          </div>

          {/* Media Gallery List */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">
              Thư viện Tác phẩm AI ({gallery.length})
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {gallery.map(vid => {
                const isSelected = selectedVideo?.id === vid.id;
                return (
                  <button
                    key={vid.id}
                    onClick={() => setSelectedVideo(vid)}
                    className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-all ${
                      isSelected ? 'border-violet-500/40 bg-violet-950/15' : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800 text-violet-300">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{vid.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{vid.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
