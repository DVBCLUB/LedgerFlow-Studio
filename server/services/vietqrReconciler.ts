// server/services/vietqrReconciler.ts
// Rule-based + AI-assisted VietQR/bank-statement reconciliation for Vietnamese accounting.

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  bank?: string;
  accountNo?: string;
}

export type TransactionCategory =
  | "revenue"
  | "revenue_service"
  | "expense_salary"
  | "expense_rent"
  | "expense_service"
  | "expense_office"
  | "expense_tax"
  | "transfer"
  | "receivable"
  | "payable"
  | "investment"
  | "unknown";

export interface JournalEntry {
  transactionId: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  vatAmount?: number;
  vatAccount?: string;
  category: TransactionCategory;
  confidence: number;
  needsReview: boolean;
  notes?: string;
}

interface TransactionRule {
  pattern: RegExp;
  category: TransactionCategory;
  debitAccount: string;
  creditAccount: string;
  confidence: number;
  vatRate?: number;
  note?: string;
}

const INBOUND_RULES: TransactionRule[] = [
  { pattern: /thanh\s*toan|payment|mua\s*hang|tra\s*tien|chuyen\s*khoan\s*mua/i, category: "revenue_service", debitAccount: "112", creditAccount: "511", confidence: 0.76, vatRate: 0.1 },
  { pattern: /thu\s*cong\s*no|tra\s*no|tt\s*cong\s*no|cong\s*no/i, category: "receivable", debitAccount: "112", creditAccount: "131", confidence: 0.82 },
  { pattern: /gop\s*von|dau\s*tu|capital/i, category: "investment", debitAccount: "112", creditAccount: "411", confidence: 0.8 },
  { pattern: /hoan\s*ung|refund|hoan\s*tien/i, category: "receivable", debitAccount: "112", creditAccount: "141", confidence: 0.72 },
];

const OUTBOUND_RULES: TransactionRule[] = [
  { pattern: /nop\s*thue|thue\s*gtgt|thue\s*tndn|thue\s*tncn|kho\s*bac/i, category: "expense_tax", debitAccount: "333", creditAccount: "112", confidence: 0.88 },
  { pattern: /luong|salary|thanh\s*toan\s*luong/i, category: "expense_salary", debitAccount: "334", creditAccount: "112", confidence: 0.85 },
  { pattern: /thue\s*van\s*phong|rent|tien\s*thue/i, category: "expense_rent", debitAccount: "642", creditAccount: "112", confidence: 0.78 },
  { pattern: /dien|nuoc|internet|fpt|vnpt|viettel|mobi|phone/i, category: "expense_office", debitAccount: "642", creditAccount: "112", confidence: 0.76, vatRate: 0.1 },
  { pattern: /ncc|nha\s*cung\s*cap|thanh\s*toan\s*hd|hoa\s*don|invoice/i, category: "payable", debitAccount: "331", creditAccount: "112", confidence: 0.72 },
  { pattern: /tam\s*ung|ung\s*tien/i, category: "expense_service", debitAccount: "141", creditAccount: "112", confidence: 0.72 },
  { pattern: /chuyen\s*noi\s*bo|noi\s*bo|transfer/i, category: "transfer", debitAccount: "112", creditAccount: "112", confidence: 0.7, note: "Có thể là chuyển khoản nội bộ, cần kiểm tra tài khoản đối ứng." },
];

export function parseVietQRDescription(description: string): string {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s._/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeAmount(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(Math.abs(amount));
}

function buildEntryFromRule(txn: BankTransaction, rule: TransactionRule): Omit<JournalEntry, "transactionId" | "date" | "description"> {
  const absAmount = sanitizeAmount(txn.amount);
  const vatAmount = rule.vatRate ? Math.round((absAmount / (1 + rule.vatRate)) * rule.vatRate) : undefined;
  return {
    debitAccount: rule.debitAccount,
    creditAccount: rule.creditAccount,
    amount: absAmount,
    vatAmount,
    vatAccount: vatAmount ? (txn.amount < 0 ? "1331" : "3331") : undefined,
    category: rule.category,
    confidence: rule.confidence,
    needsReview: rule.confidence < 0.7,
    notes: rule.note,
  };
}

export function classifyTransaction(txn: BankTransaction): Omit<JournalEntry, "transactionId" | "date" | "description"> {
  const normalized = parseVietQRDescription(txn.description || "");
  const rules = txn.amount < 0 ? OUTBOUND_RULES : INBOUND_RULES;

  for (const rule of rules) {
    if (rule.pattern.test(normalized)) return buildEntryFromRule(txn, rule);
  }

  const absAmount = sanitizeAmount(txn.amount);
  return {
    debitAccount: txn.amount < 0 ? "642" : "112",
    creditAccount: txn.amount < 0 ? "112" : "511",
    amount: absAmount,
    category: "unknown",
    confidence: 0.2,
    needsReview: true,
    notes: "Không tự động nhận dạng được. Founder/kế toán cần phân loại thủ công.",
  };
}

export function reconcileStatement(transactions: BankTransaction[]): {
  entries: JournalEntry[];
  stats: { total: number; autoClassified: number; needsReview: number; totalDebit: number; totalCredit: number };
} {
  const entries = transactions.map((txn) => ({
    transactionId: txn.id,
    date: txn.date,
    description: txn.description,
    ...classifyTransaction(txn),
  }));

  return {
    entries,
    stats: {
      total: entries.length,
      autoClassified: entries.filter((entry) => !entry.needsReview).length,
      needsReview: entries.filter((entry) => entry.needsReview).length,
      totalDebit: transactions.filter((txn) => txn.amount < 0).reduce((sum, txn) => sum + sanitizeAmount(txn.amount), 0),
      totalCredit: transactions.filter((txn) => txn.amount > 0).reduce((sum, txn) => sum + sanitizeAmount(txn.amount), 0),
    },
  };
}

export async function aiClassifyUnknown(
  transactions: BankTransaction[],
  callAI: (prompt: string) => Promise<string>,
): Promise<JournalEntry[]> {
  const unknowns = transactions.filter((txn) => classifyTransaction(txn).category === "unknown");
  if (!unknowns.length) return [];

  const prompt = `Bạn là kế toán viên Việt Nam. Phân loại các giao dịch ngân hàng sau theo VAS/Thông tư 200.
Trả về JSON array, mỗi item có: id, debitAccount, creditAccount, category, confidence, notes.

${unknowns.map((txn) => `ID: ${txn.id} | ${txn.date} | ${txn.amount.toLocaleString("vi-VN")} VND | ${txn.description}`).join("\n")}

Chỉ trả JSON array, không giải thích thêm.`;

  try {
    const response = await callAI(prompt);
    const parsed = JSON.parse(response.replace(/```json|```/g, "").trim()) as Array<{
      id: string;
      debitAccount: string;
      creditAccount: string;
      category?: TransactionCategory;
      confidence?: number;
      notes?: string;
    }>;

    return parsed.flatMap((item) => {
      const txn = unknowns.find((candidate) => candidate.id === item.id);
      if (!txn) return [];
      const confidence = typeof item.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 0.6;
      return [{
        transactionId: txn.id,
        date: txn.date,
        description: txn.description,
        debitAccount: item.debitAccount || (txn.amount < 0 ? "642" : "112"),
        creditAccount: item.creditAccount || (txn.amount < 0 ? "112" : "511"),
        amount: sanitizeAmount(txn.amount),
        category: item.category || "unknown",
        confidence,
        needsReview: confidence < 0.7,
        notes: item.notes,
      }];
    });
  } catch {
    return [];
  }
}
