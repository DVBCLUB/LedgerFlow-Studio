import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type JournalEntry = {
  date: string;
  documentNumber: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  amountVND: number;
  currency: string;
  partner?: string;
  project?: string;
};

type ImportResult = {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: string[];
  entries: JournalEntry[];
  summary: {
    dateRange: { from: string; to: string };
    totalDebit: number;
    totalCredit: number;
    uniqueAccounts: string[];
  };
};

const KNOWN_ACCOUNT_PREFIXES = ['111', '112', '131', '133', '138', '141', '152', '153', '154', '156', '211', '214', '242', '331', '333', '334', '338', '341', '411', '421', '511', '515', '621', '622', '623', '627', '632', '635', '641', '642', '711', '811', '821', '911'];
const vnd = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

function isUnknownAccount(account: string) {
  if (!account) return true;
  return !KNOWN_ACCOUNT_PREFIXES.some((prefix) => account.startsWith(prefix));
}

function exportVasExcel(entries: JournalEntry[]) {
  const rows = entries.map((entry) => ({
    Ngày: entry.date,
    'Số chứng từ': entry.documentNumber,
    'Diễn giải': entry.description,
    'TK Nợ': entry.debitAccount,
    'TK Có': entry.creditAccount,
    'Số tiền': entry.amountVND,
    'Đối tượng': entry.partner || '',
    'Công trình/Dự án': entry.project || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'VAS Journal');
  XLSX.writeFile(wb, `ledgerflow-vas-journal-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function MISABridgeTab() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const totalsBalanced = useMemo(() => {
    if (!result) return true;
    return Math.abs(result.summary.totalDebit - result.summary.totalCredit) < 1;
  }, [result]);

  async function importFile(file: File) {
    setLoading(true);
    setError('');
    setSaved(false);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/accounting/misa-import', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import MISA thất bại.');
      setResult(data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function saveToWorkboard() {
    if (!result?.entries?.length) return;
    const key = 'ledgerflow_aiops_cards_v1';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const cards = result.entries.slice(0, 100).map((entry, index) => ({
      id: `misa-${Date.now()}-${index}`,
      title: `MISA ${entry.documentNumber || entry.date}: ${entry.description || 'Bút toán nhập từ MISA'}`,
      description: `Nợ ${entry.debitAccount} / Có ${entry.creditAccount} — ${vnd(entry.amountVND)}`,
      status: 'Planning',
      risk: isUnknownAccount(entry.debitAccount) || isUnknownAccount(entry.creditAccount) ? 'MED' : 'LOW',
      kind: 'Accounting',
      ai_staff: 'AI Accountant',
      createdAt: new Date().toISOString(),
      source: 'misa-bridge',
      metadata: entry,
    }));
    localStorage.setItem(key, JSON.stringify([...cards, ...current]));
    setSaved(true);
  }

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">GTM Critical</p>
        <h3 className="mt-1 text-xl font-black text-white">MISA Bridge</h3>
        <p className="mt-1 text-sm font-semibold text-slate-400">Import Excel Nhật ký chung/Sổ cái từ MISA → chuẩn hóa bút toán VAS để đưa vào LedgerFlow.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) importFile(file); }} />
          <button onClick={() => inputRef.current?.click()} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">Chọn file MISA Excel</button>
          {result?.entries?.length ? <button onClick={() => exportVasExcel(result.entries)} className="rounded-2xl border border-emerald-400/50 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10">Export Excel VAS</button> : null}
          {result?.entries?.length ? <button onClick={saveToWorkboard} className="rounded-2xl border border-amber-400/50 px-4 py-2 text-xs font-black text-amber-200 hover:bg-amber-400/10">Nhập vào LedgerFlow</button> : null}
          {fileName && <span className="text-xs font-bold text-slate-400">{fileName}</span>}
        </div>
      </div>

      {loading && <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-100">Đang đọc file MISA...</div>}
      {error && <div className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm font-bold text-rose-100">{error}</div>}
      {saved && <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">Đã tạo workboard cards từ dữ liệu MISA.</div>}

      {result && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Rows</p><p className="mt-1 text-2xl font-black text-white">{result.importedRows}</p></div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Date range</p><p className="mt-1 text-sm font-black text-white">{result.summary.dateRange.from || '—'} → {result.summary.dateRange.to || '—'}</p></div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Total Debit</p><p className="mt-1 text-lg font-black text-white">{vnd(result.summary.totalDebit)}</p></div>
            <div className={`rounded-3xl border p-4 ${totalsBalanced ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-rose-400/30 bg-rose-400/10'}`}><p className="text-[10px] font-black uppercase text-slate-400">Balance</p><p className="mt-1 text-sm font-black text-white">{totalsBalanced ? 'Cân Nợ/Có' : 'Lệch Nợ/Có'}</p></div>
          </div>

          {result.errors.length > 0 && <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">{result.errors.join(', ')}</div>}

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accounts</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.summary.uniqueAccounts.map((account) => <span key={account} className={`rounded-xl border px-2 py-1 text-[11px] font-black ${isUnknownAccount(account) ? 'border-amber-300 text-amber-200' : 'border-slate-700 text-slate-300'}`}>{account}</span>)}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70">
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="sticky top-0 bg-slate-900 text-slate-400">
                  <tr>{['Ngày', 'Số CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Số tiền', 'Đối tượng', 'Công trình'].map((head) => <th key={head} className="px-3 py-2 font-black uppercase">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {result.entries.slice(0, 300).map((entry, index) => (
                    <tr key={`${entry.documentNumber}-${index}`} className="border-t border-slate-800 odd:bg-slate-900/25">
                      <td className="px-3 py-2 text-slate-300">{entry.date}</td>
                      <td className="px-3 py-2 text-slate-300">{entry.documentNumber}</td>
                      <td className="max-w-[320px] px-3 py-2 text-slate-300">{entry.description}</td>
                      <td className={`px-3 py-2 font-black ${isUnknownAccount(entry.debitAccount) ? 'text-amber-200' : 'text-cyan-200'}`}>{entry.debitAccount}</td>
                      <td className={`px-3 py-2 font-black ${isUnknownAccount(entry.creditAccount) ? 'text-amber-200' : 'text-emerald-200'}`}>{entry.creditAccount}</td>
                      <td className="px-3 py-2 text-right font-black text-white">{vnd(entry.amountVND)}</td>
                      <td className="px-3 py-2 text-slate-400">{entry.partner}</td>
                      <td className="px-3 py-2 text-slate-400">{entry.project}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
