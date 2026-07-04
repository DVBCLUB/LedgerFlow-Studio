import React, { useState } from 'react';
import { FolderKanban, ShoppingCart, Users, CheckCircle, XCircle } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left ${className}`}>{children}</div>
);

const BulletList = ({ items, className = 'text-slate-350' }: { items: string[]; className?: string }) => (
  <>{items.map((x) => <p key={x} className={`text-xs font-semibold leading-6 ${className}`}>• {x}</p>)}</>
);

// ─── 1. Project Portfolio Panel ──────────────────────────────────────────────
export function ProjectPortfolioPanel() {
  const [projectType, setProjectType] = useState<'software' | 'construction' | 'trading' | 'service'>('software');
  
  const budgets: Record<typeof projectType, { total: number; actual: number; currency: string }> = {
    software: { total: 150000, actual: 98000, currency: 'USD' },
    construction: { total: 2500000000, actual: 1850000000, currency: 'VND' },
    trading: { total: 500000, actual: 420000, currency: 'USD' },
    service: { total: 80000, actual: 45000, currency: 'USD' },
  };

  const currentBudget = budgets[projectType];
  const burnRate = Math.round((currentBudget.actual / currentBudget.total) * 100);

  const formatCurrency = (val: number, cur: string) => {
    return cur === 'VND' 
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-sky-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-wider">Project Portfolio Management</h2>
        </div>
        <select
          value={projectType}
          onChange={(e) => setProjectType(e.target.value as any)}
          className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-black text-cyan-200"
          aria-label="Chọn loại hình dự án"
        >
          <option value="software">Mẫu: Phát triển Phần mềm (SaaS)</option>
          <option value="construction">Mẫu: Dự án Xây dựng</option>
          <option value="trading">Mẫu: Thương mại / Xuất Nhập Khẩu</option>
          <option value="service">Mẫu: Cung cấp Dịch vụ / Tư vấn</option>
        </select>
      </div>

      {/* Budget Burn rate */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-left">
          <span className="text-[10px] font-black uppercase text-slate-500">Tổng Ngân Sách</span>
          <p className="mt-1 text-lg font-black text-white">{formatCurrency(currentBudget.total, currentBudget.currency)}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-left">
          <span className="text-[10px] font-black uppercase text-slate-500">Đã Giải Ngân (Actual)</span>
          <p className="mt-1 text-lg font-black text-cyan-300">{formatCurrency(currentBudget.actual, currentBudget.currency)}</p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-left">
          <span className="text-[10px] font-black uppercase text-slate-500">Tỷ Lệ Tiêu Hao (Burn Rate)</span>
          <p className="mt-1 text-lg font-black text-rose-400">{burnRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 text-left">
        <div className="flex justify-between text-[11px] font-black text-slate-400">
          <span>Tiến độ ngân sách thực tế</span>
          <span>{burnRate}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-rose-500 transition-all duration-500" 
            style={{ width: `${burnRate}%` }}
          />
        </div>
      </div>

      {/* Cost Packages & Document Checklist */}
      <div className="grid gap-6 md:grid-cols-2 text-left">
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-450">Phân rã chi phí (Cost Packages)</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
              <span>Chi phí nhân sự / Nhà thầu phụ</span>
              <span className="font-bold text-white">45%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
              <span>Nguyên vật liệu / License hạ tầng</span>
              <span className="font-bold text-white">35%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-950/30 border border-slate-850 rounded-xl">
              <span>Chi phí vận hành / Admin</span>
              <span className="font-bold text-white">20%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-455">Checklist Chứng từ Dự án</h3>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2.5 p-2 bg-slate-950/30 border border-slate-850 rounded-xl cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-cyan-550 focus:ring-0" />
              <span className="text-slate-300">Hợp đồng nguyên tắc / Điều khoản dịch vụ</span>
            </label>
            <label className="flex items-center gap-2.5 p-2 bg-slate-950/30 border border-slate-850 rounded-xl cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-cyan-550 focus:ring-0" />
              <span className="text-slate-300">Biên bản bàn giao giai đoạn / Milestone Sign-off</span>
            </label>
            <label className="flex items-center gap-2.5 p-2 bg-slate-950/30 border border-slate-850 rounded-xl cursor-pointer">
              <input type="checkbox" className="rounded border-slate-800 bg-slate-950 text-cyan-550 focus:ring-0" />
              <span className="text-slate-300">Hóa đơn giá trị gia tăng / Chứng từ thanh toán</span>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 2. Procurement & Logistics Panel ────────────────────────────────────────
export function ProcurementLogisticsPanel() {
  const [requests, setRequests] = useState([
    { id: 'PR-101', item: 'Server Infrastructure (AWS Savings)', qty: 1, cost: 2400, status: 'pending' },
    { id: 'PR-102', item: 'Thép Pomina Phi 14 (Dự án)', qty: 25, cost: 18500, status: 'approved' },
    { id: 'PR-103', item: 'Nhiên liệu Dầu DO 0.05S (Xe lu)', qty: 800, cost: 650, status: 'pending' }
  ]);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <ShoppingCart className="h-5 w-5 text-emerald-400" />
        <h2 className="text-sm font-black text-white uppercase tracking-wider">Procurement & Inventory</h2>
      </div>

      {/* Purchase Requests */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Yêu cầu mua sắm vật tư (Purchase Requests)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-semibold text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-2">Mã PR</th>
                <th className="py-2">Mặt hàng / Thiết bị</th>
                <th className="py-2 text-right">Chi phí</th>
                <th className="py-2 text-center">Trạng thái</th>
                <th className="py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-850">
                  <td className="py-3 font-bold text-cyan-200">{req.id}</td>
                  <td className="py-3 text-left">{req.item} <span className="text-[10px] text-slate-500">x{req.qty}</span></td>
                  <td className="py-3 text-right text-emerald-400 font-bold">${req.cost.toLocaleString()}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      req.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' :
                      req.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' :
                      'bg-amber-500/15 text-amber-300'
                    }`}>{req.status}</span>
                  </td>
                  <td className="py-3 text-center">
                    {req.status === 'pending' ? (
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => handleAction(req.id, 'approved')}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition" 
                          title="Duyệt"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'rejected')}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition" 
                          title="Từ chối"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-normal">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Ledger & Fuel Fund */}
      <div className="grid gap-6 md:grid-cols-2 pt-2 text-left">
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Sổ kho (Warehouse Ledger)</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between">
              <div>
                <strong className="text-white block">Thép cuộn Pomina</strong>
                <span className="text-[10px] text-slate-500">Tồn kho khả dụng</span>
              </div>
              <span className="text-sm font-black text-cyan-300">120 Tấn</span>
            </div>
            <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between">
              <div>
                <strong className="text-white block">Thiết bị Router Cisco</strong>
                <span className="text-[10px] text-slate-500">Tồn kho dự phòng</span>
              </div>
              <span className="text-sm font-black text-cyan-300">12 Bộ</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Quỹ Nhiên Liệu (Fuel Fund)</h3>
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase text-cyan-300 border border-cyan-500/25">Construction template</span>
          </div>
          <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold">Dung lượng quỹ dầu dự trữ:</span>
              <span className="font-black text-white">45,000 Lít</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold">Đã phân phối các công trường:</span>
              <span className="font-black text-cyan-300">28,500 Lít</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: '63%' }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 3. HR & Admin Panel ─────────────────────────────────────────────────────
