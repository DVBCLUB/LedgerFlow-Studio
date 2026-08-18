/**
 * viralLeadGrowthEngine.ts
 * ============================================================
 * VIRAL AUTO-PUBLISHER & INBOUND LEAD CRM INGESTION ROBOT
 *
 * 1. Lên lịch và phân phối video/bài viết đa kênh (TikTok, YouTube Shorts, FB Reels, LinkedIn).
 * 2. Bắt Webhook Lead từ Form đăng ký dùng thử / landing page.
 * 3. Chấm điểm tiềm năng Lead bằng AI (0-100 score).
 * 4. Tự động nạp vào SQLite Database để đồng bộ tức thì với phân hệ Sales & CRM.
 */

import { upsertBusinessEntity, searchBusinessEntities } from './businessDataService.ts';

export interface ViralPublishScheduleItem {
  id: string;
  title: string;
  channels: Array<'tiktok' | 'youtube_shorts' | 'facebook_reels' | 'linkedin'>;
  videoAssetUrl?: string;
  caption: string;
  tags: string[];
  scheduledTime: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  viewsEstimated: number;
}

export interface InboundLeadPayload {
  leadId?: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  interestedProduct: 'software_os' | 'game_studio' | 'ai_video' | 'accounting_template';
  monthlyBudgetVnd?: number;
  sourceChannel: 'tiktok' | 'youtube_shorts' | 'facebook' | 'google_search' | 'referral';
  messageNote?: string;
}

export interface ProcessedLeadResult {
  leadId: string;
  score: number;
  qualification: 'HOT_LEAD' | 'WARM_LEAD' | 'COLD_LEAD';
  autoActionTaken: string;
  savedToCrm: boolean;
  receivedAt: string;
}

const PUBLISH_SCHEDULE: ViralPublishScheduleItem[] = [
  {
    id: 'pub_101',
    title: 'Demo 30s: Tự Động Gạch Nợ VietQR VAS 200 Cho Kế Toán',
    channels: ['tiktok', 'youtube_shorts', 'facebook_reels'],
    caption: 'Tiết kiệm 3 tiếng mỗi ngày với Robot kế toán AI của LedgerFlow Studio! Link dùng thử ở bio 🚀 #ledgerflow #ketoan #ai',
    tags: ['ai', 'ketoan', 'vietqr', 'software'],
    scheduledTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    status: 'scheduled',
    viewsEstimated: 25000,
  },
  {
    id: 'pub_102',
    title: 'Cách Solo Founder Xây Game Mobile Bằng AI Trong 1 Ngày',
    channels: ['tiktok', 'youtube_shorts', 'linkedin'],
    caption: 'Tạo tài sản 2D, âm thanh WebAudio và phím ảo cảm ứng chỉ với 1 click 🎮 #gamedev #indiedev #ai',
    tags: ['gamedev', 'solofounder', 'tech'],
    scheduledTime: new Date(Date.now() + 7200 * 1000).toISOString(),
    status: 'scheduled',
    viewsEstimated: 18000,
  },
];

export function listPublishSchedules(): ViralPublishScheduleItem[] {
  return PUBLISH_SCHEDULE;
}

export function createPublishSchedule(input: Omit<ViralPublishScheduleItem, 'id' | 'status' | 'viewsEstimated'>): ViralPublishScheduleItem {
  const item: ViralPublishScheduleItem = {
    id: `pub_${Date.now()}`,
    ...input,
    status: 'scheduled',
    viewsEstimated: 15000,
  };
  PUBLISH_SCHEDULE.unshift(item);
  return item;
}

/**
 * Xử lý & Chấm điểm Lead tự động từ Webhook
 */
export function ingestInboundLead(payload: InboundLeadPayload): ProcessedLeadResult {
  const leadId = payload.leadId || `lead_${Date.now()}`;
  const budget = payload.monthlyBudgetVnd || 0;

  // Thuật toán AI Lead Scoring:
  let score = 50; // Base score
  if (payload.phone && payload.phone.length >= 9) score += 20;
  if (payload.companyName && payload.companyName.trim().length > 3) score += 15;
  if (budget >= 5000000) score += 15;
  if (payload.interestedProduct === 'software_os') score += 10;

  const scoreClamped = Math.min(100, Math.max(10, score));
  let qualification: ProcessedLeadResult['qualification'] = 'COLD_LEAD';
  let autoActionTaken = 'Gửi email tài liệu giới thiệu tự động';

  if (scoreClamped >= 80) {
    qualification = 'HOT_LEAD';
    autoActionTaken = 'Kích hoạt thông báo ưu tiên CEO & Đặt lịch hẹn Demo 1-1';
  } else if (scoreClamped >= 60) {
    qualification = 'WARM_LEAD';
    autoActionTaken = 'Kích hoạt chuỗi email nuôi dưỡng tự động (Drip Campaign)';
  }

  // Tự động lưu vào SQLite Customer Database
  const now = new Date().toISOString();
  const entityData = {
    id: leadId,
    type: 'customer' as const,
    data: {
      name: payload.fullName,
      code: `LEAD-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: qualification === 'HOT_LEAD' ? 'active' : 'draft',
      email: payload.email,
      phone: payload.phone,
      company: payload.companyName,
      product: payload.interestedProduct,
      score: scoreClamped,
      qualification,
      source: payload.sourceChannel,
      budget,
      note: payload.messageNote,
    },
    source: 'ai' as const,
    createdAt: now,
    updatedAt: now,
  };

  upsertBusinessEntity(entityData);

  return {
    leadId,
    score: scoreClamped,
    qualification,
    autoActionTaken,
    savedToCrm: true,
    receivedAt: new Date().toISOString(),
  };
}
