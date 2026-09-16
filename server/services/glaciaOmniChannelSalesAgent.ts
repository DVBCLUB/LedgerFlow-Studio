/**
 * server/services/glaciaOmniChannelSalesAgent.ts
 * Động cơ CSKH & Chốt Sales Tự Trị Đa Kênh (Zalo, Telegram, Facebook, Web, Email) của Glacia (Epoch 7).
 */

import fs from 'fs';
import path from 'path';

export type OmniChannel = 'zalo_oa' | 'facebook_messenger' | 'telegram' | 'web_livechat' | 'support_email';
export type LeadStatus = 'lead' | 'qualified' | 'proposal_sent' | 'won' | 'lost';

export interface CustomerMessage {
  id: string;
  channel: OmniChannel;
  senderId: string;
  senderName: string;
  text: string;
  receivedAt: string;
}

export interface SalesConversation {
  conversationId: string;
  channel: OmniChannel;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  interestProduct: string; // e.g. "LedgerFlow Enterprise Studio"
  status: LeadStatus;
  estimatedDealValueVnd: number;
  messages: Array<{
    sender: 'customer' | 'glacia_sales_bot';
    text: string;
    timestamp: string;
    vietQrPayload?: {
      qrDataUrl: string;
      accountNumber: string;
      bankCode: string;
      amount: number;
      description: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const SALES_FILE = path.join(RUNTIME_DIR, 'glacia_omnichannel_sales.json');

const DEFAULT_CONVERSATIONS: SalesConversation[] = [
  {
    conversationId: 'conv-zalo-01',
    channel: 'zalo_oa',
    customerId: 'zalo-user-991',
    customerName: 'Anh Tuấn - GĐ Công Ty Xây Dựng Nam Phát',
    customerPhone: '0912345678',
    interestProduct: 'Gói LedgerFlow Xây Dựng & Dự Toán VAS',
    status: 'qualified',
    estimatedDealValueVnd: 18000000,
    messages: [
      {
        sender: 'customer',
        text: 'Bên bạn có giải pháp tự động lập trình Game 3D và dựng Video AI không?',
        timestamp: '2026-08-28T09:15:00.000Z',
      },
      {
        sender: 'glacia_sales_bot',
        text: 'Dạ chào Anh Tuấn! LedgerFlow Studio tích hợp sẵn Creative Studio: Tự động tạo game 3D 60FPS, sinh kịch bản video 4K và điều phối AI nhân sự tự trị 24/7 chỉ trong 1 click ạ.',
        timestamp: '2026-08-28T09:15:05.000Z',
      },
    ],
    createdAt: '2026-08-28T09:15:00.000Z',
    updatedAt: '2026-08-28T09:15:05.000Z',
  },
  {
    conversationId: 'conv-web-02',
    channel: 'web_livechat',
    customerId: 'web-anon-442',
    customerName: 'Chị Mai Lan - Kế toán trưởng',
    customerEmail: 'mailan.acc@sao-viet.vn',
    interestProduct: 'Gói Doanh Nghiệp Toàn Diện $0 Token',
    status: 'won',
    estimatedDealValueVnd: 24000000,
    messages: [
      {
        sender: 'customer',
        text: 'Tôi muốn mua bản quyền trọn đời cho 5 người dùng.',
        timestamp: '2026-08-28T14:00:00.000Z',
      },
      {
        sender: 'glacia_sales_bot',
        text: 'Dạ tuyệt vời ạ! Em gửi Chị Mai Lan mã thanh toán VietQR ưu đãi gói Enterprise 5 Users (24,000,000 VND). Hệ thống sẽ tự động kích hoạt key bản quyền ngay khi tiền vào tài khoản ạ.',
        timestamp: '2026-08-28T14:00:08.000Z',
        vietQrPayload: {
          qrDataUrl: 'https://img.vietqr.io/image/MB-0011004567899-compact2.png?amount=24000000&addInfo=LF+ENTERPRISE+MAILAN',
          accountNumber: '0011004567899',
          bankCode: 'MBBANK',
          amount: 24000000,
          description: 'LF ENTERPRISE MAILAN',
        },
      },
    ],
    createdAt: '2026-08-28T14:00:00.000Z',
    updatedAt: '2026-08-28T14:00:08.000Z',
  },
];

function loadSalesStore(): SalesConversation[] {
  try {
    if (fs.existsSync(SALES_FILE)) {
      const data = JSON.parse(fs.readFileSync(SALES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('[GlaciaOmniSales] Using default conversations');
  }
  saveSalesStore(DEFAULT_CONVERSATIONS);
  return DEFAULT_CONVERSATIONS;
}

function saveSalesStore(conversations: SalesConversation[]): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(SALES_FILE, JSON.stringify(conversations, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaOmniSales] Error saving sales data:', err);
  }
}

export function handleIncomingOmniMessage(msg: CustomerMessage): {
  replyText: string;
  conversation: SalesConversation;
  vietQrPayload?: any;
} {
  const store = loadSalesStore();
  let conv = store.find((c) => c.channel === msg.channel && c.customerId === msg.senderId);

  if (!conv) {
    conv = {
      conversationId: `conv-${msg.channel}-${Date.now()}`,
      channel: msg.channel,
      customerId: msg.senderId,
      customerName: msg.senderName,
      interestProduct: 'LedgerFlow Studio Pro',
      status: 'lead',
      estimatedDealValueVnd: 12000000,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.unshift(conv);
  }

  // Push customer message
  conv.messages.push({
    sender: 'customer',
    text: msg.text,
    timestamp: new Date().toISOString(),
  });

  const textLower = msg.text.toLowerCase();
  let replyText = 'Dạ cảm ơn bạn đã quan tâm đến LedgerFlow Studio! Glacia có thể hỗ trợ bạn tư vấn phân hệ kế toán hay cài đặt dùng thử bản Desktop ạ?';
  let vietQrPayload: any = undefined;

  // Intent 1: Pricing / Buying / VietQR request
  if (textLower.includes('giá') || textLower.includes('bao nhiêu') || textLower.includes('mua') || textLower.includes('thanh toán')) {
    const amount = 12000000;
    const desc = `LF PRO ${msg.senderName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`;
    vietQrPayload = {
      qrDataUrl: `https://img.vietqr.io/image/MB-0011004567899-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(desc)}`,
      accountNumber: '0011004567899',
      bankCode: 'MBBANK',
      amount,
      description: desc,
    };
    replyText = `Dạ gói LedgerFlow Studio Pro có giá ưu đãi ${amount.toLocaleString('vi-VN')} VND/năm (Bao gồm AI Glacia + Sổ cái VAS + $0 Token Local Skills). Em gửi bạn mã VietQR thanh toán tự động kích hoạt ngay ạ!`;
    conv.status = 'proposal_sent';
  } else if (textLower.includes('game') || textLower.includes('video') || textLower.includes('3d') || textLower.includes('phim ai')) {
    replyText = 'Dạ LedgerFlow Studio tích hợp sẵn Game 3D Engine & AI Video Studio 4K: Tự động sinh kịch bản, render 3D Three.js và dựng video MP4 60FPS chỉ với 1-Click ạ!';
    conv.status = 'qualified';
    conv.interestProduct = 'Gói Kế Toán Xây Dựng Chuyên Sâu';
  } else {
    conv.status = 'qualified';
  }

  // Push bot reply
  conv.messages.push({
    sender: 'glacia_sales_bot',
    text: replyText,
    timestamp: new Date().toISOString(),
    vietQrPayload,
  });

  conv.updatedAt = new Date().toISOString();
  saveSalesStore(store);

  return {
    replyText,
    conversation: conv,
    vietQrPayload,
  };
}

export function listSalesConversations(channelFilter?: OmniChannel): SalesConversation[] {
  const store = loadSalesStore();
  if (channelFilter) {
    return store.filter((c) => c.channel === channelFilter);
  }
  return store;
}

export function getOmniChannelSalesMetrics(): {
  totalLeads: number;
  totalWonDeals: number;
  totalPipelineValueVnd: number;
  closedRevenueVnd: number;
  conversionRatePercent: number;
  channelDistribution: Record<OmniChannel, number>;
} {
  const store = loadSalesStore();
  const won = store.filter((c) => c.status === 'won');
  const totalPipeline = store.reduce((sum, c) => sum + (c.estimatedDealValueVnd || 0), 0);
  const closedRev = won.reduce((sum, c) => sum + (c.estimatedDealValueVnd || 0), 0);

  const dist: Record<OmniChannel, number> = {
    zalo_oa: 0,
    facebook_messenger: 0,
    telegram: 0,
    web_livechat: 0,
    support_email: 0,
  };

  for (const c of store) {
    dist[c.channel] = (dist[c.channel] || 0) + 1;
  }

  return {
    totalLeads: store.length,
    totalWonDeals: won.length,
    totalPipelineValueVnd: totalPipeline,
    closedRevenueVnd: closedRev,
    conversionRatePercent: store.length > 0 ? Math.round((won.length / store.length) * 100) : 0,
    channelDistribution: dist,
  };
}
