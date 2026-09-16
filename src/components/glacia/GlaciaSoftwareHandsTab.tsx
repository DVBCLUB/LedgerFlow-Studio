import React, { useState, useEffect } from 'react';
import {
  Box,
  Video,
  Palette,
  Sparkles,
  Play,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Layers,
  Cpu,
  RefreshCw,
  Eye,
  Sliders,
  Film,
  Code2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  fetchBlenderStatus,
  triggerBlenderRender,
  fetchVideoFactoryStatus,
  triggerVideoGenerate,
  triggerBannerGenerate,
  type BlenderStatus,
  type VideoFactoryStatus,
  type BlenderRenderResult,
  type VideoRenderResult,
  type BannerDesignResult,
} from '../../utils/glaciaToolsApi';
import {
  triggerSoftwareFactoryPipeline,
  type SoftwareFactoryPipelineResult,
} from '../../utils/softwareFactoryPipelineApi';
import { useGlacia } from './GlaciaContext';

// ── Preset Definitions ──
const SOFTWARE_PRESETS = [
  {
    id: 'cli_todo',
    title: '📝 CLI Todo App',
    goal: 'Xây dựng CLI Todo Task Manager bằng TypeScript với lưu trữ JSON local và đầy đủ unit tests',
    projectType: 'cli_tool' as const,
    lang: 'typescript' as const,
  },
  {
    id: 'rest_api',
    title: '⚡ Express Microservice',
    goal: 'Tạo REST API endpoint quản lý sản phẩm với validation, JWT auth guard và in-memory database',
    projectType: 'api_service' as const,
    lang: 'typescript' as const,
  },
  {
    id: 'game_fsm',
    title: '🎮 Boss FSM AI Engine',
    goal: 'Lập trình Finite State Machine cho Boss AI trong game 2D với các trạng thái Idle, Chase, Attack, Enrage',
    projectType: 'game_module' as const,
    lang: 'typescript' as const,
  },
];

const BLENDER_PRESETS = [
  {
    id: 'crystal_core',
    title: '💎 Crystal Core',
    desc: 'Pha lê Băng Rồng Lượng tử & 3 Vệ tinh Quỹ đạo (IOR 1.48, Emission Aurora)',
    prompt: 'Dựng lõi tinh thể pha lê băng rồng phát sáng lượng tử với 3 vệ tinh quay quanh',
    engine: 'EEVEE' as const,
  },
  {
    id: 'cyberpunk_drone',
    title: '🛸 Recon Drone',
    desc: 'Robot Drone Trinh sát Tự trị 4 Rotor & Laser HUD Telemetry Scanner',
    prompt: 'Dựng robot drone trinh sát công nghệ cao 4 rotor với thân kim loại titanium',
    engine: 'EEVEE' as const,
  },
  {
    id: 'hologram_token',
    title: '🪙 3D Sovereign Token',
    desc: 'Huân chương Số 3D Mạ Vàng & Vành Khắc Laser Nổi',
    prompt: 'Dựng huy hiệu số mạ vàng 3D với vành nổi và khắc chìm biểu tượng LedgerFlow',
    engine: 'CYCLES' as const,
  },
  {
    id: 'isometric_server',
    title: '🖥️ Isometric Server',
    desc: 'Cụm Máy chủ AI Tự trị Pha lê Kính Dạng Isometric',
    prompt: 'Dựng cụm máy chủ pha lê AI dạng isometric 3 tầng với đèn LED neon',
    engine: 'EEVEE' as const,
  },
  {
    id: 'kinetic_sphere',
    title: '⚛️ Kinetic Sphere',
    desc: 'Quả cầu Động học Đa vòng Lồng nhau (Gimbal Orbit)',
    prompt: 'Dựng quả cầu động học với các vòng gimbal lồng nhau xoay quanh lõi năng lượng',
    engine: 'CYCLES' as const,
  },
];

