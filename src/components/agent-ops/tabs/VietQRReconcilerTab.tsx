import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type BankTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  bank?: string;
  accountNo?: string;
};

type JournalEntry = {
  transactionId: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  vatAmount?: number;
  vatAccount?: string;
  category: string;
  confidence: number;
  needsReview: boolean;
  notes?: string;
};

type ReconcileStats = {
  total: number;
  autoClassified: number;
  needsReview: number;
  totalDebit: number;
  totalCredit: number;
};

type ReconcileResult = {
  entries: JournalEntry[];
  stats: ReconcileStats;
};

const sampleCsv = `date,description,amount,balance,bank,accountNo
2026-06-01,KH A thanh toan dich vu thang 6,5500000,15500000,VCB,0123456789
2026-06-02,Nop thue GTGT quy 2,-1200000,14300000,VCB,0123456789
2026-06-03,Thanh toan luong nhan vien thang 6,-8000000,6300000,VCB,0123456789
2026-06-04,FPT internet van phong,-330000,5970000,VCB,0123456789`;

function money(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0) + ' ₫';
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  const text = String(value ?? '').trim();
  if (!text) return new Date().toISOString().slice(0, 10);
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
  return text.slice(0, 10);
}

function rowToTransaction(row: Record<string, unknown>, index: number): BankTransaction {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  const debit = parseNumber(normalized.debit ?? normalized.withdrawal ?? normalized.chi ?? normalized.tien_ra);
  const credit = parseNumber(normalized.credit ?? normalized.deposit ?? normalized.thu ?? normalized.tien_vao);
  const signedAmount = parseNumber(normalized.amount ?? normalized.so_tien ?? normalized.sotien);
  const amount = signedAmount || (credit ? Math.abs(credit) : debit ? -Math.abs(debit) : 0);

  return {
    id: String(normalized.id ?? normalized.transaction_id ?? `txn-${Date.now()}-${index}`),
    date: normalizeDate(normalized.date ?? normalized.ngay ?? normalized.transaction_date),
    description: String(normalized.description ?? normalized.noi_dung ?? normalized.content ?? normalized.memo ?? '').trim(),
    amount,
    balance: parseNumber(normalized.balance ?? normalized.so_du ?? normalized.sodu),
    bank: String(normalized.bank ?? normalized.ngan_hang ?? '').trim() || undefined,
    accountNo: String(normalized.accountno ?? normalized.account_no ?? normalized.tai_khoan ?? '').trim() || undefined,
  };
}

function parseCsvText(text: string): BankTransaction[] {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map(rowToTransaction).filter((txn) => txn.description || txn.amount !== 0);
}

function confidenceLabel(value: number) {
  if (value >= 0.8) return 'Cao';
  if (value >= 0.5) return 'Vừa';
  return 'Thấp';
}

function confidenceClass(entry: JournalEntry) {
  if (entry.needsReview || entry.confidence < 0.5) return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  if (entry.confidence >= 0.8) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100';
}

