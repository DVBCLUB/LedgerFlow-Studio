import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  MessageSquare,
  Maximize2,
  Mic,
  TrendingUp,
  DollarSign,
  Code2,
  PhoneCall,
  RotateCw,
  Heart,
} from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import GlaciaLiveVoiceCallHUD from './GlaciaLiveVoiceCallHUD';
import CustomGLBAvatar from './CustomGLBAvatar';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';
import { glaciaAudio } from './glaciaAudioSynth';
import { getBondingTierProgress } from './GlaciaVirtualBeingState';
import { glaciaModuleBridge } from './glaciaModuleBridge';

export default function GlaciaCompanion() {
  const {
    toggleCockpit,
    currentEmotion,
    isCompanionVisible,
    speechBubble,
    sendMessageToGlacia,
    virtualProfile,
    vitals,
    isLiveVoiceCallOpen,
    closeLiveVoiceCall,
    openLiveVoiceCall,
    companionDisplayMode,
    setCompanionDisplayMode,
    avatarModelType,
    setAvatarModelType,
    startVoiceListening,
    isListening,
    setMood,
    setSpeechBubble,
    addTrustScore,
    dispatchGoalToSubAgents,
    dispatchedTasks,
    startEmbodiedTour,
  } = useGlacia();

  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [radialWheelOpen, setRadialWheelOpen] = useState(false);
  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('lf_glacia_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 160, y: window.innerHeight - 200 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number }>({
    mouseX: 0, mouseY: 0, posX: 0, posY: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 120),
        y: Math.min(prev.y, window.innerHeight - 160),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, form')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      posX: position.x, posY: position.y,
    };
  };

  const currentPosRef = useRef(position);
  currentPosRef.current = position;

  const [workspaceSuggestions, setWorkspaceSuggestions] = useState(() =>
    glaciaModuleBridge.getWorkspaceQuickActions()
  );
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Subscribe to workspace navigation changes to update contextual copilot suggestions
  useEffect(() => {
    const unsub = glaciaModuleBridge.registerNavigationListener((tab) => {
      setWorkspaceSuggestions(glaciaModuleBridge.getWorkspaceQuickActions(tab));
      setShowSuggestions(true);
    });
    return unsub;
  }, []);

  // Global hotkeys: Alt+G (Cockpit), Alt+V (Voice Call), Alt+B (Executive Briefing), Escape (Close popups)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        toggleCockpit();
        glaciaAudio.playHologramScan();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        openLiveVoiceCall();
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsBriefingOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setRadialWheelOpen(false);
        setQuickInputOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCockpit, openLiveVoiceCall]);

  useEffect(() => {
    let rafId = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        const newX = Math.max(10, Math.min(window.innerWidth - 220, dragStartRef.current.posX + dx));
        const newY = Math.max(10, Math.min(window.innerHeight - 340, dragStartRef.current.posY + dy));
        setPosition({ x: newX, y: newY });
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        cancelAnimationFrame(rafId);
        try {
          localStorage.setItem('lf_glacia_pos', JSON.stringify(currentPosRef.current));
        } catch {}
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    sendMessageToGlacia(quickPrompt);
    setQuickPrompt('');
    setQuickInputOpen(false);
  };

  const handleRadialAction = (actionKey: string) => {
    setRadialWheelOpen(false);
    glaciaAudio.playQuantumDispatch();

    switch (actionKey) {
      case 'dispatch':
        toggleCockpit();
        break;
      case 'voice':
        openLiveVoiceCall();
        break;
      case 'tour':
        startEmbodiedTour('quick_onboarding');
        break;
      case 'pet':
        glaciaAudio.playPettingPurr();
        setMood('happy');
        setSpeechBubble('Purrrr... Cảm ơn Giám đốc đã tiếp năng lượng cho Glacia! ✨');
        addTrustScore(5, 'Xoa đầu qua Radial Wheel');
        break;
      case 'cfo':
        dispatchGoalToSubAgents('Kiểm toán tài chính & tối ưu chi phí token tháng này', ['ai-cfo']);
        break;
      case 'growth':
        dispatchGoalToSubAgents('Lập chiến dịch nội dung viral & video TikTok tuần này', ['ai-growth']);
        break;
      case 'dev':
        dispatchGoalToSubAgents('Rà soát code & kiểm tra an ninh hệ thống', ['ai-dev', 'ai-qa']);
        break;
      case 'chat':
        setQuickInputOpen(true);
        break;
      case 'spin':
        glaciaAudio.playQuantumSpinFanfare();
        setMood('celebrating');
        setSpeechBubble('Vùùù! Glacia vừa thực hiện vũ điệu lượng tử 360 độ! ✨');
        addTrustScore(5, 'Kích hoạt Vũ điệu Lượng tử');
        setTimeout(() => setMood('happy'), 3000);
        break;
    }
  };

  if (!isCompanionVisible) return null;

  const bondProgress = getBondingTierProgress(virtualProfile.trustScore);

  const radialActions = [
    { key: 'dispatch', label: 'Giao Việc', icon: Zap, color: '#38bdf8', angle: 0 },
    { key: 'growth', label: 'Marketing', icon: TrendingUp, color: '#ec4899', angle: 45 },
    { key: 'cfo', label: 'Tài Chính', icon: DollarSign, color: '#10b981', angle: 90 },
    { key: 'dev', label: 'Mã Nguồn', icon: Code2, color: '#6366f1', angle: 135 },
    { key: 'voice', label: 'Đàm Thoại Live', icon: PhoneCall, color: '#f43f5e', angle: 180 },
    { key: 'spin', label: 'Vũ Điệu 360°', icon: RotateCw, color: '#a855f7', angle: 225 },
    { key: 'chat', label: 'Chat Nhanh', icon: MessageSquare, color: '#06b6d4', angle: 270 },
    { key: 'pet', label: 'Xoa Đầu', icon: Heart, color: '#f472b6', angle: 315 },
  ];

  return (
    <>
      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className="fixed z-40 select-none flex flex-col items-center group cursor-grab active:cursor-grabbing"
      >
        {/* ── SPEECH BUBBLE ── */}
        {speechBubble && (
          <div
            onClick={toggleCockpit}
            className="mb-2 max-w-[280px] p-3 rounded-2xl bg-slate-950/95 border border-cyan-400/60 backdrop-blur-2xl shadow-2xl text-[11px] text-cyan-100 font-medium leading-relaxed animate-fade-in cursor-pointer hover:border-cyan-300 hover:scale-[1.02] transition-all relative z-50 overflow-hidden"
            style={{ boxShadow: '0 8px 30px rgba(6, 182, 212, 0.3)' }}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1 text-[9px] text-cyan-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1 font-black">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> Glacia AI
              </span>
              <span className="text-[8px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {virtualProfile.archetype}
              </span>
            </div>
            <p className="font-sans text-slate-200 text-[11px] leading-snug break-words line-clamp-3 [overflow-wrap:anywhere]">
              {speechBubble}
            </p>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-cyan-400/60 rotate-45" />
          </div>
        )}

        {/* ── GLACIA AVATAR / LIVING 3D SPRITE ── */}
        <div
          onMouseDown={handleMouseDown}
          className="relative flex flex-col items-center justify-center"
        >
          {/* Volumetric Glow Aura */}
          <div
            className="absolute -inset-2 rounded-full blur-md opacity-75 animate-pulse pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${currentEmotion.auraColor} 0%, rgba(99,102,241,0.3) 70%, transparent 100%)`,
            }}
          />

          {companionDisplayMode === 'living_sprite' ? (
            /* Living 3D WebGL Avatar */
            <div
              className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              onClick={() => { if (!isDragging) toggleCockpit(); }}
            >
              <CustomGLBAvatar
                interactive={true}
                compactMode={true}
                scale={0.8}
                modelPath="/models/assistant/base_basic_pbr.glb"
                fallbackModelPath="/models/assistant/base_basic_shaded.glb"
                emissiveTexturePath="/models/assistant/texture_emissive.png"
              />
            </div>
          ) : (
            /* Classic Neon Avatar Orb */
            <div
              onClick={() => { if (!isDragging) toggleCockpit(); }}
              className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden border-2 cursor-pointer"
              style={{
                borderColor: currentEmotion.auraColor,
                animation: 'glacia-float 3.5s ease-in-out infinite',
                boxShadow: `0 0 20px ${currentEmotion.auraColor}99, inset 0 0 10px rgba(255, 255, 255, 0.3)`,
              }}
            >
              <img
                src="/glacia-avatar.png"
                alt="Glacia"
                className="w-full h-full object-cover rounded-full pointer-events-none filter drop-shadow-md"
              />
            </div>
          )}

          {/* Active AI Staff Tasks Indicator Badge */}
          {dispatchedTasks.some((t) => t.status === 'running' || t.status === 'dispatched') && (
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-[8px] font-bold text-cyan-300 flex items-center gap-1 shadow-lg backdrop-blur-md animate-pulse z-20 cursor-pointer pointer-events-none whitespace-nowrap"
              title="Đội ngũ AI Staff đang thực thi nhiệm vụ"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>AI Đang Xử Lý</span>
            </div>
          )}

          {/* Quick Floating Action Tools (Hover pill) */}
          <div className="absolute -top-3 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 bg-slate-950/90 border border-cyan-500/40 rounded-full p-0.5 backdrop-blur-md shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCompanionDisplayMode(companionDisplayMode === 'living_sprite' ? 'mini_orb' : 'living_sprite');
                glaciaAudio.playCrystalChime(1318.5);
              }}
              className="p-1 rounded-full text-[9px] text-cyan-300 hover:bg-cyan-500/20"
              title={companionDisplayMode === 'living_sprite' ? 'Chuyển sang dạng Orb' : 'Chuyển sang dạng 3D Trợ Lý'}
            >
              {companionDisplayMode === 'living_sprite' ? '🔮' : '🤖'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLiveVoiceCall();
              }}
              className="p-1 rounded-full text-[9px] text-rose-300 hover:bg-rose-500/20"
              title="Đàm thoại Voice Call"
            >
              🎙️
            </button>
          </div>
        </div>

        {/* ── CONTEXTUAL COPILOT ACTION CHIPS ── */}
        {showSuggestions && workspaceSuggestions.length > 0 && (
          <div className="mt-1.5 flex flex-col items-center gap-1 animate-fade-in pointer-events-auto">
            <div className="flex items-center gap-1 flex-wrap justify-center max-w-[280px]">
              {workspaceSuggestions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    glaciaAudio.playCrystalChime(1046.5);
                    sendMessageToGlacia(action.prompt);
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold backdrop-blur-md shadow-lg transition-all hover:scale-105 flex items-center gap-1 max-w-[120px] truncate"
                  title={`Gửi lệnh: "${action.prompt}"`}
                >
                  <span>{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowSuggestions(false)}
                className="w-3.5 h-3.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white flex items-center justify-center text-[9px] transition-colors"
              >×</button>
            </div>
          </div>
        )}
      </div>

      {/* ── LIVE VOICE CALL HUD FULLSCREEN MODAL ── */}
      <GlaciaLiveVoiceCallHUD
        isOpen={isLiveVoiceCallOpen}
        onClose={closeLiveVoiceCall}
      />
    </>
  );
}
