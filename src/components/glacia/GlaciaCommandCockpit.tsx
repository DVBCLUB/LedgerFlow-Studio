import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Mic,
  Zap,
  CheckCircle2,
  Clock,
  MessageSquare,
  Settings,
  Bot,
  Volume2,
  VolumeX,
  Activity,
  Sliders,
  Trash2,
  Brain,
  Eye,
  TrendingUp,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Award,
  Check,
  Cpu,
  ArrowRight,
  Plus,
  History,
  Edit3,
  Search,
  MessageCircle,
  Box,
} from 'lucide-react';
import { useGlacia, type DispatchedAgentTask } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { getBondingTierProgress, type MemoryVaultItem } from './GlaciaVirtualBeingState';
import { sendInteractionFeedback } from '../../utils/glaciaMemoryApi';
import { fetchAutonomyStatus, setGlaciaAutonomyLevel, type AutonomyState, type AutonomyLevel } from '../../utils/glaciaAutonomyApi';
import CustomGLBAvatar from './CustomGLBAvatar';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';
import GlaciaSoftwareHandsTab from './GlaciaSoftwareHandsTab';
import GlaciaAutonomousResearchModal from './GlaciaAutonomousResearchModal';
import GlaciaSwarmShiftPanel from './GlaciaSwarmShiftPanel';
import GlaciaVisionPanel from './GlaciaVisionPanel';
import GlaciaIntelligenceHub from './GlaciaIntelligenceHub';
import GlaciaNeuralSkillTree from './GlaciaNeuralSkillTree';
import GlaciaCognitiveThoughtHUD from './GlaciaCognitiveThoughtHUD';
import GlaciaStrategySimulationHUD from './GlaciaStrategySimulationHUD';
import GlaciaGameAndVideoStudioHUD from './GlaciaGameAndVideoStudioHUD';
import GlaciaAgentBridgePanel from './GlaciaAgentBridgePanel';
import GlaciaAdminPortalButton from './GlaciaAdminPortalButton';
import { glaciaModuleBridge } from './glaciaModuleBridge';

