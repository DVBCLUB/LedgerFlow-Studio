/**
 * audioGenAdapter.ts
 * ============================================================
 * Real text-to-speech / audio-generation adapter for the Asset Foundry.
 *
 *   - ElevenLabs (multi-voice, commercial) — api.elevenlabs.io
 *   - Microsoft Edge TTS (free)            — speech.platform.bing.com
 *
 * Output is always materialized as a local MP3 registered in the
 * content-addressed Asset Registry, so it can feed the video renderer.
 */

import { findMediaKey } from './mediaProviderClient.ts';
import { registerAsset } from './assetRegistry.ts';

export type AudioProvider = 'elevenlabs' | 'edge';

export interface SpeechInput {
  text: string;
  provider?: AudioProvider;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface SpeechResult {
  ok: boolean;
  status: 'completed' | 'no_provider' | 'failed';
  cid?: string;
  filePath?: string;
  provider?: string;
  voice?: string;
  error?: string;
}

const EDGE_VOICES: Record<string, string> = {
  vi_female: 'vi-VN-HoaiMyNeural',
  vi_male: 'vi-VN-NamMinhNeural',
  en_female: 'en-US-JennyNeural',
  en_male: 'en-US-GuyNeural',
};

const EDGE_TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function postBinary(url: string, body: string | Record<string, unknown>, headers: Record<string, string>, timeoutMs = 120_000): Promise<Buffer> {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeElevenLabs(input: SpeechInput, apiKey: string): Promise<Buffer> {
  const voiceId = input.voice || '21m00Tcm4TlvDq8ikWAM'; // default: Rachel
  const body = {
    text: input.text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      ...(input.speed ? { rate: input.speed } : {}),
    },
  };
  return postBinary(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    body,
    { 'content-type': 'application/json', 'xi-api-key': apiKey, accept: 'audio/mpeg' }
  );
}

async function synthesizeEdge(input: SpeechInput): Promise<Buffer> {
  const voice = EDGE_VOICES[input.voice || ''] || input.voice || 'vi-VN-HoaiMyNeural';
  const lang = (input.language || 'vi-VN');
  const rate = input.speed ? ` rate="${input.speed < 0 ? input.speed : `+${input.speed}`}%"` : '';
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody${rate}>${escapeXml(input.text)}</prosody></voice></speak>`;
  return postBinary(
    `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${EDGE_TRUSTED_TOKEN}`,
    ssml,
    {
      'content-type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    }
  );
}

/**
 * Synthesize speech to a local MP3, preferring ElevenLabs when a key exists,
 * otherwise falling back to the free Edge TTS endpoint.
 */
export async function synthesizeSpeech(input: SpeechInput): Promise<SpeechResult> {
  if (!input.text?.trim()) {
    return { ok: false, status: 'failed', error: 'text is required' };
  }

  const provider: AudioProvider = input.provider || 'elevenlabs';
  let bytes: Buffer | undefined;
  let usedProvider = provider;

  if (provider === 'elevenlabs') {
    const key = await findMediaKey('elevenlabs');
    if (!key) {
      usedProvider = 'edge';
    } else {
      try {
        bytes = await synthesizeElevenLabs(input, key.apiKey);
      } catch (err: any) {
        return { ok: false, status: 'failed', provider: 'elevenlabs', error: err.message };
      }
    }
  }

  if (usedProvider === 'edge') {
    try {
      bytes = await synthesizeEdge(input);
    } catch (err: any) {
      return { ok: false, status: 'failed', provider: 'edge', error: err.message };
    }
  }

  if (!bytes) {
    return { ok: false, status: 'failed', error: 'no audio produced' };
  }

  const rec = registerAsset({
    kind: 'audio',
    name: `tts_${Date.now()}.mp3`,
    mimeType: 'audio/mpeg',
    bytes,
    provenance: { source: 'audioGenAdapter', provider: usedProvider, prompt: input.text.slice(0, 200) },
  });

  return {
    ok: true,
    status: 'completed',
    cid: rec.cid,
    filePath: rec.filePath,
    provider: usedProvider,
    voice: input.voice,
  };
}