const VIDEO_PRESETS = [
  {
    id: 'shorts_viral',
    title: '📱 TikTok/Shorts 9:16',
    aspect: '9:16' as const,
    theme: 'frost_aurora',
    bgm: 'cyber_synth',
    titleText: 'Glacia Software Robot OS 2026',
    scriptText: 'Xin chào! Tôi là Glacia, robot phần mềm tự trị điều hành doanh nghiệp với chi phí vận hành tối ưu $0 token.',
  },
  {
    id: 'youtube_briefing',
    title: '🖥️ YouTube 16:9',
    aspect: '16:9' as const,
    theme: 'executive_gold',
    bgm: 'cinematic_epic',
    titleText: 'Executive Autonomous OS Briefing',
    scriptText: 'Hệ điều hành doanh nghiệp tự trị thế hệ mới: Tự code, tự thiết kế đồ họa và tự render video 24/7.',
  },
  {
    id: 'matrix_reveal',
    title: '⚡ Matrix Tech Reveal',
    aspect: '9:16' as const,
    theme: 'cyberpunk_glacia',
    bgm: 'lofi_pulse',
    titleText: 'Autonomous Robot Capabilities',
    scriptText: 'Đôi tay phần mềm Glacia điều khiển trực tiếp Blender 3D, FFmpeg và Vector Studio ngay trên máy cục bộ.',
  },
];

const DESIGN_PRESETS = [
  {
    id: 'social_card',
    title: '🌐 Social Card (1200x630)',
    size: '1200x630' as const,
    theme: 'frost_crystal' as const,
    badge: 'LEDGERFLOW OS 2026',
    headline: 'DOANH NGHIỆP TỰ TRỊ 100%',
    sub: 'Vận hành khép kín bởi Robot Glacia & Swarm AI Specialists',
  },
  {
    id: 'tiktok_story',
    title: '📱 Story Card (1080x1920)',
    size: '1080x1920' as const,
    theme: 'cyberpunk_neon' as const,
    badge: 'ROBOT SOFTWARE HANDS',
    headline: 'GLACIA SUPREME CORE',
    sub: 'Tự động hóa tác vụ thiết kế & sản xuất media không tốn token API',
  },
  {
    id: 'youtube_banner',
    title: '📺 YouTube Banner (1920x1080)',
    size: '1920x1080' as const,
    theme: 'executive_dark' as const,
    badge: 'ENTERPRISE INTELLIGENCE',
    headline: 'COMMAND COCKPIT AI',
    sub: 'Trung tâm chỉ huy tối cao dành cho Solo Founder & Tech CEO',
  },
  {
    id: 'financial_matrix',
    title: '💎 Emerald Matrix (1080x1080)',
    size: '1080x1080' as const,
    theme: 'emerald_finance' as const,
    badge: 'FINANCIAL AUTONOMY',
    headline: 'ZERO TOKEN OVERHEAD',
    sub: 'Hiệu suất vận hành 99.8% với kiến trúc Local Skill Compilation',
  },
];

