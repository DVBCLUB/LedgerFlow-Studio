import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { useResizablePanel } from '../../hooks/useResizablePanel';

/* ─── Types ─────────────────────────────────────────────── */
interface BlockerItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'overdue';
  action: string;
}

interface BlockerCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  count: number;
  items: BlockerItem[];
}

/* ─── Mock data (placeholder until real API) ────────────── */
const mockCategories: BlockerCategory[] = [
  {
    key: 'critical',
    label: 'Cấp Bách',
    icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
    count: 1,
    items: [{
      id: 'HD-2026-088', title: 'Hợp đồng B2B SaaS Doanh Nghiệp',
      description: 'Khách hàng Vingroup - Giá trị: 45.000.000₫ - Chờ duyệt điều khoản SLA',
      severity: 'critical', action: 'Duyệt Ngay',
    }],
  },
  {
    key: 'warning',
    label: 'Cần Duyệt',
    icon: <ShieldAlert className="h-4 w-4 text-amber-400" />,
    count: 1,
    items: [{
      id: 'PR-142', title: 'AI SWE-Agent PR #142 (Bảo Mật API Gateway)',
      description: 'Đã vượt qua 100% unit tests - Cần CEO ký xác nhận phát hành lên Production',
      severity: 'warning', action: 'Phê Duyệt',
    }],
  },
  {
    key: 'overdue',
    label: 'Trễ Hạn',
    icon: <Clock className="h-4 w-4 text-orange-400" />,
    count: 1,
    items: [{
      id: 'DEV-089', title: 'AI Dev Task #089 - Tích Hợp Module Thanh Toán',
      description: 'Trễ 2 ngày so với deadline - Blocked bởi chờ API đối tác ngân hàng',
      severity: 'overdue', action: 'Xem Chi Tiết',
    }],
  },
];

const sevBorder: Record<string, string> = {
  critical: 'border-rose-500/30 hover:border-rose-500/50',
  warning: 'border-amber-500/20 hover:border-amber-500/40',
  overdue: 'border-orange-500/20 hover:border-orange-500/40',
};
/* ─── Blockers Dashboard ────────────────────────────────── */
export default function BlockersDashboard() {
  const [expanded, setExpanded] = useState(false);

  // Only show categories with non-zero counts
  const visibleCategories = mockCategories.filter((c) => c.count > 0);
  const totalBlockers = visibleCategories.reduce((sum, c) => sum + c.count, 0);

  const { panelWidth, panelRef, handleRef, isResizing } = useResizablePanel({
    minWidth: 240,
    maxWidth: 640,
    initialWidth: 380,
  });

  if (totalBlockers === 0) {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">🚨 Điểm Nghẽn & Blockers</h2>
            <p className="text-xs text-emerald-400 font-semibold">✅ Không có blockers nào — mọi thứ đang thông suốt</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`relative rounded-3xl border border-rose-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20 p-5 shadow-2xl backdrop-blur-xl transition-all ${
        isResizing ? 'select-none' : ''
      }`}
      style={{ width: panelWidth }}
    >
      {/* Drag handle */}
      <div
        ref={handleRef}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-rose-500/30 active:bg-rose-500/50 rounded-r-3xl transition-colors"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white uppercase">🚨 Điểm Nghẽn & Blockers</h2>
            <p className="text-xs text-slate-400">{totalBlockers} việc cần CEO quyết định hôm nay</p>
          </div>
        </div>
      </div>

      {/* Summary chips — only non-zero categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {visibleCategories.map((cat) => (
          <div
            key={cat.key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold ${
              cat.key === 'critical'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : cat.key === 'warning'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-orange-500/15 border-orange-500/30 text-orange-300'
            }`}
          >
            {cat.icon}
            <span>{cat.label}: {cat.count}</span>
          </div>
        ))}
      </div>

      {/* Toggle detail expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer mb-3"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Chi Tiết Blockers
      </button>

      {/* Expandable detail list */}
      {expanded && (
        <div className="space-y-2 animate-fade-in">
          {visibleCategories.map((cat) =>
            cat.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border bg-slate-950/60 transition-all ${sevBorder[item.severity] || 'border-slate-800'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.severity === 'critical' ? 'bg-rose-400 animate-ping' :
                    item.severity === 'warning' ? 'bg-amber-400' : 'bg-orange-400'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Đã xử lý: ' + item.title)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black cursor-pointer shadow-md shrink-0 ml-2 transition-all"
                >
                  {item.action}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

