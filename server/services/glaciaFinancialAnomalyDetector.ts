/**
 * server/services/glaciaFinancialAnomalyDetector.ts
 * Động cơ Giám sát Bất thường Tài chính & Kế toán VAS Thời gian thực cho Glacia (Frontier 5).
 */

import fs from 'fs';
import path from 'path';
import { loadFinancialBaseline, updateBaselineWithTransaction } from './glaciaFinancialBaselineEngine.ts';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType =
  | 'STATISTICAL_SPIKE'
  | 'DUPLICATE_PAYMENT'
  | 'WEEKEND_OUT_OF_HOURS'
  | 'UNVERIFIED_LARGE_VENDOR'
  | 'VAT_INVOICE_MISMATCH'
  | 'VAS_LEDGER_IMBALANCE';

export interface FinancialTransaction {
  id: string;
  voucherNumber?: string;
  category: string;
  amount: number;
  currency: string;
  recipientAccount?: string;
  recipientName?: string;
  vendorTaxId?: string;
  timestamp: string;
  debitAccount?: string; // e.g. "642", "156", "211"
  creditAccount?: string; // e.g. "1121", "331"
  vatRate?: number; // 0, 8, 10
  vatAmount?: number;
  subtotalAmount?: number;
  description: string;
}

export interface FinancialAnomalyAlert {
  id: string;
  transactionId: string;
  voucherNumber?: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  detectedAt: string;
  confidenceScore: number;
  suggestedAction: string;
  feedbackStatus: 'pending' | 'confirmed_fraud' | 'false_positive' | 'approved_exception';
  feedbackNotes?: string;
  metadata: {
    actualAmount: number;
    expectedMean?: number;
    stdDevThreshold?: number;
    vendorName?: string;
    matchedPastTxId?: string;
    timeFlag?: string;
  };
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const ALERTS_FILE = path.join(RUNTIME_DIR, 'glacia_financial_alerts.json');
const RECENT_TX_WINDOW_HOURS = 24;

let memoryAlertStore: FinancialAnomalyAlert[] = [];
let recentTransactionsBuffer: FinancialTransaction[] = [];

function loadAlertsStore(): FinancialAnomalyAlert[] {
  if (memoryAlertStore.length > 0) return memoryAlertStore;
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
      memoryAlertStore = Array.isArray(data) ? data : [];
      return memoryAlertStore;
    }
  } catch (err) {
    console.warn('[GlaciaFinancialAnomaly] Failed to load alerts from disk');
  }
  return [];
}

function saveAlertsStore(alerts: FinancialAnomalyAlert[]): void {
  memoryAlertStore = alerts;
  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GlaciaFinancialAnomaly] Error saving alerts:', err);
  }
}

