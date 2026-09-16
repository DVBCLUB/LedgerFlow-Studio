/**
 * server/services/glaciaCEOMoodEngine.ts
 * Động cơ Cảm Nhận Cảm Xúc & Trạng Thái Làm Việc Của CEO (Emotion-Aware Companion OS) cho Glacia (Frontier 4).
 */

import fs from 'fs';
import path from 'path';

export type ResponseStyle =
  | 'concise_bullet_points'
  | 'gentle_encouraging'
  | 'direct_executive'
  | 'wellness_break_suggestion';

export interface CEOMoodState {
  stressLevel: number; // 0 - 100
  energyLevel: number; // 0 - 100
  focusScore: number; // 0 - 100
  detectedEmotion: 'calm' | 'focused' | 'stressed' | 'fatigued' | 'excited' | 'overwhelmed';
  recommendedResponseStyle: ResponseStyle;
  suggestedWellnessAction?: string;
  evaluatedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const MOOD_FILE = path.join(RUNTIME_DIR, 'glacia_ceo_mood_state.json');

export function evaluateCEOMoodFromSignals(payload: {
  recentPrompt?: string;
  typingSpeedWpm?: number;
  sessionDurationMinutes?: number;
  currentHour?: number;
}): CEOMoodState {
  const text = (payload.recentPrompt || '').toLowerCase();
  const hour = payload.currentHour !== undefined ? payload.currentHour : new Date().getHours();
  const duration = payload.sessionDurationMinutes || 30;

  let stress = 20;
  let energy = 80;
  let focus = 85;
  let emotion: CEOMoodState['detectedEmotion'] = 'focused';
  let style: ResponseStyle = 'direct_executive';
  let wellnessAction: string | undefined;

  // Signal 1: Late night fatigue / stress (23:00 - 05:00)
  if (hour >= 23 || hour < 5) {
    stress += 35;
    energy -= 40;
    emotion = 'fatigued';
    style = 'wellness_break_suggestion';
    wellnessAction = 'Founder David Bao đã làm việc khuya (sau 23h). Glacia đề xuất lưu snapshot và nghỉ ngơi để tái tạo năng lượng.';
  }

  // Signal 2: Urgent / Frustrated vocabulary
  const stressKeywords = ['gấp', 'lỗi nghiêm trọng', 'sao lại thế', 'cháy deadline', 'cứu', 'hỏng hết', 'mệt quá', 'stress'];
  if (stressKeywords.some((k) => text.includes(k))) {
    stress += 40;
    focus = Math.max(30, focus - 20);
    emotion = 'stressed';
    style = 'concise_bullet_points';
    wellnessAction = 'Glacia tự động rút ngắn phản hồi thành các đầu mục cốt lõi nhất để giảm tải áp lực thông tin.';
  }

  // Signal 3: Long marathon session (> 180 minutes)
  if (duration > 180) {
    energy = Math.max(20, energy - 30);
    stress += 15;
    if (emotion !== 'stressed') emotion = 'fatigued';
  }

  // Signal 4: Positive / Motivated vocabulary
  const positiveKeywords = ['tuyệt vời', 'hoàn hảo', 'thành công', 'tốt lắm', 'tiếp tục', 'xong rồi'];
  if (positiveKeywords.some((k) => text.includes(k))) {
    stress = Math.max(10, stress - 20);
    energy = Math.min(100, energy + 20);
    emotion = 'excited';
    style = 'direct_executive';
  }

  stress = Math.max(0, Math.min(100, stress));
  energy = Math.max(0, Math.min(100, energy));
  focus = Math.max(0, Math.min(100, focus));

  const moodState: CEOMoodState = {
    stressLevel: stress,
    energyLevel: energy,
    focusScore: focus,
    detectedEmotion: emotion,
    recommendedResponseStyle: style,
    suggestedWellnessAction: wellnessAction,
    evaluatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(MOOD_FILE, JSON.stringify(moodState, null, 2), 'utf-8');
  } catch (err) {}

  return moodState;
}

export function getLatestCEOMoodState(): CEOMoodState {
  try {
    if (fs.existsSync(MOOD_FILE)) {
      return JSON.parse(fs.readFileSync(MOOD_FILE, 'utf-8'));
    }
  } catch (err) {}
  return evaluateCEOMoodFromSignals({});
}
