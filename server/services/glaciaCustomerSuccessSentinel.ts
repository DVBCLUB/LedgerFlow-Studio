/**
 * server/services/glaciaCustomerSuccessSentinel.ts
 * Vệ Binh Thành Công Khách Hàng & Ngăn Chặn Rời Bỏ Tự Trị (Customer Success & Anti-Churn Sentinel) của Glacia (Epoch 12).
 * Phân tích hành vi tương tác, phát hiện nguy cơ rời bỏ (Churn Risk) và kích hoạt hành động can thiệp cá nhân hóa tự động.
 */

import fs from 'fs';
import path from 'path';

export interface CustomerHealthProfile {
  profileId: string;
  customerId: string;
  accountName: string;
  monthlySpendVnd: number;
  daysInactive: number;
  sentimentScore: number; // 0.0 to 1.0
  churnRiskPercent: number; // 0 - 100%
  healthCategory: 'healthy_advocate' | 'moderate_attention' | 'critical_churn_risk';
  automatedInterventionPlan: {
    interventionType: 'video_walkthrough' | 'concierge_call' | 'loyalty_discount' | 'ceo_personal_note';
    messagePayload: string;
    vietqrRetentionIncentiveVnd: number;
  };
  assessedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const SENTINEL_FILE = path.join(RUNTIME_DIR, 'glacia_customer_success_sentinel.json');

export function evaluateCustomerHealthAndIntervene(
  customerId: string = 'cust-1024',
  accountName: string = 'Công Ty Xây Dựng An Phát',
  monthlySpendVnd: number = 3500000,
  daysInactive: number = 14,
  sentimentScore: number = 0.45
): CustomerHealthProfile {
  let churnRisk = Math.min(100, Math.round((daysInactive * 4.5) + ((1.0 - sentimentScore) * 40)));
  if (daysInactive === 0) churnRisk = 5;

  let category: CustomerHealthProfile['healthCategory'] = 'healthy_advocate';
  if (churnRisk > 60) category = 'critical_churn_risk';
  else if (churnRisk > 30) category = 'moderate_attention';

  const profile: CustomerHealthProfile = {
    profileId: `cs-${Date.now()}`,
    customerId,
    accountName,
    monthlySpendVnd,
    daysInactive,
    sentimentScore,
    churnRiskPercent: churnRisk,
    healthCategory: category,
    automatedInterventionPlan: {
      interventionType: category === 'critical_churn_risk' ? 'concierge_call' : 'video_walkthrough',
      messagePayload: `Kính gửi ${accountName}, Robot Glacia nhận thấy công ty chưa kích hoạt tính năng đối soát thuế VAS tự động trên Windows Desktop. Chúng tôi xin gửi video hướng dẫn 2 phút kèm hỗ trợ chuyên viên kế toán 1-1 miễn phí!`,
      vietqrRetentionIncentiveVnd: category === 'critical_churn_risk' ? 500000 : 0,
    },
    assessedAt: new Date().toISOString(),
  };

  saveProfile(profile);
  return profile;
}

function saveProfile(profile: CustomerHealthProfile): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const list = listCustomerHealthSentinels();
    list.unshift(profile);
    if (list.length > 20) list.pop();
    fs.writeFileSync(SENTINEL_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export function listCustomerHealthSentinels(): CustomerHealthProfile[] {
  try {
    if (fs.existsSync(SENTINEL_FILE)) {
      const data = JSON.parse(fs.readFileSync(SENTINEL_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = evaluateCustomerHealthAndIntervene();
  return [initial];
}
