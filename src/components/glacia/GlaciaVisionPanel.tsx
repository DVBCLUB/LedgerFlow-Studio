/**
 * GlaciaVisionPanel.tsx
 * Glacia Computer Vision Panel
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Camera, Upload, Image, Eye, Loader2, AlertCircle,
  CheckCircle2, FileText, Sparkles, Clipboard, Trash2,
  RefreshCw, History, Monitor, MonitorSmartphone,
  Layout, MousePointer2, Target, Crosshair,
} from 'lucide-react';
import {
  analyzeImage, fetchVisionHistory, fileToBase64,
  captureScreen, analyzeScreenImage, captureAndAnalyzeScreen,
  fetchScreenAnalysisHistory, clearScreenAnalysisHistory,
  type VisionAnalysisResult,
  type ScreenCaptureResult,
  type ScreenAnalysisResult,
  type ScreenElement,
} from '../../utils/glaciaVisionApi';
import {
  executeVisionLoop,
  type VisionActionLoopResult,
  type VisionActionStep,
} from '../../utils/glaciaComputerUseApi';
import { useGlacia } from './GlaciaContext';

export default function GlaciaVisionPanel() {
  const { speak, triggerReaction } = useGlacia();

  // ── Image Analysis State ──
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VisionAnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Screen Capture & Computer Use State ──
  const [activeTab, setActiveTab] = useState<'image' | 'screen' | 'computer-use'>('image');
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenCapture, setScreenCapture] = useState<ScreenCaptureResult | null>(null);
  const [screenAnalysis, setScreenAnalysis] = useState<ScreenAnalysisResult | null>(null);
  const [screenHistory, setScreenHistory] = useState<Array<{ timestamp: string; description: string; elementCount: number; }>>([]);
  const [showScreenHistory, setShowScreenHistory] = useState(false);
  const [isLoadingScreenHistory, setIsLoadingScreenHistory] = useState(false);
  const [screenPrompt, setScreenPrompt] = useState('');

  // ── Computer Use (Robot Hands) State ──
  const [computerGoal, setComputerGoal] = useState('Phan tich man hinh va tu dong dieu huong toi giao dien dieu hanh');
  const [maxSteps, setMaxSteps] = useState(3);
  const [isDryRun, setIsDryRun] = useState(true);
  const [isExecutingLoop, setIsExecutingLoop] = useState(false);
  const [loopResult, setLoopResult] = useState<VisionActionLoopResult | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setResult(null); setError(null);
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Chi ho tro JPEG, PNG, WebP va GIF"); return;
    }
    if (file.size > 10 * 1024 * 1024) { setError("Kich thuoc anh toi da 10MB"); return; }
    try {
      const base64 = await fileToBase64(file);
      setSelectedImage(base64);
      triggerReaction("curious");
    } catch (err: any) { setError("Loi doc file: " + err.message); }
  }, [triggerReaction]);
  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          setSelectedFileName("clipboard-image");
          setResult(null); setError(null);
          const base64 = await fileToBase64(blob);
          setSelectedImage(base64);
          triggerReaction("curious");
          speak("Glacia da nhan hinh anh tu clipboard!", "happy");
          return;
        }
      }
      setError("Khong tim thay hinh anh trong clipboard");
    } catch { setError("Khong the doc clipboard. Vui long dan thu cong."); }
  }, [triggerReaction, speak]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true); setError(null); setResult(null);
    triggerReaction("thinking");
    try {
      const visionResult = await analyzeImage({ imageBase64: selectedImage, prompt: customPrompt || undefined });
      setResult(visionResult);
      if (visionResult.success) { triggerReaction("sparkle"); speak("Glacia da phan tich xong hinh anh!", "celebrating"); }
      else { triggerReaction("sad"); }
    } catch (err: any) { setError("Loi phan tich: " + err.message); triggerReaction("sad"); }
    finally { setIsAnalyzing(false); }
  }, [selectedImage, customPrompt, triggerReaction, speak]);

  const handleClear = useCallback(() => {
    setSelectedImage(null); setSelectedFileName(""); setResult(null);
    setError(null); setCustomPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleLoadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try { const h = await fetchVisionHistory(); setHistory(h); setShowHistory(!showHistory); }
    catch { setError("Khong the tai lich su phan tich"); }
    finally { setIsLoadingHistory(false); }
  }, [showHistory]);

  const handleCaptureScreen = useCallback(async () => {
    setIsCapturing(true); setError(null);
    try {
      const cap = await captureAndAnalyzeScreen(screenPrompt || undefined);
      if (cap.capture) setScreenCapture(cap.capture);
      if (cap.analysis) setScreenAnalysis(cap.analysis);
      triggerReaction("curious");
    } catch (err: any) {
      setError("Lỗi chụp & phân tích: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  }, [screenPrompt, triggerReaction]);

  const handleCaptureOnly = useCallback(async () => {
    setIsCapturing(true); setError(null);
    try {
      const cap = await captureScreen();
      setScreenCapture(cap);
      triggerReaction("curious");
    } catch (err: any) {
      setError("Lỗi chụp màn hình: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  }, [triggerReaction]);

  const handleAnalyzeScreen = useCallback(async () => {
    if (!screenCapture?.imageBase64) return;
    setIsAnalyzing(true); setError(null);
    try {
      const res = await analyzeScreenImage(screenCapture.imageBase64, screenPrompt || undefined);
      setScreenAnalysis(res);
      triggerReaction("happy");
    } catch (err: any) {
      setError("Lỗi phân tích màn hình: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [screenCapture, screenPrompt, triggerReaction]);

  const handleClearScreen = useCallback(() => {
    setScreenCapture(null);
    setScreenAnalysis(null);
  }, []);

  const handleExecuteComputerUse = useCallback(async () => {
    if (!computerGoal.trim()) return;
    setIsExecutingLoop(true);
    setError(null);
    setLoopResult(null);
    triggerReaction("thinking");
    speak("Glacia dang khoi dong Robot Hands va chuoi Vision-Action Loop...", "happy");

    try {
      const res = await executeVisionLoop({
        goal: computerGoal,
        maxSteps,
        dryRun: isDryRun,
      });
      setLoopResult(res);
      if (res.success) {
        triggerReaction("celebrating");
        speak(`Robot Hands da hoan tat ${res.totalSteps} buoc thao tac!`, "celebrating");
      } else {
        triggerReaction("sad");
      }
    } catch (err: any) {
      setError("Loi Computer Use: " + err.message);
      triggerReaction("sad");
    } finally {
      setIsExecutingLoop(false);
    }
  }, [computerGoal, maxSteps, isDryRun, triggerReaction, speak]);
  return (
    <div className="space-y-4 text-left animate-fadeIn">
      {/* ── Tab Selector ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'image'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          Phân Tích Ảnh
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('screen')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'screen'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Chụp Màn Hình
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('computer-use')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'computer-use'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          Robot Hands
        </button>
      </div>

      {/* ── TAB: Image Analysis ── */}
      {activeTab === 'image' && (
      <>
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Eye className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" /> Glacia Vision Engine
            </h3>
            <p className="text-[11px] text-slate-400">
              Phan tich hinh anh voi <span className="text-purple-400 font-mono font-bold">Doubao Vision</span>
            </p>
          </div>
        </div>
        <button type="button" onClick={handleLoadHistory} disabled={isLoadingHistory}
          className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer">
          {isLoadingHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
          Lich su
        </button>
      </div>
      {showHistory && history.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-h-[200px] overflow-y-auto space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lich su phan tich ({history.length})</h4>
          {history.map((h, i) => (
            <div key={i} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px]">
              <div className="flex items-center justify-between text-slate-400 font-mono mb-1">
                <span>{h.modelUsed}</span><span>{h.durationMs}ms</span>
              </div>
              <p className="text-slate-300 line-clamp-2">{h.description}</p>
            </div>
          ))}
        </div>
      )}
      <div className={`relative p-6 rounded-2xl border-2 border-dashed transition-all ${selectedImage ? "bg-slate-950/80 border-purple-500/50" : "bg-slate-950/40 border-slate-800 hover:border-purple-500/30"}`}>
        {!selectedImage ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Image className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Keo tha anh hoac chon tu may tinh</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md">
                <Upload className="w-4 h-4" /> Chon Anh
              </button>
              <button type="button" onClick={handlePaste}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-800">
                <Clipboard className="w-4 h-4" /> Dan tu Clipboard
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{selectedFileName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {(selectedImage!.length * 0.75 / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <button type="button" onClick={handleClear}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 max-h-[240px]">
              <img src={`data:image/jpeg;base64,${selectedImage}`} alt="Preview" className="w-full h-full object-contain max-h-[240px]" />
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input type="text" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Nhap cau hoi tuy chinh ve anh (khong bat buoc)..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all" />
            </div>
            <button type="button" onClick={handleAnalyze} disabled={isAnalyzing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-500/20">
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Dang phan tich voi Doubao Vision...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Phan tich Anh voi Glacia Vision</>
              )}
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`p-3 rounded-2xl border ${result.success ? "bg-emerald-950/30 border-emerald-500/30" : "bg-red-950/30 border-red-500/30"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span className={`text-[11px] font-bold ${result.success ? "text-emerald-300" : "text-red-300"}`}>
                  {result.success ? "Phan tich thanh cong" : "Phan tich that bai"}
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">{result.modelUsed} - {result.durationMs}ms</span>
            </div>
            {result.success && result.confidence && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
                  <span>Do tin cay</span>
                  <span className="font-mono font-bold">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${(result.confidence * 100).toFixed(0)}%` }} />
                </div>
              </div>
            )}
            {result.labels && result.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {result.labels.map((label, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[9px] text-purple-300 font-mono">{label}</span>
                ))}
              </div>
            )}
            <div className="mt-1">
              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{result.description}</p>
            </div>
            {!result.success && result.error && <p className="text-[10px] text-red-400 mt-1 font-mono">{result.error}</p>}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800">
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] text-slate-500 font-mono">Tokens used: {result.tokensUsed.toLocaleString()} - {result.durationMs}ms</span>
          </div>
        </div>
      )}

      {/* History toggle */}
      <div className="border-t border-slate-800 pt-3 mt-2">
        <button
          type="button"
          onClick={async () => {
            setShowHistory(!showHistory);
            if (!showHistory && history.length === 0) {
              setIsLoadingHistory(true);
              try {
                const h = await fetchVisionHistory();
                setHistory(h);
              } catch (err: any) {
                console.error('Failed to fetch vision history:', err);
              } finally {
                setIsLoadingHistory(false);
              }
            }
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs font-bold cursor-pointer"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'An lich su phan tich' : 'Xem lich su phan tich'}
          {isLoadingHistory && <Loader2 className="w-3 h-3 animate-spin" />}
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
            {history.length === 0 && !isLoadingHistory && (
              <p className="text-[10px] text-slate-500 italic px-1">Chua co lich su phan tich nao.</p>
            )}
            {history.map((item, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border text-[10px] ${item.success ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-300 truncate">
                    {item.success ? '✓' : '✗'} {item.labels?.slice(0, 3).join(', ') || 'Phan tich'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono whitespace-nowrap">
                    {item.modelUsed} | {item.durationMs}ms
                  </span>
                </div>
                <p className="text-slate-400 line-clamp-2">
                  {item.description?.slice(0, 120)}
                  {item.description?.length > 120 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* ── TAB: Screen Capture ── */}
      {activeTab === 'screen' && (
      <>
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Monitor className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-purple-400" /> Glacia Screen Awareness
            </h3>
            <p className="text-[11px] text-slate-400">Chup va phan tich man hinh Windows desktop</p>
          </div>
        </div>
        <button type="button" onClick={() => { setShowScreenHistory(!showScreenHistory); if (!showScreenHistory && screenHistory.length === 0) { setIsLoadingScreenHistory(true); fetchScreenAnalysisHistory().then(setScreenHistory).finally(() => setIsLoadingScreenHistory(false)); } }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer">
          {isLoadingScreenHistory ? <Loader2 className="w-3 h-3 animate-spin" /> : <History className="w-3 h-3" />}
          Lich su
        </button>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleCaptureScreen} disabled={isCapturing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-black tracking-wide border border-purple-400/30 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50">
          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {isCapturing ? 'Dang chup...' : 'Chup & Phan Tich Man Hinh'}
        </button>
        <button type="button" onClick={handleCaptureOnly} disabled={isCapturing}
          className="px-3 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
          title="Chi chup man hinh, khong phan tich">
          <Target className="w-4 h-4" />
        </button>
      </div>

      <textarea value={screenPrompt} onChange={(e) => setScreenPrompt(e.target.value)}
        placeholder="Prompt tuy chinh cho phan tich (de trong = mac dinh)..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50 transition-all"
      />

      {screenCapture && screenCapture.imageBase64 && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60">
          <div className="relative">
            <img src={`data:image/png;base64,${screenCapture.imageBase64}`} alt="Screen capture"
              className="w-full h-auto max-h-[280px] object-contain" />
            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-[9px] text-slate-400 font-mono">
              {screenCapture.width}x{screenCapture.height}
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[9px] text-slate-500 font-mono">{new Date(screenCapture.timestamp).toLocaleTimeString()}</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={handleAnalyzeScreen} disabled={isAnalyzing}
                className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-[9px] font-bold transition-all cursor-pointer">
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Sparkles className="w-3 h-3 inline" />} Phan tich
              </button>
              <button type="button" onClick={handleClearScreen}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] transition-all cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {screenAnalysis && (
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2">
          <div className="flex items-center gap-2">
            {screenAnalysis.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span className="text-[11px] font-bold text-slate-300">{screenAnalysis.success ? 'Ket qua phan tich' : 'Loi phan tich'}</span>
          </div>
          {screenAnalysis.layout && screenAnalysis.layout !== 'unknown' && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
              <Layout className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] text-indigo-300 font-mono font-bold">{screenAnalysis.layout}</span>
            </div>
          )}
          <p className="text-[11px] text-slate-300 leading-relaxed">{screenAnalysis.description}</p>
          {screenAnalysis.elements.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Elements ({screenAnalysis.elements.length})</p>
              <div className="max-h-[160px] overflow-y-auto space-y-1">
                {screenAnalysis.elements.map((el, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <MousePointer2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-[10px] text-slate-300 font-mono">[{el.type}] {el.label || '(no label)'}</span>
                    <span className="text-[8px] text-slate-600 ml-auto font-mono">{(el.confidence * 100).toFixed(0)}%</span>
                    {el.interactionHint && <span className="text-[8px] text-cyan-400 italic ml-1">{el.interactionHint}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {screenAnalysis.suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> Suggestions</p>
              {screenAnalysis.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                  <Target className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-slate-300">{s}</span>
                </div>
              ))}
            </div>
          )}
          {!screenAnalysis.success && screenAnalysis.error && (
            <p className="text-[10px] text-red-400 mt-1 font-mono">{screenAnalysis.error}</p>
          )}
        </div>
      )}

      {showScreenHistory && (
        <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-slate-500 font-bold uppercase">Lich su phan tich man hinh</p>
            <button type="button" onClick={async () => { await clearScreenAnalysisHistory(); setScreenHistory([]); }}
              className="text-[9px] text-red-400 hover:text-red-300 transition-all cursor-pointer">Xoa tat ca</button>
          </div>
          {screenHistory.length === 0 && !isLoadingScreenHistory && (
            <p className="text-[10px] text-slate-500 italic px-1">Chua co lich su nao.</p>
          )}
          {isLoadingScreenHistory && <Loader2 className="w-3 h-3 animate-spin mx-auto" />}
          {screenHistory.map((item, i) => (
            <div key={i} className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-slate-300 truncate">{item.description}</span>
                <span className="text-[8px] text-slate-600 font-mono">{item.elementCount} elements</span>
              </div>
              <span className="text-[8px] text-slate-600 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* ── TAB: Computer Use (Robot Hands) ── */}
      {activeTab === 'computer-use' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <MousePointer2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Glacia Robot Hands & Computer Use
                </h3>
                <p className="text-[11px] text-slate-400">
                  Chuỗi <span className="text-emerald-400 font-mono font-bold">Vision-Action Loop</span> điều khiển màn hình máy tính tự động
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mục tiêu thao tác máy tính</label>
              <input
                type="text"
                value={computerGoal}
                onChange={(e) => setComputerGoal(e.target.value)}
                placeholder="Ví dụ: Mở dashboard tài chính và kiểm tra chỉ số doanh thu..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Số bước tối đa:</span>
                  <span className="font-bold text-white font-mono">{maxSteps} bước</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxSteps}
                  onChange={(e) => setMaxSteps(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-300">Chế độ Dry-Run</p>
                  <p className="text-[9px] text-slate-500">Mô phỏng an toàn không click thật</p>
                </div>
                <input
                  type="checkbox"
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteComputerUse}
              disabled={isExecutingLoop || !computerGoal.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isExecutingLoop ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang chạy Vision-Action Loop...</>
              ) : (
                <><MousePointer2 className="w-4 h-4" /> Kích hoạt Robot Hands (Computer Use)</>
              )}
            </button>
          </div>

          {loopResult && (
            <div className="space-y-2 p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {loopResult.finalOutcome}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{loopResult.durationMs}ms</span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pt-2">
                {loopResult.stepsExecuted.map((st) => (
                  <div key={st.stepNumber} className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span className="font-bold text-emerald-300">Bước {st.stepNumber}: [{st.action.toUpperCase()}]</span>
                      <span className="font-mono text-slate-500 text-[9px]">{st.targetDescription}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{st.explanation}</p>
                    {st.x !== undefined && st.y !== undefined && (
                      <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">Tọa độ mục tiêu: ({st.x}, {st.y})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300 font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}
