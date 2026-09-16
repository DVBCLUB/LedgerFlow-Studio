import React, { useEffect, useState } from 'react';
import { Sparkles, Mic, Film, Layers, Play, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Image as ImageIcon, Music, Boxes, Camera, Rocket, QrCode, CreditCard, KeyRound, Hammer, ShieldCheck, Package, Bot, Gamepad2, Video, Palette, Code2 } from 'lucide-react';
import {
  getAssetFoundryStats,
  listFoundryAssets,
  getFfmpegStatus,
  generateFoundryImage,
  synthesizeFoundrySpeech,
  submitFoundryVideo,
  pollFoundryVideo,
  renderFoundryVideo,
  captureFoundryFrames,
  publishFoundryAsset,
  listFoundryPublishes,
  generateFoundryVietQr,
  generateFoundryStripeLink,
  issueFoundryLicense,
  buildFoundrySource,
  packageFoundryRelease,
  computeFoundryChecksum,
  signFoundryAsset,
  verifyFoundryAsset,
  assetFileUrl,
  generateBlender3DScript,
  bridge3DToGameBinding,
  bridge3DToVideoBinding,
  generateCanvaGraphicPlan,
  generateFfmpegRenderScript,
  type AssetRecord,
  type VideoJob,
  type PublishRecord,
} from '../../utils/assetFoundryApi';

type Tab = 'free_tools' | 'image' | 'tts' | 'video' | 'capture' | 'publish' | 'build' | 'registry';

export default function AssetFoundryPanel() {
  const [tab, setTab] = useState<Tab>('free_tools');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'free_tools'} onClick={() => setTab('free_tools')} icon={<Bot className="w-4 h-4 text-emerald-400" />} label="🤖 Robot Free Tools ($0)" />
        <TabButton active={tab === 'image'} onClick={() => setTab('image')} icon={<ImageIcon className="w-4 h-4" />} label="Sinh ảnh" />
        <TabButton active={tab === 'tts'} onClick={() => setTab('tts')} icon={<Music className="w-4 h-4" />} label="TTS / Giọng đọc" />
        <TabButton active={tab === 'video'} onClick={() => setTab('video')} icon={<Film className="w-4 h-4" />} label="Video AI" />
        <TabButton active={tab === 'capture'} onClick={() => setTab('capture')} icon={<Camera className="w-4 h-4" />} label="Capture" />
        <TabButton active={tab === 'publish'} onClick={() => setTab('publish')} icon={<Rocket className="w-4 h-4" />} label="Publish & Pay" />
        <TabButton active={tab === 'build'} onClick={() => setTab('build')} icon={<Hammer className="w-4 h-4" />} label="Build & Sign" />
        <TabButton active={tab === 'registry'} onClick={() => setTab('registry')} icon={<Boxes className="w-4 h-4" />} label="Asset Registry" />
      </div>

      {tab === 'free_tools' && <FreeTools3DTab />}
      {tab === 'image' && <ImageTab />}
      {tab === 'tts' && <TtsTab />}
      {tab === 'video' && <VideoTab />}
      {tab === 'capture' && <CaptureTab />}
      {tab === 'publish' && <PublishTab />}
      {tab === 'build' && <BuildTab />}
      {tab === 'registry' && <RegistryTab />}
    </div>
  );
}


function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatusLine({ ok, error }: { ok: boolean; error?: string }) {
  if (!error) return null;
  return (
    <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span className="whitespace-pre-wrap">{error}</span>
    </div>
  );
}

