import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scanTransactionForAnomalies,
  batchScanLedgerTransactions,
  markAnomalyFeedback,
  getFinancialRadarStats,
  type FinancialTransaction,
} from './glaciaFinancialAnomalyDetector.ts';

describe('Glacia Financial Anomaly Detector (Frontier 5)', () => {
  it('detects statistical spike when transaction exceeds baseline standard deviation threshold', () => {
    const spikeTx: FinancialTransaction = {
      id: 'tx-test-spike-01',
      voucherNumber: 'PC-2026-08-001',
      category: 'office_supplies',
      amount: 45000000, // Mean is 3.5m, threshold is ~6.14m
      currency: 'VND',
      timestamp: '2026-08-25T10:00:00.000Z', // Tuesday working hours
      description: 'Mua đồ dùng văn phòng phẩm đợt 3',
    };

    const alerts = scanTransactionForAnomalies(spikeTx);
    assert.ok(alerts.length >= 1);
    const spikeAlert = alerts.find((a) => a.type === 'STATISTICAL_SPIKE');
    assert.ok(spikeAlert);
    assert.equal(spikeAlert.severity, 'critical');
    assert.equal(spikeAlert.confidenceScore, 0.94);
  });

  it('detects duplicate payments executed to the same account within 24h window', () => {
    const originalTx: FinancialTransaction = {
      id: 'tx-orig-dup-01',
      category: 'marketing_ads',
      amount: 15000000,
      currency: 'VND',
      recipientAccount: '0011004567899',
      recipientName: 'CONG TY QUANG CAO META VN',
      timestamp: '2026-08-26T09:00:00.000Z',
      description: 'Chạy ads Facebook tháng 8',
    };

    scanTransactionForAnomalies(originalTx);

    const duplicateTx: FinancialTransaction = {
      id: 'tx-dup-copy-02',
      category: 'marketing_ads',
      amount: 15000000,
      currency: 'VND',
      recipientAccount: '0011004567899',
      recipientName: 'CONG TY QUANG CAO META VN',
      timestamp: '2026-08-26T14:30:00.000Z', // 5.5 hours later
      description: 'Chạy ads Facebook tháng 8 (gửi lại)',
    };

    const alerts = scanTransactionForAnomalies(duplicateTx);
    const dupAlert = alerts.find((a) => a.type === 'DUPLICATE_PAYMENT');
    assert.ok(dupAlert);
    assert.equal(dupAlert.severity, 'critical');
    assert.equal(dupAlert.metadata.matchedPastTxId, 'tx-orig-dup-01');
  });

  it('detects disbursements performed on weekends or night hours', () => {
    const sundayTx: FinancialTransaction = {
      id: 'tx-sunday-night-03',
      category: 'office_supplies',
      amount: 2000000,
      currency: 'VND',
      timestamp: '2026-08-30T02:15:00.000Z', // Sunday 2:15 AM
      description: 'Rút tiền mặt đêm chủ nhật',
    };

    const alerts = scanTransactionForAnomalies(sundayTx);
    const timeAlert = alerts.find((a) => a.type === 'WEEKEND_OUT_OF_HOURS');
    assert.ok(timeAlert);
    assert.equal(timeAlert.severity, 'high');
  });

  it('detects unverified large vendor transfers above 50,000,000 VND and VAT discrepancies', () => {
    const largeNewVendorTx: FinancialTransaction = {
      id: 'tx-large-new-vendor-04',
      category: 'outsourcing_dev',
      amount: 85000000,
      currency: 'VND',
      vendorTaxId: '9999888877',
      recipientName: 'DOANH NGHIEP TU NHAN PHAN MEM LA',
      subtotalAmount: 85000000,
      vatRate: 10,
      vatAmount: 2000000, // Should be 8,500,000 VND
      timestamp: '2026-08-27T11:00:00.000Z',
      description: 'Hợp đồng gia công module bí mật',
    };

    const alerts = scanTransactionForAnomalies(largeNewVendorTx);
    const vendorAlert = alerts.find((a) => a.type === 'UNVERIFIED_LARGE_VENDOR');
    const vatAlert = alerts.find((a) => a.type === 'VAT_INVOICE_MISMATCH');

    assert.ok(vendorAlert, 'Should detect unverified large vendor');
    assert.ok(vatAlert, 'Should detect VAT discrepancy');
  });

  it('records CEO feedback and calculates radar statistics accurately', () => {
    const batchList: FinancialTransaction[] = [
      {
        id: 'tx-batch-01',
        category: 'cloud_infrastructure',
        amount: 20000000,
        currency: 'VND',
        timestamp: '2026-08-27T10:00:00.000Z',
        description: 'Server AWS',
      },
      {
        id: 'tx-batch-02',
        category: 'office_supplies',
        amount: 80000000,
        currency: 'VND',
        timestamp: '2026-08-27T10:05:00.000Z',
        description: 'Bất thường',
      },
    ];

    const alerts = batchScanLedgerTransactions(batchList);
    assert.ok(alerts.length >= 1);

    const alertId = alerts[0].id;
    const feedbackResult = markAnomalyFeedback(alertId, 'approved_exception', 'CEO duyệt mua dàn máy Server văn phòng');
    assert.ok(feedbackResult.success);
    assert.equal(feedbackResult.alert?.feedbackStatus, 'approved_exception');

    const stats = getFinancialRadarStats();
    assert.ok(stats.totalAlertsCount >= 1);
    assert.ok(stats.resolvedCount >= 1);
  });
});
