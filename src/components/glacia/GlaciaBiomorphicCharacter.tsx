import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Sparkles, Zap, Shield, Volume2, Moon } from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { glaciaVoice, type VisemeFrame } from './glaciaVoiceEngine';

interface GlaciaBiomorphicCharacterProps {
  interactive?: boolean;
  scale?: number;
  className?: string;
  showAura?: boolean;
  compactMode?: boolean;
  onPet?: () => void;
}

export default function GlaciaBiomorphicCharacter({
  interactive = true,
  scale = 1,
  className = '',
  showAura = true,
  compactMode = false,
  onPet,
}: GlaciaBiomorphicCharacterProps) {
  const {
    mood,
    setMood,
    currentEmotion,
    rotX,
    rotY,
    setSpeechBubble,
    isSpeaking,
    isListening,
    addTrustScore,
    wakeGlaciaUp,
  } = useGlacia();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse gaze tracking (Eyes looking directly at cursor)
  const [gazeX, setGazeX] = useState(0);
  const [gazeY, setGazeY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [activeZone, setActiveZone] = useState<'head' | 'horns' | 'amulet' | 'wings' | 'paws' | null>(null);

  // Lip-Sync Viseme & Audio Waveform state
  const [currentViseme, setCurrentViseme] = useState<VisemeFrame>({
    viseme: 'sil',
    intensity: 0,
    headBob: 0,
    audioFrequencyData: [20, 40, 60, 80, 70, 50, 30, 20],
  });

  // Subscribe to real-time voice speech visemes & frequency spectrum
  useEffect(() => {
    const unsubscribe = glaciaVoice.subscribeVisemes((frame) => {
      setCurrentViseme(frame);
    });
    return unsubscribe;
  }, []);

  // Autonomous organic blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (mood !== 'sleeping') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 140);
      }
    }, 3800 + Math.random() * 1800);
    return () => clearInterval(blinkInterval);
  }, [mood]);

  // Global mouse tracking so Glacia looks at cursor anywhere on screen
  useEffect(() => {
    if (!interactive) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      setGazeX(Math.max(-1, Math.min(1, deltaX)));
      setGazeY(Math.max(-1, Math.min(1, deltaY)));

      // Wake up if sleeping and mouse moves near
      if (mood === 'sleeping' && Math.abs(deltaX) < 0.35 && Math.abs(deltaY) < 0.35) {
        wakeGlaciaUp();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [interactive, mood, wakeGlaciaUp]);

  // Touch & Hotspot interactions on character anatomy (Virtual Being / Digital Human)
  const handleTouchHotspot = (zone: 'head' | 'horns' | 'amulet' | 'wings' | 'paws', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveZone(zone);
    setIsPetting(true);

    if (mood === 'sleeping') {
      wakeGlaciaUp();
      return;
    }

    if (zone === 'head') {
      glaciaAudio.playPettingPurr();
      glaciaAudio.playCrystalChime(1046.5);
      setMood('happy');
      const text = 'Purrrr... Glacia thích được bạn xoa đầu lắm! Thân mật & Gắn kết tăng thêm! ✨';
      setSpeechBubble(text);
      glaciaVoice.speak(text, 'happy');
      if (addTrustScore) addTrustScore(5, 'Xoa đầu & Chăm sóc Glacia');
    } else if (zone === 'horns') {
      glaciaAudio.playCrystalChime(1318.5);
      setMood('curious');
      const text = 'Sừng tinh thể băng tuyết đang thu nhận sóng tín hiệu tri thức & dữ liệu mới! ❄️';
      setSpeechBubble(text);
      glaciaVoice.speak(text, 'curious');
      if (addTrustScore) addTrustScore(3, 'Kích hoạt Cảm biến Sừng Tinh Thể');
    } else if (zone === 'amulet') {
      glaciaAudio.playQuantumDispatch();
      setMood('thinking');
      const text = 'Mặt dây chuyền ngọc bích Sapphire đã kích hoạt xung nhịp điều phối 5 AI Staff! 💎';
      setSpeechBubble(text);
      glaciaVoice.speak(text, 'thinking');
      if (addTrustScore) addTrustScore(5, 'Kích hoạt Lõi Trái Tim Lượng Tử');
    } else if (zone === 'wings') {
      glaciaAudio.playHologramScan();
      setMood('dispatching');
      const text = '4 cánh pha lê cực quang đang mở rộng trường bảo vệ lượng tử cho toàn bộ hệ thống! ⚡';
      setSpeechBubble(text);
      glaciaVoice.speak(text, 'dispatching');
      if (addTrustScore) addTrustScore(4, 'Mở Cực Quang Cánh Pha Lê');
    } else if (zone === 'paws') {
      glaciaAudio.playCrystalChime(880);
      setMood('celebrating');
      const text = 'Glacia vẫy tay chào Giám đốc! Sẵn sàng đồng hành kiến tạo thành công!';
      setSpeechBubble(text);
      glaciaVoice.speak(text, 'celebrating');
      if (addTrustScore) addTrustScore(5, 'Bắt tay Đồng hành');
    }

    if (onPet) onPet();
    setTimeout(() => {
      setIsPetting(false);
      setActiveZone(null);
    }, 1800);
  };

  // Canvas processing: Clean transparent rendering with exact eye/mouth positions & ice particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = 460;
    canvas.height = 690;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/glacia-avatar.png';

    let animationId: number;
    let particleTicks = 0;

    img.onload = () => {
      const render = () => {
        particleTicks += 0.03;
        const w = 460;
        const h = 690;
        ctx.clearRect(0, 0, w, h);

        // 1. Draw base character (matching exact reference image)
        ctx.drawImage(img, 0, 0, w, h);

        // 2. Dynamic Ice / Aurora Sparkles around Wings
        for (let i = 0; i < 6; i++) {
          const px = w * 0.5 + Math.cos(particleTicks + i * 1.05) * (w * 0.42);
          const py = h * 0.45 + Math.sin(particleTicks * 1.2 + i * 0.9) * (h * 0.28);
          const size = Math.abs(Math.sin(particleTicks + i)) * 3.5 + 1.5;

          ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.75)';
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Dynamic Eye Blinking & Pupil Tracking
        if (isBlinking || mood === 'sleeping') {
          ctx.fillStyle = 'rgba(235, 248, 255, 0.95)';
          // Left Eye Lid
          ctx.beginPath();
          ctx.ellipse(w * 0.373, h * 0.407, 26, 8, -0.08, 0, Math.PI * 2);
          ctx.fill();
          // Right Eye Lid
          ctx.beginPath();
          ctx.ellipse(w * 0.568, h * 0.408, 26, 8, 0.08, 0, Math.PI * 2);
          ctx.fill();

          // Sleep Eyelashes
          ctx.strokeStyle = 'rgba(70, 110, 160, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(w * 0.373, h * 0.407, 24, 0.2, Math.PI - 0.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(w * 0.568, h * 0.408, 24, 0.2, Math.PI - 0.2);
          ctx.stroke();
        } else if (Math.abs(gazeX) > 0.05 || Math.abs(gazeY) > 0.05) {
          // Dynamic Pupil Specular Highlight Offset based on Gaze
          const lx = w * 0.373 + gazeX * 4;
          const ly = h * 0.407 + gazeY * 3;
          const rx = w * 0.568 + gazeX * 4;
          const ry = h * 0.408 + gazeY * 3;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(lx - 2, ly - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(rx - 2, ry - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Interactive Lip-Sync Viseme Mouth Articulation
        if (currentViseme.intensity > 0.04 || isSpeaking) {
          const mouthX = w * 0.460;
          const mouthY = h * 0.450;
          const intensity = Math.max(0.3, currentViseme.intensity);
          const openH = Math.max(2, intensity * 7);
          const openW = currentViseme.viseme === 'oh' || currentViseme.viseme === 'ou' ? 5 : 8.5;

          // Mouth cavity
          ctx.fillStyle = 'rgba(30, 41, 59, 0.94)';
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, openW, openH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Soft pink tongue
          ctx.fillStyle = 'rgba(244, 114, 182, 0.88)';
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY + openH * 0.35, openW * 0.65, openH * 0.45, 0, 0, Math.PI);
          ctx.fill();

          // Highlight lip glow
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY, openW + 1, openH + 1, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (isSpeaking) {
          animationId = requestAnimationFrame(render);
        }
      };

      render();
    };

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isBlinking, currentViseme, gazeX, gazeY, mood, isSpeaking]);

  const headTiltY = rotY * 0.6 + gazeX * 16;
  const headTiltX = rotX * 0.6 - gazeY * 12 + currentViseme.headBob;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative select-none flex flex-col items-center justify-center ${className}`}
      style={{
        perspective: '1200px',
      }}
    >
      {/* ── LIVING 3D GLACIA CHARACTER ── */}
      <div
        className="relative flex items-center justify-center transition-transform duration-100 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
        }}
      >
        {/* ── 1. FLOOR REFLECTION & HOLOGRAPHIC SHADOW ── */}
        <div
          className="absolute -bottom-4 w-60 h-16 rounded-full pointer-events-none transition-all duration-500"
          style={{
            transform: 'rotateX(75deg) translateZ(-35px)',
            background: `radial-gradient(ellipse, ${currentEmotion.auraColor}77 0%, rgba(15,23,42,0.7) 50%, transparent 80%)`,
            boxShadow: `0 0 45px ${currentEmotion.auraColor}66`,
          }}
        />

        {/* ── 2. BACK VOLUMETRIC AURA & WINGS GLOW ── */}
        {showAura && (
          <div
            className="absolute top-10 w-80 h-96 rounded-full blur-2xl opacity-60 pointer-events-none animate-pulse transition-all duration-700"
            style={{
              transform: 'translateZ(-50px)',
              background: `radial-gradient(circle, ${currentEmotion.auraColor}88 0%, rgba(99,102,241,0.3) 50%, transparent 80%)`,
            }}
          />
        )}

        {/* Speaking sound-wave ring overlay */}
        {isSpeaking && (
          <div
            className="absolute -inset-4 rounded-full border-2 border-cyan-300/80 animate-ping pointer-events-none"
            style={{ animationDuration: '1.2s' }}
          />
        )}

        {/* Sleep Zzz Floating Animation */}
        {mood === 'sleeping' && (
          <div
            className="absolute -top-6 right-8 flex items-center gap-1 text-cyan-300 font-mono font-bold text-sm pointer-events-none animate-bounce"
            style={{ transform: 'translateZ(30px)' }}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Zzz...</span>
          </div>
        )}

        {/* ── 3. MAIN CHARACTER BODY ── */}
        <div
          className={`relative ${
            compactMode ? 'w-48 h-72' : 'w-72 h-[430px] sm:w-80 sm:h-[480px]'
          } flex items-center justify-center transition-transform duration-300`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${headTiltY * 0.35}deg) rotateX(${headTiltX * 0.35}deg)`,
          }}
        >
          {/* Canvas Character Rendering */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain object-center pointer-events-none filter drop-shadow-[0_18px_40px_rgba(0,0,0,0.7)] drop-shadow-[0_0_30px_rgba(56,189,248,0.45)]"
          />

          {/* ── 4. SAPPHIRE AMULET PULSE & REALTIME AUDIO EQUALIZER BARS ── */}
          <div
            onClick={(e) => handleTouchHotspot('amulet', e)}
            className="absolute top-[56%] left-[45.5%] -translate-x-1/2 w-12 h-12 rounded-full cursor-pointer group/amulet flex items-center justify-center"
            style={{ transform: 'translateZ(25px)' }}
            title="Mặt Dây Chuyền Ngọc Bích Sapphire (Chạm để phát xung AI Lượng Tử)"
          >
            <div
              className="w-full h-full rounded-full opacity-75 animate-ping pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #38bdf8 0%, rgba(99,102,241,0.6) 60%, transparent 100%)',
              }}
            />

            {/* Audio Waveform Spectrum Bars inside Amulet when speaking */}
            {isSpeaking ? (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
                {currentViseme.audioFrequencyData?.slice(0, 5).map((val, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-cyan-200 rounded-full transition-all duration-75 shadow-sm"
                    style={{ height: `${Math.max(4, (val / 100) * 16)}px` }}
                  />
                ))}
              </div>
            ) : (
              <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-white/90 blur-[1px] group-hover/amulet:scale-150 transition-transform" />
            )}
          </div>

          {/* ── 5. TOUCH HOTSPOTS (Head, Horns, Wings, Paws) ── */}
          <div
            onClick={(e) => handleTouchHotspot('head', e)}
            className="absolute top-[18%] left-1/2 -translate-x-1/2 w-32 h-20 rounded-full cursor-pointer hover:bg-cyan-400/10 transition-colors"
            style={{ transform: 'translateZ(30px)' }}
            title="Xoa đầu Glacia ✨ (+5 XP Gắn Kết)"
          />

          <div
            onClick={(e) => handleTouchHotspot('horns', e)}
            className="absolute top-[3%] left-1/2 -translate-x-1/2 w-48 h-18 rounded-full cursor-pointer hover:bg-cyan-400/15 transition-colors"
            style={{ transform: 'translateZ(20px)' }}
            title="Chạm sừng pha lê tuyết ❄️ (+3 XP)"
          />

          <div
            onClick={(e) => handleTouchHotspot('wings', e)}
            className="absolute top-[30%] inset-x-2 h-36 cursor-pointer hover:bg-indigo-400/10 transition-colors"
            style={{ transform: 'translateZ(-15px)' }}
            title="Đôi cánh pha lê cực quang ⚡ (+4 XP)"
          />

          <div
            onClick={(e) => handleTouchHotspot('paws', e)}
            className="absolute bottom-[4%] inset-x-8 h-20 cursor-pointer hover:bg-cyan-400/10 transition-colors"
            style={{ transform: 'translateZ(10px)' }}
            title="Bắt tay / Chạm chân Glacia 🐾 (+5 XP)"
          />

          {/* Petting / Heart FX Overlay */}
          {isPetting && (
            <div
              className="absolute top-[28%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none animate-bounce"
              style={{ transform: 'translateZ(45px)' }}
            >
              <Heart className="w-9 h-9 fill-pink-400 text-pink-300 filter drop-shadow-[0_0_15px_#f472b6]" />
              <span className="text-[11px] font-black text-cyan-200 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-cyan-400/50 shadow-lg whitespace-nowrap">
                Purrrr! ✨
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
