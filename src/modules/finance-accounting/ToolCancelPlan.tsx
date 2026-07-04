import React, { useMemo, useState } from 'react';

type ToolCost = {
  id: string;
  month: string;
  tool: string;
  category: 'AI' | 'Hosting' | 'Design' | 'Marketing' | 'Dev' | 'Other';
  amount: number;
  purpose: string;
  keepDecision: 'Keep' | 'Review' | 'Cancel';
};

const storageKey = 'ledgerflow-tool-budget-ledger-v1';

const readCosts = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as ToolCost[]) : [];
  } catch {
    return [];
  }
};

const money = (value: number) => value.toLocaleString('vi-VN') + ' đ';

const nextCancelDate = (decision: ToolCost['keepDecision']) => {
  const date = new Date();
  date.setDate(date.getDate() + (decision === 'Cancel' ? 3 : 14));
  return date.toISOString().slice(0, 10);
};

const cancelChecklist = (item: ToolCost) => [
  `Xuất dữ liệu/tài liệu đang nằm trong ${item.tool}.`,
  'Chụp màn hình cấu hình quan trọng, hóa đơn, API key hoặc billing page nếu cần đối chiếu.',
  'Tìm tool thay thế miễn phí/rẻ hơn hoặc gom chức năng vào tool đang dùng.',
  `Ghi lý do ${item.keepDecision === 'Cancel' ? 'hủy' : 'review'}: ${item.purpose || 'chưa có mục đích rõ ràng'}.`,
  'Sau khi hủy, cập nhật Tool Budget Ledger để Finance Lab tính burn mới.'
];

export default function ToolCancelPlan() {
  const [costs, setCosts] = useState<ToolCost[]>(readCosts);

  const riskyTools = useMemo(
    () => costs.filter((item) => item.keepDecision === 'Cancel' || item.keepDecision === 'Review').sort((a, b) => b.amount - a.amount),
    [costs]
  );

  const stats = useMemo(() => {
    const cancelSave = costs.filter((item) => item.keepDecision === 'Cancel').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const reviewSpend = costs.filter((item) => item.keepDecision === 'Review').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalRisk = cancelSave + reviewSpend;
    return { cancelSave, reviewSpend, totalRisk, count: riskyTools.length };
  }, [costs, riskyTools.length]);

  const refresh = () => setCosts(readCosts());

  return (
    <section className="space-y-4 text-text-primary">
      <div className="rounded-3xl border border-border-primary bg-bg-primary p-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-error">Tool Cancel Plan</p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">Kế hoạch hủy tool và giảm burn</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-secondary">
          Đọc dữ liệu từ Tool Budget Ledger, ưu tiên các tool đang Review/Cancel, gợi ý ngày xử lý và checklist trước khi hủy để không mất dữ liệu.
        </p>
        <button onClick={refresh} className="mt-4 rounded-xl border border-border-secondary px-4 py-2 text-xs font-bold text-text-secondary hover:border-rose-400 hover:text-text-primary">Refresh từ Tool Budget</button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Risk tools</p><p className="mt-2 text-lg font-bold text-text-primary">{stats.count}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Cancel save</p><p className="mt-2 text-lg font-bold text-error">{money(stats.cancelSave)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Review spend</p><p className="mt-2 text-lg font-bold text-warning">{money(stats.reviewSpend)}</p></div>
        <div className="rounded-2xl border border-border-primary bg-bg-surface p-4"><p className="text-[10px] font-bold uppercase text-text-muted">Total risk</p><p className="mt-2 text-lg font-bold text-info">{money(stats.totalRisk)}</p></div>
      </div>

      {riskyTools.length === 0 ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <p className="text-sm font-bold text-emerald-100">Không có tool nào cần hủy hoặc review.</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-emerald-100/80">Tool Budget đang sạch. Nếu phát sinh chi phí mới, đánh dấu Review trước rồi quay lại đây lập kế hoạch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {riskyTools.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border-primary bg-bg-surface p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text-primary">{item.tool}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.keepDecision === 'Cancel' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>{item.keepDecision}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-text-secondary">{item.month} • {item.category} • {money(item.amount)} / tháng</p>
                  <p className="mt-2 text-xs font-semibold leading-6 text-text-secondary">{item.purpose}</p>
                </div>
                <div className="rounded-xl border border-border-primary bg-bg-primary p-3 text-right">
                  <p className="text-[10px] font-bold uppercase text-text-muted">Ngày xử lý đề xuất</p>
                  <p className="mt-1 text-sm font-bold text-text-primary">{nextCancelDate(item.keepDecision)}</p>
                  <p className="mt-1 text-[10px] font-semibold text-text-muted">Tiết kiệm tiềm năng: {money(item.amount)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border-primary bg-bg-primary p-3">
                <p className="text-[10px] font-bold uppercase text-info">Checklist trước khi hủy/review</p>
                <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-text-secondary">
                  {cancelChecklist(item).map((line) => <li key={line}>• {line}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
