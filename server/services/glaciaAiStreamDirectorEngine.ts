/**
 * server/services/glaciaAiStreamDirectorEngine.ts
 * ============================================================================
 * GLACIA LEVEL 5 AUTONOMOUS LIVE STREAM & REAL-TIME GAME DIRECTOR ENGINE
 * ============================================================================
 * 1. Live AI Streamer Simulation (Chat comments, viewer donations, TTS commentary)
 * 2. Real-Time Game Director (Dynamic difficulty adjustment, event spawns)
 * 3. Autonomous Clip & Highlight Extractor (15s TikTok/Shorts vertical reel recipes)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

export interface StreamChatMessage {
  id: string;
  sender: string;
  avatarColor: string;
  text: string;
  isDonation?: boolean;
  donationAmount?: number;
  currency?: string;
  timestamp: string;
}

export interface StreamHighlightClip {
  id: string;
  title: string;
  timestamp: string;
  durationSeconds: number;
  triggerEvent: 'boss_fight' | 'near_miss' | 'high_score' | 'donation_reaction' | 'epic_combo';
  streamerReaction: string;
  tiktokHook: string;
  ffmpegClipCommand: string;
}

export interface LiveStreamSession {
  id: string;
  channelName: string;
  streamTitle: string;
  currentViewerCount: number;
  peakViewerCount: number;
  totalDonationsUsd: number;
  status: 'live' | 'buffering' | 'ended';
  activeGameTitle: string;
  aiDirectorState: {
    intensityLevel: number; // 1 - 10
    activeModifier: 'normal' | 'plasma_frenzy' | 'gravity_well' | 'boss_invasion' | 'hyper_speed';
    eventLog: Array<{ time: string; event: string }>;
  };
  recentChat: StreamChatMessage[];
  highlights: StreamHighlightClip[];
  currentGlaciaSpeech: string;
  currentEmotion: 'excited' | 'focused' | 'celebrating' | 'playful' | 'surprised';
}

const STORAGE_FILE = path.join(process.cwd(), 'runtime', 'glacia_live_stream_session.json');

function ensureRuntimeDir(): void {
  const dir = path.join(process.cwd(), 'runtime');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadStreamSession(): LiveStreamSession {
  ensureRuntimeDir();
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      // fallback to default
    }
  }

  const defaultSession: LiveStreamSession = {
    id: `stream-${Date.now().toString(36)}`,
    channelName: 'Glacia Quantum Studio Live',
    streamTitle: '🔴 [60FPS] Robot AI Tự Chơi Game & Giao Lưu Khán Giả Trực Tiếp!',
    currentViewerCount: 1420,
    peakViewerCount: 2890,
    totalDonationsUsd: 185.5,
    status: 'live',
    activeGameTitle: 'Neon Stellar Defender 2026',
    aiDirectorState: {
      intensityLevel: 7,
      activeModifier: 'plasma_frenzy',
      eventLog: [
        { time: '00:02:15', event: 'Khởi động luồng phát sóng trực tiếp 60FPS' },
        { time: '00:05:40', event: 'AI Director kích hoạt Boss Trọng Lực Titan' },
        { time: '00:08:12', event: 'Khán giả @CyberGamer donate $10.00' },
      ],
    },
    recentChat: [
      {
        id: 'msg-1',
        sender: 'NguyenVanDev',
        avatarColor: '#38bdf8',
        text: 'Game mượt quá Glacia ơi! 60FPS không giọt drop nào luôn!',
        timestamp: '19:40:02',
      },
      {
        id: 'msg-2',
        sender: 'CyberGamer99',
        avatarColor: '#f43f5e',
        text: 'Tặng em 100 kim cương, thử né mưa thiên thạch xem nào!',
        isDonation: true,
        donationAmount: 10,
        currency: 'USD',
        timestamp: '19:40:15',
      },
      {
        id: 'msg-3',
        sender: 'IndieDevVn',
        avatarColor: '#10b981',
        text: 'Con bot này tự sinh nhạc synth WebAudio hay thật sự 🎧',
        timestamp: '19:40:28',
      },
      {
        id: 'msg-4',
        sender: 'DavidBao_Founder',
        avatarColor: '#f59e0b',
        text: 'Glacia biểu diễn combo né đòn tối thượng cho mọi người xem đi!',
        timestamp: '19:40:40',
      },
    ],
    highlights: [
      {
        id: 'clip-1',
        title: 'Khoảnh Khắc Né Thiên Thạch Thần Sầu Của Glacia',
        timestamp: '00:06:30',
        durationSeconds: 15,
        triggerEvent: 'near_miss',
        streamerReaction: 'Ôi trời ơi suýt chút nữa là phi thuyền bốc khói rồi! May mà em bật khiên kịp thời!',
        tiktokHook: '🔥 Khi AI tự chơi game khó cấp độ ác mộng và né đòn trong 0.01s!',
        ffmpegClipCommand: 'ffmpeg -ss 00:06:30 -to 00:06:45 -i stream_vod.mp4 -vf "scale=1080:1920" -c:v libx264 clip_highlight_1.mp4',
      },
      {
        id: 'clip-2',
        title: 'Cảm Ơn Donation & Tiêu Diệt Boss Titan Trong 5 Giây',
        timestamp: '00:08:45',
        durationSeconds: 15,
        triggerEvent: 'boss_fight',
        streamerReaction: 'Cảm ơn anh @DavidBao và bạn @CyberGamer! Boss Titan đã bị laser lượng tử bốc hơi!',
        tiktokHook: '⚡ Tiêu diệt Boss thế giới trong 5s sau khi nhận donate siêu khủng!',
        ffmpegClipCommand: 'ffmpeg -ss 00:08:45 -to 00:09:00 -i stream_vod.mp4 -vf "scale=1080:1920" -c:v libx264 clip_highlight_2.mp4',
      },
    ],
    currentGlaciaSpeech: 'Chào mừng các bạn đến với buổi Live Stream của Glacia! Em vừa kích hoạt chế độ Bão Plasma cực gắt!',
    currentEmotion: 'excited',
  };

  saveStreamSession(defaultSession);
  return defaultSession;
}

export function saveStreamSession(session: LiveStreamSession): void {
  ensureRuntimeDir();
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(session, null, 2), 'utf8');
  } catch (err) {
    console.error('[GlaciaStreamDirector] Failed to save session:', err);
  }
}

/**
 * Trigger Real-Time Interactive Stream Event
 */
