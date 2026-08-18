import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Video, Cpu, Image, Music, Film, CheckCircle2, Loader2, AlertTriangle, Download, Copy, Share2, Layers, Volume2, Clapperboard, Eye } from 'lucide-react';

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

interface VideoScene {
  sceneNumber: number;
  timecode: string;
  durationSec: number;
  scriptSegment: string;
  voiceoverTone: string;
  visualDescription: string;
  brollSearchKeywords: string[];
  aiVideoPrompt: string;
  onScreenText?: string;
  soundEffect?: string;
}

interface VideoProject {
  id: string;
  title: string;
  topic: string;
  targetDurationSec: number;
  platform: string;
  pacing: string;
  status: string;
  scenes: VideoScene[];
  fullScriptText: string;
  voiceoverMeta: {
    language: string;
    voiceName: string;
    totalWords: number;
    estimatedAudioSec: number;
  };
  editBriefExport: {
    format: string;
    canvasAspectRatio: string;
    timelineTracks: Array<{ trackId: string; type: string; itemsCount: number }>;
  };
  thumbnailPackage: {
    headlineOptions: string[];
    visualConcept: string;
    dominantColors: string[];
    aiImagePrompt: string;
  };
  seoTags: string[];
  createdAt: string;
}

export default function VideoMakerPanel() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'gallery'>('pipeline');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [gallery, setGallery] = useState<VideoWork[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoWork | null>(null);

  // 5-Stage Pipeline States
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [topic, setTopic] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [durationSec, setDurationSec] = useState(45);
  const [pacing, setPacing] = useState('fast_viral');
  const [customNotes, setCustomNotes] = useState('');
  const [preferLocal, setPreferLocal] = useState(false);
  const [isPipelineGenerating, setIsPipelineGenerating] = useState(false);

  // Hybrid Render Form States
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genSteps, setGenSteps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [connRes, gallRes, projRes] = await Promise.all([
        fetch('/api/video-maker/connectors').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/video-maker/gallery').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/video-production/projects').then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (connRes.success) setConnectors(connRes.connectors || []);
      if (gallRes.success && gallRes.gallery) {
        setGallery(gallRes.gallery);
        if (gallRes.gallery.length > 0 && !selectedVideo) setSelectedVideo(gallRes.gallery[0]);
      }
      if (projRes.success && projRes.projects) {
        setProjects(projRes.projects);
        if (projRes.projects.length > 0 && !selectedProject) setSelectedProject(projRes.projects[0]);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handlePipelineGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề video.');
      return;
    }

    setIsPipelineGenerating(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/video-production/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title: videoTitle || `Video ${topic.slice(0, 30)}`,
          platform,
          targetDurationSec: durationSec,
          pacing,
          customNotes,
          preferLocal,
        }),
      }).then((r) => r.json());

      if (res.success && res.project) {
        setProjects((prev) => [res.project, ...prev]);
        setSelectedProject(res.project);
        setMessage(`Đã tạo thành công quy trình 5 giai đoạn cho video: "${res.project.title}"!`);
        setTopic('');
        setVideoTitle('');
      } else {
        setError(res.error || 'Không thể tạo kịch bản video.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsPipelineGenerating(false);
    }
  };

  const handleHybridGenerate = async (e: React.FormEvent) => {
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
      'Đang nạp video thành phẩm lên hệ thống...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setGenSteps((prev) => [...prev, steps[i]]);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    try {
      const res = await fetch('/api/video-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, title: videoTitle }),
      }).then((r) => r.json());

      if (res.success) {
        setMessage(res.message);
        setPrompt('');
        setVideoTitle('');
        setSelectedVideo(res.video);
        const gallRes = await fetch('/api/video-maker/gallery').then((r) => r.json());
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

  const playVoicePreview = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const copyEditBriefJson = () => {
    if (!selectedProject) return;
    navigator.clipboard.writeText(JSON.stringify(selectedProject, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="rounded-[2rem] border border-border-primary bg-slate-950/60 p-6 text-slate-100 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-300/20">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300">
                Studio Sản Xuất Video AI Hạng Nhất
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white">Xưởng Sản Xuất Video Đa Kênh</h1>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">
                Quy trình 5 giai đoạn: Kịch bản từng giây → Lồng tiếng Cues → B-Roll Visual → Edit Brief DaVinci/CapCut → Thumbnail Viral.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-900/80 p-1.5 border border-border-primary">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'pipeline' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎬 Pipeline Sản Xuất 5 Giai Đoạn
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'gallery' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Hybrid Render &amp; Gallery ({gallery.length})
            </button>
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

      {/* Mode 1: 5-Stage Video Production Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Form & Project List */}
          <div className="space-y-5 lg:col-span-4">
            <form onSubmit={handlePipelineGenerate} className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2 font-black text-xs uppercase text-text-primary">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>Lập kế hoạch video mới</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary">Chủ đề video (Topic)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: 3 sai lầm khiến kế toán mất 20h mỗi tuần..."
                  className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-text-tertiary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary">Nền tảng</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1.5 text-xs text-white">
                    <option value="tiktok">TikTok (9:16)</option>
                    <option value="youtube_shorts">YouTube Shorts (9:16)</option>
                    <option value="youtube_long">YouTube Long (16:9)</option>
                    <option value="facebook_reels">Facebook Reels (9:16)</option>
                    <option value="product_demo">Demo Sản Phẩm (16:9)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-secondary">Thời lượng: {durationSec}s</label>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={15}
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="mt-2 w-full accent-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary">Nhịp độ video (Pacing)</label>
                <select value={pacing} onChange={(e) => setPacing(e.target.value)} className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-2.5 py-1.5 text-xs text-white">
                  <option value="fast_viral">Fast Viral (Cực nhanh, giật gân, hook mạnh)</option>
                  <option value="cinematic">Cinematic (Điện ảnh, cảm xúc, góc quay rộng)</option>
                  <option value="educational_steady">Educational (Giáo dục, logic, rõ ràng)</option>
                  <option value="energetic_promo">Energetic Promo (Quảng cáo bùng nổ, thúc đẩy mua hàng)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary">Ghi chú bổ sung (Tùy chọn)</label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="VD: Cần nhấn mạnh tính năng xuất file PDF và bảng đối chiếu hóa đơn..."
                  className="mt-1 w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-text-tertiary"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={preferLocal} onChange={(e) => setPreferLocal(e.target.checked)} />
                  Dùng Ollama local ($0)
                </label>
                <button
                  type="submit"
                  disabled={isPipelineGenerating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-500/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isPipelineGenerating ? 'Đang tạo kịch bản...' : 'Sinh Kế Hoạch Video'}
                </button>
              </div>
            </form>

            {/* Projects List */}
            <div className="rounded-2xl border border-border-primary bg-slate-900/40 p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase text-text-primary">Dự án Video đã tạo ({projects.length})</h3>
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                      selectedProject?.id === p.id
                        ? 'border-violet-500/60 bg-violet-500/15 text-white'
                        : 'border-border-primary bg-slate-950/60 text-text-secondary hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[180px]">{p.title}</span>
                      <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[9px] font-black uppercase">
                        {p.platform}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-text-tertiary">
                      <span>{p.scenes.length} phân cảnh</span>
                      <span>·</span>
                      <span>{p.targetDurationSec}s</span>
                      <span>·</span>
                      <span className="capitalize">{p.pacing.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-[11px] text-text-tertiary italic text-center py-4">Chưa có dự án nào. Hãy tạo dự án video đầu tiên ở trên!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 5-Stage Project Details */}
          <div className="lg:col-span-8 space-y-4">
            {selectedProject ? (
              <div className="space-y-4 rounded-2xl border border-border-primary bg-slate-950/80 p-5">
                {/* Project Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-primary pb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedProject.title}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Chủ đề: <strong className="text-slate-300">{selectedProject.topic}</strong> · {selectedProject.targetDurationSec}s · Tỷ lệ: {selectedProject.editBriefExport.canvasAspectRatio}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyEditBriefJson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-900 px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-slate-800 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" /> {copied ? 'Đã sao chép JSON!' : 'Copy Edit Brief JSON'}
                    </button>
                    <button
                      onClick={() => playVoicePreview(selectedProject.fullScriptText)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600/30 border border-violet-500/40 px-3 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-600/50 cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" /> Nghe Thử Voiceover
                    </button>
                  </div>
                </div>

                {/* Stage 1 & 2: Scene-by-Scene Timeline */}
                <div className="rounded-xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-xs text-cyan-300 uppercase">
                      <Clapperboard className="h-4 w-4" />
                      <span>Giai đoạn 1 &amp; 2: Kịch bản phân cảnh &amp; Cues lồng tiếng</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">{selectedProject.scenes.length} phân đoạn</span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedProject.scenes.map((scene) => (
                      <div key={scene.sceneNumber} className="rounded-xl border border-border-primary bg-slate-950 p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-[10px] font-black text-violet-300">
                              Cảnh {scene.sceneNumber} ({scene.timecode})
                            </span>
                            <span className="text-[10px] text-amber-300 font-bold">Tone: {scene.voiceoverTone}</span>
                          </div>
                          {scene.soundEffect && (
                            <span className="text-[10px] font-mono text-text-tertiary">🔊 {scene.soundEffect}</span>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary">Lời đọc (Voiceover):</span>
                            <p className="text-white font-medium bg-slate-900/80 p-2 rounded-lg border border-border-secondary">
                              "{scene.scriptSegment}"
                            </p>
                            {scene.onScreenText && (
                              <p className="text-[10px] text-yellow-300 font-bold">Chữ trên màn hình: {scene.onScreenText}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-text-tertiary">Hình ảnh &amp; AI Camera Prompt:</span>
                            <p className="text-slate-300 text-[11px]">{scene.visualDescription}</p>
                            <div className="rounded bg-slate-900/90 p-1.5 text-[10px] font-mono text-cyan-300 select-all border border-border-secondary">
                              {scene.aiVideoPrompt}
                            </div>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {scene.brollSearchKeywords.map((kw) => (
                                <span key={kw} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-text-tertiary">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 3: CapCut / DaVinci Edit Brief Track Overview */}
                <div className="rounded-xl border border-border-primary bg-slate-900/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-indigo-300 uppercase">
                    <Layers className="h-4 w-4" />
                    <span>Giai đoạn 3: Cấu trúc Edit Brief (CapCut / DaVinci Resolve)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {selectedProject.editBriefExport.timelineTracks.map((track) => (
                      <div key={track.trackId} className="rounded-lg bg-slate-950 p-2.5 border border-border-secondary text-center">
                        <span className="text-[10px] text-text-tertiary uppercase block">Track {track.trackId} ({track.type})</span>
                        <strong className="text-white text-sm">{track.itemsCount} clips / cues</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 4 & 5: Viral Thumbnail & SEO Package */}
                <div className="rounded-xl border border-border-primary bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 font-black text-xs text-emerald-300 uppercase">
                    <Eye className="h-4 w-4" />
                    <span>Giai đoạn 4 &amp; 5: Gói Thumbnail &amp; SEO Viral</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase">Gợi ý Tiêu đề giật tít:</span>
                      <ul className="space-y-1">
                        {selectedProject.thumbnailPackage.headlineOptions.map((hl, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-white font-bold bg-slate-950 p-2 rounded-lg border border-border-secondary">
                            <span className="text-yellow-400 font-mono">#{idx + 1}</span> {hl}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase">Prompt vẽ Thumbnail AI:</span>
                      <div className="rounded-lg bg-slate-950 p-2 text-[11px] font-mono text-cyan-300 border border-border-secondary select-all">
                        {selectedProject.thumbnailPackage.aiImagePrompt}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {selectedProject.seoTags.map((tag) => (
                          <span key={tag} className="rounded-full bg-violet-500/20 text-violet-300 px-2 py-0.5 text-[10px] font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border-primary p-8 text-center text-text-tertiary">
                <p>Chọn một dự án video từ danh sách hoặc lập kế hoạch mới ở bên trái.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Hybrid Cloud Render & Gallery */}
      {activeTab === 'gallery' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Cloud AI Connectors */}
            <div className="rounded-3xl border border-border-primary bg-slate-950/30 p-5">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-violet-300" /> Cổng kết nối API Đám mây (Hybrid Connectors)
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {isLoading ? (
                  <div className="col-span-2 text-center py-4 text-xs text-text-tertiary italic">Đang tải connectors...</div>
                ) : (
                  connectors.map((conn) => {
                    const isConnected = conn.status === 'connected';
                    const isMaint = conn.status === 'maintenance';
                    return (
                      <div key={conn.id} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : isMaint ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <div className="text-xs">
                            <p className="font-bold text-text-primary">{conn.label}</p>
                            <p className="text-[10px] text-text-tertiary uppercase">{conn.type}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-text-secondary">
                          {conn.latencyMs ? `${conn.latencyMs}ms` : conn.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Hybrid Render Form */}
            <form onSubmit={handleHybridGenerate} className="rounded-3xl border border-border-primary bg-bg-primary/40 p-5 space-y-4">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" /> Sáng tác tác phẩm AI mới
              </h2>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary">Tiêu đề tác phẩm</label>
                <input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ví dụ: Giới thiệu sản phẩm LedgerFlow v1"
                  className="mt-2 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary">Prompt ý tưởng kịch bản (Ý tưởng cốt truyện/3D/Marketing)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Mô tả ý tưởng của bạn. Ví dụ: Hãy làm một video clip 3D viễn tưởng về hệ thống robot AI tự hành trong LedgerFlow..."
                  className="mt-2 w-full rounded-xl border border-border-primary bg-slate-950 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-black uppercase text-text-primary hover:bg-violet-500 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
                Bắt đầu kết xuất Hybrid
              </button>
            </form>

            {isGenerating && (
              <div className="rounded-3xl border border-border-primary bg-slate-950/60 p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-tertiary flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" /> Tiến trình kết xuất Hybrid
                </p>
                <div className="space-y-2">
                  {genSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
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
            <div className="rounded-3xl border border-border-primary bg-slate-950/80 p-5 shadow-xl">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
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
                  <h3 className="text-xs font-black text-text-primary mt-2">{selectedVideo.title}</h3>
                  <p className="text-[11px] font-semibold text-text-secondary leading-relaxed">{selectedVideo.prompt}</p>
                  <div className="text-[10px] text-text-tertiary font-bold">
                    Khởi tạo: {new Date(selectedVideo.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-900 bg-slate-950/40 py-16 text-center text-xs text-text-tertiary italic">
                  Chưa chọn video phát.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border-primary bg-bg-primary/40 p-5">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-wider mb-3">
                Thư viện Tác phẩm AI ({gallery.length})
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {gallery.map((vid) => {
                  const isSelected = selectedVideo?.id === vid.id;
                  return (
                    <button
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className={`w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected ? 'border-violet-500/40 bg-violet-950/15' : 'border-slate-900 bg-slate-950/40 hover:border-border-primary'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-bg-primary flex items-center justify-center shrink-0 border border-border-primary text-violet-300">
                        <Film className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-text-primary truncate">{vid.title}</p>
                        <p className="text-[10px] text-text-tertiary font-semibold truncate mt-0.5">{vid.prompt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