export default function GlaciaSoftwareHandsTab() {
  const { mood, triggerReaction } = useGlacia();

  const [activeTool, setActiveTool] = useState<'software' | 'blender' | 'video' | 'design'>('software');

  // Software Studio State
  const [softwareGoal, setSoftwareGoal] = useState(SOFTWARE_PRESETS[0].goal);
  const [softwareProjectType, setSoftwareProjectType] = useState<'cli_tool' | 'web_app' | 'api_service' | 'game_module'>('cli_tool');
  const [softwareLanguage, setSoftwareLanguage] = useState<'typescript' | 'javascript' | 'python'>('typescript');
  const [isBuildingSoftware, setIsBuildingSoftware] = useState(false);
  const [softwareResult, setSoftwareResult] = useState<SoftwareFactoryPipelineResult | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Tool Statuses
  const [blenderStatus, setBlenderStatus] = useState<BlenderStatus | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoFactoryStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Blender State
  const [blenderSceneType, setBlenderSceneType] = useState('crystal_core');
  const [blenderPrompt, setBlenderPrompt] = useState(BLENDER_PRESETS[0].prompt);
  const [blenderEngine, setBlenderEngine] = useState<'EEVEE' | 'CYCLES'>('EEVEE');
  const [enableGltfExport, setEnableGltfExport] = useState(true);
  const [isBlenderRendering, setIsBlenderRendering] = useState(false);
  const [blenderResult, setBlenderResult] = useState<BlenderRenderResult | null>(null);

  // Video State
  const [videoTitle, setVideoTitle] = useState(VIDEO_PRESETS[0].titleText);
  const [videoScript, setVideoScript] = useState(VIDEO_PRESETS[0].scriptText);
  const [videoTheme, setVideoTheme] = useState('frost_aurora');
  const [videoAspect, setVideoAspect] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [videoBgm, setVideoBgm] = useState('ambient_crystal');
  const [isVideoRendering, setIsVideoRendering] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoRenderResult | null>(null);

  // Design Banner State
  const [bannerHeadline, setBannerHeadline] = useState(DESIGN_PRESETS[0].headline);
  const [bannerSubheadline, setBannerSubheadline] = useState(DESIGN_PRESETS[0].sub);
  const [bannerBadge, setBannerBadge] = useState(DESIGN_PRESETS[0].badge);
  const [bannerSize, setBannerSize] = useState<'1200x630' | '1080x1080' | '1920x1080' | '1080x1920' | '800x400'>('1200x630');
  const [bannerTheme, setBannerTheme] = useState<'frost_crystal' | 'cyberpunk_neon' | 'executive_dark' | 'emerald_finance' | 'solar_amber'>('frost_crystal');
  const [isBannerGenerating, setIsBannerGenerating] = useState(false);
  const [bannerResult, setBannerResult] = useState<BannerDesignResult | null>(null);

  // Load Statuses on mount
  useEffect(() => {
    async function loadStatuses() {
      setLoadingStatus(true);
      try {
        const [bStatus, vStatus] = await Promise.all([
          fetchBlenderStatus().catch(() => null),
          fetchVideoFactoryStatus().catch(() => null),
        ]);
        setBlenderStatus(bStatus);
        setVideoStatus(vStatus);
      } finally {
        setLoadingStatus(false);
      }
    }
    void loadStatuses();
  }, []);

  // Handlers
  const handleSelectSoftwarePreset = (preset: (typeof SOFTWARE_PRESETS)[0]) => {
    setSoftwareGoal(preset.goal);
    setSoftwareProjectType(preset.projectType);
    setSoftwareLanguage(preset.lang);
    triggerReaction('nod');
  };

  const handleBuildSoftware = async () => {
    setIsBuildingSoftware(true);
    triggerReaction('thinking');
    try {
      const res = await triggerSoftwareFactoryPipeline({
        goal: softwareGoal,
        projectType: softwareProjectType,
        targetLanguage: softwareLanguage,
        autoSandboxTest: true,
        packageRelease: true,
      });
      setSoftwareResult(res);
      setSelectedFileIndex(0);
      triggerReaction('sparkle');
    } catch (err: any) {
      triggerReaction('sad');
    } finally {
      setIsBuildingSoftware(false);
    }
  };

  const handleSelectBlenderPreset = (preset: (typeof BLENDER_PRESETS)[0]) => {
    setBlenderSceneType(preset.id);
    setBlenderPrompt(preset.prompt);
    setBlenderEngine(preset.engine);
    triggerReaction('nod');
  };

  const handleSelectVideoPreset = (preset: (typeof VIDEO_PRESETS)[0]) => {
    setVideoTitle(preset.titleText);
    setVideoScript(preset.scriptText);
    setVideoAspect(preset.aspect);
    setVideoTheme(preset.theme);
    setVideoBgm(preset.bgm);
    triggerReaction('nod');
  };

  const handleSelectDesignPreset = (preset: (typeof DESIGN_PRESETS)[0]) => {
    setBannerHeadline(preset.headline);
    setBannerSubheadline(preset.sub);
    setBannerBadge(preset.badge);
    setBannerSize(preset.size);
    setBannerTheme(preset.theme);
    triggerReaction('nod');
  };

  const handleRenderBlender = async () => {
    setIsBlenderRendering(true);
    triggerReaction('thinking');
    try {
      const res = await triggerBlenderRender({
        prompt: blenderPrompt,
        sceneType: blenderSceneType,
        renderEngine: blenderEngine,
        enableExport: enableGltfExport,
      });
      setBlenderResult(res);
      triggerReaction('sparkle');
    } catch (err: any) {
      setBlenderResult({
        success: false,
        pythonScriptUsed: '',
        renderDurationMs: 0,
        message: err.message || 'Lỗi khi gọi Blender Connector',
      });
      triggerReaction('sad');
    } finally {
      setIsBlenderRendering(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsVideoRendering(true);
    triggerReaction('thinking');
    try {
      const res = await triggerVideoGenerate({
        title: videoTitle,
        script: videoScript,
        aspectRatio: videoAspect,
        theme: videoTheme,
        backgroundMusicStyle: videoBgm,
      });
      setVideoResult(res);
      triggerReaction('sparkle');
    } catch (err: any) {
      setVideoResult({
        success: false,
        durationSeconds: 0,
        renderDurationMs: 0,
        message: err.message || 'Lỗi khi gọi Video Factory',
      });
      triggerReaction('sad');
    } finally {
      setIsVideoRendering(false);
    }
  };

  const handleGenerateBanner = async () => {
    setIsBannerGenerating(true);
    triggerReaction('thinking');
    try {
      const res = await triggerBannerGenerate({
        headline: bannerHeadline,
        subheadline: bannerSubheadline,
        badge: bannerBadge,
        size: bannerSize,
        theme: bannerTheme,
      });
      setBannerResult(res);
      triggerReaction('sparkle');
    } catch (err: any) {
      setBannerResult({
        success: false,
        svgContent: '',
        outputPath: '',
        dimensions: { width: 1200, height: 630 },
        message: err.message || 'Lỗi khi thiết kế banner',
      });
      triggerReaction('sad');
    } finally {
      setIsBannerGenerating(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Sub-header & Tool Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                🛠️ Glacia Supreme Software Hands (Đôi Tay Robot Tự Trị)
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                World-Class Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Glacia trực tiếp điều khiển Blender 3D, FFmpeg Media Factory và Generative Vector HUD Studio để tạo sản phẩm số độc lập.
            </p>
          </div>
        </div>

        {/* 4 Tool Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTool('software')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'software'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> 🏭 Software Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('blender')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'blender'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Box className="h-3.5 w-3.5" /> Blender 3D Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('video')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'video'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Video Factory (9:16 / 16:9)
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('design')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTool === 'design'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Palette className="h-3.5 w-3.5" /> Generative Vector HUD
          </button>
        </div>
      </div>

      {/* ── TOOL 0: SOFTWARE STUDIO (Auto-Programming, Sandbox & Eval) ── */}
      {activeTool === 'software' && (
        <div className="space-y-4">
          {/* Preset Quick-Cards */}
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
              ⚡ Chọn Mẫu Thiết Kế Phần Mềm (1-Click Software Blueprints):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SOFTWARE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectSoftwarePreset(p)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    softwareGoal === p.goal
                      ? 'bg-blue-950/50 border-blue-500/60 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-xs text-white">{p.title}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono border border-blue-800">
                      {p.lang}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{p.goal}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Input & Execution Control */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-blue-400" /> Cấu Hình Sản Xuất Phần Mềm Tự Trị
              </span>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mục tiêu phần mềm (Goal Description):
                  </label>
                  <textarea
                    rows={4}
                    value={softwareGoal}
                    onChange={(e) => setSoftwareGoal(e.target.value)}
                    placeholder="Mô tả module, tính năng hoặc ứng dụng cần Glacia xây dựng..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Loại dự án:</label>
                    <select
                      value={softwareProjectType}
                      onChange={(e) => setSoftwareProjectType(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="cli_tool">CLI Tool / Script</option>
                      <option value="api_service">REST API Service</option>
                      <option value="web_app">Web Application</option>
                      <option value="game_module">Game Engine Module</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Ngôn ngữ:</label>
                    <select
                      value={softwareLanguage}
                      onChange={(e) => setSoftwareLanguage(e.target.value as any)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                    </select>
                  </div>
                </div>

                {/* Automation Guarantees */}
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Khép kín 100% không giả lập
                  </div>
                  <p>• Phân rã mục tiêu qua <b>Goal Decomposer</b></p>
                  <p>• Chạy kiểm thử tự động trong <b>Isolated Sandbox</b></p>
                  <p>• Chấm điểm chất lượng qua <b>AI Eval Harness</b></p>
                  <p>• Tự động xuất <b>Release Kit Packaging</b></p>
                </div>

                <button
                  type="button"
                  onClick={handleBuildSoftware}
                  disabled={isBuildingSoftware}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isBuildingSoftware ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>{isBuildingSoftware ? 'Glacia đang lập trình & test sandbox...' : '🚀 Kích Hoạt Software Factory 1-Chạm'}</span>
                </button>
              </div>
            </div>

            {/* Right: Live Execution Results & Code Preview */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-blue-400" /> Kết Quả Sản Xuất & Sandbox Verified
                </span>
                {softwareResult && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    Eval Score: {softwareResult.evalScore.score}/100
                  </span>
                )}
              </span>

              {softwareResult ? (
                <div className="space-y-3">
                  {/* Performance metrics banner */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Số file sinh ra</span>
                      <span className="font-mono font-bold text-white">{softwareResult.generatedFiles.length} files</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Sandbox Verification</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {softwareResult.sandboxResult?.passed ? '✓ PASSED' : 'CHECKED'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Thời gian chạy</span>
                      <span className="font-mono font-bold text-cyan-300">{softwareResult.durationMs}ms</span>
                    </div>
                  </div>

                  {/* File Tabs */}
                  <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5 overflow-x-auto">
                    {softwareResult.generatedFiles.map((file, idx) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => setSelectedFileIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                          selectedFileIndex === idx
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {file.path}
                      </button>
                    ))}
                  </div>

                  {/* Code Viewer */}
                  {softwareResult.generatedFiles[selectedFileIndex] && (
                    <div className="relative">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-t-xl border border-b-0 border-slate-800">
                        <span className="font-mono text-blue-300">{softwareResult.generatedFiles[selectedFileIndex].path}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(softwareResult.generatedFiles[selectedFileIndex].content)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedCode ? 'Đã chép!' : 'Chép mã'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 rounded-b-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[260px] leading-relaxed">
                        {softwareResult.generatedFiles[selectedFileIndex].content}
                      </pre>
                    </div>
                  )}

                  {/* Sandbox Preflight Output */}
                  {softwareResult.sandboxResult?.stdout && (
                    <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                      <span>✓ {softwareResult.sandboxResult.stdout}</span>
                      <span className="text-slate-500 text-[10px]">Exit: {softwareResult.sandboxResult.exitCode}</span>
                    </div>
                  )}

                  {/* Release Kit Deliverable */}
                  {softwareResult.releaseItem && (
                    <div className="rounded-xl bg-blue-950/30 p-2.5 border border-blue-800/40 text-xs text-blue-300 flex items-center justify-between">
                      <span className="font-bold">📦 {softwareResult.releaseItem.title}</span>
                      <span className="text-[10px] text-blue-400 font-mono">Channel: {softwareResult.releaseItem.channel}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[340px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                  <Code2 className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">Chưa có bản build phần mềm nào.</p>
                  <span className="text-[10px] text-slate-500 max-w-sm mt-1">
                    Chọn một blueprint mẫu ở trên hoặc nhập mục tiêu phần mềm của bạn, sau đó nhấn "Kích Hoạt Software Factory" để Glacia phân rã và lập trình độc lập.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOOL 1: BLENDER 3D STUDIO ── */}
      {activeTool === 'blender' && (
        <div className="space-y-4">
          {/* Preset Quick-Cards */}
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
              ⚡ Chọn Mẫu Preset 3D Cao Cấp (1-Click Procedural Setup):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {BLENDER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectBlenderPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    blenderSceneType === p.id
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-white">{p.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                      {p.engine}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Box className="h-4 w-4 text-cyan-400" /> Trạng thái Blender CLI Cục Bộ
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      blenderStatus?.available
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {blenderStatus?.available ? `✓ Sẵn sàng (${blenderStatus.version})` : '⚠️ Sẵn sàng sinh Script bpy'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Kịch bản &amp; Mô tả Mô hình 3D:</label>
                  <textarea
                    value={blenderPrompt}
                    onChange={(e) => setBlenderPrompt(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Nhập mô tả vật thể 3D, màu sắc, ánh sáng..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Render Engine:</label>
                    <select
                      value={blenderEngine}
                      onChange={(e) => setBlenderEngine(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none text-xs"
                    >
                      <option value="EEVEE">EEVEE (Tốc độ cao 60fps)</option>
                      <option value="CYCLES">CYCLES (Raytracing Điện ảnh)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Xuất Mô hình GLTF/GLB:</label>
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableGltfExport}
                        onChange={(e) => setEnableGltfExport(e.target.checked)}
                        className="rounded text-cyan-500 focus:ring-0"
                      />
                      <span>Xuất file 3D .glb</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRenderBlender}
                  disabled={isBlenderRendering}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isBlenderRendering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  <span>{isBlenderRendering ? 'Glacia đang Render 3D...' : '⚡ Kích Hoạt Glacia Render 3D'}</span>
                </button>
              </div>
            </div>

            {/* Right: Output & Code Preview */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-cyan-400" /> Kịch Bản Python bpy &amp; Tác Phẩm 3D
                </span>
                {blenderResult?.pythonScriptUsed && (
                  <button
                    type="button"
                    onClick={() => handleCopyCode(blenderResult.pythonScriptUsed)}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCode ? 'Đã copy!' : 'Copy Script'}</span>
                  </button>
                )}
              </div>

              {blenderResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      blenderResult.success
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <p className="font-bold">{blenderResult.message}</p>
                    {blenderResult.renderDurationMs > 0 && (
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Thời gian thực thi: {(blenderResult.renderDurationMs / 1000).toFixed(2)}s | File: {blenderResult.outputPath}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-[220px] overflow-y-auto">
                    <pre className="text-[10px] font-mono text-cyan-300 whitespace-pre-wrap">
                      {blenderResult.pythonScriptUsed || '# Python bpy script ready'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[260px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                  <Box className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">Chưa có lệnh render nào.</p>
                  <span className="text-[10px] text-slate-500">
                    Chọn 1 preset ở trên và nhấn "Kích hoạt Glacia Render 3D" để sinh kịch bản ngay.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOOL 2: VIDEO FACTORY ── */}
      {activeTool === 'video' && (
        <div className="space-y-4">
          {/* Preset Video Quick-Cards */}
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
              🎬 Chọn Mẫu Kịch Bản Video (1-Click Storyboard Setup):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VIDEO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectVideoPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    videoTitle === p.titleText
                      ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-white">{p.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                      {p.aspect}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.scriptText}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-purple-400" /> Trạng thái FFmpeg Video Factory
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      videoStatus?.available
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {videoStatus?.available ? `✓ FFmpeg Ready (${videoStatus.version})` : '✓ Sẵn sàng xuất Manifest'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Tiêu đề Video Ngắn:</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Kịch bản Giọng đọc Glacia:</label>
                  <textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Tỷ lệ khung hình:</label>
                    <select
                      value={videoAspect}
                      onChange={(e) => setVideoAspect(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                    >
                      <option value="9:16">9:16 (TikTok / Reels / Shorts)</option>
                      <option value="16:9">16:9 (YouTube Desktop)</option>
                      <option value="1:1">1:1 (Square Feed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Âm nhạc Nền (BGM):</label>
                    <select
                      value={videoBgm}
                      onChange={(e) => setVideoBgm(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                    >
                      <option value="ambient_crystal">Ambient Crystal Frost</option>
                      <option value="cyber_synth">Cyber Synth Pulse</option>
                      <option value="cinematic_epic">Cinematic Epic Strings</option>
                      <option value="lofi_pulse">Lofi Chill Beats</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isVideoRendering}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isVideoRendering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  <span>{isVideoRendering ? 'Glacia đang Dựng Video...' : '🎬 Xuất Bản Video Tự Động'}</span>
                </button>
              </div>
            </div>

            {/* Right: Video Output Result & Storyboard */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" /> Phân Cảnh Storyboard &amp; Video Xuất Bản
              </span>

              {videoResult ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      videoResult.success
                        ? 'bg-purple-950/20 border-purple-500/30 text-purple-300'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <p className="font-bold">{videoResult.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Độ dài: {videoResult.durationSeconds}s | File: {videoResult.outputPath}
                    </span>
                  </div>

                  {videoResult.storyboard && (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Phân cảnh Storyboard:
                      </span>
                      {videoResult.storyboard.map((scene) => (
                        <div
                          key={scene.sceneNumber}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-purple-300 font-bold">
                            <span>Phân cảnh #{scene.sceneNumber}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{scene.durationSeconds}s</span>
                          </div>
                          <p className="text-slate-300">{scene.voiceoverText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {videoResult.publicUrl && (
                    <video controls className="w-full rounded-xl border border-slate-800 max-h-[180px]">
                      <source src={videoResult.publicUrl} type="video/mp4" />
                    </video>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[260px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                  <Video className="h-10 w-10 text-slate-600 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">Chưa có video nào được dựng.</p>
                  <span className="text-[10px] text-slate-500">
                    Chọn 1 preset kịch bản và nhấn "Xuất Bản Video Tự Động" để Glacia dựng ngay.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TOOL 3: DESIGN & BANNER STUDIO ── */}
      {activeTool === 'design' && (
        <div className="space-y-4">
          {/* Preset Design Quick-Cards */}
          <div>
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
              🎨 Chọn Mẫu Thiết Kế Vector HUD (1-Click Generative Design):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {DESIGN_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectDesignPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    bannerHeadline === p.headline
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xs text-white">{p.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.headline}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-emerald-400" /> Bảng Thiết Kế Vector HUD &amp; Poster
                </span>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Tiêu đề chính (Headline):</label>
                  <input
                    type="text"
                    value={bannerHeadline}
                    onChange={(e) => setBannerHeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Mô tả phụ (Subheadline):</label>
                  <input
                    type="text"
                    value={bannerSubheadline}
                    onChange={(e) => setBannerSubheadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Chủ đề Màu sắc:</label>
                    <select
                      value={bannerTheme}
                      onChange={(e) => setBannerTheme(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none text-xs"
                    >
                      <option value="frost_crystal">Frost Crystal (Băng Thanh)</option>
                      <option value="cyberpunk_neon">Cyberpunk Neon (Tím Hồng)</option>
                      <option value="executive_dark">Executive Gold (Hoàng Gia)</option>
                      <option value="emerald_finance">Emerald Finance (Ngọc Lục)</option>
                      <option value="solar_amber">Solar Amber (Cam Năng Lượng)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-400 block mb-1">Tỷ lệ kích thước:</label>
                    <select
                      value={bannerSize}
                      onChange={(e) => setBannerSize(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none text-xs font-mono"
                    >
                      <option value="1200x630">1200x630 (Social Card)</option>
                      <option value="1080x1920">1080x1920 (TikTok Story)</option>
                      <option value="1920x1080">1920x1080 (YouTube Cover)</option>
                      <option value="1080x1080">1080x1080 (Square Feed)</option>
                      <option value="800x400">800x400 (Briefing Card)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Badge Tag:</label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateBanner}
                  disabled={isBannerGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isBannerGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>{isBannerGenerating ? 'Glacia đang Thiết kế...' : '🎨 Thiết Kế Vector HUD 1-Chạm'}</span>
                </button>
              </div>
            </div>

            {/* Right: Banner Live Preview */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-emerald-400" /> Bản Thiết Kế Vector SVG HUD Trực Tiếp
              </span>

              {bannerResult?.svgContent ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 max-h-[380px] flex items-center justify-center p-2">
                    <div
                      dangerouslySetInnerHTML={{ __html: bannerResult.svgContent }}
                      className="w-full h-auto max-h-[360px] flex items-center justify-center"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[280px]">File: {bannerResult.outputPath}</span>
                    <span className="text-emerald-400 font-bold">✓ Vector SVG HD Ready ({bannerResult.dimensions.width}x{bannerResult.dimensions.height})</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                  <Palette className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-400">Chưa có mẫu banner nào.</p>
                  <span className="text-[10px] text-slate-500">
                    Chọn 1 preset ở trên và nhấn "Thiết Kế Vector HUD 1-Chạm" để xem trước trực tiếp.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

