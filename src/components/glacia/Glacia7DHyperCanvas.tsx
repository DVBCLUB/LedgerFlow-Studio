import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Heart,
  Share2,
  Zap,
  Radio,
  Compass,
} from 'lucide-react';
import {
  useGlacia,
  GLACIA_EMOTIONS,
  type GlaciaMood,
  type Glacia3DViewMode,
} from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import GlaciaBiomorphicCharacter from './GlaciaBiomorphicCharacter';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';
import CustomGLBAvatar from './CustomGLBAvatar';

interface Glacia7DHyperCanvasProps {
  interactive?: boolean;
  className?: string;
  showHUDs?: boolean;
  scale?: number;
}

interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  id: number;
}

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation: number;
  id: number;
}

export default function Glacia7DHyperCanvas({
  interactive = true,
  className = '',
  showHUDs = true,
  scale = 1,
}: Glacia7DHyperCanvasProps) {
  const {
    mood,
    setMood,
    currentEmotion,
    view3DMode,
    setView3DMode,
    isAutoRotate,
    setIsAutoRotate,
    zoomLevel,
    setZoomLevel,
    rotX,
    rotY,
    setRotX,
    setRotY,
    reset3DView,
    telemetry,
    isListening,
    subAgents,
    setSpeechBubble,
    avatarModelType,
    setAvatarModelType,
  } = useGlacia();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isSoundOn, setIsSoundOn] = useState(() => glaciaAudio.isSoundEnabled);
  const [isCinematicFullscreen, setIsCinematicFullscreen] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const [activeNeuralNode, setActiveNeuralNode] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 0,
    startRotY: 0,
  });

  // ── Animation-loop mirrors ──
  // The rAF loop below is created ONCE and reads the latest values from these
  // refs each frame. Keeping these out of state stops the effect from being
  // torn down and re-created 60×/second, which previously caused a blank or
  // flickering hologram stage.
  const ripplesRef = useRef<TouchRipple[]>([]);
  const sparkleStarsRef = useRef<StarParticle[]>([]);
  const moodRef = useRef(mood);
  const emotionRef = useRef(currentEmotion);
  const rotRef = useRef({ x: rotX, y: rotY });
  const subAgentsRef = useRef(subAgents);
  const activeNodeRef = useRef(activeNeuralNode);

  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { emotionRef.current = currentEmotion; }, [currentEmotion]);
  useEffect(() => { rotRef.current = { x: rotX, y: rotY }; }, [rotX, rotY]);
  useEffect(() => { subAgentsRef.current = subAgents; }, [subAgents]);
  useEffect(() => { activeNodeRef.current = activeNeuralNode; }, [activeNeuralNode]);

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotate) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.8) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [isAutoRotate, setRotY]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    setIsAutoRotate(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    setRotY(dragStartRef.current.startRotY + dx * 0.65);
    setRotX(Math.max(-45, Math.min(45, dragStartRef.current.startRotX - dy * 0.55)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 7D Touch / Petting Interaction
  const handlePetGlacia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 5D Audio feedback
    glaciaAudio.playPettingPurr();
    glaciaAudio.playCrystalChime(1046.5); // C6 crystal tone

    // 7D Haptic ripples & Star bursts
    const newRippleId = Date.now() + Math.random();
    ripplesRef.current = [...ripplesRef.current.slice(-4), { x: clickX, y: clickY, radius: 10, alpha: 1, id: newRippleId }];

    const stars: StarParticle[] = Array.from({ length: 8 }, (_, i) => ({
      x: clickX,
      y: clickY,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      size: Math.random() * 6 + 4,
      alpha: 1,
      color: Math.random() > 0.5 ? '#38bdf8' : '#f472b6',
      rotation: Math.random() * Math.PI * 2,
      id: Date.now() + i,
    }));
    sparkleStarsRef.current = [...sparkleStarsRef.current.slice(-16), ...stars];

    setIsPetting(true);
    setMood('happy');
    const petLines = [
      'Glacia thích được bạn xoa đầu lắm! Năng lượng phục hồi 100% ✨',
      'Purrrr... Cảm ơn Giám đốc! Tôi đã sẵn sàng thực thi mọi nhiệm vụ!',
      'Hào quang tinh thể phản hồi tích cực! Sẵn sàng điều phối AI Staff! 🌟',
    ];
    setSpeechBubble(petLines[Math.floor(Math.random() * petLines.length)]);

    setTimeout(() => setIsPetting(false), 2000);
  };

  const toggleSound = () => {
    const nextState = glaciaAudio.toggleMute();
    setIsSoundOn(nextState);
    if (nextState) glaciaAudio.playCrystalChime();
  };

  // Canvas 7D Hyper-Dimensional Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 440);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const PARTICLE_COUNT = 90;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 0.95,
      y: (Math.random() - 0.5) * height * 0.95,
      z: Math.random() * 400 - 200,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.7 + 0.3,
      angle: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? '#38bdf8' : Math.random() > 0.6 ? '#c084fc' : '#67e8f9',
    }));

    let tick = 0;

    const render = () => {
      // Read latest values from refs each frame so this loop never restarts.
      const currentEmotion = emotionRef.current;
      const rotY = rotRef.current.y;
      const rotX = rotRef.current.x;
      const mood = moodRef.current;
      const subAgents = subAgentsRef.current;
      const activeNeuralNode = activeNodeRef.current;

      tick += 0.022;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 30;

      // ── 1. DIMENSION 1: DEEP COSMIC AURORA VORTEX ──
      const auroraGrad = ctx.createRadialGradient(cx, cy - 40, 20, cx, cy, 260);
      auroraGrad.addColorStop(0, currentEmotion.auraColor + '25');
      auroraGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
      auroraGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.08)');
      auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);

      // ── 2. DIMENSION 2 & 3: 3D HOLOGRAPHIC EMITTER PLATFORM ──
      ctx.save();
      ctx.translate(cx, cy + 155);
      ctx.scale(1, 0.32);

      // Platform Core Glow
      const platformCore = ctx.createRadialGradient(0, 0, 20, 0, 0, 200);
      platformCore.addColorStop(0, currentEmotion.auraColor + '70');
      platformCore.addColorStop(0.6, 'rgba(56, 189, 248, 0.25)');
      platformCore.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = platformCore;
      ctx.beginPath();
      ctx.arc(0, 0, 200, 0, Math.PI * 2);
      ctx.fill();

      // Outer Runic Glyphs Ring (Rotating Clockwise)
      ctx.save();
      ctx.rotate(tick * 0.45 + (rotY * Math.PI) / 180);
      ctx.strokeStyle = currentEmotion.auraColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([16, 12, 24, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 160, 0, Math.PI * 2);
      ctx.stroke();

      // 8 Energy Nodes on outer ring
      for (let i = 0; i < 8; i++) {
        const nodeAng = (i * Math.PI) / 4;
        const nx = Math.cos(nodeAng) * 160;
        const ny = Math.sin(nodeAng) * 160;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Inner Counter-Rotating Hexagon Ring
      ctx.save();
      ctx.rotate(-tick * 0.8 - (rotY * Math.PI) / 180);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // ── 3. DIMENSION 4: 3D SCANNER LASER SWEEP ──
      const scanY = cy - 160 + Math.sin(tick * 2.4) * 145;
      const scanGrad = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
      scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      scanGrad.addColorStop(0.5, currentEmotion.auraColor + '50');
      scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(cx - 160, scanY - 14, 320, 28);

      ctx.strokeStyle = currentEmotion.auraColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 150, scanY);
      ctx.lineTo(cx + 150, scanY);
      ctx.stroke();

      // ── 4. DIMENSION 5 & 6: NEURAL SWARM SYNAPSE SATELLITES (5 AI STAFF) ──
      subAgents.forEach((agent, i) => {
        const orbitSpeed = 0.5 + i * 0.1;
        const orbitAngle = tick * orbitSpeed + (i * (Math.PI * 2)) / subAgents.length + (rotY * Math.PI) / 180;
        const orbitRadiusX = 170 + Math.sin(tick + i) * 15;
        const orbitRadiusY = 65 + Math.cos(tick + i) * 10;

        const satX = cx + Math.cos(orbitAngle) * orbitRadiusX;
        const satY = cy - 20 + Math.sin(orbitAngle) * orbitRadiusY + (rotX * 0.8);
        const satZ = Math.sin(orbitAngle);

        // Draw laser data stream from Glacia core to AI Satellite
        if (mood === 'dispatching' || activeNeuralNode === agent.id) {
          ctx.strokeStyle = satZ > 0 ? currentEmotion.auraColor + 'bb' : currentEmotion.auraColor + '44';
          ctx.lineWidth = satZ > 0 ? 1.8 : 0.8;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(satX, satY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Satellite Node Orb
        const orbScale = Math.max(0.6, (satZ + 1.8) / 2.5);
        ctx.fillStyle = agent.id === 'ai-dev' ? '#38bdf8' : agent.id === 'ai-growth' ? '#ec4899' : agent.id === 'ai-sales' ? '#f59e0b' : agent.id === 'ai-cfo' ? '#10b981' : '#a855f7';
        ctx.globalAlpha = Math.min(1, Math.max(0.35, (satZ + 1.2) / 2));
        ctx.beginPath();
        ctx.arc(satX, satY, 4.5 * orbScale, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing outer halo for node
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(satX, satY, (7 + Math.sin(tick * 4 + i) * 2) * orbScale, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

      // ── 5. 3D CRYSTAL DUST & STAR PARTICLES ──
      particles.forEach((p) => {
        p.angle += 0.014 * p.speed;
        p.y -= 0.4 * p.speed;
        if (p.y < -height * 0.48) p.y = height * 0.45;

        const currentAngle = p.angle + (rotY * Math.PI) / 180;
        const rad = 140 + Math.sin(p.angle * 2) * 40;
        const p3X = Math.cos(currentAngle) * rad;
        const p3Z = Math.sin(currentAngle) * rad + p.z;
        const p3Y = p.y + (rotX * p3Z) / 180;

        const fov = 400;
        const scaleFactor = fov / (fov + p3Z);
        const projX = cx + p3X * scaleFactor;
        const projY = cy + p3Y * scaleFactor;
        const projSize = Math.max(0.8, p.size * scaleFactor);

        if (projX > 0 && projX < width && projY > 0 && projY < height) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.18, (p3Z + 200) / 400));
          ctx.beginPath();
          ctx.arc(projX, projY, projSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      // ── 6. DIMENSION 7: TOUCH RIPPLES & BURST PARTICLES (mutable refs) ──
      ripplesRef.current = ripplesRef.current
        .map((r) => ({
          ...r,
          radius: r.radius + 3.5,
          alpha: r.alpha - 0.035,
        }))
        .filter((r) => r.alpha > 0);

      ripplesRef.current.forEach((r) => {
        ctx.save();
        ctx.strokeStyle = currentEmotion.auraColor;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      sparkleStarsRef.current = sparkleStarsRef.current
        .map((s) => ({
          ...s,
          x: s.x + s.vx,
          y: s.y + s.vy,
          vy: s.vy + 0.1,
          alpha: s.alpha - 0.03,
          rotation: s.rotation + 0.08,
        }))
        .filter((s) => s.alpha > 0);

      sparkleStarsRef.current.forEach((s) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        // Draw 4-point star
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.3, -s.size * 0.3);
        ctx.lineTo(s.size, 0);
        ctx.lineTo(s.size * 0.3, s.size * 0.3);
        ctx.lineTo(0, s.size);
        ctx.lineTo(-s.size * 0.3, s.size * 0.3);
        ctx.lineTo(-s.size, 0);
        ctx.lineTo(-s.size * 0.3, -s.size * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const emotionList: GlaciaMood[] = [
    'happy',
    'curious',
    'thinking',
    'listening',
    'dispatching',
    'celebrating',
    'alert',
    'sleeping',
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`relative select-none overflow-visible flex flex-col items-center justify-center ${
        isCinematicFullscreen ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl p-6' : className
      }`}
      style={{
        perspective: '1500px',
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
    >
      {/* Background 7D Canvas Matrix */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* ── 7D QUANTUM THEATER TOP BAR (Fullscreen only) ── */}
      {isCinematicFullscreen && (
        <div className="absolute top-6 inset-x-8 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wider">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>GLACIA 7D HYPER-DIMENSIONAL QUANTUM THEATER</span>
          </div>
          <button
            onClick={() => setIsCinematicFullscreen(false)}
            className="p-2 rounded-xl bg-slate-900/80 border border-white/20 text-white hover:bg-slate-800"
          >
            <Minimize className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 3D/7D HOLOGRAPHIC STAGE CONTAINER ── */}
      <div
        className="relative z-10 flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale * zoomLevel * (isCinematicFullscreen ? 1.25 : 1)})`,
        }}
      >
        {/* Hologram Backlight Ambient Volumetric Glow */}
        <div
          className="absolute -top-20 -bottom-14 w-96 rounded-full blur-3xl opacity-75 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${currentEmotion.auraColor}77 0%, rgba(99,102,241,0.25) 50%, rgba(168,85,247,0.15) 75%, transparent 100%)`,
          }}
        />

        {/* ── LEFT HUD: Hệ thống Trợ lý AI Antigravity (Tilted 3D Wing) ── */}
        {showHUDs && (
          <div
            className="hidden lg:block absolute -left-60 top-6 w-56 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 pointer-events-none"
            style={{
              transform: 'translateZ(60px) rotateY(24deg)',
              background: 'rgba(8, 14, 30, 0.85)',
              borderColor: `${currentEmotion.auraColor}66`,
              boxShadow: `0 0 35px ${currentEmotion.auraColor}33, inset 0 0 20px ${currentEmotion.auraColor}22`,
            }}
          >
            <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-1.5 border-b border-cyan-500/30">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-wider text-cyan-300 uppercase">
                  Hệ Thống Trợ Lý AI
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                7D CORE
              </span>
            </div>

            <div className="space-y-2.5 text-[10px]">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-0.5">
                  <span>Xử lý Ngôn ngữ (NLP)</span>
                  <span className="text-cyan-400 font-mono font-bold">{telemetry.nlpCoreLevel}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.nlpCoreLevel}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-0.5">
                  <span>Khai thác Tri thức (RAG)</span>
                  <span className="text-cyan-400 font-mono font-bold">{telemetry.knowledgeDepth}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.knowledgeDepth}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-0.5">
                  <span>Tạo Sinh Nội dung</span>
                  <span className="text-cyan-400 font-mono font-bold">{telemetry.contentSynthRate}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${telemetry.contentSynthRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Corner Tech Accents */}
            <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
          </div>
        )}

        {/* ── CENTER: Living embodied avatar (Custom 3D GLB or Biomorphic Cat) ── */}
        <div
          className="relative flex items-center justify-center transition-all duration-300 w-80 h-96"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(30px)',
          }}
        >
          {avatarModelType === 'custom_glb' ? (
            <div className="w-full h-full flex items-center justify-center">
              <CustomGLBAvatar
                interactive={interactive}
                enableOrbitControls={true}
                showControlsHUD={true}
                scale={scale * 1.1}
                modelPath="/models/assistant/base_basic_pbr.glb"
                fallbackModelPath="/models/assistant/base_basic_shaded.glb"
                emissiveTexturePath="/models/assistant/texture_emissive.png"
              />
            </div>
          ) : (
            <GlaciaBiomorphicCharacter
              interactive={interactive}
              scale={0.95}
            />
          )}

          {/* Floating Top Emotional & Model Switcher Badge */}
          <div className="absolute -top-6 inset-x-0 flex items-center justify-between pointer-events-auto px-2 z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border backdrop-blur-md shadow-lg transition-colors duration-300 cursor-pointer hover:scale-105"
              style={{ borderColor: `${currentEmotion.auraColor}88` }}
              onClick={() => {
                setAvatarModelType(avatarModelType === 'custom_glb' ? 'procedural_glacia' : 'custom_glb');
                glaciaAudio.playCrystalChime(1046.5);
              }}
              title="Nhấp để chuyển đổi giữa Thực Thể 3D GLB và Biomorphic Cat"
            >
              <span className="text-sm">{avatarModelType === 'custom_glb' ? '🤖' : currentEmotion.emoji}</span>
              <span className="text-[10px] font-black tracking-wider text-white uppercase">
                {avatarModelType === 'custom_glb' ? '3D GLB AVATAR' : currentEmotion.name}
              </span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                ĐỔI MODEL
              </span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/85 border border-white/10 text-[9px] font-mono font-bold text-cyan-300">
              <Compass className="w-2.5 h-2.5 text-cyan-400" />
              <span>{Math.round(rotY)}° 3D Orbit</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT HUD: Nhận dạng giọng nói & Chiếu hình ảnh 3D (Tilted 3D Wing) ── */}
        {showHUDs && (
          <div
            className="hidden lg:block absolute -right-60 top-6 w-56 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 pointer-events-none"
            style={{
              transform: 'translateZ(60px) rotateY(-24deg)',
              background: 'rgba(8, 14, 30, 0.85)',
              borderColor: `${currentEmotion.auraColor}66`,
              boxShadow: `0 0 35px ${currentEmotion.auraColor}33, inset 0 0 20px ${currentEmotion.auraColor}22`,
            }}
          >
            <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-1.5 border-b border-indigo-500/30">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-wider text-indigo-300 uppercase">
                  Module Tương Tác
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                LIVE
              </span>
            </div>

            <div className="space-y-2.5 text-[10px]">
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
                  <span>Nhận dạng giọng nói (5D)</span>
                  <span className="text-emerald-400 font-bold">READY</span>
                </div>
                <div className="flex items-center gap-0.5 h-3.5">
                  {[40, 75, 30, 95, 60, 80, 45, 100, 50, 75, 90, 35, 65].map((h, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full"
                      style={{
                        height: `${h}%`,
                        opacity: isListening ? 1 : 0.45,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <div className="flex items-center justify-between text-indigo-200 font-semibold mb-1">
                  <span>Chiếu hình ảnh 3D & 7D</span>
                  <span className="text-cyan-400 font-mono font-bold">60 FPS</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>Trường nhìn 3D:</span>
                  <span className="text-indigo-300 font-mono">1500px Depth</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>Góc xoay hiện tại:</span>
                  <span className="text-indigo-300 font-mono">{Math.round(rotY)}° Y / {Math.round(rotX)}° X</span>
                </div>
              </div>
            </div>

            {/* Corner Tech Accents */}
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-400" />
            <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-400" />
          </div>
        )}
      </div>

      {/* ── 7D INTERACTIVE TOOLBAR & EMOTION CAROUSEL ── */}
      {interactive && (
        <div className="w-full mt-4 z-20 flex flex-col items-center gap-2">
          {/* Emotion Switcher Carousel */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur-md shadow-xl overflow-x-auto max-w-full">
            <span className="text-[9px] font-bold text-slate-400 px-2 uppercase tracking-wider">
              Biểu Cảm 7D:
            </span>
            {emotionList.map((emo) => {
              const meta = GLACIA_EMOTIONS[emo];
              const isActive = mood === emo;
              return (
                <button
                  key={emo}
                  onClick={() => {
                    setMood(emo);
                    setSpeechBubble(meta.dialogueLine);
                    glaciaAudio.playCrystalChime(emo === 'happy' ? 1046 : emo === 'dispatching' ? 1318 : 880);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/40 scale-105'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                  }`}
                  title={meta.description}
                >
                  <span>{meta.emoji}</span>
                  <span className="hidden sm:inline">{meta.name.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* 7D Dimension Controls (Sound, Auto-Rotate, Zoom, Fullscreen) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 border border-white/10 backdrop-blur-md shadow-md text-slate-400">
            {/* 5D Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors ${
                isSoundOn ? 'text-cyan-300 hover:bg-cyan-500/20' : 'text-slate-600 hover:text-slate-400'
              }`}
              title={isSoundOn ? 'Tắt âm thanh 5D' : 'Bật âm thanh 5D (Web Audio)'}
            >
              {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <div className="h-3.5 w-px bg-white/10" />

            {/* 3D Auto-Rotate */}
            <button
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                isAutoRotate
                  ? 'bg-emerald-500 text-slate-950'
                  : 'hover:text-white hover:bg-white/5'
              }`}
              title="Bật/Tắt chế độ tự động xoay 360° Showroom"
            >
              {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isAutoRotate ? 'Dừng Xoay' : 'Tự Xoay 360°'}</span>
            </button>

            <div className="h-3.5 w-px bg-white/10" />

            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/5"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.1))}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/5"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={reset3DView}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] hover:text-white hover:bg-white/5"
              title="Khôi phục góc nhìn mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Góc Gốc</span>
            </button>

            <div className="h-3.5 w-px bg-white/10" />

            {/* 7D Fullscreen Theater Mode */}
            <button
              onClick={() => setIsCinematicFullscreen(!isCinematicFullscreen)}
              className="p-1.5 rounded-lg hover:text-cyan-300 hover:bg-white/5"
              title="Chế độ Rạp Chiếu Không Gian 7D Toàn Màn Hình"
            >
              {isCinematicFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
