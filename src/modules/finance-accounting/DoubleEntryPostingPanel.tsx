import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Plus, RefreshCw, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import {
  listPostedVouchers,
  postVoucher,
  type PostingVoucher,
  type JournalLine,
  type VoucherType,
} from '../../utils/accountingPostApi';

const VOUCHER_TYPES: { value: VoucherType; label: string }[] = [
  { value: 'CASH_RECEIPT', label: 'Thu tiền mặt (111)' },
  { value: 'CASH_PAYMENT', label: 'Chi tiền mặt (111)' },
  { value: 'BANK_DEPOSIT', label: 'Nộp tiền NH (112)' },
  { value: 'BANK_WITHDRAWAL', label: 'Chi tiền NH (112)' },
  { value: 'SALES_INVOICE', label: 'Hóa đơn bán hàng (511/131)' },
  { value: 'PURCHASE_INVOICE', label: 'Hóa đơn mua vào (331)' },
  { value: 'ADVANCE_SETTLEMENT', label: 'Quyết toán tạm ứng (141)' },
  { value: 'GENERAL_JOURNAL', label: 'Bút toán chung' },
];

function fmtVND(n: number) { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function DoubleEntryPostingPanel() {
  const [vouchers, setVouchers] = useState<PostingVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ isBalanced: boolean; totalDebit: number; totalCredit: number; error?: string } | null>(null);
  const [voucherType, setVoucherType] = useState<VoucherType>('SALES_INVOICE');
  const [voucherNo, setVoucherNo] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { accountCode: '131', accountName: 'Phải thu khách hàng', debitAmount: 0, creditAmount: 0 },
    { accountCode: '5111', accountName: 'Doanh thu bán hàng', debitAmount: 0, creditAmount: 0 },
    { accountCode: '33311', accountName: 'Thuế GTGT đầu ra', debitAmount: 0, creditAmount: 0 },
  ]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setVouchers(await listPostedVouchers());
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const submit = async () => {
    try {
      const res = await postVoucher({
        voucherNo: voucherNo || `CT-${Date.now()}`,
        voucherType,
        partnerName: partnerName || undefined,
        lines: lines.filter((l) => l.accountCode.trim() && (l.debitAmount > 0 || l.creditAmount > 0)),
      });
      setResult({ isBalanced: res.isBalanced, totalDebit: res.totalDebit, totalCredit: res.totalCredit, error: res.error });
      if (res.success) {
        setVoucherNo('');
        setPartnerName('');
        void refresh();
      }
    } catch (e: any) {
      setResult({ isBalanced: false, totalDebit: 0, totalCredit: 0, error: String(e?.message ?? e) });
    }
  };

  return (
    <div className="space-y-5 text-left text-white">
      {/* Posting form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-black flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /> Lập bút toán kép (VAS 200/133)</h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <select value={voucherType} onChange={(e) => setVoucherType(e.target.value as VoucherType)} className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs outline-none">
            {VOUCHER_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="Số chứng từ (để trống = tự sinh)" className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs outline-none" />
          <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Đối tác (khách hàng/NCC)" className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs outline-none" />
        </div>

        <div className="space-y-1.5">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={l.accountCode} onChange={(e) => setLines((p) => p.map((x, j) => (j === i ? { ...x, accountCode: e.target.value } : x)))} placeholder="TK" className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none" />
              <input value={l.accountName} onChange={(e) => setLines((p) => p.map((x, j) => (j === i ? { ...x, accountName: e.target.value } : x)))} placeholder="Diễn giải" className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none" />
              <input type="number" value={l.debitAmount || ''} onChange={(e) => setLines((p) => p.map((x, j) => (j === i ? { ...x, debitAmount: Number(e.target.value) } : x)))} placeholder="Nợ" className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none" />
              <input type="number" value={l.creditAmount || ''} onChange={(e) => setLines((p) => p.map((x, j) => (j === i ? { ...x, creditAmount: Number(e.target.value) } : x)))} placeholder="Có" className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none" />
              <button onClick={() => setLines((p) => p.filter((_, j) => j !== i))} className="p-1.5 text-slate-600 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setLines((p) => [...p, { accountCode: '', accountName: '', debitAmount: 0, creditAmount: 0 }])} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"><Plus className="w-3.5 h-3.5" /> Thêm dòng</button>
          <button onClick={submit} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-black cursor-pointer">Hạch toán</button>
        </div>

        {result && (
          <div className={`rounded-lg border p-3 text-xs ${result.isBalanced ? 'border-emerald-800/40 bg-emerald-950/20' : 'border-rose-800/40 bg-rose-950/20'}`}>
            {result.error ? (
              <p className="text-rose-300 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {result.error}</p>
            ) : result.isBalanced ? (
              <p className="text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Cân đối: Nợ {fmtVND(result.totalDebit)} = Có {fmtVND(result.totalCredit)}</p>
            ) : (
              <p className="text-rose-300 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> KHÔNG cân đối: Nợ {fmtVND(result.totalDebit)} ≠ Có {fmtVND(result.totalCredit)}</p>
            )}
          </div>
        )}
      </div>

      {/* Posted vouchers list */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black">Chứng từ đã hạch toán ({vouchers.length})</h3>
          <button onClick={() => void refresh()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">Đang tải...</p>
        ) : vouchers.length === 0 ? (
          <p className="text-xs text-slate-500">Chưa có chứng từ nào.</p>
        ) : (
          <div className="space-y-2">
            {vouchers.map((v) => (
              <div key={v.voucherId} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300">{v.voucherNo}</span>
                  <span className="text-[10px] text-slate-400">{v.voucherType} · {v.status}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{v.partnerName || '—'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{v.lines.length} dòng · {fmtVND(v.totalAmount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
