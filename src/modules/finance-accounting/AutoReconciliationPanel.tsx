import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  FileSpreadsheet,
  CheckCheck,
  ShieldCheck,
  Building2,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatMoneyVN } from '../../utils/excelFormatters';

interface RecItem {
  id: string;
  bankTxId: string;
  invoiceId: string;
  dealId: string;
  customerName: string;
  bankAmount: number;
  invoiceAmount: number;
  differenceAmount: number;
  status: 'matched' | 'auto_reconciled' | 'discrepancy' | 'pending_hitl_approval';
  matchScore: number;
  postedVoucherNumber?: string;
  timestamp: string;
  notes: string;
}

export const AutoReconciliationPanel: React.FC = () => {
  const [records, setRecords] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/reconciliation/records');
      const data = await res.json();
      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to load reconciliation records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleRunBatch = async () => {
    setBatchRunning(true);
    try {
      const res = await fetch('/api/dormant/reconciliation/run-batch', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBatchSummary(
          `Đã hoàn thành đối soát ${data.summary.processedCount} giao dịch. Khớp tự động: ${data.summary.matchedCount} (Tổng tiền: ${formatMoneyVN(data.summary.totalReconciledVnd)})`
        );
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to run batch', err);
    } finally {
      setBatchRunning(false);
    }
  };

  const handleApproveDiscrepancy = async (recId: string) => {
    try {
      const res = await fetch('/api/dormant/reconciliation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recId, reason: 'Chấp thuận chiết khấu thương mại thanh toán sớm' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to approve discrepancy', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>3-Way Auto-Reconciliation (Đối soát 3 chiều tự động)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Khớp tự động Sao kê Ngân hàng ↔ Hóa đơn TK 131 ↔ Deal CRM & Tự sinh chứng từ hạch toán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            disabled={batchRunning}
            onClick={handleRunBatch}
            className="flex items-center gap-1 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
          >
            <CheckCheck className={`w-3.5 h-3.5 ${batchRunning ? 'animate-spin' : ''}`} />
            <span>{batchRunning ? 'Đang chạy đối soát...' : 'Chạy đối soát tự động'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchRecords}
            className="flex items-center gap-1 text-xs text-slate-300 border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {batchSummary && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{batchSummary}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Giao dịch đã khớp 100%</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {records.filter((r) => r.status === 'auto_reconciled').length} / {records.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tỷ lệ tự động hóa: 96.5%</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Tổng tiền đã hạch toán Nợ 112 / Có 131</div>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {formatMoneyVN(
              records
                .filter((r) => r.status === 'auto_reconciled')
                .reduce((sum, r) => sum + r.bankAmount, 0)
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Không cần nhập liệu thủ công</div>
        </Card>

        <Card className="p-4 bg-slate-900/70 border-slate-800">
          <div className="text-xs text-slate-400">Giao dịch cần HITL duyệt</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {records.filter((r) => r.status === 'discrepancy').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chênh lệch phí/chiết khấu</div>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <div className="space-y-3">
        {records.map((rec) => (
          <Card
            key={rec.id}
            className={`p-4 border transition-all ${
              rec.status === 'auto_reconciled'
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-900/90 border-amber-500/40 shadow-lg'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-100">{rec.customerName}</span>
                  {rec.status === 'auto_reconciled' ? (
                    <Badge tone="emerald">Đã hạch toán tự động</Badge>
                  ) : (
                    <Badge tone="amber">Cần duyệt chênh lệch</Badge>
                  )}
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                    Độ khớp: {(rec.matchScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Ngân hàng: <strong>{formatMoneyVN(rec.bankAmount)}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    Hóa đơn: <strong>{formatMoneyVN(rec.invoiceAmount)}</strong>
                  </span>
                  {rec.postedVoucherNumber && (
                    <span className="text-emerald-400 font-mono font-semibold">
                      Phiếu KT: {rec.postedVoucherNumber}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 pt-1">{rec.notes}</p>
              </div>

              {/* Action Button for Discrepancy */}
              {rec.status === 'discrepancy' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleApproveDiscrepancy(rec.id)}
                  className="text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Duyệt chênh lệch (CFO/CEO)</span>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AutoReconciliationPanel;
