/**
 * glaciaGeminiLiveApi.ts
 * ============================================================================
 * GLACIA GEMINI LIVE API — REAL-TIME BIDIRECTIONAL AUDIO STREAMING
 * ============================================================================
 * Sử dụng Google Gemini Live API (WebSocket) để Glacia giao tiếp VOICE-REAL-TIME
 * 2 chiều với người dùng thay vì chỉ text.
 *
 * Tính năng:
 * 1. 🔌 Thiết lập kết nối WebSocket đến Google Generative Language API
 *    (wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=API_KEY)
 * 2. 🎙️ Streaming audio từ microphone (PCM 16kHz) lên Gemini
 * 3. 🔊 Streaming audio response từ Gemini về (PCM 24kHz)
 * 4. 💬 Đồng thời text turn trong cùng session (interruptible turn)
 * 5. ⚙️ Cấu hình voice, speed, tone (cho Glacia personality)
 * 6. 📜 Lịch sử audio + transcript lưu vào runtime logs
 * 7. 🔁 Tự động reconnect khi mất kết nối (max 3 lần)
 *
 * Lưu ý: Đây là bridge backend để frontend có thể gửi/nhận audio bytes qua
 * local event bus / WebSocket server riêng thay vì gọi trực tiếp từ trình
 * duyệt (tránh leak API key).
 * ============================================================================
 */

import { WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getEnabledAIKeyEntries } from './aiKeyVault.ts';
import { appendAIUsageLog } from './aiUsageLog.ts';

// ─── Types ──────────────────────────────────────────────────────────────────

export type GeminiLiveVoice = 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr';

export interface GeminiLiveConfig {
  apiKey?: string;
  model?: string;              // gemini-2.0-flash-exp or gemini-2.5-pro
  voice?: GeminiLiveVoice;     // Tên voice của Gemini
  speakingRate?: number;       // 0.8 - 1.5
  inputSampleRate?: number;    // 16000 default
  outputSampleRate?: number;   // 24000 default
  systemInstruction?: string;
  temperature?: number;
  maxReconnects?: number;
}

export type GeminiLiveEvent =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'audio_input_ready'       // sẵn sàng nhận audio từ mic
  | 'audio_chunk'             // nhận audio response PCM từ Gemini
  | 'text_chunk'              // nhận text response từ Gemini
  | 'turn_start'              // bắt đầu 1 turn (người dùng nói / AI bắt đầu nói)
  | 'turn_end'                // kết thúc 1 turn
  | 'interrupted'             // AI bị gián đoạn bởi người dùng
  | 'transcript_user'         // transcript từ giọng nói người dùng (final/interim)
  | 'transcript_ai_final';    // transcript cuối cùng của AI response

export interface GeminiLiveEventPayload {
  event: GeminiLiveEvent;
  sessionId: string;
  timestamp: string;
  audioBytes?: Uint8Array;
  text?: string;
  isFinal?: boolean;
  turnId?: string;
  error?: string;
}

export interface GeminiLiveSessionState {
  sessionId: string;
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';
  startedAt?: string;
  endedAt?: string;
  reconnectAttempts: number;
  bytesSent: number;
  bytesReceived: number;
  turnsCount: number;
  lastError?: string;
}

type LiveEventListener = (payload: GeminiLiveEventPayload) => void;

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_VOICE: GeminiLiveVoice = 'Aoede';
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';
const DEFAULT_INPUT_SR = 16000;
const DEFAULT_OUTPUT_SR = 24000;

const LIVE_LOG_DIR = path.join(process.cwd(), 'runtime', 'gemini_live_sessions');
function ensureLogDir() {
  if (!fs.existsSync(LIVE_LOG_DIR)) fs.mkdirSync(LIVE_LOG_DIR, { recursive: true });
}

// ─── Core Session Class ─────────────────────────────────────────────────────

export class GlaciaGeminiLiveSession {
  private ws: WebSocket | null = null;
  private listeners = new Map<GeminiLiveEvent, LiveEventListener[]>();
  private config: Required<GeminiLiveConfig>;
  private state: GeminiLiveSessionState;
  private sendQueue: Uint8Array[] = [];
  private sessionLog: string[] = [];

