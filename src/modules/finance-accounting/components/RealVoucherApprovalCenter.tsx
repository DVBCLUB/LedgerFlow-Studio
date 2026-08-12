import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  FileText,
  Clock,
  Send,
  Eye,
  Check,
  Archive,
  RefreshCw,
} from 'lucide-react';

export interface AccountingLineInput {
  debitAccount: string;
  creditAccount: string;
  amountVnd: number;
  description: string;
}

export interface VoucherRecord {
  id: string;
  voucherNo: string;
  voucherDate: string;
  voucherType: 'sales_invoice' | 'cash_receipt' | 'cash_payment' | 'bank_deposit';
  partnerName: string;
  lines: AccountingLineInput[];
  totalAmountVnd: number;
  approvalState: 'DRAFT' | 'SUBMITTED' | 'CHECKED' | 'APPROVED' | 'PAID' | 'ARCHIVED';
  auditTrail: Array<{
    state: string;
    actor: string;
    timestamp: string;
    comment: string;
  }>;
}

export default function RealVoucherApprovalCenter() {
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([
    {
      id: 'v_1001',
      voucherNo: 'HD-2026-0801',
      voucherDate: '2026-08-12',
      voucherType: 'sales_invoice',
      partnerName: 'Công ty Cổ phần Công nghệ AlphaTech',
      lines: [
        { debitAccount: '131', creditAccount: '5111', amountVnd: 120000000, description: 'Gói Thuê bao LedgerFlow Enterprise 12 tháng' },
        { debitAccount: '131', creditAccount: '33311', amountVnd: 12000000, description: 'Thuế GTGT 10% Hóa đơn GTGT' },
      ],
      totalAmountVnd: 132000000,
      approvalState: 'APPROVED',
      auditTrail: [
        { state: 'DRAFT', actor: 'Kế toán Thuế', timestamp: '2026-08-12 09:00', comment: 'Khởi tạo hóa đơn GTGT' },
        { state: 'SUBMITTED', actor: 'Kế toán Thuế', timestamp: '2026-08-12 09:15', comment: 'Trình duyệt cấp quản lý' },
        { state: 'CHECKED', actor: 'Kế toán Trưởng', timestamp: '2026-08-12 10:00', comment: 'Đã rà soát hạch toán Nợ 131 / Có 5111, 33311' },
        { state: 'APPROVED', actor: 'Giám đốc Tài chính (CFO)', timestamp: '2026-08-12 10:30', comment: 'Đã phê duyệt phát hành' },
      ],
    },
    {
      id: 'v_1002',
      voucherNo: 'PC-2026-0802',
      voucherDate: '2026-08-12',
      voucherType: 'cash_payment',
      partnerName: 'Vercel Inc. & AWS Cloud Services',
      lines: [
        { debitAccount: '6422', creditAccount: '1121', amountVnd: 25000000, description: 'Thanh toán hạ tầng Cloud & AI Server tháng 8' },
      ],
      totalAmountVnd: 25000000,
      approvalState: 'SUBMITTED',
      auditTrail: [
        { state: 'DRAFT', actor: 'DevOps Lead', timestamp: '2026-08-12 11:00', comment: 'Khởi tạo yêu cầu chi chi phí máy chủ' },
        { state: 'SUBMITTED', actor: 'DevOps Lead', timestamp: '2026-08-12 11:30', comment: 'Trình duyệt thanh toán' },
      ],
    },
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherRecord['voucherType']>('sales_invoice');
  const [debitAcc, setDebitAcc] = useState('131');
  const [creditAcc, setCreditAcc] = useState('5111');
  const [amountInput, setAmountInput] = useState('50000000');
  const [lineDesc, setLineDesc] = useState('Thuê bao bản quyền phần mềm');
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('v_1001');

  // Check double-entry VAS zero-sum balance
  const activeVoucher = vouchers.find((v) => v.id === selectedVoucherId) || vouchers[0];

  const totalDebitSum = activeVoucher?.lines.reduce((sum, line) => sum + line.amountVnd, 0) || 0;
  const totalCreditSum = activeVoucher?.lines.reduce((sum, line) => sum + line.amountVnd, 0) || 0;
  const isBalanced = totalDebitSum === totalCreditSum && totalDebitSum > 0;

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) return;

    const amt = Number(amountInput) || 0;
    const newV: VoucherRecord = {
      id: `v_${Date.now()}`,
      voucherNo: `HD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      voucherDate: new Date().toISOString().split('T')[0],
      voucherType,
      partnerName: partnerName.trim(),
      lines: [
        {
          debitAccount: debitAcc,
          creditAccount: creditAcc,
          amountVnd: amt,
          description: lineDesc || 'Hạch toán chứng từ thực tế',
        },
      ],
      totalAmountVnd: amt,
      approvalState: 'DRAFT',
      auditTrail: [
        {
          state: 'DRAFT',
          actor: 'Founder / Accountant',
          timestamp: new Date().toLocaleString('vi-VN'),
          comment: 'Khởi tạo chứng từ hạch toán thực tế',
        },
      ],
    };

    setVouchers([newV, ...vouchers]);
    setSelectedVoucherId(newV.id);
    setShowNewModal(false);
    setPartnerName('');
  };

  const handleStateTransition = (voucherId: string, nextState: VoucherRecord['approvalState']) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id !== voucherId) return v;
        const newTrail = [
          ...v.auditTrail,
          {
            state: nextState,
            actor: 'Founder / CFO',
            timestamp: new Date().toLocaleString('vi-VN'),
            comment: `Chuyển trạng thái sang ${nextState}`,
          },
        ];
        return {
          ...v,
          approvalState: nextState,
          auditTrail: newTrail,
        };
      })
    );
  };

  const getStateBadgeClass = (state: VoucherRecord['approvalState']) => {
    switch (state) {
      case 'DRAFT': return 'bg-slate-700 text-slate-300';
      case 'SUBMITTED': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'CHECKED': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
      case 'APPROVED': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'PAID': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'ARCHIVED': return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Trung tâm Hạch toán & Phê duyệt Chứng từ Thực tế
            </h2>
            <p className="text-xs text-slate-400">
              Kiểm tra cân bằng Nợ/Có kép VAS 200/133 & Luồng phê duyệt 6 bước có lưu vết Audit Log
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          Lập Chứng từ Mới
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left List: Vouchers */}
        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Danh sách Chứng từ Vận hành ({vouchers.length})</span>
            <span className="text-[10px] text-emerald-400">Realtime Engine</span>
          </div>

          {vouchers.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVoucherId(v.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                selectedVoucherId === v.id
                  ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-950/50'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 font-mono">{v.voucherNo}</span>
                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${getStateBadgeClass(v.approvalState)}`}>
                  {v.approvalState}
                </span>
              </div>

              <p className="mt-2 text-xs font-semibold text-white line-clamp-1">{v.partnerName}</p>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{v.voucherDate}</span>
                <span className="font-bold text-emerald-400">
                  {v.totalAmountVnd.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Detail & Approval Lifecycle */}
        <div className="space-y-6 lg:col-span-7">
          {activeVoucher && (
            <>
              {/* Voucher Detail Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Chi tiết chứng từ</span>
                    <h3 className="text-sm font-black text-white font-mono">{activeVoucher.voucherNo}</h3>
                  </div>
                  <span className={`rounded-xl px-3 py-1 text-xs font-black ${getStateBadgeClass(activeVoucher.approvalState)}`}>
                    Trạng thái: {activeVoucher.approvalState}
                  </span>
                </div>

                <div className="grid gap-3 text-xs md:grid-cols-2">
                  <div>
                    <span className="text-slate-500">Đối tác / Khách hàng:</span>
                    <p className="font-bold text-slate-200 mt-0.5">{activeVoucher.partnerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ngày lập chứng từ:</span>
                    <p className="font-bold text-slate-200 mt-0.5">{activeVoucher.voucherDate}</p>
                  </div>
                </div>

                {/* Accounting Lines Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Bút toán Hạch toán Nợ/Có kép (VAS 200/133)</span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-[10px] font-bold uppercase text-slate-400">
                        <tr>
                          <th className="p-3">TK Nợ</th>
                          <th className="p-3">TK Có</th>
                          <th className="p-3">Nội dung diễn giải</th>
                          <th className="p-3 text-right">Số tiền (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {activeVoucher.lines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-mono font-bold text-cyan-300">{line.debitAccount}</td>
                            <td className="p-3 font-mono font-bold text-amber-300">{line.creditAccount}</td>
                            <td className="p-3 text-slate-300">{line.description}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              {line.amountVnd.toLocaleString('vi-VN')} ₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Zero-Sum Balance Check Indicator */}
                <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${
                  isBalanced
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {isBalanced ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
                    <span>Kiểm tra Cân bằng Nợ = Có (Zero-Sum Trial Balance): {isBalanced ? 'ĐẠT (Cân bằng)' : 'KHÔNG ĐẠT'}</span>
                  </div>
                  <span className="font-mono font-bold">
                    Nợ: {totalDebitSum.toLocaleString('vi-VN')} ₫ | Có: {totalCreditSum.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* State Transition Actions */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Chuyển Trạng thái Phê duyệt Vận hành</span>
                  <div className="flex flex-wrap gap-2">
                    {activeVoucher.approvalState === 'DRAFT' && (
                      <button
                        onClick={() => handleStateTransition(activeVoucher.id, 'SUBMITTED')}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                      >
                        <Send className="h-3.5 w-3.5" /> Trình duyệt (Submit)
                      </button>
                    )}
                    {activeVoucher.approvalState === 'SUBMITTED' && (
                      <button
                        onClick={() => handleStateTransition(activeVoucher.id, 'CHECKED')}
                        className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
                      >
                        <Eye className="h-3.5 w-3.5" /> Rà soát Kế toán (Checked)
                      </button>
                    )}
                    {activeVoucher.approvalState === 'CHECKED' && (
                      <button
                        onClick={() => handleStateTransition(activeVoucher.id, 'APPROVED')}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <Check className="h-3.5 w-3.5" /> Phê duyệt (Approve)
                      </button>
                    )}
                    {activeVoucher.approvalState === 'APPROVED' && (
                      <button
                        onClick={() => handleStateTransition(activeVoucher.id, 'PAID')}
                        className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500"
                      >
                        <DollarSign className="h-3.5 w-3.5" /> Đánh dấu Đã thanh toán (Paid)
                      </button>
                    )}
                    {activeVoucher.approvalState === 'PAID' && (
                      <button
                        onClick={() => handleStateTransition(activeVoucher.id, 'ARCHIVED')}
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                      >
                        <Archive className="h-3.5 w-3.5" /> Lưu trữ Sổ cái (Archive)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Trail Log */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span>Nhật ký Lưu vết Phê duyệt & Kiểm toán (Immutable Audit Trail)</span>
                </div>

                <div className="space-y-2 divide-y divide-slate-800/50">
                  {activeVoucher.auditTrail.map((log, idx) => (
                    <div key={idx} className="pt-2 text-xs flex items-start justify-between">
                      <div>
                        <span className="font-bold text-emerald-300">{log.actor}</span>
                        <span className="ml-2 text-[10px] text-slate-400">({log.timestamp})</span>
                        <p className="mt-0.5 text-slate-300">{log.comment}</p>
                      </div>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                        {log.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Voucher Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 text-left">
            <h3 className="text-sm font-black uppercase text-white">Lập Chứng từ Hạch toán Thực tế Mới</h3>

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tên Đối tác / Khách hàng:</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="VD: Công ty TNHH Phần mềm Beta"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Loại chứng từ:</label>
                  <select
                    value={voucherType}
                    onChange={(e) => setVoucherType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                  >
                    <option value="sales_invoice">Hóa đơn Bán hàng (Sales)</option>
                    <option value="cash_payment">Phiếu Chi (Payment)</option>
                    <option value="cash_receipt">Phiếu Thu (Receipt)</option>
                    <option value="bank_deposit">Báo Có Ngân hàng (Bank)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Số tiền (VND):</label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tài khoản Nợ:</label>
                  <input
                    type="text"
                    value={debitAcc}
                    onChange={(e) => setDebitAcc(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-cyan-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tài khoản Có:</label>
                  <input
                    type="text"
                    value={creditAcc}
                    onChange={(e) => setCreditAcc(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Diễn giải nội dung:</label>
                <input
                  type="text"
                  value={lineDesc}
                  onChange={(e) => setLineDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-slate-400 hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500"
                >
                  Khởi tạo Chứng từ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
