/**
 * glaciaYoutubeTranscriptBridge.ts
 * ============================================================================
 * GLACIA YOUTUBE TRANSCRIPT BRIDGE — LEVEL 2.2
 * ============================================================================
 * Đọc transcript của YouTube video (subtitles) và đưa vào Gemini để:
 * 1. Tóm tắt video trong 10 dòng chính
 * 2. Q&A / Chat hỏi đáp về nội dung video
 * 3. Trích xuất key insights (điểm nhấn, số liệu, công cụ đề cập)
 *
 * Ưu tiên dùng package `youtube-transcript` (nếu có), fallback dùng
 * endpoint `timedtext` của YouTube (không cần API key).
 * ============================================================================
 */

import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { callAIWithFallback } from './aiRouter.ts';
import type { ChatMessage } from './aiClient.ts';

async function aiCall(prompt: string, opts: { task?: any; maxTokens?: number; temperature?: number } = {}): Promise<{ text: string; content: string }> {
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
  const res = await callAIWithFallback(messages, {
    task: opts.task || 'analytics',
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
  });
  return { text: res.content || res.text || '', content: res.content || res.text || '' };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TranscriptLine {
  startSec: number;
  endSec?: number;
  text: string;
  durationSec?: number;
}

export interface YoutubeVideoMeta {
  videoId: string;
  url: string;
  title?: string;
  channelTitle?: string;
  durationSec?: number;
  viewCount?: number;
  uploadDate?: string;
  description?: string;
}

export interface YoutubeTranscriptResult {
  videoId: string;
  url: string;
  language: string;
  lines: TranscriptLine[];
  totalDurationSec: number;
  totalChars: number;
  totalWords: number;
  fallbackUsed: 'youtube-transcript' | 'timedtext-fallback' | 'none';
}

export interface YoutubeSummary {
  meta: YoutubeVideoMeta & { transcriptLanguage: string };
  oneLiner: string;                 // 1 câu tổng
  tenKeyPoints: string[];           // 10 điểm chính
  detailedSummary: string;          // 3-5 đoạn chi tiết
  actionItems: string[];            // các action được đề cập trong video
  peopleMentioned: string[];        // người được nhắc đến
  toolsMentioned: string[];         // công cụ / phần mềm được đề cập
  chapters?: Array<{ title: string; startSec: number; summary: string }>;
  qAReady: boolean;
  fullTranscriptChars: number;
}

export interface YoutubeChatTurn {
  turnId: string;
  user: string;
  ai: string;
  citedTimestamps?: number[];
  createdAt: string;
}

export interface YoutubeChatSession {
  id: string;
  videoId: string;
  transcript: YoutubeTranscriptResult;
  turns: YoutubeChatTurn[];
  createdAt: string;
}

// ─── Storage ────────────────────────────────────────────────────────────────

const CHAT_SESSION_DIR = path.join(process.cwd(), 'runtime', 'youtube_chat_sessions');
function ensureDirs() {
  if (!fs.existsSync(CHAT_SESSION_DIR)) fs.mkdirSync(CHAT_SESSION_DIR, { recursive: true });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extract video ID từ nhiều dạng URL youtube khác nhau */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  // 11 chars pure
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://youtu.be/${trimmed}`);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1).split('/')[0];
      if (id && id.length === 11) return id;
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com') || u.hostname.includes('m.youtube.com')) {
      const fromQuery = u.searchParams.get('v');
      if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
      const pathParts = u.pathname.split('/');
      const embedIdx = pathParts.indexOf('embed');
      const shortsIdx = pathParts.indexOf('shorts');
      const liveIdx = pathParts.indexOf('live');
      if (embedIdx >= 0 && pathParts[embedIdx + 1]?.length === 11) return pathParts[embedIdx + 1];
      if (shortsIdx >= 0 && pathParts[shortsIdx + 1]?.length === 11) return pathParts[shortsIdx + 1];
      if (liveIdx >= 0 && pathParts[liveIdx + 1]?.length === 11) return pathParts[liveIdx + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function secondsToTimestamp(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h ? h + ':' : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Transcript Fetchers ────────────────────────────────────────────────────

/**
 * Phương pháp 1: youtube-transcript package (nếu đã cài đặt)
 */
async function fetchViaPackage(videoId: string, lang = 'en'): Promise<YoutubeTranscriptResult | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('youtube-transcript');
    const YtTranscript = mod.YouTubeTranscriptApi || mod.default;
    if (!YtTranscript || typeof YtTranscript.fetchTranscript !== 'function') return null;
    const list: Array<{ text: string; duration: number; offset: number }> = await YtTranscript.fetchTranscript(videoId, { lang });
    const lines: TranscriptLine[] = list.map((l) => ({
      startSec: Math.round(l.offset),
      durationSec: l.duration ? Math.round(l.duration) : undefined,
      endSec: l.duration ? Math.round(l.offset + l.duration) : undefined,
      text: (l.text || '').replace(/\n+/g, ' ').trim(),
    })).filter((l) => l.text);
    if (lines.length === 0) return null;
    const textConcat = lines.map((l) => l.text).join(' ');
    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      language: lang,
      lines,
      totalDurationSec: Math.max(...lines.map((l) => l.startSec + (l.durationSec || 0))),
      totalChars: textConcat.length,
      totalWords: textConcat.split(/\s+/).filter(Boolean).length,
      fallbackUsed: 'youtube-transcript',
    };
  } catch {
    return null;
  }
}

/**
 * Phương pháp 2: Fallback — fetch timedtext từ Google endpoint (không cần API key)
 * Không cần phụ thuộc npm, nhưng chỉ làm việc với videos có enable transcript public.
 */
async function fetchViaTimedTextFallback(videoId: string, langs = ['en', 'vi', 'en-US', 'vi-VN']): Promise<YoutubeTranscriptResult | null> {
  let targetLang: string | null = null;
  for (const l of langs) {
    const probeUrl = `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(l)}&fmt=json3`;
    try {
      const resp = await fetch(probeUrl);
      if (resp.status === 200) {
        targetLang = l;
        const data = await resp.json();
        const events = data.events || [];
        const lines: TranscriptLine[] = [];
        for (const ev of events) {
          if (!ev.segs || !Array.isArray(ev.segs)) continue;
          const start = Math.round(Number(ev.tStartMs) / 1000);
          const dur = Math.round(Number(ev.dDurationMs) / 1000);
          const text = ev.segs
            .map((s: any) => s.utf8 || '')
            .join(' ')
            .replace(/\n+/g, ' ')
            .trim();
          if (!text) continue;
          lines.push({
            startSec: start,
            durationSec: dur,
            endSec: start + dur,
            text,
          });
        }
        if (lines.length === 0) continue;
        const textConcat = lines.map((l) => l.text).join(' ');
        return {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          language: targetLang,
          lines,
          totalDurationSec: Math.max(...lines.map((l) => l.endSec || l.startSec)),
          totalChars: textConcat.length,
          totalWords: textConcat.split(/\s+/).filter(Boolean).length,
          fallbackUsed: 'timedtext-fallback',
        };
      }
    } catch {
      // continue với lang tiếp theo
    }
  }
  return null;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function fetchYoutubeTranscript(videoIdOrUrl: string): Promise<YoutubeTranscriptResult> {
  const id = extractYoutubeVideoId(videoIdOrUrl);
  if (!id) throw new Error('Không thể xác định Video ID từ URL/chuỗi nhập vào.');

  // Thử package trước
  let r = await fetchViaPackage(id, 'vi') || await fetchViaPackage(id, 'en') || await fetchViaPackage(id);
  if (r) return r;
  // Fallback timedtext
  r = await fetchViaTimedTextFallback(id, ['vi', 'en', 'en-US', 'vi-VN']);
  if (r) return r;

  throw new Error(
    `Không lấy được transcript cho video ${id}. Có thể video không có subtitles bật, hoặc private.` +
    ` Cần cài thêm: npm i youtube-transcript để tối ưu.`
  );
}

// Compatibility exports for the automation routes. Keep the original camel-case
// API above intact because it is already consumed by existing Glacia panels.
export const fetchYouTubeTranscript = fetchYoutubeTranscript;

export function isYouTubeUrl(input: string): boolean {
  return Boolean(extractYoutubeVideoId(input));
}

export function formatTranscriptForAi(t: YoutubeTranscriptResult, maxChars = 90000): { text: string; trimmed: boolean } {
  let out = '';
  let trimmed = false;
  for (const l of t.lines) {
    const line = `[${secondsToTimestamp(l.startSec)}] ${l.text}\n`;
    if (out.length + line.length > maxChars) { trimmed = true; break; }
    out += line;
  }
  return { text: out, trimmed };
}

// ─── Summarization ──────────────────────────────────────────────────────────

export async function summarizeYoutubeVideoWithGemini(videoIdOrUrl: string, customQuestion?: string): Promise<YoutubeSummary> {
  const transcript = await fetchYoutubeTranscript(videoIdOrUrl);
  const { text: transcriptFormatted, trimmed } = formatTranscriptForAi(transcript);
  const url = `https://www.youtube.com/watch?v=${transcript.videoId}`;

  const instruction = customQuestion
    ? `Câu hỏi tùy chỉnh của Founder: "${customQuestion}" — hãy nhấn mạnh phần trả lời câu hỏi này trong SUMMARY và KEY POINTS.`
    : `Hãy tập trung vào: tóm tắt toàn bộ nội dung, highlight các điểm quan trọng / thú vị, trích dẫn số liệu chính (nếu có), đề xuất các action item người xem nên làm sau khi xem.`;

  const prompt = `Bạn là Glacia, chuyên gia phân tích video YouTube nội dung chuyên sâu.
Đây là transcript của video: ${url}
(Video ID: ${transcript.videoId}, ngôn ngữ: ${transcript.language}, ${trimmed ? '⚠️ transcript bị cắt ngắn do quá dài' : 'đầy đủ'})

${instruction}

# TRANSCRIPT:
${transcriptFormatted}

# ĐỊNH DẠNG OUTPUT (bắt buộc cấu trúc này để parse):

\`\`\`json
{
  "oneLiner": "1 câu (25 từ) mô tả video ngắn gọn nhất",
  "tenKeyPoints": ["điểm 1", "điểm 2", ..., "điểm 10"],
  "detailedSummary": "3-5 đoạn chi tiết về nội dung, kết cấu, phân tích sâu",
  "actionItems": ["Action 1", "Action 2"],
  "peopleMentioned": ["Người 1"],
  "toolsMentioned": ["Công cụ 1"]
}
\`\`\`

Trả về CHỈ JSON (không có giải thích trước/sau). Tiếng Việt toàn bộ.`;

  const res = await aiCall(prompt, {
    maxTokens: 2500,
    temperature: 0.25,
  });
  const raw = (res.text || '').trim();
  // Parse JSON (nếu Gemini bọc trong code fence)
  let parsed: any = {};
  try {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = match ? match[1].trim() : raw;
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    parsed = {
      oneLiner: raw.slice(0, 300),
      tenKeyPoints: [],
      detailedSummary: raw,
      actionItems: [],
      peopleMentioned: [],
      toolsMentioned: [],
    };
  }
  return {
    meta: {
      videoId: transcript.videoId,
      url,
      transcriptLanguage: transcript.language,
      durationSec: transcript.totalDurationSec,
    },
    oneLiner: parsed.oneLiner || 'N/A',
    tenKeyPoints: Array.isArray(parsed.tenKeyPoints) ? parsed.tenKeyPoints.slice(0, 15) : [],
    detailedSummary: parsed.detailedSummary || raw,
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    peopleMentioned: Array.isArray(parsed.peopleMentioned) ? parsed.peopleMentioned : [],
    toolsMentioned: Array.isArray(parsed.toolsMentioned) ? parsed.toolsMentioned : [],
    qAReady: true,
    fullTranscriptChars: transcript.totalChars,
  };
}

export async function analyzeYouTubeVideoWithGemini(
  videoIdOrUrl: string,
  question?: string,
  customInstructions?: string,
): Promise<YoutubeSummary> {
  const focus = [question, customInstructions].filter(Boolean).join('\n\n');
  return summarizeYoutubeVideoWithGemini(videoIdOrUrl, focus || undefined);
}

// ─── Q&A (Chat with Video) ──────────────────────────────────────────────────

export async function chatWithYoutubeVideo(videoIdOrUrl: string, userQuestion: string, sessionId?: string): Promise<{ sessionId: string; answer: string; citedTimestamps: number[]; relatedTurnId?: string }> {
  const transcript = await fetchYoutubeTranscript(videoIdOrUrl);
  ensureDirs();
  const finalSessionId = sessionId || `ychat_${Date.now().toString(36)}_${randomUUID().slice(0, 6)}`;

  const { text: transcriptFormatted } = formatTranscriptForAi(transcript, 70000);

  const prompt = `Bạn là Glacia, trợ lý có thể xem trực tiếp video YouTube và trả lời câu hỏi Founder.
Video: https://www.youtube.com/watch?v=${transcript.videoId}
Transcript đầy đủ (timestamp kèm text):
${transcriptFormatted}

---
CÂU HỎI CỦA FOUNDER:
${userQuestion}

---
YÊU CẦU TRẢ LỜI:
1. Đọc kỹ toàn bộ transcript, chỉ trả lời dựa trên thông tin CÓ trong video.
2. Nếu không có thông tin → nói thẳng "Trong video này không đề cập đến vấn đề này."
3. Khi trích dẫn, đặt **[⏱ MM:SS]** bằng đúng thời gian trong transcript.
4. Trả lời bằng tiếng Việt, ngắn gọn, đúng trọng tâm.
5. Nếu có nhiều thời điểm nói về vấn đề → trích dẫn tất cả.
`;

  const res = await aiCall(prompt, {
    maxTokens: 1500,
    temperature: 0.1,
  });
  const answer = res.text || '';
  // Extract timestamps from answer MM:SS or H:MM:SS
  const timestamps: number[] = [];
  const regex = /(\d+):(\d{2})(?::(\d{2}))?/g;
  let m;
  while ((m = regex.exec(answer)) !== null) {
    const [, a, b, c] = m;
    let sec = 0;
    if (c) sec = parseInt(a) * 3600 + parseInt(b) * 60 + parseInt(c);
    else sec = parseInt(a) * 60 + parseInt(b);
    if (!timestamps.includes(sec)) timestamps.push(sec);
  }

  // Lưu turn
  const sessionPath = path.join(CHAT_SESSION_DIR, `${finalSessionId}.json`);
  let session: YoutubeChatSession | null = null;
  if (fs.existsSync(sessionPath)) {
    try { session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8')); }
    catch { session = null; }
  }
  if (!session) {
    session = {
      id: finalSessionId,
      videoId: transcript.videoId,
      transcript,
      turns: [],
      createdAt: new Date().toISOString(),
    };
  }
  const turnId = `turn_${session.turns.length + 1}`;
  session.turns.push({
    turnId,
    user: userQuestion,
    ai: answer,
    citedTimestamps: timestamps,
    createdAt: new Date().toISOString(),
  });
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf-8');

  return { sessionId: finalSessionId, answer, citedTimestamps: timestamps, relatedTurnId: turnId };
}

// ─── Dashboard helper ───────────────────────────────────────────────────────

export function listRecentYoutubeChatSessions(limit = 20): Array<Pick<YoutubeChatSession, 'id' | 'videoId' | 'createdAt'> & { turnsCount: number; lastTurn?: string }> {
  ensureDirs();
  try {
    const files = fs.readdirSync(CHAT_SESSION_DIR).filter((f) => f.startsWith('ychat_') && f.endsWith('.json')).sort().reverse().slice(0, limit);
    const out: Array<Pick<YoutubeChatSession, 'id' | 'videoId' | 'createdAt'> & { turnsCount: number; lastTurn?: string }> = [];
    for (const f of files) {
      try {
        const s = JSON.parse(fs.readFileSync(path.join(CHAT_SESSION_DIR, f), 'utf-8'));
        const last = s.turns?.[s.turns.length - 1];
        out.push({
          id: s.id,
          videoId: s.videoId,
          createdAt: s.createdAt,
          turnsCount: s.turns?.length || 0,
          lastTurn: last?.user?.slice(0, 80),
        });
      } catch { /* ignore */ }
    }
    return out;
  } catch { return []; }
}
