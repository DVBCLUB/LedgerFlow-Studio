import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runSoloFounderNightlySweeperRobot,
  runViralContentCrossPublisherRobot,
  runRevenueLeakReconciliationRobot,
} from './autonomousCompanyRobots.ts';
import { upsertBusinessEntity, getBusinessEntity } from './businessDataService.ts';

test('autonomousCompanyRobots - runSoloFounderNightlySweeperRobot generates structured health report', async () => {
  const report = await runSoloFounderNightlySweeperRobot();

  assert.ok(report.id);
  assert.ok(typeof report.systemHealthScore === 'number');
  assert.ok(report.tokenBudgetSummary);
  assert.ok(Array.isArray(report.keyRecommendations));
  assert.ok(report.markdownBriefing.includes('Báo Cáo Tự Động Ban Đêm'));

  // Kiểm tra lưu vết trong BusinessDataService
  const savedEntity = getBusinessEntity(report.id);
  assert.ok(savedEntity);
  assert.equal(savedEntity?.type, 'knowledge');
});

test('autonomousCompanyRobots - runViralContentCrossPublisherRobot generates multi-channel package', async () => {
  const result = await runViralContentCrossPublisherRobot({
    productTitle: 'LedgerFlow Auto Tax VAS 200',
    description: 'Module tự động quét hóa đơn đầu vào, kiểm tra mã số thuế và phát hiện hóa đơn rủi ro.',
    preferLocal: true,
  });

  assert.ok(result.campaignId);
  assert.ok(result.tiktokScript.hook);
  assert.ok(result.socialPosts.linkedinPost);
  assert.ok(Array.isArray(result.socialPosts.twitterThread));
  assert.ok(Array.isArray(result.seoHashtags));

  // Kiểm tra entity campaign
  const campaign = getBusinessEntity(result.campaignId);
  assert.ok(campaign);
  assert.equal(campaign?.type, 'campaign');
});

test('autonomousCompanyRobots - runRevenueLeakReconciliationRobot identifies overdue invoices', async () => {
  // Tạo 1 hóa đơn quá hạn từ 30 ngày trước
  const pastDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const overdueInv = upsertBusinessEntity({
    id: 'inv_overdue_sample',
    type: 'invoice',
    data: {
      invoiceCode: 'INV-OVERDUE-01',
      customerName: 'Công ty Cổ phần Xây dựng Minh Long',
      amount: 45000000,
      status: 'pending',
    },
  });
  // Gán ngày tạo cũ
  overdueInv.createdAt = pastDate;

  const leakReport = await runRevenueLeakReconciliationRobot();
  assert.ok(leakReport.totalOverdueAmount >= 45000000);
  assert.ok(leakReport.overdueInvoicesCount >= 1);

  const matched = leakReport.overdueInvoices.find((i) => i.invoiceCode === 'INV-OVERDUE-01');
  assert.ok(matched);
  assert.ok(matched?.daysOverdue >= 29);
  assert.ok(matched?.reminderDraft.includes('Công ty Cổ phần Xây dựng Minh Long'));
});
