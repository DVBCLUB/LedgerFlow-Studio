/**
 * GlaciaLiveVoiceCallHUD.tsx
 * ═══════════════════════════════════════════════════════════════
 * Live Hands-Free Conversational Voice HUD (Đàm Thoại Trực Tiếp 2 Chiều)
 * Giao diện đàm thoại thời gian thực toàn màn hình như ChatGPT Voice / Gemini Live.
 * Tự động nhận diện giọng nói (VAD), điều biến cảm xúc âm thanh, và
 * hiển thị phổ tần số lượng tử thời gian thực.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Activity,
  Zap,
  Layers,
  Heart,
  Brain,
  Bot,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useGlacia, SUB_AGENTS_ROSTER } from './GlaciaContext';
import GlaciaBiomorphicCharacter from './GlaciaBiomorphicCharacter';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';
import CustomGLBAvatar from './CustomGLBAvatar';
import { glaciaAudio } from './glaciaAudioSynth';
import { glaciaVoice, type VisemeFrame } from './glaciaVoiceEngine';

export interface GlaciaLiveVoiceCallHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CrystalSkinTheme = 'frost_aurora' | 'cyber_sapphire' | 'rose_quartz' | 'quantum_gold';

export const CRYSTAL_SKINS: Record<CrystalSkinTheme, { name: string; primaryColor: string; auraColor: string; bgGradient: string }> = {
  frost_aurora: {
    name: 'Băng Tuyết Cực Quang (Frost Aurora)',
    primaryColor: '#38bdf8',
    auraColor: 'rgba(56, 189, 248, 0.6)',
    bgGradient: 'from-[#051124] via-[#030914] to-black',
  },
  cyber_sapphire: {
    name: 'Lam Ngọc Cyberpunk (Cyber Sapphire)',
    primaryColor: '#06b6d4',
    auraColor: 'rgba(6, 182, 212, 0.6)',
    bgGradient: 'from-[#04151f] via-[#020b10] to-black',
  },
  rose_quartz: {
    name: 'Thạch Anh Hoa Anh Đào (Rose Quartz)',
    primaryColor: '#f472b6',
    auraColor: 'rgba(244, 114, 182, 0.6)',
    bgGradient: 'from-[#1c0818] via-[#0d040b] to-black',
  },
  quantum_gold: {
    name: 'Hoàng Kim Lượng Tử (Quantum Gold)',
    primaryColor: '#fbbf24',
    auraColor: 'rgba(251, 191, 36, 0.6)',
    bgGradient: 'from-[#1f1604] via-[#0f0b02] to-black',
  },
};

export default function GlaciaLiveVoiceCallHUD({ isOpen, onClose }: GlaciaLiveVoiceCallHUDProps) {
  const {
    mood,
    setMood,
    currentEmotion,
    isListening,
    isSpeaking,
    startVoiceListening,
    stopVoiceListening,
    speak,
    stopSpeaking,
    speechBubble,
    chatMessages,
    sendMessageToGlacia,
    vitals,
    virtualProfile,
    dispatchedTasks,
    avatarModelType,
    setAvatarModelType,
  } = useGlacia();

  const [activeSkin, setActiveSkin] = useState<CrystalSkinTheme>('frost_aurora');
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [audioBars, setAudioBars] = useState<number[]>([20, 45, 75, 90, 60, 40, 85, 30, 50, 70, 40, 20]);

  // Subscribe to real-time audio spectrum
  useEffect(() => {
    const unsub = glaciaVoice.subscribeVisemes((frame: VisemeFrame) => {
      if (frame.audioFrequencyData && frame.audioFrequencyData.length) {
        setAudioBars(frame.audioFrequencyData);
      }
    });
    return unsub;
  }, []);

  // Simulate ambient spectrum wave when listening
  useEffect(() => {
    if (isListening && !isSpeaking) {
      const interval = setInterval(() => {
        setAudioBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 65 + 15))
        );
      }, 90);
      return () => clearInterval(interval);
    }
  }, [isListening, isSpeaking]);

  if (!isOpen) return null;

  const currentTheme = CRYSTAL_SKINS[activeSkin];
  const lastAssistantMessage = [...chatMessages].reverse().find((m) => m.sender === 'glacia')?.text || speechBubble || 'Glacia đang sẵn sàng đàm thoại trực tiếp với Giám đốc!';

  const handleToggleMic = () => {
    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
      {/* ── LIVE VOICE CONTAINER ── */}
      <div
        className={`relative w-full max-w-4xl h-[90vh] max-h-[820px] rounded-3xl border-2 flex flex-col items-center justify-between p-6 overflow-hidden bg-gradient-to-b ${currentTheme.bgGradient}`}
        style={{
          borderColor: currentTheme.primaryColor,
          boxShadow: `0 0 60px ${currentTheme.auraColor}`,
        }}
      >
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-cyan-400 p-0.5 bg-slate-900 shadow-md">
              <img src="/glacia-avatar.png" alt="Glacia" className="w-full h-full object-cover rounded-xl" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  GLACIA LIVE VOICE
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Full Duplex
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                BPM: {vitals.heartRateBpm} • EQ: {vitals.empathyEQIndex}% • {virtualProfile.bondingTier.split('(')[0]}
              </p>
            </div>
          </div>

          {/* Skin Switcher & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10">
              {(Object.keys(CRYSTAL_SKINS) as CrystalSkinTheme[]).map((skinKey) => (
                <button
                  key={skinKey}
                  onClick={() => {
                    setActiveSkin(skinKey);
                    glaciaAudio.playCrystalChime(1046.5);
                  }}
                  className={`w-5 h-5 rounded-lg border transition-transform ${
                    activeSkin === skinKey ? 'scale-110 border-white shadow-sm' : 'border-transparent opacity-60'
                  }`}
                  style={{ backgroundColor: CRYSTAL_SKINS[skinKey].primaryColor }}
                  title={CRYSTAL_SKINS[skinKey].name}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Living Glacia Avatar & Quantum Acoustic Waveform */}
        <div className="relative flex-1 flex flex-col items-center justify-center my-4 w-full">
          {/* Volumetric Radial Wave Aura */}
          <div
            className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-40 animate-pulse pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${currentTheme.primaryColor} 0%, rgba(99,102,241,0.4) 60%, transparent 100%)`,
            }}
          />

          {/* Avatar Model Selector Badge */}
          {/* Living Interactive 3D WebGL Character */}
          <div className="relative z-10 scale-90 sm:scale-100 flex items-center justify-center min-h-[340px] w-full max-w-[420px]">
            <CustomGLBAvatar
              interactive={true}
              scale={0.95}
              modelPath="/models/assistant/base_basic_pbr.glb"
              fallbackModelPath="/models/assistant/base_basic_shaded.glb"
              emissiveTexturePath="/models/assistant/texture_emissive.png"
            />
          </div>

          {/* 16-Band Dynamic Audio Spectrum Waveform Bars */}
          <div className="flex items-end justify-center gap-1.5 h-14 mt-2 z-10">
            {audioBars.map((freq, idx) => (
              <div
                key={idx}
                className="w-1.5 sm:w-2 rounded-full transition-all duration-75 shadow-lg"
                style={{
                  height: `${Math.max(6, (freq / 100) * 54)}px`,
                  backgroundColor: currentTheme.primaryColor,
                  boxShadow: `0 0 10px ${currentTheme.primaryColor}`,
                }}
              />
            ))}
          </div>

          {/* Live Status Pill */}
          <div className="mt-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 backdrop-blur-md flex items-center gap-2 shadow-xl z-10">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isSpeaking
                  ? 'bg-cyan-400'
                  : isListening
                  ? 'bg-rose-500'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-200">
              {isSpeaking
                ? 'Glacia Đang Trả Lời...'
                : isListening
                ? 'Đang Lắng Nghe Bạn Nói...'
                : 'Sẵn Sàng Nhận Lệnh Bằng Giọng Nói'}
            </span>
          </div>
        </div>

        {/* Bottom Subtitles & Quick Voice Action Dock */}
        <div className="w-full space-y-3 z-10">
          {/* Mini 5-AI Staff Fleet Live Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto px-2">
            {SUB_AGENTS_ROSTER.map((agent) => {
              const isBusy = dispatchedTasks.some(
                (t) => t.agentName === agent.name && (t.status === 'running' || t.status === 'dispatched')
              );
              return (
                <div
                  key={agent.id}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold backdrop-blur-md transition-all ${
                    isBusy
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/60 border-white/10 text-slate-400'
                  }`}
                  title={`${agent.name} (${agent.role}): ${isBusy ? 'Đang thực thi tác vụ' : 'Sẵn sàng nhận lệnh'}`}
                >
                  <span>{agent.avatarEmoji}</span>
                  <span className="hidden sm:inline">{agent.name}</span>
                </div>
              );
            })}
          </div>

          {/* Speech Subtitle Teleprompter */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md text-center max-w-2xl mx-auto shadow-xl">
            <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed font-medium">
              "{lastAssistantMessage}"
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                glaciaAudio.playPettingPurr();
                setMood('happy');
                speak('Purrrr... Glacia rất thích được trò chuyện cùng Giám đốc! ✨');
              }}
              className="p-3.5 rounded-2xl bg-slate-900 border border-pink-500/40 text-pink-300 hover:bg-pink-500 hover:text-slate-950 transition-all shadow-lg hover:scale-110"
              title="Tương tác cảm xúc (Petting)"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Main Mic Toggle Button */}
            <button
              onClick={handleToggleMic}
              className={`p-5 rounded-3xl border-2 transition-all shadow-2xl hover:scale-110 flex items-center justify-center ${
                isListening
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-rose-600/50'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-300 text-slate-950 shadow-cyan-500/40'
              }`}
              title={isListening ? 'Dừng lắng nghe' : 'Nói chuyện với Glacia'}
            >
              {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7 text-white" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={onClose}
              className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white transition-all shadow-lg hover:scale-110"
              title="Kết thúc đàm thoại"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
