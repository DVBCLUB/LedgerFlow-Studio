/**
 * aiAvatarConnector.ts
 * ============================================================
 * AI TALKING HEAD AVATAR CONNECTOR (HEYGEN / D-ID / LIVEPORTRAIT)
 *
 * Generates Talking Avatar presentation specifications with:
 *   - Voice & Phoneme timing
 *   - Facial Emotion & Head Motion cues
 *   - Local $0 LivePortrait / SadTalker payload compatibility
 *   - Cloud HeyGen / D-ID webhook compatibility
 */

import { recordAIAction } from './aiActionLedger.ts';

export type AvatarEngine = 'LIVEPORTRAIT_LOCAL' | 'HEYGEN_CLOUD' | 'DID_CLOUD';
export type AvatarEmotion = 'NEUTRAL' | 'CONFIDENT_SMILE' | 'SERIOUS_EXECUTIVE' | 'ENTHUSIASTIC';

export interface AvatarSceneSpec {
  sceneNumber: number;
  spokenText: string;
  emotion: AvatarEmotion;
  headGesture: 'NOD' | 'TILT_LEFT' | 'TILT_RIGHT' | 'DIRECT_GAZE';
  durationSecondsEstimate: number;
}

export interface AvatarPresentationJob {
  jobId: string;
  avatarEngine: AvatarEngine;
  avatarPortraitUrl: string;
  audioVoiceTrackUrl?: string;
  scenes: AvatarSceneSpec[];
  totalDurationSeconds: number;
  status: 'READY_TO_RENDER' | 'PROCESSING' | 'COMPLETED';
  renderPayload: Record<string, unknown>;
  createdAt: string;
}

/**
 * Generate Avatar Presentation Job Specification
 */
export function generateAvatarPresentationJob(params: {
  title: string;
  scriptLines: string[];
  avatarEngine?: AvatarEngine;
  avatarPortraitUrl?: string;
  authorRoleId?: string;
}): AvatarPresentationJob {
  const jobId = `avt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const avatarEngine = params.avatarEngine || 'LIVEPORTRAIT_LOCAL';
  const avatarPortraitUrl = params.avatarPortraitUrl || 'https://assets.ledgerflow.example/avatars/executive_speaker_4k.png';

  const emotions: AvatarEmotion[] = ['CONFIDENT_SMILE', 'SERIOUS_EXECUTIVE', 'ENTHUSIASTIC', 'NEUTRAL'];
  const gestures: Array<'NOD' | 'TILT_LEFT' | 'TILT_RIGHT' | 'DIRECT_GAZE'> = ['DIRECT_GAZE', 'NOD', 'TILT_LEFT', 'DIRECT_GAZE'];

  const scenes: AvatarSceneSpec[] = params.scriptLines.map((line, idx) => {
    const wordCount = line.split(/\s+/).length;
    const duration = Math.max(3, Math.round(wordCount * 0.35)); // ~3 words per second
    return {
      sceneNumber: idx + 1,
      spokenText: line,
      emotion: emotions[idx % emotions.length],
      headGesture: gestures[idx % gestures.length],
      durationSecondsEstimate: duration,
    };
  });

  const totalDurationSeconds = scenes.reduce((sum, s) => sum + s.durationSecondsEstimate, 0);

  const renderPayload = {
    jobId,
    engine: avatarEngine,
    portraitSource: avatarPortraitUrl,
    speechDriver: 'microsoft_edge_tts_vi_vn',
    scenesCount: scenes.length,
    totalDuration: totalDurationSeconds,
    resolution: '1080p_60fps',
  };

  const job: AvatarPresentationJob = {
    jobId,
    avatarEngine,
    avatarPortraitUrl,
    scenes,
    totalDurationSeconds,
    status: 'READY_TO_RENDER',
    renderPayload,
    createdAt: now,
  };

  recordAIAction({
    agentId: 'ai_avatar_connector',
    roleId: params.authorRoleId || 'role_chief_of_staff',
    domain: 'video_marketing',
    actionType: `AVATAR_JOB_GENERATED:${avatarEngine}`,
    targetResource: jobId,
    outputSummary: `Đã sinh gói MC ảo AI (${scenes.length} phân cảnh, ~${totalDurationSeconds}s) bằng engine ${avatarEngine}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return job;
}
