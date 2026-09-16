/**
 * glaciaSpeech.ts
 * ═══════════════════════════════════════════════════════════════
 * Voice layer for Glacia — the foundation of a Conversational Avatar.
 *
 *  - TTS: Web Speech API `speechSynthesis` (Vietnamese-first voice).
 *  - STT: Web Speech API `SpeechRecognition` / `webkitSpeechRecognition`.
 *
 * Every call is feature-guarded so the avatar still works in browsers or
 * environments without speech support (silent fallback).
 * ═══════════════════════════════════════════════════════════════
 */

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
  /** Fires at word boundaries — used to drive lip-sync. */
  onBoundary?: (charIndex: number) => void;
}

export interface SttCallbacks {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

const VOICE_PREF_KEY = 'lf_glacia_voice_uri';
let cachedVoice: SpeechSynthesisVoice | null = null;

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSttSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isTtsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (cachedVoice) {
    const still = voices.find((v) => v.voiceURI === cachedVoice?.voiceURI);
    if (still) return still;
  }

  const viFemale = voices.find(
    (v) =>
      (v.lang || '').toLowerCase().startsWith('vi') &&
      /female|nu|nữ|hoaimy|mai|linh|an|huong|phuong|trang|natural|google/i.test(v.name)
  );
  const anyVi = voices.find((v) => (v.lang || '').toLowerCase().startsWith('vi'));
  const enFemale = voices.find((v) => /female|woman|jenny|aria|samantha|victoria|zira|google us english/i.test(v.name));
  const chosen = viFemale || anyVi || enFemale || voices[0];
  cachedVoice = chosen ?? null;
  if (chosen) {
    try {
      localStorage.setItem(VOICE_PREF_KEY, chosen.voiceURI);
    } catch {
      /* ignore */
    }
  }
  return chosen ?? null;
}

import { glaciaVoice } from './glaciaVoiceEngine';

/** Prime the voice list (some browsers load voices async). Call on app mount. */
export function initSpeechVoices(): void {
  if (!isTtsSupported()) return;
  pickVoice();
  window.speechSynthesis.onvoiceschanged = () => pickVoice();
}

/** Speak text out loud with real-time lip-sync visemes. Returns a cancel function. */
export function speak(text: string, cb: SpeakCallbacks = {}): () => void {
  cb.onStart?.();
  glaciaVoice.speak(text, 'happy', () => {
    cb.onEnd?.();
  });
  return () => glaciaVoice.stopSpeaking();
}

export function stopSpeaking(): void {
  glaciaVoice.stopSpeaking();
}

/** Start voice recognition. Returns a stop function. */
export function listen(cb: SttCallbacks = {}): () => void {
  const w = window as unknown as Record<string, unknown>;
  const Rec = (w.SpeechRecognition || w.webkitSpeechRecognition) as
    | (new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((e: unknown) => void) | null;
        onend: (() => void) | null;
        onerror: ((e: unknown) => void) | null;
        start: () => void;
        stop: () => void;
      })
    | undefined;

  if (!Rec) {
    cb.onError?.(new Error('STT not supported'));
    cb.onEnd?.();
    return () => {};
  }

  const rec = new Rec();
  rec.lang = 'vi-VN';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e: unknown) => {
    const evt = e as { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
    let interim = '';
    let final = '';
    for (let i = evt.resultIndex; i < evt.results.length; i += 1) {
      const r = evt.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    if (final) cb.onFinal?.(final.trim());
    else if (interim) cb.onInterim?.(interim.trim());
  };
  rec.onend = () => cb.onEnd?.();
  rec.onerror = (e: unknown) => {
    cb.onError?.(e);
    cb.onEnd?.();
  };

  try {
    rec.start();
  } catch {
    cb.onError?.(new Error('STT start failed'));
    cb.onEnd?.();
    return () => {};
  }
  return () => rec.stop();
}
