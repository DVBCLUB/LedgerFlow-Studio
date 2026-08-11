import React, { useState } from 'react';
import { Bot, Sparkles, Mic, Video, Image, Play, CheckCircle2, RefreshCw, Wand2, ArrowRight, Sliders, ExternalLink, Zap, Layers, FileText, Copy, Check } from 'lucide-react';

interface AIPlatform {
  id: string;
  name: string;
  category: 'Voice' | 'Video' | 'Avatar' | 'Image';
  status: 'connected' | 'configured' | 'setup_required';
  models: string[];
  latency: string;
}

interface GeneratedScript {
  id: string;
  topic: string;
  targetProduct: string;
  hook: string;
  voiceScript: string;
  scenePrompt: string;
  ctaText: string;
  affiliateTag: string;
}

export default function AIVideoFactoryPanel() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('LedgerFlow OS');
  const [videoTopic, setVideoTopic] = useState<string>('Tự động hóa báo cáo tài chính VAS 133 bằng AI');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [aiPlatforms] = useState<AIPlatform[]>([
    {
      id: 'plat-1',
      name: 'ElevenLabs AI Voice',
      category: 'Voice',
      status: 'connected',
      models: ['Multilingual v2', 'Turbo v2.5'],
      latency: '240ms',
    },
    {
      id: 'plat-2',
      name: 'Runway Gen-3 Alpha',
      category: 'Video',
      status: 'connected',
      models: ['Gen-3 Alpha Turbo'],
      latency: '4.2s/frame',
    },
    {
      id: 'plat-3',
      name: 'Luma Dream Machine',
      category: 'Video',
      status: 'connected',
      models: ['Dream Machine v1.5'],
      latency: '3.8s/frame',
    },
    {
      id: 'plat-4',
      name: 'HeyGen Digital Twin Avatar',
      category: 'Avatar',
      status: 'configured',
      models: ['Avatar IV 4K'],
      latency: '1.2s/sec',
    },
    {
      id: 'plat-5',
      name: 'Flux.1 Pro / Midjourney',
      category: 'Image',
      status: 'connected',
      models: ['Flux.1 Schnell', 'Flux.1 Pro'],
      latency: '800ms',
    },
  ]);

  const [scripts, setScripts] = useState<GeneratedScript[]>([
    {
      id: 'SCR-101',
      topic: 'Làm Kế toán VAS 133 siêu tốc bằng AI Trợ lý',
      targetProduct: 'LedgerFlow OS',
      hook: '🔥 Bạn mất 3 ngày làm báo cáo tài chính? AI này gõ 1 câu ra nguyên sổ kế toán!',
      voiceScript: 'Đừng tự gõ từng bút toán tay nữa! LedgerFlow Studio tích hợp AI Gateway tự động rà soát Thông tư 133/200, đối chiếu VAT và xuất báo cáo chuẩn xác trong 10 giây.',
      scenePrompt: 'Cinematic close-up of developer laptop glowing with cyberpunk accounting dashboard, ultra realistic 4k, smooth camera zoom-in.',
      ctaText: '👉 Bấm link Bio dùng thử LedgerFlow Studio miễn phí hôm nay!',
      affiliateTag: '#LedgerFlow #KetoanAI #VAS133',
    },
    {
      id: 'SCR-102',
      topic: 'Review Game 3D làm bằng WebGL & ML Engine',
      targetProduct: 'Studio Game & ML',
      hook: '🎮 Game 3D chạy thẳng trên trình duyệt không cần tải, đồ họa mượt 60fps!',
      voiceScript: 'Trải nghiệm tựa game simulation thế hệ mới được dựng hoàn toàn bằng WebGL & ML Engine. Đồ họa chân thực, tương tác AI sống động.',
      scenePrompt: 'Action camera view inside a futuristic 3D WebGL game engine with glowing neon particles and smooth physics simulation.',
      ctaText: '👉 Chơi thử ngay trên web không cần cài đặt!',
      affiliateTag: '#Game3D #WebGLEngine #LedgerFlowStudio',
    },
  ]);

  const handleGenerateScript = () => {
    if (!videoTopic.trim() || isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      const newScript: GeneratedScript = {
        id: `SCR-${Date.now().toString().slice(-3)}`,
        topic: videoTopic,
        targetProduct: selectedProduct,
        hook: `🚀 ${videoTopic} — Bí quyết thành công cho Founder & Creator!`,
        voiceScript: `Khám phá ngay giải pháp ${selectedProduct} giúp bạn tiết kiệm 80% thời gian vận hành và tối ưu hóa doanh thu tiếp thị đa kênh tự động.`,
        scenePrompt: `High quality studio lighting, modern tech workspace with glowing hologram screen showing ${selectedProduct} interface.`,
        ctaText: `👉 Nhấp vào link bên dưới để trải nghiệm ${selectedProduct} ngay!`,
        affiliateTag: `#${selectedProduct.replace(/\s+/g, '')} #AIVideo #Affiliate`,
      };
      setScripts([newScript, ...scripts]);
      setIsGenerating(false);
    }, 1200);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-6 text-left select-none animate-fade-in">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">AI Video Production Engine</p>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Xưởng Sản xuất Video Tự động bằng AI</h1>
            <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
              Quy trình khép kín: Sinh kịch bản Hook thu hút ➔ Tạo giọng đọc ElevenLabs ➔ Dựng Video AI (Runway/Luma/Sora) ➔ Tự động đính kèm Link Affiliate & Lead Sản phẩm.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-black text-emerald-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> AI Engine Online
            </span>
          </div>
        </div>
      </section>

      {/* AI Platform Connectors Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {aiPlatforms.map((plat) => (
          <div key={plat.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 space-y-2 backdrop-blur-md hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">{plat.category}</span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> {plat.latency}
              </span>
            </div>
            <h3 className="text-xs font-black text-white">{plat.name}</h3>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{plat.models.join(' · ')}</p>
          </div>
        ))}
      </div>

      {/* Script Generator & Prompt Studio */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Generator Form (1 Col) */}
        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Wand2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Script & Video Studio</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Sản phẩm tiếp thị mục tiêu</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="LedgerFlow OS">LedgerFlow OS (Phần mềm Kế toán AI)</option>
                <option value="Studio Game & ML">Studio Game 3D & ML Engine</option>
                <option value="AI Workforce">AI Workforce (Đội ngũ Trợ lý AI)</option>
                <option value="Affiliate Item">Sản phẩm Affiliate (Shopee/SaaS đối tác)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Chủ đề / Góc tiếp cận Video</label>
              <textarea
                value={videoTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 p-3 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none resize-none"
                placeholder="VD: Hướng dẫn tự động làm sổ kế toán VAS 133 bằng AI..."
              />
            </div>

            <button
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang Tạo Kịch Bản & Prompt AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Sinh Kịch Bản & Prompt Dựng Video
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Scripts Queue (2 Cols) */}
        <div className="xl:col-span-2 space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Hàng Đợi Kịch Bản & Prompt AI Video</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{scripts.length} Kịch bản đã sẵn sàng</span>
          </div>

          <div className="space-y-4">
            {scripts.map((sc) => (
              <div key={sc.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">{sc.id}</span>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase">Mục tiêu: {sc.targetProduct}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(sc.id, `${sc.hook}\n\n${sc.voiceScript}\n\n${sc.scenePrompt}\n\n${sc.ctaText}`)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                  >
                    {copiedId === sc.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Full Script</span>
                  </button>
                </div>

                <h3 className="text-sm font-black text-white">{sc.topic}</h3>

                <div className="space-y-2 text-xs font-semibold">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-rose-200">
                    <strong className="text-rose-400 uppercase text-[10px] block mb-1">🎣 Hook Thu Hút (3 Giây Đầu):</strong>
                    {sc.hook}
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-cyan-200">
                    <strong className="text-cyan-400 uppercase text-[10px] block mb-1">🎙️ Lời Thoại ElevenLabs / AI Voice:</strong>
                    {sc.voiceScript}
                  </div>

                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-purple-200">
                    <strong className="text-purple-400 uppercase text-[10px] block mb-1">🎬 Prompt Dựng Video (Runway / Luma / Sora):</strong>
                    <code className="text-[11px] font-mono text-purple-300">{sc.scenePrompt}</code>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-bold">
                    <span className="text-emerald-400">{sc.ctaText}</span>
                    <span className="text-slate-500">{sc.affiliateTag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