  constructor(inputConfig: GeminiLiveConfig = {}) {
    this.config = {
      apiKey: inputConfig.apiKey ?? '',
      model: inputConfig.model ?? DEFAULT_MODEL,
      voice: inputConfig.voice ?? DEFAULT_VOICE,
      speakingRate: inputConfig.speakingRate ?? 1.0,
      inputSampleRate: inputConfig.inputSampleRate ?? DEFAULT_INPUT_SR,
      outputSampleRate: inputConfig.outputSampleRate ?? DEFAULT_OUTPUT_SR,
      systemInstruction: inputConfig.systemInstruction ?? `Bạn là Glacia, trợ lý AI giọng nói của LedgerFlow Studio. Phong cách: ấm áp, sắc bén, chuyên nghiệp, yêu công nghệ và luôn hỗ trợ tối đa Founder David Bao.`,
      temperature: inputConfig.temperature ?? 0.7,
      maxReconnects: inputConfig.maxReconnects ?? 3,
    };
    this.state = {
      sessionId: `gemlive_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`,
      status: 'idle',
      reconnectAttempts: 0,
      bytesSent: 0,
      bytesReceived: 0,
      turnsCount: 0,
    };
  }

  getSessionState(): GeminiLiveSessionState {
    return { ...this.state };
  }

  // ─── Event emitter helpers ─────────────────────────────────────────────

  on(event: GeminiLiveEvent, listener: LiveEventListener): () => void {
    const arr = this.listeners.get(event) ?? [];
    arr.push(listener);
    this.listeners.set(event, arr);
    return () => {
      const a = this.listeners.get(event) ?? [];
      const idx = a.indexOf(listener);
      if (idx >= 0) a.splice(idx, 1);
    };
  }

