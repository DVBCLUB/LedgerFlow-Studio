import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanSubscriptionsForRenewalsAndUpsells, type CustomerSubscription } from './autonomousRenewalUpsellBot.ts';

describe('autonomousRenewalUpsellBot - Subscription Renewal & Upsell Automation', () => {
  it('detects high-usage accounts and recommends upsell upgrades with VietQR', () => {
    const subscriptions: CustomerSubscription[] = [
      {
        customerId: 'CUST_VIP_101',
        customerName: 'Công ty Cổ phần Alpha Tech',
        contactEmail: 'ceo@alphatech.vn',
        currentPlan: 'starter',
        currentMonthlyFeeVnd: 5000000,
        contractExpiryDate: '2026-12-31',
        usageVolumePercentage: 92, // >85% triggers upsell
      },
    ];

    const results = scanSubscriptionsForRenewalsAndUpsells(subscriptions, '2026-08-22');
    assert.equal(results.length, 1);
    assert.equal(results[0].actionType, 'upsell_upgrade');
    assert.equal(results[0].recommendedPlan, 'pro');
    assert.equal(results[0].quotedPriceVnd, 9000000);
    assert.ok(results[0].vietQrUrl.includes('UPGRADE_CUST_VIP_101'));
  });

  it('detects expiring contracts within 30 days and produces renewal emails with discount', () => {
    const subscriptions: CustomerSubscription[] = [
      {
        customerId: 'CUST_EXP_202',
        customerName: 'Tập đoàn Đầu tư Delta',
        contactEmail: 'finance@delta.com.vn',
        currentPlan: 'pro',
        currentMonthlyFeeVnd: 10000000,
        contractExpiryDate: '2026-08-27', // 5 days from 2026-08-22 -> urgent high
        usageVolumePercentage: 60,
      },
    ];

    const results = scanSubscriptionsForRenewalsAndUpsells(subscriptions, '2026-08-22');
    assert.equal(results.length, 1);
    assert.equal(results[0].actionType, 'renewal_reminder');
    assert.equal(results[0].urgency, 'high');
    assert.ok(results[0].emailSubject.includes('5 ngày còn lại'));
    assert.ok(results[0].vietQrUrl.includes('RENEW_CUST_EXP_202'));
  });
});
