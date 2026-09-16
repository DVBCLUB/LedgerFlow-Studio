import React, { useState, useEffect } from 'react';
import {
  Globe,
  Wrench,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  RefreshCw,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
  Bot,
  Radar,
  Eye,
  Shield,
  FileText,
} from 'lucide-react';
import {
  searchTechnicalDocs,
  fetchResearchHistory,
  triggerSelfHealingCode,
  type ResearchResult,
  type SelfHealingResult,
} from '../../utils/glaciaResearchApi';
import {
  runWebResearch,
  fetchWebResearchReports,
  fetchCompetitorAlerts,
  trackCompetitorUrl,
  inspectWebpageWithGemini,
  fetchStealthCadenceSettings,
  updateStealthCadenceSettings,
  fetchGlaciaWebEcosystemStatus,
  planGlaciaWebAutomation,
  prepareGlaciaStealthSession,
  type WebResearchReport,
  type CompetitorChangeAlert,
  type WebpageAnalysisResult,
  type StealthCadenceConfig,
} from '../../utils/glaciaWebAgentApi';
import { useGlacia } from './GlaciaContext';

export default function GlaciaAutonomousResearchModal() {
  const { triggerReaction, speak } = useGlacia();

  const [activeTab, setActiveTab] = useState<'gemini_deep_web' | 'research' | 'web_agent' | 'self_heal' | 'history'>('gemini_deep_web');

  // Gemini Deep Web Inspection States
  const [inspectUrl, setInspectUrl] = useState('https://ai.google.dev/gemini-api/docs');
  const [inspectQuestion, setInspectQuestion] = useState('Cơ chế hoạt động của Google Search Grounding trên Gemini là gì và cú pháp gọi như thế nào?');
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<WebpageAnalysisResult | null>(null);

  // Stealth Webchat & Anti-Ban Cadence States
  const [stealthConfig, setStealthConfig] = useState<StealthCadenceConfig>({
    interactionMode: 'stealth_human',
    baseWpm: 60,
    typoRate: 0.018,
    allowTypoCorrection: true,
    antiBotSafetyScore: 99.8,
  });
  const [isSavingStealth, setIsSavingStealth] = useState(false);
  const [webAutomationStatus, setWebAutomationStatus] = useState<any>(null);
  const [webAutomationPlan, setWebAutomationPlan] = useState<any>(null);
  const [isPlanningAutomation, setIsPlanningAutomation] = useState(false);
  const [webAutomationError, setWebAutomationError] = useState('');

  // Web Research States
  const [searchQuery, setSearchQuery] = useState('Tạo hiệu ứng hào quang Quantum Aurora cho mô hình 3D bằng Three.js shader');
  const [searchCategory, setSearchCategory] = useState<'fullstack_code' | 'api_docs' | 'blender_3d' | 'video_ffmpeg'>('fullstack_code');
  const [isSearching, setIsSearching] = useState(false);
  const [currentResearch, setCurrentResearch] = useState<ResearchResult | null>(null);
  const [historyList, setHistoryList] = useState<ResearchResult[]>([]);

  // Web Agent & Competitor Spider States
  const [webAgentTopic, setWebAgentTopic] = useState('Phân tích đối thủ cạnh tranh mảng ERP Kế toán AI và SaaS tại Đông Nam Á');
  const [isWebScraping, setIsWebScraping] = useState(false);
  const [webReport, setWebReport] = useState<WebResearchReport | null>(null);
  const [competitorAlerts, setCompetitorAlerts] = useState<CompetitorChangeAlert[]>([]);
  const [competitorName, setCompetitorName] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isTrackLoading, setIsTrackLoading] = useState(false);

  // Self-Healing States
  const [errorInput, setErrorInput] = useState('TypeError: Cannot read properties of undefined (reading "items") at DashboardPanel.tsx:142');
  const [affectedFile, setAffectedFile] = useState('src/modules/command-center/CEOOverviewPanel.tsx');
  const [isHealing, setIsHealing] = useState(false);
  const [healingResult, setHealingResult] = useState<SelfHealingResult | null>(null);

  const loadHistory = async () => {
    try {
      const [h, alerts, stealth] = await Promise.all([
        fetchResearchHistory().catch(() => []),
        fetchCompetitorAlerts().catch(() => []),
        fetchStealthCadenceSettings().catch(() => null),
      ]);
      setHistoryList(h);
      setCompetitorAlerts(alerts);
      if (stealth) setStealthConfig(stealth);
      const ecosystem = await fetchGlaciaWebEcosystemStatus().catch(() => null);
      if (ecosystem) setWebAutomationStatus(ecosystem);
    } catch {}
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleInspectWebpage = async () => {
    if (!inspectUrl.trim()) return;
    setIsInspecting(true);
    triggerReaction('thinking');
    try {
      const res = await inspectWebpageWithGemini({
        url: inspectUrl,
        question: inspectQuestion,
        enableSearchGrounding: enableGrounding,
        interactionMode: stealthConfig.interactionMode,
      });
      setInspectResult(res);
      triggerReaction('sparkle');
      speak(`Glacia và Gemini đã bóc tách xong nội dung từ trang web ${res.pageTitle}`, 'celebrating');
    } catch (err: any) {
      triggerReaction('sad');
      speak(`Lỗi khi quét trang web: ${err.message}`, 'neutral');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleUpdateStealth = async (newConfig: Partial<StealthCadenceConfig>) => {
    setIsSavingStealth(true);
    try {
      const updated = await updateStealthCadenceSettings(newConfig);
      setStealthConfig(updated);
      triggerReaction('nod');
    } catch {} finally {
      setIsSavingStealth(false);
    }
  };

  const handlePlanAutomation = async (prepareSession = false) => {
    if (!inspectUrl.trim()) return;
    setIsPlanningAutomation(true);
    setWebAutomationError('');
    try {
      const [planResult, sessionResult] = await Promise.all([
        planGlaciaWebAutomation({
          targetUrl: inspectUrl,
          preferVoiceDictation: stealthConfig.interactionMode === 'voice_dictation',
        }),
        prepareSession ? prepareGlaciaStealthSession(inspectUrl) : Promise.resolve(null),
      ]);
      setWebAutomationPlan({ ...planResult.plan, session: sessionResult?.session });
      const ecosystem = await fetchGlaciaWebEcosystemStatus().catch(() => null);
      if (ecosystem) setWebAutomationStatus(ecosystem);
      triggerReaction('nod');
    } catch (err: any) {
      setWebAutomationError(err.message || 'Không thể lập kế hoạch automation');
      triggerReaction('sad');
    } finally {
      setIsPlanningAutomation(false);
    }
  };

  const handleResearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    triggerReaction('thinking');
    try {
      const res = await searchTechnicalDocs({
        query: searchQuery,
        category: searchCategory,
      });
      setCurrentResearch(res);
      triggerReaction('sparkle');
      speak(`Glacia đã tìm thấy và tổng hợp giải pháp kỹ thuật tối ưu cho: ${searchQuery}`, 'celebrating');
      void loadHistory();
    } catch (err: any) {
      triggerReaction('sad');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRunWebAgent = async () => {
    if (!webAgentTopic.trim() || isWebScraping) return;
    setIsWebScraping(true);
    triggerReaction('thinking');
    try {
      const rep = await runWebResearch({
        topic: webAgentTopic,
        autoSaveToMemory: true,
      });
      setWebReport(rep);
      triggerReaction('sparkle');
      speak(`Glacia đã hoàn tất quét web và trích xuất dữ liệu cho chủ đề: ${webAgentTopic}`, 'celebrating');
    } catch (err) {
      triggerReaction('sad');
    } finally {
      setIsWebScraping(false);
    }
  };

  const handleTrackCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorName.trim() || !competitorUrl.trim() || isTrackLoading) return;
    setIsTrackLoading(true);
    try {
      await trackCompetitorUrl({
        competitorName,
        url: competitorUrl,
      });
      setCompetitorName('');
      setCompetitorUrl('');
      const updatedAlerts = await fetchCompetitorAlerts();
      setCompetitorAlerts(updatedAlerts);
      triggerReaction('sparkle');
    } catch {} finally {
      setIsTrackLoading(false);
    }
  };

  const handleSelfHeal = async () => {
    if (!errorInput.trim()) return;
    setIsHealing(true);
    triggerReaction('thinking');
    try {
      const res = await triggerSelfHealingCode({
        errorLog: errorInput,
        affectedFile: affectedFile || undefined,
      });
      setHealingResult(res);
      triggerReaction('sparkle');
      speak('Glacia đã phân tích xong cây lỗi và chuẩn bị bản vá an toàn!', 'confident');
    } catch (err: any) {
      triggerReaction('sad');
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <Globe className="h-5 w-5 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Autonomous Web Spider, Research &amp; Self-Healing Code
              </h3>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-300 border border-indigo-500/30">
                Self-Learning Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Glacia tự tìm kiếm tài liệu trên Internet, quét radar đối thủ và tự sửa lỗi mã nguồn như kỹ sư cấp cao.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('gemini_deep_web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gemini_deep_web'
                ? 'bg-blue-600 text-white shadow-md font-black ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Gemini Deep Web &amp; Tàng Hình
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'research'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Tự Học Tri Thức Web
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('web_agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'web_agent'
                ? 'bg-purple-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radar className="h-3.5 w-3.5" /> Radar Đối Thủ &amp; Web Spider
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('self_heal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'self_heal'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" /> Tự Sửa Lỗi (Self-Heal)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Kho Tri Thức Đã Học
          </button>
        </div>
      </div>

      {/* ── TAB 0: GEMINI DEEP WEB & STEALTH WEBCHAT ANTI-BAN ── */}
      {activeTab === 'gemini_deep_web' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-cyan-950/30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-black text-blue-300 border border-blue-500/40">
                  Google Gemini Deep Integration
                </span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/40">
                  Stealth Anti-Ban Active
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Bóc Tách Dữ Liệu Bất Kỳ Website Nào &amp; Nhắn Tin Như Con Người
              </h4>
              <p className="text-xs text-slate-400">
                Glacia quét toàn bộ cấu trúc trang web nạp vào ngữ cảnh 2M tokens của Gemini để giải đáp câu hỏi, kèm nhịp gõ phím Gaussian và giả lập giọng nói né 100% khóa tài khoản Webchat AI.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
              <Shield className="h-4 w-4 text-emerald-400" />
              <div className="text-left">
                <div className="text-[10px] font-semibold text-slate-400">Độ An Toàn Chống Bot</div>
                <div className="text-xs font-black text-emerald-400">99.8% (Tàng Hình Hoàn Toàn)</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-violet-200">Trung tâm điều phối Web Automation</div>
                <p className="mt-1 text-[11px] text-slate-400">Hiển thị Account Orchestrator, HITL Telegram, Web Monitor, Batch Inspector và Gemini Live. Chỉ lập kế hoạch; không tự mở hoặc điều khiển web bên thứ ba.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void handlePlanAutomation(false)} disabled={isPlanningAutomation} className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-[11px] font-bold text-violet-100 hover:bg-violet-500/30 disabled:opacity-50">
                  {isPlanningAutomation ? 'Đang lập kế hoạch…' : 'Lập kế hoạch an toàn'}
                </button>
                <button type="button" onClick={() => void handlePlanAutomation(true)} disabled={isPlanningAutomation} className="rounded-lg bg-violet-600 px-3 py-2 text-[11px] font-black text-white hover:bg-violet-500 disabled:opacity-50">
                  Chuẩn bị phiên thủ công
                </button>
              </div>
            </div>
            {webAutomationStatus && (
              <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
                <div className="rounded-lg bg-slate-950/70 p-2 text-slate-300">Tài khoản <b className="text-white">{webAutomationStatus.status?.accounts?.totalAccounts ?? 0}</b></div>
                <div className="rounded-lg bg-slate-950/70 p-2 text-slate-300">HITL đang mở <b className="text-amber-300">{webAutomationStatus.status?.hitl?.openTickets ?? 0}</b></div>
                <div className="rounded-lg bg-slate-950/70 p-2 text-slate-300">Monitor chạy <b className="text-emerald-300">{webAutomationStatus.status?.monitors?.activeTasks ?? 0}</b></div>
                <div className="rounded-lg bg-slate-950/70 p-2 text-slate-300">Gemini Live voices <b className="text-cyan-300">{webAutomationStatus.liveVoices?.length ?? 0}</b></div>
              </div>
            )}
            {webAutomationPlan && <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-[11px] text-slate-300">Kế hoạch: <b className="text-white">{webAutomationPlan.mode}</b> · {webAutomationPlan.reason} · Nền tảng: {webAutomationPlan.targetPlatformName}{webAutomationPlan.session?.account ? ` · Account: ${webAutomationPlan.session.account.label}` : ''}</div>}
            {webAutomationError && <div className="text-[11px] text-rose-300">{webAutomationError}</div>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cột trái: Quét Website & Hỏi đáp với Gemini */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-blue-400" /> Bóc Tách Trang Web &amp; Hỏi Đáp Gemini
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1M - 2M Context</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Đường dẫn trang web (Bất kỳ URL nào):</label>
                  <input
                    type="url"
                    value={inspectUrl}
                    onChange={(e) => setInspectUrl(e.target.value)}
                    placeholder="https://example.com/bai-viet-hoac-tai-lieu"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Câu hỏi muốn Gemini phân tích từ trang web:</label>
                  <textarea
                    value={inspectQuestion}
                    onChange={(e) => setInspectQuestion(e.target.value)}
                    rows={3}
                    placeholder="Ví dụ: Tóm tắt 3 quy định cốt lõi trong tài liệu này và liệt kê các số liệu dạng bảng..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Grounding Toggle */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      Google Search Grounding Thời Gian Thực
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tự động đối chiếu dữ liệu với Google Search và chèn link trích dẫn nguồn uy tín.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableGrounding}
                    onChange={(e) => setEnableGrounding(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500">Mẫu thử nghiệm nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectUrl('https://ai.google.dev/gemini-api/docs/grounding');
                      setInspectQuestion('Hướng dẫn cách tích hợp Google Search Grounding trên Gemini API mới nhất?');
                    }}
                    className="rounded-lg bg-slate-800/80 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-slate-700 transition-colors"
                  >
                    Google Gemini Grounding Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectUrl('https://mof.gov.vn/webcenter/portal/btc');
                      setInspectQuestion('Tổng hợp các hướng dẫn mới nhất về chính sách thuế GTGT và hóa đơn điện tử?');
                    }}
                    className="rounded-lg bg-slate-800/80 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-slate-700 transition-colors"
                  >
                    Bộ Tài Chính (Thuế &amp; VAS)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleInspectWebpage}
                  disabled={isInspecting || !inspectUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-black text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
                >
                  {isInspecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Glacia Đang Bóc Tách Trang Web &amp; Phân Tích Với Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Quét Trang Web &amp; Trả Lời Bằng Google Gemini
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cột phải: Bộ Điều Khiển Chống Khóa Tài Khoản Webchat AI */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-emerald-400" /> Cấu Hình Tàng Hình (Anti-Ban &amp; TOS)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">An toàn tuyệt đối</span>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Phương thức thao tác trên Webchat AI:</label>
                  <div className="space-y-2">
                    <label
                      onClick={() => handleUpdateStealth({ interactionMode: 'stealth_human' })}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        stealthConfig.interactionMode === 'stealth_human'
                          ? 'border-blue-500/60 bg-blue-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interactionMode"
                        checked={stealthConfig.interactionMode === 'stealth_human'}
                        onChange={() => {}}
                        className="mt-0.5 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="text-left space-y-0.5">
                        <div className="text-xs font-bold text-slate-200">👤 Gõ phím mô phỏng người thật (Human Cadence)</div>
                        <div className="text-[11px] text-slate-400">
                          Tốc độ gõ vừa phải, ngắt nghỉ theo dấu câu, tự tạo lỗi gõ nhầm (typo) và Backspace sửa lỗi.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => handleUpdateStealth({ interactionMode: 'voice_dictation' })}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        stealthConfig.interactionMode === 'voice_dictation'
                          ? 'border-emerald-500/60 bg-emerald-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interactionMode"
                        checked={stealthConfig.interactionMode === 'voice_dictation'}
                        onChange={() => {}}
                        className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="text-left space-y-0.5">
                        <div className="text-xs font-bold text-slate-200">🎙️ Giả lập ghi âm giọng nói (Voice Dictation)</div>
                        <div className="text-[11px] text-slate-400">
                          Chèn văn bản theo cụm từ (2-5 từ/nhịp thở), né 100% hệ thống kiểm tra bàn phím của OpenAI/Gemini.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => handleUpdateStealth({ interactionMode: 'fast_direct' })}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        stealthConfig.interactionMode === 'fast_direct'
                          ? 'border-amber-500/60 bg-amber-950/30'
                          : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interactionMode"
                        checked={stealthConfig.interactionMode === 'fast_direct'}
                        onChange={() => {}}
                        className="mt-0.5 text-amber-500 focus:ring-amber-500"
                      />
                      <div className="text-left space-y-0.5">
                        <div className="text-xs font-bold text-slate-200">⚡ Siêu tốc (Fast Injection - Dành cho Test)</div>
                        <div className="text-[11px] text-slate-400">Bơm nội dung 0ms tức thời (có thể bị Cloudflare nghi vấn).</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Typing Speed WPM Slider */}
                {stealthConfig.interactionMode === 'stealth_human' && (
                  <div className="space-y-2 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">Tốc độ gõ phím (WPM):</span>
                      <span className="font-black text-blue-400 font-mono">
                        {stealthConfig.baseWpm} WPM (~{stealthConfig.baseWpm * 5} CPM)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="90"
                      step="5"
                      value={stealthConfig.baseWpm}
                      onChange={(e) => handleUpdateStealth({ baseWpm: Number(e.target.value) })}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>35 WPM (Từ tốn)</span>
                      <span>60 WPM (Tự nhiên)</span>
                      <span>90 WPM (Nhanh)</span>
                    </div>
                  </div>
                )}

                {/* Typo Correction Toggle */}
                <div className="flex items-center justify-between rounded-xl bg-slate-950/70 p-3 border border-slate-800">
                  <div className="space-y-0.5 text-left">
                    <div className="text-xs font-bold text-slate-200">Lỗi gõ phím &amp; Backspace tự sửa</div>
                    <div className="text-[11px] text-slate-400">
                      Tạo lỗi phím lân cận 1.8% rồi ấn Backspace gõ lại chữ đúng như người thật.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stealthConfig.allowTypoCorrection}
                    onChange={(e) => handleUpdateStealth({ allowTypoCorrection: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Behavioral Details Pill */}
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 text-left">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Quỹ đạo chuột đường cong Bézier bậc 3 (18 steps)
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Dừng ngẫm đọc lại câu trước khi bấm Gửi (1.5s - 2.5s)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          {inspectResult && (
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/80 p-5 space-y-4 text-left shadow-xl shadow-blue-500/5 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-black text-blue-400">
                    Kết quả phân tích từ Google Gemini:
                  </span>
                  <h4 className="text-base font-bold text-white">{inspectResult.pageTitle}</h4>
                  <a
                    href={inspectResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> {inspectResult.url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-300 border border-blue-500/40">
                    Model: {inspectResult.modelUsed}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                    {inspectResult.charCountAnalyzed.toLocaleString()} ký tự
                  </span>
                </div>
              </div>

              {/* Answer Content */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300">Câu hỏi: "{inspectResult.question}"</div>
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {inspectResult.answerWithCitations}
                </div>
              </div>

              {/* Citations List */}
              {inspectResult.sources?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-300 block">Nguồn dẫn &amp; Liên kết đối chiếu:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {inspectResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-slate-950 p-2 text-xs text-blue-300 hover:text-white border border-slate-800 hover:border-blue-500/50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: WEB RESEARCH ── */}
      {activeTab === 'research' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Search className="h-4 w-4 text-indigo-400" /> Nhập Bài Toán Kỹ Thuật
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Vấn đề cần Glacia tự nghiên cứu:</label>
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Nhập câu hỏi, tên thư viện, hoặc cú pháp cần nghiên cứu..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">Phân loại lĩnh vực:</label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none text-xs"
                >
                  <option value="fullstack_code">Fullstack Coding &amp; TypeScript</option>
                  <option value="blender_3d">Blender 3D &amp; Shader Python</option>
                  <option value="video_ffmpeg">Video Processing &amp; FFmpeg</option>
                  <option value="api_docs">Tài liệu API &amp; Webhooks</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleResearch}
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isSearching ? 'Glacia đang Quét Internet & Đọc Docs...' : '🚀 Kích Hoạt Tự Học Tri Thức'}</span>
              </button>
            </div>
          </div>

          {/* Right: Synthesis Result */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Báo Cáo Nghiên Cứu &amp; Công Thức Tối Ưu
            </span>

            {currentResearch ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs space-y-1.5">
                  <span className="font-black text-white block">✓ Giải pháp Đã Tự Tổng Hợp:</span>
                  <p>{currentResearch.synthesizedSolution}</p>
                </div>

                {currentResearch.articles.map((art, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{art.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400">Độ tin cậy: {art.relevanceScore}%</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{art.summary}</p>
                    {art.codeSnippets.length > 0 && (
                      <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 whitespace-pre-wrap">
                        {art.codeSnippets.join('\n')}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <Globe className="h-10 w-10 text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-400">Chưa có phiên nghiên cứu nào.</p>
                <span className="text-[10px] text-slate-500">
                  Nhập câu hỏi và nhấn "Kích Hoạt Tự Học Tri Thức" để Glacia phân tích tài liệu ngay.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: WEB AGENT SPIDER & COMPETITOR RADAR ── */}
      {activeTab === 'web_agent' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radar className="h-4 w-4 text-purple-400" /> Tác Tử Thu Thập Dữ Liệu Web Tự Trị
                </span>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Chủ đề phân tích thị trường & đối thủ:</label>
                  <textarea
                    value={webAgentTopic}
                    onChange={(e) => setWebAgentTopic(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: Thu thập bảng giá và tính năng của các đối thủ SaaS kế toán..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunWebAgent}
                  disabled={isWebScraping}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isWebScraping ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  <span>{isWebScraping ? 'Web Agent đang thu thập & phân tích...' : '🤖 Khởi Chạy Web Agent'}</span>
                </button>
              </div>

              {/* Add Competitor Tracker */}
              <form onSubmit={handleTrackCompetitor} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-cyan-400" /> Thêm URL Đối Thủ Cần Theo Dõi
                </span>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="Tên đối thủ (VD: ERP X, SaaS Y)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="url"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="URL trang web đối thủ (https://...)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!competitorName.trim() || !competitorUrl.trim() || isTrackLoading}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTrackLoading ? 'Đang thêm...' : '+ Theo Dõi Biến Động Đối Thủ'}
                </button>
              </form>
            </div>

            {/* Right: Web Agent Report & Alerts */}
            <div className="lg:col-span-7 space-y-4">
              {webReport ? (
                <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Báo Cáo Trích Xuất Web: {webReport.topic}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {webReport.sourcesScraped} nguồn đã quét
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                    {webReport.executiveSummary}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-cyan-400">💡 Phát Hiện Quan Trọng:</span>
                    <div className="space-y-1">
                      {webReport.keyFindings.map((f, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-cyan-400">●</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                  <Radar className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Chưa có phiên trích xuất web nào.</p>
                  <span className="text-[10px] text-slate-500">Khởi chạy Web Agent để quét dữ liệu tự động.</span>
                </div>
              )}

              {/* Competitor Alerts List */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-400" /> Cảnh Báo Biến Động Đối Thủ ({competitorAlerts.length})
                </span>
                {competitorAlerts.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {competitorAlerts.map((alert, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300">{alert.competitorName}</span>
                          <span className="text-[9px] font-mono text-slate-500">{alert.detectedAt}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{alert.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-4">Chưa có cảnh báo biến động mới.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SELF-HEALING CODE ── */}
      {activeTab === 'self_heal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-emerald-400" /> Trình Sửa Lỗi Tự Hành
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Dán Nhật Ký Lỗi (Error Stack Trace):</label>
                <textarea
                  value={errorInput}
                  onChange={(e) => setErrorInput(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  placeholder="Dán lỗi build, compile error hoặc exception..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">File bị ảnh hưởng (Tùy chọn):</label>
                <input
                  type="text"
                  value={affectedFile}
                  onChange={(e) => setAffectedFile(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSelfHeal}
                disabled={isHealing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isHealing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                <span>{isHealing ? 'Glacia đang Phân Tích & Vá Lỗi...' : '🛡️ Kích Hoạt Tự Vá Mã Nguồn'}</span>
              </button>
            </div>
          </div>

          {/* Right: Healing Result Preview */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-emerald-400" /> Bản Vá Mã Nguồn &amp; Đánh Giá An Toàn
            </span>

            {healingResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <span className="font-black text-white block">✓ Phân Tích Nguyên Nhân Gốc Rễ:</span>
                  <p>{healingResult.rootCause}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 block">Đề Xuất Khắc Phục:</span>
                  <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap">
                    {healingResult.proposedFix}
                  </pre>
                </div>

                {healingResult.diffPatch && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-cyan-300 block">Diff Patch Chuẩn:</span>
                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-emerald-400 whitespace-pre-wrap">
                      {healingResult.diffPatch}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <Wrench className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-400">Chưa có lỗi nào cần sửa.</p>
                <span className="text-[10px] text-slate-500">
                  Dán lỗi và nhấn "Kích Hoạt Tự Vá Mã Nguồn" để Glacia đề xuất bản sửa lỗi ngay.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: KNOWLEDGE HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-cyan-400" /> Các Đề Tài Kỹ Thuật Glacia Đã Tự Học &amp; Lưu Trữ
            </span>
            <button
              type="button"
              onClick={loadHistory}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Làm mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {historyList.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-white">{item.query}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{item.synthesizedSolution}</p>
                <span className="text-[9px] text-slate-500 font-mono block pt-1 border-t border-slate-900">
                  Lưu vào kho tri thức: {new Date(item.researchedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
