import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Activity,
  Rotate3d,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Smile,
  Zap,
  Volume2,
  PhoneCall,
  Compass,
} from 'lucide-react';
import {
  useGlacia,
  GLACIA_EMOTIONS,
  type GlaciaMood,
  type Glacia3DViewMode,
} from './GlaciaContext';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';

interface Glacia3DHologramCanvasProps {
  interactive?: boolean;
  className?: string;
  showHUDs?: boolean;
  scale?: number;
}

export default function Glacia3DHologramCanvas({
  interactive = true,
  className = '',
  showHUDs = true,
  scale = 1,
}: Glacia3DHologramCanvasProps) {
  const {
    mood,
    setMood,
    currentEmotion,
    telemetry,
    openLiveVoiceCall,
    startEmbodiedTour,
  } = useGlacia();

  return (
    <div className={`relative flex flex-col items-center justify-center select-none overflow-hidden ${className}`}>
      {/* Volumetric Radial Aura in Background */}
      <div
        className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-50 animate-pulse pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${currentEmotion.auraColor}77 0%, rgba(99,102,241,0.25) 50%, transparent 100%)`,
        }}
      />

      {/* ── REAL 3D THREE.JS WEBGL AVATAR ── */}
      <div className="relative z-10">
        <GlaciaReal3DAvatar interactive={interactive} scale={scale} />
      </div>

      {/* HUD Telemetry Chips */}
      {showHUDs && (
        <div className="w-full flex items-center justify-between px-3 mt-1 text-[10px] text-cyan-300 font-mono z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30">
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>WebGL 3D Engine • 60 FPS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={openLiveVoiceCall}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold shadow-md hover:scale-105 transition-all"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Live Call</span>
            </button>
            <button
              onClick={() => startEmbodiedTour('quick_onboarding')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 font-bold hover:bg-cyan-500 hover:text-slate-950 transition-all"
            >
              <Compass className="w-3 h-3" />
              <span>Tour Màn Hình</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
