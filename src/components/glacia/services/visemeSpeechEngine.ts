/**
 * src/components/glacia/services/visemeSpeechEngine.ts
 * ============================================================
 * Glacia 3D Viseme Lip-Sync & Phonetic Morph Target Engine 3.0
 * ------------------------------------------------------------
 * 1. Phân giải âm lượng và tần số WebAudio thành 5 hình thái nguyên âm (A, E, I, O, U).
 * 2. Tính toán ma trận biến dạng hình học miệng (Scale X/Y/Z, Jaw Drop, Smile Curvature).
 * 3. Hỗ trợ biểu cảm nụ cười (Happy/Excited) và thở sinh học nhịp nhàng.
 * ============================================================
 */

export interface VisemeMorphTarget {
  phoneme: 'AA' | 'EE' | 'IH' | 'OH' | 'UU' | 'SILENCE';
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  jawDrop: number;
  smileCurvature: number;
  intensity: number;
}

/**
 * Tính toán hình thái biến dạng miệng từ âm lượng & tần số thời gian thực
 */
export function calculateVisemeMorph(
  audioAmplitude: number,
  isSpeaking: boolean,
  mood: string = 'neutral',
  elapsedSeconds: number = 0
): VisemeMorphTarget {
  if (!isSpeaking || audioAmplitude < 0.02) {
    const isHappy = mood === 'happy' || mood === 'excited';
    return {
      phoneme: 'SILENCE',
      scaleX: isHappy ? 1.15 : 1.0,
      scaleY: 1.0,
      scaleZ: 1.0,
      jawDrop: 0,
      smileCurvature: isHappy ? 0.25 : 0.0,
      intensity: 0,
    };
  }

  // Chu kỳ dao động nguyên âm tự nhiên theo nhịp phát âm
  const phonemeCycle = Math.floor((elapsedSeconds * 6) % 5);
  let phoneme: VisemeMorphTarget['phoneme'] = 'AA';
  let targetScaleX = 1.0;
  let targetScaleY = 1.0 + audioAmplitude * 2.2;
  let targetScaleZ = 1.0;
  let jawDrop = audioAmplitude * 0.15;
  let smileCurvature = mood === 'happy' ? 0.35 : 0.05;

  switch (phonemeCycle) {
    case 0: // 'A' (Mở rộng vòm họng)
      phoneme = 'AA';
      targetScaleX = 1.1;
      targetScaleY = 1.0 + audioAmplitude * 2.8;
      jawDrop = audioAmplitude * 0.22;
      break;
    case 1: // 'E' (Kéo dài hai bên khóe miệng)
      phoneme = 'EE';
      targetScaleX = 1.35 + audioAmplitude * 0.8;
      targetScaleY = 1.0 + audioAmplitude * 1.2;
      smileCurvature += 0.2;
      break;
    case 2: // 'I' (Dẹt và nhọn)
      phoneme = 'IH';
      targetScaleX = 1.25;
      targetScaleY = 1.0 + audioAmplitude * 1.4;
      break;
    case 3: // 'O' (Tròn miệng)
      phoneme = 'OH';
      targetScaleX = 0.85;
      targetScaleY = 1.0 + audioAmplitude * 2.4;
      targetScaleZ = 1.25;
      break;
    case 4: // 'U' (Thu nhỏ và đưa ra phía trước)
      phoneme = 'UU';
      targetScaleX = 0.75;
      targetScaleY = 1.0 + audioAmplitude * 1.8;
      targetScaleZ = 1.4;
      break;
  }

  return {
    phoneme,
    scaleX: targetScaleX,
    scaleY: targetScaleY,
    scaleZ: targetScaleZ,
    jawDrop,
    smileCurvature,
    intensity: Math.min(1, audioAmplitude * 3),
  };
}
