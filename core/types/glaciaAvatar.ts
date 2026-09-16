/**
 * core/types/glaciaAvatar.ts
 * ═══════════════════════════════════════════════════════════════
 * Pure shared types + constants for the Glacia AI Avatar feature.
 *
 * These are intentionally free of any server-only or browser-only
 * dependencies so they can be imported from both:
 *   - server/services/aiAvatarConnector.ts   (backend)
 *   - src/components/glacia/**                 (frontend)
 *
 * Do NOT add runtime dependencies (fs, express, fetch, DOM, …) here.
 * ═══════════════════════════════════════════════════════════════
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AvatarEngine =
  | 'LIVEPORTRAIT_LOCAL'
  | 'HEYGEN_CLOUD'
  | 'DID_CLOUD'
  | 'CUSTOM_WEBGL'
  | 'ELEVENLABS'
  | 'AZURE_TTS';

// Extended emotion types for more expressive avatars
export type AvatarEmotion =
  | 'NEUTRAL'
  | 'CONFIDENT_SMILE'
  | 'SERIOUS_EXECUTIVE'
  | 'ENTHUSIASTIC'
  | 'HAPPY'
  | 'CURIOUS'
  | 'THINKING'
  | 'LISTENING'
  | 'ALERT'
  | 'CELEBRATING'
  | 'ANGRY'
  | 'SAD'
  | 'SURPRISED';

// Head and facial gestures
export type HeadGesture =
  | 'NOD'
  | 'SHAKE'
  | 'TILT_LEFT'
  | 'TILT_RIGHT'
  | 'DIRECT_GAZE'
  | 'LOOK_UP'
  | 'LOOK_DOWN'
  | 'BLINK'
  | 'RAISE_EYEBROWS';

export type HandGesture =
  | 'WAVE'
  | 'POINT'
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
  | 'CLAP'
  | 'PEACE'
  | 'CROSS_ARMS'
  | 'IDLE';

export type BodyGesture =
  | 'STAND_STRAIGHT'
  | 'LEAN_FORWARD'
  | 'LEAN_BACK'
  | 'CROSS_ARMS'
  | 'HANDS_ON_HIPS'
  | 'IDLE';

// Enhanced scene specification
export interface AvatarSceneSpec {
  sceneNumber: number;
  spokenText: string;
  emotion: AvatarEmotion;
  headGesture: HeadGesture;
  handGesture: HandGesture;
  bodyGesture: BodyGesture;
  durationSecondsEstimate: number;
  // For viseme lip-sync
  visemeSequence?: Array<{
    viseme: string;
    startTime: number;
    endTime: number;
    intensity: number;
  }>;
  // For eye tracking
  eyeTarget?: { x: number; y: number; z: number };
  // For camera movements
  cameraFocus?: 'USER' | 'SCREEN' | 'OBJECT';
}

// Conversation context for stateful interactions
export interface ConversationContext {
  conversationId: string;
  sessionId: string;
  userId: string;
  userName?: string;
  previousEmotion: AvatarEmotion;
  currentMood: string;
  interactionCount: number;
  lastInteractionAt: string;
  // Memory context
  shortTermMemory: Array<{ role: 'user' | 'assistant'; content: string }>;
  longTermMemoryTags: string[];
}

// Real-time streaming response
export interface StreamingResponse {
  type: 'start' | 'chunk' | 'end' | 'error';
  data?: string;
  emotion?: AvatarEmotion;
  gesture?: HeadGesture | HandGesture;
  viseme?: string;
  timestamp: number;
  conversationId: string;
}

// Presentation job with streaming support
export interface AvatarPresentationJob {
  jobId: string;
  avatarEngine: AvatarEngine;
  avatarPortraitUrl?: string;
  avatar3DModelUrl?: string; // For 3D avatars
  audioVoiceTrackUrl?: string;
  scenes: AvatarSceneSpec[];
  totalDurationSeconds: number;
  status: 'READY_TO_RENDER' | 'PROCESSING' | 'STREAMING' | 'COMPLETED' | 'ERROR';
  renderPayload: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
  // For streaming
  websocketUrl?: string;
  streamingSessionId?: string;
  // For real-time sync
  syncWithAvatar?: boolean;
  avatarInstanceId?: string;
}

// Real-time conversation state
export interface RealTimeConversationState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'streaming' | 'error';
  currentInput: string;
  currentResponse: string;
  currentEmotion: AvatarEmotion;
  currentGesture: HeadGesture | HandGesture;
  conversationId: string;
  sessionId: string;
  timestamp: number;
}

// ============================================================================
// EMOTION & GESTURE MAPPING
// ============================================================================

// Map simple moods to avatar emotions
export const MOOD_TO_EMOTION: Record<string, AvatarEmotion> = {
  'idle': 'NEUTRAL',
  'happy': 'HAPPY',
  'curious': 'CURIOUS',
  'thinking': 'THINKING',
  'listening': 'LISTENING',
  'dispatching': 'ENTHUSIASTIC',
  'celebrating': 'CELEBRATING',
  'alert': 'ALERT',
  'sleeping': 'NEUTRAL',
  'angry': 'ANGRY',
  'sad': 'SAD',
};

// Emotion to gesture mapping
export const EMOTION_TO_GESTURE: Record<AvatarEmotion, { head: HeadGesture; hand: HandGesture; body: BodyGesture }> = {
  NEUTRAL: { head: 'DIRECT_GAZE', hand: 'IDLE', body: 'STAND_STRAIGHT' },
  CONFIDENT_SMILE: { head: 'DIRECT_GAZE', hand: 'IDLE', body: 'STAND_STRAIGHT' },
  SERIOUS_EXECUTIVE: { head: 'NOD', hand: 'IDLE', body: 'LEAN_FORWARD' },
  ENTHUSIASTIC: { head: 'DIRECT_GAZE', hand: 'WAVE', body: 'LEAN_FORWARD' },
  HAPPY: { head: 'DIRECT_GAZE', hand: 'WAVE', body: 'STAND_STRAIGHT' },
  CURIOUS: { head: 'TILT_LEFT', hand: 'IDLE', body: 'LEAN_FORWARD' },
  THINKING: { head: 'LOOK_UP', hand: 'IDLE', body: 'STAND_STRAIGHT' },
  LISTENING: { head: 'TILT_RIGHT', hand: 'IDLE', body: 'LEAN_FORWARD' },
  ALERT: { head: 'RAISE_EYEBROWS', hand: 'IDLE', body: 'STAND_STRAIGHT' },
  CELEBRATING: { head: 'DIRECT_GAZE', hand: 'CLAP', body: 'STAND_STRAIGHT' },
  ANGRY: { head: 'SHAKE', hand: 'CROSS_ARMS', body: 'CROSS_ARMS' },
  SAD: { head: 'LOOK_DOWN', hand: 'IDLE', body: 'LEAN_BACK' },
  SURPRISED: { head: 'RAISE_EYEBROWS', hand: 'PEACE', body: 'LEAN_BACK' },
};

// Keyword-based emotion detection
export const EMOTION_DETECTION_KEYWORDS: Record<AvatarEmotion, string[]> = {
  NEUTRAL: ['ok', 'được', 'rồi', 'xong', 'thôi', 'vâng', 'dạ'],
  CONFIDENT_SMILE: ['tuyệt vời', 'thành công', 'hoàn hảo', 'xuất sắc', 'tốt lắm', 'hay quá'],
  SERIOUS_EXECUTIVE: ['quan trọng', 'nghiêm túc', 'chuyên nghiệp', 'đúng đắn', 'trách nhiệm'],
  ENTHUSIASTIC: ['hào hứng', 'phấn khích', 'vui mừng', 'thú vị', 'hứng thú', 'yêu thích'],
  HAPPY: ['vui', 'hạnh phúc', 'mừng', 'thích', 'yêu', 'cảm ơn', 'tuyệt'],
  CURIOUS: ['tại sao', 'như thế nào', 'làm sao', 'cách', 'hướng dẫn', 'giải thích', 'thắc mắc'],
  THINKING: ['suy nghĩ', 'xem xét', 'cân nhắc', 'phân tích', 'đánh giá', 'nghiên cứu'],
  LISTENING: ['nghe', 'lắng nghe', 'chú ý', 'tập trung'],
  ALERT: ['gấp', 'khẩn cấp', 'ngay lập tức', 'cảnh báo', 'nguy hiểm', 'cẩn thận'],
  CELEBRATING: ['chúc mừng', 'thành công', 'chiến thắng', 'đạt được', 'hoàn thành', 'tốt nghiệp'],
  ANGRY: ['tức giận', 'giận', 'phẫn nộ', 'không hài lòng', 'tồi tệ', 'tệ hại'],
  SAD: ['buồn', 'thất vọng', 'khó khăn', 'vất vả', 'mệt mỏi', 'đau khổ'],
  SURPRISED: ['ngạc nhiên', 'bất ngờ', 'ô', 'trời ơi', 'không thể tin', 'kinh ngạc'],
};
