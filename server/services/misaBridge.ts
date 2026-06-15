import * as XLSX from "xlsx";

export interface MISAJournalRow {
  date: string;
  documentNumber: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  amountVND: number;
  partner?: string;
  project?: string;
}

export interface MISAImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: string[];
  entries: MISAJournalRow[];
  summary: {
    dateRange: { from: string; to: string };
    totalDebit: number;
    totalCredit: number;
    uniqueAccounts: string[];
  };
}

const MISA_TO_VAS_ACCOUNT_MAP: Record<string, string> = {
  "1111": "111",
  "1121": "112",
  "1311": "131",
  "3311": "331",
  "33311": "3331",
  "33312": "3332",
};

export function normalizeMISAAccount(rawAccount: string): string {
  if (!rawAccount) return "";
  const cleaned = rawAccount.trim().replace(/\./g, "").replace(/\s+/g, "");
  return MISA_TO_VAS_ACCOUNT_MAP[cleaned] || cleaned;
}

export function parseMISADate(raw: string | number): string {
  if (!raw) return "";
  if (typeof raw === "number") {
    const date = new Date((raw - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  const value = String(raw).trim();
  const slashParts = value.split(/[\/\-.]/);
  if (slashParts.length === 3) {
    const [d, m, y] = slashParts;
    if (Number(d) <= 31 && Number(m) <= 12) return `${y.length === 2 ? "20" + y : y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return value;
}

export function parseMISAAmount(raw: string | number): number {
  if (!raw) return 0;
  if (typeof raw === "number") return Math.abs(raw);
  const source = String(raw).trim();
  const cleaned = source.includes(",") && source.includes(".")
    ? source.replace(/[\s,]/g, "")
    : source.replace(/[\s.]/g, "").replace(",", ".");
  return Math.abs(Number.parseFloat(cleaned) || 0);
}

function detectSheetType(ws: XLSX.WorkSheet): "nkc" | "so_cai" | "unknown" {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const sample: string[] = [];
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r += 1) {
    for (let c = range.s.c; c <= Math.min(range.e.c, 8); c += 1) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell) sample.push(String(cell.v || "").toLowerCase());
    }
  }
  const joined = sample.join(" ");
  if (joined.includes("nhật ký") || joined.includes("nkc") || joined.includes("nkct")) return "nkc";
  if (joined.includes("sổ cái") || joined.includes("so cai")) return "so_cai";
  return "unknown";
}

function findHeaderIndex(data: unknown[][]): number {
  for (let i = 0; i < Math.min(data.length, 30); i += 1) {
    const rowStr = (data[i] || []).join("|").toLowerCase();
    if ((rowStr.includes("ngày") || rowStr.includes("date")) && (rowStr.includes("diễn giải") || rowStr.includes("chứng từ") || rowStr.includes("số ct"))) return i;
  }
  return -1;
}

function parseNKC(ws: XLSX.WorkSheet): MISAJournalRow[] {
  const rows: MISAJournalRow[] = [];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
  const headerRowIdx = findHeaderIndex(data);
  if (headerRowIdx === -1) return [];

  const headers = (data[headerRowIdx] || []).map((header) => String(header).toLowerCase().trim());
  const getColIdx = (...candidates: string[]) => {
    for (const candidate of candidates) {
      const idx = headers.findIndex((header) => header.includes(candidate));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateCol = getColIdx("ngày", "date");
  const docCol = getColIdx("chứng từ", "số ct", "document");
  const descCol = getColIdx("diễn giải", "nội dung", "description");
  const debitCol = getColIdx("tk nợ", "tài khoản nợ", "debit account", "nợ");
  const creditCol = getColIdx("tk có", "tài khoản có", "credit account", "có");
  const amountCol = getColIdx("số tiền", "amount", "tiền vnd", "tiền quy đổi", "phát sinh");
  const partnerCol = getColIdx("đối tượng", "khách hàng", "nhà cung cấp", "partner");
  const projectCol = getColIdx("công trình", "dự án", "project");

  if (dateCol < 0 || amountCol < 0 || (debitCol < 0 && creditCol < 0)) return [];

  for (let i = headerRowIdx + 1; i < data.length; i += 1) {
    const row = data[i] || [];
    const date = parseMISADate(row[dateCol] as string | number);
    const amount = parseMISAAmount(row[amountCol] as string | number);
    if (!date || amount === 0) continue;

    const debitRaw = String(row[debitCol] || "").trim();
    const creditRaw = String(row[creditCol] || "").trim();
    if (!debitRaw && !creditRaw) continue;

    rows.push({
      date,
      documentNumber: String(row[docCol] || "").trim(),
      description: String(row[descCol] || "").trim(),
      debitAccount: normalizeMISAAccount(debitRaw),
      creditAccount: normalizeMISAAccount(creditRaw),
      amount,
      currency: "VND",
      amountVND: amount,
      partner: partnerCol >= 0 ? String(row[partnerCol] || "").trim() : "",
      project: projectCol >= 0 ? String(row[projectCol] || "").trim() : "",
    });
  }

  return rows;
}

export function importMISAWorkbook(fileBuffer: Buffer): MISAImportResult {
  const errors: string[] = [];
  let entries: MISAJournalRow[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: false });
    const sheetPriority = ["NKCT", "NKC", "Nhật ký chung", "Nhat ky chung", "Sheet1", ...workbook.SheetNames];

    for (const sheetName of sheetPriority) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;
      const type = detectSheetType(ws);
      const parsed = type === "so_cai" || type === "unknown" ? parseNKC(ws) : parseNKC(ws);
      if (parsed.length > 0) {
        entries = parsed;
        break;
      }
    }

    if (entries.length === 0) errors.push("Không tìm thấy dữ liệu nhật ký chung. Kiểm tra lại file MISA export.");
  } catch (err: any) {
    errors.push(`Lỗi đọc file: ${err?.message || String(err)}`);
  }

  const dates = entries.map((entry) => entry.date).filter(Boolean).sort();
  const uniqueAccounts = [...new Set([...entries.map((entry) => entry.debitAccount), ...entries.map((entry) => entry.creditAccount)])].filter(Boolean).sort();

  return {
    success: errors.length === 0 && entries.length > 0,
    totalRows: entries.length,
    importedRows: entries.length,
    skippedRows: 0,
    errors,
    entries,
    summary: {
      dateRange: { from: dates[0] || "", to: dates[dates.length - 1] || "" },
      totalDebit: entries.reduce((sum, entry) => sum + (entry.debitAccount ? entry.amountVND : 0), 0),
      totalCredit: entries.reduce((sum, entry) => sum + (entry.creditAccount ? entry.amountVND : 0), 0),
      uniqueAccounts,
    },
  };
}