export function HRAdminPanel() {
  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <Users className="h-5 w-5 text-rose-400" />
        <h2 className="text-sm font-black text-white uppercase tracking-wider">HR & Administrative Center</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 text-left">
        {/* Expenses & Advances */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Tạm ứng & Chi phí Hành chính</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-white block">Tạm ứng công tác phí (Đoàn HN)</strong>
                <span className="text-[10px] text-slate-500">Người nhận: Nguyễn Văn A</span>
              </div>
              <span className="font-black text-amber-300">$1,500</span>
            </div>
            <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-white block">Chi phí Văn phòng phẩm Q2</strong>
                <span className="text-[10px] text-slate-500">Mã chi: EXP-Admin</span>
              </div>
              <span className="font-black text-emerald-400">$640</span>
            </div>
          </div>
        </div>

        {/* Outsourced Labor & Payroll checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 text-left">Nhân công thuê ngoài (Outsourced Labor)</h3>
          <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Số lượng tổ đội thuê ngoài:</span>
              <span className="font-black text-white">4 Tổ đội (45 nhân sự)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Chi phí nhân công lũy kế:</span>
              <span className="font-black text-rose-450">$18,400</span>
            </div>
            <div className="border-t border-slate-850 pt-2 flex items-center justify-between text-[11px] font-black text-slate-500">
              <span>Bảng lương tháng gần nhất:</span>
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Đã chốt sổ</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
