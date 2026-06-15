import { useMemo, useState } from 'react';
import { downloadPDF, generateBalanceSheet, generateIncomeStatement } from '../../../utils/pdfReportGenerator';

type BalanceRow = { code: string; name: string; currentYear: number; prevYear: number };
type IncomeRow = { code: string; name: string; currentPeriod: number; prevPeriod: number };
type ReportType = 'balance' | 'income';

const balanceSample: {
  companyName: string;
  period: string;
  assets: BalanceRow[];
  liabilities: BalanceRow[];
  equity: BalanceRow[];
} = {
  companyName: 'LedgerFlow Company',
  period: 'Năm 2026',
  assets: [
    { code: '110', name: 'Tiền và các khoản tương đương tiền', currentYear: 120000000, prevYear: 90000000 },
    { code: '131', name: 'Phải thu khách hàng', currentYear: 80000000, prevYear: 50000000 },
  ],
  liabilities: [{ code: '331', name: 'Phải trả người bán', currentYear: 40000000, prevYear: 30000000 }],
  equity: [{ code: '411', name: 'Vốn chủ sở hữu', currentYear: 160000000, prevYear: 110000000 }],
};

const incomeSample: {
  companyName: string;
  period: string;
  items: IncomeRow[];
} = {
  companyName: 'LedgerFlow Company',
  period: 'Quý II/2026',
  items: [
    { code: '01', name: 'Doanh thu bán hàng và cung cấp dịch vụ', currentPeriod: 250000000, prevPeriod: 180000000 },
    { code: '11', name: 'Giá vốn hàng bán', currentPeriod: 120000000, prevPeriod: 95000000 },
    { code: '20', name: 'Lợi nhuận gộp', currentPeriod: 130000000, prevPeriod: 85000000 },
  ],
};

function parseRows<T>(rowsText: string): T[] {
  try {
    const parsed = JSON.parse(rowsText);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export default function PDFReportTab() {
  const [reportType, setReportType] = useState<ReportType>('balance');
  const [companyName, setCompanyName] = useState('LedgerFlow Company');
  const [period, setPeriod] = useState('Năm 2026');
  const [rowsText, setRowsText] = useState(JSON.stringify(balanceSample.assets, null, 2));

  const balanceRows = useMemo(() => parseRows<BalanceRow>(rowsText), [rowsText]);
  const incomeRows = useMemo(() => parseRows<IncomeRow>(rowsText), [rowsText]);
  const previewRows = reportType === 'balance' ? balanceRows : incomeRows;

  function handleType(type: string) {
    const nextType: ReportType = type === 'income' ? 'income' : 'balance';
    setReportType(nextType);
    if (nextType === 'balance') {
      setCompanyName(balanceSample.companyName);
      setPeriod(balanceSample.period);
      setRowsText(JSON.stringify(balanceSample.assets, null, 2));
    } else {
      setCompanyName(incomeSample.companyName);
      setPeriod(incomeSample.period);
      setRowsText(JSON.stringify(incomeSample.items, null, 2));
    }
  }

  function exportPdf() {
    const blob = reportType === 'balance'
      ? generateBalanceSheet({ ...balanceSample, companyName, period, assets: balanceRows })
      : generateIncomeStatement({ companyName, period, items: incomeRows });
    downloadPDF(blob, `${reportType === 'balance' ? 'bang-can-doi' : 'ket-qua-kinh-doanh'}.pdf`);
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">PDF Report Engine</p>
          <h3 className="mt-1 text-xl font-black text-white">Xuất báo cáo PDF</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">Tạo PDF A4 bằng jsPDF: Bảng cân đối kế toán hoặc KQKD, dùng dữ liệu mẫu editable.</p>
        </div>
        <button onClick={exportPdf} className="rounded-2xl bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">Xuất PDF</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loại báo cáo</span>
          <select value={reportType} onChange={(e) => handleType(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            <option value="balance">Bảng cân đối kế toán</option>
            <option value="income">Kết quả kinh doanh</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tên công ty</span>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kỳ kế toán</span>
          <input value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <textarea value={rowsText} onChange={(e) => setRowsText(e.target.value)} rows={16} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200" />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm font-black text-white">Preview</p>
          <p className="mt-2 text-xs text-slate-400">{companyName} — {period}</p>
          <p className="mt-1 text-xs text-slate-400">Số dòng: {previewRows.length}</p>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto">
            {previewRows.map((row, index) => (
              <div key={`${row.code}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
                <b className="text-cyan-200">{row.code}</b> — {row.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
