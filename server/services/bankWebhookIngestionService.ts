/**
 * bankWebhookIngestionService.ts
 * ============================================================
 * Live Bank & VietQR Webhook Ingestion Engine
 *
 * Tiếp nhận webhook chuyển khoản thực tế (VietQR, MBBank, SeABank, VCB, MoMo...),
 * xác thực chữ ký/token, trích xuất mã hóa đơn (INV-XXXX / HD-YYYY), tự động
 * đối soát và hạch toán vào Single Source of Truth (businessDataService).
 */

import fs from 'node:fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';
import {
  findEntityByField,
  getBusinessEntity,
  upsertBusinessEntity,
  type BusinessEntity,
} from './businessDataService.ts';
import { parseVietQRDescription, reconcileBankTransactions, type BankTransaction } from './vietqrReconciler.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

export interface BankWebhookPayload {
  transactionId?: string;
  id?: string;
  amount: number;
  description: string;
  bank?: string;
  bankCode?: string;
  accountNo?: string;
  timestamp?: string;
  date?: string;
  signature?: string;
  referenceCode?: string;
}

export interface BankIngestionResult {
  success: boolean;
  transactionId: string;
  amount: number;
  description: string;
  matchedInvoice?: {
    id: string;
    invoiceCode?: string;
    previousStatus?: string;
    newStatus: string;
    customerName?: string;
  };
  matchedCustomer?: {
    id: string;
    name?: string;
    newTotalSpent?: number;
  };
  journalEntry?: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    category: string;
  };
  reconciled: boolean;
  message: string;
}

const WEBHOOK_LOG_FILE = resolveRuntimePathFromEnv('BANK_WEBHOOK_LOG_FILE', 'bank_webhook_events.log.json');