function ImageTab() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('flux1');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const r = await generateFoundryImage({ prompt, provider, width, height });
      setResult(r);
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="🖼️ Image Generation (Flux / Replicate / Leonardo / ComfyUI)">
      <div className="space-y-3">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mô tả hình ảnh cần tạo..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[90px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="flux1">Flux.1 (BFL)</option>
            <option value="replicate">Replicate</option>
            <option value="leonardo">Leonardo.ai</option>
            <option value="comfyui">ComfyUI (local)</option>
          </select>
          <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" title="Width" />
          <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" title="Height" />
          <button onClick={run} disabled={loading || !prompt} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo ảnh
          </button>
        </div>
        {result && (
          <div className="space-y-2">
            <StatusLine ok={result.ok} error={result.ok ? `✅ Done — ${result.provider}${result.model ? ` · ${result.model}` : ''} · CID ${result.cid}` : result.error} />
            {(result.remoteUrl || result.filePath) && (
              <img src={result.remoteUrl || (result.cid ? assetFileUrl(result.cid) : undefined)} alt="generated" className="max-h-72 rounded-lg border border-slate-200" />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function TtsTab() {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState('elevenlabs');
  const [voice, setVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const r = await synthesizeFoundrySpeech({ text, provider, voice: voice || undefined });
      setResult(r);
    } catch (e: any) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="🎙️ Text-to-Speech (ElevenLabs / Edge TTS)">
      <div className="space-y-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập lời thoại cần đọc..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[90px]" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="elevenlabs">ElevenLabs</option>
            <option value="edge">Edge TTS (free)</option>
          </select>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="">Giọng mặc định</option>
            <option value="vi_female">Việt — Nữ</option>
            <option value="vi_male">Việt — Nam</option>
            <option value="en_female">Anh — Nữ</option>
            <option value="en_male">Anh — Nam</option>
          </select>
          <button onClick={run} disabled={loading || !text} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />} Tạo giọng đọc
          </button>
        </div>
        {result && (
          <div className="space-y-2">
            <StatusLine ok={result.ok} error={result.ok ? `✅ Done — ${result.provider} · CID ${result.cid}` : result.error} />
            {result.ok && result.cid && <audio controls src={assetFileUrl(result.cid)} className="w-full" />}
          </div>
        )}
      </div>
    </Card>
  );
}

function VideoTab() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('runway');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    setJob(null);
    try {
      const r = await submitFoundryVideo({ prompt, provider, aspectRatio });
      if (r.ok && r.job) setJob(r.job);
      else setError(r.error || 'Submit failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function poll() {
    if (!job) return;
    setLoading(true);
    setError('');
    try {
      const r = await pollFoundryVideo(job.jobId);
      if (r.job) setJob(r.job);
      if (!r.ok) setError(r.error || 'Poll failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="🎬 AI Video (Runway / Kling / Luma — submit + poll)">
      <div className="space-y-3">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mô tả cảnh video..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[90px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="runway">Runway Gen-3</option>
            <option value="kling">Kling AI</option>
            <option value="luma">Luma</option>
          </select>
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
            <option value="9:16">9:16 (TikTok)</option>
            <option value="16:9">16:9 (YouTube)</option>
            <option value="1:1">1:1</option>
          </select>
          <button onClick={submit} disabled={loading || !prompt} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Submit
          </button>
          <button onClick={poll} disabled={loading || !job} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Poll
          </button>
        </div>
        {error && <StatusLine ok={false} error={error} />}
        {job && (
          <div className="text-xs text-slate-600 space-y-1">
            <div>Job: <span className="font-mono">{job.jobId}</span> · Provider: {job.provider} · Status: {job.status}</div>
            {job.videoUrl && (
              <div className="space-y-2">
                <video controls src={job.videoUrl} className="w-full max-h-72 rounded-lg border border-slate-200" />
                <a href={job.videoUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Mở video</a>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function RegistryTab() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [ffmpeg, setFfmpeg] = useState<{ available: boolean; path: string | null } | null>(null);
  const [imageCids, setImageCids] = useState('');
  const [renderResult, setRenderResult] = useState<any>(null);
  const [rendering, setRendering] = useState(false);

  async function refresh() {
    try {
      const [a, s, f] = await Promise.all([listFoundryAssets(), getAssetFoundryStats(), getFfmpegStatus()]);
      setAssets(a.assets || []);
      setStats(s.stats);
      setFfmpeg(f.ffmpeg);
    } catch {
      /* offline */
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function render() {
    setRendering(true);
    setRenderResult(null);
    try {
      const r = await renderFoundryVideo({ imageCids: imageCids.split(',').map((s) => s.trim()).filter(Boolean) });
      setRenderResult(r);
      refresh();
    } catch (e: any) {
      setRenderResult({ ok: false, error: e.message });
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="🗂️ Asset Registry (content-addressed DAG)">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {stats && <span>📦 {stats.totalAssets} assets · {Math.round(stats.totalBytes / 1024)} KB</span>}
          {ffmpeg && <span>{ffmpeg.available ? '🎬 FFmpeg sẵn sàng' : '⚠️ FFmpeg chưa cài (render local bị tắt)'}</span>}
          <button onClick={refresh} className="inline-flex items-center gap-1 text-indigo-600 hover:underline"><RefreshCw className="w-4 h-4" /> Làm mới</button>
        </div>
      </Card>

      <Card title="🎞️ Render MP4 từ ảnh (FFmpeg slideshow)">
        <div className="space-y-3">
          <input value={imageCids} onChange={(e) => setImageCids(e.target.value)} placeholder="CID các ảnh, phân cách bởi dấu phẩy (vd: sha256-abc, sha256-def)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={render} disabled={rendering || !imageCids} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Render
          </button>
          {renderResult && <StatusLine ok={renderResult.ok} error={renderResult.ok ? `✅ Done — ${renderResult.outputName} · CID ${renderResult.cid}` : renderResult.error} />}
        </div>
      </Card>

      <div className="space-y-2">
        {assets.length === 0 && <div className="text-sm text-slate-400">Chưa có asset nào. Hãy tạo ảnh/TTS/video trước.</div>}
        {assets.map((a) => (
          <div key={a.cid} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3">
            <div className="text-xs font-mono text-slate-500 truncate flex-1">{a.cid}</div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{a.kind}</span>
            <span className="text-xs text-slate-400">{a.name}</span>
            {(a.kind === 'image' || a.kind === 'audio' || a.kind === 'video') && a.filePath && (
              <a href={assetFileUrl(a.cid)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">Mở</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CaptureTab() {
  const [url, setUrl] = useState('');
  const [durationSec, setDurationSec] = useState(6);
  const [fps, setFps] = useState(1);
  const [loading, setLoading] = useState(false);
  const [frameCids, setFrameCids] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [renderResult, setRenderResult] = useState<any>(null);

  async function capture() {
    setLoading(true);
    setError('');
    setFrameCids([]);
    setRenderResult(null);
    try {
      const r = await captureFoundryFrames({ url, durationSec, fps, viewport: { width: 1080, height: 1920 } });
      if (r.ok) setFrameCids(r.frameCids);
      else setError(r.error || 'Capture failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function render() {
    setLoading(true);
    setRenderResult(null);
    try {
      const r = await renderFoundryVideo({ imageCids: frameCids });
      setRenderResult(r);
    } catch (e: any) {
      setRenderResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="📸 Capture Code/Gameplay → Marketing Video">
      <div className="space-y-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL app/game cần quay (vd: http://127.0.0.1:3000)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" title="Duration (s)" />
          <input type="number" value={fps} onChange={(e) => setFps(Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" title="FPS" />
          <button onClick={capture} disabled={loading || !url} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Chụp
          </button>
        </div>
        {error && <StatusLine ok={false} error={error} />}
        {frameCids.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">Đã chụp {frameCids.length} frames</div>
            <button onClick={render} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm disabled:opacity-50">
              <Layers className="w-4 h-4" /> Render MP4 từ frames
            </button>
            {renderResult && <StatusLine ok={renderResult.ok} error={renderResult.ok ? `✅ ${renderResult.outputName} · CID ${renderResult.cid}` : renderResult.error} />}
          </div>
        )}
      </div>
    </Card>
  );
}

function PublishTab() {
  const [assetCid, setAssetCid] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('github_release');
  const [repo, setRepo] = useState('');
  const [itchTarget, setItchTarget] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<any>(null);
  const [publishes, setPublishes] = useState<PublishRecord[]>([]);

  const [vietqr, setVietqr] = useState<any>(null);
  const [amountVnd, setAmountVnd] = useState(0);
  const [stripe, setStripe] = useState<any>(null);
  const [amountUsd, setAmountUsd] = useState(0);
  const [license, setLicense] = useState<any>(null);

  async function refreshPublishes() {
    try {
      const r = await listFoundryPublishes();
      setPublishes(r.publishes || []);
    } catch { /* offline */ }
  }

  useEffect(() => { refreshPublishes(); }, []);

  async function publish() {
    setPublishing(true);
    setPublishMsg(null);
    try {
      const r = await publishFoundryAsset({ assetCid, channel, title, repo: repo || undefined, itchTarget: itchTarget || undefined });
      setPublishMsg(r);
      refreshPublishes();
    } catch (e: any) {
      setPublishMsg({ ok: false, error: e.message });
    } finally {
      setPublishing(false);
    }
  }

  async function makeVietqr() {
    const r = await generateFoundryVietQr({ amountVnd, addInfo: title || 'LedgerFlow' });
    setVietqr(r);
  }

  async function makeStripe() {
    const r = await generateFoundryStripeLink({ amountUsd, title: title || 'LedgerFlow product' });
    setStripe(r);
  }

  async function makeLicense() {
    const r = await issueFoundryLicense({ productName: title || 'LedgerFlow' });
    setLicense(r);
  }

  return (
    <div className="space-y-4">
      <Card title="🚀 Publish Asset">
        <div className="space-y-3">
          <input value={assetCid} onChange={(e) => setAssetCid(e.target.value)} placeholder="CID asset cần xuất bản" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bản phát hành" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
              <option value="github_release">GitHub Release</option>
              <option value="itch_io">itch.io</option>
              <option value="steam">Steam</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            {channel === 'github_release' && (
              <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo (GitHub)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            )}
            {channel === 'itch_io' && (
              <input value={itchTarget} onChange={(e) => setItchTarget(e.target.value)} placeholder="user/game:channel (itch.io)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            )}
            {(channel === 'steam' || channel === 'tiktok' || channel === 'youtube') && (
              <div className="text-xs text-slate-500 px-2 py-2">
                {channel === 'steam' ? 'Dùng STEAMCMD_PATH + STEAM_BUILD_VDF + STEAM_USER' : channel === 'tiktok' ? 'Dùng TIKTOK_ACCESS_TOKEN' : 'Dùng YOUTUBE_ACCESS_TOKEN'}
              </div>
            )}
          </div>
          <button onClick={publish} disabled={publishing || !assetCid} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Publish
          </button>
          {publishMsg && <StatusLine ok={publishMsg.ok} error={publishMsg.ok ? `✅ Published — ${publishMsg.record?.url || publishMsg.record?.status}` : publishMsg.error} />}
        </div>
      </Card>

      <Card title="💰 Thu tiền (VietQR / Stripe / License)">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="number" value={amountVnd} onChange={(e) => setAmountVnd(Number(e.target.value))} placeholder="Số tiền VND" className="rounded-lg border border-slate-300 px-2 py-2 text-sm flex-1" />
            <button onClick={makeVietqr} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm"><QrCode className="w-4 h-4" /> VietQR</button>
          </div>
          {vietqr && <img src={vietqr.url} alt="VietQR" className="h-40 rounded-lg border border-slate-200" />}

          <div className="flex items-center gap-2">
            <input type="number" value={amountUsd} onChange={(e) => setAmountUsd(Number(e.target.value))} placeholder="Số tiền USD" className="rounded-lg border border-slate-300 px-2 py-2 text-sm flex-1" />
            <button onClick={makeStripe} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 text-white px-3 py-2 text-sm"><CreditCard className="w-4 h-4" /> Stripe</button>
          </div>
          {stripe && <StatusLine ok={stripe.ok} error={stripe.ok ? `✅ ${stripe.url}` : stripe.error} />}

          <button onClick={makeLicense} className="inline-flex items-center gap-2 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm"><KeyRound className="w-4 h-4" /> Phát hành License Key</button>
          {license && <StatusLine ok={license.ok} error={`✅ ${license.licenseKey}`} />}
        </div>
      </Card>

      <div className="space-y-2">
        {publishes.length === 0 && <div className="text-sm text-slate-400">Chưa có bản xuất bản nào.</div>}
        {publishes.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
            <span className="font-mono text-slate-500 truncate flex-1">{p.title}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{p.channel}</span>
            <span className={p.status === 'published' ? 'text-emerald-600' : p.status === 'failed' ? 'text-red-600' : 'text-slate-400'}>{p.status}</span>
            {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Mở</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildTab() {
  const [sourceDir, setSourceDir] = useState('');
  const [entryFile, setEntryFile] = useState('');
  const [platform, setPlatform] = useState<'node' | 'browser'>('node');
  const [outName, setOutName] = useState('');
  const [buildMsg, setBuildMsg] = useState<any>(null);
  const [building, setBuilding] = useState(false);

  const [cid, setCid] = useState('');
  const [checksum, setChecksum] = useState('');
  const [signature, setSignature] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const [pkgCids, setPkgCids] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgMsg, setPkgMsg] = useState<any>(null);

  async function build() {
    setBuilding(true);
    setBuildMsg(null);
    try {
      const r = await buildFoundrySource({ sourceDir, entryFile, platform, outName: outName || undefined });
      setBuildMsg(r);
      if (r.cid) setCid(r.cid);
    } catch (e: any) {
      setBuildMsg({ ok: false, error: e.message });
    } finally {
      setBuilding(false);
    }
  }

  async function doChecksum() {
    const r = await computeFoundryChecksum(cid);
    if (r.ok) setChecksum(r.checksum || '');
  }

  async function doSign() {
    const r = await signFoundryAsset(cid);
    if (r.ok) setSignature(r.signature || '');
  }

  async function doVerify() {
    const r = await verifyFoundryAsset(cid, verifyInput);
    setVerifyResult(r);
  }

  async function doPackage() {
    const r = await packageFoundryRelease({ assetCids: pkgCids.split(',').map((s) => s.trim()).filter(Boolean), outName: pkgName });
    setPkgMsg(r);
  }

  return (
    <div className="space-y-4">
      <Card title="🔨 Build (esbuild bundle)">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={sourceDir} onChange={(e) => setSourceDir(e.target.value)} placeholder="Thư mục nguồn (sourceDir)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            <input value={entryFile} onChange={(e) => setEntryFile(e.target.value)} placeholder="entryFile (vd: src/main.ts)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            <select value={platform} onChange={(e) => setPlatform(e.target.value as any)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
              <option value="node">node</option>
              <option value="browser">browser</option>
            </select>
            <input value={outName} onChange={(e) => setOutName(e.target.value)} placeholder="outName (vd: app.js)" className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          </div>
          <button onClick={build} disabled={building || !entryFile} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />} Build
          </button>
          {buildMsg && <StatusLine ok={buildMsg.ok} error={buildMsg.ok ? `✅ ${buildMsg.status} · CID ${buildMsg.cid} · ${buildMsg.bytes} bytes` : buildMsg.error} />}
        </div>
      </Card>

      <Card title="🛡️ Checksum / Sign / Verify">
        <div className="space-y-3">
          <input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="CID asset" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2">
            <button onClick={doChecksum} disabled={!cid} className="inline-flex items-center gap-2 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm disabled:opacity-50"><ShieldCheck className="w-4 h-4" /> Checksum</button>
            <button onClick={doSign} disabled={!cid} className="inline-flex items-center gap-2 rounded-lg bg-slate-600 text-white px-3 py-2 text-sm disabled:opacity-50"><ShieldCheck className="w-4 h-4" /> Ký (HMAC)</button>
          </div>
          {checksum && <div className="text-xs font-mono text-slate-600 break-all">Checksum: {checksum}</div>}
          {signature && <div className="text-xs font-mono text-slate-600 break-all">Signature: {signature}</div>}
          <div className="flex items-center gap-2">
            <input value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} placeholder="Signature cần xác minh" className="rounded-lg border border-slate-300 px-2 py-2 text-sm flex-1" />
            <button onClick={doVerify} disabled={!cid || !verifyInput} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm disabled:opacity-50"><ShieldCheck className="w-4 h-4" /> Verify</button>
          </div>
          {verifyResult && <StatusLine ok={verifyResult.ok && verifyResult.valid} error={verifyResult.valid ? '✅ Chữ ký hợp lệ' : `❌ ${verifyResult.error || 'Chữ ký không hợp lệ'}`} />}
        </div>
      </Card>

      <Card title="📦 Package Release">
        <div className="space-y-3">
          <input value={pkgCids} onChange={(e) => setPkgCids(e.target.value)} placeholder="CID các asset (phân cách dấu phẩy)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="Tên bản phát hành" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={doPackage} disabled={!pkgCids || !pkgName} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            <Package className="w-4 h-4" /> Package
          </button>
          {pkgMsg && <StatusLine ok={pkgMsg.ok} error={pkgMsg.ok ? `✅ ${pkgMsg.dirPath}` : pkgMsg.error} />}
        </div>
      </Card>
    </div>
  );
}

function FreeTools3DTab() {
  const [characterName, setCharacterName] = useState('Glacia_CyberHero');
  const [archetype, setArchetype] = useState<'humanoid' | 'stylized_avatar' | 'chibi_mascot' | 'cyber_warrior'>('humanoid');
  const [primaryColor, setPrimaryColor] = useState('#38bdf8');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [loading, setLoading] = useState(false);
  const [blenderScript, setBlenderScript] = useState('');
  const [gameBinding, setGameBinding] = useState<any>(null);
  const [videoBinding, setVideoBinding] = useState<any>(null);
  const [canvaPlan, setCanvaPlan] = useState<any>(null);
  const [ffmpegScript, setFfmpegScript] = useState<any>(null);
  const [activeOutput, setActiveOutput] = useState<'blender' | 'game' | 'video' | 'canva' | 'ffmpeg'>('blender');

  const currentSpec = {
    characterName,
    archetype,
    meshDetails: {
      height: archetype === 'chibi_mascot' ? 1.3 : 1.75,
      headScale: archetype === 'chibi_mascot' ? 1.5 : 1.0,
      primaryColorHex: primaryColor,
      secondaryColorHex: secondaryColor,
      metallic: 0.7,
      roughness: 0.3,
    },
    exportFormat: 'glb',
    outputFilename: `runtime/assets/3d/${characterName.toLowerCase()}.glb`,
    includeArmatureRig: true,
  };

  const handleGenerateBlender = async () => {
    setLoading(true);
    try {
      const res = await generateBlender3DScript(currentSpec);
      if (res.ok) {
        setBlenderScript(res.script);
        setActiveOutput('blender');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBridgeGame = async () => {
    setLoading(true);
    try {
      const res = await bridge3DToGameBinding(currentSpec, 'hybrid');
      if (res.ok) {
        setGameBinding(res.binding);
        setActiveOutput('game');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBridgeVideo = async () => {
    setLoading(true);
    try {
      const res = await bridge3DToVideoBinding(currentSpec, {
        backgroundVideo: 'studio_b_roll.mp4',
        outputVideo: `${characterName.toLowerCase()}_presentation.mp4`,
      });
      if (res.ok) {
        setVideoBinding(res.binding);
        setActiveOutput('video');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCanva = async () => {
    setLoading(true);
    try {
      const res = await generateCanvaGraphicPlan({
        title: `Giới Thiệu Sản Phẩm & Nhân Vật 3D: ${characterName}`,
        theme: 'dark_cyber',
        dimensions: { width: 1920, height: 1080 },
      });
      if (res.ok) {
        setCanvaPlan(res.plan);
        setActiveOutput('canva');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFfmpeg = async () => {
    setLoading(true);
    try {
      const res = await generateFfmpegRenderScript({
        outputName: `${characterName.toLowerCase()}_viral_showcase`,
        totalDurationSec: 45,
        scenesCount: 4,
        hasVoiceNarration: true,
      });
      if (res.ok) {
        setFfmpegScript(res.videoScript);
        setActiveOutput('ffmpeg');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl border border-indigo-800/40 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Xưởng Tự Động Hóa Công Cụ Miễn Phí ($0 Free Tool Studio)</h2>
              <p className="text-xs text-slate-400">AI đóng vai trò bộ não sinh tham số kịch bản & Robot thao tác trên Blender, Canva, FFmpeg, Đa IDE không tốn API</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-300">
            $0 Local GPU/CPU Render
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 3D Character & Free Tool Configurator */}
        <div className="space-y-4">
          <Card title="🎨 Thiết Kế Nhân Vật 3D & Tham Số">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tên Nhân Vật (Character ID)</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Phong Cách Nhân Vật (Archetype)</label>
                <select
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="humanoid">👤 Humanoid (Người thật / MC Doanh Nghiệp)</option>
                  <option value="cyber_warrior">⚡ Cyber Warrior (Chiến Binh Game Tương Lai)</option>
                  <option value="chibi_mascot">🐣 Chibi Mascot (Linh Vật Đáng Yêu TikTok)</option>
                  <option value="stylized_avatar">✨ Stylized Avatar (Avatar 3D Cách Điệu)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Màu Chủ Đạo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 p-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Màu Thứ Cấp</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 p-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="⚡ 1-Click Điều Phối Robot Thực Thi $0">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerateBlender}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Code2 className="w-4 h-4" /> 1. Sinh Script Blender (bpy) Headless</span>
                <span className="text-[10px] bg-orange-800/60 px-1.5 py-0.5 rounded">.glb $0</span>
              </button>

              <button
                onClick={handleBridgeGame}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Gamepad2 className="w-4 h-4" /> 2. Nạp Vào Game (WASD & Touch Mobile)</span>
                <span className="text-[10px] bg-indigo-800/60 px-1.5 py-0.5 rounded">Player Hero</span>
              </button>

              <button
                onClick={handleBridgeVideo}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Video className="w-4 h-4" /> 3. Nạp Vào Video AI (MC Chroma-Key)</span>
                <span className="text-[10px] bg-emerald-800/60 px-1.5 py-0.5 rounded">FFmpeg $0</span>
              </button>

              <button
                onClick={handleGenerateCanva}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> 4. Kịch Bản Đồ Họa Canva 4K</span>
                <span className="text-[10px] bg-cyan-800/60 px-1.5 py-0.5 rounded">DOM CDP</span>
              </button>

              <button
                onClick={handleGenerateFfmpeg}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Film className="w-4 h-4" /> 5. Render Video Đa Scene FFmpeg</span>
                <span className="text-[10px] bg-rose-800/60 px-1.5 py-0.5 rounded">Shell Concat</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Middle & Right: Realtime Output Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveOutput('blender')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeOutput === 'blender' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Blender Python (bpy)
            </button>
            <button
              onClick={() => setActiveOutput('game')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeOutput === 'game' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Game WASD & Touch Mobile
            </button>
            <button
              onClick={() => setActiveOutput('video')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeOutput === 'video' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Video MC Chroma-Key
            </button>
            <button
              onClick={() => setActiveOutput('canva')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeOutput === 'canva' ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Canva Plan
            </button>
            <button
              onClick={() => setActiveOutput('ffmpeg')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${activeOutput === 'ffmpeg' ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              FFmpeg Multi-Track
            </button>
          </div>

          {activeOutput === 'blender' && (
            <Card title="🐍 Kịch Bản Python Blender (bpy) Headless $0">
              {blenderScript ? (
                <div className="space-y-3">
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono max-h-80 overflow-y-auto whitespace-pre leading-relaxed border border-slate-800">
                    {blenderScript}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>Lệnh chạy: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">blender --background --python script.py</code></span>
                    <button
                      onClick={() => navigator.clipboard.writeText(blenderScript)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs"
                    >
                      Copy Script
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">
                  Bấm nút <span className="font-semibold text-orange-600">"1. Sinh Script Blender (bpy)"</span> để xuất mã nguồn 3D model.
                </div>
              )}
            </Card>
          )}

          {activeOutput === 'game' && (
            <Card title="🎮 Cấu Hình Nhân Vật Điều Khiển Trong Game (Hero & NPC)">
              {gameBinding ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div><span className="font-semibold text-slate-700">Tên Nhân Vật:</span> {gameBinding.characterName}</div>
                    <div><span className="font-semibold text-slate-700">File 3D Mesh:</span> {gameBinding.modelPath}</div>
                    <div><span className="font-semibold text-slate-700">Điều Khiển PC:</span> {gameBinding.controls.moveForward}</div>
                    <div><span className="font-semibold text-slate-700">Điều Khiển Mobile:</span> D-Pad Cảm Ứng + Nút Nhảy</div>
                  </div>
                  <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto whitespace-pre border border-slate-800">
                    {JSON.stringify(gameBinding, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">
                  Bấm nút <span className="font-semibold text-indigo-600">"2. Nạp Vào Game"</span> để kết nối model 3D với Game Controller.
                </div>
              )}
            </Card>
          )}

          {activeOutput === 'video' && (
            <Card title="🎬 MC Ảo & Khẩu Hình Lip-Sync Nền Xanh Chroma-Key FFmpeg">
              {videoBinding ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div><span className="font-semibold text-slate-700">Tên MC Ảo:</span> {videoBinding.actorName}</div>
                    <div><span className="font-semibold text-slate-700">Màu Phông Xanh:</span> {videoBinding.chromaKeyColorHex}</div>
                    <div><span className="font-semibold text-slate-700">Đồng Bộ Khẩu Hình:</span> {videoBinding.visemeSyncMode}</div>
                    <div><span className="font-semibold text-slate-700">Engine Tách Nền:</span> FFmpeg colorkey filter</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Câu Lệnh FFmpeg Ghép MC Vào Video:</label>
                    <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono break-all border border-slate-800">
                      {videoBinding.ffmpegChromaOverlayCommand}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">
                  Bấm nút <span className="font-semibold text-emerald-600">"3. Nạp Vào Video AI"</span> để đưa nhân vật làm MC thuyết trình.
                </div>
              )}
            </Card>
          )}

          {activeOutput === 'canva' && (
            <Card title="🖼️ Kịch Bản Tự Động Hóa Đồ Họa Canva / Photopea 4K">
              {canvaPlan ? (
                <div className="space-y-3">
                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div><span className="font-semibold text-slate-700">Tiêu Đề:</span> {canvaPlan.title}</div>
                    <div><span className="font-semibold text-slate-700">Kích Thước:</span> {canvaPlan.dimensions.width} x {canvaPlan.dimensions.height} px (4K Ultra HD)</div>
                    <div><span className="font-semibold text-slate-700">Số Lượng Element:</span> {canvaPlan.elements.length} thành phần đồ họa</div>
                  </div>
                  <div className="bg-slate-900 text-cyan-300 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto whitespace-pre border border-slate-800">
                    {canvaPlan.domExecutionScript}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">
                  Bấm nút <span className="font-semibold text-cyan-600">"4. Kịch Bản Đồ Họa Canva"</span> để lập kế hoạch thiết kế poster.
                </div>
              )}
            </Card>
          )}

          {activeOutput === 'ffmpeg' && (
            <Card title="🎞️ Kịch Bản Render Video Đa Phân Cảnh & Phụ Đề FFmpeg">
              {ffmpegScript ? (
                <div className="space-y-3">
                  <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div><span className="font-semibold text-slate-700">File Xuất:</span> {ffmpegScript.outputVideoFile}</div>
                    <div><span className="font-semibold text-slate-700">Thời Lượng:</span> {ffmpegScript.durationSec} giây</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">PowerShell Command (Windows):</label>
                    <div className="bg-slate-900 text-rose-400 p-3 rounded-lg text-xs font-mono break-all border border-slate-800">
                      {ffmpegScript.powershellScript}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-10 text-center">
                  Bấm nút <span className="font-semibold text-rose-600">"5. Render Video Đa Scene FFmpeg"</span> để xuất script render.
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

