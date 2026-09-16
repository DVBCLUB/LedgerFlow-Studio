/**
 * glaciaVoiceEngine.ts
 * ═══════════════════════════════════════════════════════════════
 * Động cơ Giọng nói Cảm xúc & Đồng bộ Khẩu hình (TTS & Viseme Lip-Sync)
 * Tự động điều biến Cao độ (Pitch), Tốc độ (Rate) và Âm sắc theo 
 * Cảm xúc sinh học của Glacia (Happy, Curious, Thinking, Celebrating, Alert, Sleeping).
 * Hỗ trợ tùy chỉnh Baseline Pitch & Rate trực tiếp từ Settings.
 * ═══════════════════════════════════════════════════════════════
 */

export interface VisemeFrame {
  viseme: 'sil' | 'aa' | 'ee' | 'ih' | 'oh' | 'ou' | 'mm';
  intensity: number; // 0 to 1
  headBob: number; // head nodding
  audioFrequencyData?: number[]; // simulated spectrum frequencies for visualizers
  mouthOpenness?: number;
}

export type VoiceMoodType =
  | 'idle'
  | 'happy'
  | 'curious'
  | 'thinking'
  | 'listening'
  | 'dispatching'
  | 'celebrating'
  | 'alert'
  | 'sleeping';

type VisemeCallback = (frame: VisemeFrame) => void;

class GlaciaVoiceEngine {
  private isSpeaking: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private visemeListeners: Set<VisemeCallback> = new Set();
  private visemeTimer: number | null = null;
  private isMuted: boolean = false;
  private userBasePitch: number = 1.0;
  private userBaseRate: number = 1.0;

  constructor() {
    try {
      const saved = localStorage.getItem('lf_glacia_tts_enabled');
      this.isMuted = saved === '0';
      const savedPitch = localStorage.getItem('lf_glacia_voice_pitch');
      if (savedPitch) this.userBasePitch = parseFloat(savedPitch) || 1.0;
      const savedRate = localStorage.getItem('lf_glacia_voice_rate');
      if (savedRate) this.userBaseRate = parseFloat(savedRate) || 1.0;
    } catch {
      this.isMuted = false;
    }
  }

  public subscribeVisemes(cb: VisemeCallback): () => void {
    this.visemeListeners.add(cb);
    return () => this.visemeListeners.delete(cb);
  }

  private notifyViseme(frame: VisemeFrame) {
    this.visemeListeners.forEach((cb) => {
      try {
        cb(frame);
      } catch (err) {
        console.error('Viseme callback error:', err);
      }
    });
  }

