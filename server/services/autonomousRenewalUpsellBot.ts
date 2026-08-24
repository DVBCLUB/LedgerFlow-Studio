/**
 * server/services/autonomousRenewalUpsellBot.ts
 * ============================================================
 * Autonomous B2B Subscription Renewal & Upsell Bot.
 * 
 * Automatically monitors customer contracts, computes churn risk,
 * identifies upsell opportunities, and generates personalized outreach
 * with dynamic VietQR payment links.
 */

import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface CustomerSubscription {
  customerId: string;
  customerName: string;
  contactEmail: string;
  currentPlan: 'starter' | 'pro' | 'enterprise';
  currentMonthlyFeeVnd: number;
  contractExpiryDate: string; // ISO date string "YYYY-MM-DD"
  usageVolumePercentage: number; // e.g. 95% indicates high upsell potential
}

export interface RenewalActionRecommendation {
  customerId: string;
  customerName: string;
  actionType: 'renewal_reminder' | 'upsell_upgrade' | 'churn_prevention';
  recommendedPlan: 'pro' | 'enterprise';
  quotedPriceVnd: number;
  vietQrUrl: string;
  emailSubject: string;
  emailBodyMarkdown: string;
  urgency: 'low' | 'medium' | 'high';
}

/**
 * Evaluates subscriptions and returns actionable renewal and upsell campaigns.
 */
export function scanSubscriptionsForRenewalsAndUpsells(
  subscriptions: CustomerSubscription[],
  referenceDate: string = new Date().toISOString().split('T')[0]
): RenewalActionRecommendation[] {
  const recommendations: RenewalActionRecommendation[] = [];
  const refTime = new Date(referenceDate).getTime();

  for (const sub of subscriptions) {
    const expiryTime = new Date(sub.contractExpiryDate).getTime();
    const daysUntilExpiry = Math.round((expiryTime - refTime) / (1000 * 60 * 60 * 24));

    // Upsell case: high usage (>80%) regardless of expiry
    if (sub.usageVolumePercentage >= 85 && sub.currentPlan !== 'enterprise') {
      const nextPlan = sub.currentPlan === 'starter' ? 'pro' : 'enterprise';
      const upgradedFee = sub.currentMonthlyFeeVnd * 1.8;
      const qrCode = `https://img.vietqr.io/image/MB-0988888888-compact.png?amount=${upgradedFee}&addInfo=UPGRADE_${sub.customerId}`;

      recommendations.push({
        customerId: sub.customerId,
        customerName: sub.customerName,
        actionType: 'upsell_upgrade',
        recommendedPlan: nextPlan,
        quotedPriceVnd: upgradedFee,
        vietQrUrl: qrCode,
        emailSubject: `🚀 Nâng cấp gói ${nextPlan.toUpperCase()} cho ${sub.customerName} - Tăng tốc không giới hạn`,
        emailBodyMarkdown: `Chào **${sub.customerName}**,\n\nHệ thống ghi nhận bạn đã sử dụng **${sub.usageVolumePercentage}%** công suất gói ${sub.currentPlan}. Để tránh gián đoạn dịch vụ và mở khóa thêm 10 AI Staff chuyên trách, chúng tôi đề xuất gói **${nextPlan.toUpperCase()}** với ưu đãi đặc biệt.\n\n👉 Thanh toán quét mã VietQR tự động kích hoạt: [VietQR Link](${qrCode})`,
        urgency: 'medium',
      });
      continue;
    }

    // Renewal reminder case: expiring within 30 days
    if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
      const renewalFee = sub.currentMonthlyFeeVnd * 12 * 0.9; // 10% discount for annual renewal
      const qrCode = `https://img.vietqr.io/image/MB-0988888888-compact.png?amount=${renewalFee}&addInfo=RENEW_${sub.customerId}`;

      recommendations.push({
        customerId: sub.customerId,
        customerName: sub.customerName,
        actionType: 'renewal_reminder',
        recommendedPlan: sub.currentPlan === 'starter' ? 'pro' : sub.currentPlan,
        quotedPriceVnd: renewalFee,
        vietQrUrl: qrCode,
        emailSubject: `⏳ Gia hạn hợp đồng phần mềm LedgerFlow Studio (${daysUntilExpiry} ngày còn lại)`,
        emailBodyMarkdown: `Kính gửi **${sub.customerName}**,\n\nHợp đồng của bạn sẽ hết hạn vào ngày **${sub.contractExpiryDate}** (còn **${daysUntilExpiry} ngày**). Chúng tôi dành tặng bạn mức chiết khấu 10% khi gia hạn 1 năm ngay hôm nay.\n\n👉 Quét mã VietQR để nhận hóa đơn VAT và duy trì dịch vụ: [VietQR Link](${qrCode})`,
        urgency: daysUntilExpiry <= 7 ? 'high' : 'medium',
      });
    }
  }

  // Publish event if urgent renewals found
  if (recommendations.some((r) => r.urgency === 'high')) {
    publishSystemEvent('sales.lead_converted', {
      type: 'renewal_urgent_alert',
      count: recommendations.filter((r) => r.urgency === 'high').length,
    });
  }

  return recommendations;
}