export default function GlaciaCommandCockpit() {
  const {
    isOpen,
    setIsOpen,
    mood,
    setMood,
    currentEmotion,
    telemetry,
    isListening,
    startVoiceListening,
    speak,
    stopSpeaking,
    voiceEnabled,
    setVoiceEnabled,
    chatMessages,
    sendMessageToGlacia,
    threads,
    activeThreadId,
    createNewThread,
    selectThread,
    deleteThread,
    renameThread,
    clearAllThreads,
    dispatchedTasks,
    dispatchGoalToSubAgents,
    subAgents,
    virtualProfile,
    vitals,
    addTrustScore,
    addMemoryVaultItem,
    deleteMemoryVaultItem,
    avatarModelType,
    setAvatarModelType,
    companionDisplayMode,
    setCompanionDisplayMode,
    userName,
    setUserName,
    persona,
  } = useGlacia();

  const [activeTab, setActiveTab] = useState<'chat' | 'simulation' | 'creative' | 'hands' | 'skills' | 'research' | 'settings'>('chat');
  const [goalInput, setGoalInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [testSpeechText, setTestSpeechText] = useState('');
  const [isRoundTableActive, setIsRoundTableActive] = useState(false);
  const [roundTableTopic, setRoundTableTopic] = useState('Chiến Lược Tăng Trưởng Q3 & Tự Động Hóa Doanh Nghiệp');
  const [newMemCategory, setNewMemCategory] = useState<MemoryVaultItem['category']>('goal');
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemDetail, setNewMemDetail] = useState('');
  const [isAddingMem, setIsAddingMem] = useState(false);
  const [autonomyState, setAutonomyState] = useState<AutonomyState | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  const [isChangingAutonomy, setIsChangingAutonomy] = useState(false);
  const [showDevTabs, setShowDevTabs] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load autonomy status
  useEffect(() => {
    fetchAutonomyStatus()
      .then((res) => setAutonomyState(res.state))
      .catch((err) => console.warn('Autonomy status notice:', err));
  }, []);

  const handleAutonomyChange = async (level: AutonomyLevel) => {
    setIsChangingAutonomy(true);
    try {
      const res = await setGlaciaAutonomyLevel(level);
      if (res.success) {
        setAutonomyState(res.state);
        glaciaAudio.playLevelUpFanfare();
      }
    } catch (err) {
      console.warn('Autonomy change notice:', err);
    } finally {
      setIsChangingAutonomy(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 'thumbs_up' | 'thumbs_down', queryPrompt: string, snippet: string) => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: rating }));
    glaciaAudio.playCrystalChime(rating === 'thumbs_up' ? 1200 : 600);
    try {
      await sendInteractionFeedback({
        rating,
        queryPrompt: queryPrompt || 'Yêu cầu chỉ huy',
        responseSnippet: snippet.slice(0, 150),
        category: 'general',
      });
      if (rating === 'thumbs_up') {
        addTrustScore(5, 'Đánh giá tích cực từ Giám đốc 👍');
      }
    } catch (err) {
      console.warn('Feedback send notice:', err);
    }
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // ESC key listener to close Cockpit easily
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const bondProgress = getBondingTierProgress(virtualProfile.trustScore);

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isSubmittingGoal) return;

    glaciaAudio.playQuantumDispatch();
    setIsSubmittingGoal(true);
    const goalText = goalInput;
    setGoalInput('');

    await dispatchGoalToSubAgents(goalText, selectedAgentIds.length > 0 ? selectedAgentIds : undefined);
    setIsSubmittingGoal(false);
    setSelectedAgentIds([]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    glaciaAudio.playCrystalChime(1046.5);
    const msg = chatInput;
    setChatInput('');
    await sendMessageToGlacia(msg);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
    >
      {/* ── COCKPIT OUTER CONTAINER ── */}
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[860px] bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-[#050b14] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden">
        {/* Top Glowing Tech Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-indigo-500" />

        {/* ── COCKPIT HEADER ── */}
        <div className="px-4 py-3 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400 p-0.5 bg-cyan-950/60 shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                <img src="/glacia-avatar.png" alt="Glacia" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1">
                  GLACIA <span className="text-cyan-400 font-mono text-[11px] font-normal hidden sm:inline">ROBOT AI</span>
                </h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold hidden md:inline">
                  {virtualProfile.archetype}
                </span>
                {autonomyState && (
                  <div className="relative group">
                    <button
                      type="button"
                      disabled={isChangingAutonomy}
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        autonomyState.currentLevel === 4
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                          : autonomyState.currentLevel === 3
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : autonomyState.currentLevel === 2
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : autonomyState.currentLevel === 1
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-700/40 text-slate-300 border-slate-600'
                      }`}
                      title="Mức độ tự trị hiện tại của Glacia (Click để đổi cấp)"
                    >
                      <Shield className="w-2.5 h-2.5" />
                      <span>Cấp {autonomyState.currentLevel}</span>
                    </button>

                    <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 w-52 p-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 px-2 py-0.5 uppercase">Chọn cấp tự trị:</div>
                      {[
                        { lvl: 0 as AutonomyLevel, name: 'L0: Quan sát (Observer)' },
                        { lvl: 1 as AutonomyLevel, name: 'L1: Cố vấn (Advisor)' },
                        { lvl: 2 as AutonomyLevel, name: 'L2: Chấp hành (Executor)' },
                        { lvl: 3 as AutonomyLevel, name: 'L3: Nhạc trưởng (Orchestrator)' },
                        { lvl: 4 as AutonomyLevel, name: 'L4: Tự trị Toàn diện (Autonomous)' },
                      ].map((item) => (
                        <button
                          key={item.lvl}
                          type="button"
                          onClick={() => handleAutonomyChange(item.lvl)}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            autonomyState.currentLevel === item.lvl
                              ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{item.name}</span>
                          {autonomyState.currentLevel === item.lvl && <Check className="w-3 h-3 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                <span className="text-cyan-300 font-semibold">{userName ? `Chào ${userName}` : persona.role}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">5 AI Staff Online</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Sleek & Clean) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-cyan-500/30 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Trò Chuyện</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'simulation'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mô Phỏng</span>
            </button>

            <button
              onClick={() => setActiveTab('creative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'creative'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/30 font-black'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Game & Video</span>
            </button>

            <button
              onClick={() => setActiveTab('hands')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'hands'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 font-black'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Đôi Tay Phần Mềm</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30 font-black'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Kỹ Năng ($0)</span>
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'research'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/30 font-black'
                  : 'text-slate-400 hover:text-indigo-300'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tự Nghiên Cứu</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài Đặt</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={startVoiceListening}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
              }`}
              title="Kích hoạt đàm thoại giọng nói (STT)"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                  : 'bg-slate-900 border-white/10 text-slate-500 hover:text-slate-300'
              }`}
              title={voiceEnabled ? 'Tắt đọc giọng nói AI (TTS)' : 'Bật đọc giọng nói AI (TTS)'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-500/50 text-rose-300 hover:text-white font-black text-xs transition-all cursor-pointer shadow-md shadow-rose-500/20"
              title="Tắt cửa sổ Glacia (Phím ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Đóng (ESC)</span>
            </button>
          </div>
        </div>

        {/* ── COCKPIT MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/60">

          {/* ── TAB 1 (PRIMARY): UNIFIED 3D GLB AVATAR + LIVE CHAT ── */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
              {/* Left Side: 3D GLB Avatar Viewport & Agent Fleet Bridge */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-cyan-500/20 bg-gradient-to-b from-slate-950 via-slate-900/90 to-black p-3.5 flex flex-col gap-3 shrink-0 overflow-y-auto scrollbar-thin">
                {/* 3D GLB Model Stage */}
                <div className="relative w-full h-48 md:h-56 rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-inner flex items-center justify-center shrink-0">
                  <CustomGLBAvatar
                    interactive={true}
                    enableOrbitControls={true}
                    showControlsHUD={false}
                    scale={1.0}
                    modelPath="/models/assistant/base_basic_pbr.glb"
                    fallbackModelPath="/models/assistant/base_basic_shaded.glb"
                    emissiveTexturePath="/models/assistant/texture_emissive.png"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 font-bold backdrop-blur-md">
                    Mô hình 3D GLB
                  </div>
                </div>

                {/* ── UNIFIED AI WORKFORCE FLEET BRIDGE ── */}
                <GlaciaAgentBridgePanel />

                {/* Quick Action Command Chips */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" /> Điều Hướng Nhanh:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => sendMessageToGlacia('Mở Báo Cáo Tài Chính & Dòng Tiền')}
                      className="px-2 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-left font-bold transition-all cursor-pointer truncate"
                    >
                      💎 Kế Toán
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessageToGlacia('Mở Phân Hệ Sales CRM & Khách Hàng')}
                      className="px-2 py-1 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-left font-bold transition-all cursor-pointer truncate"
                    >
                      🎯 Bán Hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessageToGlacia('Mở Phân Hệ Hồ Sơ & Phê Duyệt')}
                      className="px-2 py-1 rounded-xl bg-slate-900/90 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-left font-bold transition-all cursor-pointer truncate"
                    >
                      📋 Hồ Sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessageToGlacia('Mở Xưởng Sản Phẩm & Roadmap')}
                      className="px-2 py-1 rounded-xl bg-slate-900/90 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-left font-bold transition-all cursor-pointer truncate"
                    >
                      🛠️ Sản Phẩm
                    </button>
                    <button
                      type="button"
                      onClick={() => sendMessageToGlacia('Mở Trung Tâm Điều Hành CEO')}
                      className="col-span-2 px-2 py-1 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-left font-bold transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>⚡ Điều Hành CEO</span>
                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Conversation Chat Stream & Command Input */}
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/40 relative">
                {/* ── CHAT THREADS HEADER TOOLBAR ── */}
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between gap-2 shrink-0 z-10 backdrop-blur-md">
                  {/* Left: Active Thread Title + Rename */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    {editingThreadId === activeThreadId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameThread(activeThreadId, editingTitle);
                              setEditingThreadId(null);
                            } else if (e.key === 'Escape') {
                              setEditingThreadId(null);
                            }
                          }}
                          autoFocus
                          className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-400 text-xs text-white outline-none font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            renameThread(activeThreadId, editingTitle);
                            setEditingThreadId(null);
                          }}
                          className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 text-[10px] cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[180px] sm:max-w-[260px] md:max-w-[340px]">
                          {threads.find((t) => t.id === activeThreadId)?.title || 'Cuộc trò chuyện chính'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThreadId(activeThreadId);
                            setEditingTitle(threads.find((t) => t.id === activeThreadId)?.title || '');
                          }}
                          title="Đổi tên đoạn chat"
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      ({chatMessages.length} tin)
                    </span>
                  </div>

                  {/* Right: Actions (New Chat + History) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        createNewThread();
                        setIsHistoryDrawerOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/40 text-cyan-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="Bắt đầu cuộc trò chuyện mới"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Đoạn chat mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHistoryDrawerOpen((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isHistoryDrawerOpen
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Xem lịch sử các cuộc trò chuyện"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Lịch sử ({threads.length})</span>
                    </button>
                  </div>
                </div>

                {/* ── SLIDE-OVER HISTORY DRAWER ── */}
                {isHistoryDrawerOpen && (
                  <div className="absolute inset-0 top-[42px] z-20 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 space-y-3 animate-fade-in border-t border-cyan-500/20">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Lịch Sử Các Cuộc Trò Chuyện</h3>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                          {threads.length} chủ đề
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            createNewThread();
                            setIsHistoryDrawerOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tạo mới
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsHistoryDrawerOpen(false)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Search filter */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        placeholder="Tìm kiếm chủ đề hoặc nội dung đoạn chat..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Thread Cards List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {threads
                        .filter((t) => {
                          if (!historySearch.trim()) return true;
                          const q = historySearch.toLowerCase();
                          const titleMatch = t.title.toLowerCase().includes(q);
                          const msgMatch = t.messages.some((m) => m.text.toLowerCase().includes(q));
                          return titleMatch || msgMatch;
                        })
                        .map((thread) => {
                          const isActive = thread.id === activeThreadId;
                          const lastMsg = thread.messages[thread.messages.length - 1];
                          const userMsgCount = thread.messages.filter((m) => m.sender === 'user').length;
                          const updatedDate = new Date(thread.updatedAt);
                          const dateStr = updatedDate.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          });
                          const timeStr = updatedDate.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <div
                              key={thread.id}
                              onClick={() => {
                                selectThread(thread.id);
                                setIsHistoryDrawerOpen(false);
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                                isActive
                                  ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                  : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                                    isActive
                                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                                  }`}
                                >
                                  💬
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4
                                      className={`text-xs font-bold truncate ${
                                        isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                                      }`}
                                    >
                                      {thread.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                                      {dateStr} {timeStr}
                                    </span>
                                  </div>
                                  {lastMsg && (
                                    <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                                      {lastMsg.sender === 'user' ? '👤 ' : '✨ '}
                                      {lastMsg.text.replace(/[\n\r]+/g, ' ')}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                                      {thread.messages.length} tin nhắn ({userMsgCount} câu hỏi)
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                                        Đang mở
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Bạn có chắc muốn xóa cuộc trò chuyện "${thread.title}"?`)) {
                                    deleteThread(thread.id);
                                  }
                                }}
                                title="Xóa đoạn chat này"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa TOÀN BỘ lịch sử các cuộc trò chuyện?')) {
                            clearAllThreads();
                            setIsHistoryDrawerOpen(false);
                          }
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa tất cả lịch sử
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsHistoryDrawerOpen(false)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Đóng lịch sử
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-80">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
                        💬
                      </div>
                      <h3 className="text-sm font-bold text-white">Khung Chỉ Huy Trực Tuyến Với Glacia</h3>
                      <p className="text-xs text-slate-400 max-w-md">
                        Hãy gõ câu hỏi, yêu cầu phân tích số liệu, hoặc ra lệnh điều hướng các phân hệ doanh nghiệp ở thanh bên dưới.
                      </p>
                    </div>
                  )}

                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'glacia' && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400 shrink-0 shadow-md">
                          <img src="/glacia-avatar.png" alt="Glacia" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 break-words [overflow-wrap:anywhere] ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none shadow-lg'
                            : 'bg-slate-900/90 border border-cyan-500/30 text-slate-200 rounded-bl-none shadow-xl'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">{msg.text}</p>

                        {/* MCP Action Result Badge */}
                        {msg.mcpAction && (
                          <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-[11px] space-y-1 shadow-inner">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300 flex items-center gap-1.5 truncate max-w-[65%]">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block shrink-0" />
                                <span className="truncate">{msg.mcpAction.toolLabel}</span>
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold shrink-0">
                                ✅ MCP Thành Công
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Suggested Follow-up Action Button */}
                        {msg.suggestedAction && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.suggestedAction?.tab) {
                                  glaciaModuleBridge.navigateTo(msg.suggestedAction.tab, msg.suggestedAction.action);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              {msg.suggestedAction.label}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] opacity-80 pt-1 border-t border-white/5 mt-1">
                          <span className="text-slate-400">{msg.timestamp}</span>
                          {msg.sender === 'glacia' && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-300 font-bold hidden sm:inline">Glacia Assistant</span>
                              <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-lg border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'thumbs_up', 'Yêu cầu', msg.text)}
                                  disabled={Boolean(feedbackGiven[msg.id])}
                                  className={`p-0.5 rounded transition-all cursor-pointer ${
                                    feedbackGiven[msg.id] === 'thumbs_up'
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-slate-400 hover:text-emerald-300'
                                  }`}
                                  title="Đánh giá phản hồi xuất sắc (👍 +5 Trust)"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'thumbs_down', 'Yêu cầu', msg.text)}
                                  disabled={Boolean(feedbackGiven[msg.id])}
                                  className={`p-0.5 rounded transition-all cursor-pointer ${
                                    feedbackGiven[msg.id] === 'thumbs_down'
                                      ? 'text-rose-400 font-bold'
                                      : 'text-slate-400 hover:text-rose-300'
                                  }`}
                                  title="Góp ý cải thiện (👎 Phản hồi)"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleChatSubmit}
                  className="p-3.5 border-t border-cyan-500/20 bg-slate-900/80 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={startVoiceListening}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                    }`}
                    title="Nói chuyện với Glacia bằng giọng nói"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nhập yêu cầu, hỏi dữ liệu hoặc ra lệnh chỉ huy Glacia..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 shadow-inner"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                      chatInput.trim()
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title="Gửi lệnh"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 2: STRATEGY SIMULATION HUD ── */}
          {activeTab === 'simulation' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80">
              <GlaciaStrategySimulationHUD />
            </div>
          )}

          {/* ── TAB 3: GAME & VIDEO CREATIVE STUDIO HUD ── */}
          {activeTab === 'creative' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80">
              <GlaciaGameAndVideoStudioHUD />
            </div>
          )}

          {/* ── TAB 4: DIRECT SOFTWARE HANDS (BLENDER, CAPCUT, PHOTOSHOP) ── */}
          {activeTab === 'hands' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80">
              <GlaciaSoftwareHandsTab />
            </div>
          )}

          {/* ── TAB 5: NEURAL SKILL TREE & $0 LOCAL RUNTIME ── */}
          {activeTab === 'skills' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80">
              <GlaciaNeuralSkillTree />
            </div>
          )}

          {/* ── TAB 5: AUTONOMOUS RESEARCH & SELF-HEALING ── */}
          {activeTab === 'research' && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80">
              <GlaciaAutonomousResearchModal />
            </div>
          )}

          {/* ── TAB 6: SETTINGS & CUSTOMIZATION ── */}
          {activeTab === 'settings' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-5 max-w-3xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" /> Cấu Hình Trợ Lý AI & Trải Nghiệm
                  </h3>
                </div>

                {/* 1. User Name & Personalization */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">Tên Của Bạn (Để Trợ Lý Xưng Hô)</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="VD: Giám đốc Bảo, Founder, Anh Nam..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                  />
                </div>

                {/* 2. Floating Companion Display Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">Chế Độ Hiển Thị Widget Góc Màn Hình</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCompanionDisplayMode('living_sprite');
                        glaciaAudio.playCrystalChime(880);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        companionDisplayMode === 'living_sprite'
                          ? 'bg-slate-950 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">🤖</span>
                      <div>
                        <h4 className="text-xs font-bold">Living 3D WebGL Sprite</h4>
                        <p className="text-[10px] text-slate-400">Trợ lý 3D GLB trực tiếp lơ lửng ở góc màn hình.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCompanionDisplayMode('mini_orb');
                        glaciaAudio.playCrystalChime(880);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        companionDisplayMode === 'mini_orb'
                          ? 'bg-slate-950 border-emerald-400 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">🔮</span>
                      <div>
                        <h4 className="text-xs font-bold">Mini Neon Avatar Orb</h4>
                        <p className="text-[10px] text-slate-400">Biểu tượng tròn phát sáng gọn gàng ở góc màn hình.</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Audio & Voice Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEnabled(!voiceEnabled);
                      glaciaAudio.playCrystalChime(880);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      voiceEnabled
                        ? 'bg-slate-950 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <span className="font-bold">Đọc Giọng Nói AI (TTS)</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900">
                      {voiceEnabled ? 'BẬT' : 'TẮT'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newState = glaciaAudio.toggleMute();
                      if (newState) glaciaAudio.playCrystalChime(1046.5);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      glaciaAudio.isSoundEnabled
                        ? 'bg-slate-950 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-bold">Hiệu Ứng Âm Thanh (SFX)</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900">
                      {glaciaAudio.isSoundEnabled ? 'BẬT' : 'TẮT'}
                    </span>
                  </button>
                </div>

                {/* 4. AI Workforce Admin Portal Gateway */}
                <div className="pt-2">
                  <GlaciaAdminPortalButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