  public get isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public toggleVoiceMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('lf_glacia_tts_enabled', this.isMuted ? '0' : '1');
    } catch {}
    if (this.isMuted) {
      this.stopSpeaking();
    }
    return !this.isMuted;
  }

  public setBasePitch(val: number) {
    this.userBasePitch = Math.max(0.6, Math.min(1.8, val));
    try {
      localStorage.setItem('lf_glacia_voice_pitch', this.userBasePitch.toString());
    } catch {}
  }

  public setBaseRate(val: number) {
    this.userBaseRate = Math.max(0.6, Math.min(1.8, val));
    try {
      localStorage.setItem('lf_glacia_voice_rate', this.userBaseRate.toString());
    } catch {}
  }

  public get basePitch(): number {
    return this.userBasePitch;
  }

  public get baseRate(): number {
    return this.userBaseRate;
  }

  /**
   * Phát âm câu thoại của Glacia kèm điều biến cảm xúc và mô phỏng khẩu hình thời gian thực
   */
  public speak(text: string, mood: VoiceMoodType = 'happy', onEnd?: () => void) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\(https?:\/\/[^\)]+\)/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .slice(0, 300);

    if (!cleanText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Ưu tiên cao nhất: Giọng nữ Tiếng Việt ngọt ngào, truyền cảm và tự nhiên
    const voices = window.speechSynthesis.getVoices();
    const viFemaleVoice = voices.find(
      (v) =>
        (v.lang.startsWith('vi') || v.lang.includes('VI') || v.name.toLowerCase().includes('vietnam')) &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('nu') ||
          v.name.toLowerCase().includes('nữ') ||
          v.name.toLowerCase().includes('hoaimy') ||
          v.name.toLowerCase().includes('mai') ||
          v.name.toLowerCase().includes('linh') ||
          v.name.toLowerCase().includes('an') ||
          v.name.toLowerCase().includes('huong') ||
          v.name.toLowerCase().includes('phuong') ||
          v.name.toLowerCase().includes('trang') ||
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('google'))
    );
    const anyViVoice = voices.find(
      (v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam')
    );
    const enFemaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes('jenny') ||
        v.name.toLowerCase().includes('aria') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('female') ||
        (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('english'))
    );

    const chosenVoice = viFemaleVoice || anyViVoice || enFemaleVoice || voices[0];
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang || 'vi-VN';
    }

    // Emotion Modulation Matrix (Âm sắc ngọt ngào, dịu dàng, tự nhiên của Nữ trợ lý AI)
    let pitchMod = 1.22;
    let rateMod = 0.98;

    switch (mood) {
      case 'happy':
        pitchMod = 1.25;
        rateMod = 1.02;
        break;
      case 'curious':
        pitchMod = 1.30;
        rateMod = 1.04;
        break;
      case 'thinking':
        pitchMod = 1.15;
        rateMod = 0.94;
        break;
      case 'celebrating':
        pitchMod = 1.35;
        rateMod = 1.06;
        break;
      case 'alert':
        pitchMod = 1.18;
        rateMod = 1.08;
        break;
      case 'sleeping':
        pitchMod = 0.95;
        rateMod = 0.85;
        break;
      case 'dispatching':
        pitchMod = 1.26;
        rateMod = 1.02;
        break;
      default:
        pitchMod = 1.22;
        rateMod = 0.98;
    }

    utterance.pitch = Math.max(0.6, Math.min(1.8, pitchMod * this.userBasePitch));
    utterance.rate = Math.max(0.6, Math.min(1.6, rateMod * this.userBaseRate));

    this.isSpeaking = true;

    // Start viseme frame emission loop
    this.startVisemeSimulation();

    utterance.onend = () => {
      this.isSpeaking = false;
      this.stopVisemeSimulation();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      this.stopVisemeSimulation();
      if (onEnd) onEnd();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis.speak failed:', err);
      this.isSpeaking = false;
      this.stopVisemeSimulation();
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    this.isSpeaking = false;
    this.stopVisemeSimulation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  private startVisemeSimulation() {
    this.stopVisemeSimulation();

    const visemes: VisemeFrame['viseme'][] = ['aa', 'ee', 'oh', 'ih', 'ou', 'mm'];
    let idx = 0;

    this.visemeTimer = window.setInterval(() => {
      if (!this.isSpeaking) {
        this.stopVisemeSimulation();
        return;
      }

      idx = (idx + 1) % visemes.length;
      const curViseme = visemes[idx];
      const intensity = 0.6 + Math.random() * 0.4;
      const headBob = Math.sin(Date.now() / 150) * 0.5;

      const audioFrequencyData = Array.from({ length: 12 }, () => Math.floor(Math.random() * 85 + 15));

      this.notifyViseme({
        viseme: curViseme,
        intensity,
        headBob,
        audioFrequencyData,
        mouthOpenness: intensity,
      });
    }, 90);
  }

  private stopVisemeSimulation() {
    if (this.visemeTimer !== null) {
      clearInterval(this.visemeTimer);
      this.visemeTimer = null;
    }
    this.notifyViseme({
      viseme: 'sil',
      intensity: 0,
      headBob: 0,
      audioFrequencyData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      mouthOpenness: 0,
    });
  }
}

export const glaciaVoice = new GlaciaVoiceEngine();
