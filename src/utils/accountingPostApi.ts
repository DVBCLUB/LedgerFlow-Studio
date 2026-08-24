/**
 * src/utils/accountingPostApi.ts
 * Frontend client cho Double-Entry Auto-Posting Engine
 * (server/services/accountingPostEngine.ts, route /api/dormant/accounting/*).
 */

export type VoucherType =
  | 'CASH_RECEIPT' | 'CASH_PAYMENT' | 'BANK_DEPOSIT' | 'BANK_WITHDRAWAL'
  | 'SALES_INVOICE' | 'PURCHASE_INVOICE' | 'ADVANCE_SETTLEMENT' | 'GENERAL_JOURNAL';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  costCenterId?: string;
}

export interface PostingVoucher {
  voucherId: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: VoucherType;
  partnerCode?: string;
  partnerName?: string;
  lines: JournalLine[];
  totalAmount: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy?: string;
  postedAt?: string;
}

export interface PostingResult {
  success: boolean;
  voucher: PostingVoucher;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  error?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function listPostedVouchers(): Promise<PostingVoucher[]> {
  return request<{ success: boolean; vouchers: PostingVoucher[] }>(
    '/api/dormant/accounting/vouchers'
  ).then((r) => r.vouchers ?? []);
}

export function postVoucher(input: {
  voucherNo: string;
  voucherDate?: string;
  voucherType: VoucherType;
  partnerName?: string;
  lines: JournalLine[];
  totalAmount?: number;
}): Promise<PostingResult> {
  return request<PostingResult>('/api/dormant/accounting/post-voucher', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