export default function VietQRReconcilerTab() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState(sampleCsv);
  const [transactions, setTransactions] = useState<BankTransaction[]>(() => parseCsvText(sampleCsv));
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewTotals = useMemo(() => {
    return transactions.reduce(
      (acc, txn) => {
        if (txn.amount > 0) acc.inbound += txn.amount;
        if (txn.amount < 0) acc.outbound += Math.abs(txn.amount);
        return acc;
      },
      { inbound: 0, outbound: 0 },
    );
  }, [transactions]);

  function handleParseText() {
    try {
      const parsed = parseCsvText(csvText);
      setTransactions(parsed);
      setResult(null);
      setError(parsed.length ? '' : 'Không đọc được dòng giao dịch nào. Cần cột date, description, amount, balance hoặc debit/credit.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được CSV.');
    }
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    setError('');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    const parsed = rows.map(rowToTransaction).filter((txn) => txn.description || txn.amount !== 0);
    setTransactions(parsed);
    setCsvText(XLSX.utils.sheet_to_csv(sheet));
    setResult(null);
    if (!parsed.length) setError('File đã upload nhưng chưa đọc được giao dịch hợp lệ.');
  }

  async function handleReconcile() {
    if (!transactions.length) {
      setError('Chưa có giao dịch để reconcile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/accounting/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Reconcile thất bại.');
      setResult(data.result || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconcile thất bại.');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!result?.entries.length) return;
    const rows = result.entries.map((entry) => ({
      'Ngày': entry.date,
      'Mô tả': entry.description,
      'TK Nợ': entry.debitAccount,
      'TK Có': entry.creditAccount,
      'Số tiền': entry.amount,
      'VAT': entry.vatAmount || 0,
      'TK VAT': entry.vatAccount || '',
      'Nhóm': entry.category,
      'Confidence': Math.round(entry.confidence * 100) + '%',
      'Cần review': entry.needsReview ? 'Có' : 'Không',
      'Ghi chú': entry.notes || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VietQR Journal');
    XLSX.writeFile(workbook, `vietqr_reconcile_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Accounting Automation</p>
            <h3 className="mt-1 text-2xl font-black text-white">VietQR Bank Reconciliation</h3>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Paste hoặc upload sao kê CSV/XLSX, hệ thống tự bóc tách nội dung chuyển khoản và gợi ý định khoản VAS. Dòng vàng là cần kế toán review thủ công.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300">Upload CSV/XLSX</button>
            <button onClick={handleReconcile} disabled={loading || !transactions.length} className="rounded-2xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-40">{loading ? 'Đang reconcile...' : 'Reconcile'}</button>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => void handleUpload(event.target.files?.[0])} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Nguồn sao kê</p>
            <button onClick={handleParseText} className="rounded-xl border border-slate-700 px-3 py-1.5 text-[11px] font-black text-slate-300 hover:border-cyan-300">Đọc lại nội dung paste</button>
          </div>
          <textarea
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            rows={12}
            className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-cyan-400"
            placeholder="date,description,amount,balance"
          />
          {error && <p className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs font-bold text-rose-100">{error}</p>}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm font-black text-white">Preview</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Dòng</p><p className="mt-1 text-lg font-black text-white">{transactions.length}</p></div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3"><p className="text-[10px] font-black uppercase text-emerald-300">Thu</p><p className="mt-1 text-sm font-black text-emerald-100">{money(previewTotals.inbound)}</p></div>
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3"><p className="text-[10px] font-black uppercase text-rose-300">Chi</p><p className="mt-1 text-sm font-black text-rose-100">{money(previewTotals.outbound)}</p></div>
          </div>
          <div className="mt-3 max-h-80 overflow-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 text-slate-400"><tr><th className="p-2">Ngày</th><th className="p-2">Nội dung</th><th className="p-2 text-right">Số tiền</th></tr></thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-t border-slate-800 text-slate-300">
                    <td className="p-2 whitespace-nowrap">{txn.date}</td>
                    <td className="p-2">{txn.description}</td>
                    <td className={`p-2 text-right font-bold ${txn.amount >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>{money(txn.amount)}</td>
                  </tr>
                ))}
                {!transactions.length && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Chưa có giao dịch.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">Kết quả định khoản</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Tổng {result.stats.total} · Tự động {result.stats.autoClassified} · Cần review {result.stats.needsReview}</p>
            </div>
            <button onClick={handleExport} className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20">Export Excel</button>
          </div>
          <div className="mt-4 overflow-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="bg-slate-900 text-slate-400">
                <tr><th className="p-2">Ngày</th><th className="p-2">Mô tả</th><th className="p-2">Nợ</th><th className="p-2">Có</th><th className="p-2 text-right">Số tiền</th><th className="p-2">Nhóm</th><th className="p-2">Confidence</th><th className="p-2">Ghi chú</th></tr>
              </thead>
              <tbody>
                {result.entries.map((entry) => (
                  <tr key={entry.transactionId} className={`border-t border-slate-800 ${entry.needsReview ? 'bg-amber-400/5' : ''}`}>
                    <td className="p-2 text-slate-300 whitespace-nowrap">{entry.date}</td>
                    <td className="p-2 text-slate-200">{entry.description}</td>
                    <td className="p-2 font-black text-cyan-200">{entry.debitAccount}</td>
                    <td className="p-2 font-black text-violet-200">{entry.creditAccount}</td>
                    <td className="p-2 text-right font-black text-white">{money(entry.amount)}</td>
                    <td className="p-2 text-slate-300">{entry.category}</td>
                    <td className="p-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${confidenceClass(entry)}`}>{confidenceLabel(entry.confidence)} · {Math.round(entry.confidence * 100)}%</span></td>
                    <td className="p-2 text-slate-400">{entry.notes || (entry.needsReview ? 'Cần kiểm tra chứng từ đối ứng.' : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