export function scanTransactionForAnomalies(tx: FinancialTransaction): FinancialAnomalyAlert[] {
  const baseline = loadFinancialBaseline();
  const alerts: FinancialAnomalyAlert[] = [];
  const txDate = new Date(tx.timestamp);

  // 1. Vector: STATISTICAL_SPIKE (> Mean + 2.2 * StdDev)
  const catBaseline = baseline.categories[tx.category];
  if (catBaseline) {
    const threshold = catBaseline.meanAmount + 2.2 * catBaseline.stdDev;
    if (tx.amount > threshold) {
      alerts.push({
        id: `alert-stat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionId: tx.id,
        voucherNumber: tx.voucherNumber,
        type: 'STATISTICAL_SPIKE',
        severity: tx.amount > threshold * 1.5 ? 'critical' : 'high',
        title: `Phát hiện Chi tiêu Bất thường danh mục ${tx.category}`,
        description: `Giao dịch ${tx.amount.toLocaleString('vi-VN')} VND vượt quá ngưỡng thông thường (Trung bình: ${catBaseline.meanAmount.toLocaleString('vi-VN')} VND, Ngưỡng cảnh báo: ${Math.round(threshold).toLocaleString('vi-VN')} VND).`,
        detectedAt: new Date().toISOString(),
        confidenceScore: 0.94,
        suggestedAction: 'Yêu cầu kế toán trưởng xác minh chứng từ gốc và phê duyệt của CEO.',
        feedbackStatus: 'pending',
        metadata: {
          actualAmount: tx.amount,
          expectedMean: catBaseline.meanAmount,
          stdDevThreshold: threshold,
        },
      });
    }
  }

  // 2. Vector: DUPLICATE_PAYMENT (Replay attack / duplicate transfer within 24 hours)
  const twentyFourHoursAgo = txDate.getTime() - RECENT_TX_WINDOW_HOURS * 60 * 60 * 1000;
  const duplicate = recentTransactionsBuffer.find((pastTx) => {
    const pastTime = new Date(pastTx.timestamp).getTime();
    return (
      pastTx.id !== tx.id &&
      pastTime >= twentyFourHoursAgo &&
      pastTx.amount === tx.amount &&
      (pastTx.recipientAccount === tx.recipientAccount || (pastTx.vendorTaxId && pastTx.vendorTaxId === tx.vendorTaxId))
    );
  });

  if (duplicate) {
    alerts.push({
      id: `alert-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: tx.id,
      voucherNumber: tx.voucherNumber,
      type: 'DUPLICATE_PAYMENT',
      severity: 'critical',
      title: 'Cảnh Báo Chuyển Tiền / Thanh Toán Trùng Lặp',
      description: `Giao dịch ${tx.amount.toLocaleString('vi-VN')} VND cho tài khoản ${tx.recipientAccount || tx.recipientName} trùng khớp với giao dịch ${duplicate.id} trong vòng 24h qua.`,
      detectedAt: new Date().toISOString(),
      confidenceScore: 0.98,
      suggestedAction: 'Dừng lệnh chi ngân hàng ngay lập tức và đối soát sao kê VietQR/Voucher.',
      feedbackStatus: 'pending',
      metadata: {
        actualAmount: tx.amount,
        matchedPastTxId: duplicate.id,
      },
    });
  }

  // 3. Vector: WEEKEND_OUT_OF_HOURS (Disbursements on Saturday/Sunday or between 23:00 and 05:00)
  const dayOfWeek = txDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = txDate.getHours();
  const utcHours = txDate.getUTCHours();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isNightHour = (hours >= 23 || hours < 5) || (utcHours >= 23 || utcHours < 5);

  if (isWeekend || isNightHour) {
    alerts.push({
      id: `alert-time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transactionId: tx.id,
      voucherNumber: tx.voucherNumber,
      type: 'WEEKEND_OUT_OF_HOURS',
      severity: isNightHour ? 'high' : 'medium',
      title: 'Lệnh Xuất Quỹ / Chuyển Khoản Ngoài Giờ Hành Chính',
      description: `Lệnh chi ${tx.amount.toLocaleString('vi-VN')} VND được tạo vào ${isWeekend ? 'Cuối tuần' : ''} ${isNightHour ? `Lúc ${hours}:00 đêm` : ''}.`,
      detectedAt: new Date().toISOString(),
      confidenceScore: 0.88,
      suggestedAction: 'Kiểm tra xem đây có phải là thanh toán hệ thống tự động hay có truy cập trái phép.',
      feedbackStatus: 'pending',
      metadata: {
        actualAmount: tx.amount,
        timeFlag: `${isWeekend ? 'WEEKEND' : ''}_${isNightHour ? 'NIGHT_HOURS' : ''}`,
      },
    });
  }

  // 4. Vector: UNVERIFIED_LARGE_VENDOR (> 50,000,000 VND to a vendor not in verified vendor base)
  if (tx.amount >= 50000000 && tx.vendorTaxId) {
    const isKnown = baseline.knownVendors.some((v) => v.vendorTaxId === tx.vendorTaxId);
    if (!isKnown) {
      alerts.push({
        id: `alert-vendor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionId: tx.id,
        voucherNumber: tx.voucherNumber,
        type: 'UNVERIFIED_LARGE_VENDOR',
        severity: 'high',
        title: 'Chuyển Khoản Lớn cho Đối Tác Mới Chưa Xác Minh',
        description: `Khoản thanh toán ${tx.amount.toLocaleString('vi-VN')} VND đến đối tác mới (MST: ${tx.vendorTaxId}, Tên: ${tx.recipientName || 'Chưa định danh'}) chưa từng có lịch sử giao dịch.`,
        detectedAt: new Date().toISOString(),
        confidenceScore: 0.91,
        suggestedAction: 'Xác thực thông tin MST trên Tổng Cục Thuế và kiểm tra Hợp đồng kinh tế trước khi ký UNC.',
        feedbackStatus: 'pending',
        metadata: {
          actualAmount: tx.amount,
          vendorName: tx.recipientName || tx.vendorTaxId,
        },
      });
    }
  }

  // 5. Vector: VAT_INVOICE_MISMATCH (Tax rate vs calculated VAT in VAS compliance)
  if (tx.subtotalAmount && tx.vatAmount !== undefined && tx.vatRate !== undefined) {
    const expectedVat = Math.round(tx.subtotalAmount * (tx.vatRate / 100));
    if (Math.abs(expectedVat - tx.vatAmount) > 1000) {
      alerts.push({
        id: `alert-vat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionId: tx.id,
        voucherNumber: tx.voucherNumber,
        type: 'VAT_INVOICE_MISMATCH',
        severity: 'medium',
        title: 'Sai Lệch Tiền Thuế GTGT Theo Chuẩn VAS / Nghị Định 123',
        description: `Tiền thuế GTGT trên chứng từ (${tx.vatAmount.toLocaleString('vi-VN')} VND) không khớp với thuế suất ${tx.vatRate}% của tiền hàng (${expectedVat.toLocaleString('vi-VN')} VND).`,
        detectedAt: new Date().toISOString(),
        confidenceScore: 0.96,
        suggestedAction: 'Điều chỉnh lại số thuế GTGT đầu vào/đầu ra trước khi lập tờ khai thuế quý.',
        feedbackStatus: 'pending',
        metadata: {
          actualAmount: tx.vatAmount,
          expectedMean: expectedVat,
        },
      });
    }
  }

  // Store in memory buffer & persist alerts
  recentTransactionsBuffer.push(tx);
  if (recentTransactionsBuffer.length > 500) {
    recentTransactionsBuffer.shift();
  }

  if (alerts.length > 0) {
    const currentAlerts = loadAlertsStore();
    const updatedAlerts = [...alerts, ...currentAlerts].slice(0, 100);
    saveAlertsStore(updatedAlerts);
  }

  return alerts;
}

export function batchScanLedgerTransactions(txList: FinancialTransaction[]): FinancialAnomalyAlert[] {
  const allAlerts: FinancialAnomalyAlert[] = [];
  for (const tx of txList) {
    const alerts = scanTransactionForAnomalies(tx);
    allAlerts.push(...alerts);
  }
  return allAlerts;
}

export function getAnomalyAlertFeed(): FinancialAnomalyAlert[] {
  return loadAlertsStore();
}

export function markAnomalyFeedback(
  alertId: string,
  feedback: 'confirmed_fraud' | 'false_positive' | 'approved_exception',
  notes?: string
): { success: boolean; alert?: FinancialAnomalyAlert } {
  const alerts = loadAlertsStore();
  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) return { success: false };

  alert.feedbackStatus = feedback;
  if (notes) alert.feedbackNotes = notes;

  // If approved exception or false positive, adapt baseline
  if (feedback === 'approved_exception' || feedback === 'false_positive') {
    const tx = recentTransactionsBuffer.find((t) => t.id === alert.transactionId);
    if (tx) {
      updateBaselineWithTransaction(tx.category, tx.amount, tx.vendorTaxId, tx.recipientName);
    }
  }

  saveAlertsStore(alerts);
  return { success: true, alert };
}

export function getFinancialRadarStats(): {
  totalAlertsCount: number;
  criticalCount: number;
  highCount: number;
  pendingCount: number;
  resolvedCount: number;
  anomaliesByType: Record<string, number>;
} {
  const alerts = loadAlertsStore();
  const stats = {
    totalAlertsCount: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === 'critical').length,
    highCount: alerts.filter((a) => a.severity === 'high').length,
    pendingCount: alerts.filter((a) => a.feedbackStatus === 'pending').length,
    resolvedCount: alerts.filter((a) => a.feedbackStatus !== 'pending').length,
    anomaliesByType: {} as Record<string, number>,
  };

  for (const a of alerts) {
    stats.anomaliesByType[a.type] = (stats.anomaliesByType[a.type] || 0) + 1;
  }

  return stats;
}
