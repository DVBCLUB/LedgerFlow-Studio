import React, { useEffect, useRef } from 'react';
import { useGlacia, GLACIA_EMOTIONS, type GlaciaMood } from './GlaciaContext';

interface GlaciaVirtualHumanProps {
  interactive?: boolean;
  scale?: number;
  className?: string;
  showAura?: boolean;
}

interface Expression {
  browY: number; // eyebrow vertical offset (negative = raised)
  browAngle: number; // inner brow angle
  eyeOpen: number; // 0..1
  mouthOpen: number; // 0..1 base mouth opening
  smile: number; // 0..1 corner lift
  blush: number; // 0..1
  pupilsUp: number; // -1..1 (look up/down)
}

function expressionFor(mood: GlaciaMood): Expression {
  switch (mood) {
    case 'happy':
      return { browY: -2, browAngle: -0.12, eyeOpen: 0.82, mouthOpen: 0.05, smile: 0.85, blush: 0.7, pupilsUp: 0 };
    case 'curious':
      return { browY: -6, browAngle: -0.22, eyeOpen: 1, mouthOpen: 0.18, smile: 0.25, blush: 0.2, pupilsUp: -0.35 };
    case 'thinking':
      return { browY: 2, browAngle: 0.16, eyeOpen: 0.7, mouthOpen: 0.05, smile: 0.1, blush: 0.1, pupilsUp: -0.55 };
    case 'listening':
      return { browY: 0, browAngle: 0, eyeOpen: 0.9, mouthOpen: 0.12, smile: 0.3, blush: 0.15, pupilsUp: 0 };
    case 'dispatching':
      return { browY: 3, browAngle: 0.18, eyeOpen: 0.95, mouthOpen: 0.14, smile: 0.15, blush: 0.1, pupilsUp: 0 };
    case 'celebrating':
      return { browY: -5, browAngle: -0.2, eyeOpen: 1, mouthOpen: 0.5, smile: 1, blush: 0.95, pupilsUp: -0.2 };
    case 'alert':
      return { browY: 4, browAngle: 0.22, eyeOpen: 0.6, mouthOpen: 0.04, smile: 0, blush: 0, pupilsUp: 0 };
    case 'sleeping':
      return { browY: 0, browAngle: 0, eyeOpen: 0, mouthOpen: 0.08, smile: 0.1, blush: 0.1, pupilsUp: 0 };
    case 'idle':
    default:
      return { browY: 0, browAngle: 0, eyeOpen: 0.85, mouthOpen: 0.04, smile: 0.35, blush: 0.25, pupilsUp: 0 };
  }
}

