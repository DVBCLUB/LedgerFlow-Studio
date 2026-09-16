/**
 * server/services/glaciaB2BLeadHarvester.ts
 * Cỗ Máy Săn Khách Hàng Doanh Nghiệp B2B & Chiến Dịch Outreach Cá Nhân Hóa của Glacia (Epoch 7).
 */

import fs from 'fs';
import path from 'path';

export interface B2BCompanyLead {
  id: string;
  companyName: string;
  taxId: string;
  representative: string;
  email: string;
  phone: string;
  industry: 'construction' | 'manufacturing' | 'services' | 'trading_retail' | 'tech_startup';
  city: string;
  estimatedEmployees: number;
  stage: 'scraped' | 'email_sent_step1' | 'opened' | 'replied' | 'converted';
  notes?: string;
  scrapedAt: string;
  lastContactedAt?: string;
}

export interface OutreachSequence {
  step: number;
  subject: string;
  bodyTemplate: string;
  sendDelayDays: number;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const LEADS_FILE = path.join(RUNTIME_DIR, 'glacia_b2b_leads.json');

const DEFAULT_LEADS: B2BCompanyLead[] = [
  {
    id: 'lead-b2b-01',
    companyName: 'CÔNG TY CP TỔ HỢP XÂY DỰNG SÔNG HỒNG',
    taxId: '0101239988',
    representative: 'Nguyễn Văn Hùng',
    email: 'hung.nv@songhongcon.vn',
    phone: '0988123456',
    industry: 'construction',
    city: 'Hà Nội',
    estimatedEmployees: 65,
    stage: 'scraped',
    scrapedAt: new Date().toISOString(),
  },
  {
    id: 'lead-b2b-02',
    companyName: 'CÔNG TY TNHH CÔNG NGHỆ & TRUYỀN THÔNG V-MEDIA',
    taxId: '0314567890',
    representative: 'Trần Thị Thu Hà',
    email: 'ha.tran@vmedia.com.vn',
    phone: '0903456789',
    industry: 'services',
    city: 'TP. Hồ Chí Minh',
    estimatedEmployees: 25,
    stage: 'email_sent_step1',
    scrapedAt: new Date().toISOString(),
    lastContactedAt: new Date().toISOString(),
  },
  {
    id: 'lead-b2b-03',
    companyName: 'CÔNG TY CP CƠ KHÍ & THƯƠNG MẠI TIẾN PHÁT',
    taxId: '3700987654',
    representative: 'Lê Minh Tiến',
    email: 'tien.lm@tienphatcorp.vn',
    phone: '0918765432',
    industry: 'manufacturing',
    city: 'Bình Dương',
    estimatedEmployees: 120,
    stage: 'replied',
    scrapedAt: new Date().toISOString(),
    lastContactedAt: new Date().toISOString(),
  },
];

const OUTREACH_TEMPLATES: Record<string, OutreachSequence[]> = {
  construction: [
    {
      step: 1,
      subject: 'Giải pháp tự động hóa Studio Game 3D & Sản xuất Phim AI 4K cho {{company_name}}',
      bodyTemplate:
        'Kính gửi Anh/Chị {{representative}},\n\nEm là Glacia từ LedgerFlow Studio. Nhận thấy {{company_name}} đang triển khai nhiều dự án xây dựng tại {{city}}, em xin phép giới thiệu giải pháp Kế toán VAS chuyên sâu giúp tự động hóa bóc tách dự toán vật tư, nhân công và đối soát công nợ thầu phụ trong 5 phút.\n\nAnh/Chị có thể trải nghiệm miễn phí 14 ngày tại: https://ledgerflow.vn\n\nTrân trọng,\nGlacia AI - Trợ lý Doanh nghiệp.',
      sendDelayDays: 0,
    },
    {
      step: 2,
      subject: 'Re: Tối ưu 30% thời gian quyết toán thuế GTGT & HĐĐT cho {{company_name}}',
      bodyTemplate:
        'Chào Anh/Chị {{representative}},\n\nEm gửi thêm bảng so sánh tính năng LedgerFlow vs MISA/BRAVO để {{company_name}} tiện tham khảo. LedgerFlow chạy hoàn toàn trên Windows Desktop với chi phí $0 Token và xuất hóa đơn Nghị định 123 tự động.\n\nNếu cần demo trực tiếp 15 phút, Anh/Chị chỉ cần reply email này ạ.',
      sendDelayDays: 3,
    },
  ],
  services: [
    {
      step: 1,
      subject: 'Tự động hóa sổ sách kế toán & CRM khép kín cho {{company_name}}',
      bodyTemplate:
        'Kính gửi Anh/Chị {{representative}},\n\nLedgerFlow Studio mang đến hệ điều hành công ty tinh gọn: Kế toán VAS + AI Sales Agent + CSKH Zalo/Telegram tự động. Giải phóng 80% thời gian kế toán cho {{company_name}}.\n\nTrân trọng,\nGlacia AI.',
      sendDelayDays: 0,
    },
  ],
};

function loadLeadsStore(): B2BCompanyLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('[GlaciaB2BLeads] Using default leads');
  }
  saveLeadsStore(DEFAULT_LEADS);
  return DEFAULT_LEADS;
}

function saveLeadsStore(leads: B2BCompanyLead[]): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaB2BLeads] Error saving leads:', err);
  }
}

export function harvestB2BLeads(payload: {
  industry: B2BCompanyLead['industry'];
  targetCity: string;
  limit?: number;
}): { newLeadsCount: number; harvestedLeads: B2BCompanyLead[] } {
  const store = loadLeadsStore();
  const limit = payload.limit || 3;

  const mockHarvested: B2BCompanyLead[] = [];
  for (let i = 1; i <= limit; i++) {
    const id = `lead-auto-${Date.now()}-${i}`;
    const newLead: B2BCompanyLead = {
      id,
      companyName: `CÔNG TY TNHH ${payload.industry.toUpperCase()} ${payload.targetCity.toUpperCase()} SỐ ${i}`,
      taxId: `0${Math.floor(100000000 + Math.random() * 900000000)}`,
      representative: `Giám Đốc ${i}`,
      email: `contact@lead-${payload.industry}-${i}.vn`,
      phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      industry: payload.industry,
      city: payload.targetCity,
      estimatedEmployees: 10 + i * 15,
      stage: 'scraped',
      scrapedAt: new Date().toISOString(),
    };
    mockHarvested.push(newLead);
    store.unshift(newLead);
  }

  saveLeadsStore(store);
  return {
    newLeadsCount: mockHarvested.length,
    harvestedLeads: mockHarvested,
  };
}

export function listB2BLeads(): B2BCompanyLead[] {
  return loadLeadsStore();
}

export function renderPersonalizedOutreachEmail(leadId: string, step: number = 1): {
  subject: string;
  body: string;
  targetEmail: string;
} {
  const store = loadLeadsStore();
  const lead = store.find((l) => l.id === leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);

  const templates = OUTREACH_TEMPLATES[lead.industry] || OUTREACH_TEMPLATES.services;
  const tpl = templates.find((t) => t.step === step) || templates[0];

  const renderText = (str: string) =>
    str
      .replace(/\{\{company_name\}\}/g, lead.companyName)
      .replace(/\{\{representative\}\}/g, lead.representative)
      .replace(/\{\{city\}\}/g, lead.city);

  lead.stage = step === 1 ? 'email_sent_step1' : lead.stage;
  lead.lastContactedAt = new Date().toISOString();
  saveLeadsStore(store);

  return {
    subject: renderText(tpl.subject),
    body: renderText(tpl.bodyTemplate),
    targetEmail: lead.email,
  };
}
