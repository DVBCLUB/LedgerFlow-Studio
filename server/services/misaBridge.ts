import * as XLSX from 'xlsx';

export type MISAJournalRow = {
  date: string;
  documentNumber: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  amountVND: number;
  partner?: string;
  project?: string;
};

export type MISAImportSummary = {
  dateRange: { from: string; to: string };
  totalDebit: number;
  totalCredit: number;
  uniqueAccounts: string[];
};

export type MISAImportResult = {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: string[];
  entries: MISAJournalRow[];
  summary: MISAImportSummary;
};

const ACCOUNT_MAP: Record<string, string> = {
  '1111': '111',
  '1121': '112',
  '1311': '131',
  '3311': '331',
  '33311': '3331',
  '33312': '3332',
};

function normalizeAccount(value: unknown): string {
  const cleaned = String(value || '').trim().replace(/\./g, '').replace(/\s+/g, '');
  return ACCOUNT_MAP[cleaned] || cleaned;
}

function parseDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'number') return new Date((value - 25569) * 86400 * 1000).toISOString().slice(0, 10);
  const raw = String(value).trim();
  const parts = raw.split('/');
  if (parts.length === 3) {
    const [d = '', m = '', y = ''] = parts;
    return `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number') return Math.abs(value);
  return Math.abs(Number(String(value).replace(/[,\s]/g, '').replace(/\./g, '')) || 0);
}

function findHeader(data: unknown[][]): number {
  for (let i = 0; i < Math.min(data.length, 30); i += 1) {
    const row = (data[i] || []).map((cell) => String(cell)).join('|').toLowerCase();
    if ((row.includes('ngày') || row.includes('date')) && (row.includes('diễn giải') || row.includes('chứng từ') || row.includes('số ct'))) return i;
  }
  return -1;
}

function col(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = headers.findIndex((header) => header.includes(name));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseSheet(ws: XLSX.WorkSheet): MISAJournalRow[] {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
  const headerIndex = findHeader(data);
  if (headerIndex < 0) return [];

  const headers = (data[headerIndex] || []).map((header) => String(header).toLowerCase().trim());
  const dateCol = col(headers, 'ngày', 'date');
  const docCol = col(headers, 'chứng từ', 'số ct', 'document');
  const descCol = col(headers, 'diễn giải', 'nội dung', 'description');
  const debitCol = col(headers, 'tk nợ', 'tài khoản nợ', 'debit account', 'nợ');
  const creditCol = col(headers, 'tk có', 'tài khoản có', 'credit account', 'có');
  const amountCol = col(headers, 'số tiền', 'amount', 'tiền vnd', 'tiền quy đổi');

  if ([dateCol, debitCol, creditCol, amountCol].some((idx) => idx < 0)) return [];

  return data
    .slice(headerIndex + 1)
    .map((row): MISAJournalRow => {
      const amount = parseAmount(row[amountCol]);
      return {
        date: parseDate(row[dateCol]),
        documentNumber: String(row[docCol] || '').trim(),
        description: String(row[descCol] || '').trim(),
        debitAccount: normalizeAccount(row[debitCol]),
        creditAccount: normalizeAccount(row[creditCol]),
        amount,
        currency: 'VND',
        amountVND: amount,
        partner: '',
        project: '',
      };
    })
    .filter((row) => row.date && row.amountVND > 0 && (row.debitAccount || row.creditAccount));
}

export function importMISAWorkbook(fileBuffer: Buffer): MISAImportResult {
  const errors: string[] = [];
  let entries: MISAJournalRow[] = [];

  try {
    const wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
    const names = ['NKCT', 'NKC', 'Nhật ký chung', 'SoCai', 'Sổ cái', 'Sheet1', ...wb.SheetNames];
    for (const name of names) {
      const ws = wb.Sheets[name];
      if (!ws) continue;
      entries = parseSheet(ws);
      if (entries.length) break;
    }
    if (!entries.length) errors.push('Không tìm thấy dữ liệu nhật ký chung trong file Excel.');
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const dates = entries.map((entry) => entry.date).sort();
  const accounts = [...new Set(entries.flatMap((entry) => [entry.debitAccount, entry.creditAccount]).filter((account): account is string => Boolean(account)))].sort();

  return {
    success: errors.length === 0 && entries.length > 0,
    totalRows: entries.length,
    importedRows: entries.length,
    skippedRows: 0,
    errors,
    entries,
    summary: {
      dateRange: { from: dates[0] || '', to: dates[dates.length - 1] || '' },
      totalDebit: entries.reduce((sum, entry) => sum + (entry.debitAccount ? entry.amountVND : 0), 0),
      totalCredit: entries.reduce((sum, entry) => sum + (entry.creditAccount ? entry.amountVND : 0), 0),
      uniqueAccounts: accounts,
    },
  };
}