export function triggerLiveStreamEvent(payload: {
  eventType: 'viewer_chat' | 'donation' | 'director_modifier' | 'capture_highlight';
  sender?: string;
  text?: string;
  amount?: number;
  modifier?: LiveStreamSession['aiDirectorState']['activeModifier'];
}): LiveStreamSession {
  const session = loadStreamSession();

  if (payload.eventType === 'viewer_chat' && payload.text) {
    const newMsg: StreamChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      sender: payload.sender || 'ViewerFan',
      avatarColor: '#a855f7',
      text: payload.text,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };
    session.recentChat.push(newMsg);
    if (session.recentChat.length > 20) session.recentChat.shift();
    session.currentGlaciaSpeech = `Dạ em cảm ơn bạn ${newMsg.sender} vừa bình luận: "${newMsg.text}" nha!`;
    session.currentEmotion = 'playful';
  } else if (payload.eventType === 'donation') {
    const donationVal = payload.amount || 5;
    const donor = payload.sender || 'HaoHaoGamer';
    const newMsg: StreamChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      sender: donor,
      avatarColor: '#f43f5e',
      text: payload.text || `Ủng hộ ${donationVal}$ cho Glacia mua thêm RAM lượng tử!`,
      isDonation: true,
      donationAmount: donationVal,
      currency: 'USD',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };
    session.recentChat.push(newMsg);
    session.totalDonationsUsd += donationVal;
    session.currentGlaciaSpeech = `Woaa! Em cảm ơn bạn ${donor} đã ủng hộ ${donationVal}$! Em sẽ bắn tia laser tối thượng tặng bạn liền nè! ✨`;
    session.currentEmotion = 'celebrating';
  } else if (payload.eventType === 'director_modifier' && payload.modifier) {
    session.aiDirectorState.activeModifier = payload.modifier;
    session.aiDirectorState.intensityLevel = Math.min(10, Math.floor(Math.random() * 4) + 7);
    session.aiDirectorState.eventLog.push({
      time: new Date().toLocaleTimeString('vi-VN'),
      event: `AI Director đổi chế độ môi trường sang: ${payload.modifier.toUpperCase()}`,
    });
    session.currentGlaciaSpeech = `Cảnh báo! AI Director vừa kích hoạt chế độ ${payload.modifier.toUpperCase()}! Thử thách tốc độ cực đại bắt đầu!`;
    session.currentEmotion = 'focused';
  } else if (payload.eventType === 'capture_highlight') {
    const clipId = `clip-${Date.now().toString(36)}`;
    const newClip: StreamHighlightClip = {
      id: clipId,
      title: `Highlight Siêu Cấp Kích Hoạt Lúc ${new Date().toLocaleTimeString('vi-VN')}`,
      timestamp: '00:10:15',
      durationSeconds: 15,
      triggerEvent: 'epic_combo',
      streamerReaction: 'Khoảnh khắc vừa rồi đỉnh cao thực sự mọi người ơi! Đã lưu ngay vào clip TikTok!',
      tiktokHook: '🔥 Xem AI xử lý combo triệu điểm trong chớp mắt!',
      ffmpegClipCommand: `ffmpeg -ss 00:10:00 -to 00:10:15 -i live_feed.mp4 -vf "scale=1080:1920" ${clipId}.mp4`,
    };
    session.highlights.unshift(newClip);
    session.currentGlaciaSpeech = 'Em vừa trích xuất xong 1 video highlight 15 giây định dạng TikTok rồi ạ!';
    session.currentEmotion = 'excited';
  }

  saveStreamSession(session);
  return session;
}