  private emit(event: GeminiLiveEvent, payload: Partial<GeminiLiveEventPayload> = {}) {
    const full: GeminiLiveEventPayload = {
      event,
      sessionId: this.state.sessionId,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    const listeners = this.listeners.get(event) ?? [];
    for (const l of listeners) {
      try { l(full); } catch { /* ignore */ }
    }
    this.sessionLog.push(`[${full.timestamp}] ${event}: ${payload.text || payload.audioBytes ? `<${payload.audioBytes?.length || 0} bytes audio>` : payload.error || ''}`);
  }

  // ─── Connection ────────────────────────────────────────────────────────

  private getWsUrl(): string {
    const key = this.config.apiKey;
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(key)}`;
  }

  private async resolveApiKey(): Promise<string> {
    if (this.config.apiKey) return this.config.apiKey;
    // Try to find a Gemini key in the vault
    const entries = await getEnabledAIKeyEntries();
    const gemini = entries.find((e) => e.provider === 'gemini');
    if (gemini && gemini.apiKey) {
      this.config.apiKey = gemini.apiKey;
      return gemini.apiKey;
    }
    throw new Error('Không tìm thấy Gemini API key. Hãy cấu hình trong AI Settings hoặc truyền apiKey trực tiếp.');
  }

  async connect(): Promise<boolean> {
    if (this.state.status === 'connected') return true;
    this.state.status = 'connecting';
    this.emit('connecting');

    try {
      const key = await this.resolveApiKey();
      this.config.apiKey = key;
    } catch (e: any) {
      this.state.status = 'error';
      this.state.lastError = e.message;
      this.emit('error', { error: e.message });
      return false;
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.getWsUrl(), {
          perMessageDeflate: false,
          handshakeTimeout: 10000,
        });
      } catch (e: any) {
        this.state.status = 'error';
        this.state.lastError = e.message;
        this.emit('error', { error: e.message });
        return resolve(false);
      }

      this.ws.once('open', () => {
        // Gửi setup message đầu tiên: cấu hình voice, audio format, system instruction
        this.sendSetupMessage();
        this.state.status = 'connected';
        this.state.startedAt = new Date().toISOString();
        this.state.reconnectAttempts = 0;
        this.emit('connected');
        // Flush queued audio messages
        for (const q of this.sendQueue) this._sendRaw(q);
        this.sendQueue = [];
        this.emit('audio_input_ready');
        resolve(true);
      });

      this.ws.on('message', (raw: Buffer) => {
        this.handleIncoming(raw);
      });

      this.ws.on('error', (err) => {
        this.state.status = 'error';
        this.state.lastError = String(err.message || err);
        this.emit('error', { error: String(err.message || err) });
        resolve(false);
      });

      this.ws.on('close', (code, reason) => {
        this.state.status = 'disconnected';
        this.state.endedAt = new Date().toISOString();
        this.emit('disconnected');
        // Tự động reconnect nếu chưa vượt ngưỡng
        if (this.state.reconnectAttempts < this.config.maxReconnects && code !== 1000) {
          this.state.status = 'reconnecting';
          this.state.reconnectAttempts += 1;
          setTimeout(() => this.connect().catch(() => {}), 1500 * this.state.reconnectAttempts);
        }
        this.writeSessionLog();
      });
    });
  }

  async close(code = 1000, reason = 'Glacia closing session') {
    this.ws?.close(code, reason);
    this.state.status = 'closed';
    this.state.endedAt = new Date().toISOString();
    this.writeSessionLog();
  }

  // ─── Protocol Messages ─────────────────────────────────────────────────

  private sendSetupMessage() {
    const setup = {
      setup: {
        model: `models/${this.config.model}`,
        generationConfig: {
          temperature: this.config.temperature,
        },
        systemInstruction: {
          parts: [{ text: this.config.systemInstruction }],
        },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: this.config.voice,
            },
          },
          speakingRate: this.config.speakingRate,
        },
      },
    };
    this._sendRaw(Buffer.from(JSON.stringify(setup), 'utf-8'));
  }

  /**
   * Gửi audio PCM 16-bit little-endian, sample rate = inputSampleRate.
   * Microphone của trình duyệt / desktop app sẽ lấy ở định dạng này.
   */
  sendAudioInput(pcmBytes: Uint8Array): boolean {
    const msg = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{
            inlineData: {
              mimeType: `audio/pcm; rate=${this.config.inputSampleRate}`,
              data: Buffer.from(pcmBytes).toString('base64'),
            },
          }],
        }],
        turnComplete: false,
      },
    };
    return this._sendRaw(Buffer.from(JSON.stringify(msg), 'utf-8'));
  }

  /**
   * Người dùng kết thúc nói → báo turnComplete để AI bắt đầu trả lời.
   */
  endUserTurn() {
    const msg = {
      clientContent: {
        turns: [],
        turnComplete: true,
      },
    };
    return this._sendRaw(Buffer.from(JSON.stringify(msg), 'utf-8'));
  }

  /**
   * Gửi text prompt trực tiếp trong session voice (kèm audio response).
   */
  sendTextPrompt(text: string): boolean {
    const msg = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }],
        }],
        turnComplete: true,
      },
    };
    return this._sendRaw(Buffer.from(JSON.stringify(msg), 'utf-8'));
  }

  private _sendRaw(bytes: Uint8Array): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.sendQueue.push(bytes);
      if (this.sendQueue.length > 50) this.sendQueue.shift(); // cap queue
      return false;
    }
    try {
      this.ws.send(bytes);
      this.state.bytesSent += bytes.length;
      return true;
    } catch {
      this.sendQueue.push(bytes);
      return false;
    }
  }

  // ─── Incoming Parsing ──────────────────────────────────────────────────

  private handleIncoming(rawBuffer: Buffer) {
    this.state.bytesReceived += rawBuffer.length;
    try {
      const jsonStr = rawBuffer.toString('utf-8');
      // Protocol có thể gửi gộp nhiều JSON line-separated
      const chunks = jsonStr.split(/\r?\n/).filter(Boolean);
      for (const chunk of chunks) {
        this.parseAndEmit(chunk);
      }
    } catch (e: any) {
      console.warn('[GeminiLive] Parse incoming error:', e.message);
    }
  }

  private parseAndEmit(jsonChunk: string) {
    let msg: any;
    try { msg = JSON.parse(jsonChunk); } catch { return; }

    // ServerContent: chứa audio / text response
    if (msg?.serverContent) {
      const turns = msg.serverContent.turns || [];
      for (const turn of turns) {
        this.state.turnsCount += 1;
        const turnId = `turn_${this.state.turnsCount}`;
        this.emit('turn_start', { turnId });
        const parts = turn.parts || [];
        for (const part of parts) {
          if (part.text) {
            this.emit('text_chunk', { text: part.text, turnId });
          }
          if (part.inlineData?.data) {
            try {
              const audioBytes = Buffer.from(part.inlineData.data, 'base64');
              this.emit('audio_chunk', { audioBytes, turnId });
            } catch { /* ignore */ }
          }
        }
        // transcript final
        const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(' ');
        if (textParts) {
          this.emit('transcript_ai_final', { text: textParts, turnId, isFinal: true });
        }
        this.emit('turn_end', { turnId });
      }
    }

    // Tool call / metadata (không dùng ngay, ghi log)
    if (msg?.toolCall) {
      console.log('[GeminiLive] Received toolCall:', msg.toolCall);
    }

    // Prompt feedback / interruption
    if (msg?.interrupted) {
      this.emit('interrupted');
    }

    // User transcript (từ audio input của Gemini ASR)
    if (msg?.userSpeech) {
      const { transcript, final } = msg.userSpeech;
      if (transcript) {
        this.emit('transcript_user', { text: transcript, isFinal: !!final });
      }
    }
  }

  // ─── Session Logging ───────────────────────────────────────────────────

  private writeSessionLog() {
    ensureLogDir();
    const file = path.join(LIVE_LOG_DIR, `${this.state.sessionId}.jsonl`);
    try {
      const finalEntry = JSON.stringify({
        sessionId: this.state.sessionId,
        state: this.state,
        closedAt: new Date().toISOString(),
      }) + '\n';
      fs.appendFileSync(file, this.sessionLog.map((l) => l + '\n').join('') + finalEntry, 'utf-8');
    } catch { /* ignore */ }

    // Usage log
    try {
      appendAIUsageLog({
        provider: 'gemini',
        label: 'Gemini Live',
        model: this.config.model,
        mode: 'stream',
        status: this.state.lastError ? 'error' : 'ok',
        latencyMs: this.state.endedAt && this.state.startedAt
          ? new Date(this.state.endedAt).getTime() - new Date(this.state.startedAt).getTime()
          : 0,
        promptChars: Math.round(this.state.bytesSent / 2),
        outputChars: Math.round(this.state.bytesReceived / 2),
        error: this.state.lastError,
      }).catch(() => {});
    } catch {}
  }
}

// ─── Public singleton: Default Glacia Voice Session (có thể dùng lại) ───────

let defaultSession: GlaciaGeminiLiveSession | null = null;

export function getGlaciaDefaultLiveSession(config?: GeminiLiveConfig): GlaciaGeminiLiveSession {
  if (!defaultSession || defaultSession.getSessionState().status === 'closed' || defaultSession.getSessionState().status === 'error') {
    defaultSession = new GlaciaGeminiLiveSession(config);
  }
  return defaultSession;
}

export async function startGlaciaVoiceSession(config?: GeminiLiveConfig): Promise<{
  sessionId: string;
  connected: boolean;
  error?: string;
}> {
  const session = getGlaciaDefaultLiveSession(config);
  try {
    const connected = await session.connect();
    const st = session.getSessionState();
    return { sessionId: st.sessionId, connected, error: st.lastError };
  } catch (e: any) {
    return { sessionId: session.getSessionState().sessionId, connected: false, error: e.message };
  }
}

/**
 * Info helper: trả về danh sách voice Gemini Live được hỗ trợ
 */
export function listGeminiLiveVoices(): Array<{ id: GeminiLiveVoice; personality: string; accent: string }> {
  return [
    { id: 'Aoede', personality: 'Nữ ấm áp, tươi sáng, phù hợp trợ lý sáng tạo', accent: 'US English / có thể nói tiếng Việt' },
    { id: 'Kore', personality: 'Nữ sâu lắng, chuyên nghiệp, phù hợp tài chính kế toán', accent: 'US English' },
    { id: 'Puck', personality: 'Nam vui vẻ, tràn đầy năng lượng, phù hợp marketing & game', accent: 'US English' },
    { id: 'Charon', personality: 'Nam trầm ấm, mạnh mẽ, phù hợp CEO Briefing', accent: 'US English' },
    { id: 'Zephyr', personality: 'Giọng trung tính, hơi robot hóa, phù hợp lĩnh vực kỹ thuật', accent: 'US English' },
    { id: 'Fenrir', personality: 'Nam thấp, giọng husky, phù hợp đọc truyện / lồng tiếng phim', accent: 'US English' },
  ];
}
