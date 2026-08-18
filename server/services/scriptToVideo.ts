/**
 * scriptToVideo.ts
 * ============================================================
 * Video pipeline rẻ, không đốt tiền Veo/Runway:
 *   script (Gemini free) → ảnh tĩnh (Nano Banana $0.039/ảnh hoặc Flux local $0)
 *   → giọng đọc (Gemini TTS free) → nhạc (Lyria $0.04/bài) → dựng FFmpeg ($0).
 *
 * Chỉ dùng Veo Lite ($0.05/giây) cho clip "wow" ngắn khi thực sự cần.
 */

export interface VideoScene {
  index: number;
  narration: string;
  imagePrompt: string;
  durationSec: number;
}

export interface ScriptToVideoPlan {
  id: string;
  title: string;
  format: string;
  scenes: VideoScene[];
  pipeline: string[];
  estimatedCost: {
    imagesUsd: number;
    ttsUsd: number;
    musicUsd: number;
    videoClipsUsd: number;
    totalUsd: number;
    currency: 'USD';
  };
}

const IMAGE_COST_USD = 0.039;   // Gemini 2.5 Flash Image (Nano Banana) 1K
const MUSIC_COST_USD = 0.04;    // Lyria 3, 1 bài

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function planScriptToVideo(input: {
  topic: string;
  format?: string;
  sceneCount?: number;
  useVideoClips?: boolean;
}): ScriptToVideoPlan {
  const sceneCount = Math.max(1, Math.min(12, input.sceneCount || 6));
  const scenes: VideoScene[] = [];

  for (let i = 0; i < sceneCount; i += 1) {
    scenes.push({
      index: i + 1,
      narration: `Cảnh ${i + 1} về ${input.topic}.`,
      imagePrompt: `Minh họa ${input.topic}, cảnh ${i + 1}, phong cách cinematic, 16:9.`,
      durationSec: 5,
    });
  }

  const imagesUsd = round2(sceneCount * IMAGE_COST_USD);
  const ttsUsd = 0;                       // Gemini TTS free tier
  const musicUsd = round2(MUSIC_COST_USD);
  const videoClipsUsd = input.useVideoClips ? round2(2 * 0.05) : 0; // 2 clip Veo Lite 720p

  return {
    id: `video_${Date.now()}`,
    title: input.topic,
    format: input.format || 'tiktok_shorts_reels',
    scenes,
    pipeline: [
      'script: gemini free',
      `image: gemini-2.5-flash-image (${imagesUsd} USD)`,
      'tts: gemini-2.5-flash-tts (free)',
      `music: lyria (${musicUsd} USD)`,
      'assemble: ffmpeg ($0)',
    ],
    estimatedCost: {
      imagesUsd,
      ttsUsd,
      musicUsd,
      videoClipsUsd,
      totalUsd: round2(imagesUsd + ttsUsd + musicUsd + videoClipsUsd),
      currency: 'USD',
    },
  };
}
