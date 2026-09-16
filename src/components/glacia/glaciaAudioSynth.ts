/**
 * glaciaAudioSynth.ts
 * ═══════════════════════════════════════════════════════════════
 * Hệ thống âm thanh tổng hợp đa tầng 7D cho Glacia bằng Web Audio API thuần.
 * Không cần bất kỳ file mp3 bên ngoài nào, tự tạo sóng âm pha lê (crystal chime),
 * tiếng gầm gừ êm ái (cyber purr), quét laser hologram, sóng năng lượng quantum,
 * nhạc chuông thức giấc / thăng cấp, và âm thanh vệ tinh Swarm 3D.
 * ═══════════════════════════════════════════════════════════════
 */

class GlaciaAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('lf_glacia_sound_enabled');
      this.isMuted = saved === '0';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('lf_glacia_sound_enabled', this.isMuted ? '0' : '1');
    } catch {}
    return !this.isMuted;
  }

  public get isSoundEnabled(): boolean {
    return !this.isMuted;
  }

  /** Âm thanh chuông pha lê lấp lánh (Crystal Chime) khi Glacia chào hoặc đổi cảm xúc */
  public playCrystalChime(baseFreq = 880) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.55);
    });
  }

  /** Âm thanh rung cảm purr mèo pha lê khi người dùng chạm / vuốt ve (Touch Feedback) */
  public playPettingPurr() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);

    // Modulation for purring flutter
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, now);
    lfoGain.gain.setValueAtTime(30, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.95);
    lfo.stop(now + 0.95);
  }

  /** Âm thanh quét Hologram 3D (Hologram Laser Sweep) */
  public playHologramScan() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** Âm thanh phân bổ nhiệm vụ lượng tử (Quantum Dispatch Pulse) */
  public playQuantumDispatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /** Âm thanh thăng cấp gắn kết (Level Up & Fanfare Chime) */
  public playLevelUpFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  }

  /** Âm thanh quét an ninh & kiểm toán hệ thống (System Security Scan) */
  public playSecurityScanTone() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
    osc.frequency.linearRampToValueAtTime(800, now + 0.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Âm thanh kích hoạt vệ tinh AI Swarm (Constellation Satellite Chime) */
  public playConstellationChime(index = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFrequencies = [587.33, 659.25, 783.99, 880.0, 987.77]; // D5, E5, G5, A5, B5
    const freq = baseFrequencies[index % baseFrequencies.length];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  /** Âm thanh xoay 360 độ lượng tử (Quantum Pirouette Spin) */
  public playQuantumSpinFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5 to G6 arpeggio
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.001, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.06, now + i * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.32);
    });
  }

  /** Âm thanh bộc phát cực quang Aurora (Aurora Burst Sound) */
  public playAuroraBurstSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.68);
  }
}

export const glaciaAudio = new GlaciaAudioSynthesizer();
