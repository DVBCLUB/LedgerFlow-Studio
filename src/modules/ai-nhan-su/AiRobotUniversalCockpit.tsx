import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  BrainCircuit,
  Bot,
  Laptop,
  Smartphone,
  Gamepad2,
  Video,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Code2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import PlatformBridgeControlCenter from '../video-maker/ui/PlatformBridgeControlCenter';

interface NexusHealth {
  status: 'optimal' | 'degraded' | 'warning';
  activeSpecialists: number;
  robotActuatorsReady: boolean;
  sqliteWalStatus: 'active' | 'syncing';
  ideBridgesAvailable: string[];
  memoryUsageMb: number;
  lastOrchestratedAt: string;
}

export default function AiRobotUniversalCockpit() {
  const [health, setHealth] = useState<NexusHealth | null>(null);
  const [activeSection, setActiveSection] = useState<'ide_bridge' | 'software_studio' | 'game_studio' | 'video_studio' | 'platform_bridges'>('ide_bridge');
  const [selectedIde, setSelectedIde] = useState<'cursor' | 'antigravity' | 'vscode' | 'claude_code' | 'mcp_manifest'>('cursor');
  const [ideExport, setIdeExport] = useState<{ filename: string; content: string; instructions: string } | null>(null);

  // Studio generator states
  const [appName, setAppName] = useState('LedgerFlow Mobile CRM');
  const [appType, setAppType] = useState<'hybrid_desktop_mobile' | 'saas_web_desktop' | 'mobile_pwa'>('hybrid_desktop_mobile');
  const [appBlueprintResult, setAppBlueprintResult] = useState<any | null>(null);

  const [gameTitle, setGameTitle] = useState('Cyber Runner 2026');
  const [gameGenre, setGameGenre] = useState<'2d_platformer' | 'rpg_puzzle' | 'hyper_casual'>('2d_platformer');
  const [gameResult, setGameResult] = useState<any | null>(null);

  const [videoTopic, setVideoTopic] = useState('Hướng dẫn tự động đối soát VietQR và hóa đơn VAS 200');
  const [videoResult, setVideoResult] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/nexus/health').then((r) => r.json());
      if (res.success) setHealth(res.health);
    } catch (err) {
      console.error('[NexusCockpit] health error:', err);
    }
  }, []);

  const loadIdeExport = useCallback(async (target: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nexus/ide-export?target=${target}`).then((r) => r.json());
      if (res.success) {
        setIdeExport({
          filename: res.filename,
          content: res.content,
          instructions: res.instructions,
        });
      }
    } catch (err) {
      console.error('[NexusCockpit] ide export error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    void loadIdeExport(selectedIde);
  }, [loadHealth, loadIdeExport, selectedIde]);

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateApp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nexus/blueprint/app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, appType, includeMobile: true }),
      }).then((r) => r.json());
      if (res.success) setAppBlueprintResult(res.blueprint);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGame = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nexus/blueprint/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameTitle, genre: gameGenre, preferLocal: true }),
      }).then((r) => r.json());
      if (res.success) setGameResult(res.gamePackage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nexus/blueprint/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: videoTopic, platform: 'tiktok', targetDurationSec: 45, preferLocal: true }),
      }).then((r) => r.json());
      if (res.success) setVideoResult(res.videoSpec);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-inner">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">AI-Robot Universal Nexus &amp; Studio Command</h2>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-300 border border-cyan-500/30">
                AI Central Brain · Robot Actuators
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Điều phối tập trung bộ máy AI, kết nối IDE/Coding Agents và xuất bản 3 mảng sản phẩm: Phần mềm (PC/Mobile), Game (PC/Mobile) và Video AI 100%.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {health && (
            <div className="flex items-center gap-2 rounded-2xl border border-border-secondary bg-slate-900/80 px-3.5 py-2 text-xs">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">RAM: {health.memoryUsageMb} MB</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">0-Lag WAL Active</span>
            </div>
          )}
          <button
            onClick={loadHealth}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 w-fit backdrop-blur-xl">
        <button
          onClick={() => setActiveSection('ide_bridge')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'ide_bridge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Code2 className="h-4 w-4" /> 1. IDE &amp; Agent Connectors
        </button>
        <button
          onClick={() => setActiveSection('software_studio')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'software_studio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Laptop className="h-4 w-4" /> 2. Software Studio (PC &amp; Mobile)
        </button>
        <button
          onClick={() => setActiveSection('game_studio')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'game_studio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Gamepad2 className="h-4 w-4" /> 3. Game Studio (PC &amp; Mobile Touch)
        </button>
        <button
          onClick={() => setActiveSection('video_studio')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'video_studio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Video className="h-4 w-4" /> 4. Video AI 100% Studio
        </button>
        <button
          onClick={() => setActiveSection('platform_bridges')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSection === 'platform_bridges' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Layers className="h-4 w-4" /> 5. Cầu Nối Nền Tảng (Google AI / Edge TTS / CapCut)
        </button>
      </div>

      {/* SECTION 1: IDE & CODING AGENT CONNECTORS */}
      {activeSection === 'ide_bridge' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase">Cầu Nối Đồng Bộ Ngữ Cảnh Cho IDE &amp; Coding Agents</h3>
                  <p className="text-xs text-slate-400">Xuất file cấu hình 1-Click cho Cursor, Antigravity, VS Code, Claude Code và MCP Protocol.</p>
                </div>
              </div>
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['cursor', 'antigravity', 'vscode', 'claude_code', 'mcp_manifest'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedIde(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                      selectedIde === t ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {ideExport && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">File: {ideExport.filename}</span>
                  <button
                    onClick={() => copyToClipboard(ideExport.content)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? 'Đã sao chép!' : 'Copy nội dung'}
                  </button>
                </div>
                <pre className="rounded-2xl border border-border-secondary bg-slate-950 p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {ideExport.content}
                </pre>
                <p className="text-xs text-text-tertiary">💡 Hướng dẫn: {ideExport.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: SOFTWARE STUDIO (PC & MOBILE) */}
      {activeSection === 'software_studio' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase">Xưởng Sinh Dự Án Phần Mềm Đa Nền Tảng (PC Web / Desktop / Mobile)</h3>
            </div>
            <div className="grid sm:grid-cols-12 gap-3">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Tên ứng dụng..."
                className="sm:col-span-5 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={appType}
                onChange={(e) => setAppType(e.target.value as any)}
                className="sm:col-span-4 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="hybrid_desktop_mobile">Hybrid PC Desktop &amp; Mobile App</option>
                <option value="saas_web_desktop">SaaS Web &amp; Electron PC</option>
                <option value="mobile_pwa">Mobile PWA &amp; Capacitor</option>
              </select>
              <button
                onClick={handleGenerateApp}
                disabled={loading || !appName.trim()}
                className="sm:col-span-3 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white hover:bg-cyan-500 cursor-pointer disabled:opacity-50"
              >
                Sinh Scaffold Dự Án
              </button>
            </div>

            {appBlueprintResult && (
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-300">Blueprint ID: {appBlueprintResult.id}</span>
                  <span className="text-[10px] text-slate-400">Framework: {appBlueprintResult.framework}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {appBlueprintResult.platforms.map((p: string) => (
                    <span key={p} className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[9px] font-bold text-cyan-200 border border-cyan-500/30">
                      {p}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Cấu trúc thư mục được tạo:</span>
                  <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-slate-300">
                    {appBlueprintResult.fileStructure.join('\n')}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: GAME STUDIO (PC & MOBILE TOUCH) */}
      {activeSection === 'game_studio' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase">Xưởng Game AI PC &amp; Mobile Touch Joystick</h3>
            </div>
            <div className="grid sm:grid-cols-12 gap-3">
              <input
                type="text"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="Tên game..."
                className="sm:col-span-5 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={gameGenre}
                onChange={(e) => setGameGenre(e.target.value as any)}
                className="sm:col-span-4 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="2d_platformer">2D Platformer Phiêu Lưu</option>
                <option value="rpg_puzzle">RPG Puzzle Trí Tuệ</option>
                <option value="hyper_casual">Hyper Casual Siêu Tốc</option>
              </select>
              <button
                onClick={handleGenerateGame}
                disabled={loading || !gameTitle.trim()}
                className="sm:col-span-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
              >
                Tạo Game 5-trong-1
              </button>
            </div>

            {gameResult && (
              <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-300">Gói Game: {gameResult.gameTitle}</span>
                  <span className="text-[10px] text-slate-400">Canvas: {gameResult.html5CanvasManifest.canvasWidth}x{gameResult.html5CanvasManifest.canvasHeight} @ {gameResult.html5CanvasManifest.fps}fps</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-cyan-300 block">⌨️ Điều khiển PC:</span>
                    <p className="text-xs text-slate-300">{gameResult.controls.pcControls.movement}</p>
                    <p className="text-xs text-slate-300">{gameResult.controls.pcControls.action1}</p>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-300 block">📱 Điều khiển Mobile Touch Joystick:</span>
                    <p className="text-xs text-slate-300">Vị trí D-Pad: {gameResult.controls.mobileTouchControls.dpadPosition}</p>
                    <div className="flex gap-1 mt-1">
                      {gameResult.controls.mobileTouchControls.touchButtons.map((b: any) => (
                        <span key={b.id} className="rounded px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: b.colorHex }}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: VIDEO AI 100% STUDIO */}
      {activeSection === 'video_studio' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border-primary bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-rose-400" />
              <h3 className="text-sm font-black text-white uppercase">Xưởng Sản Xuất Video Do AI Làm Hoàn Toàn 100%</h3>
            </div>
            <div className="grid sm:grid-cols-12 gap-3">
              <input
                type="text"
                value={videoTopic}
                onChange={(e) => setVideoTopic(e.target.value)}
                placeholder="Chủ đề video..."
                className="sm:col-span-9 rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleGenerateVideo}
                disabled={loading || !videoTopic.trim()}
                className="sm:col-span-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-500 cursor-pointer disabled:opacity-50"
              >
                Sinh Kịch Bản &amp; FFmpeg
              </button>
            </div>

            {videoResult && (
              <div className="rounded-2xl border border-rose-500/30 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-300">Dự án Video: {videoResult.videoProject.title}</span>
                  <span className="text-[10px] text-slate-400">{videoResult.videoProject.targetDurationSec} giây · {videoResult.videoProject.scenes.length} phân cảnh</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lệnh ghép FFmpeg $0:</span>
                  <pre className="rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-300 max-h-[160px] overflow-y-auto">
                    {videoResult.ffmpegConcatScript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: PLATFORM BRIDGES (GOOGLE AI STUDIO, EDGE TTS, KLING, CAPCUT, REMOTION) */}
      {activeSection === 'platform_bridges' && (
        <div className="space-y-4">
          <PlatformBridgeControlCenter />
        </div>
      )}
    </div>
  );
}
