import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type JournalEntry = {
  date: string;
  documentNumber: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amountVND: number;
};

type ImportSummary = {
  dateRange?: { from?: string; to?: string };
  uniqueAccounts?: string[];
};

type ImportResult = {
  success: boolean;
  errors?: string[];
  entries?: JournalEntry[];
  summary?: ImportSummary;
  totalRows?: number;
  importedRows?: number;
};

function normalizeImportResult(raw: unknown): ImportResult {
  if (!raw || typeof raw !== 'object') return { success: false, errors: ['Invalid import response.'] };
  const value = raw as Partial<ImportResult>;
  return {
    success: Boolean(value.success),
    errors: Array.isArray(value.errors) ? value.errors.map(String) : [],
    entries: Array.isArray(value.entries)
      ? value.entries.map((entry) => {
        const row = entry as Partial<JournalEntry>;
        return {
          date: String(row.date || ''),
          documentNumber: String(row.documentNumber || ''),
          description: String(row.description || ''),
          debitAccount: String(row.debitAccount || ''),
          creditAccount: String(row.creditAccount || ''),
          amountVND: Number(row.amountVND || 0),
        };
      })
      : [],
    summary: value.summary || {},
    totalRows: Number(value.totalRows || 0),
    importedRows: Number(value.importedRows || 0),
  };
}

export default function MISABridgeTab() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function upload(file: File) {
    setFileName(file.name);
    setLoading(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/accounting/misa-import', { method: 'POST', body });
      const json = await response.json();
      setResult(normalizeImportResult(json));
    } catch (error) {
      setResult({ success: false, errors: [error instanceof Error ? error.message : String(error)] });
    } finally {
      setLoading(false);
    }
  }

  function exportEntries() {
    const entries = result?.entries || [];
    const sheet = XLSX.utils.json_to_sheet(entries.map((entry) => ({
      Ngay: entry.date,
      SoCT: entry.documentNumber,
      DienGiai: entry.description,
      TKNợ: entry.debitAccount,
      TKCó: entry.creditAccount,
      SoTien: entry.amountVND,
    })));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'VAS Journal');
    XLSX.writeFile(book, 'ledgerflow-vas-journal.xlsx');
  }

  const entries = result?.entries || [];
  const accounts = result?.summary?.uniqueAccounts || [];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Import Bridge</p>
          <h3 className="mt-1 text-xl font-black text-white">MISA / Excel Bridge</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">Connector nhập file Excel Nhật ký chung/Sổ cái để chuyển thành bút toán VAS trong Company OS.</p>
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          <button onClick={() => inputRef.current?.click()} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">Upload Excel</button>
          <button disabled={!entries.length} onClick={exportEntries} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-200 disabled:opacity-40">Export VAS</button>
        </div>
      </div>

      {fileName && <p className="mt-3 text-xs font-bold text-slate-400">File: {fileName} {loading ? '— đang import...' : ''}</p>}
      {result?.errors?.length ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-950/30 p-3 text-xs text-rose-100">{result.errors.join(' | ')}</div> : null}

      {result && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.35fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-black text-white">Summary</p>
            <p className="mt-2 text-xs text-slate-400">Status: {result.success ? 'OK' : 'Needs review'}</p>
            <p className="text-xs text-slate-400">Rows: {result.importedRows || entries.length || 0}</p>
            <p className="text-xs text-slate-400">Date: {result.summary?.dateRange?.from || '-'} → {result.summary?.dateRange?.to || '-'}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Accounts</p>
            <div className="mt-2 flex flex-wrap gap-1">{accounts.slice(0, 40).map((account) => <span key={account} className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-cyan-100">{account}</span>)}</div>
          </div>
          <div className="overflow-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400"><tr><th className="p-2">Ngày</th><th className="p-2">Số CT</th><th className="p-2">Diễn giải</th><th className="p-2">Nợ</th><th className="p-2">Có</th><th className="p-2 text-right">Số tiền</th></tr></thead>
              <tbody>
                {entries.slice(0, 100).map((entry, index) => (
                  <tr key={`${entry.date}-${entry.documentNumber}-${index}`} className="border-t border-slate-800 text-slate-200"><td className="p-2">{entry.date}</td><td className="p-2">{entry.documentNumber}</td><td className="p-2">{entry.description}</td><td className="p-2 text-cyan-200">{entry.debitAccount}</td><td className="p-2 text-amber-200">{entry.creditAccount}</td><td className="p-2 text-right">{Number(entry.amountVND || 0).toLocaleString('vi-VN')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