export default function GlaciaVirtualHuman({
  interactive = true,
  scale = 1,
  className = '',
  showAura = true,
}: GlaciaVirtualHumanProps) {
  const { mood, currentEmotion, isSpeaking, isListening, isCompanionVisible } = useGlacia();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mirror latest values into refs so the rAF loop never restarts.
  const moodRef = useRef(mood);
  const emotionRef = useRef(currentEmotion);
  const speakingRef = useRef(isSpeaking);
  const listeningRef = useRef(isListening);
  const gazeRef = useRef({ x: 0, y: 0 });

  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { emotionRef.current = currentEmotion; }, [currentEmotion]);
  useEffect(() => { speakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { listeningRef.current = isListening; }, [isListening]);

  // Global cursor gaze — the avatar looks at the mouse anywhere on screen.
  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      gazeRef.current.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2 + 40)));
      gazeRef.current.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2 + 40)));
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [interactive]);

  // Main render loop (single rAF, reads refs).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 360;
    const H = 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let t = 0;
    let blinkTimer = 0;
    let blinkProgress = 0; // 0..1, 1 = closed
    let lastBoundary = 0;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = () => {
      t += 0.016;
      const emo = emotionRef.current;
      const aura = emo.auraColor;
      const ex = expressionFor(moodRef.current);
      const speaking = speakingRef.current;
      const listening = listeningRef.current;
      const gaze = gazeRef.current;

      // Autonomous blink
      blinkTimer -= 0.016;
      if (blinkTimer <= 0) {
        blinkTimer = 2.6 + Math.random() * 3.4;
        blinkProgress = 1;
      }
      if (blinkProgress > 0) blinkProgress = Math.max(0, blinkProgress - 0.12);
      if (moodRef.current === 'sleeping') blinkProgress = 1;

      const breathe = Math.sin(t * 1.7) * 3;
      const headBob = Math.sin(t * 1.2) * 2.5;
      const cx = W / 2;
      const headCx = cx + gaze.x * 6;
      const headCy = 150 + headBob + breathe * 0.3;
      const headTilt = gaze.y * -2 + Math.sin(t * 0.9) * 1.2;

      ctx.clearRect(0, 0, W, H);

      // ── Ambient aura ──
      if (showAura) {
        const g = ctx.createRadialGradient(cx, 180, 20, cx, 180, 210);
        g.addColorStop(0, aura + '3d');
        g.addColorStop(0.55, 'rgba(99, 102, 241, 0.14)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.save();
      ctx.translate(headCx, headCy);
      ctx.rotate((headTilt * Math.PI) / 180);
      ctx.scale(1, 1 + Math.sin(t * 1.7) * 0.006); // breathing

      // ── Neck ──
      ctx.fillStyle = '#cfe6f5';
      roundRect(-14, 120, 28, 46, 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      roundRect(-10, 122, 20, 44, 8);
      ctx.fill();

      // ── Shoulders / torso ──
      ctx.fillStyle = '#152238';
      roundRect(-72, 148, 144, 150, 34);
      ctx.fill();
      const chestGrad = ctx.createLinearGradient(0, 148, 0, 300);
      chestGrad.addColorStop(0, 'rgba(56,189,248,0.25)');
      chestGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = chestGrad;
      roundRect(-72, 148, 144, 150, 34);
      ctx.fill();

      // Chest amulet (ties to Glacia identity)
      const amuletY = 228 + Math.sin(t * 2) * 1.5;
      const amuletGrad = ctx.createRadialGradient(0, amuletY, 2, 0, amuletY, 16);
      amuletGrad.addColorStop(0, '#a5f3fc');
      amuletGrad.addColorStop(0.4, aura);
      amuletGrad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = amuletGrad;
      ctx.beginPath();
      ctx.arc(0, amuletY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, amuletY, 15, 0, Math.PI * 2);
      ctx.stroke();

      // ── Head ──
      const headGrad = ctx.createLinearGradient(-58, -110, 58, 130);
      headGrad.addColorStop(0, '#f4fbff');
      headGrad.addColorStop(0.7, '#d9eefa');
      headGrad.addColorStop(1, '#c9e2f5');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -10, 62, 76, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rim light
      ctx.strokeStyle = aura + '88';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -10, 62, 76, 0, 0, Math.PI * 2);
      ctx.stroke();

      // ── Hair (crystal sweep) ──
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.moveTo(-60, -22);
      ctx.quadraticCurveTo(-58, -82, -8, -88);
      ctx.quadraticCurveTo(30, -86, 46, -70);
      ctx.quadraticCurveTo(62, -46, 58, -18);
      ctx.quadraticCurveTo(30, -58, -34, -58);
      ctx.quadraticCurveTo(-52, -52, -60, -22);
      ctx.closePath();
      ctx.fill();

      // Hair highlight
      ctx.fillStyle = 'rgba(56,189,248,0.35)';
      ctx.beginPath();
      ctx.moveTo(-48, -34);
      ctx.quadraticCurveTo(-30, -72, 6, -76);
      ctx.quadraticCurveTo(-16, -58, -38, -42);
      ctx.closePath();
      ctx.fill();

      // ── Crystal horns ──
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(-46, -72);
      ctx.lineTo(-58, -112);
      ctx.lineTo(-30, -80);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(46, -72);
      ctx.lineTo(58, -112);
      ctx.lineTo(30, -80);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Eyes ──
      const eyeY = -16 + ex.pupilsUp * 3;
      const eyeDX = 24;
      const eyeOpenAmt = ex.eyeOpen * (1 - blinkProgress);

      for (const side of [-1, 1]) {
        const exx = side * eyeDX;

        // sclera / eye socket
        ctx.fillStyle = '#f8fcff';
        ctx.beginPath();
        ctx.ellipse(exx, eyeY, 15, 13 * eyeOpenAmt + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // iris
        const irisX = exx + gaze.x * 5;
        const irisY = eyeY + ex.pupilsUp * 4 + gaze.y * 4;
        const irisGrad = ctx.createRadialGradient(irisX, irisY, 1, irisX, irisY, 8);
        irisGrad.addColorStop(0, '#0ea5e9');
        irisGrad.addColorStop(0.6, aura);
        irisGrad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(irisX, irisY, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // pupil
        ctx.fillStyle = '#0b1220';
        ctx.beginPath();
        ctx.arc(irisX + gaze.x * 2, irisY + gaze.y * 2, 3.4, 0, Math.PI * 2);
        ctx.fill();

        // specular
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(irisX - 2, irisY - 2.5, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // upper lid
        if (eyeOpenAmt < 0.95) {
          ctx.strokeStyle = '#aac8dc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(exx, eyeY, 15, 13 * eyeOpenAmt + 1.5, 0, 0, Math.PI);
          ctx.stroke();
        }
      }

      // ── Eyebrows ──
      ctx.strokeStyle = '#274a66';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const bx = side * eyeDX;
        const by = eyeY - 20 + ex.browY;
        const innerLift = ex.browAngle * side * 10;
        ctx.beginPath();
        ctx.moveTo(bx - 13 * side, by - innerLift * 0.4);
        ctx.quadraticCurveTo(bx, by - innerLift, bx + 13 * side, by - innerLift * 0.2);
        ctx.stroke();
      }

      // ── Nose ──
      ctx.strokeStyle = '#b7d3e5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, 6);
      ctx.lineTo(3, 24);
      ctx.lineTo(-1, 26);
      ctx.stroke();

      // ── Mouth ──
      const mouthY = 48;
      const speakAmp = speaking ? 0.5 + Math.abs(Math.sin(t * 9)) * 0.5 + Math.sin(t * 23) * 0.18 : 0;
      const open = Math.min(1, ex.mouthOpen + speakAmp);
      const smileLift = ex.smile * 7;

      if (open < 0.1) {
        ctx.strokeStyle = '#9d6b7b';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-20, mouthY + smileLift * 0.2);
        ctx.quadraticCurveTo(0, mouthY + smileLift, 20, mouthY + smileLift * 0.2);
        ctx.stroke();
      } else {
        const h = 4 + open * 14;
        ctx.fillStyle = '#7c3f4f';
        ctx.beginPath();
        ctx.ellipse(0, mouthY + 3, 16 + open * 3, h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8a7b8';
        ctx.beginPath();
        ctx.ellipse(0, mouthY + 3 + h * 0.35, 10 + open * 2, h * 0.4, 0, 0, Math.PI);
        ctx.fill();
      }

      // ── Blush ──
      if (ex.blush > 0.05) {
        ctx.fillStyle = `rgba(255,154,192,${ex.blush * 0.4})`;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * 40, 16, 11, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // ── Listening waveform ──
      if (listening) {
        ctx.strokeStyle = aura;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const bx = cx - 40 + i * 20;
          const bh = 8 + Math.abs(Math.sin(t * 6 + i * 1.2)) * 14;
          ctx.beginPath();
          ctx.moveTo(bx, 320 - bh / 2);
          ctx.lineTo(bx, 320 + bh / 2);
          ctx.stroke();
        }
      }

      // ── Floating crystal shards ──
      for (let i = 0; i < 7; i++) {
        const a = t * (0.5 + i * 0.13) + i * 2.1;
        const sx = cx + Math.cos(a) * (70 + (i % 3) * 22);
        const sy = 150 + Math.sin(a * 1.3) * (90 + (i % 4) * 20);
        ctx.fillStyle = `rgba(125,211,252,${0.35 + 0.25 * Math.sin(a)})`;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, 5);
        ctx.lineTo(-3, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  const meta = GLACIA_EMOTIONS[mood] || GLACIA_EMOTIONS.idle;

  return (
    <div
      ref={wrapRef}
      className={`relative select-none flex flex-col items-center justify-center ${className}`}
      style={{ transform: `scale(${scale})` }}
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      {!isCompanionVisible && (
        <div className="mt-1 text-[10px] font-mono text-cyan-300/70 flex items-center gap-1">
          <span>{meta.emoji}</span>
          <span className="uppercase tracking-wider">{meta.name}</span>
        </div>
      )}
    </div>
  );
}