function logWebhookEvent(event: Record<string, unknown>): void {
  try {
    ensureRuntimeRootSync();
    let logs: Array<Record<string, unknown>> = [];
    if (fs.existsSync(WEBHOOK_LOG_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8'));
      } catch {
        logs = [];
      }
    }
    logs.unshift({ ...event, loggedAt: new Date().toISOString() });
    if (logs.length > 500) logs.length = 500;
    fs.writeFileSync(WEBHOOK_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('[BankWebhook] log failed:', err);
  }
}

export function listBankWebhookLogs(limit = 50): Array<Record<string, unknown>> {
  try {
    if (!fs.existsSync(WEBHOOK_LOG_FILE)) return [];
    const logs = JSON.parse(fs.readFileSync(WEBHOOK_LOG_FILE, 'utf8'));
    return Array.isArray(logs) ? logs.slice(0, limit) : [];
  } catch {
    return [];
  }
}

/**
 * Trích xuất mã hóa đơn từ nội dung chuyển khoản (VD: "INV-2026-001", "HD1234", "BILL-889")
 */
export function extractInvoiceReference(description: string): string | null {
  if (!description) return null;

  // Khớp trực tiếp trên chuỗi gốc trước khi bỏ dấu gạch ngang
  const match = description.match(/\b((?:INV|HD|BILL|DONHANG|DH)[-_ ]?[0-9A-Za-z]+(?:[-_][0-9A-Za-z]+)*)\b/i);
  if (match) {
    return match[1].toUpperCase().replace(/\s+/g, '-');
  }

  const cleaned = parseVietQRDescription(description).toUpperCase();
  const matchNum = cleaned.match(/\b(?:HOADON|THANHTOAN)[-_ ]?([0-9]{3,8})\b/);
  if (matchNum) {
    return `INV-${matchNum[1]}`;
  }

  return null;
}

/**
 * Xử lý & tự động đối soát Webhook ngân hàng
 */
export function ingestBankWebhook(
  payload: BankWebhookPayload,
  options?: { secretToken?: string; expectedToken?: string }
): BankIngestionResult {
  // 1. Xác thực Token nếu có cấu hình
  if (options?.expectedToken && options?.secretToken) {
    if (options.secretToken !== options.expectedToken) {
      logWebhookEvent({ status: 'rejected_unauthorized', payload });
      return {
        success: false,
        transactionId: payload.transactionId || payload.id || 'unknown',
        amount: payload.amount || 0,
        description: payload.description || '',
        reconciled: false,
        message: 'Chữ ký hoặc Secret Token của ngân hàng không hợp lệ.',
      };
    }
  }

  const transactionId = payload.transactionId || payload.id || `txn_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
  const amount = Number(payload.amount) || 0;
  const description = payload.description || '';
  const bank = payload.bank || payload.bankCode || 'VietQR';
  const now = new Date().toISOString();

  // 2. Tìm hóa đơn tương ứng trong BusinessDataService
  const invoiceRef = extractInvoiceReference(description);
  let matchedInvoiceEntity: BusinessEntity | undefined;
  let matchedCustomerEntity: BusinessEntity | undefined;

  if (invoiceRef) {
    // Tìm theo invoiceCode hoặc id
    matchedInvoiceEntity =
      findEntityByField('invoice', 'invoiceCode', invoiceRef) ||
      findEntityByField('invoice', 'invoiceNumber', invoiceRef) ||
      getBusinessEntity(invoiceRef.toLowerCase());
  }

  // 3. Tự động hạch toán kế toán kép (VAS 200)
  const bankTxn: BankTransaction = {
    id: transactionId,
    date: payload.date || payload.timestamp || now,
    description,
    amount,
    balance: 0,
    bank,
    accountNo: payload.accountNo,
  };

  const reconResults = reconcileBankTransactions([bankTxn]);
  const journalEntry = reconResults.entries.length > 0 ? reconResults.entries[0] : undefined;

  // 4. Cập nhật hóa đơn nếu khớp
  let matchedInvoiceResult: BankIngestionResult['matchedInvoice'] | undefined;
  let matchedCustomerResult: BankIngestionResult['matchedCustomer'] | undefined;

  if (matchedInvoiceEntity) {
    const prevStatus = String(matchedInvoiceEntity.data.status || 'pending');
    const customerId = String(matchedInvoiceEntity.data.customerId || matchedInvoiceEntity.data.customer_id || '');

    upsertBusinessEntity({
      id: matchedInvoiceEntity.id,
      type: 'invoice',
      data: {
        status: 'paid',
        isPaid: true,
        paidAmount: amount,
        paidAt: now,
        transactionId,
        paymentMethod: 'vietqr_webhook',
      },
      source: 'workflow',
    });

    matchedInvoiceResult = {
      id: matchedInvoiceEntity.id,
      invoiceCode: String(matchedInvoiceEntity.data.invoiceCode || invoiceRef),
      previousStatus: prevStatus,
      newStatus: 'paid',
      customerName: String(matchedInvoiceEntity.data.customerName || ''),
    };

    // Tìm và cập nhật Customer LTV
    if (customerId) {
      matchedCustomerEntity = getBusinessEntity(customerId);
      if (matchedCustomerEntity) {
        const currentSpent = Number(matchedCustomerEntity.data.totalSpent || 0);
        const newTotalSpent = currentSpent + amount;
        upsertBusinessEntity({
          id: matchedCustomerEntity.id,
          type: 'customer',
          data: {
            totalSpent: newTotalSpent,
            lastPaymentAt: now,
          },
          source: 'workflow',
        });

        matchedCustomerResult = {
          id: matchedCustomerEntity.id,
          name: String(matchedCustomerEntity.data.name || ''),
          newTotalSpent,
        };
      }
    }
  }

  // 5. Lưu lại giao dịch vào BusinessDataService (Entity Type 'invoice' hoặc lưu vết)
  upsertBusinessEntity({
    id: `pay_txn_${transactionId}`,
    type: 'invoice',
    data: {
      isPaymentReceipt: true,
      transactionId,
      amount,
      description,
      bank,
      invoiceRef,
      matchedInvoiceId: matchedInvoiceEntity?.id,
      journalEntry,
      status: 'completed',
    },
    source: 'workflow',
  });

  const result: BankIngestionResult = {
    success: true,
    transactionId,
    amount,
    description,
    matchedInvoice: matchedInvoiceResult,
    matchedCustomer: matchedCustomerResult,
    journalEntry: journalEntry
      ? {
          debitAccount: journalEntry.debitAccount,
          creditAccount: journalEntry.creditAccount,
          amount: journalEntry.amount,
          category: journalEntry.category,
        }
      : undefined,
    reconciled: Boolean(matchedInvoiceResult || (journalEntry && !journalEntry.needsReview)),
    message: matchedInvoiceResult
      ? `Đã nhận ${amount.toLocaleString('vi-VN')} đ qua ${bank} và tự động gạch nợ hóa đơn ${matchedInvoiceResult.invoiceCode}!`
      : `Đã ghi nhận giao dịch ${amount.toLocaleString('vi-VN')} đ qua ${bank} (Hạch toán Nợ ${journalEntry?.debitAccount || '112'} / Có ${journalEntry?.creditAccount || '511'}).`,
  };

  // Publish to universal system event bus for closed-loop reaction
  publishSystemEvent(
    'bank.payment_received',
    'bankWebhookIngestionService',
    result.message,
    { transactionId, amount, bank, matchedInvoice: matchedInvoiceResult, matchedCustomer: matchedCustomerResult }
  ).catch(() => undefined);

  logWebhookEvent({ status: 'ingested', result, payload });
  return result;
}
