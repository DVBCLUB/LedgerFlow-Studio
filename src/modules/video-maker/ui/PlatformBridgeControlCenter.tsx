import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Sparkles,
  Bot,
  Mic,
  Video,
  Film,
  Code2,
  Copy,
  Download,
  Play,
  Volume2,
  CheckCircle2,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface EdgeVoice {
  shortName: string;
  gender: string;
  locale: string;
  friendlyName: string;
}

export default function PlatformBridgeControlCenter() {
  const [activeTab, setActiveTab] = useState<'aistudio' | 'edgetts' | 'video_ai' | 'capcut_remotion'>('aistudio');

  // Google AI Studio state
  const [aiStudioModel, setAiStudioModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash'>('gemini-2.5-pro');
  const [aiStudioPrompt, setAiStudioPrompt] = useState(
    'Phân tích kiến trúc hệ điều hành công ty phần mềm LedgerFlow Studio và đề xuất lộ trình tối ưu chi phí hạ tầng'
  );
  const [aiStudioPack, setAiStudioPack] = useState<any | null>(null);

  // Edge TTS state
  const [voices, setVoices] = useState<EdgeVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-HoaiMyNeural');
  const [ttsText, setTtsText] = useState(
    'Chào mừng bạn đến với hệ điều hành LedgerFlow Studio. Mọi quy trình phần mềm, game và video AI đã được kích hoạt hoàn toàn tự động.'
  );
  const [ttsJob, setTtsJob] = useState<any | null>(null);

  // Video AI Prompt state
  const [videoPlatform, setVideoPlatform] = useState<'kling' | 'luma' | 'haiper'>('kling');
  const [cameraMove, setCameraMove] = useState<'cinematic_dolly' | 'orbit_left' | 'zoom_in'>('cinematic_dolly');
  const [sceneDesc, setSceneDesc] = useState(
    'Cận cảnh một lập trình viên tương lai gõ phím, màn hình hologram hiển thị các robot AI đang tự động sửa code'
  );
  const [videoPromptSpec, setVideoPromptSpec] = useState<any | null>(null);

  // CapCut & Remotion state
  const [capcutResult, setCapcutResult] = useState<any | null>(null);
  const [remotionResult, setRemotionResult] = useState<any | null>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadVoices = useCallback(async () => {
    try {
      const res = await fetch('/api/connectors/edge-tts/voices').then((r) => r.json());
      if (res.success) setVoices(res.voices);
    } catch (err) {
      console.error('[PlatformBridge] load voices error:', err);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices]);

  const handleGenerateAiStudioPack = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connectors/google-ai-studio/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Codebase & Architecture Pack',
          model: aiStudioModel,
          userPrompt: aiStudioPrompt,
          includeCodebaseContext: true,
        }),
      }).then((r) => r.json());
      if (res.success) setAiStudioPack(res.pack);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeTts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connectors/edge-tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voiceShortName: selectedVoice }),
      }).then((r) => r.json());
      if (res.success) setTtsJob(res.job);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatVideoPrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connectors/ai-video/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: videoPlatform,
          sceneDescription: sceneDesc,
          cameraMove,
          aspectRatio: '9:16',
        }),
      }).then((r) => r.json());
      if (res.success) setVideoPromptSpec(res.promptSpec);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCapCutAndRemotion = async () => {
    setLoading(true);
    const mockScenes = [
      { sceneNumber: 1, text: 'Hook: Bạn vẫn code thủ công từng dòng một?', durationSec: 4 },
      { sceneNumber: 2, text: 'Vấn đề: Mất hàng tuần để dựng backend và giao diện', durationSec: 5 },
      { sceneNumber: 3, text: 'Giải pháp: LedgerFlow Studio với đội ngũ 25 nhân viên AI', durationSec: 6 },
    ];
    try {
      const [ccRes, rmRes] = await Promise.all([
        fetch('/api/connectors/ai-video/capcut-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectName: 'LedgerFlow Promo', scenes: mockScenes }),
        }).then((r) => r.json()),
        fetch('/api/connectors/ai-video/remotion-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentName: 'LedgerFlowPromoVideo', scenes: mockScenes }),
        }).then((r) => r.json()),
      ]);
      if (ccRes.success) setCapcutResult(ccRes.draft);
      if (rmRes.success) setRemotionResult(rmRes.remotion);
    } finally {
      setLoading(false);
    }
  };

  const playBrowserSpeechTest = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(ttsText);
      utterance.lang = selectedVoice.startsWith('vi') ? 'vi-VN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Banner Header */}
      <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-purple-300 border border-purple-500/40 shadow-inner">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Platform Bridges &amp; AI Media Connectors</h2>
              <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-300 border border-purple-500/30">
                Google AI Studio · Edge TTS · Kling · Luma · CapCut
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Tối ưu hóa $0 Free Tier và kết nối trực tiếp các công cụ hàng đầu phục vụ Lập trình, Game và Sản xuất Video AI 100%.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
            ✓ 2M Tokens Free Tier Ready
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 w-fit backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('aistudio')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'aistudio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="h-4 w-4" /> 1. Google AI Studio (2M Context)
        </button>
        <button
          onClick={() => setActiveTab('edgetts')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'edgetts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="h-4 w-4" /> 2. Microsoft Edge TTS ($0 Voice)
        </button>
        <button
          onClick={() => setActiveTab('video_ai')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'video_ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="h-4 w-4" /> 3. Kling AI &amp; Luma Prompts
        </button>
        <button
          onClick={() => setActiveTab('capcut_remotion')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'capcut_remotion' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="h-4 w-4" /> 4. CapCut Draft &amp; Remotion React
        </button>
      </div>

      {/* TAB 1: GOOGLE AI STUDIO */}
      {activeTab === 'aistudio' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" /> Gói Đóng Gói Ngữ Cảnh Google AI Studio 2M Tokens ($0 Free Tier)
            </h3>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
            >
              Mở Google AI Studio Web <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid sm:grid-cols-12 gap-3">
            <select
              value={aiStudioModel}
              onChange={(e) => setAiStudioModel(e.target.value as any)}
              className="sm:col-span-4 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (2M Context Window)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Siêu tốc độ)</option>
            </select>
            <input
              type="text"
              value={aiStudioPrompt}
              onChange={(e) => setAiStudioPrompt(e.target.value)}
              placeholder="Nhập prompt suy luận..."
              className="sm:col-span-6 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <button
              onClick={handleGenerateAiStudioPack}
              disabled={loading}
              className="sm:col-span-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white hover:bg-cyan-500 cursor-pointer disabled:opacity-50"
            >
              Đóng Gói 1-Click
            </button>
          </div>

          {aiStudioPack && (
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300">Model: {aiStudioPack.model} · Max Tokens: {aiStudioPack.maxOutputTokens}</span>
                <button
                  onClick={() => copyToClipboard(aiStudioPack.curlCommand, 'curl')}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied === 'curl' ? 'Đã sao chép!' : 'Copy cURL API'}
                </button>
              </div>
              <pre className="rounded-xl bg-slate-900 p-3 text-xs font-mono text-cyan-200 overflow-x-auto">
                {aiStudioPack.curlCommand}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EDGE TTS */}
      {activeTab === 'edgetts' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Mic className="h-4 w-4 text-emerald-400" /> Microsoft Edge TTS Giọng Đọc AI Tiếng Việt ($0 Không Giới Hạn)
            </h3>
            <button
              onClick={playBrowserSpeechTest}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5" /> Nghe Thử Trực Tiếp (Web Speech)
            </button>
          </div>

          <div className="grid sm:grid-cols-12 gap-3">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="sm:col-span-4 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              {voices.map((v) => (
                <option key={v.shortName} value={v.shortName}>
                  {v.friendlyName}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Lời thoại lồng tiếng..."
              className="sm:col-span-6 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <button
              onClick={handleSynthesizeTts}
              disabled={loading}
              className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
            >
              Sinh Audio &amp; SRT
            </button>
          </div>

          {ttsJob && (
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300">
                  Thời lượng ước tính: ~{ttsJob.durationEstimateSec} giây · File: {ttsJob.outputAudioFile}
                </span>
                <button
                  onClick={() => copyToClipboard(ttsJob.cliCommand, 'tts_cli')}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied === 'tts_cli' ? 'Đã sao chép!' : 'Copy Lệnh edge-tts'}
                </button>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Phụ đề SRT tự động:</span>
                <pre className="rounded-xl bg-slate-900 p-3 text-xs font-mono text-emerald-200 max-h-[140px] overflow-y-auto">
                  {ttsJob.srtSubtitles}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KLING AI & LUMA PROMPTS */}
      {activeTab === 'video_ai' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Video className="h-4 w-4 text-rose-400" /> Tối Ưu Hóa Prompt Chuyên Biệt Cho Kling AI 1.5 &amp; Luma Dream Machine
            </h3>
          </div>

          <div className="grid sm:grid-cols-12 gap-3">
            <select
              value={videoPlatform}
              onChange={(e) => setVideoPlatform(e.target.value as any)}
              className="sm:col-span-3 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              <option value="kling">Kling AI 1.5 (Vật lý mượt)</option>
              <option value="luma">Luma Dream Machine (Cinematic 3D)</option>
              <option value="haiper">Haiper AI (Hoạt họa / Game)</option>
            </select>
            <select
              value={cameraMove}
              onChange={(e) => setCameraMove(e.target.value as any)}
              className="sm:col-span-3 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
            >
              <option value="cinematic_dolly">Cinematic Dolly In</option>
              <option value="orbit_left">Orbit Camera Left</option>
              <option value="zoom_in">Fast Zoom In</option>
            </select>
            <input
              type="text"
              value={sceneDesc}
              onChange={(e) => setSceneDesc(e.target.value)}
              placeholder="Mô tả phân cảnh..."
              className="sm:col-span-4 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
            />
            <button
              onClick={handleFormatVideoPrompt}
              disabled={loading}
              className="sm:col-span-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-500 cursor-pointer disabled:opacity-50"
            >
              Tối Ưu Prompt
            </button>
          </div>

          {videoPromptSpec && (
            <div className="rounded-2xl border border-rose-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-300">{videoPromptSpec.platformName} · Khung hình: {videoPromptSpec.aspectRatio}</span>
                <button
                  onClick={() => copyToClipboard(videoPromptSpec.optimizedPrompt, 'vid_prm')}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied === 'vid_prm' ? 'Đã sao chép!' : 'Copy Prompt Tối Ưu'}
                </button>
              </div>
              <p className="rounded-xl bg-slate-900 p-3 text-xs font-mono text-slate-200">
                {videoPromptSpec.optimizedPrompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CAPCUT & REMOTION */}
      {activeTab === 'capcut_remotion' && (
        <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Film className="h-4 w-4 text-amber-400" /> Xuất Dự Án Dựng Video Tự Động: CapCut Desktop &amp; Remotion React
            </h3>
            <button
              onClick={handleExportCapCutAndRemotion}
              disabled={loading}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 cursor-pointer disabled:opacity-50"
            >
              Sinh File CapCut &amp; Mã Remotion
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Capcut Draft Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">📁 CapCut Desktop (draft_content.json)</span>
                {capcutResult && (
                  <button
                    onClick={() => copyToClipboard(capcutResult.draftContentJson, 'capcut_json')}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied === 'capcut_json' ? 'Đã chép!' : 'Copy JSON'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {capcutResult ? capcutResult.instructions : 'Bấm nút "Sinh File" ở trên để tạo cấu trúc timeline CapCut Desktop.'}
              </p>
              {capcutResult && (
                <pre className="rounded-xl bg-slate-900 p-3 text-[10px] font-mono text-amber-200 max-h-[140px] overflow-y-auto">
                  {capcutResult.draftContentJson}
                </pre>
              )}
            </div>

            {/* Remotion React Box */}
            <div className="rounded-2xl border border-indigo-500/30 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-300">⚛️ Remotion Programmatic React Code</span>
                {remotionResult && (
                  <button
                    onClick={() => copyToClipboard(remotionResult.reactSourceCode, 'remotion_code')}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied === 'remotion_code' ? 'Đã chép!' : 'Copy React'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {remotionResult ? remotionResult.instructions : 'Bấm nút "Sinh File" để nhận code React render video tự động.'}
              </p>
              {remotionResult && (
                <pre className="rounded-xl bg-slate-900 p-3 text-[10px] font-mono text-indigo-200 max-h-[140px] overflow-y-auto">
                  {remotionResult.reactSourceCode}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
