/**
 * edgeTtsConnector.ts
 * ============================================================
 * MICROSOFT EDGE TTS ($0 FREE VOICE) & SUBTITLE GENERATOR
 *
 * Cung cấp giọng đọc lồng tiếng AI chất lượng cao hoàn toàn $0:
 * 1. Tiếng Việt: vi-VN-HoaiMyNeural (Nữ), vi-VN-NamMinhNeural (Nam).
 * 2. Tiếng Anh: en-US-JennyNeural, en-US-GuyNeural.
 * 3. Tự động tính toán timestamp và sinh phụ đề .srt / .vtt đồng bộ.
 * 4. Tạo script chạy dòng lệnh edge-tts hoặc web audio buffer.
 */

export interface EdgeTtsVoiceOption {
  shortName: string;
  gender: 'Female' | 'Male';
  locale: string;
  friendlyName: string;
  suggestedSpeed: string;
  suggestedPitch: string;
}

export const EDGE_TTS_VOICES: EdgeTtsVoiceOption[] = [
  {
    shortName: 'vi-VN-HoaiMyNeural',
    gender: 'Female',
    locale: 'vi-VN',
    friendlyName: 'Hoài My (Nữ - Truyền cảm, chuẩn giọng Bắc)',
    suggestedSpeed: '+0%',
    suggestedPitch: '+0Hz',
  },
  {
    shortName: 'vi-VN-NamMinhNeural',
    gender: 'Male',
    locale: 'vi-VN',
    friendlyName: 'Nam Minh (Nam - Trầm ấm, dứt khoát)',
    suggestedSpeed: '+0%',
    suggestedPitch: '+0Hz',
  },
  {
    shortName: 'en-US-JennyNeural',
    gender: 'Female',
    locale: 'en-US',
    friendlyName: 'Jenny (Nữ - Tiếng Anh bản xứ)',
    suggestedSpeed: '+0%',
    suggestedPitch: '+0Hz',
  },
  {
    shortName: 'en-US-GuyNeural',
    gender: 'Male',
    locale: 'en-US',
    friendlyName: 'Guy (Nam - Tiếng Anh doanh nhân)',
    suggestedSpeed: '+0%',
    suggestedPitch: '+0Hz',
  },
];

export interface EdgeTtsSynthesisJob {
  jobId: string;
  text: string;
  voice: EdgeTtsVoiceOption;
  speed: string;
  pitch: string;
  outputAudioFile: string;
  cliCommand: string;
  pythonCommand: string;
  srtSubtitles: string;
  vttSubtitles: string;
  durationEstimateSec: number;
  generatedAt: string;
}

export function synthesizeEdgeTtsJob(input: {
  text: string;
  voiceShortName?: string;
  speed?: string;
  pitch?: string;
}): EdgeTtsSynthesisJob {
  const jobId = `tts_${Date.now()}`;
  const voice =
    EDGE_TTS_VOICES.find((v) => v.shortName === input.voiceShortName) || EDGE_TTS_VOICES[0];
  const speed = input.speed || voice.suggestedSpeed;
  const pitch = input.pitch || voice.suggestedPitch;
  const outputAudioFile = `audio_${jobId}.mp3`;

  // Ước tính thời lượng: tiếng Việt trung bình 3.5 từ / giây
  const wordCount = input.text.trim().split(/\s+/).length;
  const durationEstimateSec = Math.max(2, Math.round(wordCount / 3.2));

  const cliCommand = `edge-tts --voice "${voice.shortName}" --rate="${speed}" --pitch="${pitch}" --text "${input.text.replace(/"/g, '\\"')}" --write-media "${outputAudioFile}" --write-subtitles "subtitles_${jobId}.vtt"`;

  const pythonCommand = `import asyncio
import edge_tts

async def main():
    communicate = edge_tts.Communicate(
        text=${JSON.stringify(input.text)},
        voice="${voice.shortName}",
        rate="${speed}",
        pitch="${pitch}"
    )
    await communicate.save("${outputAudioFile}")

asyncio.run(main())
`;

  // Tự động phân đoạn và sinh SRT Subtitles
  const sentences = input.text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const timePerSentence = durationEstimateSec / (sentences.length || 1);

  const formatSrtTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${hrs}:${mins}:${secs},${ms}`;
  };

  const srtSubtitles = sentences
    .map((s, idx) => {
      const start = idx * timePerSentence;
      const end = (idx + 1) * timePerSentence;
      return `${idx + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${s.trim()}\n`;
    })
    .join('\n');

  const vttSubtitles = `WEBVTT\n\n` + srtSubtitles.replace(/,/g, '.');

  return {
    jobId,
    text: input.text,
    voice,
    speed,
    pitch,
    outputAudioFile,
    cliCommand,
    pythonCommand,
    srtSubtitles,
    vttSubtitles,
    durationEstimateSec,
    generatedAt: new Date().toISOString(),
  };
}
